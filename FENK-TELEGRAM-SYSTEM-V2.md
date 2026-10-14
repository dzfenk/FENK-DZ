# FENK Telegram System V2

## Bot responsibilities
- FENK Notifications: registration, marketplace/ad events, product events, and system/admin notifications only.
- FENK Support: customer support messages only.
- FENK Orders: orders, payment/status workflow, shipping and delivery only.
- **Order isolation:** order events must never be sent to `telegram-user-notify` or the Notifications bot. The user-notify function now rejects non-user table payloads.

## Routing
- telegram-user-notify -> TELEGRAM_NOTIFICATIONS_BOT_TOKEN
- marketplace-telegram-notify -> TELEGRAM_NOTIFICATIONS_BOT_TOKEN
- telegram-support-notify -> TELEGRAM_SUPPORT_BOT_TOKEN
- telegram-order-notify -> `TELEGRAM_ORDERS_BOT_TOKEN` (preferred) or `TELEGRAM_BOT_TOKEN` (backward-compatible fallback)

## Deduplication
All outgoing events use public.telegram_event_dedup through claim_telegram_event / mark_telegram_event_sent / mark_telegram_event_failed.

Keys:
- support:<message_id>
- user_registered:<user_id>
- marketplace:<event>:<ad_id>
- product:new:<product_id>
- order:<order_id>:<status>

No rows or existing data are deleted. RLS remains enabled.

## Display
- Algeria timezone: Africa/Algiers (UTC+1)
- UUIDs are compacted in Telegram messages to avoid RTL layout damage.
- Order ID uses the stable order_number/order_code.
- Support keeps one reply button per incoming customer message.

## Android Web Push bridge
- Customer Support messages create an unread admin `order_notifications` row with `notification_type=support_message`.
- The existing `send-web-push` webhook delivers it to the admin's subscribed Android device.
- Tapping the Android notification opens the FENK Messages screen.
- This is additive and does not replace Telegram Support notifications.
