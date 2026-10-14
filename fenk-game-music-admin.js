
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}
  function loadGames(){
    const s=$('gameMusicGame');
    if(!s) return;
    // Reuse games already loaded by the existing admin page when possible.
    const source = document.querySelector('#gameSettingsGame');
    if(source && source.options.length){
      s.innerHTML='';
      [...source.options].forEach(o=>{
        if(o.value) s.appendChild(o.cloneNode(true));
      });
    }
    loadSelected();
  }
  function loadSelected(){
    const id=$('gameMusicGame')?.value;
    if(!id) return;
    const cfg=window.FenkGameMusic?.get(id);
    $('gameMusicUrl').value=cfg?.url||'';
    $('gameMusicEnabled').checked=cfg?.enabled!==false;
    $('gameMusicAutoplay').checked=cfg?.autoplay===true;
    $('gameMusicLoop').checked=cfg?.loop!==false;
    $('gameMusicVolume').value=Math.round((cfg?.volume ?? .5)*100);
    $('gameMusicPreview').src=cfg?.url||'';
  }
  function save(){
    const id=$('gameMusicGame')?.value;
    if(!id || !window.FenkGameMusic) return;
    const url=$('gameMusicUrl').value.trim();
    window.FenkGameMusic.set({
      gameId:id,
      title:$('gameMusicGame').selectedOptions[0]?.textContent||'',
      url,
      enabled:$('gameMusicEnabled').checked,
      autoplay:$('gameMusicAutoplay').checked,
      loop:$('gameMusicLoop').checked,
      volume:Number($('gameMusicVolume').value)/100
    });
    alert('تم حفظ موسيقى هذه اللعبة 🎵');
  }
  function clear(){
    const id=$('gameMusicGame')?.value;
    if(!id || !window.FenkGameMusic) return;
    window.FenkGameMusic.remove(id);
    loadSelected();
    alert('تم حذف موسيقى هذه اللعبة');
  }
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(loadGames,300);
    $('gameMusicGame')?.addEventListener('change',loadSelected);
    $('saveGameMusicBtn')?.addEventListener('click',save);
    $('clearGameMusicBtn')?.addEventListener('click',clear);
    $('gameMusicFile')?.addEventListener('change',e=>{
      const f=e.target.files?.[0];
      if(!f) return;
      const u=URL.createObjectURL(f);
      $('gameMusicUrl').value=u;
      $('gameMusicPreview').src=u;
    });
  });
})();
