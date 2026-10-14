/* FENK Global Share Component
 * Automatically enhances any product/ad card that exposes a direct FENK URL.
 * Public API: window.ShareButton(item), window.FENKShare.shareItem(item)
 */
(function(){
  'use strict';
  const ROOT='/FENK/';
  const PRODUCT_PATH='product.html';
  const AD_PATH='marketplace-ad.html';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function absUrl(raw){
    try{
      const u=new URL(raw||'',location.href);
      u.hash='';
      return u.href;
    }catch{return location.href.split('#')[0]}
  }
  function kindFromUrl(raw){
    const s=String(raw||'');
    if(/(?:^|\/)product\.html(?:\?|$)/i.test(s)) return 'product';
    if(/(?:^|\/)(?:marketplace-ad|ad)\.html(?:\?|$)/i.test(s)) return 'ad';
    return null;
  }
  function urlFor(item){
    if(item?.url) return absUrl(item.url);
    const type=item?.type==='ad'?'ad':'product';
    const id=item?.id;
    if(!id) return absUrl(location.href);
    const path=type==='ad'?AD_PATH:PRODUCT_PATH;
    const q=new URLSearchParams(); q.set('id',id);
    if(type==='product' && item.section) q.set('section',item.section);
    return absUrl(path+'?'+q.toString());
  }
  function itemFromElement(el, anchor){
    const a=anchor||el?.querySelector?.('a[href*="product.html"],a[href*="marketplace-ad.html"],a[href*="ad.html"]');
    const href=a?.getAttribute('href')||el?.dataset?.fenkUrl||'';
    const u=href?new URL(href,location.href):null;
    const type=el?.dataset?.fenkType || kindFromUrl(href);
    const id=el?.dataset?.fenkId || u?.searchParams?.get('id');
    if(!type||!id) return null;
    const title=el?.dataset?.fenkTitle || a?.getAttribute('aria-label') || el?.querySelector?.('h1,h2,h3,.title,.pcard-title,.body h3')?.textContent?.trim() || document.title.replace(/^FENK\s*[—|-]\s*/,'');
    const img=el?.dataset?.fenkImage || el?.querySelector?.('img')?.currentSrc || el?.querySelector?.('img')?.src || '';
    const price=el?.dataset?.fenkPrice || el?.querySelector?.('.price,.price-chip,.market-card-price')?.textContent?.trim() || '';
    const section=el?.dataset?.fenkSection || u?.searchParams?.get('section') || '';
    return {id,type,title,image:img,price,url:absUrl(u?u.href:href),section};
  }

  function showToast(msg){
    let t=document.getElementById('fenkShareToast');
    if(!t){t=document.createElement('div');t.id='fenkShareToast';t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100001;background:#073f35;color:#fff;padding:10px 16px;border-radius:12px;font-weight:700;font-size:13px;box-shadow:0 8px 25px rgba(0,0,0,.2);direction:rtl';document.body.appendChild(t)}
    t.textContent=msg;t.hidden=false;clearTimeout(t._tm);t._tm=setTimeout(()=>t.hidden=true,2200);
  }
  function close(){document.getElementById('fenkGlobalShareOverlay')?.remove()}
  function open(item){
    item={...item,url:urlFor(item)};
    close();
    const overlay=document.createElement('div');overlay.id='fenkGlobalShareOverlay';overlay.className='fenk-share-overlay';
    overlay.innerHTML=`<div class="fenk-share-sheet" role="dialog" aria-modal="true" aria-label="مشاركة ${esc(item.title||'العنصر')}">
      <div class="fenk-share-head"><h3 class="fenk-share-title">${item.type==='ad'?'مشاركة الإعلان':'مشاركة المنتج'} 🔗</h3><button class="fenk-share-close" type="button" aria-label="إغلاق">×</button></div>
      <p class="fenk-share-item">${esc(item.title||'FENK')}</p>
      <div class="fenk-share-grid">
        <button class="fenk-share-option" data-share="facebook">🔵 Facebook</button>
        <button class="fenk-share-option" data-share="messenger">💬 Messenger</button>
        <button class="fenk-share-option" data-share="whatsapp">🟢 WhatsApp</button>
        <button class="fenk-share-option copy" data-share="copy">🔗 نسخ الرابط</button>
        <button class="fenk-share-option" data-share="native">📱 مشاركة من الهاتف</button>
      </div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.fenk-share-close').onclick=close;
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    overlay.querySelectorAll('[data-share]').forEach(btn=>btn.addEventListener('click',()=>doShare(btn.dataset.share,item)));
    overlay._item=item;
  }
  async function doShare(mode,item){
    const url=item.url;
    const text=`${item.title||'FENK'}${item.price?'\n'+item.price:''}\n🛍️ ${item.type==='product'?'تسوق الآن':'عرض الإعلان'}\n${url}`;
    if(mode==='copy'){
      try{await navigator.clipboard.writeText(url);showToast('✓ تم نسخ رابط FENK المباشر');close();}
      catch{window.prompt('انسخ رابط المنتج/الإعلان:',url)}
      return;
    }
    if(mode==='native'){
      if(navigator.share){try{await navigator.share({title:item.title||'FENK',text,url});}catch{} }
      else {try{await navigator.clipboard.writeText(url);showToast('تم نسخ الرابط — المشاركة الأصلية غير مدعومة على هذا الجهاز.');}catch{}}
      return;
    }
    let shareUrl='';
    if(mode==='facebook') shareUrl='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url);
    if(mode==='whatsapp') shareUrl='https://wa.me/?text='+encodeURIComponent(text);
    if(mode==='messenger'){
      // Messenger deep link works on supported mobile apps; web fallback still carries the direct URL.
      shareUrl='fb-messenger://share/?link='+encodeURIComponent(url);
      setTimeout(()=>{ if(document.visibilityState==='visible') window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),'_blank','noopener'); },900);
    }
    if(shareUrl) window.open(shareUrl,'_blank','noopener,noreferrer');
  }

  function ShareButton(item){
    const b=document.createElement('button');b.type='button';b.className='fenk-global-share';b.textContent='↗ مشاركة';b.setAttribute('aria-label','مشاركة '+(item?.title||'العنصر'));
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(item)});return b;
  }
  function ShopButton(item){
    if(!item||item.type!=='product') return null;
    const b=document.createElement('button');b.type='button';b.className='fenk-global-shop';b.textContent='🛍️ تسوق الآن';b.setAttribute('aria-label','تسوق الآن '+(item.title||'المنتج'));
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();location.href=urlFor(item)});return b;
  }

  function enhance(root=document){
    const nodes=[];
    root.querySelectorAll?.('a[href*="product.html?id="],a[href*="marketplace-ad.html?id="],a[href*="ad.html?id="],[data-fenk-type][data-fenk-id]').forEach(a=>nodes.push(a));
    root.querySelectorAll?.('article[onclick*="product.html?id="],.pcard[onclick*="product.html?id="]').forEach(a=>nodes.push(a));
    nodes.forEach(node=>{
      let card=node.closest('article,.pcard,.card,.product-card,.marketplace-card,.search-result,.item')||node.parentElement;
      if(!card||card.dataset.fenkShareEnhanced==='1') return;
      let item=itemFromElement(card,node.matches?.('a')?node:null);
      if(!item){
        const m=String(card.getAttribute('onclick')||'').match(/(?:product|marketplace-ad|ad)\.html\?id=([^'"&]+)/i);
        if(m){item={id:decodeURIComponent(m[1]),type:/product\.html/i.test(m[0])?'product':'ad',title:card.querySelector('h1,h2,h3,.title,.pcard-title')?.textContent?.trim()||'FENK',image:card.querySelector('img')?.src||'',price:card.querySelector('.price,.price-chip,.market-card-price')?.textContent?.trim()||'',section:/[?&]section=([^'"&]+)/i.exec(String(card.getAttribute('onclick')||''))?.[1]||''};item.url=urlFor(item)}}
      if(!item) return;
      card.dataset.fenkShareEnhanced='1';
      card.dataset.fenkItemType=item.type;card.dataset.fenkItemId=item.id;card.dataset.fenkUrl=item.url;
      const host=document.createElement('div');host.className='fenk-global-actions';
      host.appendChild(ShareButton(item));
      const shop=ShopButton(item);if(shop)host.appendChild(shop);
      // Never nest buttons inside an <a>. Put actions inside the card article,
      // or immediately after a standalone anchor card.
      if(card.tagName==='A'){
        card.parentElement?.insertBefore(host,card.nextSibling);
      }else{
        card.appendChild(host);
      }
    });

    // Cart rows carry product_id in local storage and are rendered without a direct anchor.
    root.querySelectorAll?.('.item[data-key]').forEach(card=>{
      if(card.dataset.fenkShareEnhanced==='1') return;
      const m=card.outerHTML.match(/data-index="(\d+)"/);if(!m)return;
      try{
        const items=JSON.parse(localStorage.getItem('fenk_product_cart')||'[]');const x=items[Number(m[1])];if(!x?.product_id)return;
        const item={id:x.product_id,type:'product',title:x.title,image:x.image_url,price:x.price,url:urlFor({type:'product',id:x.product_id,section:x.catalog_section||'products'}),section:x.catalog_section||'products'};
        card.dataset.fenkShareEnhanced='1';const host=document.createElement('div');host.className='fenk-global-actions';host.appendChild(ShareButton(item));host.appendChild(ShopButton(item));(card.querySelector('.info')||card).appendChild(host);
      }catch{}
    });
  }

  window.FENKShare={ShareButton,ShopButton,shareItem:open,urlFor,enhance};
  window.ShareButton=ShareButton;
  document.addEventListener('DOMContentLoaded',()=>{
    enhance(document);
    const mo=new MutationObserver(()=>enhance(document));mo.observe(document.body,{childList:true,subtree:true});
  });
})();
