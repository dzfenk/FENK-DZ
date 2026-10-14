from pathlib import Path
root=Path('/mnt/data/fenk_work/v143')

# Update product navigation to dedicated real product catalog
for fn in ['marketplace.html','index.html']:
    p=root/fn
    s=p.read_text()
    s=s.replace('marketplace-category.html?category=products','products.html')
    p.write_text(s)

# Add admin tab button
p=root/'admin.html'; s=p.read_text()
s=s.replace('<button class="admin-tab" data-tab="marketplaceAds"><i data-lucide="megaphone"></i> إعلانات Marketplace</button>', '<button class="admin-tab" data-tab="marketplaceAds"><i data-lucide="megaphone"></i> إعلانات Marketplace</button>\n  <button class="admin-tab" data-tab="products"><i data-lucide="shopping-bag"></i> إدارة المنتجات</button>')
# Insert product admin tab before order detail modal
marker='<div class="modal" id="orderDetailModal">'
product_tab=r'''
  <div class="admin-view hidden" id="tab-products">
    <div class="admin-section-head">
      <div><h3>🛍️ إدارة منتجات FENK</h3><p>أضف منتجات Temu / AliExpress / Amazon وغيرها. المنتجات المفعّلة تظهر تلقائيًا في قسم «منتجات».</p></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button type="button" class="send" id="openProductCreate">➕ إضافة منتج</button><span class="admin-lock">Admin فقط</span></div>
    </div>
    <div class="stat-grid">
      <div class="stat-total"><b id="productCountAll">0</b><small>كل المنتجات</small></div>
      <div class="stat-paid"><b id="productCountActive">0</b><small>مفعّل في المتجر</small></div>
      <div class="stat-wait"><b id="productCountStock">0</b><small>منتجات متوفرة</small></div>
    </div>
    <div class="admin-card"><div class="admin-section-head"><div><h3>المنتجات الحالية</h3><p>تعديل، إخفاء، حذف، أو فتح المنتج كما يراه العميل.</p></div><button type="button" class="admin-secondary-btn" id="refreshProductsAdmin">تحديث</button></div><div id="productsAdminTable"></div></div>
    <div id="productAdminModal" class="mp-create-modal" aria-hidden="true">
      <div class="mp-create-sheet" style="max-width:900px">
        <div class="mp-editor-head"><div><h3 id="productModalTitle">➕ إضافة منتج</h3><small>بيانات المنتج الحقيقية تُحفظ في Supabase.</small></div><button type="button" id="productAdminClose" class="admin-secondary-btn">×</button></div>
        <form id="productAdminForm">
          <input type="hidden" id="productAdminId">
          <div class="mp-create-grid">
            <label class="mp-create-field">اسم المنتج<input id="productTitle" maxlength="180" required placeholder="مثال: فستان دانتيل نسائي"></label>
            <label class="mp-create-field">منصة المصدر<select id="productPlatform"><option value="Temu">Temu</option><option value="AliExpress">AliExpress</option><option value="Amazon">Amazon</option><option value="eBay">eBay</option><option value="SHEIN">SHEIN</option><option value="Other">أخرى</option></select></label>
            <label class="mp-create-field">السعر الأصلي (دج/اختياري)<input id="productOriginalPrice" type="number" min="0" step="0.01"></label>
            <label class="mp-create-field">سعر FENK (دج)<input id="productPrice" type="number" min="0" step="0.01" required></label>
            <label class="mp-create-field">الخصم %<input id="productDiscount" type="number" min="0" max="100" step="0.01" value="0"></label>
            <label class="mp-create-field">التقييم ⭐<input id="productRating" type="number" min="0" max="5" step="0.1" value="0"></label>
            <label class="mp-create-field">المخزون / الكمية<input id="productStock" type="number" min="0" step="1" value="0"></label>
            <label class="mp-create-field">عدد المبيعات<input id="productSold" type="number" min="0" step="1" value="0"></label>
            <label class="mp-create-field full">رابط المنتج الأصلي<input id="productSourceUrl" type="url" inputmode="url" placeholder="https://..."></label>
            <label class="mp-create-field full">وصف المنتج<textarea id="productDescription" rows="4" placeholder="وصف المنتج ومميزاته..."></textarea></label>
            <label class="mp-create-field full">صور المنتج <input id="productImages" type="file" accept="image/jpeg,image/png,image/webp" multiple><span class="mp-create-note">حتى 10 صور. أول صورة هي الصورة الرئيسية.</span><div id="productImagePreview" class="mp-create-images"></div></label>
            <label class="mp-create-field full">روابط صور إضافية<textarea id="productImageUrls" rows="3" placeholder="رابط صورة في كل سطر"></textarea></label>
            <div class="mp-create-field full" style="border:1px solid #dbe9e4;border-radius:12px;padding:12px;background:#f8fcfa">
              <b>خيارات المنتج</b><small class="mp-create-note" style="display:block;margin:5px 0 10px">مثال: اللون، المقاس، الخامة. ضع القيم مفصولة بفاصلة، وحدد «إجباري» إذا كان الزبون يجب أن يختارها.</small>
              <div id="productOptionsRows"></div>
              <button type="button" class="admin-secondary-btn" id="addProductOption">➕ إضافة خيار</button>
            </div>
            <label class="package-check"><input id="productActive" type="checkbox" checked> المنتج مفعّل</label>
            <label class="package-check"><input id="productShow" type="checkbox" checked> يظهر في قسم منتجات</label>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px"><button type="button" class="admin-secondary-btn" id="productAdminCancel">إلغاء</button><button type="submit" class="send" id="productAdminSave">💾 حفظ المنتج</button></div>
          <div id="productAdminMsg" class="admin-msg"></div>
        </form>
      </div>
    </div>
  </div>

'''
if 'id="tab-products"' not in s:
    s=s.replace(marker, product_tab+marker)
# Add small CSS before </head>
css=r'''
<style>
.product-admin-thumb{width:70px;height:70px;border-radius:12px;object-fit:cover;border:1px solid #dce7e3}.product-admin-row{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #edf1f0}.product-admin-info{flex:1;min-width:0}.product-admin-info b{display:block}.product-admin-info small{display:block;color:#6d7d79;line-height:1.6}.product-admin-actions{display:flex;gap:6px;flex-wrap:wrap}.product-admin-actions button{border:1px solid #d5e0dd;background:#fff;color:#075c43;border-radius:8px;padding:7px 9px;cursor:pointer}.product-admin-actions .danger{color:#b42318;border-color:#f0c9c5}.product-option-row{display:grid;grid-template-columns:1.1fr 2fr auto;gap:7px;align-items:center;margin-bottom:7px}.product-option-row input{width:100%;padding:10px;border:1px solid #d7e1df;border-radius:9px}.product-option-row label{font-size:12px;display:flex;gap:5px;align-items:center}.product-option-row label input{width:auto}@media(max-width:650px){.product-admin-row{align-items:flex-start;flex-wrap:wrap}.product-admin-thumb{width:58px;height:58px}.product-admin-actions{width:100%}.product-option-row{grid-template-columns:1fr}.product-option-row label{padding:4px 0}}
</style>
'''
if '.product-admin-thumb' not in s:
    s=s.replace('</head>',css+'</head>')
p.write_text(s)

# Append product admin JS and tab hook
p=root/'admin.js'; s=p.read_text()
# tab refresh hook
s=s.replace("if(tab.dataset.tab==='marketplaceAds') await refreshMarketplaceAdsAdmin();", "if(tab.dataset.tab==='marketplaceAds') await refreshMarketplaceAdsAdmin();\n    if(tab.dataset.tab==='products') await refreshProductsAdmin();")
# Add product code before boot
insert=r'''
// ===== FENK REAL PRODUCTS CATALOG =====
let productsAdminCache=[];
function productOptionsFromRows(){return [...document.querySelectorAll('.product-option-row')].map(r=>({name:r.querySelector('.opt-name')?.value.trim(),values:(r.querySelector('.opt-values')?.value||'').split(',').map(x=>x.trim()).filter(Boolean),required:!!r.querySelector('.opt-required')?.checked})).filter(x=>x.name&&x.values.length)}
function addProductOptionRow(data={name:'',values:[],required:true}){const host=$('productOptionsRows');if(!host)return;const row=document.createElement('div');row.className='product-option-row';row.innerHTML=`<input class="opt-name" maxlength="60" placeholder="مثال: اللون" value="${mpEsc(data.name||'')}"><input class="opt-values" placeholder="أزرق, أسود, أبيض" value="${mpEsc((data.values||[]).join(', '))}"><label><input class="opt-required" type="checkbox" ${data.required!==false?'checked':''}> إجباري</label><button type="button" class="admin-secondary-btn opt-remove">×</button>`;row.querySelector('.opt-remove').onclick=()=>row.remove();host.appendChild(row)}
function resetProductForm(){const f=$('productAdminForm');if(!f)return;f.reset();$('productAdminId').value='';$('productModalTitle').textContent='➕ إضافة منتج';$('productRating').value='0';$('productDiscount').value='0';$('productStock').value='0';$('productSold').value='0';$('productActive').checked=true;$('productShow').checked=true;$('productImageUrls').value='';$('productImagePreview').innerHTML='';$('productOptionsRows').innerHTML='';addProductOptionRow()}
function openProductAdminModal(product=null){resetProductForm();if(product){$('productModalTitle').textContent='✏️ تعديل المنتج';$('productAdminId').value=product.id;$('productTitle').value=product.title||'';$('productPlatform').value=product.source_platform||'Other';$('productOriginalPrice').value=product.original_price??'';$('productPrice').value=product.price_dzd??'';$('productDiscount').value=product.discount_pct??0;$('productRating').value=product.rating??0;$('productStock').value=product.stock_quantity??0;$('productSold').value=product.sold_count??0;$('productSourceUrl').value=product.source_url||'';$('productDescription').value=product.description||'';$('productActive').checked=!!product.is_active;$('productShow').checked=!!product.show_in_products;const urls=Array.isArray(product.image_urls)?product.image_urls:[];$('productImageUrls').value=urls.join('\n');$('productImagePreview').innerHTML=urls.map(u=>`<img src="${mpEsc(u)}" alt="">`).join('');$('productOptionsRows').innerHTML='';(Array.isArray(product.options)?product.options:[]).forEach(o=>addProductOptionRow(o));if(!(product.options||[]).length)addProductOptionRow()}$('productAdminMsg').textContent='';$('productAdminModal').classList.add('show');$('productAdminModal').setAttribute('aria-hidden','false')}
function closeProductAdminModal(){$('productAdminModal')?.classList.remove('show');$('productAdminModal')?.setAttribute('aria-hidden','true')}
async function uploadProductImages(files){const {data:{session}}=await db.auth.getSession();if(!session?.user)return [];const out=[];for(const file of [...files].slice(0,10)){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)continue;const ext=file.type.split('/')[1].replace('jpeg','jpg');const path=`${session.user.id}/products/${crypto.randomUUID()}.${ext}`;const up=await db.storage.from('marketplace-images').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;const {data}=db.storage.from('marketplace-images').getPublicUrl(path);if(data?.publicUrl)out.push(data.publicUrl)}return out}
async function saveProductAdmin(e){e.preventDefault();const b=$('productAdminSave');b.disabled=true;try{const title=$('productTitle').value.trim();const price=Number($('productPrice').value);if(!title||!Number.isFinite(price)||price<0)throw new Error('أدخل اسم المنتج والسعر بشكل صحيح.');const existingId=$('productAdminId').value.trim();let imageUrls=$('productImageUrls').value.split(/\s+/).map(x=>x.trim()).filter(Boolean).slice(0,10);const files=$('productImages')?.files;if(files?.length){const uploaded=await uploadProductImages(files);imageUrls=[...uploaded,...imageUrls].slice(0,10)}const payload={title,description:$('productDescription').value.trim()||null,original_price:$('productOriginalPrice').value===''?null:Number($('productOriginalPrice').value),price_dzd:price,discount_pct:Number($('productDiscount').value)||0,rating:Number($('productRating').value)||0,sold_count:Math.max(0,Number($('productSold').value)||0),image_urls:imageUrls,options:productOptionsFromRows(),stock_quantity:Math.max(0,Number($('productStock').value)||0),source_url:$('productSourceUrl').value.trim()||null,source_platform:$('productPlatform').value,is_active:$('productActive').checked,show_in_products:$('productShow').checked,updated_at:new Date().toISOString()};let r;if(existingId)r=await db.from('fenk_products').update(payload).eq('id',existingId).select().single();else{const {data:{session}}=await db.auth.getSession();payload.created_by=session?.user?.id||null;r=await db.from('fenk_products').insert(payload).select().single()}if(r.error)throw r.error;closeProductAdminModal();await refreshProductsAdmin();alert('✓ تم حفظ المنتج.')}catch(err){console.error(err);$('productAdminMsg').textContent=err?.message||'تعذر حفظ المنتج.'}finally{b.disabled=false}}
async function refreshProductsAdmin(){const box=$('productsAdminTable');if(!box)return;box.innerHTML='<div class="empty">جارٍ تحميل المنتجات…</div>';const {data,error}=await db.from('fenk_products').select('*').order('created_at',{ascending:false});if(error){box.innerHTML='<div class="empty">تعذر تحميل المنتجات: '+esc(error.message)+'</div>';return}productsAdminCache=data||[];$('productCountAll').textContent=productsAdminCache.length;$('productCountActive').textContent=productsAdminCache.filter(p=>p.is_active&&p.show_in_products).length;$('productCountStock').textContent=productsAdminCache.filter(p=>p.stock_quantity>0).length;if(!productsAdminCache.length){box.innerHTML='<div class="empty">لا توجد منتجات بعد. اضغط «إضافة منتج».</div>';return}box.innerHTML=productsAdminCache.map(p=>{const img=Array.isArray(p.image_urls)&&p.image_urls[0];return `<article class="product-admin-row"><img class="product-admin-thumb" src="${mpEsc(img||'assets/marketplace/marketplace-products.png')}" alt=""><div class="product-admin-info"><b>${esc(p.title)}</b><small>${esc(p.source_platform||'')} • ${Number(p.price_dzd||0).toLocaleString('ar-DZ')} دج • المخزون: ${Number(p.stock_quantity||0)} • ${p.is_active&&p.show_in_products?'مفعّل':'مخفي'}</small></div><div class="product-admin-actions"><button type="button" data-product-edit="${esc(p.id)}">✏️ تعديل</button><button type="button" data-product-toggle="${esc(p.id)}">${p.is_active&&p.show_in_products?'🔒 إخفاء':'🟢 إظهار'}</button><button type="button" data-product-open="${esc(p.id)}">👁️ عرض</button><button type="button" class="danger" data-product-delete="${esc(p.id)}">🗑️ حذف</button></div></article>`}).join('');box.querySelectorAll('[data-product-edit]').forEach(b=>b.onclick=()=>openProductAdminModal(productsAdminCache.find(x=>x.id===b.dataset.productEdit)));box.querySelectorAll('[data-product-open]').forEach(b=>b.onclick=()=>location.href='product.html?id='+encodeURIComponent(b.dataset.productOpen));box.querySelectorAll('[data-product-toggle]').forEach(b=>b.onclick=async()=>{const p=productsAdminCache.find(x=>x.id===b.dataset.productToggle);if(!p)return;const {error}=await db.from('fenk_products').update({is_active:!(p.is_active&&p.show_in_products),show_in_products:!(p.is_active&&p.show_in_products),updated_at:new Date().toISOString()}).eq('id',p.id);if(error)alert(error.message);else await refreshProductsAdmin()});box.querySelectorAll('[data-product-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('حذف المنتج نهائيًا؟'))return;const {error}=await db.from('fenk_products').delete().eq('id',b.dataset.productDelete);if(error)alert(error.message);else await refreshProductsAdmin()});initIcons()}
$('openProductCreate')?.addEventListener('click',()=>openProductAdminModal());$('productAdminClose')?.addEventListener('click',closeProductAdminModal);$('productAdminCancel')?.addEventListener('click',closeProductAdminModal);$('productAdminModal')?.addEventListener('click',e=>{if(e.target.id==='productAdminModal')closeProductAdminModal()});$('productAdminForm')?.addEventListener('submit',saveProductAdmin);$('addProductOption')?.addEventListener('click',()=>addProductOptionRow());$('refreshProductsAdmin')?.addEventListener('click',refreshProductsAdmin);$('productImages')?.addEventListener('change',e=>{$('productImagePreview').innerHTML=[...e.target.files].slice(0,10).map(f=>`<span>${esc(f.name)}</span>`).join('')});
'''
s=s.replace('async function boot(){',insert+'\nasync function boot(){')
p.write_text(s)
