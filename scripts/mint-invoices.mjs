/* سكّ روابط فواتير Stars للمنتجات التي بلا رابط — عبر Bot API لا بيد المُطوّر.
 *
 * لماذا: كتالوج المتجر يشترط رابط تيليجرام قابلاً لإعادة الاستخدام لكل منتج
 * قابل للبيع، والبوت يتعرف على الفاتورة بحمولتها `t<botId>:<itemId>`. أي رابط
 * مُخترع بشكل صحيح الشكل يمرّ في الفحص ويفشل عند الدفع — فالسكّ يكون من
 * createInvoiceLink نفسه. التوكن يُقرأ من البيئة أو من .dev.vars المُستثنى
 * من git، ولا يُطبع ولا يُكتب في أي مخرجات.
 *
 * التشغيل: node scripts/mint-invoices.mjs   (idempotent: يتجاهل من له رابط)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

function readToken() {
  if (process.env.BOT_TOKEN) return process.env.BOT_TOKEN.trim()
  const vars = resolve(root, '.dev.vars')
  if (!existsSync(vars)) return ''
  const line = readFileSync(vars, 'utf8').split('\n').find((l) => /^BOT_TOKEN=/.test(l)) ?? ''
  return line.replace(/^BOT_TOKEN=/, '').replace(/^["']|["']$/g, '').trim()
}

const token = readToken()
if (!token) {
  console.error('BOT_TOKEN غير متاح — لا يمكن سكّ الروابط')
  process.exit(1)
}

const catalog = JSON.parse(readFileSync(resolve(root, 'public/store/catalog.json'), 'utf8'))
const payload = JSON.parse(readFileSync(resolve(root, 'payload.json'), 'utf8'))
const botId = String(payload.id)

const pending = catalog.products.filter((p) => !p.soon && !p.invoice)
if (!pending.length) {
  console.log('كل المنتجات القابلة للبيع لها روابط فواتير — لا شيء لسكّه')
  process.exit(0)
}

const itemId = (sku) => payload.items?.find((i) => i.sku === sku)?.id
let minted = 0

for (const p of pending) {
  const id = itemId(p.sku)
  if (!id) {
    console.error(`${p.sku}: لا يوجد في payload.json — شغّل scripts/generate-payload.mjs أولاً`)
    process.exit(1)
  }
  const body = {
    title: p.title_en || p.title,
    description: (p.description_en || p.description).slice(0, 255),
    payload: `t${botId}:${id}`,
    currency: 'XTR',
    prices: [{ label: p.title, amount: p.stars }],
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.ok) {
    console.error(`${p.sku}: رفض تيليجرام — ${json.description ?? res.status}`)
    process.exit(1)
  }
  if (!/^https:\/\/t\.me\/\$[A-Za-z0-9_-]{16,64}$/.test(json.result)) {
    console.error(`${p.sku}: شكل غير متوقع — ${json.result}`)
    process.exit(1)
  }
  p.invoice = json.result
  // الحارس ضد انزلاق المعرّفات: أي إعادة ترتيب للكتالوج تُغيّر id العنصر،
  // فتصبح الفاتورة المسكوكة تشتري منتجاً آخر. نثبّت المعرّف بجانب الرابط
  // وتفحصه الاختبارات بعد كل توليد payload.
  p.invoice_item = id
  minted += 1
  console.log(`  ✓ ${p.sku} → فاتورة ${p.stars} نجمة (payload t${botId}:${id})`)
}

writeFileSync(resolve(root, 'public/store/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
console.log(`sukked ${minted} invoice links → public/store/catalog.json`)
