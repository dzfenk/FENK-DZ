# FENK V159 — Game Packages Mobile + Admin

- Game package cards on mobile now use the compact reference layout:
  image on the left, package name/value in the center, price on the right.
- Admin keeps full Supabase control over package image, name, description, amount, price, original price, order and active state.
- Added an Admin game filter so selecting eFootball displays only its packages.
- Existing Supabase tables, order flow, payment flow and package IDs are preserved.
