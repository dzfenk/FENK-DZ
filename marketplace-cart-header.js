
(function(){
  function readCart(){
    try{return JSON.parse(localStorage.getItem('fenk_product_cart')||'[]')||[]}catch(e){return[]}
  }
  function cartQty(){return readCart().reduce((s,x)=>s+Number(x.quantity||1),0)}
  function update(){
    document.querySelectorAll('.mp-cart-count,#cartCount').forEach(e=>e.textContent=String(cartQty()));
  }
  function ensureHeader(){
    const old=document.querySelector('header.topbar');
    if(old){
      const isHome=location.pathname.endsWith('/marketplace.html')||location.pathname.endsWith('marketplace.html');
      old.className='mp-header';
      old.innerHTML=(isHome
        ? '<a class="mp-back" href="index.html">← الرئيسية</a>'
        : '<a class="mp-back" href="marketplace.html">← Marketplace</a>')+
        '<a class="mp-brand" href="marketplace.html"><span>FENK</span> Marketplace</a>'+
        '<a class="mp-cart" href="product-cart.html" aria-label="سلة المشتريات">🛒 <span class="mp-cart-count">0</span></a>';
    }
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureHeader);else ensureHeader();
  window.addEventListener('storage',update);
  window.addEventListener('fenk-cart-updated',update);
  const oldSet=localStorage.setItem.bind(localStorage);
  localStorage.setItem=function(k,v){oldSet(k,v);if(k==='fenk_product_cart')setTimeout(update,0)}
  const oldRemove=localStorage.removeItem.bind(localStorage);
  localStorage.removeItem=function(k){oldRemove(k);if(k==='fenk_product_cart')setTimeout(update,0)}
  setInterval(update,1200);
})();
