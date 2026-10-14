const SUPABASE_URL='https://wqfnzahjwlukncxlxdkp.supabase.co';
const SUPABASE_KEY='sb_publishable__QR4tJ9p5RYOQkIuHkoYKQ_mbDa9tuA';
const FENK_WHATSAPP='213778939292';
const OAUTH_REDIRECT=new URL('admin.html',window.location.href).href;
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});const $=id=>document.getElementById(id);
let cachedOrders=[],selectedOrderId=null,marketplaceAdsCache=[];
const processingStatuses=new Set(['received','pricing','processing','purchasing','shipped','arrived_algeria','out_for_delivery']);
const statusNames={received:'تم استلام الطلب',pricing:'تم تحديد السعر',awaiting_payment:'بانتظار الدفع',payment_submitted:'في انتظار التحقق من الدفع',payment_confirmed:'تم استلام الدفع',purchasing:'جاري تنفيذ الشحن',shipped:'تم الشحن',arrived_algeria:'وصل إلى الجزائر',out_for_delivery:'خرج للتوصيل',delivered:'مكتمل',completed:'تم شحن اللعبة',failed:'فشل تنفيذ الشحن',processing:'قيد المعالجة',cancelled:'تم إلغاء الطلب'};
const canonicalStatus=s=>({checking:'received',price_confirmation:'pricing',payment_proof_received:'payment_submitted',paid:'payment_confirmed',shipping:'shipped'}[s]||s||'received');
const gameStatusLabel=o=>{
  const st=canonicalStatus(o?.status);
  if(o?.game_id||o?.package_id){
    if(o?.payment_method==='flexy'){
      return ({processing:'🟡 قيد المعالجة',shipped:'🟢 تم الشحن',failed:'🔴 فشل',cancelled:'تم إلغاء الطلب'}[st]||statusNames[st]||st||'—');
    }
    return ({payment_submitted:'انتظار التحقق من الإثبات',payment_confirmed:'تم تأكيد الدفع',completed:'🟢 تم الشحن',failed:'🔴 رفض أو فشل',cancelled:'تم إلغاء الطلب'}[st]||statusNames[st]||st||'—');
  }
  return statusNames[st]||st||'—';
};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const formatDate=v=>{const d=new Date(v);return !v||Number.isNaN(d.getTime())?'—':d.toLocaleDateString('ar-DZ',{day:'2-digit',month:'2-digit',year:'numeric'})+' • '+d.toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'})};
const formatMoney=(v,c='DZD')=>{const n=Number(v);return Number.isFinite(n)&&n>0?`${n.toLocaleString('ar-DZ')} ${c==='DZD'?'دج':c}`:'قيد التحديد'};
const msg=(t,type='')=>{const e=$('adminLoginMsg');if(e){e.textContent=t;e.className='admin-msg '+type}};
const initIcons=()=>{try{window.lucide?.createIcons({attrs:{'stroke-width':2.1}})}catch{}};
async function isAdmin(){try{const {data:{session}}=await db.auth.getSession();if(!session?.user)return false;const {data,error}=await db.rpc('is_admin');if(error){console.warn('FENK is_admin RPC:',error);return false}return data===true}catch(e){console.warn('FENK isAdmin:',e);return false}}
function showPanel(user){$('adminLogin').style.display='none';$('adminPanel').classList.add('show');$('adminPanel').setAttribute('aria-hidden','false');$('adminEmail').textContent=user?.email||'';initIcons();}
function showLogin(t=''){ $('adminLogin').style.display='grid';$('adminPanel').classList.remove('show');$('adminPanel').setAttribute('aria-hidden','true');if(t)msg(t,'error'); }
function setAdminMenu(open){const p=$('adminPanel');if(!p)return;p.classList.toggle('menu-open',!!open);$('adminMenuBtn')?.setAttribute('aria-expanded',String(!!open));$('adminSideBackdrop')?.classList.toggle('show',!!open)}
$('adminMenuBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setAdminMenu(!$('adminPanel').classList.contains('menu-open'))});
$('adminSideBackdrop')?.addEventListener('click',e=>{e.preventDefault();setAdminMenu(false)});

$('adminTelegramTest')?.addEventListener('click',async e=>{
  const b=e.currentTarget; const old=b.textContent; b.disabled=true; b.textContent='جارٍ الاختبار…';
  try{
    const {data:{session}}=await db.auth.getSession();
    if(!session?.access_token) throw new Error('انتهت جلسة الإدارة. سجّل الدخول مرة أخرى.');
    const r=await fetch(`${SUPABASE_URL}/functions/v1/telegram-test`,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,apikey:SUPABASE_KEY,'Content-Type':'application/json'}});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j?.ok===false) throw new Error(j?.error||'تعذر الاتصال بـ Telegram.');
    b.textContent='✓ Telegram متصل';
    setTimeout(()=>{b.textContent=old},2500);
  }catch(err){
    console.error('Telegram test:',err); b.textContent='✕ فشل الاختبار';
    setTimeout(()=>{b.textContent=old},2500);
  }finally{b.disabled=false}
});
$('adminMobileRefresh')?.addEventListener('click',async()=>{const b=$('adminMobileRefresh');b.disabled=true;try{await refreshAdmin();await refreshAdminMessages()}finally{b.disabled=false}});

async function handleOAuthCallback(){
  // FENK FIX: Supabase is configured with detectSessionInUrl:true.
  // Let the Supabase client consume the PKCE callback once; manually calling
  // exchangeCodeForSession() here can race with the automatic exchange and
  // produce "OAuth state not found or expired", leaving Admin locked out.
  const url=new URL(window.location.href);
  const errorParam=url.searchParams.get('error');
  const errorDescription=url.searchParams.get('error_description');
  if(errorParam){
    url.searchParams.delete('error');url.searchParams.delete('error_code');url.searchParams.delete('error_description');url.searchParams.delete('state');url.searchParams.delete('code');url.searchParams.delete('error_reason');
    history.replaceState({},document.title,url.pathname+url.search+url.hash);
    throw new Error(errorDescription||'تعذر تسجيل الدخول باستخدام Google.');
  }
  // If a PKCE code is present, do not exchange it manually. The client
  // initialization with detectSessionInUrl:true handles it.
  if(url.searchParams.has('code')){
    url.searchParams.delete('code');url.searchParams.delete('state');
    history.replaceState({},document.title,url.pathname+url.search+url.hash);
    // Give the automatic callback exchange a moment to finish.
    await new Promise(r=>setTimeout(r,150));
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  const f=$('mpEditorForm');if(f)f.onsubmit=saveMarketplaceEditor;
  $('mpEditorClose')?.addEventListener('click',closeMarketplaceEditor);$('mpEditorCancel')?.addEventListener('click',closeMarketplaceEditor);$('mpEditorModal')?.addEventListener('click',e=>{if(e.target.id==='mpEditorModal')closeMarketplaceEditor()});
  $('openMarketplaceCreate')?.addEventListener('click',openMarketplaceCreate);
  $('mpCreateClose')?.addEventListener('click',closeMarketplaceCreate);$('mpCreateCancel')?.addEventListener('click',closeMarketplaceCreate);$('mpCreateModal')?.addEventListener('click',e=>{if(e.target.id==='mpCreateModal')closeMarketplaceCreate()});
  $('mpCreateForm')?.addEventListener('submit',createMarketplaceAdAdmin);
  $('mpCreateImages')?.addEventListener('change',previewMarketplaceCreateImages);
});

// ===== FENK REAL PRODUCTS CATALOG =====
let productsAdminCache=[];
function productOptionsFromRows(){return [...document.querySelectorAll('.product-option-row')].map(r=>({name:r.querySelector('.opt-name')?.value.trim(),values:(r.querySelector('.opt-values')?.value||'').split(',').map(x=>x.trim()).filter(Boolean),required:!!r.querySelector('.opt-required')?.checked})).filter(x=>x.name&&x.values.length)}
function addProductOptionRow(data={name:'',values:[],required:true}){const host=$('productOptionsRows');if(!host)return;const row=document.createElement('div');row.className='product-option-row';row.innerHTML=`<input class="opt-name" maxlength="60" placeholder="مثال: اللون" value="${mpEsc(data.name||'')}"><input class="opt-values" placeholder="أزرق, أسود, أبيض" value="${mpEsc((data.values||[]).join(', '))}"><label><input class="opt-required" type="checkbox" ${data.required!==false?'checked':''}> إجباري</label><button type="button" class="admin-secondary-btn opt-remove">×</button>`;row.querySelector('.opt-remove').onclick=()=>row.remove();host.appendChild(row)}
function syncProductCatalogFields(){const s=$('productCatalogSection')?.value||'products';const wrap=$('productPartCategoryWrap');if(wrap)wrap.style.display=s==='spare_parts'?'':'none';if(s!=='spare_parts'&&$('productPartCategory'))$('productPartCategory').value=''}
function resetProductForm(){const f=$('productAdminForm');if(!f)return;f.reset();$('productAdminId').value='';$('productModalTitle').textContent='➕ إضافة منتج';$('productRating').value='0';$('productDiscount').value='0';$('productStock').value='0';$('productSold').value='0';$('productActive').checked=true;$('productShow').checked=true;if($('productCatalogSection'))$('productCatalogSection').value='products';if($('productPartCategory'))$('productPartCategory').value='';syncProductCatalogFields();$('productImageUrls').value='';$('productImagePreview').innerHTML='';$('productOptionsRows').innerHTML='';addProductOptionRow()}
function openProductAdminModal(product=null){resetProductForm();if(product){$('productModalTitle').textContent='✏️ تعديل المنتج';$('productAdminId').value=product.id;$('productTitle').value=product.title||'';$('productPlatform').value=product.source_platform||'Other';if($('productCatalogSection'))$('productCatalogSection').value=product.catalog_section||'products';if($('productPartCategory'))$('productPartCategory').value=product.part_category||'';syncProductCatalogFields();$('productOriginalPrice').value=product.original_price??'';$('productPrice').value=product.price_dzd??'';$('productDiscount').value=product.discount_pct??0;$('productRating').value=product.rating??0;$('productStock').value=product.stock_quantity??0;$('productSold').value=product.sold_count??0;$('productSourceUrl').value=product.source_url||'';$('productDescription').value=product.description||'';$('productActive').checked=!!product.is_active;$('productShow').checked=!!product.show_in_products;const urls=Array.isArray(product.image_urls)?product.image_urls:[];$('productImageUrls').value=urls.join('\n');$('productImagePreview').innerHTML=urls.map(u=>`<img src="${mpEsc(u)}" alt="">`).join('');$('productOptionsRows').innerHTML='';(Array.isArray(product.options)?product.options:[]).forEach(o=>addProductOptionRow(o));if(!(product.options||[]).length)addProductOptionRow()}$('productAdminMsg').textContent='';$('productAdminModal').classList.add('show');$('productAdminModal').setAttribute('aria-hidden','false')}
function closeProductAdminModal(){$('productAdminModal')?.classList.remove('show');$('productAdminModal')?.setAttribute('aria-hidden','true')}
async function uploadProductImages(files){const {data:{session}}=await db.auth.getSession();if(!session?.user)return [];const out=[];for(const file of [...files].slice(0,10)){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)continue;const ext=file.type.split('/')[1].replace('jpeg','jpg');const path=`${session.user.id}/products/${crypto.randomUUID()}.${ext}`;const up=await db.storage.from('marketplace-images').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;const {data}=db.storage.from('marketplace-images').getPublicUrl(path);if(data?.publicUrl)out.push(data.publicUrl)}return out}
async function saveProductAdmin(e){e.preventDefault();const b=$('productAdminSave');b.disabled=true;try{const title=$('productTitle').value.trim();const price=Number($('productPrice').value);if(!title||!Number.isFinite(price)||price<0)throw new Error('أدخل اسم المنتج والسعر بشكل صحيح.');const existingId=$('productAdminId').value.trim();let imageUrls=$('productImageUrls').value.split(/\s+/).map(x=>x.trim()).filter(Boolean).slice(0,10);const files=$('productImages')?.files;if(files?.length){const uploaded=await uploadProductImages(files);imageUrls=[...uploaded,...imageUrls].slice(0,10)}const catalogSection=$('productCatalogSection')?.value||'products';const payload={title,description:$('productDescription').value.trim()||null,original_price:$('productOriginalPrice').value===''?null:Number($('productOriginalPrice').value),price_dzd:price,discount_pct:Number($('productDiscount').value)||0,rating:Number($('productRating').value)||0,sold_count:Math.max(0,Number($('productSold').value)||0),image_urls:imageUrls,options:productOptionsFromRows(),stock_quantity:Math.max(0,Number($('productStock').value)||0),source_url:$('productSourceUrl').value.trim()||null,source_platform:$('productPlatform').value,catalog_section:catalogSection,part_category:catalogSection==='spare_parts'?($('productPartCategory')?.value||null):null,is_active:$('productActive').checked,show_in_products:$('productShow').checked,updated_at:new Date().toISOString()};let r;if(existingId)r=await db.from('fenk_products').update(payload).eq('id',existingId).select().single();else{const {data:{session}}=await db.auth.getSession();payload.created_by=session?.user?.id||null;r=await db.from('fenk_products').insert(payload).select().single()}if(r.error)throw r.error;if(!existingId&&r.data?.id)await notifyProductTelegram('new_product',r.data.id);closeProductAdminModal();await refreshProductsAdmin();alert('✓ تم حفظ المنتج.')}catch(err){console.error(err);$('productAdminMsg').textContent=err?.message||'تعذر حفظ المنتج.'}finally{b.disabled=false}}
async function refreshProductsAdmin(){const box=$('productsAdminTable');if(!box)return;box.innerHTML='<div class="empty">جارٍ تحميل المنتجات…</div>';const {data,error}=await db.from('fenk_products').select('*').order('created_at',{ascending:false});if(error){box.innerHTML='<div class="empty">تعذر تحميل المنتجات: '+esc(error.message)+'</div>';return}productsAdminCache=data||[];$('productCountAll').textContent=productsAdminCache.length;$('productCountActive').textContent=productsAdminCache.filter(p=>p.is_active&&p.show_in_products).length;$('productCountStock').textContent=productsAdminCache.filter(p=>p.stock_quantity>0).length;if(!productsAdminCache.length){box.innerHTML='<div class="empty">لا توجد منتجات بعد. اضغط «إضافة منتج».</div>';return}box.innerHTML=productsAdminCache.map(p=>{const img=Array.isArray(p.image_urls)&&p.image_urls[0];return `<article class="product-admin-row"><img class="product-admin-thumb" src="${mpEsc(img||'assets/marketplace/marketplace-products.png')}" alt=""><div class="product-admin-info"><b>${esc(p.title)}</b><small>${esc(p.source_platform||'')} • ${Number(p.price_dzd||0).toLocaleString('ar-DZ')} دج • المخزون: ${Number(p.stock_quantity||0)} • ${p.catalog_section==='spare_parts'?'قطع غيار':'منتجات'} • ${p.is_active&&p.show_in_products?'مفعّل':'مخفي'}</small></div><div class="product-admin-actions"><button type="button" data-product-edit="${esc(p.id)}">✏️ تعديل</button><button type="button" data-product-toggle="${esc(p.id)}">${p.is_active&&p.show_in_products?'🔒 إخفاء':'🟢 إظهار'}</button><button type="button" data-product-open="${esc(p.id)}">👁️ عرض</button><button type="button" class="danger" data-product-delete="${esc(p.id)}">🗑️ حذف</button></div></article>`}).join('');box.querySelectorAll('[data-product-edit]').forEach(b=>b.onclick=()=>openProductAdminModal(productsAdminCache.find(x=>x.id===b.dataset.productEdit)));box.querySelectorAll('[data-product-open]').forEach(b=>b.onclick=()=>location.href='product.html?id='+encodeURIComponent(b.dataset.productOpen));box.querySelectorAll('[data-product-toggle]').forEach(b=>b.onclick=async()=>{const p=productsAdminCache.find(x=>x.id===b.dataset.productToggle);if(!p)return;const {error}=await db.from('fenk_products').update({is_active:!(p.is_active&&p.show_in_products),show_in_products:!(p.is_active&&p.show_in_products),updated_at:new Date().toISOString()}).eq('id',p.id);if(error)alert(error.message);else await refreshProductsAdmin()});box.querySelectorAll('[data-product-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('حذف المنتج نهائيًا؟'))return;const {error}=await db.from('fenk_products').delete().eq('id',b.dataset.productDelete);if(error)alert(error.message);else await refreshProductsAdmin()});initIcons()}
$('productCatalogSection')?.addEventListener('change',syncProductCatalogFields);$('openProductCreate')?.addEventListener('click',()=>openProductAdminModal());$('productAdminClose')?.addEventListener('click',closeProductAdminModal);$('productAdminCancel')?.addEventListener('click',closeProductAdminModal);$('productAdminModal')?.addEventListener('click',e=>{if(e.target.id==='productAdminModal')closeProductAdminModal()});$('productAdminForm')?.addEventListener('submit',saveProductAdmin);$('addProductOption')?.addEventListener('click',()=>addProductOptionRow());$('refreshProductsAdmin')?.addEventListener('click',refreshProductsAdmin);$('productImages')?.addEventListener('change',e=>{$('productImagePreview').innerHTML=[...e.target.files].slice(0,10).map(f=>`<span>${esc(f.name)}</span>`).join('')});

async function boot(){
  try{await handleOAuthCallback();}catch(err){console.error(err);showLogin(err?.message||'تعذر إكمال تسجيل الدخول باستخدام Google.');return;}
  const {data:{session}}=await db.auth.getSession();
  if(!session)return showLogin();
  if(await isAdmin()){showPanel(session.user);try{await refreshAdmin();}catch(err){console.error('FENK admin dashboard refresh:',err)}try{await refreshAdminMessages();}catch(err){console.error('FENK admin messages refresh:',err)}}
  else{await db.auth.signOut();showLogin('هذا الحساب لا يملك صلاحية Admin.');}
}
$('adminGoogleLogin')?.addEventListener('click',async e=>{
  e.preventDefault();
  const b=e.currentTarget;b.disabled=true;msg('جارٍ فتح Google…','success');
  try{
    const {error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo:OAUTH_REDIRECT,queryParams:{prompt:'select_account'}}});
    if(error)throw error;
  }catch(err){console.error(err);msg(err?.message||'تعذر فتح تسجيل الدخول باستخدام Google.','error');b.disabled=false;}
});
db.auth.onAuthStateChange((_event,session)=>{
  if(!session){showLogin();return;}
  setTimeout(async()=>{try{if(await isAdmin()){showPanel(session.user);try{await refreshAdmin()}catch(err){console.error('FENK admin dashboard refresh:',err)}try{await refreshAdminMessages()}catch(err){console.error('FENK admin messages refresh:',err)}}else{await db.auth.signOut();showLogin('هذا الحساب لا يملك صلاحية Admin.')}}catch(err){console.error(err);showLogin('حدث خطأ أثناء التحقق من صلاحية الإدارة.')}} ,0)
});
$('adminLogoutBtn').onclick=async e=>{e.preventDefault();const b=e.currentTarget;b.disabled=true;try{await db.auth.signOut()}finally{location.reload()}};$('adminSiteBtn').onclick=e=>{e.preventDefault();location.href=location.pathname.replace(/admin\.html.*$/,'')||'/'};
async function handleAdminDetailButton(e){
  const detail=e.target?.closest?.('.detail-btn');
  if(!detail || detail.disabled) return;
  e.preventDefault();
  e.stopPropagation();
  const id=detail.getAttribute('data-order-id');
  if(!id){ console.error('FENK: missing order id'); return; }
  detail.disabled=true;
  try{ await openOrderDetail(id); }catch(err){
    console.error('FENK: failed to open order',err);
    const m=$('orderDetailMsg'); if(m) m.textContent='تعذر فتح تفاصيل الطلب. أعد المحاولة.';
  }finally{ detail.disabled=false; }
}

document.addEventListener('click',async e=>{
  if(e.target.closest?.('#selectAllCancelledOrders')){
    toggleAllCancelledOrders(e.target.closest('#selectAllCancelledOrders').checked);
    return;
  }
  if(e.target.closest?.('#bulkDeleteCancelledOrders')){
    await handleBulkDeleteCancelledOrders();
    return;
  }
  if(e.target.closest?.('.order-hard-delete')){await handleHardDeleteOrder(e.target.closest('.order-hard-delete'));return;}
  const tab=e.target.closest?.('.admin-tab');
  if(tab){
    e.preventDefault(); e.stopPropagation();
    document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.admin-view').forEach(x=>x.classList.add('hidden'));
    tab.classList.add('active');
    const view=$('tab-'+tab.dataset.tab);
    if(view) view.classList.remove('hidden');
    setAdminMenu(false);
    if(tab.dataset.tab==='messages') await refreshAdminMessages();
    if(tab.dataset.tab==='orders') renderOrders(cachedOrders);
    if(tab.dataset.tab==='games') await refreshGameSettingsAdmin();
    if(tab.dataset.tab==='packages') await refreshGamePackagesAdmin();
    if(tab.dataset.tab==='payment'){ await refreshPaymentSettingsAdmin(); await refreshMarketplaceFeeAdmin(); }
    if(tab.dataset.tab==='marketplaceAds') await refreshMarketplaceAdsAdmin();
    if(tab.dataset.tab==='products') await refreshProductsAdmin();
    return;
  }
  if(e.target.closest?.('.detail-btn')) await handleAdminDetailButton(e);
});

// Android/mobile reliability: pointerup is fired even when a browser delays/suppresses click.
document.addEventListener('pointerup',async e=>{
  if(e.pointerType==='mouse') return;
  if(e.target.closest?.('.order-hard-delete')) await handleHardDeleteOrder(e.target.closest('.order-hard-delete'));
  else if(e.target.closest?.('.detail-btn')) await handleAdminDetailButton(e);
},{passive:false});

async function handleHardDeleteOrder(button){
  const id=button?.dataset?.hardDeleteOrder;
  if(!id || button?.dataset?.deleting==='1')return;
  button.dataset.deleting='1';
  const order=cachedOrders.find(o=>String(o.id)===String(id));
  if(!order || canonicalStatus(order.status)!=='cancelled'){button.dataset.deleting='';alert('لا يمكن حذف هذا الطلب إلا إذا كان ملغى.');return;}
  const ok=confirm(`⚠️ حذف نهائي\n\nسيتم حذف الطلب #${order.order_number||''} نهائيًا من قاعدة البيانات.\nلا يمكن التراجع عن هذه العملية.\n\nهل تريد المتابعة؟`);
  if(!ok){button.dataset.deleting='';return;}
  button.disabled=true;button.textContent='جارٍ الحذف…';
  try{
    const {data,error}=await db.rpc('admin_hard_delete_cancelled_orders',{p_order_ids:[id]});
    if(error)throw error;
    if(!data || Number(data.deleted_count)!==1) throw new Error('order_not_deleted');
    await refreshAdmin();
    const f=$('statusFilter');
    if(f?.value==='cancelled')renderOrders(cachedOrders);
    if(typeof fenkToast==='function')fenkToast(`تم حذف الطلب #${order.order_number||''} نهائيًا ✓`,'success');
    else alert(`تم حذف الطلب #${order.order_number||''} نهائيًا.`);
  }catch(err){
    console.error('Permanent order delete:',err);
    button.disabled=false;button.dataset.deleting='';button.textContent='🗑️ حذف نهائي';
    const msg=String(err?.message||'');
    alert(/permission|policy|42501|admin_required/i.test(msg)?'تعذر الحذف: جلسة الإدارة غير صالحة أو لا تملك صلاحية الحذف. لم يتم حذف الطلب.':(/foreign key|constraint/i.test(msg)?'تعذر الحذف بسبب ارتباط بيانات غير متوقع. لم يتم حذف الطلب.':'تعذر حذف الطلب نهائيًا. لم يتم حذف الطلب.'));
  }
}
function orderRow(o){return `<div class="mini-order"><b>#${esc(o.order_number)}</b><span>${esc(`${o.customer_first_name||''} ${o.customer_last_name||''}`.trim())}</span><span>${esc(o.customer_phone||'—')}</span><strong>${esc(gameStatusLabel(o))}</strong><button type="button" class="detail-btn" data-order-id="${esc(o.id)}">فتح الطلب</button></div>`}
function toggleAllCancelledOrders(checked){
  document.querySelectorAll('.cancelled-order-check').forEach(cb=>{cb.checked=!!checked;});
  updateCancelledBulkState();
}
function updateCancelledBulkState(){
  const checks=[...document.querySelectorAll('.cancelled-order-check')];
  const selected=checks.filter(c=>c.checked);
  const master=$('selectAllCancelledOrders');
  const bulk=$('bulkDeleteCancelledOrders');
  const count=$('cancelledSelectedCount');
  if(master){master.checked=checks.length>0&&selected.length===checks.length;master.indeterminate=selected.length>0&&selected.length<checks.length;}
  if(bulk){bulk.disabled=selected.length===0;bulk.textContent=selected.length?`🗑️ حذف المحدد (${selected.length})`:'🗑️ حذف المحدد';}
  if(count)count.textContent=selected.length?`تم تحديد ${selected.length} طلب`:'لم يتم تحديد أي طلب';
}
async function handleBulkDeleteCancelledOrders(){
  const ids=[...document.querySelectorAll('.cancelled-order-check:checked')].map(c=>c.dataset.orderId).filter(Boolean);
  if(!ids.length)return;
  const orders=ids.map(id=>cachedOrders.find(o=>String(o.id)===String(id))).filter(o=>o&&canonicalStatus(o.status)==='cancelled');
  if(!orders.length){alert('لا توجد طلبات ملغاة محددة.');return;}
  const ok=confirm(`⚠️ حذف نهائي جماعي\n\nسيتم حذف ${orders.length} طلبات ملغاة نهائيًا من قاعدة البيانات.\nلا يمكن التراجع عن هذه العملية.\n\nهل تريد المتابعة؟`);
  if(!ok)return;
  const btn=$('bulkDeleteCancelledOrders');
  if(btn)btn.disabled=true;
  try{
    const validIds=orders.map(o=>o.id);
    const {data,error}=await db.rpc('admin_hard_delete_cancelled_orders',{p_order_ids:validIds});
    if(error)throw error;
    if(!data || Number(data.deleted_count)!==validIds.length) throw new Error('orders_not_fully_deleted');
    await refreshAdmin();
    const f=$('statusFilter');
    if(f?.value==='cancelled')renderOrders(cachedOrders);
    if(typeof fenkToast==='function')fenkToast(`تم حذف ${orders.length} طلبات ملغاة نهائيًا ✓`,'success');
    else alert(`تم حذف ${orders.length} طلبات ملغاة نهائيًا.`);
  }catch(err){
    console.error('Bulk permanent order delete:',err);
    const msg=String(err?.message||'');
    alert(/permission|policy|42501|admin_required/i.test(msg)?'تعذر الحذف الجماعي: جلسة الإدارة غير صالحة أو لا تملك صلاحية الحذف. لم يتم حذف الطلبات.':(/foreign key|constraint/i.test(msg)?'تعذر الحذف الجماعي بسبب ارتباط بيانات غير متوقع. لم يتم حذف الطلبات.':'تعذر حذف الطلبات المحددة. لم يتم حذف الطلبات.'));
    updateCancelledBulkState();
  }finally{
    if(btn)btn.disabled=false;
  }
}
function renderOrders(orders){
  const q=($('orderSearch').value||'').trim().toLowerCase();
  const f=$('statusFilter').value||'';
  const rows=orders.filter(o=>{
    const st=canonicalStatus(o.status);
    const search=!q||String(o.order_number||'').toLowerCase().includes(q)||String(o.customer_phone||'').toLowerCase().includes(q);
    const statusOk=f==='cancelled'?st==='cancelled':(st!=='cancelled'&&(!f||(f==='processing'?processingStatuses.has(st):st===f)));
    return search&&statusOk;
  });
  const isCancelledView=f==='cancelled';
  if(!rows.length){$('ordersTable').innerHTML='<div class="empty">لا توجد طلبات مطابقة.</div>';return;}
  const bulkBar=isCancelledView?`<div class="cancelled-bulk-bar"><label class="cancelled-select-all"><input type="checkbox" id="selectAllCancelledOrders"> <span>تحديد كل الطلبات الظاهرة</span></label><span id="cancelledSelectedCount">لم يتم تحديد أي طلب</span><button type="button" id="bulkDeleteCancelledOrders" class="order-hard-delete" disabled>🗑️ حذف المحدد</button></div>`:'';
  $('ordersTable').innerHTML=bulkBar+`<div class="table-wrap"><table class="admin-table"><thead><tr>${isCancelledView?'<th class="cancelled-check-head">اختيار</th>':''}<th>الطلب</th><th>العميل</th><th>الهاتف</th><th>الموقع</th><th>الكمية</th><th>السعر</th><th>طريقة الدفع</th><th>المتعامل / الرقم</th><th>الحالة</th><th>التاريخ</th><th></th></tr></thead><tbody>${rows.map(o=>`<tr>${isCancelledView?`<td><input type="checkbox" class="cancelled-order-check" data-order-id="${esc(o.id)}" aria-label="تحديد الطلب #${esc(o.order_number)}"></td>`:''}<td>#${esc(o.order_number)}</td><td>${esc(`${o.customer_first_name||''} ${o.customer_last_name||''}`.trim()||'—')}</td><td>${esc(o.customer_phone||'—')}</td><td>${esc(o.source_site||'—')}</td><td>${Number(o.quantity)||1}</td><td>${formatMoney(o.total_price,o.currency)}</td><td>${esc(o.payment_method==='flexy'?'📱 فلكسي':o.payment_method==='barid_mob'?'💳 بريد موب':'—')}</td><td>${esc(o.payment_method==='flexy'?`${o.flexy_operator||'—'} • ${o.flexy_phone_snapshot||'—'}`:'—')}</td><td>${esc(gameStatusLabel(o))}</td><td>${formatDate(o.created_at)}</td><td><div class="order-row-actions"><button type="button" class="detail-btn" data-order-id="${esc(o.id)}">فتح</button><button type="button" class="order-hard-delete" data-hard-delete-order="${esc(o.id)}" title="حذف نهائي">🗑️ حذف نهائي</button></div></td></tr>`).join('')}</tbody></table></div>`;
  document.querySelectorAll('.cancelled-order-check').forEach(cb=>cb.addEventListener('change',updateCancelledBulkState));
  updateCancelledBulkState();
}
async function refreshAdmin(){const [or,ur,br]=await Promise.all([db.from('orders').select('*').order('created_at',{ascending:false}),db.from('profiles').select('*').order('created_at',{ascending:false})]);if(or.error){$('recentOrders').innerHTML='<div class="empty">تعذر تحميل الطلبات.</div>';return}cachedOrders=or.data||[];const activeOrders=cachedOrders.filter(o=>canonicalStatus(o.status)!=='cancelled');$('sTotal').textContent=cachedOrders.length;$('sNew').textContent=activeOrders.filter(o=>processingStatuses.has(canonicalStatus(o.status))).length;$('sAwaiting').textContent=activeOrders.filter(o=>canonicalStatus(o.status)==='awaiting_payment').length;$('sProof').textContent=activeOrders.filter(o=>canonicalStatus(o.status)==='payment_submitted').length;$('sPaid').textContent=activeOrders.filter(o=>canonicalStatus(o.status)==='payment_confirmed').length;$('sDone').textContent=activeOrders.filter(o=>canonicalStatus(o.status)==='delivered').length;$('sCancelled').textContent=cachedOrders.filter(o=>canonicalStatus(o.status)==='cancelled').length;$('recentOrders').innerHTML=activeOrders.length?activeOrders.slice(0,8).map(orderRow).join(''):'<div class="empty">لا توجد طلبات نشطة.</div>';renderOrders(cachedOrders);const users=ur.data||[];$('usersTable').innerHTML=users.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>الاسم</th><th>اللقب</th><th>الهاتف</th><th>التاريخ</th></tr></thead><tbody>${users.map(u=>`<tr><td>${esc(u.first_name||'—')}</td><td>${esc(u.last_name||'—')}</td><td>${esc(u.phone||'—')}</td><td>${formatDate(u.created_at)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">لا يوجد مستخدمون بعد.</div>';initIcons()}
async function refreshAdminMessages(){
  const box=$('adminMessagesList');
  box.innerHTML='<div class="empty">جارٍ تحميل رسائل العملاء…</div>';
  const {data,error}=await db.from('support_messages')
    .select('id,user_id,message,sender_role,created_at,order_id,reply_to_message_id,forwarded_from_message_id,deleted_at,deleted_for_everyone')
    .order('created_at',{ascending:false}).limit(200);
  if(error){box.innerHTML='<div class="empty">تعذر تحميل رسائل العملاء.</div>';updateSelectedMessagesUI();return}
  const groups=new Map();
  for(const m of data||[]){if(!groups.has(m.user_id))groups.set(m.user_id,[]);groups.get(m.user_id).push(m)}
  const ids=[...groups.keys()];
  let profiles=[];
  if(ids.length){const r=await db.from('profiles').select('id,first_name,last_name,phone').in('id',ids);profiles=r.data||[]}
  const pm=new Map(profiles.map(x=>[x.id,x]));
  box.innerHTML=ids.length?[...groups.entries()].map(([uid,arr])=>{
    const p=pm.get(uid)||{};
    return `<article class="admin-chat-card">
      <div class="admin-chat-head"><div><b>${esc(`${p.first_name||''} ${p.last_name||''}`.trim()||'عميل')}</b><small>${esc(p.phone||'')}</small></div><div class="admin-chat-head-actions"><span>${formatDate(arr[0].created_at)}</span><button type="button" class="admin-delete-customer" data-admin-delete-customer="${esc(uid)}" title="حذف محادثة العميل بالكامل">🗑️ حذف العميل</button></div></div>
      <div class="admin-chat-thread">${arr.slice().reverse().map(m=>{
        const deleted=!!m.deleted_for_everyone;
        return `<div class="chat-bubble ${m.sender_role==='admin'?'admin-msg':'mine'} ${deleted?'message-deleted':''} admin-chat-bubble-wrap" data-admin-message-id="${esc(m.id)}">
          ${!deleted?`<input type="checkbox" class="admin-message-select" data-message-select="${esc(m.id)}" aria-label="تحديد الرسالة">`:''}
          <p class="message-text">${esc(deleted?'تم حذف هذه الرسالة':m.message)}</p>
          <small>${m.sender_role==='admin'?'FENK':'العميل'} • ${formatDate(m.created_at)}</small>
          ${!deleted?`<button type="button" class="admin-delete-message" data-admin-delete-message="${esc(m.id)}">🗑️ حذف</button>`:''}
        </div>`;
      }).join('')}</div>
      <form class="admin-reply-form" data-user-id="${esc(uid)}"><textarea rows="2" maxlength="4000" placeholder="اكتب ردًا للعميل..."></textarea><button class="send" type="submit">إرسال الرد</button></form>
    </article>`;
  }).join(''):'<div class="empty">لا توجد رسائل من العملاء بعد.</div>';

  box.querySelectorAll('.admin-reply-form').forEach(f=>f.onsubmit=async e=>{
    e.preventDefault();
    const ta=f.querySelector('textarea'),text=ta.value.trim();if(!text)return;
    const b=f.querySelector('button');b.disabled=true;
    const {error}=await db.from('support_messages').insert({user_id:f.dataset.userId,sender_role:'admin',message:text});
    if(!error){ta.value='';await refreshAdminMessages()}else alert('تعذر إرسال الرد.');
    b.disabled=false;
  });

  box.querySelectorAll('[data-admin-delete-customer]').forEach(btn=>btn.onclick=async()=>{
    const uid=btn.dataset.adminDeleteCustomer;
    if(!uid)return;
    const card=btn.closest('.admin-chat-card');
    const name=card?.querySelector('.admin-chat-head b')?.textContent?.trim()||'هذا العميل';
    if(!confirm(`حذف عميل «${name}» نهائيًا؟\nسيتم حذف جميع رسائل هذا العميل من شاشة الرسائل، بما فيها رسائل العميل وردود Admin. لن يتم حذف حسابه أو طلباته أو إعلاناته.`))return;
    btn.disabled=true;
    const {error}=await db.rpc('admin_hard_delete_customer_messages',{p_user_id:uid});
    if(error){alert('تعذر حذف العميل: '+(error.message||'خطأ غير معروف'));btn.disabled=false;return}
    await refreshAdminMessages();
  });

  box.querySelectorAll('[data-admin-delete-message]').forEach(btn=>btn.onclick=async()=>{
    if(!confirm('هل تريد حذف هذه الرسالة للجميع؟'))return;
    btn.disabled=true;
    const {error}=await db.rpc('delete_support_message_for_everyone',{p_message_id:btn.dataset.adminDeleteMessage});
    if(error){alert('تعذر حذف الرسالة.');btn.disabled=false;return}
    await refreshAdminMessages();
  });

  box.querySelectorAll('[data-message-select]').forEach(cb=>cb.addEventListener('change',updateSelectedMessagesUI));
  updateSelectedMessagesUI();
  initIcons();
}
function getSelectedMessageIds(){
  return [...document.querySelectorAll('#adminMessagesList [data-message-select]:checked')].map(x=>x.dataset.messageSelect).filter(Boolean);
}
function updateSelectedMessagesUI(){
  const ids=getSelectedMessageIds();
  const countEl=$('selectedMessagesCount'),delBtn=$('deleteSelectedMessagesBtn'),all=$('selectAllMessages');
  if(countEl)countEl.textContent=String(ids.length);
  if(delBtn)delBtn.disabled=ids.length===0;
  const boxes=[...document.querySelectorAll('#adminMessagesList [data-message-select]')];
  if(all){
    all.checked=boxes.length>0&&boxes.every(x=>x.checked);
    all.indeterminate=boxes.some(x=>x.checked)&&!all.checked;
  }
}
document.addEventListener('change',e=>{
  if(e.target?.id==='selectAllMessages'){
    document.querySelectorAll('#adminMessagesList [data-message-select]').forEach(cb=>cb.checked=e.target.checked);
    updateSelectedMessagesUI();
  }
});
document.addEventListener('click',async e=>{
  const btn=e.target.closest?.('#deleteSelectedMessagesBtn');
  if(!btn||btn.disabled)return;
  const ids=getSelectedMessageIds();
  if(!ids.length)return;
  if(!confirm(`هل تريد حذف ${ids.length} رسالة محددة للجميع؟ لا يمكن التراجع عن هذا الإجراء.`))return;
  btn.disabled=true;
  let ok=0,failed=0;
  for(const id of ids){
    const {error}=await db.rpc('delete_support_message_for_everyone',{p_message_id:id});
    if(error)failed++;else ok++;
  }
  if(failed)alert(`تم حذف ${ok} رسالة، وتعذر حذف ${failed} رسالة.`);
  await refreshAdminMessages();
});
function fenkEventHash(value=''){
  let h=2166136261;
  for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return (h>>>0).toString(16);
}
async function createCustomerStatusNotification(order, oldStatus, newStatus, oldPaymentInfo=''){
  if(!order?.user_id)return {ok:false,reason:'NO_USER'};
  const paymentInfo=String(order.payment_info||'').trim();
  const adminNote=String(order.admin_note||'').trim();
  const total=Number(order.total_price);
  const paymentChanged=paymentInfo!==String(oldPaymentInfo||'').trim();
  // Important: if the order is already confirmed and the admin only adds/changes
  // the payment information, still send the payment details to the customer.
  // Notify when payment information becomes available, even while the order is still waiting for payment.
  // Also notify on confirmation, and when payment information is changed after confirmation.
  if(oldStatus===newStatus && !(paymentChanged && paymentInfo))return {ok:true,skipped:true};
  const isGame=!!(order.game_id||order.package_id);
  const labels=isGame
    ? {payment_submitted:'تم استلام وصل الدفع الخاص باللعبة',payment_confirmed:'تم تأكيد الدفع للعبة',completed:'تم شحن اللعبة',cancelled:'تم إلغاء طلب اللعبة'}
    : {received:'تم استلام طلبك',pricing:'تم تحديد سعر طلبك',awaiting_payment:'طلبك بانتظار الدفع',payment_submitted:'تم استلام وصل الدفع الخاص بطلبك',payment_confirmed:'تم قبول طلبك وتأكيد الدفع ✓',purchasing:'جارٍ تجهيز طلبك للشراء',shipped:'تم شحن طلبك',arrived_algeria:'وصل طلبك إلى الجزائر',out_for_delivery:'طلبك خرج للتوصيل',delivered:'تم تسليم طلبك',cancelled:'تم إلغاء طلبك'};
  const paymentAvailable=!!paymentInfo && paymentChanged;
  const title=newStatus==='payment_confirmed'?'تم قبول طلبك وتأكيد الدفع ✓':(paymentAvailable?'معلومات الدفع متاحة 💳':(labels[newStatus]||'تم تحديث طلبك'));
  let message=paymentAvailable && newStatus==='awaiting_payment'
    ? `تم تحديد سعر طلبك #${order.order_number||''} وأصبحت معلومات الدفع متاحة.`
    : `تم تحديث حالة طلبك #${order.order_number||''}: ${labels[newStatus]||'تم تحديث طلبك'}.`;
  if(paymentInfo) message += `\n\n💳 معلومات الدفع: ${paymentInfo}`;
  if(adminNote) message += `\n📝 ملاحظة الإدارة: ${adminNote}`;
  if(Number.isFinite(total)&&total>0) message += `\n💰 المبلغ الإجمالي: ${total.toLocaleString('ar-DZ')} دج`;
  if(paymentInfo || newStatus==='payment_confirmed') message += '\n\nيمكنك فتح الطلب من الإشعار لمشاهدة التفاصيل كاملة.';
  const event_key=`order:${order.id}:${newStatus}:${fenkEventHash(paymentInfo)}`;const {error}=await db.from('order_notifications').insert({recipient_user_id:order.user_id,order_id:order.id,title,message,is_read:false,event_key});
  if(error){console.warn('Customer notification insert failed:',error);return {ok:false,error};}
  return {ok:true};
}

async function openOrderDetail(id){
  const o=cachedOrders.find(x=>String(x.id)===String(id));
  if(!o){console.warn('FENK: order not found',id,cachedOrders.length);const m=$('orderDetailMsg');if(m)m.textContent='لم يتم العثور على هذا الطلب.';return;}
  selectedOrderId=id;
  $('detailOrderNumber').textContent='#'+o.order_number;
  $('detailProductPrice').value=o.product_price??'';$('detailShipping').value=o.shipping_fee??'';$('detailService').value=o.service_fee??'';$('detailTotalPrice').value=o.total_price??'';
  const isGame=!!(o.game_id||o.package_id);
  const statusSelect=$('detailStatus');
  if(statusSelect){
    statusSelect.innerHTML=isGame
      ? (o.payment_method==='flexy' ? '<option value="processing">🟡 قيد المعالجة</option><option value="shipped">🟢 تم الشحن</option><option value="failed">🔴 فشل</option><option value="cancelled">إلغاء الطلب</option>' : '<option value="payment_submitted">انتظار التحقق من الإثبات</option><option value="payment_confirmed">تم تأكيد الدفع</option><option value="completed">🟢 تم الشحن</option><option value="failed">🔴 رفض أو فشل</option><option value="cancelled">تم إلغاء الطلب</option>')
      : '<option value="received">تم استلام الطلب</option><option value="pricing">تم تحديد السعر</option><option value="awaiting_payment">بانتظار الدفع</option><option value="payment_submitted">تم إرسال وصل الدفع</option><option value="payment_confirmed">تم تأكيد الدفع</option><option value="purchasing">جارٍ شراء المنتج</option><option value="shipped">تم شحن المنتج</option><option value="arrived_algeria">وصل إلى الجزائر</option><option value="out_for_delivery">خرج للتوصيل</option><option value="delivered">تم التسليم</option><option value="cancelled">الطلبات الملغاة</option>';
    statusSelect.value=canonicalStatus(o.status);
  }
  $('detailCarrierName').value=o.carrier_name||'';$('detailTrackingNumber').value=o.tracking_number||'';$('detailTrackingUrl').value=o.tracking_url||'';$('detailPaymentInfo').value=o.payment_info||'';$('detailAdminNote').value=o.admin_note||'';
  const adminPaymentInfo=String(o.payment_info||'').trim();
  let proofHtml=''; if(o.payment_proof_path){ try{const sr=await db.storage.from('fenk-game-payment-proofs').createSignedUrl(o.payment_proof_path,600); if(sr?.data?.signedUrl) proofHtml=`<div class="full-field admin-payment-preview"><b>إثبات الدفع</b><span><a href="${esc(sr.data.signedUrl)}" target="_blank" rel="noopener">فتح إثبات الدفع</a></span></div>`;}catch(e){console.warn('proof signed url',e)} }
  const p=String(o.customer_phone||'').replace(/\D/g,'').replace(/^0/,'213');
  $('whatsappOrder').href=p?`https://wa.me/${p}?text=${encodeURIComponent(`مرحبًا ${o.customer_first_name||''}، معك FENK بخصوص طلبك #${o.order_number}.`)}`:'#';
  const fields=o.player_data?.fields&&typeof o.player_data.fields==='object'?o.player_data.fields:{};
  const fieldEntries=Object.entries(fields);
  let gameFieldsHtml=''; if(fieldEntries.length){ let inner=''; for(const [k,v] of fieldEntries){ const sensitive=/password|pass|secret/i.test(k); inner += '<div><b>'+esc(k)+'</b><span class="order-secret" data-secret="'+(sensitive?'1':'0')+'" data-value="'+esc(String(v??''))+'">'+(sensitive?'••••••••':' '+esc(String(v??'—')) )+'</span>'+(sensitive?'<button type="button" class="reveal-secret" data-secret-toggle>إظهار</button>':'')+'</div>'; } gameFieldsHtml='<div class="full-field game-order-fields"><b>بيانات اللعبة</b><div class="order-game-fields">'+inner+'</div></div>'; }
  $('orderDetailContent').innerHTML=`<div class="detail-grid"><div><b>الاسم واللقب</b><span>${esc(`${o.customer_first_name||''} ${o.customer_last_name||''}`.trim()||o.customer_name||'—')}</span></div><div><b>الهاتف</b><span>${esc(o.customer_phone||'—')}</span></div><div><b>الولاية</b><span>${esc(o.wilaya||'—')}</span></div><div><b>البلدية</b><span>${esc(o.commune||'—')}</span></div><div><b>الرمز البريدي</b><span>${esc(o.postal_code||'—')}</span></div><div class="full-field"><b>العنوان</b><span>${esc(o.address||'—')}</span></div><div><b>السلعة</b><span>${esc(o.product_name||'—')}</span></div><div><b>معلومات السلعة</b><span>${esc(o.product_info||'—')}</span></div>${o.product_id?`<div><b>خيارات المنتج</b><span>${esc(Object.entries(o.product_options||{}).map(([k,v])=>k+': '+v).join(' • ')||'—')}</span></div><div><b>نوع الطلب</b><span>🛍️ منتج FENK</span></div>`:''}<div><b>رابط السلعة</b><span>${o.product_url?`<a href="${esc(o.product_url)}" target="_blank" rel="noopener">فتح الرابط</a>`:'—'}</span></div><div><b>الكمية</b><span>${Number(o.quantity)||1}</span></div><div><b>تاريخ الطلب</b><span>${formatDate(o.created_at)}</span></div>${o.payment_method==='flexy'?`<div><b>طريقة الدفع</b><span>📱 فلكسي</span></div><div><b>المتعامل</b><span>${esc(o.flexy_operator||'—')}</span></div><div><b>رقم فلكسي المستخدم</b><span dir="ltr">${esc(o.flexy_phone_snapshot||'—')}</span></div><div><b>حالة تنفيذ الفلكسي</b><span>${esc(gameStatusLabel(o))}</span></div>`:''}${o.game_id||o.package_id?`<div><b>اللعبة</b><span>${esc(o.player_data?.game||o.product_name||'—')}</span></div><div><b>الباقة</b><span>${esc(o.player_data?.package||'—')}</span></div><div><b>Player ID</b><span>${esc(o.player_id||'—')}</span></div>${gameFieldsHtml}`:''}${adminPaymentInfo?`<div class="full-field admin-payment-preview"><b>حساب الدفع للطلب</b><span>${esc(adminPaymentInfo)}</span></div>`:''}${proofHtml}</div>`;
  $('orderDetailContent').querySelectorAll('[data-secret-toggle]').forEach(btn=>btn.onclick=()=>{const span=btn.previousElementSibling;if(!span)return;const shown=span.dataset.shown==='1';span.textContent=shown?'••••••••':span.dataset.value;span.dataset.shown=shown?'0':'1';btn.textContent=shown?'إظهار':'إخفاء';});
  $('orderDetailModal').classList.add('show');
}
$('closeOrderDetail').onclick=()=>$('orderDetailModal').classList.remove('show');$('orderDetailModal').onclick=e=>{if(e.target===$('orderDetailModal'))$('orderDetailModal').classList.remove('show')};
$('saveOrderDetail').onclick=async()=>{if(!selectedOrderId)return;const b=$('saveOrderDetail');b.disabled=true;try{const pr=$('detailProductPrice').value===''?null:Number($('detailProductPrice').value),sh=$('detailShipping').value===''?null:Number($('detailShipping').value),sv=$('detailService').value===''?null:Number($('detailService').value);if([pr,sh,sv].some(x=>x!==null&&(!Number.isFinite(x)||x<0)))throw Error();const total=pr!==null&&sh!==null&&sv!==null?pr+sh+sv:null;let status=$('detailStatus').value;if(status==='pricing'&&(!Number.isFinite(total)||total<=0))throw Error();if(total!==null&&total>0&&status==='received')status='pricing';const previousOrder=cachedOrders.find(x=>String(x.id)===String(selectedOrderId))||{};const oldStatus=canonicalStatus(previousOrder.status);const flexyFailureAction=status==='failed'&&previousOrder.payment_method==='flexy'?(prompt('إجراء معالجة الفشل: اكتب refund أو retry أو manual','refund')||'refund'):null;const oldPaymentInfo=String(previousOrder.payment_info||'').trim();const {error}=await db.from('orders').update({product_price:pr,shipping_fee:sh,service_fee:sv,status,carrier_name:$('detailCarrierName').value.trim()||null,tracking_number:$('detailTrackingNumber').value.trim()||null,tracking_url:$('detailTrackingUrl').value.trim()||null,payment_info:$('detailPaymentInfo').value.trim()||null,admin_note:$('detailAdminNote').value.trim()||null,flexy_failure_action:flexyFailureAction,updated_at:new Date().toISOString()}).eq('id',selectedOrderId);if(error)throw error;const updatedOrder={...previousOrder,status,payment_info:$('detailPaymentInfo').value.trim()||null,admin_note:$('detailAdminNote').value.trim()||null,total_price:total};const notif=await createCustomerStatusNotification(updatedOrder,oldStatus,status,oldPaymentInfo);$('orderDetailMsg').textContent=notif?.ok===false?'تم حفظ التعديلات، لكن تعذر إنشاء إشعار للزبون.':'تم حفظ التعديلات ✓';if(status==='cancelled'){$('orderDetailModal').classList.remove('show');selectedOrderId=null;}await refreshAdmin()}catch{$('orderDetailMsg').textContent='تعذر حفظ التعديلات.'}finally{b.disabled=false}};
$('orderSearch').oninput=()=>renderOrders(cachedOrders);$('statusFilter').onchange=()=>renderOrders(cachedOrders);
document.querySelectorAll('.stat-filter').forEach(card=>{const apply=()=>{const filter=card.dataset.filter||'';$('statusFilter').value=filter;const ordersTab=document.querySelector('.admin-tab[data-tab="orders"]');if(ordersTab){ordersTab.click();}else renderOrders(cachedOrders);};card.addEventListener('click',apply);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();apply();}});});

// FENK V57 — Admin game packages + Barid Mob settings
let adminGames=[];
let adminPackages=[];

function setAdminMsg(id,text,type=''){
  const el=$(id); if(!el)return;
  el.textContent=text||'';
  el.className='admin-msg'+(type?' '+type:'');
}

function resetPackageForm(){
  $('packageId').value='';
  $('packageName').value='';
  if($('packageSelect')) $('packageSelect').value='';
  $('packageAmount').value='';
  $('packageDescription').value='';
  $('packageImage').value='';
  $('packageImagePreview').innerHTML='<span class="no-image">لا توجد صورة محددة</span>';
  $('packagePriceDzd').value=''; if($('packageFlexyPriceDzd'))$('packageFlexyPriceDzd').value='';
  $('packageOriginalPriceDzd').value='';
  $('packageSort').value='0';
  $('packageActive').checked=true;
  $('savePackageBtn').textContent='إضافة الباقة';
}

function populatePackageSelect(){
  const select=$('packageSelect');
  if(!select)return;
  const gameId=$('packageGame')?.value||'';
  const list=adminPackages.filter(p=>!gameId || String(p.game_id)===String(gameId));
  const current=String(select.value||'');
  select.innerHTML='<option value="">— اختر باقة للتعديل —</option>'+list.map(p=>`<option value="${esc(p.id)}">${esc(p.name||'بدون اسم')} — ${esc(p.amount||'')} — ${Number(p.payment_price_dzd??p.price_dzd??0).toLocaleString('ar-DZ')} دج</option>`).join('');
  if(list.some(p=>String(p.id)===current)) select.value=current;
}
function fillPackageForm(pkg){
  if(!pkg)return;
  $('packageId').value=pkg.id||'';
  $('packageGame').value=pkg.game_id||'';
  $('packageName').value=pkg.name||'';
  $('packageDescription').value=pkg.description||'';
  $('packageAmount').value=pkg.amount||'';
  $('packageImage').value='';
  $('packageImagePreview').innerHTML=pkg.image_url?`<img src="${esc(pkg.image_url)}" alt="صورة الباقة">`:'<span class="no-image">لا توجد صورة حالية</span>';
  $('packagePriceDzd').value=pkg.payment_price_dzd??pkg.price_dzd??'';
  if($('packageFlexyPriceDzd'))$('packageFlexyPriceDzd').value=pkg.flexy_price_dzd??'';
  $('packageOriginalPriceDzd').value=pkg.original_price_dzd??'';
  $('packageSort').value=pkg.sort_order??0;
  $('packageActive').checked=!!pkg.is_active;
  $('savePackageBtn').textContent='حفظ تعديل الباقة';
}

async function loadAdminGamesAndPackages(){
  // حمّل الألعاب أولاً ثم الباقات حتى يكون اختيار اللعبة معروفاً عند بناء قائمة الباقات.
  const gr=await db.from('games').select('id,name,slug,is_active,sort_order').order('sort_order',{ascending:true});
  if(gr.error) throw gr.error;
  adminGames=gr.data||[];

  const gameSelect=$('packageGame');
  const previousGame=gameSelect?.value||'';
  if(gameSelect){
    gameSelect.innerHTML=adminGames.length
      ? adminGames.map(g=>`<option value="${esc(g.id)}">${esc(g.name)}${g.is_active?'':' — غير مفعلة'}</option>`).join('')
      : '<option value="">لا توجد ألعاب</option>';
    if(previousGame && adminGames.some(g=>String(g.id)===String(previousGame))) gameSelect.value=previousGame;
    else if(adminGames[0]) gameSelect.value=adminGames[0].id;
  }

  const pr=await db.from('game_packages')
    .select('id,game_id,name,description,amount,image_url,price_dzd,payment_price_dzd,flexy_price_dzd,original_price_dzd,is_active,sort_order')
    .order('sort_order',{ascending:true});
  if(pr.error) throw pr.error;
  adminPackages=pr.data||[];

  // مهم: بعد تحديد اللعبة نملأ قائمة الباقات الخاصة بها فقط.
  populatePackageSelect();

  const filter=$('packageGameFilter');
  if(filter){
    const current=filter.value;
    filter.innerHTML='<option value="">كل الألعاب</option>'+adminGames.map(g=>`<option value="${esc(g.id)}">${esc(g.name)}${g.is_active?'':' — غير مفعلة'}</option>`).join('');
    if([...filter.options].some(o=>o.value===current)) filter.value=current;
  }
  renderAdminPackages();
}

function renderAdminPackages(){
  const box=$('packagesTable'); if(!box)return;
  const gamesMap=new Map(adminGames.map(g=>[String(g.id),g.name]));
  const filterId=$('packageGameFilter')?.value||'';
  const visiblePackages=filterId
    ? adminPackages.filter(p=>String(p.game_id)===String(filterId))
    : adminPackages;
  if(!visiblePackages.length){
    box.innerHTML='<div class="empty">لا توجد باقات لهذه اللعبة حاليًا. أضف باقة من النموذج أعلاه.</div>';
    return;
  }
  box.innerHTML=`<div class="table-wrap"><table class="packages-admin-table">
    <thead><tr><th>الصورة</th><th>اللعبة</th><th>الباقة</th><th>القيمة</th><th>السعر</th><th>فلكسي</th><th>الحالة</th><th>إجراءات</th></tr></thead>
    <tbody>${visiblePackages.map(p=>{
      const price=p.payment_price_dzd??p.price_dzd; const original=p.original_price_dzd;
      return `<tr>
        <td data-label="الصورة">${p.image_url?`<img src="${esc(p.image_url)}" alt="" style="width:64px;height:48px;object-fit:contain;border-radius:8px;border:1px solid #dce7e3;background:#f7fbf9;padding:3px">`:'—'}</td>
        <td data-label="اللعبة">${esc(gamesMap.get(String(p.game_id))||'—')}</td>
        <td data-label="الباقة"><b>${esc(p.name||'—')}</b>${p.description?`<small style="display:block;color:#73817f;margin-top:3px">${esc(p.description)}</small>`:''}</td>
        <td data-label="القيمة">${esc(p.amount||'—')}</td>
        <td data-label="السعر">${Number.isFinite(Number(price))?Number(price).toLocaleString('ar-DZ')+' دج':'—'}${original&&Number(original)>Number(price)?`<br><del>${Number(original).toLocaleString('ar-DZ')} دج</del>`:''}</td><td data-label="فلكسي">${p.flexy_price_dzd!=null?Number(p.flexy_price_dzd).toLocaleString('ar-DZ')+' دج':'غير محدد'}</td>
        <td data-label="الحالة"><span class="package-status ${p.is_active?'':'off'}">${p.is_active?'مفعلة':'متوقفة'}</span></td>
        <td data-label="إجراءات"><div class="package-actions">
          <button type="button" data-package-action="edit" data-package-id="${esc(p.id)}">تعديل</button>
          <button type="button" data-package-action="toggle" data-package-id="${esc(p.id)}">${p.is_active?'إيقاف':'تفعيل'}</button>
          <button type="button" class="danger" data-package-action="delete" data-package-id="${esc(p.id)}">حذف</button>
        </div></td>
      </tr>`;
    }).join('')}</tbody></table></div>`;
}

async function refreshGamePackagesAdmin(){
  try{
    setAdminMsg('packageMsg','جارٍ تحميل الباقات…');
    await loadAdminGamesAndPackages();
    resetPackageForm();
    setAdminMsg('packageMsg','تم تحميل الباقات ✓','success');
  }catch(e){
    console.error('FENK packages:',e);
    setAdminMsg('packageMsg','تعذر تحميل الباقات. تأكد من صلاحيات Admin وRLS.','error');
  }
}

async function uploadGamePackageImage(file,gameId){
  if(!file)return null;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024) throw new Error('صورة الباقة يجب أن تكون JPG/PNG/WEBP وبحد أقصى 8MB.');
  const {data:{session}}=await db.auth.getSession();
  if(!session?.user)throw new Error('انتهت جلسة Admin. سجّل الدخول مرة أخرى.');
  const ext=(file.type.split('/')[1]||'jpg').replace('jpeg','jpg');
  const path=`${session.user.id}/game-packages/${gameId||'new'}/${crypto.randomUUID()}.${ext}`;
  const up=await db.storage.from('marketplace-images').upload(path,file,{contentType:file.type,upsert:false});
  if(up.error)throw up.error;
  return db.storage.from('marketplace-images').getPublicUrl(path).data.publicUrl||null;
}

$('packageForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=$('savePackageBtn'); btn.disabled=true;
  try{
    const gameId=$('packageGame').value;
    const name=$('packageName').value.trim();
    const description=$('packageDescription').value.trim()||null;
    const amount=$('packageAmount').value.trim()||name;
    const price=Number($('packagePriceDzd').value);
    const sort=Math.max(0,Number($('packageSort').value)||0);
    const active=$('packageActive').checked;
    if(!gameId||!name||!Number.isFinite(price)||price<0) throw new Error('أكمل اللعبة واسم الباقة والسعر بشكل صحيح.');
    const id=$('packageId').value.trim();
    const originalRaw=Number($('packageOriginalPriceDzd').value); const original=Number.isFinite(originalRaw)&&originalRaw>price?originalRaw:null;
    const imageFile=$('packageImage')?.files?.[0]||null;
    let imageUrl=null;
    if(imageFile) imageUrl=await uploadGamePackageImage(imageFile,gameId);
    const flexyRaw=Number($('packageFlexyPriceDzd')?.value); if(Number.isFinite(flexyRaw)&&flexyRaw>600) throw Error('سعر فلكسي يجب ألا يتجاوز 600 دج.'); const flexyPrice=Number.isFinite(flexyRaw)&&flexyRaw>=0?flexyRaw:null;
    const payload={game_id:gameId,name,description,amount,price_dzd:price,payment_price_dzd:price,flexy_price_dzd:flexyPrice,original_price_dzd:original,is_active:active,sort_order:sort};
    if(imageUrl) payload.image_url=imageUrl;
    const r=id
      ? await db.from('game_packages').update(payload).eq('id',id)
      : await db.from('game_packages').insert(payload);
    if(r.error) throw r.error;
    setAdminMsg('packageMsg',id?'تم تعديل الباقة ✓':'تمت إضافة الباقة ✓','success');
    resetPackageForm();
    await loadAdminGamesAndPackages();
  }catch(err){
    console.error('FENK save package:',err);
    setAdminMsg('packageMsg',err?.message||'تعذر حفظ الباقة.','error');
  }finally{btn.disabled=false;}
});

$('cancelPackageEdit')?.addEventListener('click',()=>{resetPackageForm();setAdminMsg('packageMsg','');});
$('packageImage')?.addEventListener('change',e=>{const f=e.target.files?.[0];$('packageImagePreview').innerHTML=f?`<img src="${URL.createObjectURL(f)}" alt="معاينة">`:'<span class="no-image">لا توجد صورة محددة</span>';});

$('packageGame')?.addEventListener('change',()=>{
  populatePackageSelect();
  const selected=$('packageSelect')?.value;
  if(selected){ const pkg=adminPackages.find(x=>String(x.id)===String(selected)); if(pkg) fillPackageForm(pkg); }
});
$('packageSelect')?.addEventListener('change',()=>{
  const id=$('packageSelect').value;
  if(!id){ resetPackageForm(); return; }
  const pkg=adminPackages.find(x=>String(x.id)===String(id));
  if(pkg){ fillPackageForm(pkg); $('packageForm').scrollIntoView({behavior:'smooth',block:'start'}); }
});

$('reloadPackagesBtn')?.addEventListener('click',()=>refreshGamePackagesAdmin());
$('packageGameFilter')?.addEventListener('change',()=>renderAdminPackages());

$('packagesTable')?.addEventListener('click',async e=>{
  const btn=e.target.closest?.('[data-package-action]'); if(!btn)return;
  const id=btn.dataset.packageId;
  const pkg=adminPackages.find(x=>String(x.id)===String(id)); if(!pkg)return;
  const action=btn.dataset.packageAction;
  if(action==='edit'){
    $('packageSelect').value=pkg.id;
    fillPackageForm(pkg);
    $('packageForm').scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  btn.disabled=true;
  try{
    if(action==='toggle'){
      const r=await db.from('game_packages').update({is_active:!pkg.is_active}).eq('id',id);
      if(r.error)throw r.error;
      setAdminMsg('packageMsg',pkg.is_active?'تم إيقاف الباقة ✓':'تم تفعيل الباقة ✓','success');
    }else if(action==='delete'){
      if(!confirm(`حذف باقة «${pkg.name||''}»؟ لن يتم حذف الطلبات القديمة المرتبطة بها.`))return;
      const r=await db.from('game_packages').delete().eq('id',id);
      if(r.error)throw r.error;
      setAdminMsg('packageMsg','تم حذف الباقة ✓','success');
    }
    await loadAdminGamesAndPackages();
  }catch(err){
    console.error('FENK package action:',err);
    setAdminMsg('packageMsg',err?.message||'تعذر تنفيذ العملية.','error');
  }finally{btn.disabled=false;}
});

async function refreshPaymentSettingsAdmin(){
  try{
    setAdminMsg('paymentSettingsMsg','جارٍ تحميل إعدادات الدفع…');
    const {data,error}=await db.from('payment_settings').select('id,method,display_name,account_number,phone_number,instructions,is_active').eq('method','barid_mob').maybeSingle();
    if(error)throw error;
    if(!data){setAdminMsg('paymentSettingsMsg','لم يتم العثور على إعداد بريد موب. شغّل ترقية قاعدة البيانات المرفقة مع المشروع.','error');return;}
    $('baridDisplayName').value=data.display_name||'';
    $('baridAccountNumber').value=data.account_number||'';
    $('baridPhoneNumber').value=data.phone_number||'';
    $('baridInstructions').value=data.instructions||'';
    $('baridActive').checked=data.is_active!==false;
    setAdminMsg('paymentSettingsMsg','تم تحميل إعدادات بريد موب ✓','success');
  }catch(err){
    console.error('FENK payment settings:',err);
    setAdminMsg('paymentSettingsMsg','تعذر تحميل إعدادات الدفع.','error');
  }
}

async function refreshMarketplaceFeeAdmin(){
  try{
    setAdminMsg('marketplaceFeeMsg','جارٍ تحميل رسوم الإعلان…');
    const {data,error}=await db.from('marketplace_packages').select('id,fee_dzd,duration_days,is_active').eq('duration_days',30).order('sort_order',{ascending:true}).limit(1).maybeSingle();
    if(error)throw error;
    if(!data){setAdminMsg('marketplaceFeeMsg','لم يتم العثور على باقة 30 يوم.','error');return;}
    $('marketplaceAdFee').value=data.fee_dzd??'';
    const pay=await db.from('payment_settings').select('display_name,account_number,phone_number,instructions,is_active').eq('method','barid_mob').maybeSingle();
    if(pay.data){
      $('marketplaceBaridAccount').value=pay.data.account_number||'';
      $('marketplaceBaridName').value=pay.data.display_name||'';
      $('marketplaceBaridPhone').value=pay.data.phone_number||'';
      $('marketplaceBaridInstructions').value=pay.data.instructions||'';
    }
    const ss=await db.from('site_settings').select('marketplace_ads_enabled,ad_posting_payment_enabled').eq('id',true).maybeSingle();
    if(ss.error)throw ss.error;
    $('marketplaceAdsEnabled').checked=ss.data?.marketplace_ads_enabled!==false;
    $('adPostingFree').checked=ss.data?.ad_posting_payment_enabled!==true;
    $('adPostingPaid').checked=ss.data?.ad_posting_payment_enabled===true;
    toggleMarketplacePaidSettings();
    setAdminMsg('marketplaceFeeMsg','تم تحميل إعدادات الإعلانات ✓','success');
  }catch(err){ console.error('FENK marketplace fee:',err); setAdminMsg('marketplaceFeeMsg',err?.message||'تعذر تحميل رسوم الإعلان.','error'); }
}
function toggleMarketplacePaidSettings(){
  const paid=$('adPostingPaid')?.checked===true;
  const box=$('marketplacePaidSettings');
  if(box)box.style.display=paid?'block':'none';
}
$('adPostingFree')?.addEventListener('change',toggleMarketplacePaidSettings);
$('adPostingPaid')?.addEventListener('change',toggleMarketplacePaidSettings);

$('marketplaceFeeForm')?.addEventListener('submit',async e=>{
  e.preventDefault(); const btn=$('saveMarketplaceFeeBtn'); btn.disabled=true;
  try{
    const paymentEnabled=$('adPostingPaid').checked;
    const fee=Number($('marketplaceAdFee').value);
    const account=$('marketplaceBaridAccount').value.replace(/\s+/g,'').trim();
    const displayName=$('marketplaceBaridName').value.trim()||'بريد موب';
    const phone=$('marketplaceBaridPhone').value.trim()||null;
    const instructions=$('marketplaceBaridInstructions').value.trim();
    if(paymentEnabled){
      if(!Number.isFinite(fee)||fee<=0) throw new Error('عند اختيار الدفع، أدخل مبلغ إعلان أكبر من 0 دج.');
      if(!account) throw new Error('عند اختيار الدفع، أدخل رقم حساب / RIP بريد موب.');
    }
    if(!paymentEnabled && (!Number.isFinite(fee)||fee<0)) throw new Error('أدخل مبلغًا صحيحًا.');
    // لا نحذف رسوم الإعلان المحفوظة عند اختيار المجاني.
    // عند العودة إلى الدفع، تبقى آخر قيمة محفوظة (مثل 300 دج).
    const packageUpdate = paymentEnabled
      ? await db.from('marketplace_packages').update({fee_dzd:fee,is_active:true}).eq('duration_days',30).select('id').limit(1)
      : await db.from('marketplace_packages').update({is_active:true}).eq('duration_days',30).select('id').limit(1);
    if(packageUpdate.error||!packageUpdate.data?.length) throw packageUpdate.error||new Error('لم يتم تحديث إعدادات رسوم الإعلان.');

    if(paymentEnabled){
      const payload={method:'barid_mob',display_name:displayName,account_number:account,phone_number:phone,instructions,is_active:true,updated_at:new Date().toISOString()};
      const existing=await db.from('payment_settings').select('id').eq('method','barid_mob').maybeSingle();
      if(existing.error)throw existing.error;
      const pr=existing.data
        ? await db.from('payment_settings').update(payload).eq('id',existing.data.id).select('id').single()
        : await db.from('payment_settings').insert(payload).select('id').single();
      if(pr.error||!pr.data)throw pr.error||new Error('تعذر حفظ حساب بريد موب.');
    }

    const enabled=$('marketplaceAdsEnabled').checked;
    const sr=await db.from('site_settings').update({marketplace_ads_enabled:enabled,ad_posting_payment_enabled:paymentEnabled,updated_at:new Date().toISOString()}).eq('id',true);
    if(sr.error) throw sr.error;
    setAdminMsg('marketplaceFeeMsg',paymentEnabled?'تم حفظ الدفع: المبلغ + حساب بريد موب سيظهران للزبون ✓':'تم حفظ الإعدادات: النشر المجاني مفعّل ✓','success');
    toggleMarketplacePaidSettings();
  }catch(err){console.error('FENK marketplace fee save:',err);setAdminMsg('marketplaceFeeMsg',err?.message||'تعذر حفظ إعدادات الإعلانات.','error');}
  finally{btn.disabled=false;}
});

$('paymentSettingsForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=$('savePaymentSettingsBtn');btn.disabled=true;
  try{
    const displayName=$('baridDisplayName').value.trim()||'بريد موب';
    const account=$('baridAccountNumber').value.replace(/\s+/g,'').trim();
    const phone=$('baridPhoneNumber').value.trim()||null;
    const instructions=$('baridInstructions').value.trim();
    const active=$('baridActive').checked;
    if(!account)throw new Error('أدخل رقم RIP / الحساب أولًا.');
    const payload={method:'barid_mob',display_name:displayName,account_number:account,phone_number:phone,instructions,is_active:active,updated_at:new Date().toISOString()};
    const {data:existing,error:findError}=await db.from('payment_settings').select('id').eq('method','barid_mob').maybeSingle();
    if(findError)throw findError;
    const result=existing ? await db.from('payment_settings').update(payload).eq('id',existing.id).select('id').single() : await db.from('payment_settings').insert(payload).select('id').single();
    if(result.error||!result.data)throw result.error||new Error('لم يتم تحديث إعداد الدفع.');
    setAdminMsg('paymentSettingsMsg','تم حفظ حساب بريد موب وإعداداته ✓','success');
  }catch(err){
    console.error('FENK payment save:',err);
    setAdminMsg('paymentSettingsMsg',err?.message||'تعذر حفظ إعدادات الدفع.','error');
  }finally{btn.disabled=false;}
});

function recalcDetailTotal(){const a=Number($('detailProductPrice')?.value),b=Number($('detailShipping')?.value),c=Number($('detailService')?.value);const vals=[$('detailProductPrice')?.value,$('detailShipping')?.value,$('detailService')?.value];$('detailTotalPrice').value=vals.every(v=>v!=='')&&[a,b,c].every(Number.isFinite)?a+b+c:'';}
['detailProductPrice','detailShipping','detailService'].forEach(id=>$(id)?.addEventListener('input',recalcDetailTotal));
window.fenkOpenOrderDetail=openOrderDetail;
boot();


// FENK V66 — Admin game metadata + per-game checkout fields
let gameSettingsCache=[];
let gameDisplaySettingsCache=new Map();
let checkoutFieldsCache=[];
let gameSettingsNewMode=false;
function updateGameEditorSelected(g){
  const img=document.getElementById('gameEditorSelectedImg');
  const name=document.getElementById('gameEditorSelectedName');
  const status=document.getElementById('gameEditorSelectedStatus');
  if(!img||!name||!status)return;
  if(!g){img.src='assets/logo-clean.webp';name.textContent='اختر لعبة للتعديل';status.textContent='—';return;}
  img.src=g.logo_url||g.banner_url||'assets/logo-clean.webp';
  name.textContent=g.name||'بدون اسم';
  status.textContent=g.is_active?'مفعلة':'مخفية';
  img.onerror=()=>{img.src='assets/logo-clean.webp'};
}

function renderGamesAdminCards(){
  const box=$('gamesAdminGrid'); if(!box)return;
  const rows=[...gameSettingsCache].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  if(!rows.length){box.innerHTML='<div class="game-admin-empty">لا توجد ألعاب في Supabase حاليًا.</div>';return;}
  box.innerHTML=rows.map(g=>{
    const img=g.logo_url||g.banner_url||'assets/logo-clean.webp';
    return `<article class="game-admin-card" data-game-card="${esc(g.id)}">
      <div class="game-admin-image"><img src="${esc(img)}" alt="${esc(g.name)}" loading="lazy" onerror="this.src='assets/logo-clean.webp'"></div>
      <div class="game-admin-body">
        <h4>${esc(g.name||'بدون اسم')}</h4>
        <div class="game-admin-slug">${esc(g.slug||'—')}</div>
        <span class="game-admin-status ${g.is_active?'':'off'}">${g.is_active?'مفعلة':'مخفية'}</span>
        <div class="game-admin-actions">
          <button type="button" class="primary" data-game-card-action="edit" data-game-id="${esc(g.id)}">تعديل</button>
          <button type="button" data-game-card-action="toggle" data-game-id="${esc(g.id)}">${g.is_active?'إخفاء':'إظهار'}</button>
          <button type="button" class="danger" data-game-card-action="delete" data-game-id="${esc(g.id)}">حذف</button>
        </div>
      </div>
    </article>`;
  }).join('');
  // Use event delegation so game actions remain reliable after every refresh/rerender,
  // including Android browsers where dynamically replaced buttons can otherwise lose handlers.
  box.onclick=async e=>{
    const btn=e.target.closest?.('[data-game-card-action]');
    if(!btn || !box.contains(btn)) return;
    e.preventDefault(); e.stopPropagation();
    if(btn.dataset.busy==='1') return;
    const id=btn.dataset.gameId, action=btn.dataset.gameCardAction;
    const g=gameSettingsCache.find(x=>String(x.id)===String(id)); if(!g)return;
    btn.dataset.busy='1'; btn.disabled=true;
    try{
      if(action==='edit'){
        gameSettingsNewMode=false;
        const sel=$('gameSettingsGame'); if(sel)sel.value=id;
        loadSelectedGameSettings();
        await loadCheckoutFieldsForSelectedGame();
        $('gameSettingsForm')?.scrollIntoView({behavior:'smooth',block:'start'});
        return;
      }
      if(action==='toggle'){
        const r=await db.from('games').update({is_active:!g.is_active}).eq('id',id);
        if(r.error)throw r.error;
        await refreshGameSettingsAdmin();
        return;
      }
      if(action==='delete'){
        if(!confirm(`حذف لعبة «${g.name}»؟ سيتم رفض الحذف إذا كانت لها باقات أو حقول شحن مرتبطة.`))return;
        const [pk,cf]=await Promise.all([
          db.from('game_packages').select('id',{count:'exact',head:true}).eq('game_id',id),
          db.from('game_checkout_fields').select('id',{count:'exact',head:true}).eq('game_id',id)
        ]);
        if(pk.error)throw pk.error; if(cf.error)throw cf.error;
        if((pk.count||0)>0 || (cf.count||0)>0)throw new Error('لا يمكن حذف اللعبة لأنها مرتبطة بباقات أو حقول شحن. أخفِها بدل الحذف.');
        const r=await db.from('games').delete().eq('id',id); if(r.error)throw r.error;
        await refreshGameSettingsAdmin();
      }
    }catch(e){
      console.error('FENK game admin action:',e);
      setAdminMsg('gameSettingsMsg',e?.message||'تعذر تنفيذ العملية.','error');
    }finally{
      btn.disabled=false; btn.dataset.busy='0';
    }
  };
}

async function refreshGameSettingsAdmin(){
  try{
    setAdminMsg('gameSettingsMsg','جارٍ تحميل الألعاب…');
    const {data,error}=await db.from('games').select('id,name,slug,logo_url,banner_url,description,category,is_active,sort_order').order('sort_order',{ascending:true});
    if(error) throw error;
    gameSettingsCache=data||[];
    try{
      const ids=gameSettingsCache.map(g=>g.id).filter(Boolean);
      const ds=ids.length?await db.from('game_display_settings').select('game_id,image_size,image_fit,desktop_columns,mobile_columns,image_padding').in('game_id',ids):{data:[],error:null};
      if(ds.error) console.warn('game_display_settings load skipped:',ds.error.message);
      gameDisplaySettingsCache=new Map((ds.data||[]).map(x=>[String(x.game_id),x]));
    }catch(err){ console.warn('game_display_settings load skipped:',err); gameDisplaySettingsCache=new Map(); }
    const sel=$('gameSettingsGame');
    if(!sel) return;
    const current=sel.value;
    sel.innerHTML=`<option value="__new__">＋ إضافة لعبة جديدة</option>`+gameSettingsCache.map(g=>`<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');
    if(!gameSettingsNewMode && current && gameSettingsCache.some(g=>String(g.id)===String(current))) sel.value=current;
    else if(!gameSettingsNewMode && gameSettingsCache[0]) sel.value=gameSettingsCache[0].id;
    else sel.value='__new__';
    if(gameSettingsNewMode || sel.value==='__new__') resetGameSettingsForm(); else loadSelectedGameSettings();
    renderGamesAdminCards();
    if(sel.value!=='__new__') await loadCheckoutFieldsForSelectedGame();
    setAdminMsg('gameSettingsMsg','تم تحميل الألعاب ✓','success');
  }catch(e){console.error(e);setAdminMsg('gameSettingsMsg',e?.message||'تعذر تحميل إعدادات الألعاب.','error');}
}
function resetGameSettingsForm(){
  updateGameEditorSelected(null);
  $('gameSettingsName').value='';$('gameSettingsSlug').value='';$('gameSettingsBanner').value='';$('gameSettingsLogo').value='';$('gameSettingsDescription').value='';$('gameSettingsCategory').value='games';$('gameSettingsSort').value=String((gameSettingsCache.length||0)+1);$('gameSettingsActive').checked=true;$('gameSettingsImageSize').value='medium';$('gameSettingsImageFit').value='contain';$('gameSettingsDesktopCols').value='2';$('gameSettingsMobileCols').value='2';$('gameSettingsImagePadding').value='8';
  if($('gameSettingsLogoFile'))$('gameSettingsLogoFile').value='';
  if($('saveGameSettingsBtn'))$('saveGameSettingsBtn').textContent='إضافة اللعبة';
  if($('gameSettingsPreview'))$('gameSettingsPreview').innerHTML='<div class="no-image">لا توجد صورة محددة</div>';
  checkoutFieldsCache=[];renderCheckoutFieldsAdmin();
}
function loadSelectedGameSettings(){
  const g=gameSettingsCache.find(x=>String(x.id)===String($('gameSettingsGame')?.value));
  if(!g)return;
  gameSettingsNewMode=false;
  updateGameEditorSelected(g);
  $('gameSettingsName').value=g.name||'';
  $('gameSettingsSlug').value=g.slug||'';
  $('gameSettingsBanner').value=g.banner_url||'';
  $('gameSettingsLogo').value=g.logo_url||'';
  $('gameSettingsDescription').value=g.description||'';
  $('gameSettingsCategory').value=g.category||'games';
  $('gameSettingsSort').value=g.sort_order??0;
  const ds=gameDisplaySettingsCache.get(String(g.id))||{};
  $('gameSettingsImageSize').value=ds.image_size||'medium';
  $('gameSettingsImageFit').value=ds.image_fit||'contain';
  $('gameSettingsDesktopCols').value=String(ds.desktop_columns||2);
  $('gameSettingsMobileCols').value=String(ds.mobile_columns||2);
  $('gameSettingsImagePadding').value=String(ds.image_padding??8);
  $('gameSettingsActive').checked=!!g.is_active;
  if($('gameSettingsLogoFile'))$('gameSettingsLogoFile').value='';
  if($('saveGameSettingsBtn'))$('saveGameSettingsBtn').textContent='حفظ تعديل اللعبة';
  if($('gameSettingsPreview')){
    const img=g.logo_url||g.banner_url;
    $('gameSettingsPreview').innerHTML=img?`<img src="${esc(img)}" alt="${esc(g.name)}" onerror="this.style.display='none'">`:'<div class="no-image">لا توجد صورة محددة</div>';
  }
}
$('gameSettingsGame')?.addEventListener('change',async()=>{
  if($('gameSettingsGame').value==='__new__'){gameSettingsNewMode=true;resetGameSettingsForm();return;}
  gameSettingsNewMode=false;loadSelectedGameSettings();await loadCheckoutFieldsForSelectedGame();
});
$('newGameBtn')?.addEventListener('click',()=>{
  gameSettingsNewMode=true;const sel=$('gameSettingsGame');if(sel)sel.value='__new__';resetGameSettingsForm();$('gameSettingsName')?.focus();
});
$('refreshGamesCardsBtn')?.addEventListener('click',()=>refreshGameSettingsAdmin());
$('reloadGameSettingsBtn')?.addEventListener('click',()=>refreshGameSettingsAdmin());
$('gameSettingsLogoFile')?.addEventListener('change',()=>{
  const f=$('gameSettingsLogoFile').files?.[0],box=$('gameSettingsPreview');if(!f||!box)return;
  const url=URL.createObjectURL(f);box.innerHTML=`<img src="${url}" alt="معاينة صورة اللعبة">`;
});
$('gameSettingsForm')?.addEventListener('submit',async e=>{
  e.preventDefault(); const btn=$('saveGameSettingsBtn');btn.disabled=true;
  try{
    const isNew=gameSettingsNewMode || $('gameSettingsGame').value==='__new__';
    const selectedId=isNew?null:$('gameSettingsGame').value;
    const name=$('gameSettingsName').value.trim(),slug=$('gameSettingsSlug').value.trim();
    if(!name||!slug)throw new Error('أكمل اسم اللعبة وSlug.');
    let logoUrl=$('gameSettingsLogo').value.trim()||null;
    const file=$('gameSettingsLogoFile')?.files?.[0];
    if(file){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('صورة اللعبة يجب أن تكون JPG أو PNG أو WEBP وبحجم لا يتجاوز 8MB.');
      const {data:{session}}=await db.auth.getSession(); if(!session?.user)throw new Error('انتهت جلسة الإدارة. سجّل الدخول من جديد.');
      const ext=file.type.split('/')[1].replace('jpeg','jpg');
      const path=`${session.user.id}/games/${crypto.randomUUID()}.${ext}`;
      const up=await db.storage.from('marketplace-images').upload(path,file,{contentType:file.type,upsert:false});
      if(up.error)throw up.error;
      logoUrl=db.storage.from('marketplace-images').getPublicUrl(path).data.publicUrl||logoUrl;
    }
    const payload={name,slug,banner_url:$('gameSettingsBanner').value.trim()||null,logo_url:logoUrl,description:$('gameSettingsDescription').value.trim()||null,category:$('gameSettingsCategory').value||'games',sort_order:Math.max(0,Number($('gameSettingsSort').value)||0),is_active:$('gameSettingsActive').checked};
    let result;
    if(isNew) result=await db.from('games').insert(payload).select('id').single();
    else result=await db.from('games').update(payload).eq('id',selectedId);
    if(result.error)throw result.error;
    const displayGameId=isNew?result.data?.id:selectedId;
    if(displayGameId){
      const displayPayload={game_id:displayGameId,image_size:$('gameSettingsImageSize').value||'medium',image_fit:$('gameSettingsImageFit').value||'contain',desktop_columns:Math.max(2,Math.min(4,Number($('gameSettingsDesktopCols').value)||2)),mobile_columns:Math.max(1,Math.min(2,Number($('gameSettingsMobileCols').value)||2)),image_padding:Math.max(0,Math.min(32,Number($('gameSettingsImagePadding').value)||0))};
      const ds=await db.from('game_display_settings').upsert(displayPayload,{onConflict:'game_id'});
      if(ds.error){
        const msg=String(ds.error.message||'');
        const missingTable=/game_display_settings|schema cache|does not exist/i.test(msg);
        if(missingTable){
          console.warn('game_display_settings is not installed in Supabase yet:',msg);
          setAdminMsg('gameSettingsMsg',isNew?'تمت إضافة اللعبة ✓ — إعدادات العرض تحتاج تفعيل جدولها في Supabase.':'تم حفظ اللعبة ✓ — إعدادات العرض تحتاج تفعيل جدولها في Supabase.','warning');
        }else{
          throw ds.error;
        }
      }
    }
    if(!document.getElementById('gameSettingsMsg')?.textContent?.includes('تحتاج تفعيل جدولها')){
      setAdminMsg('gameSettingsMsg',isNew?'تمت إضافة اللعبة ✓':'تم حفظ تعديل اللعبة ✓','success');
    }
    gameSettingsNewMode=false;await refreshGameSettingsAdmin();
    if(isNew && result.data?.id){$('gameSettingsGame').value=result.data.id;loadSelectedGameSettings();}
  }catch(e){console.error(e);setAdminMsg('gameSettingsMsg',e?.message||'تعذر حفظ اللعبة.','error');}finally{btn.disabled=false;}
});

function resetCheckoutFieldForm(){
  $('checkoutFieldId').value='';$('checkoutFieldKey').value='';$('checkoutFieldLabel').value='';$('checkoutFieldType').value='text';$('checkoutFieldPlaceholder').value='';$('checkoutFieldOptions').value='';$('checkoutFieldSort').value='0';$('checkoutFieldRequired').checked=true;$('checkoutFieldActive').checked=true;$('saveCheckoutFieldBtn').textContent='إضافة الحقل';
}
function renderCheckoutFieldsAdmin(){
  const box=$('checkoutFieldsTable');if(!box)return;
  const rows=[...checkoutFieldsCache].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  box.innerHTML=rows.length?`<div class="table-wrap"><table class="packages-admin-table"><thead><tr><th>الحقل</th><th>النوع</th><th>إجباري</th><th>الحالة</th><th>الترتيب</th><th></th></tr></thead><tbody>${rows.map(f=>`<tr><td data-label="الحقل"><b>${esc(f.field_label||f.field_key)}</b><small>${esc(f.field_key)}</small></td><td data-label="النوع">${esc(f.field_type||'text')}</td><td data-label="إجباري">${f.is_required?'نعم':'لا'}</td><td data-label="الحالة">${f.is_active?'مفعّل':'متوقف'}</td><td data-label="الترتيب">${esc(f.sort_order??0)}</td><td><div class="package-actions"><button type="button" data-field-action="edit" data-field-id="${esc(f.id)}">تعديل</button><button type="button" data-field-action="toggle" data-field-id="${esc(f.id)}">${f.is_active?'إيقاف':'تفعيل'}</button><button type="button" class="danger" data-field-action="delete" data-field-id="${esc(f.id)}">حذف</button></div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">لا توجد حقول مخصصة لهذه اللعبة.</div>';
}
async function loadCheckoutFieldsForSelectedGame(){
  const id=$('gameSettingsGame')?.value;if(!id)return;
  const {data,error}=await db.from('game_checkout_fields').select('id,game_id,field_key,field_label,field_type,placeholder,is_required,options,sort_order,is_active').eq('game_id',id).order('sort_order',{ascending:true});
  if(error){setAdminMsg('checkoutFieldMsg','تعذر تحميل حقول الشحن.','error');return;}
  checkoutFieldsCache=data||[];renderCheckoutFieldsAdmin();resetCheckoutFieldForm();
}
$('checkoutFieldForm')?.addEventListener('submit',async e=>{
  e.preventDefault();const btn=$('saveCheckoutFieldBtn');btn.disabled=true;
  try{
    const gameId=$('gameSettingsGame').value,key=$('checkoutFieldKey').value.trim(),label=$('checkoutFieldLabel').value.trim(),type=$('checkoutFieldType').value;
    if(!gameId||!key||!label)throw new Error('أكمل اسم الحقل الداخلي واسم الحقل للعميل.');
    let options=null;
    if(type==='select') options=$('checkoutFieldOptions').value.split(',').map(x=>x.trim()).filter(Boolean).map(x=>({value:x,label:x}));
    const payload={game_id:gameId,field_key:key,field_label:label,field_type:type,placeholder:$('checkoutFieldPlaceholder').value.trim()||null,is_required:$('checkoutFieldRequired').checked,options,sort_order:Math.max(0,Number($('checkoutFieldSort').value)||0),is_active:$('checkoutFieldActive').checked};
    const id=$('checkoutFieldId').value.trim();
    const r=id?await db.from('game_checkout_fields').update(payload).eq('id',id):await db.from('game_checkout_fields').insert(payload);
    if(r.error)throw r.error;
    setAdminMsg('checkoutFieldMsg',id?'تم تعديل الحقل ✓':'تمت إضافة الحقل ✓','success');await loadCheckoutFieldsForSelectedGame();
  }catch(e){console.error(e);setAdminMsg('checkoutFieldMsg',e?.message||'تعذر حفظ الحقل.','error');}finally{btn.disabled=false;}
});
$('cancelCheckoutFieldEdit')?.addEventListener('click',resetCheckoutFieldForm);
$('checkoutFieldsTable')?.addEventListener('click',async e=>{
  const btn=e.target.closest?.('[data-field-action]');if(!btn)return;const id=btn.dataset.fieldId;const f=checkoutFieldsCache.find(x=>String(x.id)===String(id));if(!f)return;const action=btn.dataset.fieldAction;
  if(action==='edit'){
    $('checkoutFieldId').value=f.id;$('checkoutFieldKey').value=f.field_key||'';$('checkoutFieldLabel').value=f.field_label||'';$('checkoutFieldType').value=f.field_type||'text';$('checkoutFieldPlaceholder').value=f.placeholder||'';$('checkoutFieldOptions').value=Array.isArray(f.options)?f.options.map(x=>x.label??x.value??'').join(', '):'';$('checkoutFieldSort').value=f.sort_order??0;$('checkoutFieldRequired').checked=!!f.is_required;$('checkoutFieldActive').checked=!!f.is_active;$('saveCheckoutFieldBtn').textContent='حفظ تعديل الحقل';return;
  }
  btn.disabled=true;try{let r;if(action==='toggle')r=await db.from('game_checkout_fields').update({is_active:!f.is_active}).eq('id',id);else if(action==='delete')r=await db.from('game_checkout_fields').delete().eq('id',id);if(r?.error)throw r.error;await loadCheckoutFieldsForSelectedGame();}catch(e){console.error(e);setAdminMsg('checkoutFieldMsg',e?.message||'تعذر تعديل الحقل.','error');}finally{btn.disabled=false;}
});


// FENK V86 — Marketplace paid ads review (Admin only)
async function notifyMarketplaceTelegram(event,id,snapshot={}){try{const {data:{session}}=await db.auth.getSession();if(!session?.access_token)return;await fetch(`${SUPABASE_URL}/functions/v1/marketplace-telegram-notify`,{method:'POST',headers:{'content-type':'application/json',apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({event,ad_id:id,snapshot})})}catch(e){console.warn('Marketplace Telegram:',e)}}
async function notifyProductTelegram(event,id){try{const {data:{session}}=await db.auth.getSession();if(!session?.access_token)return;await fetch(`${SUPABASE_URL}/functions/v1/marketplace-telegram-notify`,{method:'POST',headers:{'content-type':'application/json',apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({event,product_id:id})})}catch(e){console.warn('Product Telegram:',e)}}
async function cleanupMarketplaceFiles(row){const urls=Array.isArray(row.image_urls)?row.image_urls:(row.image_url?[row.image_url]:[]);const paths=urls.map(u=>{try{const x=new URL(u);const m=x.pathname.match(/\/storage\/v1\/object\/public\/marketplace-images\/(.+)$/);return m?decodeURIComponent(m[1]):null}catch{return null}}).filter(Boolean);if(paths.length)await db.storage.from('marketplace-images').remove(paths);if(row.payment_proof_path)await db.storage.from('marketplace-payment-proofs').remove([row.payment_proof_path]);}
function renderMarketplaceAdsAdmin(){const box=$('marketplaceAdsTable');if(!box)return;const filter=$('mpAdsFilter')?.value||'all';const ads=filter==='all'?marketplaceAdsCache:marketplaceAdsCache.filter(a=>a.status===filter);if(!ads.length){box.innerHTML='<div class="empty">لا توجد إعلانات في هذه الحالة.</div>';return}const catsCache=window.__mpCats||[],profilesCache=window.__mpProfiles||[];const cm=new Map(catsCache.map(c=>[c.id,c.name])),pm=new Map(profilesCache.map(p=>[p.id,p]));const pay={unpaid:'غير مدفوع',proof_uploaded:'تم رفع الإثبات',under_review:'قيد التحقق',paid:'تم التأكيد',not_required:'غير مطلوب — نشر مجاني',rejected:'مرفوض'};const appr={pending:'بانتظار المراجعة',published:'منشور',rejected:'مرفوض',paused:'مخفي',draft:'مسودة'};box.innerHTML=ads.map(a=>{const urls=Array.isArray(a.image_urls)&&a.image_urls.length?a.image_urls:(a.image_url?[a.image_url]:[]);return `<article class="mp-ad-row"><div class="mp-ad-head"><div><h4>${esc(a.title)}</h4><small>🆔 ${esc(a.ad_code||a.id)} • ${esc(cm.get(a.category_id)||'—')} • ${Number(a.ad_fee_dzd||0).toLocaleString('ar-DZ')} دج • ${formatDate(a.created_at)}</small></div><div class="mp-ad-badges"><span class="mp-badge ${a.payment_status==='paid'?'ok':a.payment_status==='rejected'?'bad':''}">الدفع: ${pay[a.payment_status]||a.payment_status}</span><span class="mp-badge ${a.status==='approved'?'ok':a.status==='rejected'?'bad':''}">الإعلان: ${appr[a.status]||a.status}</span></div></div>${urls.length?`<div class="mp-ad-gallery">${urls.slice(0,10).map(u=>`<img class="mp-ad-proof" src="${esc(u)}" alt="">`).join('')}</div>`:''}<div style="font-size:11px;line-height:1.7"><b>المستخدم:</b> ${esc(pm.get(a.user_id)?.full_name||[pm.get(a.user_id)?.first_name,pm.get(a.user_id)?.last_name].filter(Boolean).join(' ')||'—')}<br><b>User ID:</b> ${esc(a.user_id)}<br>${a.phone?`هاتف الإعلان: ${esc(a.phone)}<br>`:''}${a.wilaya?`الولاية: ${esc(a.wilaya)}${a.wilaya_code?` (${esc(a.wilaya_code)})`:''}<br>`:''}${a.municipality||a.commune?`البلدية: ${esc(a.municipality||a.commune)}<br>`:''}<b>السعر:</b> ${a.price_dzd==null?'—':Number(a.price_dzd).toLocaleString('ar-DZ')+' دج'}</div><p style="margin:8px 0;font-size:12px;line-height:1.7">${esc(a.description||'')}</p><small>التواصل: ${esc(a.contact||'—')}</small><div class="mp-ad-actions">${a.payment_proof_path?`<button type="button" onclick="viewMarketplaceProof('${esc(a.payment_proof_path)}')">🧾 إثبات الدفع</button>`:''}${a.status==='payment_review'||a.payment_status==='proof_uploaded'?`<button type="button" onclick="updateMarketplaceAd('${esc(a.id)}','payment_ok')">✓ قبول الدفع</button><button type="button" class="danger" onclick="updateMarketplaceAd('${esc(a.id)}','payment_no')">رفض الدفع</button>`:''}${a.status==='pending_review'?`<button type="button" class="danger" onclick="updateMarketplaceAd('${esc(a.id)}','content_no')">❌ رفض الإعلان</button><button type="button" onclick="updateMarketplaceAd('${esc(a.id)}','publish')">📢 قبول ونشر</button>`:''}${a.status==='approved'?`<button type="button" class="danger" onclick="updateMarketplaceAd('${esc(a.id)}','unpublish')">🔒 إخفاء</button>`:''}${a.status!=='deleted'?`<button type="button" onclick="updateMarketplaceAd('${esc(a.id)}','edit')">✏️ تعديل</button>`:''}<button type="button" class="danger" onclick="deleteMarketplaceAdAdmin('${esc(a.id)}')">🗑️ حذف</button>${a.admin_note?`<div class="mp-badge bad" style="margin-top:7px">ملاحظة Admin: ${esc(a.admin_note)}</div>`:''}${a.rejection_reason?`<div class="mp-badge bad" style="margin-top:7px">سبب الرفض: ${esc(a.rejection_reason)}</div>`:''}</div></article>`}).join('')}
async function refreshMarketplaceAdsAdmin(){const box=$('marketplaceAdsTable');if(!box)return;box.innerHTML='<div class="empty">جارٍ تحميل إعلانات Marketplace…</div>';const [{data:ads,error:ae},{data:cats},{data:profiles}]=await Promise.all([db.from('marketplace_ads').select('id,ad_code,user_id,title,description,price_dzd,contact,image_url,image_urls,payment_proof_path,rejection_reason,ad_fee_dzd,payment_status,approval_status,status,created_at,package_id,category_id,phone,wilaya,wilaya_code,municipality,commune,details,admin_note').order('created_at',{ascending:false}).limit(500),db.from('marketplace_categories').select('id,name,slug'),db.from('profiles').select('id,full_name,first_name,last_name,phone')]);if(ae){box.innerHTML='<div class="empty">تعذر تحميل الإعلانات: '+esc(ae.message)+'</div>';return}marketplaceAdsCache=ads||[];window.__mpCats=cats||[];window.__mpProfiles=profiles||[];const accepted=marketplaceAdsCache.filter(a=>a.payment_status==='paid').reduce((s,a)=>s+Number(a.ad_fee_dzd||0),0);$('mpAdsRevenue').textContent=accepted.toLocaleString('ar-DZ')+' دج';$('mpAdsPending').textContent=marketplaceAdsCache.filter(a=>['pending_payment','payment_review','pending_review'].includes(a.status)).length;$('mpAdsPublished').textContent=marketplaceAdsCache.filter(a=>a.status==='approved').length;renderMarketplaceAdsAdmin()}
$('mpAdsFilter')?.addEventListener('change',renderMarketplaceAdsAdmin);

function closeMarketplaceCreate(){const m=$('mpCreateModal');if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true')}}
async function openMarketplaceCreate(){
  const m=$('mpCreateModal'); if(!m)return;
  const sel=$('mpCreateCategory');
  if(sel && !sel.options.length){
    const {data,error}=await db.from('marketplace_categories').select('id,name,slug').order('sort_order',{ascending:true}).order('name',{ascending:true});
    if(error){setCreateMsg('تعذر تحميل أقسام Marketplace: '+error.message,'error');return}
    sel.innerHTML='<option value="">— بدون قسم —</option>'+(data||[]).map(c=>`<option value="${esc(c.id)}">${esc(c.name||c.slug||'إعلان')}</option>`).join('');
  }
  $('mpCreateForm')?.reset();
  if(sel)sel.value='';
  $('mpCreateImagePreview').innerHTML='';$('mpCreateMsg').textContent='';$('mpCreateSubmit').disabled=false;
  m.classList.add('show');m.setAttribute('aria-hidden','false');
}
function setCreateMsg(t,type=''){const e=$('mpCreateMsg');if(e){e.textContent=t;e.className='admin-msg '+type}}
function previewMarketplaceCreateImages(){const box=$('mpCreateImagePreview');if(!box)return;box.innerHTML='';Array.from($('mpCreateImages')?.files||[]).slice(0,10).forEach(f=>{const u=URL.createObjectURL(f);const img=document.createElement('img');img.src=u;img.onload=()=>URL.revokeObjectURL(u);box.appendChild(img)})}
async function uploadMarketplaceAdminImages(files,userId){
  const out=[]; const list=Array.from(files||[]).slice(0,10); const stamp=Date.now();
  for(let i=0;i<list.length;i++){
    const f=list[i]; const ext=(f.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const path=`${userId}/${stamp}-${i}.${ext}`;
    const r=await db.storage.from('marketplace-images').upload(path,f,{contentType:f.type||'image/jpeg',upsert:false});
    if(r.error)throw r.error;
    out.push(db.storage.from('marketplace-images').getPublicUrl(path).data.publicUrl);
  }
  return out;
}
async function createMarketplaceAdAdmin(e){
  e.preventDefault();
  const btn=$('mpCreateSubmit');btn.disabled=true;setCreateMsg('جارٍ إنشاء الإعلان ونشره…','success');
  try{
    const {data:{session}}=await db.auth.getSession(); if(!session?.user?.id)throw new Error('انتهت جلسة الإدارة. سجّل الدخول مرة أخرى.');
    if(!(await isAdmin()))throw new Error('لا تملك صلاحية Admin.');
    const title=$('mpCreateTitle').value.trim(); const price=Number($('mpCreatePrice').value);
    if(!title)throw new Error('اكتب اسم الإعلان.'); if(!Number.isFinite(price)||price<0)throw new Error('السعر غير صالح.');
    let details={};try{details=JSON.parse($('mpCreateDetails').value||'{}');if(!details||Array.isArray(details)||typeof details!=='object')throw new Error()}catch{throw new Error('JSON الخاص بالتفاصيل غير صالح.')}
    const uploaded=await uploadMarketplaceAdminImages($('mpCreateImages').files,session.user.id);
    const extra=($('mpCreateImageUrls').value||'').split(/\s+/).map(x=>x.trim()).filter(Boolean).slice(0,10);
    const image_urls=[...uploaded,...extra].slice(0,10);
    if(!image_urls.length)throw new Error('أضف صورة واحدة على الأقل للإعلان.');
    const {data:pack}=await db.from('marketplace_packages').select('id,duration_days').eq('duration_days',30).eq('is_active',true).order('sort_order',{ascending:true}).limit(1).maybeSingle();
    const start=new Date();const end=new Date(start.getTime()+Number(pack?.duration_days||30)*86400000);
    const row={user_id:session.user.id,category_id:$('mpCreateCategory').value||null,package_id:pack?.id||null,title,description:$('mpCreateDescription').value.trim()||null,price_dzd:price,contact:null,phone:$('mpCreatePhone').value.trim()||null,wilaya:$('mpCreateWilaya').value.trim()||null,municipality:$('mpCreateMunicipality').value.trim()||null,commune:$('mpCreateMunicipality').value.trim()||null,image_url:image_urls[0],image_urls,payment_proof_path:null,payment_method:null,ad_fee_dzd:0,payment_status:'not_required',approval_status:'published',status:'approved',is_draft:false,rejection_reason:null,admin_note:'تم إنشاء ونشر الإعلان مباشرة من لوحة Admin.',start_at:start.toISOString(),end_at:end.toISOString(),details};
    const {data:created,error}=await db.from('marketplace_ads').insert(row).select('*').single();
    if(error)throw error;
    await notifyMarketplaceTelegram('approved',created.id,created);closeMarketplaceCreate();await refreshMarketplaceAdsAdmin();alert('✓ تم نشر الإعلان بنجاح في FENK Marketplace.');
  }catch(err){console.error('FENK admin create marketplace ad:',err);setCreateMsg(err?.message||'تعذر نشر الإعلان.','error')}
  finally{btn.disabled=false}
}
async function deleteMarketplaceAdAdmin(id){if(!confirm('حذف الإعلان نهائيًا من Marketplace وحذف ملفاته؟'))return;const {data:row,error:re}=await db.from('marketplace_ads').select('id,ad_code,user_id,title,image_url,image_urls,payment_proof_path,details,wilaya,municipality,price_dzd,payment_status,status').eq('id',id).maybeSingle();if(re||!row){alert('الإعلان غير موجود.');return}const {error}=await db.from('marketplace_ads').delete().eq('id',id);if(error){alert('تعذر حذف الإعلان: '+error.message);return}await cleanupMarketplaceFiles(row);await notifyMarketplaceTelegram('deleted',id,row);await refreshMarketplaceAdsAdmin()}
async function updateMarketplaceAd(id,action){let patch={};let event='updated';if(action==='payment_ok'){patch={payment_status:'paid',payment_confirmed_at:new Date().toISOString(),payment_confirmed_by:null,status:'pending_review',approval_status:'pending',is_draft:false};event='updated'}if(action==='payment_no'){const reason=prompt('سبب رفض الدفع:','');patch={payment_status:'rejected',status:'rejected',approval_status:'rejected',is_draft:false,admin_note:reason?.trim()||null,rejection_reason:reason?.trim()||'تم رفض إثبات الدفع من Admin.'};event='rejected'}if(action==='content_no'){const reason=prompt('سبب رفض الإعلان:','');patch={status:'rejected',approval_status:'rejected',is_draft:false,admin_note:reason?.trim()||'تم رفض الإعلان من Admin.',rejection_reason:reason?.trim()||'تم رفض الإعلان من Admin.'};event='rejected'}if(action==='publish'){const {data:a,error}=await db.from('marketplace_ads').select('package_id,payment_status').eq('id',id).single();if(error)return alert('تعذر قراءة مدة الإعلان.');const {data:p}=await db.from('marketplace_packages').select('duration_days').eq('id',a.package_id).single();const start=new Date(),end=new Date(start.getTime()+Number(p?.duration_days||1)*86400000);patch={status:'approved',approval_status:'published',payment_status:a.payment_status==='not_required'?'not_required':'paid',is_draft:false,rejection_reason:null,start_at:start.toISOString(),end_at:end.toISOString()};event='approved'}if(action==='unpublish'){patch={status:'hidden',approval_status:'paused'};event='hidden'}if(action==='edit'){return openMarketplaceEditor(id)}const {data:updated,error}=await db.from('marketplace_ads').update(patch).eq('id',id).select('*').single();if(error){alert('تعذر تحديث الإعلان: '+error.message);return}await notifyMarketplaceTelegram(event,id,updated);await refreshMarketplaceAdsAdmin()}
const MP_EDIT_LABELS={
  title:'العنوان',description:'الوصف',price_dzd:'السعر (دج)',phone:'رقم الهاتف',contact:'رابط التواصل',wilaya:'الولاية',wilaya_code:'رمز الولاية',municipality:'البلدية',commune:'البلدية (commune)',ad_code:'رمز الإعلان',admin_note:'ملاحظة Admin',rejection_reason:'سبب الرفض',
  part_name:'اسم القطعة',part_category:'قسم القطعة',part_brand:'ماركة القطعة',car_brand:'ماركة السيارة',car_model:'موديل السيارة',car_year:'سنة السيارة',condition:'الحالة',model:'الموديل',year:'السنة',engine:'المحرك',fuel:'الوقود',gear:'علبة السرعة',mileage:'الكيلومترات',notes:'معلومات إضافية',productname:'اسم المنتج',brand:'العلامة التجارية',quantity:'الكمية',propertytype:'نوع العقار',area:'المساحة',landtype:'نوع الأرض',service_type:'نوع الخدمة',store_name:'اسم المتجر',app_name:'اسم التطبيق',game_name:'اسم اللعبة'
};
const MP_EDIT_TYPES={car:'سيارة للبيع',product:'منتج',spare_parts:'قطع غيار السيارات',realestate:'عقار',land:'أرض',service:'خدمة',store:'متجر',app:'تطبيق',game:'لعبة',other:'أخرى'};
function mpEsc(v){return esc(v==null?'':String(v))}
function mpEditorField(label,id,value,type='text',full=false){const cls=full?'mp-edit-field full':'mp-edit-field';if(type==='textarea')return `<label class="${cls}">${mpEsc(label)}<textarea id="${id}">${mpEsc(value)}</textarea></label>`;return `<label class="${cls}">${mpEsc(label)}<input id="${id}" type="${type}" value="${mpEsc(value)}"></label>`}
function closeMarketplaceEditor(){const m=$('mpEditorModal');if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true')}}
async function openMarketplaceEditor(id){
  const {data:a,error}=await db.from('marketplace_ads').select('*').eq('id',id).single();
  if(error||!a){alert('تعذر قراءة الإعلان.');return}
  $('mpEditId').value=a.id;
  const details=(a.details&&typeof a.details==='object')?a.details:{};
  const category=(window.__mpCats||[]).find(c=>c.id===a.category_id);
  const typeLabel=category?.name||'إعلان';
  const statusOpts=['draft','pending_payment','payment_review','pending_review','approved','rejected','hidden','deleted'];
  const payOpts=['unpaid','proof_uploaded','under_review','paid','rejected','pending','confirmed'];
  const imageUrls=Array.isArray(a.image_urls)?a.image_urls:(a.image_url?[a.image_url]:[]);
  let html='';
  html+=mpEditorField('نوع الإعلان','mpEditType',typeLabel,'text');
  html+=mpEditorField('رمز الإعلان','mpEditAdCode',a.ad_code||'','text');
  html+=mpEditorField('العنوان','mpEditTitle',a.title||'','text');
  html+=mpEditorField('السعر (دج)','mpEditPrice',a.price_dzd??'','number');
  html+=mpEditorField('رقم الهاتف','mpEditPhone',a.phone||'','text');
  html+=mpEditorField('رابط التواصل','mpEditContact',a.contact||'','url');
  html+=mpEditorField('الولاية','mpEditWilaya',a.wilaya||'','text');
  html+=mpEditorField('رمز الولاية','mpEditWilayaCode',a.wilaya_code||'','text');
  html+=mpEditorField('البلدية','mpEditMunicipality',a.municipality||a.commune||'','text');
  html+=`<label class="mp-edit-field">حالة الإعلان<select id="mpEditStatus">${statusOpts.map(x=>`<option value="${x}" ${x===a.status?'selected':''}>${x}</option>`).join('')}</select></label>`;
  html+=`<label class="mp-edit-field">حالة الدفع<select id="mpEditPaymentStatus">${payOpts.map(x=>`<option value="${x}" ${x===a.payment_status?'selected':''}>${x}</option>`).join('')}</select></label>`;
  html+=mpEditorField('الوصف','mpEditDescription',a.description||'','textarea',true);
  html+=mpEditorField('ملاحظة Admin','mpEditAdminNote',a.admin_note||'','textarea',true);
  html+=mpEditorField('سبب الرفض','mpEditRejection',a.rejection_reason||'','textarea',true);
  html+=`<div class="mp-edit-field full"><b>الصور (${imageUrls.length}/10)</b><textarea id="mpEditImages" placeholder="ضع رابط كل صورة في سطر مستقل">${mpEsc(imageUrls.join('\\n'))}</textarea><span class="mp-editor-note">يمكن لـ Admin تعديل ترتيب الصور بإعادة ترتيب الروابط. أول رابط هو الصورة الرئيسية.</span><div class="mp-editor-images">${imageUrls.map(u=>`<img src="${mpEsc(u)}" alt="">`).join('')}</div></div>`;
  html+=`<div class="mp-edit-field full"><b>جميع تفاصيل النموذج</b><textarea id="mpEditDetails" spellcheck="false">${mpEsc(JSON.stringify(details,null,2))}</textarea><span class="mp-editor-note">هذا الحقل يشمل تفاصيل نوع الإعلان كاملة: السيارة، قطعة الغيار، المنتج، العقار، الأرض، الخدمة، المتجر، التطبيق أو اللعبة. اترك JSON صالحًا عند الحفظ.</span></div>`;
  html+=`<div class="mp-edit-field full"><b>إثبات الدفع</b><div class="mp-editor-note">${a.payment_proof_path?'موجود: '+mpEsc(a.payment_proof_path):'لا يوجد إثبات دفع'}</div></div>`;
  $('mpEditorFields').innerHTML=html;
  $('mpEditorMsg').textContent='';
  $('mpEditorModal').classList.add('show');$('mpEditorModal').setAttribute('aria-hidden','false');
}
async function saveMarketplaceEditor(e){
 e.preventDefault(); const id=$('mpEditId').value; if(!id)return;
 let details={}; try{details=JSON.parse($('mpEditDetails').value||'{}'); if(!details||Array.isArray(details)||typeof details!=='object')throw new Error()}catch{return $('mpEditorMsg').textContent='JSON الخاص بالتفاصيل غير صالح.'}
 const urls=$('mpEditImages').value.split(/\\s+/).map(x=>x.trim()).filter(Boolean).slice(0,10);
 const priceText=$('mpEditPrice').value.trim(); const price=priceText===''?null:Number(priceText);
 if(price!==null&&(!Number.isFinite(price)||price<0))return $('mpEditorMsg').textContent='السعر غير صالح.';
 const patch={title:$('mpEditTitle').value.trim().slice(0,160),description:$('mpEditDescription').value.trim()||null,price_dzd:price,phone:$('mpEditPhone').value.trim()||null,contact:$('mpEditContact').value.trim()||null,wilaya:$('mpEditWilaya').value.trim()||null,wilaya_code:$('mpEditWilayaCode').value.trim()||null,municipality:$('mpEditMunicipality').value.trim()||null,commune:$('mpEditMunicipality').value.trim()||null,ad_code:$('mpEditAdCode').value.trim()||null,status:$('mpEditStatus').value.trim()||'draft',payment_status:$('mpEditPaymentStatus').value.trim()||'unpaid',admin_note:$('mpEditAdminNote').value.trim()||null,rejection_reason:$('mpEditRejection').value.trim()||null,image_urls:urls,image_url:urls[0]||null,details};
 const {data:updated,error}=await db.from('marketplace_ads').update(patch).eq('id',id).select('*').single(); if(error){$('mpEditorMsg').textContent='تعذر الحفظ: '+error.message;return}
 await notifyMarketplaceTelegram('updated',id,updated); closeMarketplaceEditor(); await refreshMarketplaceAdsAdmin();
}
async function viewMarketplaceProof(path){
  const {data,error}=await db.storage.from('marketplace-payment-proofs').createSignedUrl(path,600);
  if(error||!data?.signedUrl){alert('تعذر فتح إثبات الدفع.');return}
  window.open(data.signedUrl,'_blank','noopener');
}
$('refreshMarketplaceAds')?.addEventListener('click',refreshMarketplaceAdsAdmin);


// FENK V176 — game top-up Flexy operator settings
async function loadGameFlexySettingsAdmin(){
  try{
    const {data,error}=await db.from('game_flexy_operators').select('operator,phone_number,is_active').order('sort_order',{ascending:true});
    if(error) throw error;
    const map=new Map((data||[]).map(x=>[x.operator,x]));
    if($('gameFlexyMobilisPhone'))$('gameFlexyMobilisPhone').value=map.get('mobilis')?.phone_number||'';
    if($('gameFlexyDjezzyPhone'))$('gameFlexyDjezzyPhone').value=map.get('djezzy')?.phone_number||'';
    if($('gameFlexyOoredooPhone'))$('gameFlexyOoredooPhone').value=map.get('ooredoo')?.phone_number||'';
  }catch(e){console.warn('FENK flexy settings load',e);setAdminMsg('gameFlexySettingsMsg',e?.message||'تعذر تحميل أرقام فلكسي.','error')}
}
$('gameFlexySettingsForm')?.addEventListener('submit',async e=>{
  e.preventDefault(); const btn=$('saveGameFlexySettingsBtn'); if(btn)btn.disabled=true;
  try{
    const rows=[['mobilis','موبيليس',$('gameFlexyMobilisPhone')?.value.trim()||''],['djezzy','جازي',$('gameFlexyDjezzyPhone')?.value.trim()||''],['ooredoo','أوريدو',$('gameFlexyOoredooPhone')?.value.trim()||'']];
    for(const [operator,display_name,phone_number] of rows){
      const r=await db.from('game_flexy_operators').upsert({operator,display_name,phone_number,is_active:!!phone_number,updated_at:new Date().toISOString()},{onConflict:'operator'});
      if(r.error)throw r.error;
    }
    setAdminMsg('gameFlexySettingsMsg','تم حفظ أرقام فلكسي لشحن الألعاب ✓','success');
  }catch(e){console.error(e);setAdminMsg('gameFlexySettingsMsg',e?.message||'تعذر حفظ إعدادات فلكسي.','error');}
  finally{if(btn)btn.disabled=false;}
});
loadGameFlexySettingsAdmin();
