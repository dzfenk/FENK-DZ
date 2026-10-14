# FENK fixes — 2026-09-26

## 1) Admin Google login
`admin.js` no longer manually calls `exchangeCodeForSession()` while Supabase is already configured with `detectSessionInUrl:true`. This avoids the PKCE callback race that can produce `OAuth state not found or expired` and block Admin login.

`admin.html` cache-buster was updated to load the fixed `admin.js`.

## 2) Flexy operators
A Supabase migration was applied:
`supabase/migrations/20260926_fix_flexy_public_select.sql`

RLS remains enabled. Anonymous customers can read only active Flexy operators; authenticated Admin can read active or inactive operators. This removes the dependency on `is_admin()` for anonymous Flexy reads.

Current active Flexy operator in the database: Djezzy.
