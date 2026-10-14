# FENK AI — Supabase Edge Function

FENK AI now calls the Supabase Edge Function:
`https://wqfnzahjwlukncxlxdkp.supabase.co/functions/v1/fenk-ai`

The OpenAI API key is NOT stored in GitHub Pages.

## Required secret
In Supabase Dashboard → Edge Functions → Secrets, add:

`OPENAI_API_KEY`

Optional:
`FENK_AI_MODEL=gpt-5.6-luna`

The Edge Function `fenk-ai` is already deployed and requires an authenticated FENK user session.
