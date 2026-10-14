/* FENK Neon auth pilot.
 * API auth is deliberately kept separate from the current Supabase session until
 * protected orders/messages/storage functions have been migrated to the API.
 */
(function () {
  'use strict';
  const API = 'https://fenk-python-backend.onrender.com';
  const TOKEN_KEY = 'fenk_neon_access_token';
  const USER_KEY = 'fenk_neon_user';
  const $ = (id) => document.getElementById(id);
  let mode = 'login';
  let busy = false;

  function message(text, error = false) {
    const el = $('fenkNeonMessage');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('error', !!error);
  }
  function setMode(next) {
    mode = next;
    const register = mode === 'register';
    const fields = $('fenkNeonRegisterFields');
    const pass = $('fenkNeonPassword');
    const submit = $('fenkNeonSubmit');
    const toggle = $('fenkNeonMode');
    if (fields) fields.hidden = !register;
    if (pass) pass.autocomplete = register ? 'new-password' : 'current-password';
    if (submit) submit.textContent = register ? 'إنشاء الحساب' : 'تسجيل الدخول بالبريد';
    if (toggle) toggle.textContent = register ? 'لدي حساب بالفعل — تسجيل الدخول' : 'إنشاء حساب جديد';
    message('');
  }
  async function request(path, body, token) {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const response = await fetch(API + path, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      let reason = data.detail || data.message || data.error || 'تعذر إتمام العملية.';
      if (Array.isArray(reason)) reason = reason.map(x => x.msg || JSON.stringify(x)).join('، ');
      if (response.status === 409) reason = 'هذا البريد أو رقم الهاتف مسجل من قبل. جرّب تسجيل الدخول أو استعمل بيانات أخرى.';
      if (response.status === 401) reason = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      throw new Error(String(reason));
    }
    return data;
  }
  function saveSession(data) {
    const token = data.access_token || data.accessToken || data.token;
    if (!token) throw new Error('تم الرد من الخادم دون رمز دخول.');
    sessionStorage.setItem(TOKEN_KEY, token);
    const user = data.user || data.profile || null;
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_KEY);
    window.dispatchEvent(new CustomEvent('fenk:neon-auth-changed', { detail: { authenticated: true, user } }));
    return user;
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const email = ($('fenkNeonEmail')?.value || '').trim().toLowerCase();
    const password = $('fenkNeonPassword')?.value || '';
    if (!email || !password) return message('أدخل البريد الإلكتروني وكلمة المرور.', true);
    if (password.length < 8) return message('كلمة المرور يجب أن تكون 8 أحرف على الأقل.', true);
    const button = $('fenkNeonSubmit');
    busy = true;
    if (button) { button.disabled = true; button.textContent = 'جارٍ الاتصال…'; }
    message(mode === 'register' ? 'جارٍ إنشاء الحساب…' : 'جارٍ تسجيل الدخول…');
    try {
      let data;
      if (mode === 'register') {
        const first_name = ($('fenkNeonFirstName')?.value || '').trim();
        const last_name = ($('fenkNeonLastName')?.value || '').trim();
        const phone = ($('fenkNeonPhone')?.value || '').trim();
        if (!first_name || !last_name || !phone) throw new Error('أكمل الاسم واللقب ورقم الهاتف.');
        data = await request('/auth/register', { email, password, first_name, last_name, phone });
        // Some APIs create the user without returning a token; sign in explicitly in that case.
        if (!(data.access_token || data.accessToken || data.token)) {
          data = await request('/auth/login', { email, password });
        }
      } else {
        data = await request('/auth/login', { email, password });
      }
      saveSession(data);
      message('تم تسجيل الدخول بنجاح. ملاحظة: ربط الطلبات والرسائل بحساب Neon سيتم بعد نقل واجهاتها إلى API.');
      const pass = $('fenkNeonPassword'); if (pass) pass.value = '';
      if (typeof window.fenkToast === 'function') window.fenkToast('تم تسجيل الدخول عبر Neon', 'success');
    } catch (error) {
      message(error?.message || 'تعذر الاتصال بالخادم. حاول مرة أخرى.', true);
    } finally {
      busy = false;
      if (button) { button.disabled = false; button.textContent = mode === 'register' ? 'إنشاء الحساب' : 'تسجيل الدخول بالبريد'; }
    }
  }
  function init() {
    $('fenkNeonAuthForm')?.addEventListener('submit', submit);
    $('fenkNeonMode')?.addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      // Validate session token without exposing it to page markup or logs.
      fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } })
        .then(async r => { if (!r.ok) throw new Error('expired'); return r.json(); })
        .then(user => { sessionStorage.setItem(USER_KEY, JSON.stringify(user)); window.dispatchEvent(new CustomEvent('fenk:neon-auth-changed', { detail: { authenticated: true, user } })); })
        .catch(() => { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); });
    }
    window.FENKNeonAuth = {
      apiBase: API,
      getToken: () => sessionStorage.getItem(TOKEN_KEY),
      getUser: () => { try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch { return null; } },
      async logout() { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); window.dispatchEvent(new CustomEvent('fenk:neon-auth-changed', { detail: { authenticated: false, user: null } })); }
    };
    setMode('login');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
