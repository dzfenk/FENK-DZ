# FENK V61 — final repair package

- Customer order archive now hides only the customer copy while preserving admin history.
- Customer price pending state explains that FENK is reviewing product/shipping/service costs.
- FENK Smart AI promotional visual refreshed with an AI-generated FENK DZ creative.
- Smart ad has motion/zoom/glow animation on mobile and desktop.
- Existing admin account, Supabase auth, order tracking, payment-proof flow and Telegram support integration preserved.
- No FENK identity, customer data, or existing order history was intentionally removed.

## Telegram
The existing `telegram-support-notify` Edge Function is ACTIVE and requires its configured Telegram bot secrets. The admin account is present in `admin_users` and the Google-authenticated user is confirmed.
