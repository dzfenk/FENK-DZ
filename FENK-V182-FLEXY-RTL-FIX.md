# FENK V182 — Flexy 280 DZD + RTL/English package stability

Based on V181. Additive fix only.

## Fixed
- Fixed the Flexy package filtering bug when `flexy_price_dzd` is NULL/empty/zero.
- Normal package price is now used as the Flexy price fallback when no explicit Flexy price is configured.
- An explicit Flexy price above 600 DZD remains blocked.
- A 280 DZD package is therefore visible/selectable through Flexy when its effective price is 280 DZD.
- Added robust DZD parsing for Arabic digits, separators, and mixed price text.
- Strengthened RTL/LTR isolation for English package names and numeric prices.
- Prevented long English names and prices from breaking package card layout.
- Game CTA buttons always contain visible text, defaulting to `شحن الآن`.
- Preserved the 600 DZD guard before order insertion.
- Admin game-order status labels now follow the requested payment-method-specific flow:
  - Flexy: 🟡 قيد المعالجة → 🟢 تم الشحن / 🔴 فشل
  - Barid Mob: انتظار التحقق من الإثبات → 🟢 تم الشحن / 🔴 رفض أو فشل
- Added the missing Barid Mob game-order `failed` status option.

## Preserved
- Existing Supabase project and data.
- Existing games/packages/orders.
- Existing payment system and RLS.
- Existing FENK identity and desktop layout.
- Existing music, catalog, admin controls, and marketplace pages.
