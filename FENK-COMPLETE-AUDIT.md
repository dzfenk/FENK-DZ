# FENK Complete Merge & Security Audit — 2026-09-21

## What was merged
- Base: `FENK-DZ-V119-MARKETPLACE-FULL-SECURE-MOBILE`
- Latest admin/marketplace fixes: `FENK-DZ-V121-MARKETPLACE-ADMIN-FULL`
- V121 changed files retained: `admin.html`, `admin.js`, `marketplace-category.html`, `marketplace-publish.html?v=199`
- V119 assets, Supabase migrations/functions, Netlify configuration, service worker, package files and remaining pages retained.

## Critical fixes added
1. Marketplace ad deletion RLS: authenticated owners can delete their own ads; admins can delete any ad.
2. Storage deletion RLS: owners/admins can clean up marketplace images and private payment-proof files after deletion.
3. Private payment-proof read policy remains restricted to owner/admin.
4. Added the missing `marketplace-telegram-notify` Edge Function used by the marketplace pages.
5. Added the missing `telegram-test` Edge Function used by the Admin page.
6. Telegram functions authenticate the caller and use the database `public.is_admin()` RPC for admin-only test access.
7. Static JavaScript syntax check completed successfully for the merged JS files.
8. Checked the merged project for old DZ Shop references and old Netlify app URLs; none were found in text source files.

## Deployment note
Run the new SQL migration in Supabase before testing delete/cleanup:
`supabase/migrations/20260921_marketplace_delete_security_and_telegram.sql`

Deploy the two new Edge Functions and make sure these Supabase secrets exist:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`
- standard Supabase function secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) as required by the deployment environment.

This package is a merged repair package; it does not intentionally remove the existing project data or assets.
