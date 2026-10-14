const token=Deno.env.get("TELEGRAM_BOT_TOKEN")||"";
const adminChat=String(Deno.env.get("TELEGRAM_ADMIN_CHAT_ID")||"");
const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const anonKey=Deno.env.get("SUPABASE_ANON_KEY")||"";

async function isAdmin(accessToken:string){
  const r=await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`,{method:"POST",headers:{apikey:anonKey||serviceKey,Authorization:`Bearer ${accessToken}`,"content-type":"application/json"},body:"{}"});
  return r.ok && (await r.json().catch(()=>false))===true;
}
Deno.serve(async req=>{
  if(req.method!=="POST") return Response.json({ok:false,error:"METHOD_NOT_ALLOWED"},{status:405});
  const m=(req.headers.get("authorization")||"").match(/^Bearer\s+(.+)$/i);
  if(!m?.[1] || !(await isAdmin(m[1]))) return Response.json({ok:false,error:"FORBIDDEN"},{status:403});
  if(!token||!adminChat) return Response.json({ok:false,error:"Telegram secrets are not configured."},{status:500});
  const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:adminChat,text:"✅ FENK Telegram متصل ويعمل بشكل صحيح."})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok||j?.ok===false) return Response.json({ok:false,error:String(j?.description||"Telegram request failed")},{status:502});
  return Response.json({ok:true});
});
