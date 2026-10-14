# FENK V97

- Marketplace landing page has exactly 4 category cards.
- Each card opens a dedicated `marketplace-category.html?category=...` page.
- Cars has its own listing page.
- Products has its own listing page.
- Ads has its own listing page.
- Real estate / land has a combined listing page.
- Authenticated owners see "🗑️ حذف إعلاني" on their own published ads.
- Owner deletion is protected by Supabase RLS.
- Admin has "🗑️ حذف نهائي" for Marketplace ads.
- Existing payment approval and publish workflow is preserved.
