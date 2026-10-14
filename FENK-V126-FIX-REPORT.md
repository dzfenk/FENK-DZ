# FENK V126 — Games + Notifications Fix

## What changed
- Restored the proven direct Supabase query for the public game catalog from the working V112 game-topup implementation.
- Kept an RPC fallback if the direct `games` query fails.
- Kept all current V125 marketplace/security changes.
- Restored direct, RLS-protected reads/updates for `order_notifications` in `app-v27.js`.
- Users can only read/update their own notifications through the `recipient_user_id = current user` filter and existing RLS policy.
- Retry button remains available when notification loading fails.
- No games, packages, users, orders, marketplace data, or FENK identity were deleted.

## Database verification
At the time of this fix, the connected Supabase project contains:
- 31 games total
- 27 active games
- 372 active game packages

The public game RPC also returns 27 active games, confirming the catalog data exists.
