# FENK V155 — Global Share + Direct Product/Ad Links

- Added `fenk-global-share.js` as a reusable global ShareButton/ShopButton component.
- Added `fenk-global-share.css` for compact FENK-styled share/shop actions.
- Automatically enhances product and marketplace-ad cards across Products, search, categories, spare parts, marketplace listings, and cart rows when a direct FENK ID/link is present.
- Product cards receive `↗ مشاركة` and `🛍️ تسوق الآن`.
- Ad cards receive `↗ مشاركة`.
- Share sheet supports Facebook, Messenger, WhatsApp, copy link, and native device sharing.
- Direct URLs preserve the product `section` query where present, so shared product links load the same product.
- Existing FENK pages, Supabase, cart, checkout, authentication, admin, and payment systems are preserved.
