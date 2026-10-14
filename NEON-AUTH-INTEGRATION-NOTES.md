# FENK Neon Auth Integration — Stage 1

This package adds an email/password registration and login panel that calls the deployed FastAPI service at `https://fenk-python-backend.onrender.com`:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

The Neon API token is held in `sessionStorage` (cleared when the browser tab session ends). The UI reports API errors and keeps the existing FENK design and Google/Telegram login controls intact.

## Important migration boundary

This is an authentication integration stage, **not a completed migration of the whole site away from Supabase**. The current site uses Supabase Auth user IDs and Supabase access tokens for protected database operations, orders, messages, notifications, storage, and edge functions. A Neon token cannot authorize those Supabase operations. Therefore this stage does not replace the existing Supabase session, does not delete Supabase configuration, and does not move existing user/order data. Do not remove Supabase until equivalent API endpoints, authorization, data migration, storage handling, and regression tests are completed.

## Deploy

Upload the changed `index.html`, new `fenk-neon-auth.js`, and this note to a staging branch/site first. Test registration with a new test email/phone and test login. Do not test with real customer accounts until a migration plan for existing identities is implemented.

## API assumptions

Registration request fields: `email`, `password`, `first_name`, `last_name`, `phone`.
Login request fields: `email`, `password`.
Login response must contain `access_token` (or `accessToken`/`token`). If the API response shape changes, adjust `saveSession` to match it.
