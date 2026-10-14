const token=Deno.env.get("TELEGRAM_ORDERS_BOT_TOKEN")||Deno.env.get("TELEGRAM_BOT_TOKEN")||"";
const API="https://api.telegram.org/bot"+token;
const base=Deno.env.get("SUPABASE_URL")||"";
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const chat=String(Deno.env.get("TELEGRAM_ADMIN_CHAT_ID")||"8617207330");
const LABEL:Record<string,string>={received:"تم استلام الطلب",pricing:"تم تحديد السعر",awaiting_payment:"بانتظار الدفع",payment_submitted:"تم إرسال وصل الدفع",payment_confirmed:"تم تأكيد الدفع",paid:"تم تأكيد الدفع",purchasing:"جارٍ شراء المنتج",shipped:"تم شحن المنتج",arrived_algeria:"وصل إلى الجزائر",out_for_delivery:"خرج للتوصيل",delivered:"تم التسليم",processing:"قيد المعالجة",rejected:"تم رفض الطلب",cancelled:"تم إلغاء الطلب"};
async function tg(m:string,b:Record<string,unknown>){const r=await fetch(API+"/"+m,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)});const j=await r.json().catch(()=>({ok:false}));if(!r.ok||!j?.ok)throw new Error(String(j?.description||"TELEGRAM_API_ERROR"));return j}
async function rpc(name:string,args:Record<string,unknown>){const r=await fetch(base+"/rest/v1/rpc/"+name,{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"content-type":"application/json"},body:JSON.stringify(args)});if(!r.ok)throw new Error(await r.text());return await r.json().catch(()=>null)}
function money(v:unknown){const n=Number(v);return Number.isFinite(n)?n.toLocaleString("ar-DZ")+" دج":"—"}
function orderKey(o:any){return String(o.order_number||o.order_code||o.id||"غير معروف")}
function fmtDate(v:string){const d=new Date(v);if(Number.isNaN(d.getTime()))return {date:"—",time:"—"};return {date:new Intl.DateTimeFormat("ar-DZ",{timeZone:"Africa/Algiers",day:"2-digit",month:"2-digit",year:"numeric"}).format(d),time:new Intl.DateTimeFormat("ar-DZ",{timeZone:"Africa/Algiers",hour:"2-digit",minute:"2-digit",hour12:false}).format(d)}}
function keyboard(o:any){const k=orderKey(o);return {inline_keyboard:[
[{text:"📥 استلام",callback_data:"status:received:"+k},{text:"💰 تحديد السعر",callback_data:"status:pricing:"+k}],
[{text:"💳 بانتظار الدفع",callback_data:"status:awaiting_payment:"+k},{text:"🧾 وصل الدفع",callback_data:"status:payment_submitted:"+k}],
[{text:"✅ تأكيد الدفع",callback_data:"status:payment_confirmed:"+k},{text:"🛒 شراء المنتج",callback_data:"status:purchasing:"+k}],
[{text:"📦 تم الشحن",callback_data:"status:shipped:"+k},{text:"🇩🇿 وصل للجزائر",callback_data:"status:arrived_algeria:"+k}],
[{text:"🚚 خرج للتوصيل",callback_data:"status:out_for_delivery:"+k},{text:"🏁 تم التسليم",callback_data:"status:delivered:"+k}],
[{text:"🔢 رمز التتبع",callback_data:"track:"+k},{text:"🚚 شركة الشحن",callback_data:"carrier:"+k}],
[{text:"💬 رسالة للزبون",callback_data:"message:"+k}],
[{text:"❌ رفض الطلب",callback_data:"status:rejected:"+k},{text:"🚫 إلغاء الطلب",callback_data:"status:cancelled:"+k}]
]}}
function text(o:any,updated:boolean,oldStatus:string){const s=String(o.status||"received");const lines=[
updated?"🔄 تحديث طلب في FENK":"🔔 طلب جديد في FENK","",
"🆔 الطلب: #"+orderKey(o),
"🛍️ المنتج: "+String(o.product_name||"غير محدد"),
"👤 الزبون: "+String(o.customer_name||"غير محدد"),
"📱 الهاتف: "+String(o.customer_phone||"غير محدد"),
"📍 الولاية: "+String(o.wilaya||"—"),
"🏘️ البلدية: "+String(o.commune||"—"),
"💰 الإجمالي: "+money(o.total_price??o.amount_dzd??o.product_price),
"💳 الدفع: "+String(o.payment_method==="barid_mob"?"بريد موب":(o.payment_method||"—")),
"📌 الحالة: "+String(LABEL[s]||s),"📅 التاريخ: "+fmtDate(String(o.updated_at||o.created_at||new Date().toISOString())).date,"🕐 الوقت: "+fmtDate(String(o.updated_at||o.created_at||new Date().toISOString())).time];
if(updated&&oldStatus&&oldStatus!==s)lines.push("↪️ السابقة: "+String(LABEL[oldStatus]||oldStatus));
if(o.tracking_number)lines.push("🔎 التتبع: "+o.tracking_number);
if(o.carrier_name)lines.push("🚚 الشحن: "+o.carrier_name);
return lines.join("\n")}
Deno.serve(async req=>{
 if(req.method!=="POST")return Response.json({ok:false,error:"METHOD_NOT_ALLOWED"},{status:405});
 let eventKey="";
 try{
  const p=await req.json();
  if(p?.schema!=="public"||p?.table!=="orders"||!["INSERT","UPDATE"].includes(String(p?.type)))return Response.json({ok:true,ignored:true});
  const o=p.record||{},old=p.old_record||{},type=String(p.type),statusChanged=type==="UPDATE"&&String(old.status||"")!==String(o.status||"");
  if(type==="UPDATE"&&!statusChanged)return Response.json({ok:true,ignored:true});
  eventKey="order:"+String(o.id||o.order_number||o.order_code)+":"+String(o.status||"");
  const claimed=await rpc("claim_telegram_event",{p_event_key:eventKey,p_ttl_seconds:600});
  if(claimed!==true)return Response.json({ok:true,duplicate:true});
  await tg("sendMessage",{chat_id:chat,text:text(o,type==="UPDATE",String(old.status||"")),reply_markup:keyboard(o)});
  await rpc("mark_telegram_event_sent",{p_event_key:eventKey});
  return Response.json({ok:true});
 }catch(e){
  if(eventKey){try{await rpc("mark_telegram_event_failed",{p_event_key:eventKey})}catch{}}
  console.error(e);return Response.json({ok:false,error:e instanceof Error?e.message:"SERVER_ERROR"},{status:500});
 }
});
