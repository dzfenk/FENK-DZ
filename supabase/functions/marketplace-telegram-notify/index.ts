import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_TOKEN=Deno.env.get("TELEGRAM_NOTIFICATIONS_BOT_TOKEN") || "";
const ADMIN_CHAT_ID=Deno.env.get("TELEGRAM_ADMIN_CHAT_ID") || "8617207330";
const adminDb=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false}});

const money=(v:unknown)=>v===null||v===undefined||v===""?"—":Number(v).toLocaleString("ar-DZ")+" دج";
const compactId=(id:unknown)=>{const s=String(id||"");return s.length>16?s.slice(0,8)+"…"+s.slice(-4):s||"—"};
const fmtDate=(v:unknown)=>{const d=new Date(String(v||""));if(Number.isNaN(d.getTime()))return {date:"—",time:"—"};return {date:new Intl.DateTimeFormat("ar-DZ",{timeZone:"Africa/Algiers",day:"2-digit",month:"2-digit",year:"numeric"}).format(d),time:new Intl.DateTimeFormat("ar-DZ",{timeZone:"Africa/Algiers",hour:"2-digit",minute:"2-digit",hour12:false}).format(d)}};
const label=(e:string)=>({new_ad:"🆕 إعلان جديد",proof_uploaded:"📸 إثبات دفع جديد",approved:"✅ قبول الإعلان",rejected:"❌ رفض الإعلان",updated:"✏️ تعديل الإعلان",deleted:"🗑️ حذف الإعلان",hidden:"🔒 إخفاء الإعلان",new_product:"🛍️ منتج جديد"}[e]||e);

async function telegram(text:string,url?:string){
  if(!TELEGRAM_TOKEN)throw new Error("TELEGRAM_NOTIFICATIONS_BOT_TOKEN is missing");
  const body:any={chat_id:ADMIN_CHAT_ID,text};
  if(url)body.reply_markup={inline_keyboard:[[{text:"🔗 فتح",url}]]};
  const r=await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.description||"Telegram sendMessage failed");
}
async function rpc(name:string,args:Record<string,unknown>){
  const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/"+name,{method:"POST",headers:{apikey:SERVICE_KEY,Authorization:"Bearer "+SERVICE_KEY,"content-type":"application/json"},body:JSON.stringify(args)});
  if(!r.ok)throw new Error(await r.text());return await r.json().catch(()=>null);
}

Deno.serve(async(req)=>{
  let eventKey="";
  try{
    if(req.method!=="POST")return Response.json({ok:false,error:"POST required"},{status:405});
    const auth=req.headers.get("authorization")||"";
    const token=auth.replace(/^Bearer\s+/i,"").trim();
    if(!token)return Response.json({ok:false,error:"Unauthorized"},{status:401});
    const {data:{user},error:ue}=await adminDb.auth.getUser(token);
    if(ue||!user)return Response.json({ok:false,error:"Unauthorized"},{status:401});

    const body=await req.json();
    const event=String(body.event||"");
    const adId=String(body.ad_id||"");
    const productId=String(body.product_id||"");
    if(!event||(!adId&&!productId))return Response.json({ok:false,error:"event and ad_id/product_id are required"},{status:400});

    if(productId){
      if(event!=="new_product")return Response.json({ok:false,error:"Unsupported product event"},{status:400});
      const {data:adminRow}=await adminDb.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
      if(!adminRow)return Response.json({ok:false,error:"Forbidden"},{status:403});
      const {data:p,error}=await adminDb.from("fenk_products").select("id,title,price_dzd,stock_quantity,source_platform,catalog_section,created_at").eq("id",productId).maybeSingle();
      if(error||!p)return Response.json({ok:false,error:"Product not found"},{status:404});
      eventKey="product:new:"+productId;
      const claimed=await rpc("claim_telegram_event",{p_event_key:eventKey,p_ttl_seconds:600});
      if(claimed!==true)return Response.json({ok:true,duplicate:true});
      const dt=fmtDate(p.created_at);
      const text=["🔔 إشعار جديد في FENK","","🛍️ المنتج: "+String(p.title||"—"),"🆔 Product ID: "+compactId(p.id),"💰 السعر: "+money(p.price_dzd),"📦 المخزون: "+String(p.stock_quantity??0),"🌐 المصدر: "+String(p.source_platform||"—"),"📅 التاريخ: "+dt.date,"🕐 الوقت: "+dt.time,"","━━━━━━━━━━━━━━","FENK DZ 🇩🇿"].join("\n");
      await telegram(text,`${SUPABASE_URL.replace(/\/$/,"")}/product.html?id=${encodeURIComponent(productId)}`);
      await rpc("mark_telegram_event_sent",{p_event_key:eventKey});
      return Response.json({ok:true});
    }

    const {data:adminRow}=await adminDb.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
    const {data:ad}=await adminDb.from("marketplace_ads").select("id,ad_code,user_id,title,price_dzd,details,wilaya,commune,municipality,status,payment_status,created_at").eq("id",adId).maybeSingle();
    const snap=body.snapshot||{};
    const ownerId=String(ad?.user_id||snap.user_id||"");
    if(!adminRow&&ownerId!==user.id)return Response.json({ok:false,error:"Forbidden"},{status:403});
    const a=ad||snap,d=a.details||{},part=d.part_name||a.title||"—",code=a.ad_code||(adId?"FENK-"+adId.replaceAll("-","").slice(0,6).toUpperCase():"—");
    eventKey="marketplace:"+event+":"+adId;
    const claimed=await rpc("claim_telegram_event",{p_event_key:eventKey,p_ttl_seconds:600});
    if(claimed!==true)return Response.json({ok:true,duplicate:true});
    const dt=fmtDate(a.created_at||new Date().toISOString());
    const text=["🔔 إشعار جديد في FENK","","📌 الحدث: "+label(event),"📢 القسم: "+(d.type==="spare_parts"?"قطع غيار السيارات":(d.type||"—")),"🔧 الإعلان: "+String(part),"💰 السعر: "+money(a.price_dzd),"📍 الولاية: "+String(a.wilaya||"—"),"🏘️ البلدية: "+String(a.commune||a.municipality||"—"),"👤 المستخدم: "+compactId(a.user_id),"🆔 رقم الإعلان: "+String(code),"💳 الدفع: "+String(a.payment_status||"—"),"📌 الحالة: "+String(a.status||"—"),"📅 التاريخ: "+dt.date,"🕐 الوقت: "+dt.time,"","━━━━━━━━━━━━━━","FENK DZ 🇩🇿"].join("\n");
    await telegram(text,`${SUPABASE_URL.replace(/\/$/,"")}/marketplace-ad.html?id=${encodeURIComponent(adId)}`);
    await rpc("mark_telegram_event_sent",{p_event_key:eventKey});
    return Response.json({ok:true});
  }catch(e){
    if(eventKey){try{await rpc("mark_telegram_event_failed",{p_event_key:eventKey})}catch{}}
    console.error(e);return Response.json({ok:false,error:String(e)},{status:500});
  }
});
