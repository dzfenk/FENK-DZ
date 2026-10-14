# FENK — Notification Routing Fix (2026-09-26)

## Changes
- `FENK Orders` remains the only Telegram channel for order creation/status workflow.
- `FENK Notifications` is protected from accidental `orders`/marketplace/support payloads.
- Database admin-side order notifications are no longer created in the generic notification feed; existing rows are preserved and marked `order_admin`.
- Customer order notifications remain unchanged.
- Added a mobile red logged-out reminder when the current device has remembered unread notifications:
  `🔴 لديك إشعارات جديدة — سجّل الدخول لعرضها`.
- No data is deleted and RLS is not disabled.

## Deployment
- Applied Supabase migration: `separate_order_and_notification_channels`.
- Deployed `telegram-user-notify` with strict user-event routing.
- `telegram-order-notify` source prefers `TELEGRAM_ORDERS_BOT_TOKEN` and falls back to `TELEGRAM_BOT_TOKEN`.
