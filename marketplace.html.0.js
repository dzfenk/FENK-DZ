
const SUPABASE_URL='https://wqfnzahjwlukncxlxdkp.supabase.co';
const SUPABASE_KEY='sb_publishable__QR4tJ9p5RYOQkIuHkoYKQ_mbDa9tuA';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money=v=>Number(v||0).toLocaleString('ar-DZ')+' دج';
let prices=[];
const typeNames={product:'منتج',service:'خدمة',store:'متجر',car:'سيارة للبيع',realestate:'عقار للبيع',land:'أرض للبيع',app:'تطبيق',game:'لعبة',other:'إعلان'};
const categoryType={products:'product',stores:'store',cars:'car',realestate:'realestate',land:'land'};


function renderCategoryDetails(){
 const t=$('type').value, box=$('categoryDetails'); if(!box)return;
 const common=`<div class="detail-title">تفاصيل الإعلان — اكتب فقط ما تعرفه، ولا نخمن أي معلومة</div>
 <label>الولاية<input id="dWilaya" placeholder="مثال: الجزائر"></label>
 <label>البلدية<input id="dMunicipality" placeholder="مثال: باب الزوار"></label>`;
 if(t==='car'){
  box.innerHTML=common+`
   <label>ماركة السيارة<input id="dCarBrand" placeholder="مثال: Renault"></label>
   <label>موديل السيارة<input id="dCarModel" placeholder="مثال: Clio 4"></label>
   <label>السنة<input id="dCarYear" inputmode="numeric" placeholder="2020"></label>
   <label>المحرك<input id="dEngine" placeholder="مثال: 1.4 بنزين"></label>
   <label>الوقود<input id="dFuel" placeholder="بنزين / ديزل"></label>
   <label>علبة السرعة<select id="dGear"><option value="">غير محدد</option><option>يدوية</option><option>أوتوماتيك</option></select></label>
   <label>المسافة المقطوعة<input id="dMileage" placeholder="120,000 كم"></label>
   <label>الحالة<input id="dCondition" placeholder="مستعملة / ممتازة"></label>
   <label>السعر (اختياري)<input id="dPrice" inputmode="decimal" placeholder="مثال: 2,800,000 دج"></label>
   <label class="wide">معلومات إضافية<textarea id="dNotes" placeholder="مثال: السيارة نظيفة، أوراقها كاملة، فيها بعض الخدوش..."></textarea></label>`;
 } else if(t==='realestate'){
  box.innerHTML=common+`
   <label>نوع العقار<input id="dPropertyType" placeholder="مسكن / فيلا / شقة..."></label>
   <label>المساحة<input id="dArea" placeholder="مثال: 180 م²"></label>
   <label>عدد الغرف<input id="dRooms" placeholder="مثال: 4"></label>
   <label>الطابق<input id="dFloor" placeholder="مثال: 2"></label>
   <label>السعر (اختياري)<input id="dPrice" inputmode="decimal" placeholder="مثال: 18,000,000 دج"></label>
   <label class="wide">معلومات إضافية<textarea id="dNotes" placeholder="الموقع، الحالة، الوثائق، الحي..."></textarea></label>`;
 } else if(t==='land'){
  box.innerHTML=common+`
   <label>المساحة<input id="dArea" placeholder="مثال: 500 م²"></label>
   <label>نوع الأرض<input id="dLandType" placeholder="سكنية / فلاحية / تجارية"></label>
   <label>طبيعة الوثائق<input id="dDocuments" placeholder="دفتر عقاري..."></label>
   <label>واجهة / طريق<input id="dRoad" placeholder="مثال: طريق رئيسي"></label>
   <label>السعر (اختياري)<input id="dPrice" inputmode="decimal" placeholder="مثال: 12,000,000 دج"></label>
   <label class="wide">معلومات إضافية<textarea id="dNotes" placeholder="الموقع، القرب من الطريق، الماء والكهرباء..."></textarea></label>`;
 } else if(t==='product'){
  box.innerHTML=common+`<label>اسم المنتج<input id="dProductName" placeholder="مثال: iPhone 15"></label><label>الحالة<input id="dCondition" placeholder="جديد / مستعمل"></label><label>السعر (اختياري)<input id="dPrice" inputmode="decimal" placeholder="مثال: 120,000 دج"></label><label class="wide">معلومات إضافية<textarea id="dNotes" placeholder="المواصفات، الذاكرة، اللون، العيوب..."></textarea></label>`;
 } else {
  box.innerHTML=common+`<label class="wide">معلومات إضافية<textarea id="dNotes" placeholder="اكتب كل التفاصيل التي تريد ظهورها للمشتري..."></textarea></label>`;
 }
}
function collectDetails(){
 const ids=['dWilaya','dMunicipality','dCarBrand','dCarModel','dCarYear','dEngine','dFuel','dGear','dMileage','dCondition','dPrice','dProductName','dPropertyType','dArea','dRooms','dFloor','dLandType','dDocuments','dRoad','dNotes'];
 const labels={wilaya:'الولاية',municipality:'البلدية',carbrand:'ماركة السيارة',carmodel:'موديل السيارة',caryear:'السنة',engine:'المحرك',fuel:'الوقود',gear:'علبة السرعة',mileage:'المسافة المقطوعة',condition:'الحالة',price:'السعر',productname:'اسم المنتج',propertytype:'نوع العقار',area:'المساحة',rooms:'عدد الغرف',floor:'الطابق',landtype:'نوع الأرض',documents:'الوثائق',road:'الطريق',notes:'معلومات إضافية'};
 const o={}; ids.forEach(id=>{const e=$(id);if(e&&e.value.trim()){const key=id.replace(/^d/,'').toLowerCase();o[key]=e.value.trim();o['_labels']=o['_labels']||{};o['_labels'][key]=labels[key]||key;}}); return o;
}
function formatGeneratedDescription(details){
 const labels=details?._labels||{};
 return Object.entries(details||{}).filter(([k,v])=>k!=='_labels'&&v).map(([k,v])=>`${labels[k]||k}: ${v}`).join(' | ') || null;
}
async function fileToDataUrlLocal(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(file);});}
async function analyzeMarketplaceImage(){
 const file=$('image')?.files?.[0], btn=$('aiAnalyzeBtn'), status=$('aiAnalyzeMsg');
 if(!file){if(status)status.textContent='اختر صورة أولًا.';return;}
 if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>5*1024*1024){if(status)status.textContent='اختر JPG أو PNG أو WEBP بحجم لا يتجاوز 5MB.';return;}
 const {data:{session}}=await db.auth.getSession(); if(!session){if(status)status.textContent='سجّل الدخول أولًا لاستخدام FENK AI.';return;}
 btn.disabled=true; if(status)status.textContent='🦊 FENK AI يحلل الصورة…';
 try{
  const image=await fileToDataUrlLocal(file), t=$('type').value;
  const prompt=t==='car'?'حلل صورة إعلان سيارة للبيع. استخرج فقط المعلومات المرئية أو المكتوبة بوضوح: الماركة/الموديل إن ظهرا، نوع السيارة، أي سنة أو محرك أو وقود أو ناقل حركة ظاهر، والحالة المرئية. لا تخمن. اكتب وصفًا عربيًا مرتبًا، واذكر ما لا يمكن التأكد منه.':`حلل صورة الإعلان. اذكر فقط ما يظهر بوضوح، واكتب وصفًا عربيًا مرتبًا ومناسبًا للإعلان. لا تخمن أي سعر أو مواصفة غير ظاهرة.`;
  const res=await fetch(`${SUPABASE_URL}/functions/v1/fenk-ai`,{method:'POST',headers:{'content-type':'application/json','apikey':SUPABASE_KEY,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({message:prompt,image,uiLanguage:'ar'})});
  const data=await res.json().catch(()=>({})); if(!res.ok)throw new Error(data.message||'تعذر تشغيل FENK AI.');
  const text=String(data.reply||'').trim(); if(!text)throw new Error('لم يرجع FENK AI وصفًا.');
  const notes=$('dNotes'); if(notes)notes.value=text;
  if(status)status.textContent='✓ تم إنشاء وصف من الصورة. راجعه وعدّله قبل الإرسال.';
 }catch(err){if(status)status.textContent=err?.message||'تعذر تحليل الصورة.';}finally{btn.disabled=false;}
}
async function loadAdPaymentSettings(){
 const {data}=await db.from('payment_settings').select('method,display_name,account_number,phone_number,instructions').eq('method','barid_mob').eq('is_active',true).order('updated_at',{ascending:false}).limit(1).maybeSingle();
 const box=$('paymentAccountBox');
 if(!box)return;
 if(!data){box.innerHTML='<div class="payment-account">سيظهر حساب بريد موب هنا بعد إعداده من Admin.</div>';return}
 box.innerHTML=`<div class="payment-account"><b>بريد موب</b><br>${data.display_name?`اسم الحساب: ${esc(data.display_name)}<br>`:''}${data.account_number?`رقم الحساب: <b>${esc(data.account_number)}</b><br>`:''}${data.phone_number?`الهاتف: <b>${esc(data.phone_number)}</b><br>`:''}${data.instructions?esc(data.instructions):'اتبع تعليمات FENK للدفع.'}</div>`;
}

async function loadPrices(){
 const {data,error}=await db.from('marketplace_packages').select('id,duration_days,fee_dzd,is_active,sort_order').eq('is_active',true).order('duration_days',{ascending:false});
 if(error){ console.error('marketplace_packages:',error); prices=[]; return; }
 prices=(data||[]).sort((a,b)=>Number(b.duration_days)-Number(a.duration_days));
 const pack=prices.find(p=>Number(p.duration_days)===30)||prices[0]||null;
 const feeBox=$('paymentFeeBox'); if(feeBox) feeBox.innerHTML=pack?`<b>رسوم نشر الإعلان: ${money(pack.fee_dzd)}</b>`:'رسوم الإعلان غير متاحة حاليًا.';
}
function getDefaultPackage(){
 return prices.find(p=>Number(p.duration_days)===30) || prices[0] || null;
}
window.currentUserId=null;
async function refreshCurrentUser(){
 const {data:{session}}=await db.auth.getSession();
 window.currentUserId=session?.user?.id||null;
}
async function deleteMyMarketplaceAd(id){
 if(!window.currentUserId){alert('سجّل الدخول أولًا.');return}
 if(!confirm('هل تريد حذف هذا الإعلان؟ بعد الحذف لن يظهر للزوار.')) return;
 const {data:row,error:readErr}=await db.from('marketplace_ads').select('id,user_id').eq('id',id).maybeSingle();
 if(readErr||!row){alert('الإعلان غير موجود.');return}
 if(row.user_id!==window.currentUserId){alert('لا يمكنك حذف إعلان لا يخص حسابك.');return}
 const {error}=await db.from('marketplace_ads').delete().eq('id',id);
 if(error){alert('تعذر حذف الإعلان: '+error.message);return}
 await loadAds();
}

async function loadAds(){
 await refreshCurrentUser();
 const grid=$('grid'), qs=new URLSearchParams(location.search), cat=qs.get('category');
 document.querySelectorAll('.cat').forEach(a=>a.classList.toggle('active',(a.dataset.category||'all')===(cat||'all')));
 const {data:catRow}=cat?await db.from('marketplace_categories').select('id,name').eq('slug',cat).eq('is_active',true).maybeSingle():{data:null};
 const label=catRow?.name || (cat==='cars'?'سيارات للبيع':cat==='realestate'?'عقارات / أراضي':cat==='land'?'أراضي للبيع':cat==='stores'?'متاجر':cat==='products'?'منتجات':cat==='ads'?'الإعلانات':'كل الإعلانات');
 const head=document.querySelector('#products .head h2'); if(head)head.textContent=label;
 let q=db.from('marketplace_ads').select('id,user_id,title,description,price_dzd,contact,phone,image_url,approval_status,payment_status,start_at,end_at,created_at,category_id,details').eq('approval_status','published').order('created_at',{ascending:false}).limit(6);
 if(catRow?.id) q=q.eq('category_id',catRow.id);
 if(cat==='realestate'){
   const {data:extraLand}=await db.from('marketplace_categories').select('id').eq('slug','land').eq('is_active',true).maybeSingle();
   if(extraLand?.id && catRow?.id) q=db.from('marketplace_ads').select('id,user_id,title,description,price_dzd,contact,phone,image_url,approval_status,payment_status,start_at,end_at,created_at,category_id,details').eq('approval_status','published').in('category_id',[catRow.id,extraLand.id]).order('created_at',{ascending:false}).limit(100);
 }
 const {data,error}=await q;
 if(error){grid.innerHTML=`<div class="empty"><b>تعذر تحميل هذا القسم.</b><br><small>${esc(error.message||'خطأ غير معروف')}</small></div>`;return}
 const now=Date.now(); const visible=(data||[]).filter(a=>!a.end_at||new Date(a.end_at).getTime()>now);
 $('count').textContent=visible.length+' إعلان';
 grid.innerHTML=visible.map(a=>`<article class="card">${a.image_url?`<img src="${esc(a.image_url)}" alt="${esc(a.title)}" loading="lazy" onerror="this.style.display='none'">`:''}<div class="body"><span class="type">${typeNames[a.details?.type]||label||'إعلان'}</span><h3>${esc(a.title)}</h3><p>${esc(a.description||'')}</p>${a.details?`<div class="ad-details">${Object.entries(a.details).filter(([k,v])=>k!=='type'&&k!=='_labels'&&v).map(([k,v])=>`<span><b>${esc((a.details._labels||{})[k]||k)}:</b> ${esc(v)}</span>`).join('')}</div>`:''}${a.price_dzd!=null?`<div class="chip" style="display:inline-block;margin-top:6px">${money(a.price_dzd)}</div>`:''}${a.phone?`<a class="contact" href="tel:${esc(a.phone)}">اتصال</a>`:a.contact?`<a class="contact" href="${/^https?:\/\//i.test(a.contact)?esc(a.contact):'#'}" ${/^https?:\/\//i.test(a.contact)?'target="_blank" rel="noopener"':''}>${/^https?:\/\//i.test(a.contact)?'فتح الرابط ↗':'معلومات التواصل'}</a>`:''}${window.currentUserId&&a.user_id===window.currentUserId?`<button type="button" class="delete-own-ad" onclick="deleteMyMarketplaceAd('${esc(a.id)}')">🗑️ حذف إعلاني</button>`:''}</div></article>`).join('')||`<div class="empty"><b>لا توجد إعلانات منشورة في ${esc(label)} حاليًا.</b><br><span>يمكنك أن تكون أول من ينشر إعلانًا هنا.</span><br><button type="button" class="publish-btn" style="margin-top:10px" onclick="openPublish()">📢 انشر إعلانك</button></div>`;
}
async function openPublish(){
 const {data:{session}}=await db.auth.getSession();
 if(!session){location.href='index.html#login';return}
 $('modal').classList.add('show');$('modal').setAttribute('aria-hidden','false');await loadPrices();
}
$('openPublish').onclick=openPublish;$('close').onclick=()=>{$('modal').classList.remove('show');$('modal').setAttribute('aria-hidden','true')};
if(location.hash==='#publish') setTimeout(openPublish,250);

$('form').addEventListener('submit',async e=>{
 e.preventDefault();const msg=$('msg'),btn=e.submitter;
 const {data:{session}}=await db.auth.getSession();if(!session){msg.textContent='سجّل الدخول أولًا.';return}
 const image=$('image').files[0],proof=$('proof').files[0],pack=getDefaultPackage();
 if(!proof||!pack){msg.textContent=!pack?'لا توجد باقة نشر مفعلة حاليًا.':'ارفع إثبات الدفع.';return}
 if((image&&image.size>5*1024*1024)||proof.size>5*1024*1024){msg.textContent='الحد الأقصى لكل صورة 5MB.';return}
 btn.disabled=true;msg.textContent='جارٍ الإرسال…';
 try{
  const uid=session.user.id,stamp=Date.now(),safe=n=>n.replace(/[^a-zA-Z0-9._-]/g,'_');let imageUrl=null;
  if(image){const ip=`${uid}/${stamp}-${safe(image.name)}`;let r=await db.storage.from('marketplace-images').upload(ip,image,{contentType:image.type,upsert:false});if(r.error)throw r.error;imageUrl=db.storage.from('marketplace-images').getPublicUrl(ip).data.publicUrl;}
  const pp=`${uid}/${stamp}-proof-${safe(proof.name)}`;let r=await db.storage.from('marketplace-payment-proofs').upload(pp,proof,{contentType:proof.type,upsert:false});if(r.error)throw r.error;
  const t=$('type').value, slug=t==='car'?'cars':t==='realestate'?'realestate':t==='land'?'land':t==='store'?'stores':'products';
  const {data:cat,error:ce}=await db.from('marketplace_categories').select('id').eq('slug',slug).eq('is_active',true).maybeSingle();if(ce||!cat)throw ce||new Error('قسم الإعلان غير موجود');
  const details={type:t,...collectDetails()};
  const contact=$('phone').value.trim()||$('url').value.trim()||null;
  const generatedTitle=(()=>{
    if(t==='car') return [details.carbrand,details.carmodel,details.caryear].filter(Boolean).join(' ') || 'سيارة للبيع';
    if(t==='product') return details.productname || 'منتج للبيع';
    if(t==='realestate') return [details.propertytype,details.area].filter(Boolean).join(' — ') || 'عقار للبيع';
    if(t==='land') return [details.landtype,details.area].filter(Boolean).join(' — ') || 'أرض للبيع';
    return typeNames[t] || 'إعلان جديد';
  })();
  const generatedDescription=formatGeneratedDescription(details);
  const {error}=await db.from('marketplace_ads').insert({user_id:uid,category_id:cat.id,package_id:pack.id,title:generatedTitle,description:generatedDescription,price_dzd:null,contact,image_url:imageUrl,payment_proof_path:pp,payment_method:'barid_mob',ad_fee_dzd:pack.fee_dzd,payment_status:'pending',approval_status:'pending',details,phone:$('phone').value.trim()||null,wilaya:details.wilaya||null,municipality:details.municipality||null});
  if(error)throw error;msg.textContent='تم إرسال إعلانك للمراجعة ✓';$('form').reset();renderCategoryDetails();await loadPrices();
 }catch(err){console.error(err);msg.textContent='تعذر إرسال الإعلان: '+(err?.message||'خطأ غير معروف');}finally{btn.disabled=false;}
});
$('type')?.addEventListener('change',()=>{
 renderCategoryDetails();
 const t=$('type').value, img=$('adReferenceImage'), title=$('adReferenceTitle');
 const map={product:['assets/marketplace/marketplace-products.png','منتج'],service:['assets/marketplace/ads.gif','خدمة'],store:['assets/marketplace/marketplace-products.png','متجر'],car:['assets/marketplace/cars.jpg','سيارة للبيع'],realestate:['assets/marketplace/realestate.jpg','مسكن / عقار للبيع'],land:['assets/marketplace/realestate.jpg','أرض للبيع'],app:['assets/marketplace/marketplace-products.png','تطبيق'],game:['assets/marketplace/marketplace-products.png','لعبة'],other:['assets/marketplace/ads.gif','إعلان']};
 const m=map[t]||map.other; if(img)img.src=m[0]; if(title)title.textContent=m[1];
});
$('image')?.addEventListener('change',()=>{const tools=$('aiAdTools'); if(tools)tools.style.display=$('image').files?.[0]?'block':'none'; const msg=$('aiAnalyzeMsg'); if(msg)msg.textContent='سيستخدم FENK AI ما يظهر في الصورة فقط، ويمكنك تعديل النتيجة قبل الإرسال.';});
$('aiAnalyzeBtn')?.addEventListener('click',analyzeMarketplaceImage);

renderCategoryDetails();
loadAdPaymentSettings();
loadPrices();loadAds();

// V101 — promotional banner carousel
(function(){
 const track=document.getElementById('promoTrack'),dots=document.getElementById('promoDots'),prev=document.getElementById('promoPrev'),next=document.getElementById('promoNext'),slider=document.getElementById('promoSlider');
 if(!track||!dots)return;
 const slides=[...track.children]; let i=0,timer=null;
 dots.innerHTML=slides.map((_,n)=>`<button class="promo-dot${n===0?' active':''}" type="button" aria-label="الإعلان ${n+1}"></button>`).join('');
 const dotEls=[...dots.children];
 function go(n){i=(n+slides.length)%slides.length;track.style.transform=`translateX(-${i*100}%)`;dotEls.forEach((d,k)=>d.classList.toggle('active',k===i));}
 prev.onclick=()=>{go(i-1);restart()}; next.onclick=()=>{go(i+1);restart()}; dotEls.forEach((d,n)=>d.onclick=()=>{go(n);restart()});
 function start(){timer=setInterval(()=>go(i+1),5000)} function stop(){if(timer)clearInterval(timer)} function restart(){stop();start()}
 slider.addEventListener('mouseenter',stop); slider.addEventListener('mouseleave',start); slider.addEventListener('touchstart',stop,{passive:true}); slider.addEventListener('touchend',start,{passive:true}); start();
})();

