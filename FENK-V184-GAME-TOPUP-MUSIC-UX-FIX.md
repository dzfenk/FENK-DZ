# FENK V184 — Game Top-up UX + automatic per-game music

- Removed the visible music control box from the game page.
- Per-game music remains controlled by the existing Admin game music settings and URL.
- Music attempts to start automatically whenever a game is opened.
- If the mobile browser blocks audible autoplay, music starts automatically on the first page interaction without showing a music button.
- Music stops when returning from a game to the games catalog, navigating away, pagehide, or beforeunload.
- Flexy package filtering remains limited to active packages with effective price > 0 and <= 600 DZD.
- The checkout's duplicate payment-method selector is hidden; the selector above the package list is the visible selector and continues to synchronize the existing payment flow.
- No games, packages, orders, Supabase settings, RLS, or payment data are deleted or rebuilt.
