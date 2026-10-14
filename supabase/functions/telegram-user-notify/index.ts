const token=Deno.env.get("TELEGRAM_NOTIFICATIONS_BOT_TOKEN")||"";
const API="https://api.telegram.org/bot"+token;
const raw=Deno.env.get("SUPABASE_SECRET_KEYS");
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||(raw?JSON.parse(raw).default:"");
const base=Deno.env.get("SUPABASE_URL")||"";
function isServiceRoleJwt(req:Request){const a=req.headers.get("authorization")||"";if(!a.startsWith("Bearer "))return false;const p=a.slice(7).trim().split(".");if(p.length!==3)return false;try{const x=JSON.parse(atob(p[1].replace(/-/g,"+").replace(/_/g,"/")));return x?.role==="service_role"}catch{return false}}
async function tg(m:string,b:Record<string,unknown>){const r=await fetch(API+"/"+m,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)});const j=await r.json().catch(()=>({ok:false}));if(!r.ok||!j?.ok)throw new Error(String(j?.description||"TELEGRAM_API_ERROR"));return j}
async function rpc(name:string,args:Record<string,unknown>){const r=await fetch(base+"/rest/v1/rpc/"+name,{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"content-type":"application/json"},body:JSON.stringify(args)});if(!r.ok)throw new Error(await r.text());return await r.json().catch(()=>null)}
function compactId(id:string){const s=String(id||"");return s.length>16?s.slice(0,8)+"…"+s.slice(-4):s}
function fmtDate(v:string){const d=new Date(v);if(Number.isNaN(d.getTime()))return {date:"—",time:"—"};const o={timeZone:"Africa/Algiers",day:"2-digit",month:"2-digit",year:"numeric"} as const;const t={timeZone:"Africa/Algiers",hour:"2-digit",minute:"2-digit",hour12:false} as const;return {date:new Intl.DateTimeFormat("ar-DZ",o).format(d),time:new Intl.DateTimeFormat("ar-DZ",t).format(d)}}
Deno.serve(async req=>{
  if(req.method!=="POST")return Response.json({ok:false,error:"METHOD_NOT_ALLOWED"},{status:405});
  if(!isServiceRoleJwt(req))return Response.json({ok:false,error:"UNAUTHORIZED"},{status:401});
  let eventKey="";
  try{
    const p=await req.json(),r=p?.record||{};
    // This function belongs exclusively to the FENK Notifications bot for new-user events.
    // Refuse order/marketplace/support payloads so a misrouted webhook can never leak an
    // order into the Notifications bot. The normal profile trigger sends public.profiles;
    // auth hooks may send auth.users. Direct legacy calls without table metadata remain
    // supported for backward compatibility.
    const schema=String(p?.schema||"");
    const table=String(p?.table||"");
    if(table && !((schema==="public" && table==="profiles") || (schema==="auth" && table==="users"))){
      return Response.json({ok:true,skipped:true,reason:"NOT_A_USER_EVENT"});
    }
    const userId=String(r.id||"");
    if(!userId)return Response.json({ok:true,skipped:true});
    eventKey="user_registered:"+userId;
    const claimed=await rpc("claim_telegram_event",{p_event_key:eventKey,p_ttl_seconds:600});
    if(claimed!==true)return Response.json({ok:true,duplicate:true});
    const name=String(r.full_name||[r.first_name,r.last_name].filter(Boolean).join(" ")||"مستخدم جديد");
    const phone=String(r.phone||"غير متوفر");
    const dt=fmtDate(String(r.created_at||new Date().toISOString()));
    const message=["🆕 تسجيل مستخدم جديد في FENK","","👤 الاسم: "+name,"📱 الهاتف: "+phone,"🆔 User ID: "+compactId(userId),"📅 التاريخ: "+dt.date,"🕐 الوقت: "+dt.time].join("\n");
    const admin=String(Deno.env.get("TELEGRAM_ADMIN_CHAT_ID")||"8617207330");
    await tg("sendMessage",{chat_id:admin,text:message});
    await rpc("mark_telegram_event_sent",{p_event_key:eventKey});
    return Response.json({ok:true});
  }catch(e){
    if(eventKey){try{await rpc("mark_telegram_event_failed",{p_event_key:eventKey})}catch{}}
    console.error(e);return Response.json({ok:false,error:e instanceof Error?e.message:"SERVER_ERROR"},{status:500});
  }
});
