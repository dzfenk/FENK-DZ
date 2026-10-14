# FENK V123 — Mobile / Support / Games / Security Fix Report

## Issues confirmed from the supplied screenshots
1. **Customer messages:** the modal shows `تعذر تحميل الرسائل الآن`.
   - The customer UI now reads messages through the existing `get_my_support_messages()` RPC instead of depending on a direct client SELECT.
   - Sending still uses the existing `send_my_support_message()` RPC.
   - A retry button appears only when loading fails.
2. **Games:** the customer page showed `0 لعبة`.
   - The project already has real game/package tables; no fake games were inserted.
   - New migration activates only games that have at least one active package, so the catalog can recover from accidental/inconsistent inactive flags.
3. **Marketplace category:** the empty state is backed by the real database. The live database currently reports **0 marketplace_ads rows**, so the page cannot truthfully display ads until real ads are published/approved. No demo ads were inserted.
4. **Security audit:** Supabase currently reports `public.telegram_order_sessions` with RLS disabled. V123 includes a migration that enables RLS and explicitly blocks anon/authenticated client access; server-side Edge Functions using service role remain able to use it.
5. **Performance:** V123 adds indexes for marketplace category/status, marketplace ownership, active game packages, game favorites, and support-message order lookup.

## Important deployment step
Apply:
`supabase/migrations/20260921_fenk_v123_catalog_support_hardening.sql`

Then redeploy the site so `app-v27.js` and `game-topup.html` changes are live.

## No destructive rebuild
Existing files, assets, Supabase schema, and project identity were preserved. No mock marketplace ads or fake games were added.
