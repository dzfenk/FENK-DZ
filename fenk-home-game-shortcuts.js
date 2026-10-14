/* FENK homepage game-topup shortcuts control: reads game_topup_control.homeShortcuts from Supabase. */
(function(){
  'use strict';
  const U='https://wqfnzahjwlukncxlxdkp.supabase.co',K='sb_publishable__QR4tJ9p5RYOQkIuHkoYKQ_mbDa9tuA';
  const client=window.supabase?.createClient?window.supabase.createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
  const root=document.getElementById('game-topup-shortcuts');
  if(!root||!client)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const enc=s=>encodeURIComponent(String(s??''));
  function media(x){
    const type=x.mediaType||'image',url=x.mediaUrl||'';
    if(!url)return '<span class="fenk-home-game-placeholder">🎮</span>';
    if(type==='video')return `<video src="${esc(url)}" muted autoplay loop playsinline preload="metadata" aria-label="${esc(x.title||x.game||'لعبة')}"></video>`;
    return `<img alt="${esc(x.title||x.game||'لعبة')}" loading="lazy" src="${esc(url)}">`;
  }
  async function load(){
    try{
      const {data,error}=await client.from('site_settings').select('homepage_config').eq('id',true).maybeSingle();
      if(error)throw error;
      const c=data?.homepage_config?.game_topup_control?.homeShortcuts;
      if(!c||c.enabled===false||!Array.isArray(c.items))return;
      const items=c.items.filter(x=>x&&x.active!==false).sort((a,b)=>Number(a.sort||0)-Number(b.sort||0));
      if(!items.length)return;
      const style=c.style||{};
      const track=root.querySelector('.game-cover-track');
      if(!track)return;
      track.classList.add('fenk-home-controlled');
      track.style.setProperty('--fenk-home-gap',`${Math.max(0,Number(style.cardGap??5))}px`);
      track.style.setProperty('--fenk-home-cols',String(Math.max(2,Math.min(6,Number(style.columns??4)))));
      track.innerHTML=items.map(x=>{
        const name=x.game||x.title||'';
        const title=x.title||name;
        const subtitle=x.subtitle||'';
        const href=`game-topup.html?v=130&game=${enc(name)}`;
        return `<a class="game-glow-card game-cover-card" href="${href}" data-home-game="${esc(name)}"><span class="game-cover-image">${media(x)}</span><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></a>`;
      }).join('');
      root.classList.toggle('fenk-home-shortcuts-hidden',false);
      root.style.setProperty('--fenk-home-image-height',`${Math.max(30,Number(style.imageHeight??56))}px`);
      root.style.setProperty('--fenk-home-radius',`${Math.max(0,Number(style.cardRadius??16))}px`);
      root.style.setProperty('--fenk-home-title-size',`${Math.max(7,Number(style.titleSize??9))}px`);
      root.style.setProperty('--fenk-home-subtitle-size',`${Math.max(6,Number(style.subtitleSize??8))}px`);
    }catch(e){console.warn('FENK homepage game shortcuts:',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,140),{once:true});
  else setTimeout(load,140);
})();
