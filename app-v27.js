
// FENK Ads carousel: rotates every 2 seconds and supports image/video slides.
(()=>{
  let cleanup=null;
  const initFenkAds=()=>{
    const root=document.getElementById('fenkAdCarousel'); if(!root) return;
    cleanup?.();
    const slides=[...root.querySelectorAll('.fenk-ad-slide')],dots=[...root.querySelectorAll('.fenk-ad-dots button')];
    if(!slides.length)return;
    let i=0,timer=null;
    const show=n=>{i=(n+slides.length)%slides.length;slides.forEach((x,k)=>{x.classList.toggle('active',k===i);const v=x.querySelector('video');if(v){if(k===i){try{v.play().catch(()=>{})}catch{}}else{try{v.pause()}catch{}}}});dots.forEach((x,k)=>x.classList.toggle('active',k===i));};
    const start=()=>{clearInterval(timer);if(slides.length>1)timer=setInterval(()=>{if(!document.hidden)show(i+1)},5000)};
    const next=()=>{show(i+1);start()},prev=()=>{show(i-1);start()};
    root.querySelector('.next')?.addEventListener('click',next);root.querySelector('.prev')?.addEventListener('click',prev);
    dots.forEach((d,k)=>d.addEventListener('click',()=>{show(k);start()}));
    root.addEventListener('mouseenter',()=>clearInterval(timer));root.addEventListener('mouseleave',start);root.addEventListener('touchstart',()=>clearInterval(timer),{passive:true});root.addEventListener('touchend',start,{passive:true});
    show(0);start();
    cleanup=()=>clearInterval(timer);
  };
  window.addEventListener('fenk:ads-updated',initFenkAds);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initFenkAds,{once:true});else initFenkAds();
})();
const SUPABASE_URL = 'https://wqfnzahjwlukncxlxdkp.supabase.co';
const FENK_WHATSAPP='213778939292';
const SUPABASE_KEY = 'sb_publishable__QR4tJ9p5RYOQkIuHkoYKQ_mbDa9tuA';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $ = (id) => document.getElementById(id);
async function getCurrentUser(){
  try{
    const {data:{user},error}=await db.auth.getUser();
    if(!error && user) return user;
    const {data:{session}}=await db.auth.getSession();
    return session?.user||null;
  }catch(e){
    console.warn('Auth user:',e);
    try{const {data:{session}}=await db.auth.getSession();return session?.user||null}catch{return null}
  }
}

function initIcons(){try{window.lucide?.createIcons({attrs:{'stroke-width':2.1}})}catch(e){console.warn('Icons:',e)}}
function setMessage(el,text,type=''){if(!el)return;el.textContent=text||'';el.className=type}
function fenkToast(message,type='info'){
  let host=document.getElementById('fenkToastHost');
  if(!host){host=document.createElement('div');host.id='fenkToastHost';host.setAttribute('aria-live','polite');document.body.appendChild(host);}
  const item=document.createElement('div');item.className=`fenk-toast ${type}`;item.textContent=String(message||'');host.appendChild(item);
  requestAnimationFrame(()=>item.classList.add('show'));
  setTimeout(()=>{item.classList.remove('show');setTimeout(()=>item.remove(),220)},3000);
}
function fenkConfirm(message){
  return new Promise(resolve=>{
    let modal=document.getElementById('fenkConfirmModal');
    if(!modal){modal=document.createElement('div');modal.id='fenkConfirmModal';modal.className='fenk-confirm-modal';modal.innerHTML='<div class="fenk-confirm-box" role="dialog" aria-modal="true"><h3>تأكيد العملية</h3><p id="fenkConfirmText"></p><div class="fenk-confirm-actions"><button type="button" data-confirm-cancel>إلغاء</button><button type="button" data-confirm-ok>تأكيد</button></div></div>';document.body.appendChild(modal);}
    modal.querySelector('#fenkConfirmText').textContent=message;modal.classList.add('show');
    const finish=value=>{modal.classList.remove('show');resolve(value)};
    modal.querySelector('[data-confirm-cancel]').onclick=()=>finish(false);modal.querySelector('[data-confirm-ok]').onclick=()=>finish(true);
    modal.onclick=e=>{if(e.target===modal)finish(false)};
  });
}
function resolveProductImageUrl(raw){
  const value=String(raw||'').trim();if(!value)return Promise.resolve('assets/logo-clean.png');
  if(/^https?:\/\//i.test(value))return Promise.resolve(value);
  return db.storage.from('product-images').createSignedUrl(value,1800).then(({data,error})=>!error&&data?.signedUrl?data.signedUrl:'assets/logo-clean.png').catch(()=> 'assets/logo-clean.png');
}
async function hydrateProductImages(root=document){
  const imgs=[...root.querySelectorAll('img[data-product-image]')];
  await Promise.all(imgs.map(async img=>{const src=await resolveProductImageUrl(img.dataset.productImage);img.src=src;img.onerror=()=>{img.onerror=null;img.src='assets/logo-clean.png'};}));
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function formatDate(v){try{const d=new Date(v);if(!v||Number.isNaN(d.getTime()))return '—';return d.toLocaleDateString('ar-DZ',{day:'2-digit',month:'2-digit',year:'numeric'})+' • '+d.toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit',hour12:true})}catch{return '—'}}
function formatMoney(v,c='DZD'){if(v===null||v===undefined||v==='')return 'قيد التحديد';const n=Number(v);return Number.isFinite(n)&&n>0?`${n.toLocaleString('ar-DZ')} ${c==='DZD'?'دج':c}`:'قيد التحديد'}
function formatFinalMoney(v,c='DZD'){const n=Number(v);return Number.isFinite(n)?`${n.toLocaleString('ar-DZ')} ${c==='DZD'?'دج':c}`:'قيد التحديد'}
function openAuth(message=''){ $('authModal')?.classList.add('show'); if(message)setMessage($('authMsg'),message,'error'); setTimeout(()=>loadTelegramLoginWidget(),0) }
function closeAuth(){ $('authModal')?.classList.remove('show') }
let qty=1, selectedSite='AliExpress', cachedOrders=[], selectedOrderId=null, orderSubmitting=false;
const statusNames={received:'تم استلام الطلب',pricing:'تم تحديد السعر',awaiting_payment:'بانتظار الدفع',payment_submitted:'تم إرسال وصل الدفع',payment_confirmed:'تم تأكيد الدفع',purchasing:'جارٍ شراء المنتج',shipped:'تم شحن المنتج',arrived_algeria:'وصل إلى الجزائر',out_for_delivery:'خرج للتوصيل',delivered:'تم التسليم',cancelled:'تم إلغاء الطلب'};
const statusOrder=['received','pricing','awaiting_payment','payment_submitted','payment_confirmed','purchasing','shipped','arrived_algeria','out_for_delivery','delivered'];
function canonicalStatus(s){const map={checking:'received',price_confirmation:'pricing',payment_proof_received:'payment_submitted',paid:'payment_confirmed',shipping:'shipped'};return map[s]||s||'received';}
function notificationMessage(n){const m=String(n?.message||'');const status=n?.order_id?((m.match(/(?:إلى:|الآن:)\s*([^\.]+?)(?:\.|$)/)||[])[1]||''):'';return m.replace(/\b(checking|price_confirmation|payment_proof_received|paid|shipping)\b/g, x=>statusNames[canonicalStatus(x)]||x);}

async function getProfile(user){
  if(!user)return null;
  const {data,error}=await db.from('profiles').select('id,first_name,last_name,full_name,phone,avatar_url').eq('id',user.id).maybeSingle();
  if(error){console.warn('Profile:',error.message);return null}
  if(data?.phone){const normalized=normalizeAlgerianPhone(data.phone);if(normalized&&normalized!==data.phone){const r=await db.from('profiles').update({phone:normalized,updated_at:new Date().toISOString()}).eq('id',user.id);if(!r.error)data.phone=normalized;}}
  return data||null;
}
function profileValues(user,profile=null){
  const m=user?.user_metadata||{}, full=profile?.full_name||m.full_name||'';
  const p=String(full).trim().split(/\s+/).filter(Boolean);
  return {first_name:profile?.first_name||m.first_name||p.shift()||'',last_name:profile?.last_name||m.last_name||p.join(' ')||'',phone:profile?.phone||m.phone||''};
}
async function fillOrderContact(user){const p=await getProfile(user),v=profileValues(user,p);['orderFirstName','orderLastName','orderPhone'].forEach((id,i)=>{if($(id)&&!$(id).value)$(id).value=[v.first_name,v.last_name,v.phone][i]||''});}
async function ensureProfileComplete(user,show=true){const p=await getProfile(user),v=profileValues(user,p),ok=!!(v.first_name.trim()&&v.last_name.trim()&&v.phone.trim());if(!ok&&show)await openProfileModal(user);return ok}
async function openProfileModal(user=null,message=''){const current=user||await getCurrentUser();if(!current)return openAuth('سجّل الدخول أولًا.');const p=await getProfile(current),v=profileValues(current,p);$('firstName').value=v.first_name;$('lastName').value=v.last_name;$('phone').value=v.phone;$('profileModal')?.classList.add('show');if(message)setMessage($('profileMsg'),message,'error');}

$('googleLogin')?.addEventListener('click',async()=>{
  const b=$('googleLogin'); if(b)b.disabled=true;
  try{
    setMessage($('authMsg'),'جارٍ فتح تسجيل الدخول بحساب Google…','success');
    const redirectTo='https://fenk.site/index.html';
    const {error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo,queryParams:{prompt:'select_account'}}});
    if(error)throw error;
  }catch(e){setMessage($('authMsg'),e?.message||'تعذر بدء تسجيل الدخول عبر Google.','error');if(b)b.disabled=false;}
});

const TELEGRAM_BOT_USERNAME='FENK_DZ_Bot';
const TELEGRAM_LOGIN_ENDPOINT='https://wqfnzahjwlukncxlxdkp.supabase.co/functions/v1/telegram-login';
async function applyTelegramLoginAppearance(){
  try{
    const {data}=await db.from('site_settings').select('homepage_config').eq('id',true).maybeSingle();
    const show=data?.homepage_config?.loginPage?.telegramIconEnabled===true;
    const icon=document.querySelector('.telegram-login-icon');
    if(icon) icon.style.display=show?'grid':'none';
  }catch(e){
    const icon=document.querySelector('.telegram-login-icon');
    if(icon) icon.style.display='none';
  }
}

let telegramWidgetLoaded=false;
applyTelegramLoginAppearance();
window.onTelegramAuth=async function(user){
  const b=$('telegramLogin');
  if(b)b.disabled=true;
  setMessage($('authMsg'),'جارٍ التحقق من حساب Telegram…','success');
  try{
    const r=await fetch(TELEGRAM_LOGIN_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({auth:user})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||!j?.ok||!j?.session?.access_token)throw new Error(j?.error||'تعذر تسجيل الدخول عبر Telegram.');
    const {error}=await db.auth.setSession({access_token:j.session.access_token,refresh_token:j.session.refresh_token});
    if(error)throw error;
    $('telegramWidgetHost')?.setAttribute('aria-hidden','true');
    if($('telegramWidgetHost'))$('telegramWidgetHost').style.display='none';
    closeAuth();
  }catch(e){console.error('Telegram login:',e);setMessage($('authMsg'),e?.message||'تعذر تسجيل الدخول عبر Telegram.','error');if(b)b.disabled=false;}
};

function loadTelegramLoginWidget(){
  const host=$('telegramWidgetHost');
  if(!host||telegramWidgetLoaded)return;
  telegramWidgetLoaded=true;
  host.innerHTML='';
  const note=document.createElement('div');
  note.className='telegram-widget-note';
  note.textContent='اضغط زر Telegram الرسمي الظاهر أدناه لإكمال تسجيل الدخول.';
  host.appendChild(note);
  const script=document.createElement('script');
  script.async=true;
  script.src='https://telegram.org/js/telegram-widget.js?22';
  script.dataset.telegramLogin=TELEGRAM_BOT_USERNAME;
  script.dataset.size='large';
  script.dataset.userpic='false';
  script.dataset.requestAccess='write';
  script.dataset.onauth='onTelegramAuth(user)';
  host.appendChild(script);
  host.style.display='block';
  host.setAttribute('aria-hidden','false');
}
// Telegram is rendered directly inside the single Telegram login card.
// No second/custom Telegram button is shown.


async function finishGoogleProfile(user){ closeAuth(); updateAuthUI(user); }

$('profileForm')?.addEventListener('submit',async e=>{
  e.preventDefault();const user=await getCurrentUser();if(!user)return openAuth('انتهت الجلسة.');
  const firstName=$('firstName').value.trim(),lastName=$('lastName').value.trim(),phone=$('phone').value.trim();
  if(!firstName||!lastName||!phone)return setMessage($('profileMsg'),'أكمل الاسم واللقب ورقم الهاتف.','error');
  const normalizedPhone=normalizeAlgerianPhone(phone);if(!normalizedPhone)return setMessage($('profileMsg'),'أدخل رقمًا جزائريًا صحيحًا يبدأ بـ 05 أو 06 أو 07.','error');
  const b=$('saveProfile');b.disabled=true;b.textContent='جارٍ الحفظ…';
  try{const fullName=`${firstName} ${lastName}`.trim();const {error}=await db.from('profiles').upsert({id:user.id,first_name:firstName,last_name:lastName,full_name:fullName,phone:normalizedPhone,avatar_url:user.user_metadata?.avatar_url||null,updated_at:new Date().toISOString()},{onConflict:'id'});if(error)throw error;await db.auth.updateUser({data:{first_name:firstName,last_name:lastName,full_name:fullName,phone:normalizedPhone}});await getProfile(user); updateAuthUI(user); if($('accountName'))$('accountName').textContent=fullName; if($('accountPhone'))$('accountPhone').textContent=formatPhoneDisplay(normalizedPhone); if($('accountPhoneRow'))$('accountPhoneRow').textContent=formatPhoneDisplay(normalizedPhone); setMessage($('profileMsg'),'تم حفظ بياناتك بنجاح ✓','success');if($('orderFirstName'))$('orderFirstName').value=firstName;if($('orderLastName'))$('orderLastName').value=lastName;if($('orderPhone'))$('orderPhone').value=normalizedPhone;setTimeout(()=>$('profileModal')?.classList.remove('show'),450)}catch(e){console.error(e);setMessage($('profileMsg'),e?.message||'تعذر حفظ البيانات. حاول مرة أخرى.','error')}finally{b.disabled=false;b.textContent='حفظ البيانات'}
});

// Product image
const imageInput=$('productImage');
imageInput?.addEventListener('change',()=>{
  const file=imageInput.files?.[0];if(!file){$('imagePreview')?.classList.remove('show');if($('imageName'))$('imageName').textContent='';return}
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){imageInput.value='';return setMessage($('orderMsg'),'اختر صورة JPG أو PNG أو WEBP فقط.','error')}
  if(file.size>5*1024*1024){imageInput.value='';return setMessage($('orderMsg'),'حجم الصورة يجب ألا يتجاوز 5MB.','error')}
  $('imageName').textContent=file.name;$('imagePreview').src=URL.createObjectURL(file);$('imagePreview').classList.add('show');setMessage($('orderMsg'),'تم اختيار الصورة بنجاح ✓','success');
});

document.querySelectorAll('[data-scroll]').forEach(el=>el.addEventListener('click',()=>document.querySelector(el.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));
$('searchBtn')?.addEventListener('click',()=>{const q=$('siteSearch')?.value.trim()||'';if(/^https?:\/\//i.test(q)){$('productUrl').value=q;document.querySelector('#order')?.scrollIntoView({behavior:'smooth'})}else if(q){setMessage($('orderMsg'),'ألصق رابط المنتج أو اكتب رابطًا يبدأ بـ https://.','error');document.querySelector('#order')?.scrollIntoView({behavior:'smooth'})}});
$('siteSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('searchBtn')?.click()});
$('countryBtn')?.addEventListener('click',()=>document.querySelector('#order')?.scrollIntoView({behavior:'smooth'}));
$('closeMarket')?.addEventListener('click',()=>$('marketModal')?.classList.remove('show'));
$('marketModal')?.addEventListener('click',e=>{if(e.target===$('marketModal'))$('marketModal').classList.remove('show')});

for(const b of document.querySelectorAll('#sites button'))b.addEventListener('click',()=>{document.querySelectorAll('#sites button').forEach(x=>x.classList.remove('active'));b.classList.add('active');selectedSite=b.dataset.site||'موقع آخر'});
$('plus')?.addEventListener('click',()=>{$('qty').textContent=String(++qty)});
$('minus')?.addEventListener('click',()=>{$('qty').textContent=String(qty=Math.max(1,qty-1))});

async function handleAccountClick(){const user=await getCurrentUser();if(user)return openAccountModal(user);openAuth()}
$('accountBtn')?.addEventListener('click',handleAccountClick);$('mobileAccount')?.addEventListener('click',handleAccountClick);
$('ordersBtn')?.addEventListener('click',()=>openCustomerOrders());

function renderTimeline(status,isGame=false){
  const steps=isGame
    ? [['payment_submitted','تم استلام وصل الدفع'],['payment_confirmed','تم تأكيد الدفع'],['completed','تم شحن اللعبة']]
    : [['received','تم استلام الطلب'],['pricing','تم تحديد السعر'],['awaiting_payment','بانتظار الدفع'],['payment_submitted','تم إرسال وصل الدفع'],['payment_confirmed','تم تأكيد الدفع'],['purchasing','جارٍ شراء المنتج'],['shipped','تم شحن المنتج'],['arrived_algeria','وصل إلى الجزائر'],['out_for_delivery','خرج للتوصيل'],['delivered','تم التسليم']];
  const currentStatus=canonicalStatus(status);
  if(currentStatus==='cancelled')return '<div class="order-timeline cancelled"><div class="timeline-current">تم إلغاء الطلب</div></div>';
  const current=Math.max(0,steps.findIndex(x=>x[0]===currentStatus));
  return `<div class="order-timeline ${isGame?'game-order-timeline':''}">${steps.map((x,i)=>`<div class="timeline-step ${i<current?'done':''} ${i===current?'current':''}"><span>${i<current?'✓':i===current?'●':'○'}</span><small>${x[1]}</small></div>`).join('')}</div>`;
}

async function openCustomerOrders(){
  const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا لعرض طلباتك.');
  $('customerOrdersList').innerHTML='<div class="empty">جارٍ تحميل الطلبات…</div>';$('customerOrdersModal')?.classList.add('show');
  const {data,error}=await db.from('orders').select('id,order_number,status,source_site,product_name,product_info,product_image_url,quantity,product_price,shipping_fee,service_fee,total_price,currency,created_at').eq('user_id',user.id).eq('hidden_from_customer',false).order('created_at',{ascending:false});
  if(error)return $('customerOrdersList').innerHTML='<div class="empty">تعذر تحميل الطلبات.</div>';
  $('customerOrdersList').innerHTML=data?.length?data.map(o=>`<article class="notification-item order-card" data-order-id="${esc(o.id)}"><div class="order-card-head"><b>#${esc(o.order_number)}</b><strong>${esc(statusNames[o.status]||'قيد المعالجة')}</strong></div><p>${esc(o.product_name||o.product_info||o.source_site||'طلب منتج')} • الكمية: ${Number(o.quantity)||1}</p><small>${formatMoney(o.total_price,o.currency)} • ${formatDate(o.created_at)}</small>${renderTimeline(o.status)}</article>`).join(''):'<div class="empty">لا توجد طلبات بعد.</div>';
  initIcons();
}
$('closeCustomerOrders')?.addEventListener('click',()=>$('customerOrdersModal')?.classList.remove('show'));
$('customerOrdersModal')?.addEventListener('click',e=>{if(e.target===$('customerOrdersModal'))$('customerOrdersModal').classList.remove('show')});

let supportRealtimeChannel=null;
let supportRealtimeUserId=null;

function subscribeSupportMessages(userId){
  if(!userId || supportRealtimeUserId===userId) return;
  if(supportRealtimeChannel){try{db.removeChannel(supportRealtimeChannel)}catch{}}
  supportRealtimeUserId=userId;
  supportRealtimeChannel=db.channel(`fenk-support-${userId}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'support_messages',filter:`user_id=eq.${userId}`},async payload=>{
      await loadCustomerMessages(userId);
      if(payload?.eventType==='INSERT'&&payload.new?.sender_role==='admin'){
        const modalOpen=$('messagesModal')?.classList.contains('show');
        if(modalOpen){
          try{await db.from('support_messages').update({is_read:true}).eq('id',payload.new.id).eq('user_id',userId).eq('sender_role','admin').eq('is_read',false)}catch(e){}
        }
        await updateMessageBadge(userId);
        if(modalOpen)setMessage($('messageMsg'),'وصل رد جديد من فريق FENK ✓','success');
        else fenkToast('💬 لديك رسالة جديدة من فريق FENK','success');
      }else if(payload?.eventType!=='INSERT'){
        await updateMessageBadge(userId);
      }
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'support_message_reactions'},async()=>{await loadCustomerMessages(userId)})
    .subscribe();
}

async function openMessages(){
  const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا للتواصل مع FENK.'); window.__fenkCurrentUserId=user.id;
  $('messagesList').innerHTML='<div class="empty">جارٍ تحميل المحادثة…</div>';$('messagesModal')?.classList.add('show');
  subscribeSupportMessages(user.id);
  await loadCustomerMessages(user.id);
  // Opening the conversation marks only Admin replies as read. Customer messages are never treated as unread replies.
  try{
    const {error}=await db.from('support_messages').update({is_read:true}).eq('user_id',user.id).eq('sender_role','admin').eq('is_read',false);
    if(error)console.warn('Support read update:',error);
  }catch(e){console.warn('Support read update:',e)}
  await updateMessageBadge(user.id);
}
let supportReplyTarget=null;
let supportActionTarget=null;
const SUPPORT_REACTIONS=['👍','❤️','😂','😢','😮','😡'];
function closeSupportReply(){supportReplyTarget=null;const el=$('messageReplyPreview');if(el){el.innerHTML='';el.hidden=true;}}
function getSupportMessageById(id){return document.querySelector(`#messagesList [data-message-id="${CSS.escape(String(id||''))}"]`)}
function messagePreviewText(m){const text=String(m?.message||'').trim();return text.length>120?text.slice(0,120)+'…':text;}
function reactionSummary(reactions){
  const map=new Map();(Array.isArray(reactions)?reactions:[]).forEach(r=>map.set(r.emoji,(map.get(r.emoji)||0)+1));
  return [...map.entries()].map(([emoji,count])=>`<button type="button" class="reaction-chip" data-reaction-emoji="${esc(emoji)}" title="${count} تفاعل">${emoji}${count>1?` <small>${count}</small>`:''}</button>`).join('');
}
function renderSupportMessage(m){
  const mine=m.sender_role==='customer';
  const deleted=!!m.deleted_for_everyone;
  const replyTarget=m.reply_to_message_id?(window.__fenkSupportRows||[]).find(x=>x.id===m.reply_to_message_id):null;
  const forwarded=m.forwarded_from_message_id;
  const reactions=Array.isArray(m.reactions)?m.reactions:[];
  const currentReaction=reactions.find(r=>window.__fenkCurrentUserId&&r.user_id===window.__fenkCurrentUserId)?.emoji||'';
  const replyText=replyTarget?.message || '';
  const safeMessage=deleted?'تم حذف هذه الرسالة':m.message;
  return `<article class="chat-bubble ${mine?'mine':'admin-msg'} ${deleted?'message-deleted':''}" data-message-id="${esc(m.id)}" data-own="${mine?'1':'0'}" data-deleted="${deleted?'1':'0'}">
    ${forwarded?'<div class="message-forwarded">↗️ رسالة مُعاد توجيهها</div>':''}
    ${m.reply_to_message_id?`<div class="message-reply-ref">↩️ <span>${esc(messagePreviewText({message:replyText}))}</span></div>`:''}
    <p class="message-text">${esc(safeMessage)}</p>
    <div class="message-meta"><small>${mine?'أنت':'FENK'} • ${formatDate(m.created_at)}</small><button type="button" class="message-more" aria-label="خيارات الرسالة">⋯</button></div>
    <div class="message-reactions ${reactions.length?'has-reactions':''}" aria-label="التفاعلات">${reactionSummary(reactions)}${!deleted?`<button type="button" class="reaction-add" data-reaction-add="1" aria-label="إضافة تفاعل">＋</button>`:''}</div>
    ${currentReaction?`<span class="message-my-reaction" data-my-reaction="${esc(currentReaction)}">${currentReaction}</span>`:''}
  </article>`;
}
async function loadCustomerMessages(userId){
  const {data,error}=await db.rpc('get_my_support_messages_v2');
  if(error){
    console.warn('Support messages load:',error);
    $('messagesList').innerHTML='<div class="empty error-empty">تعذر تحميل الرسائل الآن. تأكد من تسجيل الدخول ثم حاول مرة أخرى.</div>';
    if($('retryMessages'))$('retryMessages').style.display='block';
    return setMessage($('messageMsg'),'تعذر تحميل الرسائل.','error');
  }
  if($('retryMessages'))$('retryMessages').style.display='none';
  const rows=Array.isArray(data)?data:[]; window.__fenkSupportRows=rows;
  $('messagesList').innerHTML=rows.length?rows.map(renderSupportMessage).join(''):'<div class="empty">لا توجد رسائل بعد. اكتب رسالتك وسيرد عليك فريق FENK.</div>';
  initIcons();
  requestAnimationFrame(()=>{$('messagesList').scrollTop=$('messagesList').scrollHeight});
}
function openSupportActionSheet(message){
  supportActionTarget=message;
  let sheet=$('supportActionSheet');
  if(!sheet){
    sheet=document.createElement('div');sheet.id='supportActionSheet';sheet.className='support-action-sheet';sheet.innerHTML=`<div class="support-sheet-backdrop" data-sheet-close></div><div class="support-sheet-panel" role="dialog" aria-modal="true" aria-label="خيارات الرسالة"><div class="support-sheet-handle"></div><div class="support-sheet-reactions">${SUPPORT_REACTIONS.map(e=>`<button type="button" data-sheet-reaction="${esc(e)}">${e}</button>`).join('')}<button type="button" data-sheet-reaction-add="1">＋</button></div><button type="button" class="support-sheet-item" data-sheet-action="forward">↗️ <span>إعادة توجيه</span></button><button type="button" class="support-sheet-item" data-sheet-action="reply">↩️ <span>رد</span></button><button type="button" class="support-sheet-item danger" data-sheet-action="delete">🗑️ <span>حذف</span></button></div>`;document.body.appendChild(sheet);
    sheet.addEventListener('click',async e=>{
      if(e.target.closest('[data-sheet-close]'))return closeSupportActionSheet();
      const rb=e.target.closest('[data-sheet-reaction]');if(rb){await setSupportReaction(supportActionTarget?.id,rb.dataset.sheetReaction);return closeSupportActionSheet();}
      if(e.target.closest('[data-sheet-reaction-add]'))return fenkToast('التفاعلات المتاحة حاليًا: 👍 ❤️ 😂 😢 😮 😡','info');
      const action=e.target.closest('[data-sheet-action]')?.dataset.sheetAction;if(!action)return;
      const m=supportActionTarget;closeSupportActionSheet();
      if(action==='reply')return beginSupportReply(m);
      if(action==='forward')return forwardSupportMessage(m);
      if(action==='delete')return openSupportDeleteMenu(m);
    });
  }
  sheet.classList.add('show');document.body.classList.add('support-sheet-open');
}
function closeSupportActionSheet(){supportActionTarget=null;$('supportActionSheet')?.classList.remove('show');document.body.classList.remove('support-sheet-open');}
function beginSupportReply(m){if(!m||m.deleted_for_everyone)return;supportReplyTarget={id:m.id,message:m.message};const el=$('messageReplyPreview');if(el){el.hidden=false;el.innerHTML=`<div><b>↩️ الرد على:</b><span>${esc(messagePreviewText(m))}</span></div><button type="button" id="cancelMessageReply" aria-label="إلغاء الرد">×</button>`;$('cancelMessageReply').onclick=closeSupportReply;} $('messageInput')?.focus();}
async function forwardSupportMessage(m){if(!m||m.deleted_for_everyone)return;const input=$('messageInput');if(!input)return;input.value=m.message;input.focus();input.dataset.forwardId=m.id;setMessage($('messageMsg'),'تم تجهيز الرسالة لإعادة التوجيه. اضغط إرسال.','success');}
async function setSupportReaction(messageId,emoji){if(!messageId||!emoji)return;try{const {error}=await db.rpc('set_support_message_reaction',{p_message_id:messageId,p_emoji:emoji});if(error)throw error;await loadCustomerMessages(window.__fenkCurrentUserId);}catch(e){fenkToast('تعذر حفظ التفاعل.','error');console.warn(e)}}
async function toggleSupportReaction(messageId,emoji){try{const card=getSupportMessageById(messageId),mine=card?.querySelector(`[data-my-reaction="${CSS.escape(emoji)}"]`);if(mine){const {error}=await db.rpc('remove_support_message_reaction',{p_message_id:messageId});if(error)throw error;}else{const {error}=await db.rpc('set_support_message_reaction',{p_message_id:messageId,p_emoji:emoji});if(error)throw error;}await loadCustomerMessages(window.__fenkCurrentUserId);}catch(e){fenkToast('تعذر تحديث التفاعل.','error');}}
async function openSupportDeleteMenu(m){
  if(!m)return;
  const own=m.sender_role==='customer';
  const canEveryone=own;
  const sheet=document.createElement('div');sheet.className='support-delete-sheet';sheet.innerHTML=`<div class="support-sheet-backdrop"></div><div class="support-sheet-panel"><div class="support-sheet-handle"></div><h3>حذف الرسالة</h3><button type="button" data-del="me">حذف لدي فقط</button>${canEveryone?'<button type="button" class="danger" data-del="all">حذف للجميع</button>':''}<button type="button" data-del="cancel">إلغاء</button></div></div>`;document.body.appendChild(sheet);requestAnimationFrame(()=>sheet.classList.add('show'));
  sheet.addEventListener('click',async e=>{if(e.target.classList.contains('support-sheet-backdrop'))return sheet.remove();const action=e.target.closest('[data-del]')?.dataset.del;if(!action)return;if(action==='cancel')return sheet.remove();if(!(await fenkConfirm(action==='all'?'هل تريد حذف هذه الرسالة للجميع؟':'هل تريد حذف هذه الرسالة لديك فقط؟')))return;try{const fn=action==='all'?'delete_support_message_for_everyone':'delete_support_message_for_me';const {error}=await db.rpc(fn,{p_message_id:m.id});if(error)throw error;await loadCustomerMessages(window.__fenkCurrentUserId);sheet.remove();}catch(err){fenkToast('تعذر حذف الرسالة.','error');console.warn(err);}});
}
function initSupportMessageGestures(){
  const list=$('messagesList');if(!list||list.dataset.gestures==='1')return;list.dataset.gestures='1';let timer=null,startX=0,startY=0,target=null;
  const cancel=()=>{if(timer)clearTimeout(timer);timer=null;target=null;};
  list.addEventListener('contextmenu',e=>{if(e.target.closest('.chat-bubble'))e.preventDefault()});
  list.addEventListener('pointerdown',e=>{const card=e.target.closest('.chat-bubble');if(!card)return;target=card;startX=e.clientX;startY=e.clientY;timer=setTimeout(()=>{if(target){const id=target.dataset.messageId;const msg={id,message:target.querySelector('.message-text')?.textContent||'',sender_role:target.dataset.own==='1'?'customer':'admin',deleted_for_everyone:target.dataset.deleted==='1'};openSupportActionSheet(msg)}},520);});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>list.addEventListener(ev,cancel,{passive:true}));
  list.addEventListener('pointermove',e=>{if(timer&&(Math.abs(e.clientX-startX)>12||Math.abs(e.clientY-startY)>12))cancel()},{passive:true});
  list.addEventListener('click',async e=>{const card=e.target.closest('.chat-bubble');if(!card)return;const id=card.dataset.messageId;const chip=e.target.closest('[data-reaction-emoji]');if(chip){await toggleSupportReaction(id,chip.dataset.reactionEmoji);return;}if(e.target.closest('[data-reaction-add]'))return openSupportActionSheet({id,message:card.querySelector('.message-text')?.textContent||'',sender_role:card.dataset.own==='1'?'customer':'admin',deleted_for_everyone:card.dataset.deleted==='1'});if(e.target.closest('.message-more'))return openSupportActionSheet({id,message:card.querySelector('.message-text')?.textContent||'',sender_role:card.dataset.own==='1'?'customer':'admin',deleted_for_everyone:card.dataset.deleted==='1'});});
}
$('messageForm')?.addEventListener('submit',async e=>{
  e.preventDefault();const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا.');
  const input=$('messageInput'),msg=input?.value.trim();if(!msg)return setMessage($('messageMsg'),'اكتب رسالتك أولًا.','error');
  const b=e.submitter||$('messageForm button[type="submit"]');b.disabled=true;setMessage($('messageMsg'),'جارٍ إرسال الرسالة…','success');
  try{const replyId=supportReplyTarget?.id||null,forwardId=input.dataset.forwardId||null;const {error}=await db.rpc('send_my_support_message_v2',{p_message:msg,p_order_id:null,p_reply_to_id:replyId,p_forwarded_from_id:forwardId});if(error)throw error;input.value='';delete input.dataset.forwardId;closeSupportReply();setMessage($('messageMsg'),'تم إرسال رسالتك ✓','success');await loadCustomerMessages(user.id);}
  catch(err){console.warn('Messages send:',err);setMessage($('messageMsg'),'تعذر إرسال الرسالة. حاول مرة أخرى.','error')}finally{b.disabled=false}
});
$('retryMessages')?.addEventListener('click',()=>{const u=window.__fenkCurrentUserId||null;if(u)loadCustomerMessages(u);else openMessages();});
$('messagesBtn')?.addEventListener('click',openMessages);$('mobileMessages')?.addEventListener('click',openMessages);
$('closeMessages')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();$('messagesModal')?.classList.remove('show');});
$('messagesModal')?.addEventListener('click',e=>{if(e.target===$('messagesModal'))$('messagesModal').classList.remove('show')});
initSupportMessageGestures();

async function updateMessageBadge(userId=null){
  if(!userId){const user=await getCurrentUser();userId=user?.id}
  const badge=$('messageBadge'),mob=$('mobileMessageBadge');
  if(!userId){
    if(badge){badge.textContent='';badge.style.display='none'}
    if(mob){mob.textContent='';mob.style.display='none'}
    return;
  }
  let count=0;
  try{
    const r=await db.from('support_messages').select('id',{count:'exact',head:true})
      .eq('user_id',userId).eq('sender_role','admin').eq('is_read',false);
    if(!r.error)count=Number(r.count||0);
  }catch(e){console.warn('Unread support count:',e)}
  const n=Math.max(0,count||0),label=n>99?'99+':String(n);
  if(badge){badge.textContent=label;badge.style.display=n?'flex':'none';badge.setAttribute('aria-label',n?`لديك ${n} رسالة جديدة`:'لا توجد رسائل جديدة')}
  if(mob){mob.textContent=label;mob.style.display=n?'flex':'none';mob.setAttribute('aria-label',n?`لديك ${n} رسالة جديدة`:'لا توجد رسائل جديدة')}
}

async function updateNotificationBadge(userId=null){
  if(!userId){const user=await getCurrentUser();userId=user?.id}
  const badge=$('notificationBadge'),mob=$('mobileNotificationBadge');
  if(!userId){
    if(badge){badge.textContent='';badge.style.display='none'}
    if(mob){mob.textContent='';mob.style.display='none'}
    let remembered=false;try{remembered=localStorage.getItem(FENK_GUEST_NOTIFICATION_KEY)==='1'}catch{}
    setGuestNotificationAlert(remembered);
    updateFenkDocumentBadge(0);return;
  }
  let count=null;
  try{
    const r=await db.rpc('get_my_unread_notification_count');
    if(!r.error)count=Number(r.data||0);
  }catch(e){console.warn('Unread RPC:',e)}
  if(count===null){
    const r=await db.from('order_notifications').select('id',{count:'exact',head:true}).eq('recipient_user_id',userId).eq('is_read',false);
    count=Number(r.count||0);
  }
  const n=Math.max(0,count||0),label=n>99?'99+':String(n);
  fenkLastUnreadCount=n;
  rememberGuestNotificationState(n>0);
  setGuestNotificationAlert(false);
  if(badge){badge.textContent=label;badge.style.display=n?'flex':'none';badge.setAttribute('aria-label',n?`لديك ${n} إشعار غير مقروء`:'لا توجد إشعارات غير مقروءة')}
  if(mob){mob.textContent=label;mob.style.display=n?'flex':'none'}
  updateFenkDocumentBadge(n);
}$('closeProfile')?.addEventListener('click',()=>$('profileModal')?.classList.remove('show'));
$('profileModal')?.addEventListener('click',e=>{if(e.target===$('profileModal'))$('profileModal').classList.remove('show')});
$('closeAuth')?.addEventListener('click',closeAuth);$('authModal')?.addEventListener('click',e=>{if(e.target===$('authModal'))closeAuth()});

async function uploadProductImage(userId){
  const file=imageInput?.files?.[0];if(!file)return null;
  const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
  if(!ext)throw new Error('الصورة يجب أن تكون JPG أو PNG أو WEBP.');if(file.size>5*1024*1024)throw new Error('حجم الصورة يجب ألا يتجاوز 5MB.');
  const path=`${userId}/${crypto.randomUUID()}.${ext}`;const {error}=await db.storage.from('product-images').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;return path;
}


$('sendOrder')?.addEventListener('click',async()=>{
  if(orderSubmitting)return;
  setMessage($('orderMsg'),'');const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا لإرسال الطلب.');
  const first=$('orderFirstName').value.trim(),last=$('orderLastName').value.trim(),phone=$('orderPhone').value.trim(),wilaya=$('orderWilaya').value.trim(),commune=$('orderCommune').value.trim(),postal=$('orderPostalCode').value.trim(),address=$('orderAddress').value.trim(),url=$('productUrl').value.trim(),productNameRaw=$('productName').value.trim(),info=$('productInfo').value.trim();
  const productName=productNameRaw.length>=3?productNameRaw:(url?`طلب منتج من ${selectedSite}`:'طلب منتج من FENK');
  if(!first||!last||!phone||!wilaya||!commune||!address)return setMessage($('orderMsg'),'أكمل الاسم واللقب والهاتف والولاية والبلدية والعنوان.','error');if(postal&&!/^\d{5}$/.test(postal))return setMessage($('orderMsg'),'الرمز البريدي يجب أن يتكون من 5 أرقام.','error');
  const normalizedOrderPhone=normalizeAlgerianPhone(phone);if(!normalizedOrderPhone)return setMessage($('orderMsg'),'أدخل رقمًا جزائريًا صحيحًا يبدأ بـ 05 أو 06 أو 07.','error');
  if(!url&&!imageInput?.files?.length)return setMessage($('orderMsg'),'أدخل رابط المنتج أو أرسل صورة المنتج.','error');
  if(url&&!/^https?:\/\//i.test(url))return setMessage($('orderMsg'),'رابط المنتج يجب أن يبدأ بـ https:// أو http://','error');
  orderSubmitting=true;
  const b=$('sendOrder');b.disabled=true;b.textContent='جارٍ إرسال الطلب…';
  try{
    const fullName=`${first} ${last}`.trim();
    const profileError=(await db.from('profiles').upsert({id:user.id,first_name:first,last_name:last,full_name:fullName,phone:normalizedOrderPhone,avatar_url:user.user_metadata?.avatar_url||null,updated_at:new Date().toISOString()},{onConflict:'id'})).error;if(profileError)throw profileError;
    const imagePath=await uploadProductImage(user.id);
    const payload={user_id:user.id,product_url:url||null,product_name:productName||null,product_info:info||null,product_image_url:imagePath,source_site:selectedSite,quantity:qty,customer_first_name:first,customer_last_name:last,customer_phone:normalizedOrderPhone,wilaya,commune,address,postal_code:postal||null,product_price:null,shipping_fee:null,service_fee:null,status:'received'};
    // IMPORTANT: a successful INSERT is the point of truth. Do not let any optional
    // follow-up (SELECT/Telegram/address sync/UI cleanup) turn a created order into
    // a false 'تعذر إرسال الطلب' message. This was the cause of the mismatch seen
    // on mobile: the DB trigger created the notification/order, while a later step
    // could still reject the whole click handler.
    const {error}=await db.from('orders').insert(payload);if(error)throw error;
    let createdOrderId=null, createdOrderNumber='';
    try{
      const r=await db.from('orders').select('id,order_number').eq('user_id',user.id).eq('status','received').order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(!r.error&&r.data){createdOrderId=r.data.id;createdOrderNumber=r.data.order_number||'';}
    }catch(e){console.warn('Order confirmation lookup:',e)}
    setMessage($('orderMsg'),`✅ تم إرسال طلبك بنجاح\n📦 طلبك قيد المعالجة\n💬 سنتواصل معك عبر WhatsApp لتأكيد السعر والدفع.${createdOrderNumber?`\nرقم الطلب: #${createdOrderNumber}`:''}`,'success');
    try{
      const saved=getSavedAddresses(); const currentAddr={id:crypto.randomUUID(),label:'العنوان الرئيسي',first_name:first,last_name:last,full_name,phone:normalizedOrderPhone,wilaya,commune,address,postal_code:postal||'',primary:saved.length===0||saved.every(x=>!x.primary)}; let merged=saved.filter(x=>(!(x.primary&&currentAddr.primary))); if(currentAddr.primary)merged=merged.map(x=>({...x,primary:false})); merged.unshift(currentAddr); setSavedAddresses(merged);
      await saveOrderAddressToDb(user,{first,last,phone:normalizedOrderPhone,wilaya,commune,address,postal});
    }catch(e){console.warn('Post-order address sync:',e)}
    try{$('productUrl').value='';$('productName').value='';$('productInfo').value='';imageInput.value='';$('imagePreview')?.classList.remove('show');$('imageName').textContent='';qty=1;$('qty').textContent='1';}catch(e){console.warn('Post-order UI cleanup:',e)}
  }catch(e){console.error('Order:',e);const msg=String(e?.message||'');let friendly='تعذر إرسال الطلب. حاول مرة أخرى.';if(/JWT|session|auth|unauthorized/i.test(msg))friendly='انتهت جلسة الدخول. سجّل الدخول مرة أخرى ثم أرسل الطلب.';else if(/row-level|policy|permission|not authorized|42501/i.test(msg))friendly='تعذر حفظ الطلب بسبب صلاحيات قاعدة البيانات. حاول مرة أخرى.';else if(/generated|total_price|column/i.test(msg))friendly='حدث خطأ في حساب السعر. تم تسجيل المشكلة.';setMessage($('orderMsg'),friendly,'error')}finally{b.disabled=false;b.textContent='تأكيد الطلب ➤';orderSubmitting=false}
});

async function isAdmin(){const user=await getCurrentUser();if(!user)return false;try{const {data,error}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();return !error&&!!data}catch(_){return false}}
async function openAdmin(){if(!(await isAdmin()))return openAuth('هذا الحساب ليس Admin.');closeAuth();location.href='admin.html';}
$('adminBtn')?.addEventListener('click',openAdmin);$('closeAdmin')?.addEventListener('click',()=>$('adminPanel').classList.remove('show'));
document.querySelectorAll('.admin-tab').forEach(b=>b.addEventListener('click',async()=>{document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.admin-view').forEach(x=>x.classList.add('hidden'));b.classList.add('active');$('tab-'+b.dataset.tab)?.classList.remove('hidden');if(b.dataset.tab==='messages')await refreshAdminMessages();}));

function orderRow(o){return `<div class="mini-order"><b>#${esc(o.order_number)}</b><span>${esc(o.customer_first_name||'')} ${esc(o.customer_last_name||'')}</span><span>${esc(o.customer_phone||'—')}</span><strong>${esc(statusNames[o.status]||o.status||'—')}</strong><button type="button" class="detail-btn" data-order-id="${esc(o.id)}">فتح الطلب</button></div>`}
function renderOrders(orders){
  const q=($('orderSearch')?.value||'').trim().toLowerCase(),f=$('statusFilter')?.value||'';
  const rows=orders.filter(o=>(!q||String(o.order_number||'').toLowerCase().includes(q)||String(o.customer_phone||'').toLowerCase().includes(q))&&(!f||o.status===f));
  if(!rows.length){$('ordersTable').innerHTML='<div class="empty">لا توجد طلبات مطابقة.</div>';return}
  $('ordersTable').innerHTML=`<div class="table-wrap"><table class="admin-table"><thead><tr><th>الطلب</th><th>العميل</th><th>الهاتف</th><th>الموقع</th><th>الكمية</th><th>السعر</th><th>الحالة</th><th>التاريخ</th><th></th></tr></thead><tbody>${rows.map(o=>`<tr><td>#${esc(o.order_number)}</td><td>${esc(`${o.customer_first_name||''} ${o.customer_last_name||''}`.trim()||'—')}</td><td>${esc(o.customer_phone||'—')}</td><td>${esc(o.source_site||'—')}</td><td>${Number(o.quantity)||1}</td><td>${formatMoney(o.total_price,o.currency)}</td><td>${esc(statusNames[o.status]||o.status||'—')}</td><td>${formatDate(o.created_at)}</td><td><button class="detail-btn" data-order-id="${esc(o.id)}">فتح</button></td></tr>`).join('')}</tbody></table></div>`;
  document.querySelectorAll('.detail-btn').forEach(b=>b.addEventListener('click',()=>openOrderDetail(b.dataset.orderId)));
}

async function refreshAdminMessages(){
  const box=$('adminMessagesList');if(!box)return;
  box.innerHTML='<div class="empty">جارٍ تحميل رسائل العملاء…</div>';
  const {data,error}=await db.from('support_messages').select('id,user_id,message,sender_role,is_read,created_at,order_id').order('created_at',{ascending:false}).limit(200);
  if(error)return box.innerHTML='<div class="empty">تعذر تحميل رسائل العملاء.</div>';
  const groups=new Map();for(const m of data||[]){if(!groups.has(m.user_id))groups.set(m.user_id,[]);groups.get(m.user_id).push(m)}
  const ids=[...groups.keys()];let profiles=[];if(ids.length){const r=await db.from('profiles').select('id,first_name,last_name,phone').in('id',ids);profiles=r.data||[]}
  const pm=new Map(profiles.map(x=>[x.id,x]));
  box.innerHTML=ids.length?[...groups.entries()].map(([uid,msgs])=>{const p=pm.get(uid)||{};const last=msgs[0];return `<article class="admin-chat-card"><div class="admin-chat-head"><div><b>${esc(`${p.first_name||''} ${p.last_name||''}`.trim()||'عميل')}</b><small>${esc(p.phone||'')}</small></div><span>${formatDate(last.created_at)}</span></div><div class="admin-chat-thread">${msgs.slice().reverse().map(m=>`<div class="chat-bubble ${m.sender_role==='admin'?'admin-msg':'mine'}"><p>${esc(m.message)}</p><small>${m.sender_role==='admin'?'FENK':'العميل'} • ${formatDate(m.created_at)}</small></div>`).join('')}</div><form class="admin-reply-form" data-user-id="${esc(uid)}"><textarea rows="2" maxlength="4000" placeholder="اكتب ردًا للعميل..."></textarea><button class="send" type="submit">إرسال الرد</button></form></article>`}).join(''):'<div class="empty">لا توجد رسائل من العملاء بعد.</div>';
  box.querySelectorAll('.admin-reply-form').forEach(form=>form.addEventListener('submit',async e=>{e.preventDefault();const textarea=form.querySelector('textarea'),message=textarea.value.trim(),uid=form.dataset.userId;if(!message)return;const btn=form.querySelector('button');btn.disabled=true;try{const {error}=await db.from('support_messages').insert({user_id:uid,sender_role:'admin',message});if(error)throw error;textarea.value='';await refreshAdminMessages();}catch(err){fenkToast('تعذر إرسال الرد.','error')}finally{btn.disabled=false}}));
  initIcons();
}

async function refreshAdmin(){
  const [or,ur]=await Promise.all([db.from('orders').select('*').order('created_at',{ascending:false}),db.from('profiles').select('*').order('created_at',{ascending:false})]);
  if(or.error){$('recentOrders').innerHTML='<div class="empty">تعذر تحميل الطلبات.</div>';return}
  cachedOrders=or.data||[];$('sTotal').textContent=cachedOrders.length;$('sNew').textContent=cachedOrders.filter(o=>canonicalStatus(o.status)==='received').length;$('sPaid').textContent=cachedOrders.filter(o=>canonicalStatus(o.status)==='payment_confirmed').length;$('sDone').textContent=cachedOrders.filter(o=>o.status==='delivered').length;$('recentOrders').innerHTML=cachedOrders.length?cachedOrders.slice(0,8).map(orderRow).join(''):'<div class="empty">لا توجد طلبات بعد.</div>';renderOrders(cachedOrders);initIcons();
  const users=ur.data||[];$('usersTable').innerHTML=users.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>الاسم</th><th>اللقب</th><th>الهاتف</th><th>التاريخ</th></tr></thead><tbody>${users.map(u=>`<tr><td>${esc(u.first_name||'—')}</td><td>${esc(u.last_name||'—')}</td><td>${esc(u.phone||'—')}</td><td>${formatDate(u.created_at)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">لا يوجد مستخدمون بعد.</div>';
}

async function openOrderDetail(id){
  const order=cachedOrders.find(o=>o.id===id);if(!order)return;selectedOrderId=id;
  $('detailOrderNumber').textContent=`#${order.order_number}`;$('detailProductPrice').value=(order.product_price!=null&&Number(order.product_price)>0)?order.product_price:'';$('detailShipping').value=(order.shipping_fee!=null&&Number(order.shipping_fee)>0)?order.shipping_fee:'';$('detailService').value=(order.service_fee!=null&&Number(order.service_fee)>0)?order.service_fee:'';$('detailTotalPrice').value=(order.total_price!=null&&Number(order.total_price)>0)?order.total_price:'';$('detailStatus').value=canonicalStatus(order.status);$('detailCarrierName').value=order.carrier_name||'';$('detailTrackingNumber').value=order.tracking_number||'';$('detailTrackingUrl').value=order.tracking_url||'';$('detailPaymentInfo').value=order.payment_info||'';$('detailAdminNote').value=order.admin_note||'';
  const wa=normalizeWhatsApp(order.customer_phone||'');$('whatsappOrder').href=wa?`https://wa.me/${wa}?text=${encodeURIComponent(`مرحبًا ${order.customer_first_name||''}، معك FENK بخصوص طلبك #${order.order_number}.`)}`:'#';
  $('orderDetailContent').innerHTML=`<div class="detail-grid"><div><b>الاسم واللقب</b><span>${esc(`${order.customer_first_name||''} ${order.customer_last_name||''}`.trim()||'—')}</span></div><div><b>الهاتف</b><span>${esc(order.customer_phone||'—')}</span></div><div><b>الولاية</b><span>${esc(order.wilaya||'—')}</span></div><div><b>البلدية</b><span>${esc(order.commune||'—')}</span></div><div><b>الرمز البريدي</b><span>${esc(order.postal_code||'—')}</span></div><div class="full-field"><b>العنوان</b><span>${esc(order.address||'—')}</span></div><div><b>السلعة</b><span>${esc(order.product_name||'—')}</span></div><div><b>معلومات السلعة</b><span>${esc(order.product_info||'—')}</span></div><div><b>رابط السلعة</b><span>${order.product_url?`<a href="${esc(order.product_url)}" target="_blank" rel="noopener">فتح الرابط</a>`:'—'}</span></div><div><b>الكمية</b><span>${Number(order.quantity)||1}</span></div><div><b>تاريخ الطلب</b><span>${formatDate(order.created_at)}</span></div></div>`;
  $('orderDetailModal')?.classList.add('show');const proofHost=document.createElement('div');proofHost.className='proof-host';$('orderDetailContent')?.appendChild(proofHost);showProofLink(order,proofHost);initIcons();
}
function normalizeWhatsApp(phone){let p=String(phone||'').replace(/\D/g,'');if(p.startsWith('00'))p=p.slice(2);if(p.startsWith('0'))p='213'+p.slice(1);return p}
function normalizeAlgerianPhone(phone){let p=String(phone||'').replace(/\D/g,'');if(p.startsWith('00213'))p=p.slice(2);if(p.startsWith('213'))p=p.slice(3);if(p.length===9&&/^[567]/.test(p))return '+213'+p;if(p.length===10&&/^0[567]/.test(p))return '+213'+p.slice(1);return ''}
function validAlgerianPhone(phone){return /^\+213[567]\d{8}$/.test(normalizeAlgerianPhone(phone));}
function openFenkWhatsApp(message='مرحبًا FENK، أريد الاستفسار عن خدمة الطلب.') { window.open(`https://wa.me/${FENK_WHATSAPP}?text=${encodeURIComponent(message)}`,'_blank','noopener'); }
$('closeOrderDetail')?.addEventListener('click',()=>$('orderDetailModal')?.classList.remove('show'));
$('orderDetailModal')?.addEventListener('click',e=>{if(e.target===$('orderDetailModal'))$('orderDetailModal').classList.remove('show')});
$('saveOrderDetail')?.addEventListener('click',async()=>{
  if(!selectedOrderId)return;const b=$('saveOrderDetail');b.disabled=true;b.textContent='جارٍ الحفظ…';
  try{
    const productRaw=$('detailProductPrice').value,shippingRaw=$('detailShipping').value,serviceRaw=$('detailService').value;const productPrice=productRaw===''?null:Number(productRaw),shipping=shippingRaw===''?null:Number(shippingRaw),service=serviceRaw===''?null:Number(serviceRaw);if([productPrice,shipping,service].some(x=>x!==null&&(!Number.isFinite(x)||x<0)))throw new Error('تحقق من قيم الأسعار.');const total=productPrice!==null&&shipping!==null&&service!==null?productPrice+shipping+service:null;let status=$('detailStatus').value;if(status==='pricing'&&(!Number.isFinite(total)||total<=0))throw new Error('لا يمكن اعتماد حالة «تم تحديد السعر» قبل إدخال سعر المنتج والشحن والخدمة والمجموع أكبر من صفر.');if(total!==null&&total>0&&status==='received')status='pricing';
    const {data,error}=await db.from('orders').update({product_price:productPrice,shipping_fee:shipping,service_fee:service,status,carrier_name:$('detailCarrierName').value.trim()||null,tracking_number:$('detailTrackingNumber').value.trim()||null,tracking_url:$('detailTrackingUrl').value.trim()||null,payment_info:$('detailPaymentInfo').value.trim()||null,admin_note:$('detailAdminNote').value.trim()||null,updated_at:new Date().toISOString()}).eq('id',selectedOrderId).select().single();if(error)throw error;
    setMessage($('orderDetailMsg'),'تم حفظ التعديلات ✓','success');await refreshAdmin();
  }catch(e){setMessage($('orderDetailMsg'),'تعذر حفظ التعديلات، حاول مرة أخرى.','error')}finally{b.disabled=false;b.textContent='حفظ التعديلات'}
});

function updateAuthUI(user){const label=user?`مسجل: ${user.user_metadata?.full_name||'مستخدم FENK'}`:'تسجيل الدخول';if($('accountBtn'))$('accountBtn').title=label;if($('mobileAccount'))$('mobileAccount').title=label}

async function handleOAuthCallback(){
  try{
    const u=new URL(location.href), code=u.searchParams.get('code');
    if(!code)return false;
    const {error}=await db.auth.exchangeCodeForSession(code);
    if(error)throw error;
    u.searchParams.delete('code');u.searchParams.delete('state');
    history.replaceState({},document.title,u.pathname+(u.searchParams.toString()?'?'+u.searchParams.toString():'')+u.hash);
    return true;
  }catch(e){console.error('OAuth callback:',e);openAuth('تعذر إكمال تسجيل الدخول عبر Google. حاول مرة أخرى.');return false;}
}

db.auth.onAuthStateChange((_event,session)=>{
  updateAuthUI(session?.user||null);
  if(_event==='SIGNED_IN' && session?.user){
    closeAuth();
    setTimeout(()=>{fillOrderContact(session.user);updateNotificationBadge(session.user.id)},0);
    try{
      const returnUrl=sessionStorage.getItem('fenk_login_return_url');
      if(returnUrl){
        sessionStorage.removeItem('fenk_login_return_url');
        const u=new URL(returnUrl,location.origin);
        if(u.origin===location.origin && u.pathname.endsWith('/game-topup.html')){
          window.location.replace(u.href);
          return;
        }
      }
    }catch{}
  }
  if(_event==='SIGNED_OUT'){closeAuth();}
  updateNotificationBadge(session?.user?.id||null);updateMessageBadge(session?.user?.id||null);
  startFenkNotificationRealtime(session?.user||null);
  if(session){setTimeout(async()=>{await fillOrderContact(session.user);const admin=await isAdmin();if($('adminBtn'))$('adminBtn').style.display=admin?'block':'none'},0)}else if($('adminBtn'))$('adminBtn').style.display='none';
});
(async()=>{
  await handleOAuthCallback();
  const {data:{session}}=await db.auth.getSession();
  updateAuthUI(session?.user||null);updateNotificationBadge(session?.user?.id||null);updateMessageBadge(session?.user?.id||null);
  await startFenkNotificationRealtime(session?.user||null);
  if(session){await fillOrderContact(session.user);if(await isAdmin())$('adminBtn').style.display='block';}
})();

// Open the existing FENK login modal when a protected action sends a guest here.
// The login modal remains the single source of truth for Google authentication.
if(new URLSearchParams(location.search).get('login')==='1'){
  setTimeout(()=>openAuth('سجّل الدخول إلى حساب FENK لتأكيد طلبك، وبعد تسجيل الدخول سنعيدك تلقائيًا إلى طلب اللعبة.'),250);
}

document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;['authModal','profileModal','messagesModal','notificationsModal','customerOrdersModal','orderDetailModal','marketModal','fenkInfoModal','adminPanel'].forEach(id=>$(id)?.classList.remove('show'))});
document.querySelectorAll('video').forEach(v=>v.addEventListener('error',()=>v.closest('.video-card')?.classList.add('video-fallback')));
document.querySelectorAll('[data-fenk-whatsapp]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();openFenkWhatsApp();}));
getCurrentUser().then(user=>updateAuthUI(user));
// Handle OAuth provider errors without retaining stale query parameters.
(function(){try{const u=new URL(location.href),p=u.searchParams,err=p.get('error_code')||p.get('error');if(err){openAuth(err==='access_denied'?'تم إلغاء تسجيل الدخول عبر Google.':'تعذر إكمال تسجيل الدخول عبر Google. تحقق من إعدادات Google ثم حاول مرة أخرى.');p.delete('error');p.delete('error_code');p.delete('error_description');history.replaceState({},document.title,u.pathname+(p.toString()?'?'+p.toString():'')+u.hash)}}catch(e){console.warn('OAuth return:',e)}})();


(function(){
  const ids=['calcProductUsd','calcRate','calcShipping','calcService'];
  const out=$('calcTotal'); if(!out)return;
  const update=()=>{
    const usd=Number($(ids[0]).value)||0, rate=Number($(ids[1]).value)||0, ship=Number($(ids[2]).value)||0, service=Number($(ids[3]).value)||0;
    const total=usd*rate+ship+service;
    out.textContent=`${Math.max(0,total).toLocaleString('ar-DZ')} دج`;
  };
  ids.forEach(id=>$(id)?.addEventListener('input',update)); update();
})();
initIcons();// V73: register the service worker when push is already enabled, without prompting.
(async()=>{
  try{
    const user=await getCurrentUser();
    if(user&&localStorage.getItem('fenk_push_enabled_v1')==='on'&&'serviceWorker' in navigator){
      const reg=await registerFenkPushServiceWorker();
      const sub=await reg?.pushManager?.getSubscription();
      if(sub)await saveFenkPushSubscription(sub,user);
    }
    const q=new URLSearchParams(location.search); const oid=q.get('order'); const nid=q.get('notification'); const messages=q.get('messages');
    if(user&& (oid||nid||messages)){
      history.replaceState({},'',location.pathname+location.hash);
      if(oid){setTimeout(()=>openCustomerOrderDetail(oid),450);}
      else if(messages==='1'){setTimeout(()=>openMessages(),450);}
      else if(nid){setTimeout(()=>openNotifications(),450);}
    }
  }catch(e){console.warn('FENK V73 push startup:',e)}
})();
window.FENK={version:'V73-WEB-PUSH',supabaseUrl:SUPABASE_URL,oauthRedirect:'https://dzfenk.github.io/FENK-DZ/index.html'};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){getCurrentUser().then(u=>{if(u?.id){updateNotificationBadge(u.id);updateMessageBadge(u.id)}}).catch(()=>{})}});
window.addEventListener('focus',()=>{getCurrentUser().then(u=>{if(u?.id){updateNotificationBadge(u.id);updateMessageBadge(u.id)}}).catch(()=>{})});


/* V37: live customer notification listener. The DB trigger creates the notification;
   this listener makes the bell/badge and in-site toast update without a page refresh. */
let fenkNotificationChannel=null;
let fenkLastUnreadCount=0;
let fenkOriginalTitle=document.title;
const FENK_GUEST_NOTIFICATION_KEY='fenk_guest_notification_v1';
function setGuestNotificationAlert(show){
  const box=$('guestNotificationAlert');
  if(!box)return;
  if(show)box.removeAttribute('hidden');else box.setAttribute('hidden','');
  if(show)initIcons();
}
function rememberGuestNotificationState(hasUnread){
  try{localStorage.setItem(FENK_GUEST_NOTIFICATION_KEY,hasUnread?'1':'0')}catch{}
}
function updateFenkDocumentBadge(count){
  const n=Number(count||0);
  document.title=n?`(${n>99?'99+':n}) FENK — يجيبلك`:fenkOriginalTitle;
  const badge=$('notificationBadge');
  if(badge){badge.setAttribute('aria-label',n?`لديك ${n} إشعار غير مقروء`:'لا توجد إشعارات غير مقروءة');}
}
function showFenkBrowserNotification(n){
  try{
    if(localStorage.getItem('fenk_notifications_pref_v1')==='off')return;
    if(!('Notification' in window) || Notification.permission!=='granted')return;
    const title=n?.title||'إشعار جديد من FENK';
    const body=notificationMessage(n)||n?.message||'لديك تحديث جديد في FENK';
    const note=new Notification(title,{body,icon:'assets/logo-clean.webp',tag:`fenk-${n?.id||Date.now()}`,renotify:true});
    note.onclick=()=>{window.focus();openNotifications();note.close();};
  }catch(e){console.warn('FENK browser notification:',e)}
}
const FENK_VAPID_PUBLIC_KEY='BCbZy-gZlKkLKtt3lk2TDqb-2Bfqb-yOkaci6iqgYHg5cWYJ1NRfWvkrZpxlQSZhh2mCN5yVOxCH3I-lbEVTF8g';
function fenkUrlBase(){return new URL('.',location.href).href;}
function fenkBase64ToUint8Array(base64){const pad='='.repeat((4-base64.length%4)%4);const raw=atob((base64+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));}
async function registerFenkPushServiceWorker(){
  if(!('serviceWorker' in navigator)||!('PushManager' in window))return null;
  const reg=await navigator.serviceWorker.register(`${fenkUrlBase()}sw.js`,{scope:fenkUrlBase()});
  await navigator.serviceWorker.ready;
  return reg;
}
async function saveFenkPushSubscription(subscription,user){
  const json=subscription.toJSON();
  const endpoint=json.endpoint||subscription.endpoint;
  const p256dh=json.keys?.p256dh, auth=json.keys?.auth;
  if(!endpoint||!p256dh||!auth||!user?.id)throw new Error('تعذر إنشاء اشتراك الإشعارات.');
  const {error}=await db.from('web_push_subscriptions').upsert({user_id:user.id,endpoint,p256dh,auth,user_agent:navigator.userAgent},{onConflict:'user_id,endpoint'});
  if(error)throw error;
}
async function enableFenkNotifications(){
  if(!('Notification' in window))return false;
  try{
    const permission=await Notification.requestPermission();
    if(permission!=='granted')return false;
    const user=await getCurrentUser(); if(!user)return false;
    const reg=await registerFenkPushServiceWorker(); if(!reg)return false;
    let sub=await reg.pushManager.getSubscription();
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:fenkBase64ToUint8Array(FENK_VAPID_PUBLIC_KEY)});
    await saveFenkPushSubscription(sub,user);
    localStorage.setItem('fenk_push_enabled_v1','on');
    fenkToast('🔔 تم تفعيل إشعارات FENK على هاتفك.','success');
    return true;
  }catch(e){console.warn('FENK Web Push:',e);return false;}
}
async function disableFenkNotifications(){
  try{
    const user=await getCurrentUser();
    const reg=await navigator.serviceWorker?.getRegistration(fenkUrlBase());
    const sub=await reg?.pushManager?.getSubscription();
    if(sub&&user?.id)await db.from('web_push_subscriptions').delete().eq('user_id',user.id).eq('endpoint',sub.endpoint);
    if(sub)await sub.unsubscribe();
  }catch(e){console.warn('FENK Web Push disable:',e)}
  localStorage.setItem('fenk_push_enabled_v1','off');
}
async function startFenkNotificationRealtime(user){
  if(fenkNotificationChannel){try{await db.removeChannel(fenkNotificationChannel)}catch(e){} fenkNotificationChannel=null;}
  fenkLastUnreadCount=0;
  updateFenkDocumentBadge(0);
  if(!user?.id)return;
  const initial=await getUnreadCount(user.id);
  fenkLastUnreadCount=initial;
  await updateNotificationBadge(user.id);
  await updateMessageBadge(user.id);
  const channelName=`fenk-notifications-${user.id}`;
  fenkNotificationChannel=db.channel(channelName)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'order_notifications',filter:`recipient_user_id=eq.${user.id}`},async payload=>{
      const n=payload?.new||{};
      fenkLastUnreadCount=Math.max(0,fenkLastUnreadCount+1);
      rememberGuestNotificationState(true);
      await updateNotificationBadge(user.id);
      updateFenkDocumentBadge(fenkLastUnreadCount);
      const pref=localStorage.getItem('fenk_notifications_pref_v1');
      if(pref!=='off'){
        fenkToast(`🔔 ${n.title||'لديك إشعار جديد من FENK'}`,'success');
        showFenkBrowserNotification(n);
      }
    })
    .subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.warn('FENK notification realtime:',status);});
}


/* V15 account, settings, saved addresses, customer order detail, payment proof, review and smart assistant */
const FENK_APP_THEME_KEY='fenk_theme_v1', FENK_ADDR_KEY='fenk_addresses_v1', FENK_NOTIF_KEY='fenk_notifications_pref_v1';
const customerStatusOrder=statusOrder;
function getSavedAddresses(){try{return JSON.parse(localStorage.getItem(FENK_ADDR_KEY)||'[]')}catch{return []}}
function setSavedAddresses(a){localStorage.setItem(FENK_ADDR_KEY,JSON.stringify(a))}
function applyTheme(theme){const t=theme||localStorage.getItem(FENK_APP_THEME_KEY)||'system';document.documentElement.dataset.theme=t;document.body.classList.toggle('fenk-dark',t==='dark');if(t==='system'){const dark=window.matchMedia?.('(prefers-color-scheme: dark)').matches;document.body.classList.toggle('fenk-dark',!!dark)}}
applyTheme();window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if((localStorage.getItem(FENK_APP_THEME_KEY)||'system')==='system')applyTheme('system')});

async function openAccountModal(user=null){
  const current=user||await getCurrentUser();if(!current)return openAuth('سجّل الدخول أولًا باستخدام Google.');
  const p=await getProfile(current),v=profileValues(current,p);
  $('accountName')&&( $('accountName').textContent=`${v.first_name} ${v.last_name}`.trim()||'مستخدم FENK');
  $('accountPhone')&&($('accountPhone').textContent=formatPhoneDisplay(v.phone));$('accountPhoneRow')&&($('accountPhoneRow').textContent=formatPhoneDisplay(v.phone));
  $('accountEmail')&&($('accountEmail').textContent=current.email||'حساب FENK');
  const n=await getUnreadCount(current.id);if($('accountNotifCount'))$('accountNotifCount').textContent=n?String(n):'';
  const addresses=getSavedAddresses();
  if($('accountAddressesState'))$('accountAddressesState').textContent=addresses.length?`${addresses.length} عنوان محفوظ`:'لم تتم إضافة عنوان';
  const [{count:orderCount},{count:messageCount}]=await Promise.all([
    db.from('orders').select('id',{count:'exact',head:true}).eq('user_id',current.id),
    db.from('support_messages').select('id',{count:'exact',head:true}).eq('user_id',current.id)
  ]);
  if($('accountOrdersState'))$('accountOrdersState').textContent=Number(orderCount||0)?`${Number(orderCount)} طلب`:'لا توجد طلبات حاليًا';
  if($('accountMessagesState'))$('accountMessagesState').textContent=Number(messageCount||0)?`${Number(messageCount)} رسالة`:'لا توجد رسائل';
  const modal=$('accountModal'); if(modal){modal.classList.add('show'); const box=modal.querySelector('.account-box'); if(box){box.scrollTop=0; box.scrollLeft=0; requestAnimationFrame(()=>{box.scrollTop=0;}); setTimeout(()=>{box.scrollTop=0;},50);}} initIcons();
}
async function getUnreadCount(uid){try{const r=await db.rpc('get_my_unread_notification_count');if(!r.error)return Number(r.data||0)}catch{}const {count}=await db.from('order_notifications').select('id',{count:'exact',head:true}).eq('recipient_user_id',uid).eq('is_read',false);return Number(count||0)}
$('accountEditProfile')?.addEventListener('click',async()=>{ $('accountModal')?.classList.remove('show'); await openProfileModal(); });$('accountPhoneEdit')?.addEventListener('click',async()=>{ $('accountModal')?.classList.remove('show'); await openProfileModal(); });
$('accountOrders')?.addEventListener('click',async()=>{ $('accountModal')?.classList.remove('show'); await openCustomerOrders(); });
$('accountNotifications')?.addEventListener('click',async()=>{ $('accountModal')?.classList.remove('show'); await openNotifications(); });
$('accountMessages')?.addEventListener('click',async()=>{ $('accountModal')?.classList.remove('show'); await openMessages(); });
$('accountAddresses')?.addEventListener('click',async()=>{ $('accountModal')?.classList.remove('show'); await openAddresses(); });
$('accountSettings')?.addEventListener('click',()=>{ $('accountModal')?.classList.remove('show'); openSettings(); });
function openFenkAIModal(){
  $('mobileFabMenu')?.setAttribute('hidden','');
  $('mobileFab')?.setAttribute('aria-expanded','false');
  $('fenkAiModal')?.classList.add('show');
  initIcons();
  initFenkVoice();
  setTimeout(()=>$('aiInput')?.focus({preventScroll:true}),120);
}
$('accountAI')?.addEventListener('click',()=>{ $('accountModal')?.classList.remove('show'); openFenkAIModal(); });

// Mobile FENK assistant menu — wire every action explicitly.
$('mobileFab')?.addEventListener('click',()=>{
  const menu=$('mobileFabMenu');
  if(!menu)return;
  const willOpen=menu.hasAttribute('hidden');
  if(willOpen)menu.removeAttribute('hidden'); else menu.setAttribute('hidden','');
  $('mobileFab')?.setAttribute('aria-expanded',willOpen?'true':'false');
  initIcons();
});
document.querySelectorAll('[data-fab-action]').forEach(btn=>btn.addEventListener('click',()=>{
  const action=btn.dataset.fabAction;
  $('mobileFabMenu')?.setAttribute('hidden','');
  $('mobileFab')?.setAttribute('aria-expanded','false');
  if(action==='ai') return openFenkAIModal();
  if(action==='order'){
    document.querySelector('#order')?.scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(()=>$('productUrl')?.focus({preventScroll:true}),450);
    return;
  }
  if(action==='game'){
    location.href='game-topup.html?v=129';
    return;
  }
  if(action==='ad'){ location.href='marketplace.html#publish'; return; }
}));
$('accountWhatsApp')?.addEventListener('click',()=>openFenkWhatsApp());
$('accountHelp')?.addEventListener('click',()=>openFenkWhatsApp('مرحبًا FENK، أحتاج مساعدة بخصوص خدمة الطلب.'));
$('accountData')?.addEventListener('click',()=>fenkToast('يمكنك تعديل معلوماتك وإدارة عناوينك من حسابك. لحماية الحساب، لا نعرض بياناتك للزوار.','info'));
$('accountLogout')?.addEventListener('click',async()=>{
  if(!(await fenkConfirm('هل تريد تسجيل الخروج من FENK؟')))return;
  try{
    const user=await getCurrentUser();
    if(user?.id){const unread=await getUnreadCount(user.id);rememberGuestNotificationState(Number(unread||0)>0)}
  }catch(e){console.warn('Guest notification state:',e)}
  await db.auth.signOut();$('accountModal')?.classList.remove('show');location.reload();
});
$('closeAccount')?.addEventListener('click',()=>$('accountModal')?.classList.remove('show'));
$('accountModal')?.addEventListener('click',e=>{if(e.target===$('accountModal'))$('accountModal').classList.remove('show')});

function openSettings(){
  const theme=localStorage.getItem(FENK_APP_THEME_KEY)||'system';const notif=localStorage.getItem(FENK_NOTIF_KEY)!=='off';
  document.querySelectorAll('input[name="fenkTheme"]').forEach(x=>x.checked=x.value===theme);if($('settingsNotifications'))$('settingsNotifications').checked=notif;$('settingsModal')?.classList.add('show');initIcons();
}
document.querySelectorAll('input[name="fenkTheme"]').forEach(x=>x.addEventListener('change',()=>{localStorage.setItem(FENK_APP_THEME_KEY,x.value);applyTheme(x.value)}));
$('settingsNotifications')?.addEventListener('change',async e=>{
  localStorage.setItem(FENK_NOTIF_KEY,e.target.checked?'on':'off');
  if(e.target.checked){const ok=await enableFenkNotifications();if(!ok){e.target.checked=false;localStorage.setItem(FENK_NOTIF_KEY,'off');fenkToast('فعّل إشعارات FENK من إعدادات المتصفح لتصلك التنبيهات حتى لا تفوتك.','info')}}
  else await disableFenkNotifications();
});
$('closeSettings')?.addEventListener('click',()=>$('settingsModal')?.classList.remove('show'));$('settingsModal')?.addEventListener('click',e=>{if(e.target===$('settingsModal'))$('settingsModal').classList.remove('show')});

async function openAddresses(){
  const list=getSavedAddresses();renderAddresses(list);$('addressesModal')?.classList.add('show');initIcons();
}
function renderAddresses(list){const box=$('addressesList');if(!box)return;box.innerHTML=list.length?list.map((a,i)=>`<article class="saved-address ${a.primary?'primary':''}"><div><b>${esc(a.label||'العنوان الرئيسي')}</b>${a.primary?'<span class="address-badge">الرئيسي</span>':''}</div><p>${esc(a.full_name||'')} • ${esc(a.phone||'')}<br>${esc(a.wilaya||'')}، ${esc(a.commune||'')}<br>${esc(a.address||'')} ${a.postal_code?`• ${esc(a.postal_code)}`:''}</p><div class="address-actions"><button type="button" data-use-address="${i}">استخدام</button><button type="button" data-primary-address="${i}">جعله رئيسيًا</button><button type="button" data-delete-address="${i}">حذف</button></div></article>`).join(''):'<div class="empty">لا توجد عناوين محفوظة. أضف عنوانك مرة واحدة وسيتم استعماله في الطلبات القادمة.</div>';
  box.querySelectorAll('[data-use-address]').forEach(b=>b.addEventListener('click',()=>{fillOrderFromAddress(list[Number(b.dataset.useAddress)]);$('addressesModal')?.classList.remove('show');document.querySelector('#order')?.scrollIntoView({behavior:'smooth'})}));
  box.querySelectorAll('[data-primary-address]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.primaryAddress);const n=list.map((a,j)=>({...a,primary:i===j}));setSavedAddresses(n);renderAddresses(n)}));
  box.querySelectorAll('[data-delete-address]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.deleteAddress);list.splice(i,1);setSavedAddresses(list);renderAddresses(list)}));
}
function fillOrderFromAddress(a){if(!a)return;[['orderFirstName',a.first_name||a.full_name?.split(' ')[0]||''],['orderLastName',a.last_name||a.full_name?.split(' ').slice(1).join(' ')||''],['orderPhone',a.phone||''],['orderWilaya',a.wilaya||''],['orderCommune',a.commune||''],['orderPostalCode',a.postal_code||''],['orderAddress',a.address||'']].forEach(([id,v])=>{if($(id))$(id).value=v})}
$('addAddress')?.addEventListener('click',async()=>{const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا.');$('addressForm')?.reset();const p=await getProfile(user),v=profileValues(user,p);if($('addressFirstName'))$('addressFirstName').value=v.first_name;if($('addressLastName'))$('addressLastName').value=v.last_name;if($('addressPhone'))$('addressPhone').value=v.phone;$('addressEditModal')?.classList.add('show')});
$('closeAddresses')?.addEventListener('click',()=>$('addressesModal')?.classList.remove('show'));$('addressesModal')?.addEventListener('click',e=>{if(e.target===$('addressesModal'))$('addressesModal').classList.remove('show')});
$('closeAddressEdit')?.addEventListener('click',()=>$('addressEditModal')?.classList.remove('show'));$('addressEditModal')?.addEventListener('click',e=>{if(e.target===$('addressEditModal'))$('addressEditModal').classList.remove('show')});


async function openCustomerOrderDetail(id){
  const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا.');
  $('customerOrderDetailContent').innerHTML='<div class="empty">جارٍ تحميل تفاصيل الطلب…</div>';$('customerOrderDetailModal')?.classList.add('show');
  const {data:o,error}=await db.from('orders').select('*').eq('id',id).eq('user_id',user.id).single();if(error||!o)return $('customerOrderDetailContent').innerHTML='<div class="empty">تعذر تحميل تفاصيل الطلب.</div>';
  const total=(o.total_price!=null&&Number(o.total_price)>0)?Number(o.total_price):null;const ship=total!==null?Number(o.shipping_fee||0):null;const service=total!==null?Number(o.service_fee||0):null;const prod=total!==null?(o.product_price!=null?Number(o.product_price):total-ship-service):null;
  const priced=total!==null;const priceHtml=priced?`<div class="price-card"><div><span>سعر المنتج</span><b>${formatFinalMoney(prod,o.currency)}</b></div><div><span>الشحن</span><b>${formatFinalMoney(ship,o.currency)}</b></div><div><span>خدمة FENK</span><b>${formatFinalMoney(service,o.currency)}</b></div><div class="price-total"><span>المجموع</span><b>${formatFinalMoney(total,o.currency)}</b></div></div>`:'<div class="pending-price"><b>⏳ جاري مراجعة السعر</b><div>سيقوم فريق FENK بحساب سعر المنتج والشحن وخدمة FENK.</div><div>ستظهر لك القيمة النهائية هنا قبل الدفع.</div></div>';
  let paymentHtml='';
  if(canonicalStatus(o.status)==='awaiting_payment' && o.payment_method==='barid_mob'){
    let paymentText=String(o.payment_info||'').trim();
    if(!paymentText || paymentText.startsWith('PROOF_PATH:')){
      const ps=await db.from('payment_settings').select('display_name,account_number,phone_number,instructions,is_active').eq('method','barid_mob').eq('is_active',true).maybeSingle();
      if(!ps.error && ps.data?.account_number){
        paymentText=`طريقة الدفع: ${ps.data.display_name||'بريد موب'}\nRIP: ${ps.data.account_number}${ps.data.phone_number?`\nالهاتف: ${ps.data.phone_number}`:''}${ps.data.instructions?`\n${ps.data.instructions}`:''}`;
      }else if(o.payment_method==='barid_mob'){
        paymentText='طريقة الدفع: بريد موب\nRIP: 00799999002385072872\nحوّل المبلغ ثم أرسل صورة وصل الدفع.';
      }
    }
    if(paymentText && !paymentText.startsWith('PROOF_PATH:')) paymentHtml=`<div class="customer-payment-card"><h4>💳 معلومات الدفع — بريد موب</h4><pre>${esc(paymentText)}</pre><small>بعد التحويل، أرسل صورة وصل الدفع من زر «إرسال وصل الدفع».</small></div>`;
  }
  $('customerOrderDetailNumber').textContent=`#${o.order_number}`;
  $('customerOrderDetailContent').innerHTML=`<div class="customer-order-summary">${o.product_image_url?`<div class="order-image-note">🖼️ تم إرفاق صورة المنتج</div>`:''}<h3>${esc(o.product_name||o.product_info||'طلب منتج')}</h3>${o.game_id||o.package_id?`<div class="game-order-meta"><span>🎮 لعبة: ${esc(o.player_data?.game||o.product_name||'—')}</span><span>📦 الباقة: ${esc(o.player_data?.package||'—')}</span>${o.player_id?`<span>🆔 Player ID: ${esc(o.player_id)}</span>`:''}</div>`:''}<p>الكمية: ${Number(o.quantity)||1} • ${formatDate(o.created_at)}</p>${priceHtml}${paymentHtml}<div class="detail-status-preview"><span>الحالة الحالية</span><b>${esc(trackingStatusLabelV19(o.status,!!(o.game_id||o.package_id)))}</b></div><div class="order-contact-actions"><button class="send tracking-open-btn" type="button" id="customerTrackOrderBtn">📦 عرض تتبع الطلب</button><a class="whatsapp-order-btn" href="https://wa.me/${FENK_WHATSAPP}?text=${encodeURIComponent(`مرحبًا FENK، بخصوص طلبي #${o.order_number}.`)}" target="_blank" rel="noopener">💬 تواصل عبر WhatsApp</a>${canonicalStatus(o.status)==='awaiting_payment'?'<button class="send" type="button" id="customerPayProofBtn">💳 إرسال وصل الدفع</button>':''}${o.status==='delivered'?'<button class="send secondary" type="button" id="reorderBtn">🔄 طلب نفس المنتج مرة أخرى</button>':''}</div></div>`;
  $('customerPayProofBtn')?.addEventListener('click',()=>openPaymentProof(o));$('customerTrackOrderBtn')?.addEventListener('click',()=>{ $('customerOrderDetailModal')?.classList.remove('show'); openCustomerTrackingV19(o.id); });$('reorderBtn')?.addEventListener('click',()=>reorderFromOrder(o));
  initIcons();
}
function reorderFromOrder(o){$('customerOrderDetailModal')?.classList.remove('show');if($('productUrl'))$('productUrl').value=o.product_url||'';if($('productName'))$('productName').value=o.product_name||'';if($('productInfo'))$('productInfo').value=o.product_info||'';qty=Number(o.quantity)||1;if($('qty'))$('qty').textContent=String(qty);document.querySelector('#order')?.scrollIntoView({behavior:'smooth'})}
$('closeCustomerOrderDetail')?.addEventListener('click',()=>$('customerOrderDetailModal')?.classList.remove('show'));$('customerOrderDetailModal')?.addEventListener('click',e=>{if(e.target===$('customerOrderDetailModal'))$('customerOrderDetailModal').classList.remove('show')});

async function openPaymentProof(order){$('paymentProofOrderId').value=order.id;$('paymentProofFile').value='';$('paymentProofMsg').textContent='';$('paymentProofModal')?.classList.add('show');}
$('closePaymentProof')?.addEventListener('click',()=>$('paymentProofModal')?.classList.remove('show'));$('paymentProofModal')?.addEventListener('click',e=>{if(e.target===$('paymentProofModal'))$('paymentProofModal').classList.remove('show')});
$('paymentProofForm')?.addEventListener('submit',async e=>{e.preventDefault();const user=await getCurrentUser();if(!user)return openAuth('انتهت الجلسة.');const file=$('paymentProofFile')?.files?.[0],orderId=$('paymentProofOrderId')?.value;if(!file)return setMessage($('paymentProofMsg'),'اختر صورة الوصل.','error');if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)return setMessage($('paymentProofMsg'),'اختر JPG أو PNG أو WEBP بحجم لا يتجاوز 5MB.','error');const b=e.submitter;b.disabled=true;try{const ext=file.type.split('/')[1].replace('jpeg','jpg');const path=`${user.id}/payment-proof-${orderId}-${Date.now()}.${ext}`;const {error:upErr}=await db.storage.from('payment-proofs').upload(path,file,{contentType:file.type,upsert:false});if(upErr)throw upErr;let submitted=null;const rpc=await db.rpc('submit_payment_proof',{p_order_id:orderId,p_proof_path:path});if(!rpc.error){submitted=rpc.data;}else{const fallback=await db.from('orders').update({status:'payment_submitted',payment_info:`PROOF_PATH:${path}`}).eq('id',orderId).eq('user_id',user.id).eq('status','awaiting_payment').select().single();if(fallback.error)throw rpc.error;submitted=fallback.data;}if(!submitted)throw new Error('تعذر تسجيل وصل الدفع.');$('paymentProofModal')?.classList.remove('show');setMessage($('orderMsg'),'تم استلام وصل الدفع، وسيراجعه فريق FENK ✓','success');try{await openCustomerOrders();}catch(_){ }}catch(err){setMessage($('paymentProofMsg'),err?.message||'تعذر إرسال الوصل.','error')}finally{b.disabled=false}});

async function showProofLink(order,container){const pi=String(order.payment_info||'');if(!pi.startsWith('PROOF_PATH:')||!container)return;const path=pi.slice(11);const {data,error}=await db.storage.from('payment-proofs').createSignedUrl(path,3600);if(!error&&data?.signedUrl){const a=document.createElement('a');a.href=data.signedUrl;a.target='_blank';a.rel='noopener';a.className='proof-link';a.textContent='🧾 فتح وصل الدفع';container.appendChild(a)}}

// Make order cards clickable and show the richer detail view.
const _oldOpenCustomerOrders=openCustomerOrders;
openCustomerOrders=async function(){await _oldOpenCustomerOrders();const list=$('customerOrdersList');list?.querySelectorAll('.order-card').forEach(card=>{card.style.cursor='default';card.querySelector('.customer-detail-btn')?.addEventListener('click',e=>{e.stopPropagation();if(card.dataset.orderId)openCustomerOrderDetail(card.dataset.orderId)});})};

// FENK AI — secure Supabase Edge Function (OpenAI key stays server-side).
function aiReplyFallback(text){const t=String(text||'').toLowerCase();if(/بريد موب|دفع/.test(t))return 'الدفع في FENK يتم عبر بريد موب فقط. بعد تحديد السعر النهائي ستجد معلومات الدفع داخل تفاصيل الطلب.';if(/طلب|اشتر/.test(t))return 'أرسل رابط المنتج أو صورته، وسأساعدك في فهمه وتجهيز الطلب.';return 'مرحبًا 👋 أرسل سؤالك أو صورة المنتج وسأساعدك.'}
let aiSelectedImage=null;
async function fileToDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(file);});}
async function askFenkAI(message,imageData=''){
  const context={};
  const url=$('productUrl')?.value?.trim();
  const name=$('productName')?.value?.trim();
  const info=$('productInfo')?.value?.trim();
  if(url)context.url=url;if(name)context.title=name;if(info)context.description=info;
  const {data:{session},error:sessionError}=await db.auth.getSession();
  if(sessionError)throw new Error('تعذر التحقق من جلسة FENK. أعد تحميل الصفحة ثم حاول مرة أخرى.');
  if(!session?.access_token)throw new Error('سجّل الدخول إلى FENK أولًا لاستخدام FENK AI.');
  const endpoint=`${SUPABASE_URL}/functions/v1/fenk-ai`;
  const res=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','apikey':SUPABASE_KEY,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({message,image:imageData,uiLanguage:localStorage.getItem('fenk_language_v1')||'ar',productContext:Object.keys(context).length?context:null})});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){
    const code=String(data.code||'');
    if(res.status===401||res.status===403)throw new Error('انتهت جلسة FENK. سجّل الدخول ثم أعد المحاولة.');
    if(res.status===429||code==='RATE_LIMIT')throw new Error('FENK AI مشغول حاليًا. انتظر قليلًا ثم حاول مرة أخرى.');
    if(code==='OPENAI_AUTH'||code==='GEMINI_AUTH')throw new Error('مفتاح FENK AI غير صالح أو غير مفعّل.');
    if(code==='OPENAI_BILLING')throw new Error('خدمة الذكاء الاصطناعي تحتاج إلى تفعيل الفوترة في مشروع OpenAI.');if(code==='GEMINI_NOT_CONFIGURED')throw new Error(data.message||'أضف GEMINI_API_KEY إلى Supabase Secrets.');
    if(code==='OPENAI_REQUEST'||code==='GEMINI_REQUEST')throw new Error('تعذر معالجة طلب FENK AI. حاول برسالة أقصر أو بدون صورة.');
    throw new Error(data.message||'تعذر الاتصال بـ FENK AI حاليًا.');
  }
  return data.reply||aiReplyFallback(message);
}
$('aiImageBtn')?.addEventListener('click',()=>$('aiImage')?.click());
$('aiImage')?.addEventListener('change',()=>{aiSelectedImage=$('aiImage').files?.[0]||null;if($('aiImageName'))$('aiImageName').textContent=aiSelectedImage?`تم اختيار: ${aiSelectedImage.name}`:'بدون صورة';});
const FENK_VOICE_LANGS={ar:'ar-DZ',dz:'ar-DZ',fr:'fr-FR',en:'en-US',kab:'kab'};
let fenkVoiceRecognition=null,fenkVoiceListening=false,fenkVoiceEnabled=true;
function getFenkVoiceLang(){const lang=localStorage.getItem('fenk_language_v1')||'ar';return FENK_VOICE_LANGS[lang]||'ar-DZ'}
function setVoiceStatus(msg){if($('aiVoiceStatus'))$('aiVoiceStatus').textContent=msg}
function speakFenk(text){if(!fenkVoiceEnabled||!('speechSynthesis' in window)||!text)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text));u.lang=getFenkVoiceLang();u.rate=0.95;u.pitch=1;u.volume=1;window.speechSynthesis.speak(u)}
function stopFenkVoice(){try{fenkVoiceRecognition?.stop()}catch{};fenkVoiceListening=false;if($('aiMicBtn')){$('aiMicBtn').classList.remove('recording');$('aiMicBtn').querySelector('span')?.replaceChildren(document.createTextNode('تحدث'));}setVoiceStatus('اضغط «تحدث» وقل سؤالك')}
function initFenkVoice(){
  const mic=$('aiMicBtn'),speak=$('aiSpeakBtn'); if(!mic)return;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){mic.disabled=true;mic.title='المتصفح لا يدعم التعرف على الصوت';setVoiceStatus('التحدث الصوتي غير مدعوم في هذا المتصفح. جرّب Chrome.');}
  else if(!fenkVoiceRecognition){
    fenkVoiceRecognition=new SR();fenkVoiceRecognition.lang=getFenkVoiceLang();fenkVoiceRecognition.interimResults=true;fenkVoiceRecognition.continuous=false;
    fenkVoiceRecognition.onstart=()=>{fenkVoiceListening=true;mic.classList.add('recording');mic.querySelector('span')?.replaceChildren(document.createTextNode('استمع…'));setVoiceStatus('🎙️ أتكلم معك… قل سؤالك ثم اسكت قليلًا.');};
    fenkVoiceRecognition.onresult=e=>{let finalText='';for(let i=e.resultIndex;i<e.results.length;i++){const txt=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)finalText+=txt;}if(finalText){const input=$('aiInput');if(input){input.value=(input.value?input.value+' ':'')+finalText;input.dispatchEvent(new Event('input',{bubbles:true}));}setVoiceStatus('تم التقاط كلامك، جارٍ إرساله إلى FENK AI…');setTimeout(()=>$('aiForm')?.requestSubmit(),80);}};
    fenkVoiceRecognition.onerror=e=>{fenkVoiceListening=false;mic.classList.remove('recording');setVoiceStatus(e.error==='not-allowed'?'اسمح للمتصفح باستخدام الميكروفون من إعدادات الموقع.':'تعذر سماع الصوت. حاول مرة أخرى.');};
    fenkVoiceRecognition.onend=()=>{fenkVoiceListening=false;mic.classList.remove('recording');if(!($('aiVoiceStatus')?.textContent||'').includes('جارٍ إرساله'))setVoiceStatus('اضغط «تحدث» وقل سؤالك');};
  }
  mic.addEventListener('click',()=>{if(!fenkVoiceRecognition)return;if(fenkVoiceListening){stopFenkVoice();return;}try{fenkVoiceRecognition.lang=getFenkVoiceLang();fenkVoiceRecognition.start();}catch{setVoiceStatus('الميكروفون مشغول. حاول بعد لحظة.')}});
  speak?.addEventListener('click',()=>{fenkVoiceEnabled=!fenkVoiceEnabled;if(!fenkVoiceEnabled)window.speechSynthesis?.cancel();speak.querySelector('span')?.replaceChildren(document.createTextNode(fenkVoiceEnabled?'الصوت: تشغيل':'الصوت: إيقاف'));setVoiceStatus(fenkVoiceEnabled?'سيقرأ FENK AI ردوده بصوت عالٍ.':'تم إيقاف قراءة ردود FENK AI بصوت.');});
}
$('aiForm')?.addEventListener('submit',async e=>{e.preventDefault();const input=$('aiInput'),t=input.value.trim(),box=$('aiChat'),button=e.submitter||$('aiForm button[type="submit"]');if(!t&&!aiSelectedImage)return;const imageFile=aiSelectedImage;if(t)box.insertAdjacentHTML('beforeend',`<div class="ai-bubble mine">${esc(t)}</div>`);if(imageFile)box.insertAdjacentHTML('beforeend',`<div class="ai-bubble mine">📷 ${esc(imageFile.name)}</div>`);const loading=document.createElement('div');loading.className='ai-bubble';loading.textContent='🦊 FENK AI يفكر…';box.appendChild(loading);input.value='';if(button)button.disabled=true;box.scrollTop=box.scrollHeight;try{let imageData='';if(imageFile){if(!/^image\/(png|jpeg|webp)$/.test(imageFile.type)||imageFile.size>5*1024*1024)throw new Error('اختر صورة PNG أو JPG أو WEBP بحجم لا يتجاوز 5MB.');imageData=await fileToDataUrl(imageFile);}const reply=await askFenkAI(t,imageData);loading.textContent=reply;speakFenk(reply);setVoiceStatus(fenkVoiceEnabled?'يمكنك الضغط على «تحدث» لمتابعة الحوار.':'الصوت متوقف حاليًا.');aiSelectedImage=null;if($('aiImage'))$('aiImage').value='';if($('aiImageName'))$('aiImageName').textContent='بدون صورة';}catch(err){loading.textContent=err?.message||'تعذر تشغيل FENK AI حاليًا.';}finally{if(button)button.disabled=false;box.scrollTop=box.scrollHeight;}});
initFenkVoice();

$('closeFenkAi')?.addEventListener('click',()=>$('fenkAiModal')?.classList.remove('show'));$('fenkAiModal')?.addEventListener('click',e=>{if(e.target===$('fenkAiModal'))$('fenkAiModal').classList.remove('show')});

// Keep the saved primary address in sync with the order form after successful profile/order entry.
const _oldSendOrderHandlerNote=true;
$('order')?.addEventListener('submit',()=>{});

// Mobile navigation uses a fixed five/six-item layout in the HTML; keep the badge synced.
// V71 uses one canonical notification badge updater for header, mobile nav and document title.

// Do not auto-fill a saved address into a new order. Users can explicitly choose a saved address.



/* V17 reliability layer: canonical statuses, persistent addresses, direct notification routing and mobile-safe UI. */
const FENK_WILAYAS=['01 أدرار','02 الشلف','03 الأغواط','04 أم البواقي','05 باتنة','06 بجاية','07 بسكرة','08 بشار','09 البليدة','10 البويرة','11 تمنراست','12 تبسة','13 تلمسان','14 تيارت','15 تيزي وزو','16 الجزائر','17 الجلفة','18 جيجل','19 سطيف','20 سعيدة','21 سكيكدة','22 سيدي بلعباس','23 عنابة','24 قالمة','25 قسنطينة','26 المدية','27 مستغانم','28 المسيلة','29 معسكر','30 ورقلة','31 وهران','32 البيض','33 إليزي','34 برج بوعريريج','35 بومرداس','36 الطارف','37 تندوف','38 تيسمسيلت','39 الوادي','40 خنشلة','41 سوق أهراس','42 تيبازة','43 ميلة','44 عين الدفلى','45 النعامة','46 عين تموشنت','47 غرداية','48 غليزان','49 تيميمون','50 برج باجي مختار','51 أولاد جلال','52 بني عباس','53 إن صالح','54 إن قزام','55 تقرت','56 جانت','57 المغير','58 المنيعة','59 أفلو','60 بريكة','61 القنطرة','62 بئر العاتر','63 العريشة','64 قصر الشلالة','65 عين وسارة','66 مسعد','67 قصر البخاري','68 بوسعادة','69 الأبيض سيدي الشيخ'];
if(FENK_WILAYAS.length!==69) throw new Error('FENK requires exactly 69 wilayas');function populateWilayas(){['orderWilaya','addressWilaya'].forEach(id=>{const el=$(id);if(!el)return;const old=el.value;el.innerHTML='<option value="">اختر الولاية</option>'+FENK_WILAYAS.map(w=>`<option value="${esc(w)}">${esc(w)}</option>`).join('');if(old)el.value=old;});}
populateWilayas();
function phoneDisplayValue(v){const n=normalizeAlgerianPhone(v);return n?n.replace('+213',''):(String(v||'').startsWith('+213')?String(v).slice(4):String(v||''));}
function formatPhoneDisplay(v){const n=normalizeAlgerianPhone(v);return n?`+213 ${n.slice(4)}`:'أضف رقم هاتفك';}
['phone','orderPhone','addressPhone'].forEach(id=>{const el=$(id);if(el)el.value=phoneDisplayValue(el.value);el?.addEventListener('blur',()=>{const n=normalizeAlgerianPhone(el.value);if(n)el.value=n.replace('+213','');});});

// Direct notification -> exact order. No intermediate orders list.
openNotifications=async function(){
  const user=await getCurrentUser();
  if(!user)return openAuth('سجّل الدخول أولًا لعرض الإشعارات.');
  const box=$('notificationsList');
  if(!box)return;
  box.innerHTML='<div class="empty">جارٍ تحميل الإشعارات…</div>';
  $('notificationsModal')?.classList.add('show');$('notificationsModal')?.setAttribute('aria-hidden','false');

  // Prefer the RLS-safe RPC. It runs as the signed-in user and only returns rows for auth.uid().
  let {data,error}=await db.rpc('get_my_notifications');
  if(error){
    console.warn('Notifications RPC failed; using direct RLS query:',error);
    const direct=await db.from('order_notifications')
      .select('id,title,message,is_read,order_id,created_at')
      .eq('recipient_user_id',user.id)
      .order('created_at',{ascending:false}).limit(50);
    data=direct.data; error=direct.error;
  }
  if(error){
    box.innerHTML='<div class="empty error-empty">تعذر تحميل الإشعارات الآن. حاول مرة أخرى.<br><button type="button" id="retryNotifications" class="send" style="margin-top:12px;background:#eef7f3;color:#087c5b">إعادة المحاولة</button></div>';
    $('retryNotifications')?.addEventListener('click',()=>openNotifications(),{once:true});
    return;
  }

  const rows=Array.isArray(data)?data:[];
  box.innerHTML=rows.length
    ? `<div class="notifications-toolbar"><span>إشعارات حسابك فقط</span><button type="button" id="deleteReadNotifications" class="delete-read-btn">حذف المقروءة</button></div>`+
      rows.map(n=>`<article class="notification-item notification-clickable ${n.is_read?'':'unread'}" data-notification-id="${esc(n.id)}" data-order-id="${esc(n.order_id||'')}"><div class="notification-row"><div class="notification-main"><div class="notification-title"><i data-lucide="bell"></i><b>${esc(n.title||'تحديث FENK')}</b></div><p>${esc(notificationMessage(n))}</p><small>${formatDate(n.created_at)}${n.order_id?' • اضغط لفتح الطلب':''}</small></div><button type="button" class="notification-delete" data-delete-notification="${esc(n.id)}" aria-label="حذف الإشعار" title="حذف الإشعار"><i data-lucide="trash-2"></i></button></div></article>`).join('')
    : '<div class="empty">لا توجد إشعارات جديدة.</div>';

  box.querySelectorAll('.notification-clickable').forEach(item=>item.addEventListener('click',async e=>{
    if(e.target.closest('.notification-delete'))return;
    const nid=item.dataset.notificationId,oid=item.dataset.orderId;
    if(nid){
      const r=await db.rpc('mark_my_notification_read',{p_notification_id:nid});
      if(r.error){
        const fallback=await db.from('order_notifications').update({is_read:true}).eq('id',nid).eq('recipient_user_id',user.id);
        if(fallback.error)console.warn('Notification read failed:',fallback.error);
      }
    }
    item.classList.remove('unread');
    await updateNotificationBadge(user.id);
    if(oid){$('notificationsModal')?.classList.remove('show');await openCustomerOrderDetail(oid);}
  }));

  box.querySelectorAll('[data-delete-notification]').forEach(btn=>btn.addEventListener('click',async e=>{
    e.preventDefault();e.stopPropagation();
    const nid=btn.dataset.deleteNotification;if(!nid)return;
    if(!(await fenkConfirm('هل تريد حذف هذا الإشعار؟')))return;
    btn.disabled=true;
    const {data:deleted,error}=await db.rpc('delete_my_notification',{p_notification_id:nid});
    if(error||deleted!==true){
      btn.disabled=false;fenkToast('تعذر حذف الإشعار، حاول مرة أخرى.','error');return;
    }
    document.querySelector(`[data-notification-id="${CSS.escape(nid)}"]`)?.remove();
    await updateNotificationBadge(user.id);
    if(!box.querySelector('.notification-clickable'))box.innerHTML='<div class="empty">لا توجد إشعارات جديدة.</div>';
  }));

  $('deleteReadNotifications')?.addEventListener('click',async()=>{
    const btn=$('deleteReadNotifications');if(!btn)return;
    if(!(await fenkConfirm('حذف جميع الإشعارات المقروءة؟')))return;
    btn.disabled=true;btn.textContent='جارٍ الحذف…';
    const {error}=await db.rpc('delete_my_read_notifications');
    if(error){btn.disabled=false;btn.textContent='حذف المقروءة';fenkToast('تعذر حذف الإشعارات، حاول مرة أخرى.','error');return;}
    await openNotifications();
  });
  initIcons();
  await updateNotificationBadge(user.id);
};
$('guestNotificationAlertBtn')?.addEventListener('click',()=>openAuth('سجّل الدخول لعرض إشعارات حسابك.'));
$('mobileNotification')?.addEventListener('click',openNotifications);
$('closeNotifications')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const m=$('notificationsModal');m?.classList.remove('show');m?.setAttribute('aria-hidden','true');});
$('notificationsModal')?.addEventListener('click',e=>{if(e.target===$('notificationsModal')){$('notificationsModal').classList.remove('show');$('notificationsModal').setAttribute('aria-hidden','true')}});
$('notificationsModal')?.querySelector('.modal-box')?.addEventListener('click',e=>e.stopPropagation());

// Static bottom nav is initialized once and reserves its own space.
$('mobileNewOrder')?.addEventListener('click',e=>{e.preventDefault();document.querySelector('#order')?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>{$('productUrl')?.focus({preventScroll:true});},450);});

// Customer orders: richer cards, no zero-price display.
openCustomerOrders=async function(){
  const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا لعرض طلباتك.');
  const list=$('customerOrdersList');list.innerHTML='<div class="empty">جارٍ تحميل الطلبات…</div>';$('customerOrdersModal')?.classList.add('show');
  const {data,error}=await db.from('orders').select('id,order_number,status,source_site,product_name,product_info,product_image_url,quantity,product_price,shipping_fee,service_fee,total_price,currency,created_at').eq('user_id',user.id).order('created_at',{ascending:false});
  if(error){list.innerHTML='<div class="empty error-empty">تعذر تحميل الطلبات الآن. حاول مرة أخرى.</div>';return;}
  list.innerHTML=data?.length?data.map(o=>{const priced=o.total_price!=null&&Number(o.total_price)>0;return `<article class="notification-item order-card" data-order-id="${esc(o.id)}"><div class="order-card-media">${o.product_image_url?`<div class="order-thumb"><span>صورة المنتج</span></div>`:'<div class="order-thumb placeholder-thumb"><i data-lucide="package"></i></div>'}<div class="order-card-body"><div class="order-card-head"><b>#${esc(o.order_number)}</b><strong>${esc(statusNames[canonicalStatus(o.status)]||'قيد المعالجة')}</strong></div><p>${esc(o.product_name||o.product_info||o.source_site||'طلب منتج')}</p><small>الكمية: ${Number(o.quantity)||1} • ${formatDate(o.created_at)}</small><div class="order-card-price">${priced?`المجموع: <b>${formatMoney(o.total_price,o.currency)}</b>`:'السعر: <b>قيد التحديد</b>'}</div><button type="button" class="detail-btn customer-detail-btn" data-order-id="${esc(o.id)}">عرض</button></div></div></article>`}).join(''):'<div class="empty">لا توجد طلبات بعد.</div>';
  list.querySelectorAll('.customer-detail-btn').forEach(b=>b.addEventListener('click',()=>openCustomerOrderDetail(b.dataset.orderId)));list.querySelectorAll('.order-card').forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('button,a'))return;openCustomerOrderDetail(card.dataset.orderId)}));initIcons();
};
$('mobileOrders')?.addEventListener('click',()=>openCustomerOrders());

// Persistent address layer. Existing local addresses remain as a fallback/migration source.
async function getDbAddresses(userId){const {data,error}=await db.from('customer_addresses').select('*').eq('user_id',userId).order('is_primary',{ascending:false}).order('created_at',{ascending:false});if(error){console.warn('Addresses:',error.message);return null}return data||[]}
async function saveOrderAddressToDb(user,{first,last,phone,wilaya,commune,address,postal}){try{const {data:existing}=await db.from('customer_addresses').select('id').eq('user_id',user.id).limit(1);const r=await db.from('customer_addresses').insert({user_id:user.id,label:'العنوان الرئيسي',first_name:first,last_name:last,full_name:`${first} ${last}`,phone,wilaya,commune,address,postal_code:postal||null,is_primary:!existing?.length});if(r.error)console.warn('Order address:',r.error.message)}catch(e){console.warn('Order address:',e)}}
async function syncLegacyAddresses(user){const existing=await getDbAddresses(user.id);if(existing===null||existing.length)return existing;const local=getSavedAddresses();if(!local.length)return [];for(const a of local){const {error}=await db.from('customer_addresses').insert({user_id:user.id,label:a.label||'العنوان الرئيسي',first_name:a.first_name||'',last_name:a.last_name||'',full_name:a.full_name||`${a.first_name||''} ${a.last_name||''}`.trim(),phone:normalizeAlgerianPhone(a.phone)||a.phone,wilaya:a.wilaya||'',commune:a.commune||'',address:a.address||'',postal_code:a.postal_code||null,is_primary:!!a.primary});if(error)console.warn('Address migration:',error.message)}return await getDbAddresses(user.id)}
openAddresses=async function(){const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا.');const list=await syncLegacyAddresses(user);renderAddresses(list||[]);$('addressesModal')?.classList.add('show');initIcons();};
renderAddresses=function(list){
  const box=$('addressesList');if(!box)return;
  box.innerHTML=list.length?list.map((a,i)=>`<article class="saved-address ${a.is_primary?'primary':''}"><div><b>${esc(a.label||'العنوان الرئيسي')}</b>${a.is_primary?'<span class="address-badge">الرئيسي</span>':''}</div><p>${esc(a.full_name||'')} • ${esc(a.phone||'')}<br>${esc(a.wilaya||'')}، ${esc(a.commune||'')}<br>${esc(a.address||'')} ${a.postal_code?`• ${esc(a.postal_code)}`:''}</p><div class="address-actions"><button type="button" data-use-address="${i}">استخدام</button><button type="button" data-primary-address="${i}">جعله رئيسيًا</button><button type="button" data-delete-address="${i}">حذف</button></div></article>`).join(''):'<div class="empty">لا توجد عناوين محفوظة. أضف عنوانك مرة واحدة.</div>';
  box.querySelectorAll('[data-use-address]').forEach(b=>b.addEventListener('click',()=>{fillOrderFromAddress(list[Number(b.dataset.useAddress)]);$('addressesModal')?.classList.remove('show');document.querySelector('#order')?.scrollIntoView({behavior:'smooth'})}));
  box.querySelectorAll('[data-primary-address]').forEach(b=>b.addEventListener('click',async()=>{const a=list[Number(b.dataset.primaryAddress)];if(!a)return;const user=await getCurrentUser();if(!user)return;const r1=await db.from('customer_addresses').update({is_primary:false}).eq('user_id',user.id).eq('is_primary',true);if(r1.error)return fenkToast('تعذر تحديث العنوان، حاول مرة أخرى.','error');const r2=await db.from('customer_addresses').update({is_primary:true,updated_at:new Date().toISOString()}).eq('id',a.id).eq('user_id',user.id);if(r2.error)return fenkToast('تعذر جعل العنوان رئيسيًا.','error');await openAddresses();}));
  box.querySelectorAll('[data-delete-address]').forEach(b=>b.addEventListener('click',async()=>{const a=list[Number(b.dataset.deleteAddress)];if(!a)return;if(!(await fenkConfirm('هل تريد حذف هذا العنوان؟')))return;const user=await getCurrentUser();if(!user)return;const r=await db.from('customer_addresses').delete().eq('id',a.id).eq('user_id',user.id);if(r.error)return fenkToast('تعذر حذف العنوان.','error');await openAddresses();}));
};
$('addressForm')?.addEventListener('submit',async e=>{e.preventDefault();const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا.');const b=e.submitter||$('addressForm button[type=submit]');b.disabled=true;setMessage($('addressMsg'),'جارٍ حفظ العنوان…','success');try{const first=$('addressFirstName').value.trim(),last=$('addressLastName').value.trim(),rawPhone=$('addressPhone').value.trim(),phone=normalizeAlgerianPhone(rawPhone),wilaya=$('addressWilaya').value.trim(),commune=$('addressCommune').value.trim(),address=$('addressText').value.trim(),postal=$('addressPostal').value.trim();if(!first||!last||!phone||!wilaya||!commune||!address)throw new Error('أكمل بيانات العنوان المطلوبة.');if(!validAlgerianPhone(phone))throw new Error('أدخل رقمًا جزائريًا صحيحًا يبدأ بـ 05 أو 06 أو 07.');if(postal&&!/^\d{5}$/.test(postal))throw new Error('الرمز البريدي يجب أن يتكون من 5 أرقام.');const {data:existing}=await db.from('customer_addresses').select('id').eq('user_id',user.id).limit(1);if($('addressPrimary').checked){await db.from('customer_addresses').update({is_primary:false}).eq('user_id',user.id).eq('is_primary',true);}const {error}=await db.from('customer_addresses').insert({user_id:user.id,label:$('addressLabel').value.trim()||'العنوان الرئيسي',first_name:first,last_name:last,full_name:`${first} ${last}`,phone,wilaya,commune,address,postal_code:postal||null,is_primary:$('addressPrimary').checked||!existing?.length});if(error)throw error;setMessage($('addressMsg'),'تم حفظ العنوان بنجاح ✓','success');setTimeout(()=>{$('addressEditModal')?.classList.remove('show');openAddresses()},350)}catch(err){console.error('Address:',err);setMessage($('addressMsg'),'حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.','error')}finally{b.disabled=false;}});

// Saved addresses are loaded only when the user explicitly opens the address picker.

// Admin pricing inputs calculate the total instantly.
['detailProductPrice','detailShipping','detailService'].forEach(id=>$(id)?.addEventListener('input',()=>{const vals=['detailProductPrice','detailShipping','detailService'].map(x=>$(x)?.value);const nums=vals.map(x=>x===''?null:Number(x));$('detailTotalPrice').value=nums.every(x=>x!==null&&Number.isFinite(x)&&x>=0)?String(nums.reduce((a,b)=>a+b,0)):'';}));

/* V17 order wizard + final mobile polish */
(function initOrderWizard(){
  const section=document.querySelector('#order');if(!section)return;
  const steps=[...section.querySelectorAll('.order-steps > span')];const boxes=[...section.querySelectorAll('.form-grid > .form-box')];const productBox=boxes[0],siteBox=boxes[1],reviewBox=boxes[2],customer=siteBox?.querySelector('.customer-order-fields');
  let step=1;
  const nav=document.createElement('div');nav.className='wizard-actions';nav.innerHTML='<button type="button" class="wizard-prev" disabled>رجوع</button><button type="button" class="wizard-next">التالي</button>';
  section.querySelector('.form-grid')?.after(nav);
  const validPhone=()=>validAlgerianPhone($('orderPhone')?.value||'');
  function update(){
    steps.forEach((x,i)=>x.classList.toggle('active',i===step-1));
    productBox?.classList.toggle('wizard-hidden',step!==1);
    siteBox?.classList.toggle('wizard-hidden',!(step===2||step===3));
    customer?.classList.toggle('wizard-hidden',step!==3);
    reviewBox?.classList.toggle('wizard-hidden',step!==4);
    nav.querySelector('.wizard-prev').disabled=step===1;
    nav.querySelector('.wizard-next').textContent=step===4?'مراجعة وإرسال':'التالي';
    if(step===4)nav.querySelector('.wizard-next').style.display='none';else nav.querySelector('.wizard-next').style.display='inline-flex';
    section.classList.toggle('wizard-review',step===4);
  }
  nav.querySelector('.wizard-next').addEventListener('click',()=>{
    if(step===1){if(!$('productUrl')?.value.trim()&&!$('productImage')?.files?.length)return setMessage($('orderMsg'),'أدخل رابط المنتج أو اختر صورة أولًا.','error');if(step<4)step++;}
    else if(step===2){if(step<4)step++;}
    else if(step===3){if(!validPhone())return setMessage($('orderMsg'),'أدخل رقمًا جزائريًا صحيحًا يبدأ بـ 05 أو 06 أو 07.','error');if(!$('orderFirstName')?.value.trim()||!$('orderLastName')?.value.trim()||!$('orderWilaya')?.value||!$('orderCommune')?.value.trim()||!$('orderAddress')?.value.trim())return setMessage($('orderMsg'),'أكمل بيانات التوصيل قبل المتابعة.','error');if($('orderPostalCode')?.value.trim()&&!/^\d{5}$/.test($('orderPostalCode').value.trim()))return setMessage($('orderMsg'),'الرمز البريدي يجب أن يتكون من 5 أرقام.','error');if(step<4)step++;}
    update();section.scrollIntoView({behavior:'smooth',block:'start'});
  });
  nav.querySelector('.wizard-prev').addEventListener('click',()=>{if(step>1){step--;update();section.scrollIntoView({behavior:'smooth',block:'start'})}});
  steps.forEach((x,i)=>x.addEventListener('click',()=>{if(i<step-1||i===step){step=i+1;update()}}));
  update();
})();

// FENK Mobile Compact: keep the existing order flow, but make it a true 4-step mobile wizard.
(function enableCompactMobileOrder(){
  if(!window.matchMedia?.('(max-width:800px)').matches)return;
  const section=document.querySelector('#order');if(!section)return;
  const steps=[...section.querySelectorAll('.order-steps > span')];
  const boxes=[...section.querySelectorAll('.form-grid > .form-box')];
  const productBox=boxes[0],siteBox=boxes[1],reviewBox=boxes[2];
  const customer=siteBox?.querySelector('.customer-order-fields');
  const siteChooser=siteBox?.querySelector('.sites-select');
  const nav=section.querySelector('.wizard-actions');
  if(!nav)return;
  let step=1;
  function update(){
    steps.forEach((x,i)=>{x.classList.toggle('active',i===step-1);x.classList.toggle('done',i<step-1)});
    productBox?.classList.toggle('wizard-hidden',step!==1);
    siteBox?.classList.toggle('wizard-hidden',!(step===2||step===3));
    siteChooser?.classList.toggle('wizard-hidden',step!==2);
    customer?.classList.toggle('wizard-hidden',step!==3);
    reviewBox?.classList.toggle('wizard-hidden',step!==4);
    nav.querySelector('.wizard-prev').disabled=step===1;
    nav.querySelector('.wizard-next').textContent=step===3?'مراجعة الطلب':'التالي';
    nav.querySelector('.wizard-next').style.display=step===4?'none':'inline-flex';
    section.dataset.mobileStep=String(step);
    setMessage($('orderMsg'),'');
    if(step===4){
      const review=reviewBox?.querySelector('.mobile-review-summary');
      if(review) review.innerHTML=`<div><b>المنتج</b><span>${esc($('productName')?.value.trim()||'منتج غير مسمى')}</span></div><div><b>الموقع</b><span>${esc(siteBox?.querySelector('.sites-select .active')?.dataset.site||'—')}</span></div><div><b>الكمية</b><span>${Number($('qty')?.textContent)||1}</span></div><div><b>التوصيل</b><span>${esc($('orderWilaya')?.value||'—')} · ${esc($('orderCommune')?.value.trim()||'—')}</span></div>`;
    }
  }
  function next(){
    if(step===1){
      if(!$('productUrl')?.value.trim()&&!$('productImage')?.files?.length){setMessage($('orderMsg'),'أدخل رابط المنتج أو اختر صورة أولًا.','error');return;}
      step=2;
    }else if(step===2){
      step=3;
    }else if(step===3){
      if(!validAlgerianPhone($('orderPhone')?.value||'')){setMessage($('orderMsg'),'أدخل رقمًا جزائريًا صحيحًا يبدأ بـ 05 أو 06 أو 07.','error');return;}
      if(!$('orderFirstName')?.value.trim()||!$('orderLastName')?.value.trim()||!$('orderWilaya')?.value||!$('orderCommune')?.value.trim()||!$('orderAddress')?.value.trim()){setMessage($('orderMsg'),'أكمل بيانات التوصيل قبل المتابعة.','error');return;}
      step=4;
    }
    update();
    section.scrollIntoView({behavior:'smooth',block:'start'});
  }
  nav.querySelector('.wizard-next')?.addEventListener('click',next);
  nav.querySelector('.wizard-prev')?.addEventListener('click',()=>{if(step>1){step--;update();section.scrollIntoView({behavior:'smooth',block:'start'})}});
  steps.forEach((x,i)=>x.addEventListener('click',()=>{if(i<step){step=i+1;update()}}));
  update();
})();

// Improve payment receipt UX without changing the existing storage flow.
$('paymentProofFile')?.addEventListener('change',()=>{const f=$('paymentProofFile').files?.[0],msg=$('paymentProofMsg');if(f){setMessage(msg,`✓ تم اختيار الصورة: ${f.name}`,'success')}});

// Product image in customer order detail: use a short-lived signed URL when the bucket is private.
async function appendCustomerProductImage(order,host){if(!order?.product_image_url||!host)return;try{const {data,error}=await db.storage.from('product-images').createSignedUrl(order.product_image_url,1800);if(error||!data?.signedUrl)return;host.innerHTML=`<button type="button" class="order-product-image-btn" aria-label="عرض صورة المنتج بالحجم الكامل"><img src="${esc(data.signedUrl)}" alt="صورة المنتج"></button>`;host.querySelector('button')?.addEventListener('click',()=>{const w=window.open('', '_blank');if(w){w.document.write('<title>صورة المنتج - FENK</title><style>body{margin:0;background:#000;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style><img src="'+data.signedUrl+'" alt="صورة المنتج">');w.document.close();}})}catch(e){console.warn('Product image:',e)}}

// Patch customer detail renderer to include the actual product image and canonical status text.
const _detailV17=openCustomerOrderDetail;
openCustomerOrderDetail=async function(id){await _detailV17(id);const user=await getCurrentUser();if(!user)return;const {data:o}=await db.from('orders').select('product_image_url,status,order_number').eq('id',id).eq('user_id',user.id).maybeSingle();if(o){const root=$('customerOrderDetailContent');root?.querySelectorAll('.customer-product-image').forEach(x=>x.remove());const host=document.createElement('div');host.className='customer-product-image';root?.prepend(host);if(o.product_image_url)appendCustomerProductImage(o,host);else host.innerHTML='<div class="order-product-image-fallback">FENK</div>';}};

// Keep admin dashboard status counters canonical.
const _refreshAdminV17=refreshAdmin;
refreshAdmin=async function(){await _refreshAdminV17();if($('sNew'))$('sNew').textContent=cachedOrders.filter(o=>canonicalStatus(o.status)==='received').length;if($('sPaid'))$('sPaid').textContent=cachedOrders.filter(o=>canonicalStatus(o.status)==='payment_confirmed').length;};

// Educational images: open without cropping on tap/click.
document.querySelectorAll('.tutorial img').forEach(img=>img.addEventListener('click',()=>{const w=window.open('', '_blank');if(!w)return;w.document.write('<title>FENK - شرح</title><style>body{margin:0;background:#111;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style><img src="'+esc(img.src)+'" alt="شرح FENK">');w.document.close();}));


/* V19 — AliExpress-style customer orders + tracking */
function trackingStatusLabelV19(s,isGame=false){
  if(isGame){
    return ({payment_submitted:'تم استلام وصل الدفع',payment_confirmed:'تم تأكيد الدفع',completed:'تم شحن اللعبة'}[canonicalStatus(s)])||'قيد المعالجة';
  }
  return statusNames[canonicalStatus(s)]||'قيد المعالجة';
}
function trackingEventMarkupV19(history,currentStatus,isGame=false){
  const current=canonicalStatus(currentStatus);
  if(current==='cancelled')return '<div class="tracking-cancelled">تم إلغاء الطلب</div>' ;
  const steps=isGame
    ? [['payment_submitted','تم استلام وصل الدفع'],['payment_confirmed','تم تأكيد الدفع'],['completed','تم شحن اللعبة']]
    : statusOrder.map(status=>[status,statusNames[status]]);
  const byStatus={};
  (history||[]).forEach(h=>{const key=canonicalStatus(h.status);if(!byStatus[key])byStatus[key]=h});
  const currentIndex=Math.max(0,steps.findIndex(x=>x[0]===current));
  return `<div class="tracking-line ${isGame?'game-tracking-line':''}">${steps.map(([status,label],i)=>{const h=byStatus[status],state=i<currentIndex?'done':i===currentIndex?'current':'pending';return `<article class="tracking-event ${state}"><span class="tracking-dot">${state==='done'?'✓':state==='current'?'●':'○'}</span><div><b>${esc(label)}</b>${h?.note?`<p>${esc(h.note)}</p>`:''}${h?.created_at?`<small>${esc(formatDate(h.created_at))}</small>`:''}</div></article>`}).join('')}</div>`;
}
async function openCustomerTrackingV19(id){
  const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا.');
  const modal=$('customerTrackingModal');if(!modal)return openCustomerOrderDetail(id);
  $('trackingEvents').innerHTML='<div class="tracking-loading">جارٍ تحميل التتبع…</div>';modal.classList.add('show');
  const [{data:o,error:oe},{data:history,error:he}]=await Promise.all([
    db.from('orders').select('id,order_number,status,source_site,product_name,product_info,product_image_url,quantity,product_price,shipping_fee,service_fee,total_price,currency,created_at,updated_at,carrier_name,tracking_number,tracking_url,game_id,package_id,player_id,player_data').eq('id',id).eq('user_id',user.id).single(),
    db.from('order_status_history').select('status,note,created_at').eq('order_id',id).order('created_at',{ascending:false})
  ]);
  if(oe||!o){$('trackingEvents').innerHTML='<div class="empty">تعذر تحميل تتبع الطلب.</div>';return;}
  selectedOrderId=o.id;$('trackingOrderNumber').textContent=`#${o.order_number}`;
  const isGame=!!(o.game_id||o.package_id);
  const priced=o.total_price!=null&&Number(o.total_price)>0;
  const image=o.product_image_url?`<img data-product-image="${esc(o.product_image_url)}" src="assets/logo-clean.png" alt="صورة المنتج" loading="lazy">`:`<div class="tracking-placeholder">${isGame?'🎮':'FENK'}</div>`;
  const gameMeta=isGame?`<div class="tracking-game-meta"><b>🎮 ${esc(o.player_data?.game||o.product_name||'اللعبة')}</b>${o.player_id?`<small>Player ID: ${esc(o.player_id)}</small>`:''}</div>`:'';
  const carrierHtml=isGame?'':`<div class="tracking-carrier"><div><small>شركة الشحن</small><b>${esc(o.carrier_name||'سيتم تحديدها عند الشحن')}</b></div><div><small>رقم التتبع</small><b>${o.tracking_number?esc(o.tracking_number):'سيظهر بعد الشحن'}</b></div>${o.tracking_number?`<button type="button" id="copyTrackingNumber">نسخ</button>`:''}</div>`;
  $('trackingSummary').innerHTML=`<div class="tracking-status"><strong>${esc(trackingStatusLabelV19(o.status,isGame))}</strong><span>${esc(formatDate(o.updated_at||o.created_at))}</span></div><div class="tracking-product">${image}<div class="tracking-product-info"><b>${esc(o.product_name||o.product_info||'طلب منتج')}</b><small>${isGame?'شحن لعبة':'شراء منتج'} • الكمية ${Number(o.quantity)||1}</small><strong>${priced?esc(formatMoney(o.total_price,o.currency)):'السعر قيد التحديد'}</strong>${gameMeta}</div></div>${carrierHtml}`;
  $('trackingEvents').innerHTML=trackingEventMarkupV19(he?[]:history,o.status,isGame); await hydrateProductImages($('trackingSummary'));
  $('trackingWhatsapp').href=`https://wa.me/${FENK_WHATSAPP}?text=${encodeURIComponent(`السلام عليكم، أريد الاستفسار عن طلبي:\nرقم الطلب: ${o.order_number}${o.tracking_number?`\nرقم التتبع: ${o.tracking_number}`:''}`)}`;
  $('trackingOrderDetails').onclick=()=>{modal.classList.remove('show');openCustomerOrderDetail(o.id)};
  $('trackingBack').onclick=()=>{modal.classList.remove('show');openCustomerOrders()};
  $('copyTrackingNumber')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(o.tracking_number);fenkToast('تم نسخ رقم التتبع.','success')}catch{}});
  if(o.tracking_url){const link=document.createElement('a');link.href=o.tracking_url;link.target='_blank';link.rel='noopener';link.className='tracking-external';link.textContent='فتح التتبع الخارجي ↗';$('trackingSummary').appendChild(link)}
}

openCustomerOrders=async function(){
  const user=await getCurrentUser();if(!user)return openAuth('سجّل الدخول أولًا لعرض طلباتك.');
  const list=$('customerOrdersList');list.innerHTML='<div class="empty">جارٍ تحميل الطلبات…</div>';$('customerOrdersModal')?.classList.add('show');
  const {data,error}=await db.from('orders').select('id,order_number,status,source_site,product_name,product_info,product_image_url,quantity,total_price,currency,created_at,carrier_name,tracking_number,hidden_from_customer').eq('user_id',user.id).eq('hidden_from_customer',false).order('created_at',{ascending:false});
  if(error){list.innerHTML='<div class="empty error-empty">تعذر تحميل الطلبات الآن. حاول مرة أخرى.</div>';return;}
  list.innerHTML=data?.length?data.map(o=>{const priced=o.total_price!=null&&Number(o.total_price)>0;return `<article class="fenk-order-card" data-order-id="${esc(o.id)}"><div class="fenk-order-top"><span>${esc(formatDate(o.created_at))}</span><b>${esc(trackingStatusLabelV19(o.status))}</b></div><div class="fenk-order-product"><div class="fenk-order-thumb">${o.product_image_url?`<img data-product-image="${esc(o.product_image_url)}" src="assets/logo-clean.png" alt="صورة المنتج" loading="lazy">`:'<img src="assets/logo-clean.png" alt="FENK" loading="lazy">'}</div><div class="fenk-order-info"><strong>${esc(o.product_name||o.product_info||'طلب منتج')}</strong><small>${esc(o.source_site||'FENK')} • الكمية ×${Number(o.quantity)||1}</small><b>${priced?esc(formatMoney(o.total_price,o.currency)):'قيد التحديد'}</b></div></div><div class="fenk-order-actions"><button type="button" class="track-btn" data-track-order="${esc(o.id)}">تتبع الطلب</button><button type="button" class="detail-btn" data-detail-order="${esc(o.id)}">تفاصيل الطلب</button>${['cancelled','delivered','completed','rejected'].includes(canonicalStatus(o.status))?`<button type="button" class="order-archive-btn" data-archive-order="${esc(o.id)}" title="إخفاء الطلب من صفحتي"><i data-lucide="trash-2"></i> حذف من صفحتي</button>`:''}</div>${o.tracking_number?`<div class="tracking-mini">رقم التتبع: <b>${esc(o.tracking_number)}</b></div>`:''}</article>`}).join(''):'<div class="empty">لا توجد طلبات بعد.</div>';
  list.querySelectorAll('[data-track-order]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openCustomerTrackingV19(b.dataset.trackOrder)}));
  list.querySelectorAll('[data-detail-order]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openCustomerOrderDetail(b.dataset.detailOrder)}));
  list.querySelectorAll('.fenk-order-card').forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('button,a'))return;openCustomerOrderDetail(card.dataset.orderId)}));
  initIcons(); await hydrateProductImages(list);
};
$('closeCustomerTracking')?.addEventListener('click',()=>$('customerTrackingModal')?.classList.remove('show'));
$('customerTrackingModal')?.addEventListener('click',e=>{if(e.target===$('customerTrackingModal'))$('customerTrackingModal').classList.remove('show')});

/* V22: customer-only order archive. The order remains visible to Admin/history. */
async function archiveCustomerOrder(orderId){
  const user=await getCurrentUser(); if(!user)return openAuth('سجّل الدخول أولًا.');
  if(!orderId)return;
  if(!(await fenkConfirm('إخفاء هذا الطلب من صفحة طلباتي؟ سيبقى محفوظًا لدى FENK وفي لوحة الإدارة.')))return;
  const {data,error}=await db.rpc('hide_my_order',{p_order_id:orderId});
  if(error||data!==true){console.warn('Hide order:',error);fenkToast('تعذر حذف الطلب من صفحتك، حاول مرة أخرى.','error');return;}
  fenkToast('تم حذف الطلب من صفحتك ✓','success');
  await openCustomerOrders();
}

const _openCustomerOrdersV22=window.openCustomerOrders;
openCustomerOrders=async function(){
  await _openCustomerOrdersV22();
  const list=$('customerOrdersList'); if(!list)return;
  list.querySelectorAll('[data-archive-order]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();archiveCustomerOrder(btn.dataset.archiveOrder);}));
};

/* Language engine moved to index.html V84. */
