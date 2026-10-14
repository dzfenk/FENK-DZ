
const U='https://wqfnzahjwlukncxlxdkp.supabase.co',K='sb_publishable__QR4tJ9p5RYOQkIuHkoYKQ_mbDa9tuA',db=window.supabase.createClient(U,K);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money=v=>Number(v||0).toLocaleString('ar-DZ')+' دج';
const names={engines:'محركات',gearbox:'ناقل الحركة',tires_rims:'إطارات وجنوط',brakes:'فرامل',electrical:'كهرباء',lighting:'إضاءة',cooling:'تبريد',oils_filters:'زيوت وفلاتر',batteries:'بطاريات',body:'هيكل',interior:'داخلية',exhaust:'عادم',other:'أخرى'};
const part=new URLSearchParams(location.search).get('part')||'';
document.querySelectorAll('.parts-nav a').forEach(a=>{const q=new URL(a.href,location.href).searchParams.get('part')||'';if(q===part)a.classList.add('active')});
document.getElementById('heading').textContent=part?(names[part]||'قطع غيار السيارات'):'قطع غيار السيارات';
function updateCart(){const a=JSON.parse(localStorage.getItem('fenk_product_cart')||'[]');document.getElementById('cartCount').textContent=a.reduce((s,x)=>s+Number(x.quantity||1),0)}
async function load(){
 let q=db.from('fenk_products').select('*').eq('is_active',true).eq('show_in_products',true).eq('catalog_section','spare_parts').gt('stock_quantity',0).order('created_at',{ascending:false});
 if(part)q=q.eq('part_category',part);
 const {data,error}=await q;
 if(error){document.getElementById('grid').innerHTML='<div class="empty">تعذر تحميل قطع الغيار.</div>';return}
 const rows=data||[];document.getElementById('count').textContent=rows.length+' قطعة';
 if(!rows.length){document.getElementById('grid').innerHTML='<div class="empty">لا توجد قطع غيار مفعلة في هذا القسم حاليًا.<br><small>يمكن للأدمن إضافة البطاريات والإطارات والفرامل وغيرها من لوحة الإدارة.</small></div>';return}
 document.getElementById('grid').innerHTML=rows.map(p=>{const img=Array.isArray(p.image_urls)&&p.image_urls[0]||'assets/marketplace/promos/auto-parts.jpg';return `<article class="pcard" onclick="location.href='product.html?id=${encodeURIComponent(p.id)}&section=spare_parts'"><img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy"><div class="pcard-body"><div class="pcard-title">${esc(p.title)}</div><div class="price">${money(p.price_dzd)}${p.original_price?` <span class="old">${money(p.original_price)}</span>`:''}</div>${Number(p.discount_pct)>0?`<span class="discount">خصم ${Number(p.discount_pct)}%</span>`:''}<div class="rating">${Number(p.rating)>0?'⭐ '+Number(p.rating).toFixed(1):'قطعة أصلية عبر FENK'}</div><button class="choose" onclick="event.stopPropagation();location.href='product.html?id=${encodeURIComponent(p.id)}&section=spare_parts'">اختيار المنتج</button></div></article>`}).join('');
 updateCart()
}
load();updateCart();

const moreBtn=document.getElementById('spareMoreBtn');
if(moreBtn){moreBtn.addEventListener('click',()=>{const nav=document.querySelector('.parts-nav');const open=nav.classList.toggle('is-expanded');moreBtn.textContent=open?'عرض أقل':'عرض المزيد';moreBtn.setAttribute('aria-expanded',String(open));});}
