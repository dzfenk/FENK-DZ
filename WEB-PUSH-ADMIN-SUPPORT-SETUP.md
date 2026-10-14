# FENK Web Push — Admin Support Messages

This patch keeps the existing Web Push system and adds one missing link:
customer Support messages now create an unread `order_notifications` row for every FENK admin. The existing `send-web-push` Database Webhook then sends that notification to the admin's Android device.

## Flow

Customer message → `support_messages` → admin `order_notifications` (`notification_type=support_message`) → `send-web-push` → Android notification.

Tapping the notification opens FENK directly on the Messages screen.

## Required Supabase setup

The existing Database Webhook must remain configured:

- Table: `public.order_notifications`
- Event: `INSERT`
- URL: `https://wqfnzahjwlukncxlxdkp.supabase.co/functions/v1/send-web-push`
- Header: `Content-Type: application/json`
- Header: `x-fenk-webhook-secret: <same FENK_PUSH_WEBHOOK_SECRET>`

Existing Edge Function secrets remain required:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `FENK_PUSH_WEBHOOK_SECRET`
- `FENK_SITE_URL=https://dzfenk.github.io/FENK-DZ/`

No RLS is disabled and no existing data is deleted.
