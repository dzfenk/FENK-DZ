import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function verifyTelegram(data, botToken) {
  const receivedHash = String(data?.hash || '');
  if (!receivedHash || !botToken) return { ok: false, reason: 'INVALID_CONFIG' };
  const pairs = Object.entries(data).filter(([k,v]) => k !== 'hash' && v !== undefined && v !== null).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`);
  const checkString = pairs.join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
  const ok = receivedHash.length === expected.length && crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expected));
  if (!ok) return { ok: false, reason: 'INVALID_HASH' };
  const authDate = Number(data.auth_date || 0);
  if (!authDate || Math.floor(Date.now()/1000) - authDate > 86400) return { ok: false, reason: 'EXPIRED' };
  return { ok: true };
}

async function tableExists(supabase, table) {
  const { error } = await supabase.from(table).select('*').limit(1);
  return !error || !/relation .* does not exist|Could not find the table/i.test(error.message || '');
}

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });
  try {
    const data = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const allowedId = String(process.env.TELEGRAM_ADMIN_ID || '');
    if (!botToken || !allowedId) return json(500, { error: 'TELEGRAM_SERVER_NOT_CONFIGURED' });
    const check = verifyTelegram(data, botToken);
    if (!check.ok) return json(401, { error: check.reason });
    if (String(data.id) !== allowedId) return json(403, { error: 'TELEGRAM_NOT_AUTHORIZED' });

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return json(500, { error: 'SUPABASE_SERVER_NOT_CONFIGURED' });
    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const internalEmail = `telegram.${allowedId}@admin.fenk.local`;
    let user = null;
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (list.error) throw list.error;
    user = (list.data.users || []).find(u => String(u.user_metadata?.telegram_id || '') === allowedId || u.email === internalEmail) || null;
    if (!user) {
      const created = await admin.auth.admin.createUser({ email: internalEmail, password: crypto.randomBytes(32).toString('base64url'), email_confirm: true, user_metadata: { telegram_id: allowedId, first_name: data.first_name || '', last_name: data.last_name || '', username: data.username || '' } });
      if (created.error) throw created.error;
      user = created.data.user;
    } else {
      const upd = await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...(user.user_metadata || {}), telegram_id: allowedId, first_name: data.first_name || user.user_metadata?.first_name || '', last_name: data.last_name || user.user_metadata?.last_name || '', username: data.username || user.user_metadata?.username || '' } });
      if (upd.error) throw upd.error;
    }

    let adminTable = null;
    for (const table of ['admins','admin_users']) {
      const exists = await tableExists(admin, table);
      if (!exists) continue;
      const column = table === 'admins' ? 'user_id' : 'user_id';
      const { error } = await admin.from(table).upsert({ [column]: user.id }, { onConflict: column });
      if (!error) { adminTable = table; break; }
    }
    if (!adminTable) return json(500, { error: 'ADMIN_TABLE_NOT_CONFIGURED' });

    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: internalEmail, options: { redirectTo: `${process.env.SITE_URL || ''}/admin.html` } });
    if (link.error) throw link.error;
    return json(200, { ok: true, action_link: link.data?.properties?.action_link || link.data?.action_link || null });
  } catch (error) {
    console.error('telegram-admin-login', error);
    return json(500, { error: error?.message || 'SERVER_ERROR' });
  }
};
