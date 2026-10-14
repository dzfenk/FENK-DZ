/* FENK Login Page Ads/Content - Admin controlled */
(function(){
  const U='https://wqfnzahjwlukncxlxdkp.supabase.co',K='sb_publishable__QR4tJ9p5RYOQkIuHkoYKQ_mbDa9tuA';
  const db=window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const DEFAULT={enabled:true,showLogo:false,title:'',subtitle:'',tickerEnabled:true,tickerItems:['🇩🇿 اكتشف FENK — سوق الجزائر','🚗 سيارات ومنتجات وإعلانات في مكان واحد','🎮 اشحن ألعابك وباقاتك عبر FENK','📢 انشر إعلانك ووصل إلى عملاء جدد','🛍️ تصفح الجديد الآن على FENK'],items:[{enabled:true,type:'image',image:'assets/login-ad-01.png',video:'',text:'',href:'',alt:'إعلان FENK 1'},{enabled:true,type:'image',image:'assets/login-ad-02.png',video:'',text:'',href:'',alt:'إعلان FENK 2'},{enabled:true,type:'image',image:'assets/login-ad-03.png',video:'',text:'',href:'',alt:'إعلان FENK 3'},{enabled:true,type:'image',image:'assets/login-ad-04.png',video:'',text:'',href:'',alt:'إعلان FENK 4'},{enabled:true,type:'image',image:'assets/login-ad-05.png',video:'',text:'',href:'',alt:'إعلان FENK 5'},{enabled:true,type:'image',image:'assets/login-ad-06.png',video:'',text:'',href:'',alt:'إعلان FENK 6'}],interval:4};
  let cfg=JSON.parse(JSON.stringify(DEFAULT)),timer=null,index=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  async function load(){
    try{const {data}=await db.from('site_settings').select('homepage_config').eq('id',true).maybeSingle();
      const merge=(a,b)=>{for(const k of Object.keys(b||{})){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k]}return a};
      cfg=merge(JSON.parse(JSON.stringify(DEFAULT)),data?.homepage_config?.loginPage||{});
      const oldDefault=cfg.items?.length===1 && cfg.items[0]?.image==='assets/fenk-ad-01.jpg';
      if(oldDefault){cfg.items=JSON.parse(JSON.stringify(DEFAULT.items));cfg.interval=4;}
      render();
    }catch(e){console.warn('FENK login page config:',e)}
  }
  function render(){
    const root=document.getElementById('fenkLoginPromo'); const ticker=document.getElementById('fenkLoginTicker'); if(!root)return;
    if(ticker){ const msgs=(cfg.tickerItems||[]).filter(Boolean); ticker.hidden=!(cfg.tickerEnabled!==false && msgs.length); ticker.innerHTML=msgs.length?'<div class=\"fenk-login-ticker-track\">'+msgs.concat(msgs).map(m=>'<span class=\"fenk-login-ticker-item\">'+esc(m)+'</span>').join('')+'</div>':''; }
    clearInterval(timer);timer=null;index=0;
    if(!cfg.enabled){root.hidden=true;return}
    const items=(cfg.items||[]).filter(x=>x&&x.enabled!==false&&(x.image||x.video||x.text));
    if(!items.length && !cfg.title && !cfg.subtitle){root.hidden=true;return}
    root.hidden=false;root.innerHTML='';
    const head=(cfg.title||cfg.subtitle)?`<div class="flp-head">${cfg.title?`<b>${esc(cfg.title)}</b>`:''}${cfg.subtitle?`<span>${esc(cfg.subtitle)}</span>`:''}</div>`:'';
    const track=document.createElement('div');track.className='flp-track';
    items.forEach((x,i)=>{const s=document.createElement(x.href?'a':'div');s.className='flp-slide'+(i===0?' active':'');if(x.href){s.href=x.href;s.target='_blank';s.rel='noopener noreferrer'}
      if(x.type==='video'&&x.video){s.innerHTML=`<video src="${esc(x.video)}" ${x.image?`poster="${esc(x.image)}"`:''} muted playsinline loop preload="metadata"></video>`}
      else if(x.image){s.innerHTML=`<img src="${esc(x.image)}" alt="${esc(x.alt||'إعلان FENK')}">`}
      if(x.text)s.insertAdjacentHTML('beforeend',`<span class="flp-text">${esc(x.text)}</span>`);
      track.appendChild(s);
    });
    root.innerHTML=head;root.appendChild(track);
    const slides=[...track.children];
    const show=n=>{index=(n+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('active',i===index);const v=s.querySelector('video');if(v){if(i===index)v.play().catch(()=>{});else v.pause()}})};
    show(0);if(slides.length>1)timer=setInterval(()=>show(index+1),Math.max(2,Number(cfg.interval)||5)*1000);
  }
  window.FENKLoginPage={reload:load};
  window.addEventListener('fenk:login-config-updated',load);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
