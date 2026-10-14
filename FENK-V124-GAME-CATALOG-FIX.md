# FENK V124 — Game Catalog / Icons Fix

- Fixed the game catalog so active games are loaded reliably from Supabase.
- Added a fallback query if the filtered active-games query unexpectedly returns zero rows.
- Active games now use `logo_url` first for the catalog icon, with banner/asset fallback.
- Added visible loading/error/retry feedback instead of silently showing `0 لعبة`.
- Database currently contains 31 games, 27 active games, and 372 active packages; no fake catalog data was added.
- Kept existing FENK identity and game/package data intact.
