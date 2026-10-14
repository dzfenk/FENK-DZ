
/**
 * FENK — Per-game page music controller V173
 * Each game gets its own music URL/settings. No global music is required.
 * Usage:
 *   FenkGameMusic.set({ gameId, title, url, autoplay, loop, volume })
 *   FenkGameMusic.play(gameId)
 *   FenkGameMusic.stop()
 */
(function () {
  'use strict';

  const STORAGE_PREFIX = 'fenk_game_music_';
  let audio = null;
  let activeGameId = null;

  function key(id) {
    return STORAGE_PREFIX + String(id || '');
  }

  function read(id) {
    try {
      const raw = localStorage.getItem(key(id));
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function write(id, data) {
    try { localStorage.setItem(key(id), JSON.stringify(data)); } catch (_) {}
  }

  function ensureAudio() {
    if (!audio) {
      audio = document.createElement('audio');
      audio.preload = 'auto';
      audio.style.display = 'none';
      document.body.appendChild(audio);
    }
    return audio;
  }

  function stop() {
    if (!audio) return;
    try { audio.pause(); audio.currentTime = 0; } catch (_) {}
    activeGameId = null;
  }

  async function play(gameId) {
    const cfg = read(gameId);
    if (!cfg || !cfg.enabled || !cfg.url) return false;

    const el = ensureAudio();
    if (activeGameId !== String(gameId)) {
      try { el.pause(); el.currentTime = 0; } catch (_) {}
      el.src = cfg.url;
      el.loop = cfg.loop !== false;
      el.volume = Math.max(0, Math.min(1, Number(cfg.volume ?? 0.5)));
      activeGameId = String(gameId);
    }

    try {
      await el.play();
      return true;
    } catch (_) {
      // Mobile browsers may require a user gesture.
      window.dispatchEvent(new CustomEvent('fenk:music-needs-gesture', {
        detail: { gameId: String(gameId), title: cfg.title || '' }
      }));
      return false;
    }
  }

  function set(cfg) {
    if (!cfg || cfg.gameId == null) return;
    const data = {
      gameId: String(cfg.gameId),
      title: cfg.title || '',
      url: cfg.url || '',
      enabled: cfg.enabled !== false,
      autoplay: cfg.autoplay === true,
      loop: cfg.loop !== false,
      volume: Math.max(0, Math.min(1, Number(cfg.volume ?? 0.5)))
    };
    write(cfg.gameId, data);
    if (activeGameId === String(cfg.gameId) && audio) {
      audio.src = data.url || '';
      audio.loop = data.loop;
      audio.volume = data.volume;
    }
  }

  function remove(gameId) {
    try { localStorage.removeItem(key(gameId)); } catch (_) {}
    if (activeGameId === String(gameId)) stop();
  }

  window.FenkGameMusic = { set, play, stop, remove, get: read };

  document.addEventListener('DOMContentLoaded', function () {
    const root = document.querySelector('[data-fenk-game-music]');
    if (!root) return;
    const id = root.getAttribute('data-game-id');
    const cfg = read(id);
    if (cfg && cfg.autoplay && cfg.enabled && cfg.url) {
      play(id);
    }
  });
})();
