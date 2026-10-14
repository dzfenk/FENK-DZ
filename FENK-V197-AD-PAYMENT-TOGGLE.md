# FENK V197 — Marketplace Free/Paid Toggle

- Admin can switch Marketplace ad posting between free and paid.
- Free mode: customer sees no payment section and pays 0 DZD.
- Paid mode: Admin panel reveals ad fee + Barid Mob account fields.
- Paid settings are saved to the existing `marketplace_packages` and `payment_settings` tables.
- Customer page continues reading `site_settings.ad_posting_payment_enabled` from Supabase.
- Existing ad/payment data and pages are preserved.
