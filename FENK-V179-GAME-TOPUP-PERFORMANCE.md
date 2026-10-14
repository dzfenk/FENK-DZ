# FENK V179 — Game top-up performance + Flexy limit

- Kept the existing FENK game top-up system; no games, packages, orders or identity were deleted.
- Added a lightweight public catalog RPC that avoids loading checkout-field definitions and long package descriptions on the first page load.
- Checkout fields are now loaded only when the customer opens a specific game.
- Removed the duplicate package enrichment query from the initial catalog load.
- Added lazy/deferred loading for game/package images.
- Added a hard database-side 600 DZD ceiling for Flexy orders.
- If an Admin does not set a dedicated Flexy price, a package may use its normal payment price for Flexy only when that price is 600 DZD or less.
- Packages above 600 DZD are visibly marked unavailable when Flexy is selected.
- Admin package Flexy price input is capped at 600 DZD.
- Flexy operator cards now show a lightweight local logo-style mark and only active operators with a configured phone are shown.
- Barid Mob proof remains required only for Barid Mob; Flexy never requests proof.
- Flexy order status remains server-controlled: processing → shipped or failed.
