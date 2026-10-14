# FENK V100 — Marketplace permissions & duration fix

## Fixed
- Fixed Supabase RLS `permission denied for table marketplace_ads` by granting `anon` and `authenticated` EXECUTE on the SECURITY DEFINER function `public.is_fenk_admin()` used by Marketplace RLS policies.
- Marketplace package loading now reports a clear error instead of silently showing an unavailable duration.
- Existing active publishing packages remain: 3, 7, 15, and 30 days.
- No Marketplace tables, ads, users, or existing data were deleted.

## Database migration applied
`marketplace_public_rls_function_execute_fix`

SQL:
`grant execute on function public.is_fenk_admin() to anon, authenticated;`
