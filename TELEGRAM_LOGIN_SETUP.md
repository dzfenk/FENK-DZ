# FENK — Telegram Login

Telegram-only login is intended for the FENK authentication flow.

Before enabling it in production:
1. Create/configure the Telegram bot with BotFather.
2. Set the bot username in the login page configuration.
3. Configure the Telegram login callback/verification endpoint on the server.
4. Verify Telegram's login hash server-side before creating/signing in the Supabase user.
5. Keep Supabase RLS enabled.

Important: Telegram login cannot be made secure by trusting client-side Telegram profile data alone. The server/Edge Function must validate Telegram's authentication payload.

This file is documentation only; existing FENK authentication files are preserved.
