(function(){
  const U='https://wqfnzahjwlukncxlxdkp.supabase.co',K='sb_publishable__QR4tJ9p5RYOQkIuHkoYKQ_mbDa9tuA';
  const db=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const DEFAULT={
    page:{title:'FENK Marketplace',subtitle:'منتجات وإعلانات وأقسام Marketplace في مكان واحد.',heroEnabled:true,heroImage:'',heroAlt:'FENK Marketplace'},
    layout:{desktopColumns:2,mobileColumns:2,categoryImageHeight:145,categoryGap:14},
    promos:[
      {image:'assets/marketplace/promos/auto-parts.jpg',alt:'قطع غيار السيارات',href:'spare-parts.html',active:true},
      {image:'assets/marketplace/promos/electronics.jpg',alt:'إلكترونيات ومنتجات تقنية',href:'products.html',active:true},
      {image:'assets/marketplace/promos/cars.jpg',alt:'سوق السيارات',href:'marketplace-category.html?category=cars',active:true},
      {image:'assets/marketplace/promos/advertising.jpg',alt:'إعلانات Marketplace',href:'#ads',active:true},
      {image:'assets/marketplace/promos/real-estate.jpg',alt:'عقارات وأراضي',href:'marketplace-category.html?category=realestate',active:true}
    ],
    categories:[
      {name:'سوق السيارات',image:'assets/marketplace/cars.jpg',href:'marketplace-category.html?category=cars',active:true},
      {name:'سوق المنتجات',image:'assets/marketplace/marketplace-products.png',href:'products.html',active:true},
      {name:'عقارات / أراضي',image:'assets/marketplace/realestate.jpg',href:'marketplace-category.html?category=realestate',active:true},
      {name:'الإعلانات',image:'assets/marketplace/ads.gif',href:'marketplace-category.html?category=ads',active:true},
      {name:'قطع غيار السيارات',image:'assets/marketplace/promos/auto-parts.jpg',href:'spare-parts.html',active:true}
    ]
  };
  let cfg=JSON.parse(JSON.stringify(DEFAULT));
  const merge=(a,b)=>{for(const k of Object.keys(b||{})){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
  const setMsg=(t,type='')=>{const e=$('marketplaceControlMsg');if(e){e.textContent=t;e.className='admin-msg '+type}};
  async function isAdmin(){const {data:{session}}=await db.auth.getSession();if(!session?.user)return false;const {data}=await db.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();return !!data}
  async function uploadImage(file){if(!file?.type?.startsWith('image/'))throw new Error('اختر صورة صالحة.');if(file.size>10*1024*1024)throw new Error('حجم الصورة يجب ألا يتجاوز 10MB.');const {data:{session}}=await db.auth.getSession();if(!session?.user)throw new Error('انتهت جلسة الإدارة.');const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';const path=`${session.user.id}/marketplace-control/${crypto.randomUUID()}.${ext}`;const up=await db.storage.from('marketplace-images').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;return db.storage.from('marketplace-images').getPublicUrl(path).data.publicUrl}
  function imageField(obj,key,label){return `<label class="mc-field"><span>${label}</span><div class="mc-upload"><input data-img-path="page.${esc(key)}" value="${esc(obj[key]||'')}" placeholder="رابط أو مسار الصورة"><button type="button" class="mc-btn" data-upload="page.${esc(key)}">📷 رفع صورة</button><input type="file" accept="image/*" data-file="page.${esc(key)}"></div><img class="mc-preview" src="${esc(obj[key]||'')}" onerror="this.style.display='none'" onload="this.style.display='block'"></label>`}
  function build(){const f=$('marketplaceControlForm');if(!f)return;let h='';
    h+=`<div class="mc-group"><div class="mc-head"><div><h4>📝 معلومات صفحة السوق</h4><p>غيّر اسم الصفحة والوصف والصورة الرئيسية.</p></div></div><div class="mc-grid">
      <label class="mc-field"><span>اسم صفحة السوق</span><input data-main="page.title" value="${esc(cfg.page.title)}"></label>
      <label class="mc-field"><span>وصف الصفحة</span><input data-main="page.subtitle" value="${esc(cfg.page.subtitle)}"></label>
      <label class="mc-check mc-wide"><input type="checkbox" data-main="page.heroEnabled" ${cfg.page.heroEnabled?'checked':''}> إظهار الصورة الرئيسية</label>
      ${imageField(cfg.page,'heroImage','صورة الصفحة الرئيسية')}
      <label class="mc-field"><span>النص البديل للصورة</span><input data-main="page.heroAlt" value="${esc(cfg.page.heroAlt)}"></label>
    </div></div>`;
    h+=`<div class="mc-group"><div class="mc-head"><div><h4>📐 شكل وتقسيم السوق</h4><p>تحكم في عدد الأعمدة، حجم صور الأقسام، والمسافات على الهاتف والكمبيوتر.</p></div></div><div class="mc-grid">
      <label class="mc-field"><span>عدد الأعمدة على الكمبيوتر</span><select data-main="layout.desktopColumns"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label>
      <label class="mc-field"><span>عدد الأعمدة على الهاتف</span><select data-main="layout.mobileColumns"><option value="1">1</option><option value="2">2</option></select></label>
      <label class="mc-field"><span>ارتفاع صورة القسم (px)</span><input data-main="layout.categoryImageHeight" type="number" min="70" max="400"></label>
      <label class="mc-field"><span>المسافة بين الأقسام (px)</span><input data-main="layout.categoryGap" type="number" min="0" max="40"></label>
    </div></div>`;
    h+=`<div class="mc-group"><div class="mc-head"><div><h4>📢 صور وإعلانات Marketplace</h4><p>أضف صورة، غيّر الاسم والرابط، أو أخفِ/احذف الإعلان. الترتيب هو نفس ترتيب الظهور.</p></div></div><div id="mcPromos"></div><div class="mc-actions"><button type="button" class="mc-btn" id="mcAddPromo">➕ إضافة صورة إعلان</button></div></div>`;
    h+=`<div class="mc-group"><div class="mc-head"><div><h4>🗂️ أقسام / صفحات السوق</h4><p>غيّر اسم أي قسم، صورته ورابطه، أضف قسمًا جديدًا أو أخفِه. التغييرات تظهر في صفحة Marketplace بعد الحفظ والتحديث.</p></div></div><div id="mcCategories"></div><div class="mc-actions"><button type="button" class="mc-btn" id="mcAddCategory">➕ إضافة صفحة / قسم</button></div></div>`;
    f.innerHTML=h;
    f.querySelector('[data-main="layout.desktopColumns"]').value=cfg.layout.desktopColumns;
    f.querySelector('[data-main="layout.mobileColumns"]').value=cfg.layout.mobileColumns;
    f.querySelector('[data-main="layout.categoryImageHeight"]').value=cfg.layout.categoryImageHeight;
    f.querySelector('[data-main="layout.categoryGap"]').value=cfg.layout.categoryGap;
    renderRows();bind();
  }
  function renderRows(){
    const pr=$('mcPromos');pr.innerHTML=cfg.promos.map((x,i)=>`<div class="mc-row"><b>#${i+1}</b><label><span>الصورة</span><div class="mc-upload"><input data-p="promos" data-i="${i}" data-k="image" value="${esc(x.image||'')}"><button type="button" class="mc-btn" data-rup="promos|${i}|image">📷</button><input type="file" accept="image/*" data-rfile="promos|${i}|image"></div><img src="${esc(x.image||'')}" onerror="this.style.display='none'" onload="this.style.display='block'"></label><label><span>الاسم / Alt</span><input data-p="promos" data-i="${i}" data-k="alt" value="${esc(x.alt||'')}"></label><label><span>الرابط</span><input data-p="promos" data-i="${i}" data-k="href" value="${esc(x.href||'')}"></label><label><span>الحالة</span><select data-p="promos" data-i="${i}" data-k="active"><option value="true" ${x.active!==false?'selected':''}>مفعّل</option><option value="false" ${x.active===false?'selected':''}>مخفي</option></select></label><button type="button" class="mc-btn mc-delete" data-del="promos|${i}">🗑️</button></div>`).join('');
    const cr=$('mcCategories');cr.innerHTML=cfg.categories.map((x,i)=>`<div class="mc-row"><b>#${i+1}</b><label><span>الصورة</span><div class="mc-upload"><input data-p="categories" data-i="${i}" data-k="image" value="${esc(x.image||'')}"><button type="button" class="mc-btn" data-rup="categories|${i}|image">📷</button><input type="file" accept="image/*" data-rfile="categories|${i}|image"></div><img src="${esc(x.image||'')}" onerror="this.style.display='none'" onload="this.style.display='block'"></label><label><span>اسم الصفحة</span><input data-p="categories" data-i="${i}" data-k="name" value="${esc(x.name||'')}"></label><label><span>الرابط</span><input data-p="categories" data-i="${i}" data-k="href" value="${esc(x.href||'')}"></label><label><span>الحالة</span><select data-p="categories" data-i="${i}" data-k="active"><option value="true" ${x.active!==false?'selected':''}>مفعّل</option><option value="false" ${x.active===false?'selected':''}>مخفي</option></select></label><button type="button" class="mc-btn mc-delete" data-del="categories|${i}">🗑️</button></div>`).join('');
  }
  function bind(){
    document.querySelectorAll('[data-main]').forEach(el=>el.addEventListener(el.type==='checkbox'?'change':'input',()=>{let [a,b]=el.dataset.main.split('.');cfg[a][b]=el.type==='checkbox'?el.checked:(el.type==='number'?Number(el.value):el.value)}));
    document.querySelectorAll('[data-img-path]').forEach(el=>el.addEventListener('input',()=>{let p=el.dataset.imgPath.split('.');let o=cfg;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p.at(-1)]=el.value}));
    document.querySelectorAll('[data-upload]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector(`[data-file="${CSS.escape(btn.dataset.upload)}"]`)?.click()));
    document.querySelectorAll('[data-file]').forEach(el=>el.addEventListener('change',async()=>{const f=el.files?.[0];if(!f)return;try{setMsg('جارٍ رفع الصورة…');const u=await uploadImage(f);let p=el.dataset.file.split('.');let o=cfg;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p.at(-1)]=u;build();setMsg('تم رفع الصورة. اضغط حفظ.','success')}catch(e){setMsg(e.message||'تعذر رفع الصورة.','error')}}));
    document.querySelectorAll('[data-p]').forEach(el=>el.addEventListener('input',()=>{const a=cfg[el.dataset.p],i=Number(el.dataset.i),k=el.dataset.k;a[i][k]=el.tagName==='SELECT'&&k==='active'?el.value==='true':el.value}));
    document.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{const [a,i]=b.dataset.del.split('|');cfg[a].splice(Number(i),1);build()}));
    document.querySelectorAll('[data-rup]').forEach(b=>b.addEventListener('click',()=>document.querySelector(`[data-rfile="${CSS.escape(b.dataset.rup)}"]`)?.click()));
    document.querySelectorAll('[data-rfile]').forEach(el=>el.addEventListener('change',async()=>{const f=el.files?.[0];if(!f)return;try{setMsg('جارٍ رفع الصورة…');const u=await uploadImage(f);const [a,i,k]=el.dataset.rfile.split('|');cfg[a][Number(i)][k]=u;build();setMsg('تم تغيير الصورة. اضغط حفظ.','success')}catch(e){setMsg(e.message||'تعذر رفع الصورة.','error')}}));
    $('mcAddPromo').onclick=()=>{cfg.promos.push({image:'',alt:'إعلان جديد',href:'#',active:true});build()};
    $('mcAddCategory').onclick=()=>{cfg.categories.push({name:'قسم جديد',image:'',href:'#',active:true});build()};
  }
  async function load(){
    setMsg('جارٍ تحميل إعدادات السوق…');
    const {data,error}=await db.from('site_settings').select('homepage_config').eq('id',true).maybeSingle();
    if(error){setMsg(error.message,'error');return}
    const root=data?.homepage_config && typeof data.homepage_config==='object' ? data.homepage_config : {};
    cfg=merge(JSON.parse(JSON.stringify(DEFAULT)),root.marketplace_control||{});
    build();setMsg('تم تحميل إعدادات السوق ✓');
  }
  async function save(){
    const b=$('saveMarketplaceControl');b.disabled=true;
    try{
      if(!(await isAdmin()))throw new Error('هذا الحساب ليس Admin.');
      const {data:current,error:readError}=await db.from('site_settings').select('homepage_config').eq('id',true).maybeSingle();
      if(readError)throw readError;
      const root=current?.homepage_config && typeof current.homepage_config==='object' ? current.homepage_config : {};
      root.marketplace_control=cfg;
      const {error}=await db.from('site_settings').update({homepage_config:root,updated_at:new Date().toISOString()}).eq('id',true);
      if(error)throw error;
      setMsg('✓ تم حفظ إعدادات السوق في Supabase. حدّث صفحة Marketplace لرؤية التغييرات.','success');
    }catch(e){setMsg(e.message||'تعذر الحفظ.','error')}finally{b.disabled=false}
  }
  document.addEventListener('click',e=>{if(e.target.closest?.('.admin-tab[data-tab="marketplaceControl"]'))setTimeout(load,60)});
  document.addEventListener('DOMContentLoaded',()=>{$('saveMarketplaceControl')?.addEventListener('click',save);$('reloadMarketplaceControl')?.addEventListener('click',load);});
})();
