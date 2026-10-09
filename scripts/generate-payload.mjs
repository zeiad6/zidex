// Regenerates payload.json — the platform bot's KV record (tb:<id>) — so it can be
// pushed to KV with `npx wrangler kv:key put --binding=DOWNLOADS "tb:<id>" --path=payload.json`
// (that is what deploy-primary.sh does).
//
// The webhook secret MUST be derived exactly like worker/bots.ts webhookSecret():
//   HMAC-SHA256(BOTS_KEY, `tg:<botId>`), base64, [A-Za-z0-9] only, first 48 chars.
// The previous version signed `hook:<id>` and sliced 42 chars — Telegram then sent
// updates with a secret the Worker never accepts, and the bot went silently dead.
import { readFileSync, writeFileSync } from 'node:fs'
import { BOT_ID, BOT_TOKEN, BOTS_KEY, OWNER_ID, sealToken, webhookSecret } from './bot-secrets.mjs'

const secret = await webhookSecret(BOTS_KEY, BOT_ID)
const sealedToken = await sealToken(BOTS_KEY, BOT_TOKEN)

const catalog = JSON.parse(readFileSync('public/store/catalog.json', 'utf8'))

// The storefront sells the WHOLE catalog, not just the three store-bot plans. Each catalog
// category becomes a browsable section so the menu can deep-link into it, and every product
// carries its feature list, USD price, demo and post-purchase steps into the bot.
const CATEGORY_SECTIONS = {
  bots: { id: 1, name: '🤖 بوتات ومتاجر رقمية' },
  types: { id: 2, name: '🧩 بوتات متخصصة وأنظمة أتمتة' },
  channel: { id: 3, name: '📣 خدمات القنوات والتسويق' },
  sites: { id: 4, name: '🌐 قوالب المتاجر الجاهزة' },
}
// Stable order: sections follow this list; items follow the catalog order within each.
const products = [...catalog.products].sort((a, b) => {
  const sa = CATEGORY_SECTIONS[a.category]?.id ?? 99
  const sb = CATEGORY_SECTIONS[b.category]?.id ?? 99
  return sa - sb || 0
})

const items = products.map((p, idx) => {
  const section = CATEGORY_SECTIONS[p.category]
  return {
    id: idx + 1,
    title: p.title,
    stars: p.stars,
    desc: p.description,
    // The catalog's SKU rides on the item: the storefront's "اطلب الآن" button opens
    // t.me/<bot>?start=buy_<sku>, and itemBySku() matches by the item's own sku first.
    // Its title fallback cannot save a record without one — the titles are Arabic and
    // norm() never folds an Arabic title into a Latin sku — so without this carry
    // every storefront buy deep link landed on the bare welcome, losing the tap.
    ...(typeof p.sku === 'string' && p.sku ? { sku: p.sku } : {}),
    ...(section ? { section: section.id } : {}),
    // Carry the catalog's richer detail so the bot shows a product card (features + USD price +
    // post-purchase steps) before the invoice, instead of a bare Stars checkout.
    ...(Array.isArray(p.features) && p.features.length ? { features: p.features } : {}),
    ...(typeof p.usd === 'number' && p.usd > 0 ? { usd: p.usd } : {}),
    ...(typeof p.demo === 'string' && p.demo ? { demo: p.demo } : {}),
    ...(Array.isArray(p.after) && p.after.length ? { after: p.after } : {}),
  }
})

const sections = Object.values(CATEGORY_SECTIONS).map(({ id, name }) => ({ id, name }))

const faqs = [
  { q: 'ما هي طرق الدفع المتاحة؟', a: 'الدفع بنجوم تيليجرام (Telegram Stars) مباشرة، أو عبر بنك الكريمي (USD/YER/SAR) ومحافظ العملات الرقمية TON/USDT عبر المتجر.' },
  { q: 'كيف أستلم البوت بعد الدفع؟', a: 'يتم تسليمك البوت كاملاً مع لوحة التحكم وشرح كافة الأوامر والمفاتيح فور إتمام الطلب.' },
  { q: 'هل يمكنني تجربة بوت متجر مجاناً؟', a: 'نعم! أرسل /trial هنا وجرّب الباقة المدفوعة كاملة 7 أيام ببوتك الخاص — بدون خادم وبدون دفع وبدون أي قيود.' },
]

const cfg = {
  id: BOT_ID,
  username: 'deanonimaizer_2hbot_8fml_bot',
  owner: OWNER_ID,
  token: sealedToken,
  secret,
  // Plain text only: /start sends esc(cfg.welcome), so markup here would show literally.
  welcome:
    '✨ أهلاً بك في متجر ومنصة ZeidexSoft 👋\n' +
    '─────────────────────────\n' +
    '🤖 بوتات ومتاجر رقمية تعمل سحابياً 24/7\n' +
    '📱 برمجيات وتطبيقات احترافية لأندرويد وويندوز\n' +
    '🧪 تجربة متجر كامل باسمك 7 أيام\n' +
    '─────────────────────────\n' +
    'اختر ما يناسبك من الأزرار التفاعلية أدناه 👇',
  paused: false,
  items,
  sections,
  faqs,
  users: [OWNER_ID],
  orders: 0,
  stars: 0,
  created: new Date().toISOString(),
  plan: 'paid',
}

writeFileSync('payload.json', JSON.stringify(cfg))
console.log('payload.json written — webhook secret derived with tg: prefix (48 chars), matching worker/bots.ts.')
