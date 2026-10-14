
/*
 FENK Telegram Login client helper
 - Uses the official Telegram Login Widget.
 - Sends the returned Telegram auth payload to the existing Supabase
   Edge Function: telegram-login.
 - The Edge Function is responsible for verifying the Telegram hash and
   creating the Supabase session.
 - Do NOT put TELEGRAM_BOT_TOKEN in browser code.
*/
(function () {
  const SUPABASE_FUNCTION_URL =
    "https://wqfnzahjwlukncxlxdkp.supabase.co/functions/v1/telegram-login";

  window.FENKTelegramLogin = {
    async complete(auth) {
      if (!auth || !auth.id || !auth.auth_date || !auth.hash) {
        throw new Error("بيانات Telegram غير مكتملة.");
      }

      const r = await fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth })
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok || !data.session) {
        throw new Error(data.error || "تعذر تسجيل الدخول عبر Telegram.");
      }

      if (window.supabaseClient?.auth?.setSession) {
        await window.supabaseClient.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }

      return data;
    }
  };
})();
