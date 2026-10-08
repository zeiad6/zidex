#!/usr/bin/env node
/**
 * ZeidexSoft WhatsApp Account Bot
 * 
 * تشغيل بوت ذكي على حساب واتساب الخاص بك (شخصي أو تجاري)
 * يدعم الربط السريع عبر كود الاقتران (Pairing Code) أو رمز QR.
 * 
 * للتشغيل:
 *   node scripts/wa-account-bot.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Load Store Catalog & Apps
const catalogPath = join(rootDir, 'public', 'store', 'catalog.json')
const appsPath = join(rootDir, 'public', 'store', 'apps.json')

let catalog = { bot: 'ZeidexStoreBot', products: [] }
let apps = []

try {
  if (existsSync(catalogPath)) catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
  if (existsSync(appsPath)) apps = JSON.parse(readFileSync(appsPath, 'utf8')).apps ?? []
} catch (e) {
  console.warn('⚠️ تعذر قراءة بيانات الكتالوج بالكامل:', e.message)
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  🤖 بوت واتساب ZeidexSoft — ربط الحساب الشخصي/التجاري')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

async function checkOrInstallBaileys() {
  try {
    await import('@whiskeysockets/baileys')
    return true
  } catch {
    console.log('📦 جاري التحقق من مكتبة الربط المباشر لواتساب (@whiskeysockets/baileys)...')
    console.log('لتثبيت حزمة الربط المباشر شغّل الأمر التالي:\n')
    console.log('  npm install @whiskeysockets/baileys pino qrcode-terminal\n')
    return false
  }
}

async function startBot() {
  const installed = await checkOrInstallBaileys()
  if (!installed) {
    console.log('ℹ️ بعد تثبيت الحزم، أعد تشغيل هذا السكريبت لبدء الربط برقم هاتفك فوراً.')
    return
  }

  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
  } = await import('@whiskeysockets/baileys')
  const pino = (await import('pino')).default

  const authDir = join(rootDir, '.wa-session')
  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const { version } = await fetchLatestBaileysVersion()

  const logger = pino({ level: 'silent' })

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ['ZeidexSoft Bot', 'Chrome', '120.0.0'],
    generateHighQualityLinkPreview: true,
  })

  sock.ev.on('creds.update', saveCreds)

  // Pairing code flow for phone number
  if (!sock.authState.creds.registered) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const askPhone = () =>
      new Promise((resolve) => {
        rl.question('📱 أدخل رقم واتساب الخاص بك مع مفتاح الدولة (مثال: 967771234567): ', (answer) => {
          resolve(answer.trim().replace(/[^0-9]/g, ''))
        })
      })

    const phoneNumber = await askPhone()
    rl.close()

    if (phoneNumber) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(phoneNumber)
          console.log('\n🔑 ══════════════════════════════════════════════════')
          console.log(`  كود ربط واتساب الخاص بك:  [  ${code?.match(/.{1,4}/g)?.join('-') || code}  ]`)
          console.log('════════════════════════════════════════════════════')
          console.log('1. افتح واتساب في هاتفك')
          console.log('2. الإعدادات > الأجهزة المرتبطة > ربط جهاز')
          console.log('3. اختر "الربط باستخدام رقم الهاتف" وأدخل هذا الكود أعلاه\n')
        } catch (err) {
          console.error('❌ تعذر استخراج كود الاقتران:', err.message)
        }
      }, 3000)
    }
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr && !sock.authState.creds.registered) {
      console.log('📷 أو امسح رمز الـ QR التالي من واتساب:')
      import('qrcode-terminal').then(({ default: qrcode }) => {
        qrcode.generate(qr, { small: true })
      }).catch(() => {})
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('⚠️ انقطع الاتصال، إعادة المحاولة...', shouldReconnect ? 'نعم' : 'تم تسجيل الخروج')
      if (shouldReconnect) startBot()
    } else if (connection === 'open') {
      console.log('✅ تم الاتصال بحساب واتساب بنجاح!')
      console.log('🤖 البوت الآن نشط وجاهز للرد التلقائي على الرسائل والاستفسارات.\n')
    }
  })

  // Handle incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue

      const from = msg.key.remoteJid
      if (!from || from.includes('@g.us')) continue // Ignore group messages by default

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ''
      const clean = text.trim().toLowerCase()

      // Build interactive / automated response
      const botUrl = catalog?.bot ? `https://t.me/${catalog.bot}` : 'https://zeidexsoft.com'

      if (clean === '1' || clean.includes('منتج') || clean.includes('متجر') || clean.includes('شراء') || clean.includes('أسعار') || clean.includes('اسعار')) {
        const topProducts = catalog.products.slice(0, 8).map((p, idx) => `${idx + 1}️⃣ *${p.title}*\n   ⭐️ ${p.stars} نجمة ($${p.usd})\n`).join('\n')
        const reply = 
          `🛍 *قائمة منتجات وبوتات ZeidexSoft:*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
          topProducts +
          `\n🌐 تصفح المتجر بالكامل: https://zeidexsoft.com/store/\n` +
          `🤖 للشراء والتسليم الفوري: ${botUrl}\n\n` +
          `أرسل *0* للعودة للقائمة الرئيسية.`
        await sock.sendMessage(from, { text: reply })
      } else if (clean === '2' || clean.includes('تطبيق') || clean.includes('برامج') || clean.includes('مجاني')) {
        const appList = apps.map((a) => `▫️ *${a.name}* (v${a.version})\n   📥 ${a.downloads?.[0]?.href ?? 'https://zeidexsoft.com/programs'}`).join('\n\n')
        const reply =
          `📱 *تطبيقات وبرمجيات ZeidexSoft المجانية:*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
          appList +
          `\n\n🎁 إنشاء بوت متجر خاص بك مجاناً:\n${botUrl}?start=freebot\n\n` +
          `أرسل *0* للعودة للقائمة الرئيسية.`
        await sock.sendMessage(from, { text: reply })
      } else if (clean === '3' || clean.includes('تواصل') || clean.includes('دعم') || clean.includes('ادمن') || clean.includes('أدمن')) {
        const reply =
          `💬 *خدمة العملاء والدعم الفني*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `يسعدنا تواصلك معنا دائماً! يمكنك ترك استفسارك هنا وسيقوم المطور بالرد عليك قريباً.\n\n` +
          `⚡️ للردود التلقائية والفورية، تفضل بمراسلتنا على تيليجرام:\n${botUrl}`
        await sock.sendMessage(from, { text: reply })
      } else {
        // Main Menu
        const menu =
          `أهلاً بك في *ZeidexSoft* 👋\n━━━━━━━━━━━━━━━━━━━━━\n` +
          `منصة تطوير البوتات والحلول البرمجية الذكية.\n\n` +
          `اختر أحد الخيارات بإرسال رقمه:\n` +
          `1️⃣ استعراض منتجات وبوتات المتجر 🛍\n` +
          `2️⃣ تحميل التطبيقات والبرامج المجانية 🎁\n` +
          `3️⃣ التواصل مع الإدارة والدعم الفني 💬\n\n` +
          `أو تفضل بزيارة موقعنا: https://zeidexsoft.com`
        await sock.sendMessage(from, { text: menu })
      }
    }
  })
}

startBot().catch((err) => {
  console.error('❌ خطأ أثناء تشغيل البوت:', err)
})
