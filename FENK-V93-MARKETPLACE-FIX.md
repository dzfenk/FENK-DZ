# V93 Marketplace fix
- Uses the existing Supabase marketplace_ads / marketplace_categories / marketplace_packages schema.
- Fixed broken category images by using local SVG files instead of unescaped data URIs.
- Clicking سيارات للبيع / عقارات / أراضي / منتجات / متاجر now filters by the real category id and always shows a clear result/empty state.
- Fixed payment status to confirmed (the real DB value), and uses the existing payment_settings Barid Mob account.
- Added optional phone/details/image support without forcing all fields.
