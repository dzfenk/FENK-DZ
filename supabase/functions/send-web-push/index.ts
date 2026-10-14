import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("FENK_PUSH_WEBHOOK_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-fenk-webhook-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!WEBHOOK_SECRET || req.headers.get("x-fenk-webhook-secret") !== WEBHOOK_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !SERVICE_ROLE) {
    return json({ error: "Web Push secrets are not configured" }, 503);
  }

  try {
    webpush.setVapidDetails("mailto:admin@fenk-dz.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    const payload = await req.json();
    const record = payload?.record || payload?.new || {};
    const userId = record.recipient_user_id;
    if (!userId) return json({ ok: true, sent: 0, reason: "no recipient" });

    const { data: subscriptions, error } = await admin
      .from("web_push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", userId);
    if (error) throw error;

    const title = String(record.title || "إشعار جديد من FENK");
    const body = String(record.message || "لديك تحديث جديد في FENK");
    const notificationId = String(record.id || "");
    const orderId = String(record.order_id || "");
    const notificationType = String(record.notification_type || "");
    const baseUrl = Deno.env.get("FENK_SITE_URL") || "https://dzfenk.github.io/FENK-DZ/";
    const url = notificationType === "support_message"
      ? `${baseUrl}?messages=1`
      : `${baseUrl}${orderId ? `?notification=${encodeURIComponent(notificationId)}&order=${encodeURIComponent(orderId)}` : `?notification=${encodeURIComponent(notificationId)}`}`;
    const message = JSON.stringify({
      title,
      body,
      icon: `${baseUrl}assets/logo-clean.webp`,
      badge: `${baseUrl}assets/logo-clean.webp`,
      tag: `fenk-${notificationType || "notification"}-${notificationId || Date.now()}`,
      renotify: true,
      data: { url, notificationId, orderId, notificationType }
    });

    let sent = 0;
    const stale: string[] = [];
    for (const sub of subscriptions || []) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, message, { TTL: 86400, urgency: "high" });
        sent++;
      } catch (err) {
        const status = Number((err as { statusCode?: number })?.statusCode || 0);
        if (status === 404 || status === 410) stale.push(sub.id);
        console.warn("push delivery failed", status, sub.endpoint);
      }
    }
    if (stale.length) await admin.from("web_push_subscriptions").delete().in("id", stale);
    return json({ ok: true, sent, removed: stale.length });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Push delivery failed" }, 500);
  }
});
