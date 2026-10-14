import { createClient } from 'npm:@supabase/supabase-js@2'

const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || ''
const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || ''
const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || ''
const GRAPH_VERSION = Deno.env.get('WHATSAPP_GRAPH_VERSION') || 'v27.0'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SECRET = (() => {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (raw) { try { return JSON.parse(raw).default } catch {} }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
})()
const db = createClient(SUPABASE_URL, SUPABASE_SECRET)

const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors })
}

function normalizeDzPhone(phone: string) {
  let p = String(phone || '').replace(/\D/g, '')
  if (p.startsWith('00')) p = p.slice(2)
  if (p.startsWith('0')) p = '213' + p.slice(1)
  return p
}

function menuText() {
  return `مرحبًا بك في FENK 🇩🇿🦊\n\nأنا مساعد FENK على WhatsApp. اختر ما تحتاجه:\n\n🎮 شحن الألعاب\n🛒 طلب منتج من رابط\n📦 متابعة طلبي\n💳 الدفع عبر بريد موب\n👨‍💼 التحدث مع موظف\n\nاكتب رقم الخيار أو اشرح لي طلبك.`
}

function replyFor(text: string) {
  const t = text.toLowerCase().trim()
  if (!t || /^(مرحبا|السلام|سلام|اهلا|أهلا|hello|hi|menu|start)$/.test(t)) return menuText()
  if (/^(1|لعبة|العاب|ألعاب|شحن|pubg|ببجي|free fire|فري فاير|efootball|اي فوتبول|efootball|roblox|روبلوكس|steam|ستيم)/i.test(t)) {
    return `🎮 شحن الألعاب في FENK\n\nالمتوفر يشمل PUBG Mobile وFree Fire وeFootball وRoblox وSteam وPlayStation وXbox وألعابًا أخرى.\n\nاكتب اسم اللعبة والكمية التي تريدها، وسأوجهك للخطوة التالية.`
  }
  if (/^(2|طلب|منتج|رابط|شراء|ali|aliexpress|amazon|temu|shein)/i.test(t) || /https?:\/\//.test(t)) {
    return `🛒 لطلب منتج:\nأرسل رابط المنتج هنا، وسأساعدك في تسجيل الطلب وحساب السعر التقديري بالدج.\n\nإذا لم يكن لديك رابط، يمكنك وصف المنتج أو إرسال صورة له.`
  }
  if (/^(3|طلبى|طلبي|متابعة|تتبع|tracking|order)/i.test(t) || /#\d+/.test(t)) {
    return `📦 لمتابعة طلبك أرسل رقم الطلب، مثل: #12345\n\nوسأبحث عن حالته إذا كان مرتبطًا ببيانات FENK.`
  }
  if (/^(4|دفع|بريد موب|barid|baridimob|ccp)/i.test(t)) {
    return `💳 الدفع في FENK يتم محليًا عبر بريد موب.\n\nبعد تأكيد السعر، سنعطيك تعليمات الدفع المناسبة ونطلب إثبات الدفع عند الحاجة.`
  }
  if (/^(5|موظف|انسان|إنسان|مساعدة|support|agent)/i.test(t)) {
    return `👨‍💼 حاضر. سأحوّل طلبك لفريق FENK.\n\nاكتب باختصار المشكلة أو الطلب الذي تريد مساعدة فيه.`
  }
  return `فهمت رسالتك 👍\n\nيمكنني مساعدتك في:\n🎮 شحن الألعاب\n🛒 طلب منتج\n📦 متابعة طلب\n💳 الدفع عبر بريد موب\n👨‍💼 التواصل مع موظف\n\nاكتب ما تحتاجه مباشرة.`
}

async function sendWhatsApp(to: string, body: string) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) throw new Error('WhatsApp secrets are not configured')
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { preview_url: false, body } })
  })
  if (!res.ok) throw new Error(`WhatsApp send failed: ${res.status} ${await res.text()}`)
}

Deno.serve(async (req) => {
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) return new Response(challenge, { status: 200 })
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  try {
    const payload = await req.json()
    const entries = payload?.entry || []
    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        const value = change?.value
        for (const message of value?.messages || []) {
          const from = normalizeDzPhone(message?.from || '')
          const text = message?.text?.body || ''
          if (!from) continue

          await db.from('whatsapp_messages').insert({
            wa_message_id: message?.id || null,
            phone: from,
            direction: 'inbound',
            message_type: message?.type || 'unknown',
            body: text,
            raw_payload: message
          })

          const answer = replyFor(text)
          await sendWhatsApp(from, answer)

          await db.from('whatsapp_messages').insert({
            wa_message_id: null,
            phone: from,
            direction: 'outbound',
            message_type: 'text',
            body: answer,
            raw_payload: { reply_to: message?.id || null }
          })
        }
      }
    }
    return json({ ok: true })
  } catch (error) {
    console.error(error)
    return json({ ok: false, error: error instanceof Error ? error.message : 'Webhook error' }, 500)
  }
})
