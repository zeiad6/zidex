/* مرحلة تجهيز واجهات البوتات للموقع: تنسخ bot-suite/build إلى public/bot-suite
 * (مصدرها vite أثناء البناء)، وتجعل المرجع مسطّحاً (app.js) لأن النسخة المنسوخة
 * تُخدم من جذر /bot-suite/ — وbuild/app.js هناك غير موجود أصلاً.
 *
 * التشغيل: node scripts/stage-bot-suite.mjs   (idempotent) */
import { existsSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const build = join(root, 'bot-suite', 'build')
const dest = join(root, 'public', 'bot-suite')

if (!existsSync(join(build, 'index.html'))) {
  console.log('stage-bot-suite: bot-suite/build غير مبني — تخطّي (ابنِه بـ npm run build داخل bot-suite)')
  process.exit(0)
}

rmSync(dest, { recursive: true, force: true })
cpSync(build, dest, { recursive: true })

// المرجع المسطّح: النسخة تخدم من /bot-suite/ فتطلب app.js لا build/app.js
const htmlPath = join(dest, 'index.html')
writeFileSync(htmlPath, readFileSync(htmlPath, 'utf8').replace('src="build/app.js"', 'src="app.js"'), 'utf8')
console.log('staged: public/bot-suite (index.html + styles.css + app.js)')

/* قائمة الواجهات المتاحة — مصدرها bot-suite/src/data.ts لا نسخة مكتوبة بيد:
 * صفحة المنتج تربط /bot-suite/#/bot/<sku> فقط لمن له واجهة فعلاً، وإلا يرسل
 * الرابط الزائر إلى المعرض بصمت (واجهة غير موجودة = رابط مكسور).
 * الملف مُولّد ومُلتزم مثل public/bot-suite نفسها، فتراه tsc قبل vite build. */
const DATA = join(root, 'bot-suite', 'src', 'data.ts')
if (existsSync(DATA)) {
  const skus = [...readFileSync(DATA, 'utf8').matchAll(/sku:\s*'([^']+)'/g)].map((m) => m[1])
  if (skus.length) {
    const target = join(root, 'src', 'data', 'botInterfaces.ts')
    const body =
      '/** مولّد من bot-suite/src/data.ts عبر scripts/stage-bot-suite.mjs — لا تعدّله يدوياً.\n' +
      ' *  كل بوت معروض للبيع له واجهة رسومية على /bot-suite/ — القائمة هنا بوّابتها. */\n' +
      `export const BOT_INTERFACE_SKUS: readonly string[] = [${skus.map((s) => `'${s}'`).join(', ')}]\n\n` +
      '/** هل لهذا الـSKU واجهة رسومية على /bot-suite/؟ */\n' +
      'export const hasBotInterface = (sku: string): boolean => BOT_INTERFACE_SKUS.includes(sku)\n'
    if (!existsSync(target) || readFileSync(target, 'utf8') !== body) writeFileSync(target, body, 'utf8')
    console.log(`staged: src/data/botInterfaces.ts (${skus.length} interface(s))`)
  }
}
