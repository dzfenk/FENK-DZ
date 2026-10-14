/* FENK Site Builder runtime — reads the public homepage_config from Supabase and applies it without rebuilding the page. */
(function(){
  const U='https://wqfnzahjwlukncxlxdkp.supabase.co',K='sb_publishable__QR4tJ9p5RYOQkIuHkoYKQ_mbDa9tuA';
  const client=(window.supabase?.createClient)?window.supabase.createClient(U,K):null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const setText=(sel,val)=>{const e=document.querySelector(sel);if(e&&val!=null)e.textContent=String(val)};
  const setHtml=(sel,val)=>{const e=document.querySelector(sel);if(e&&val!=null)e.innerHTML=String(val)};
  const setAttr=(sel,a,val)=>{const e=document.querySelector(sel);if(e&&val!=null)e.setAttribute(a,String(val))};
  const childText=(root,sel,val)=>{const e=root?.querySelector(sel);if(e&&val!=null)e.textContent=String(val)};
  const childAttr=(root,sel,a,val)=>{const e=root?.querySelector(sel);if(e&&val!=null)e.setAttribute(a,String(val))};
  const show=(sel,on)=>{const e=document.querySelector(sel);if(e)e.hidden=on===false};
  const setLink=(sel,url)=>{const e=document.querySelector(sel);if(e&&url)e.href=url};
  function apply(c){
    c=c||{};
    document.documentElement.dataset.fenkBuilder='active';
    if(c.meta){if(c.meta.title){document.title=c.meta.title} if(c.meta.announcement)setText('.mobile-announcement-track',c.meta.announcement); if(c.meta.whatsapp){document.querySelectorAll('[data-fenk-whatsapp]').forEach(e=>{if(e.tagName==='A')e.href='https://wa.me/'+String(c.meta.whatsapp).replace(/\D/g,'')});document.querySelectorAll('.contact-phone').forEach(e=>e.textContent='+'+String(c.meta.whatsapp).replace(/\D/g,'').replace(/^213/,'213 '))}}
    if(c.logo){
      const lc=c.logo;
      // Apply the FENK logo control site-wide, not only on the homepage.
      // Explicit brand containers cover the different headers/footers used by the
      // marketplace, games, products and admin pages. The fallback selector
      // catches standalone FENK logo images while avoiding favicons and game
      // placeholders.
      const containers=[...document.querySelectorAll('.brand,.mobile-brand,.footer-brand,.admin-brand,.admin-login-box')];
      document.querySelectorAll('img[alt="FENK"]').forEach(img=>{
        if(!img.closest('.game-editor-thumb,.game-card,.tracking-placeholder')){
          const parent=img.closest('a,header,footer,.top,.p-top,.mp-header,.admin-brand,.admin-login-box')||img.parentElement;
          if(parent && !containers.includes(parent)) containers.push(parent);
        }
      });
      const targets=containers;
      targets.forEach(container=>{
        let media=container.querySelector('.fenk-header-logo-media');
        if(lc.enabled===false){container.hidden=true;return}
        container.hidden=false;
        const wantVideo=lc.type==='video'&&lc.video;
        if(wantVideo){
          if(!media || media.tagName!=='VIDEO'){const old=container.querySelector('img,video');media=document.createElement('video');media.className='fenk-header-logo-media';if(old)old.replaceWith(media);else container.prepend(media)}
          media.muted=true;media.autoplay=true;media.loop=true;media.playsInline=true;media.setAttribute('aria-label',lc.alt||'FENK');
          if(media.src!==lc.video){media.src=lc.video;try{media.load()}catch{}}
          try{media.play().catch(()=>{})}catch{}
        }else{
          if(!media || media.tagName!=='IMG'){const old=container.querySelector('img,video');media=document.createElement('img');media.className='fenk-header-logo-media';if(old)old.replaceWith(media);else container.prepend(media)}
          media.src=lc.image||'assets/logo-clean.webp';media.alt=lc.alt||'FENK';media.removeAttribute('controls');
        }
        const desktop=container.classList.contains('brand')||container.classList.contains('footer-brand')||container.classList.contains('admin-brand')||container.classList.contains('admin-login-box')||window.matchMedia('(min-width: 701px)').matches;
        const w=Number(desktop?lc.widthDesktop:lc.widthMobile);
        if(w>0)media.style.width=w+'px';
        media.style.height='auto';
        media.style.display='block';
        media.style.objectFit='contain';
        media.style.transform=`translate(${Number(lc.offsetX||0)}px,${Number(lc.offsetY||0)}px)`;
      });
    }
    if(c.hero){
      show('#hero',c.hero.enabled!==false);
      const hi=document.querySelector('#hero .hero-image'),hv=document.querySelector('#hero .hero-video');
      const type=c.hero.type==='video'?'video':'image';
      if(hi){hi.hidden=type==='video';if(c.hero.image)hi.src=c.hero.image;hi.alt=c.hero.alt||'FENK'}
      if(hv){hv.hidden=type!=='video';if(c.hero.video&&hv.src!==c.hero.video){hv.src=c.hero.video;try{hv.load()}catch{}}if(type==='video'){try{hv.play().catch(()=>{})}catch{}}}
    }
    if(c.marketplace){setText('.fenk-marketplace-strip-title b',c.marketplace.title);setText('.fenk-marketplace-strip-title small',c.marketplace.subtitle);setText('.fenk-marketplace-strip-title strong',c.marketplace.button);setLink('.fenk-marketplace-strip-title',c.marketplace.url)}
    if(c.promo){show('.promo-strip',c.promo.enabled!==false);if(Array.isArray(c.promo.items)&&c.promo.items.length){const track=document.querySelector('.promo-track');if(track)track.innerHTML=c.promo.items.map(x=>`<span>${esc(x)}</span>`).join(' • ')}}
    if(c.magic){show('#fenk-magic',c.magic.enabled!==false);setText('#fenk-magic .magic-kicker',c.magic.kicker);setText('#fenk-magic .fenk-magic-head h2',c.magic.title);setText('#fenk-magic .fenk-magic-head p',c.magic.text);setText('#fenk-magic .fenk-magic-result div span b',c.magic.resultTitle);setText('#fenk-magic .fenk-magic-result div span small',c.magic.resultText);setText('#fenk-magic .fenk-magic-result strong',c.magic.payment)}
    if(c.intelligence){show('#fenk-intelligence',c.intelligence.enabled!==false);setText('#fenk-intelligence .intel-head span',c.intelligence.kicker);setText('#fenk-intelligence .intel-head h2',c.intelligence.title);setText('#fenk-intelligence .intel-head p',c.intelligence.text);setText('#intelAnalyze',c.intelligence.button);setText('#intelStatus',c.intelligence.status)}
    if(c.order){show('#order',c.order.enabled!==false);setText('#order .section-title h2',c.order.title);setText('#order .section-title p',c.order.subtitle)}
    if(c.ads){show('.fenk-ad-carousel',c.ads.enabled!==false);setText('.fenk-ad-label',c.ads.label);if(Array.isArray(c.ads.slides)&&c.ads.slides.length){
      const wrap=document.querySelector('#fenkAdCarousel .fenk-ad-slides'),dotsWrap=document.querySelector('#fenkAdCarousel .fenk-ad-dots');
      if(wrap){wrap.innerHTML=c.ads.slides.map((x,i)=>`<a class="fenk-ad-slide${i===0?' active':''}" href="${esc(x.href||'#order')}" aria-label="${esc(x.alt||('إعلان FENK '+(i+1)))}">${x.video?`<video class="fenk-ad-media" muted autoplay loop playsinline preload="metadata" src="${esc(x.video)}"></video>`:`<img class="fenk-ad-media" src="${esc(x.image||'')}" alt="${esc(x.alt||'إعلان FENK')}" loading="lazy">`}</a>`).join('')}
      if(dotsWrap)dotsWrap.innerHTML=c.ads.slides.map((x,i)=>`<button class="${i===0?'active':''}" type="button" data-ad="${i}" aria-label="الإعلان ${i+1}"></button>`).join('');
      window.dispatchEvent(new CustomEvent('fenk:ads-updated'))
    }}
    if(c.priceWatch){show('#price-watch',c.priceWatch.enabled!==false);setText('#price-watch .section-title h2',c.priceWatch.title);setText('#price-watch .section-title p',c.priceWatch.subtitle)}
    if(c.calculator){show('.fenk-price-calculator',c.calculator.enabled!==false);setText('.fenk-price-calculator h2',c.calculator.title);setText('.fenk-price-calculator .section-title p',c.calculator.subtitle)}
    if(c.videos){show('#videos',c.videos.enabled!==false);setText('#videos .section-title h2',c.videos.title);setText('#videos .section-title p',c.videos.subtitle);if(Array.isArray(c.videos.items)){document.querySelectorAll('#videos .video-card').forEach((e,i)=>{const x=c.videos.items[i];if(!x)return;childText(e,'b',x.title);childText(e,'span',x.text);const v=e.querySelector('video');if(v&&x.video)v.src=x.video;if(v&&x.poster)v.poster=x.poster})}}
    if(c.services){show('#fenk-services',c.services.enabled!==false);setText('#fenk-services .section-title h2',c.services.title);setText('#fenk-services .section-title p',c.services.subtitle);if(Array.isArray(c.services.items)){document.querySelectorAll('.fenk-service-card').forEach((e,i)=>{const x=c.services.items[i];if(!x)return;childText(e,'.service-icon',x.icon);childText(e,'b',x.title);childText(e,'small',x.text);childAttr(e,'a','href',x.url)})}}
    if(c.popular){show('.fenk-popular',c.popular.enabled!==false);setText('.fenk-popular .section-title h2',c.popular.title);setText('.fenk-popular .section-title p',c.popular.subtitle);if(Array.isArray(c.popular.items)){const row=document.querySelector('.fenk-popular-row');if(row)row.innerHTML=c.popular.items.map(x=>`<a href="${esc(x.url||'#order')}">${esc(x.icon||'')} ${esc(x.title||'')}</a>`).join('')}}
    if(c.why){show('#why',c.why.enabled!==false);setText('#why h2',c.why.title);if(Array.isArray(c.why.items))document.querySelectorAll('#why .why-grid article').forEach((e,i)=>{const x=c.why.items[i];if(!x)return;setText('h3',x.title);setText('p',x.text);const b=e.querySelector('b');if(b&&x.icon)b.innerHTML=`<i data-lucide="${esc(x.icon)}"></i>`})}
    if(c.stages){show('.stages',c.stages.enabled!==false);setText('.stages h2',c.stages.title);setText('.stages>p',c.stages.subtitle);if(Array.isArray(c.stages.items))document.querySelectorAll('.stage-row>div').forEach((e,i)=>{const x=c.stages.items[i];if(!x)return;setText('span',x.text);const b=e.querySelector('b');if(b&&x.icon)b.innerHTML=`<i data-lucide="${esc(x.icon)}"></i>`})}
    if(c.ai){show('#fenk-ai-home',c.ai.enabled!==false);setText('#fenk-ai-home .ai-kicker',c.ai.kicker);setText('#fenk-ai-home h2',c.ai.title);setText('#fenk-ai-home p',c.ai.text);setText('#fenk-ai-home button',c.ai.button)}
    if(c.payment){show('#payment',c.payment.enabled!==false);setText('#payment h2',c.payment.title);setText('#payment .payment-main p',c.payment.subtitle)}
    if(c.contact){show('#telegram-contact',c.contact.enabled!==false);setText('#telegram-contact h2',c.contact.title);setText('#telegram-contact p',c.contact.text)}
    if(c.footer){setText('#siteFooter .footer-brand p',c.footer.tagline);setText('#siteFooter .copyright',c.footer.copyright)}
    if(c.visibility&&typeof c.visibility==='object')Object.keys(c.visibility).forEach(k=>{const map={games:'#game-topup',marketplace:'#marketplaces',share:'#share-fenk',tutorial:'.tutorial',trust:'.mobile-trust',services:'#fenk-services',popular:'.fenk-popular',videos:'#videos',calculator:'.fenk-price-calculator',priceWatch:'#price-watch'};if(map[k])show(map[k],c.visibility[k]!==false)});
    if(c.custom_css){let s=document.getElementById('fenk-site-custom-css');if(!s){s=document.createElement('style');s.id='fenk-site-custom-css';document.head.appendChild(s)}s.textContent=String(c.custom_css)}
    try{window.lucide?.createIcons({attrs:{'stroke-width':2.1}})}catch{}
  }
  async function load(){if(!client)return;try{const {data,error}=await client.from('site_settings').select('homepage_config').eq('id',true).maybeSingle();if(!error&&data?.homepage_config)apply(data.homepage_config)}catch(e){console.warn('FENK site builder load:',e)}}
  window.FENKSiteBuilder={apply,load};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,80),{once:true});else setTimeout(load,80);
})();
