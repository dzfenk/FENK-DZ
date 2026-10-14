# FENK V178 — Game top-up recovery + per-game music fix

- Fixed game catalog loading when the RPC response is returned as JSON text or an empty cached payload.
- Added a direct public-table recovery path before showing `0 لعبة`.
- Confirmed the current Supabase catalog contains active games and packages; no game/package data is deleted.
- Fixed the broken per-game music hooks (`setupGameMusic` / `stopGameMusic`) on the game detail page.
- Per-game music now reads the Admin `game_topup_control.games[gameId].music` settings saved in Supabase.
- Admin can keep music hidden, show it, upload it to Supabase Storage, preview it, or delete it.
- Flexy package pricing falls back to the normal payment price when a Flexy-specific price is not set, instead of showing zero.
- No FENK identity, existing games, packages, orders, or existing functions are intentionally removed.
