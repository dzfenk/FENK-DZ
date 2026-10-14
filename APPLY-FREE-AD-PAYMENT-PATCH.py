from pathlib import Path

ROOT = Path('.')

# marketplace-publish.html
p = ROOT / 'marketplace-publish.html'
s = p.read_text(encoding='utf-8')
s = s.replace(
    '<section class="card" id="step-5">',
    '<div class="card" id="freePostingBanner" style="display:none;background:#eefbf5;border-color:#bfe8d5;color:#075d47"><div class="section-title"><h2>🎉 نشر إعلانك مجاني حاليًا</h2></div><div class="hint" style="font-size:11px;color:#075d47">لا توجد رسوم لنشر الإعلان. بعد إكمال بيانات إعلانك وإرسال الصور، يمكنك إرساله مباشرة للمراجعة.</div></div><section class="card" id="step-5">',
    1,
)
s = s.replace("let session=null,draftId=null,selectedImages=[],packages=[];", "let session=null,draftId=null,selectedImages=[],packages=[],paymentRequired=false;")
old = "async function loadPayment(){const {data:p,error}=await db.from('payment_settings').select('display_name,account_number,phone_number,instructions,is_active').eq('method','barid_mob').maybeSingle();"
new = """async function loadPaymentMode(){
 const {data,error}=await db.from('site_settings').select('ad_posting_payment_enabled').eq('id',true).maybeSingle();
 paymentRequired=error?true:data?.ad_posting_payment_enabled===true;
 const step=$('step-5'),banner=$('freePostingBanner');
 if(step)step.style.display=paymentRequired?'block':'none';
 if(banner)banner.style.display=paymentRequired?'none':'block';
 const labels=['النوع','التفاصيل','الصور','التواصل',paymentRequired?'الدفع':'مجاني','المراجعة'];
 $('progress').innerHTML=labels.map((x,i)=>`<button type="button" class="step" data-step="${i+1}">${i+1} ${x}</button>`).join('');
 $('progress').querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>document.getElementById('step-'+b.dataset.step)?.scrollIntoView({behavior:'smooth',block:'start'}));
}
async function getPaymentRequired(){
 const {data,error}=await db.from('site_settings').select('ad_posting_payment_enabled').eq('id',true).maybeSingle();
 if(error)throw error;
 return data?.ad_posting_payment_enabled===true;
}
async function loadPayment(){const {data:p,error}=await db.from('payment_settings').select('display_name,account_number,phone_number,instructions,is_active').eq('method','barid_mob').maybeSingle();"""
if old not in s: raise SystemExit('loadPayment marker not found')
s = s.replace(old, new, 1)
start=s.index('async function saveRecord(asDraft){')
end=s.index('\nasync function uploadSelectedImages()', start)
new_save='''async function saveRecord(asDraft){
 if(!session)throw new Error('سجّل الدخول أولًا.');
 const t=$('type').value,c=configs[t]||configs.other,details=getDetails();
 const required=[];
 if(t==='spare_parts'){for(const k of ['part_name','part_category','condition','wilaya','municipality'])if(!details[k])required.push(k);if(details.price===undefined||details.price===null||details.price==='')required.push('price');if(required.length)throw new Error('أكمل الحقول الإلزامية ⭐: اسم القطعة، القسم، الحالة، السعر، الولاية والبلدية.');if(!selectedImages.length&&!asDraft)throw new Error('أضف صورة واحدة على الأقل لقطعة الغيار.');}
 const price=details.price?parsePrice(details.price):null;if(details.price && price===null)throw new Error('السعر يجب أن يكون رقمًا موجبًا أو صفرًا، بدون نصوص أو رموز.');
 const phoneLocal=$('phone').value.trim().replace(/\\s+/g,'');if(phoneLocal && !/^(05|06|07)\\d{8}$/.test(phoneLocal))throw new Error('رقم الهاتف يجب أن يكون 05XXXXXXXX أو 06XXXXXXXX أو 07XXXXXXXX.');
 const phone=phoneLocal?'+213'+phoneLocal:null;const contactUrl=$('contactUrl').value.trim();if(contactUrl){try{const u=new URL(contactUrl);if(!/^https?:$/.test(u.protocol))throw 0}catch{throw new Error('رابط التواصل غير صالح. استخدم رابطًا يبدأ بـ https:// أو http://.')}}
 const {data:cat,error:ce}=await db.from('marketplace_categories').select('id').eq('slug',c.slug).eq('is_active',true).maybeSingle();if(ce||!cat)throw ce||new Error('قسم الإعلان غير موجود.');
 paymentRequired=await getPaymentRequired();
 const pack=packages.find(x=>Number(x.duration_days)===30)||packages[0]||null;
 const proof=$('proof').files?.[0];
 if(!asDraft && paymentRequired){
   if(!pack)throw new Error('رسوم النشر غير متاحة حاليًا.');
   const {data:pay}=await db.from('payment_settings').select('is_active').eq('method','barid_mob').maybeSingle();
   if(!pay||pay.is_active===false)throw new Error('الدفع عبر بريد موب غير مفعّل حاليًا من Admin.');
   if(!proof)throw new Error('📸 إثبات الدفع مطلوب لإرسال الإعلان للمراجعة.');
 }
 details.image_urls=selectedImages.map(x=>x.url||null).filter(Boolean);const title=updateTitle();let proofPath=null;const uid=session.user.id,stamp=Date.now(),safe=n=>n.replace(/[^a-zA-Z0-9._-]/g,'_');
 if(proof&&!asDraft&&paymentRequired){const pr=await db.storage.from('marketplace-payment-proofs').upload(`${uid}/${stamp}-proof-${safe(proof.name)}`,proof,{contentType:proof.type,upsert:false});if(pr.error)throw pr.error;proofPath=pr.path}
 const status=asDraft?'draft':(paymentRequired?'payment_review':'pending_review');
 const payload={category_id:cat.id,package_id:pack?.id||null,title:title||'إعلان FENK',description:$('description').value.trim()||null,price_dzd:price,contact:contactUrl||phone||null,image_url:selectedImages[0]?.url||null,image_urls:selectedImages.map(x=>x.url).filter(Boolean),payment_proof_path:proofPath||null,payment_method:paymentRequired?'barid_mob':null,ad_fee_dzd:paymentRequired?Number(pack?.fee_dzd||0):0,payment_status:asDraft?'unpaid':(paymentRequired?'proof_uploaded':'not_required'),approval_status:asDraft?'draft':'pending',status,is_draft:asDraft,details,phone,wilaya:details.wilaya||null,wilaya_code:details.wilaya_code||null,municipality:details.municipality||null,commune:details.municipality||null,admin_note:null,rejection_reason:null};
 let result,isNew=false;if(draftId){const clean={...payload};delete clean.user_id;result=await db.from('marketplace_ads').update(clean).eq('id',draftId).select('id,ad_code').single()}else{result=await db.from('marketplace_ads').insert({...payload,user_id:uid}).select('id,ad_code').single();isNew=true}
 if(result.error)throw result.error;draftId=result.data.id;$('adForm').dataset.adCode=result.data.ad_code||'';
 if(!asDraft){await notifyTelegram(isNew?'new_ad':'updated',draftId,{...payload,user_id:uid,ad_code:result.data.ad_code});if(proofPath)await notifyTelegram('proof_uploaded',draftId,{...payload,user_id:uid,ad_code:result.data.ad_code});}
 return result.data;
}'''
s=s[:start]+new_save+s[end:]
old_submit = "$('adForm').onsubmit=async e=>{e.preventDefault();const b=$('submitBtn');b.disabled=true;$('msg').textContent='';try{if(!session)throw new Error('سجّل الدخول أولًا.');const t=$('type').value,d=getDetails();if(t==='spare_parts'){if(!d.part_name||!d.part_category||!d.condition||d.price===undefined||d.price===null||d.price===''||!d.wilaya||!d.municipality)throw new Error('أكمل جميع الحقول الإلزامية ⭐ لقطعة الغيار.');if(!selectedImages.length)throw new Error('أضف صورة واحدة على الأقل.');}const proof=$('proof').files?.[0];if(!proof)throw new Error('📸 إثبات الدفع مطلوب لإرسال الإعلان للمراجعة.');if(!packages.length)throw new Error('رسوم النشر غير متاحة حاليًا.');await uploadSelectedImages();const r=await saveRecord(false);$('success').innerHTML='<b>⏳ تم إرسال الإعلان للمراجعة</b><br>تم رفع إثبات الدفع. سيقوم Admin بمراجعته، ولن يظهر في Marketplace قبل الموافقة.<br><small>رقم الإعلان: '+esc(r.ad_code||draftId)+'</small>';$('success').classList.add('show');$('msg').textContent='';renderProgress(6);window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}catch(e){console.error(e);$('msg').textContent=e.message||'تعذر إرسال الإعلان.'}finally{b.disabled=false}};"
new_submit = "$('adForm').onsubmit=async e=>{e.preventDefault();const b=$('submitBtn');b.disabled=true;$('msg').textContent='';try{if(!session)throw new Error('سجّل الدخول أولًا.');const t=$('type').value,d=getDetails();if(t==='spare_parts'){if(!d.part_name||!d.part_category||!d.condition||d.price===undefined||d.price===null||d.price===''||!d.wilaya||!d.municipality)throw new Error('أكمل جميع الحقول الإلزامية ⭐ لقطعة الغيار.');if(!selectedImages.length)throw new Error('أضف صورة واحدة على الأقل.');}paymentRequired=await getPaymentRequired();if(paymentRequired&&!$('proof').files?.[0])throw new Error('📸 إثبات الدفع مطلوب لإرسال الإعلان للمراجعة.');await uploadSelectedImages();const r=await saveRecord(false);$('success').innerHTML=paymentRequired?'<b>⏳ تم إرسال الإعلان للمراجعة</b><br>تم رفع إثبات الدفع. سيقوم Admin بمراجعته، ولن يظهر في Marketplace قبل الموافقة.<br><small>رقم الإعلان: '+esc(r.ad_code||draftId)+'</small>':'<b>🎉 تم إرسال إعلانك مجانًا للمراجعة</b><br>لا توجد رسوم لنشر الإعلان حاليًا. سيقوم Admin بمراجعة الإعلان قبل نشره.<br><small>رقم الإعلان: '+esc(r.ad_code||draftId)+'</small>';$('success').classList.add('show');$('msg').textContent='';renderProgress(6);window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}catch(e){console.error(e);$('msg').textContent=e.message||'تعذر إرسال الإعلان.'}finally{b.disabled=false}};"
if old_submit not in s: raise SystemExit('submit handler not found')
s=s.replace(old_submit,new_submit,1)
s=s.replace('renderProgress(1);renderFields();currentSession();loadPayment();loadFee();','renderProgress(1);renderFields();currentSession();loadPaymentMode();loadPayment();loadFee();',1)
p.write_text(s,encoding='utf-8')

# admin.html
p=ROOT/'admin.html';s=p.read_text(encoding='utf-8')
needle='        <label class="package-check"><input id="marketplaceAdsEnabled" type="checkbox" checked> استقبال إعلانات Marketplace مفعّل</label>'
insert='''        <div class="full-field" style="background:#f7fbf9;border:1px solid #dbe9e4;border-radius:12px;padding:12px"><b style="display:block;margin-bottom:8px">رسوم نشر الإعلانات</b><label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input id="adPostingFree" name="adPostingPaymentMode" type="radio" value="free" checked> 🟢 النشر المجاني</label><label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input id="adPostingPaid" name="adPostingPaymentMode" type="radio" value="paid"> 🔴 الدفع مطلوب</label><small style="display:block;color:#6d7d79;margin-top:6px">يُحفظ هذا الإعداد في Supabase ويطبّق على جميع المستخدمين.</small></div>\n'''+needle
if needle not in s: raise SystemExit('admin block not found')
s=s.replace(needle,insert,1);p.write_text(s,encoding='utf-8')

# admin.js
p=ROOT/'admin.js';s=p.read_text(encoding='utf-8')
s=s.replace("const ss=await db.from('site_settings').select('marketplace_ads_enabled').limit(1).maybeSingle();\n    $('marketplaceAdsEnabled').checked=ss.data?.marketplace_ads_enabled!==false;", "const ss=await db.from('site_settings').select('marketplace_ads_enabled,ad_posting_payment_enabled').eq('id',true).maybeSingle();\n    $('marketplaceAdsEnabled').checked=ss.data?.marketplace_ads_enabled!==false;\n    $('adPostingFree').checked=ss.data?.ad_posting_payment_enabled!==true;\n    $('adPostingPaid').checked=ss.data?.ad_posting_payment_enabled===true;",1)
s=s.replace("const sr=await db.from('site_settings').update({marketplace_ads_enabled:enabled,updated_at:new Date().toISOString()}).eq('id',true);", "const paymentEnabled=$('adPostingPaid').checked;\n    const sr=await db.from('site_settings').update({marketplace_ads_enabled:enabled,ad_posting_payment_enabled:paymentEnabled,updated_at:new Date().toISOString()}).eq('id',true);",1)
s=s.replace("setAdminMsg('marketplaceFeeMsg','تم حفظ رسوم وإعدادات إعلانات Marketplace ✓','success');", "setAdminMsg('marketplaceFeeMsg',paymentEnabled?'تم حفظ الإعدادات: الدفع مطلوب ✓':'تم حفظ الإعدادات: النشر المجاني مفعّل ✓','success');",1)
p.write_text(s,encoding='utf-8')

# marketplace.html
p=ROOT/'marketplace.html';s=p.read_text(encoding='utf-8')
s=s.replace('أضف إعلانك وادفع عبر بريد موب، ثم أرسله للمراجعة.', 'أضف إعلانك وأرسله للمراجعة. <span id="publishModeMessage">جارٍ التحقق من رسوم النشر…</span>',1)
marker="const money=v=>Number(v||0).toLocaleString('ar-DZ')+' دج';"
if marker not in s: raise SystemExit('marketplace marker not found')
s=s.replace(marker, marker+"\nasync function loadPublishModeMessage(){const el=$('publishModeMessage');if(!el)return;const {data,error}=await db.from('site_settings').select('ad_posting_payment_enabled').eq('id',true).maybeSingle();if(error){el.textContent='تعذر التحقق من وضع الرسوم حاليًا.'}else if(data?.ad_posting_payment_enabled===false){el.textContent='🎉 النشر مجاني حاليًا'}else{el.textContent='الدفع عبر بريد موب مطلوب حاليًا.'}}",1)
s=s.replace('renderCategoryDetails();\n</script>', 'renderCategoryDetails();\nloadPublishModeMessage();\n</script>',1)
p.write_text(s,encoding='utf-8')
