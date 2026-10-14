(function(){
  const U='https://wqfnzahjwlukncxlxdkp.supabase.co',K='sb_publishable__QR4tJ9p5RYOQkIuHkoYKQ_mbDa9tuA';
  const db=window.supabase.createClient(U,K,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const DEFAULT={page:{title:'FENK Marketplace',subtitle:'منتجات وإعلانات وأقسام Marketplace في مكان واحد.',heroEnabled:true,heroImage:'',heroAlt:'FENK Marketplace'},layout:{desktopColumns:2,mobileColumns:2,categoryImageHeight:145,categoryGap:14},promos:[{image:'assets/marketplace/promos/auto-parts.jpg',alt:'قطع غيار السيارات',href:'spare-parts.html',active:true},{image:'assets/marketplace/promos/electronics.jpg',alt:'إلكترونيات ومنتجات تقنية',href:'products.html',active:true},{image:'assets/marketplace/promos/cars.jpg',alt:'سوق السيارات',href:'marketplace-category.html?category=cars',active:true},{image:'assets/marketplace/promos/advertising.jpg',alt:'إعلانات Marketplace',href:'#ads',active:true},{image:'assets/marketplace/promos/real-estate.jpg',alt:'عقارات وأراضي',href:'marketplace-category.html?category=realestate',active:true}],categories:[{name:'سوق السيارات',image:'assets/marketplace/cars.jpg',href:'marketplace-category.html?category=cars',active:true},{name:'سوق المنتجات',image:'assets/marketplace/marketplace-products.png',href:'products.html',active:true},{name:'عقارات / أراضي',image:'assets/marketplace/realestate.jpg',href:'marketplace-category.html?category=realestate',active:true},{name:'الإعلانات',image:'assets/marketplace/ads.gif',href:'marketplace-category.html?category=ads',active:true},{name:'قطع غيار السيارات',image:'assets/marketplace/promos/auto-parts.jpg',href:'spare-parts.html',active:true}]};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const merge=(a,b)=>{for(const k of Object.keys(b||{})){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
  function apply(c){
    const t=document.querySelector('#mpMarketplaceTitle h1'),p=document.querySelector('#mpMarketplaceTitle p');
    if(t)t.textContent=c.page.title;if(p)p.textContent=c.page.subtitle;
    document.title=(c.page.title||'FENK Marketplace')+' | FENK';
    const hero=document.getElementById('mpMarketplaceTitle');
    if(hero){hero.style.backgroundImage=c.page.heroEnabled&&c.page.heroImage?`linear-gradient(90deg,rgba(0,65,51,.92),rgba(0,120,91,.78)),url("${c.page.heroImage.replace(/"/g,'')}" )`:'';hero.style.backgroundSize='cover';hero.style.backgroundPosition='center'}
    const cats=document.getElementById('categories');
    if(cats){cats.innerHTML=(c.categories||[]).filter(x=>x.active!==false).map(x=>`<a class="cat" href="${esc(x.href||'#')}"><img src="${esc(x.image||'')}" alt="${esc(x.name||'')}" loading="lazy"><span>${esc(x.name||'قسم')}</span></a>`).join('');const d=Math.max(1,Math.min(4,Number(c.layout?.desktopColumns)||2)),m=Math.max(1,Math.min(2,Number(c.layout?.mobileColumns)||2)),gap=Math.max(0,Number(c.layout?.categoryGap)||14),h=Math.max(70,Number(c.layout?.categoryImageHeight)||145);cats.style.setProperty('--mc-cols',d);cats.style.setProperty('--mc-cols-mobile',m);cats.style.setProperty('--mc-gap',gap+'px');cats.querySelectorAll('img').forEach(i=>i.style.height=h+'px')}
    const track=document.getElementById('promoTrack');
    if(track){track.innerHTML=(c.promos||[]).filter(x=>x.active!==false&&x.image).map(x=>`<a class="promo-slide" href="${esc(x.href||'#')}" aria-label="${esc(x.alt||'إعلان FENK')}"><img src="${esc(x.image)}" alt="${esc(x.alt||'إعلان FENK')}" loading="lazy"></a>`).join('')}
    window.FENKMarketplaceConfig=c;
  }
  async function load(){try{const {data,error}=await db.from('site_settings').select('homepage_config').eq('id',true).maybeSingle();if(error)throw error;const root=data?.homepage_config&&typeof data.homepage_config==='object'?data.homepage_config:{};const cfg=merge(JSON.parse(JSON.stringify(DEFAULT)),root.marketplace_control||{});apply(cfg)}catch(e){console.warn('FENK Marketplace control:',e)}}
  window.FENKMarketplaceControlReady=new Promise(resolve=>{const run=()=>load().finally(resolve);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run()});
  window.FENKMarketplaceControlLoad=load;
})();
