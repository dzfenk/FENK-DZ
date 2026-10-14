# FENK V153 — Marketplace Search + Location + Filters

- Added Marketplace search page with recent searches stored locally, delete (×), one-tap rerun, Arabic/French/Algerian-dialect-friendly normalization and fuzzy matching.
- Added location/radius page with manual Wilaya selection, municipality text field, suggested/custom radius modes, and 1/5/10/25/50/100 km options.
- Location preference is stored locally and reused by Marketplace category pages.
- Cars/real-estate/land category pages now expose search, categories, location, price and latest controls.
- Cars page uses a dense mobile grid: four cards per row when screen width is suitable.
- Distance filtering is applied for custom radius when an ad has a resolvable location; exact coordinates are supported when stored inside `details` (`lat`/`lng` or `latitude`/`longitude`). Otherwise the ad's Wilaya/municipality is used as an approximate center.
- Existing Supabase/Auth/Admin/payment/cart/order data and existing pages/functions were not deleted or rebuilt.
