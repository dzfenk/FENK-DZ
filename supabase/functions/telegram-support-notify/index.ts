const token = Deno.env.get("TELEGRAM_SUPPORT_BOT_TOKEN") || "";
const API = "https://api.telegram.org/bot" + token;
const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || (raw ? JSON.parse(raw).default : "");
const base = Deno.env.get("SUPABASE_URL") || "";
const admin = String(Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") || "8617207330");

function isServiceRoleJwt(req:Request){
  const a=req.headers.get("authorization")||"";
  if(!a.startsWith("Bearer "))return false;
  const p=a.slice(7).trim().split(".");
  if(p.length!==3)return false;
  try{const x=JSON.parse(atob(p[1].replace(/-/g,"+").replace(/_/g,"/")));return x?.role==="service_role"}catch{return false}
}
async function tg(method:string,body:Record<string,unknown>){
  const r=await fetch(API+"/"+method,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({ok:false}));
  if(!r.ok||!j?.ok)throw new Error(String(j?.description||"TELEGRAM_API_ERROR"));
  return j;
}
async function rpc(name:string,args:Record<string,unknown>){
  const r=await fetch(base+"/rest/v1/rpc/"+name,{method:"POST",headers:{apikey:serviceKey,Authorization:"Bearer "+serviceKey,"content-type":"application/json"},body:JSON.stringify(args)});
  if(!r.ok)throw new Error(await r.text());
  return await r.json().catch(()=>null);
}
async function rest(path:string){
  const r=await fetch(base+"/rest/v1/"+path,{headers:{apikey:serviceKey,Authorization:"Bearer "+serviceKey}});
  const j=await r.json().catch(()=>null);
  if(!r.ok)throw new Error(JSON.stringify(j));
  return j;
}
function formatId(id:string){const s=String(id||"");return s.length>16?s.slice(0,8)+"…"+s.slice(-4):s}
Deno.serve(async req=>{
  if(req.method!=="POST")return Response.json({ok:false,error:"METHOD_NOT_ALLOWED"},{status:405});
  if(!isServiceRoleJwt(req))return Response.json({ok:false,error:"UNAUTHORIZED"},{status:401});
  let eventKey="";
  try{
    const p=await req.json(),r=p?.record;
    if(!r||r.sender_role!=="customer"||!r.user_id||!r.message)return Response.json({ok:true,skipped:true});
    eventKey="support:"+String(r.id||`${r.user_id}:${r.created_at}:${r.message}`);
    const claimed=await rpc("claim_telegram_event",{p_event_key:eventKey,p_ttl_seconds:600});
    if(claimed!==true)return Response.json({ok:true,duplicate:true});
    const profiles=await rest("profiles?select=first_name,last_name,phone&id=eq."+encodeURIComponent(r.user_id)+"&limit=1");
    const profile=Array.isArray(profiles)&&profiles[0]?profiles[0]:{};
    const name=String([profile.first_name,profile.last_name].filter(Boolean).join(" ")||"عميل");
    const phone=String(profile.phone||"غير متوفر");
    const text=["💬 رسالة جديدة من عميل FENK","","👤 العميل: "+name,"📱 الهاتف: "+phone,"🆔 Customer ID: "+formatId(String(r.user_id)),"","💬 الرسالة:",String(r.message)].join("\n");
    await tg("sendMessage",{chat_id:admin,text,reply_markup:{inline_keyboard:[[{text:"✍️ رد على العميل",callback_data:"reply:"+String(r.user_id)}]]}});
    await rpc("mark_telegram_event_sent",{p_event_key:eventKey});
    return Response.json({ok:true});
  }catch(e){
    if(eventKey){try{await rpc("mark_telegram_event_failed",{p_event_key:eventKey})}catch{}}
    console.error(e);
    return Response.json({ok:false,error:e instanceof Error?e.message:"SERVER_ERROR"},{status:500});
  }
});
