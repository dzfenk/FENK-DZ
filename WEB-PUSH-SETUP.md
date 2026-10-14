# FENK V73 — Web Push setup

V73 adds a Service Worker, browser Push subscription storage, and a Supabase Edge Function named `send-web-push`.

## 1) Supabase Secrets

In Supabase → Edge Functions → Secrets, add these values:

- `VAPID_PUBLIC_KEY` = the public VAPID key already configured for this release
- `VAPID_PRIVATE_KEY` = the private VAPID key already configured in Supabase
- `FENK_PUSH_WEBHOOK_SECRET` = the webhook secret already configured in Supabase
- `FENK_SITE_URL` = `https://dzfenk.github.io/FENK-DZ/`

Do NOT put `VAPID_PRIVATE_KEY` in GitHub or browser JavaScript.

## 2) Database Webhook

Create a Database Webhook for:

- Table: `public.order_notifications`
- Event: `INSERT`
- Method: `POST`
- URL: `https://wqfnzahjwlukncxlxdkp.supabase.co/functions/v1/send-web-push`
- Header: `Content-Type: application/json`
- Header: `x-fenk-webhook-secret: <your FENK_PUSH_WEBHOOK_SECRET>`

The webhook payload contains the inserted notification row under `record`.

## 3) Deploy the frontend

Upload V73 to the GitHub Pages repository. Keep only the ZIP selected by the current deployment workflow, or replace the old ZIP rather than adding several ZIP files.

The root `sw.js` must be published at:

`https://dzfenk.github.io/FENK-DZ/sw.js`

## 4) Test on Android Chrome

1. Sign in to FENK.
2. Open Settings.
3. Turn on FENK notifications.
4. Accept the browser notification permission.
5. Confirm a row appears in `web_push_subscriptions`.
6. Create an `order_notifications` row for that user (or have an admin action create one).
7. Close/minimize the FENK tab.
8. The Android notification should appear.
9. Tapping it opens FENK and routes to the related order when `order_id` exists.

The Push API requires HTTPS and an active Service Worker. Subscription should be requested from a user action such as the Settings toggle.

### V73 public VAPID key

`BCbZy-gZlKkLKtt3lk2TDqb-2Bfqb-yOkaci6iqgYHg5cWYJ1NRfWvkrZpxlQSZhh2mCN5yVOxCH3I-lbEVTF8g`
