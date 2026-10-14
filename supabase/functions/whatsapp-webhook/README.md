# FENK WhatsApp Bot

This Edge Function is the webhook for WhatsApp Cloud API.

## Required Supabase secrets

- `WHATSAPP_VERIFY_TOKEN` — any long random string you choose; use the same value in Meta webhook verification.
- `WHATSAPP_ACCESS_TOKEN` — Meta WhatsApp Cloud API access token.
- `WHATSAPP_PHONE_NUMBER_ID` — the WhatsApp Business phone number ID from Meta.
- `WHATSAPP_GRAPH_VERSION` — optional; defaults to `v27.0`.

Supabase automatically provides `SUPABASE_URL` and secret-key variables to Edge Functions. Keep WhatsApp credentials in Edge Function secrets, never in `index.html` or browser JavaScript.

## Deploy

```bash
supabase db push
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase secrets set WHATSAPP_VERIFY_TOKEN="CHANGE_ME"
supabase secrets set WHATSAPP_ACCESS_TOKEN="META_TOKEN"
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="PHONE_NUMBER_ID"
```

Webhook URL:

`https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook`

Configure this URL and the same verify token in Meta's WhatsApp webhook settings, then subscribe to the `messages` field.
