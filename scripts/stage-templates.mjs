/* مرحلة تجهيز القوالب للموقع: تنسخ مخرجات store-sites/<slug>/build إلى
 * public/templates/<slug> (مصدرها vite أثناء البناء)، ثم تخصّص نسخة العرض
 * فقط: تضع حساب بوت المنصة في config حتى يعمل زر «اطلب عبر تيليجرام» في
 * التجربة الحية فعلاً.
 *
 * لماذا لا في المصدر: مشتري القالب يستلم الكود ويضع حساب متجره هو — نسخة
 * العرض Demonstrancy يجب أن تواصل بوت المنصة لا حساب المشتري.
 *
 * التشغيل: node scripts/stage-templates.mjs   (idempotent)
 */
import { existsSync, readFileSync, writeFileSync, cpSync, rmSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const SRC = join(root, 'store-sites')
const OUT = join(root, 'public/templates')

/** بوت المتجر على المنصة — مصدره كتالوج المتجر نفسه، بلا قيمة مكتوبة بيد. */
const catalog = JSON.parse(readFileSync(join(root, 'public/store/catalog.json'), 'utf8'))
const bot = String(catalog.bot ?? '').replace(/^@/, '')
if (!bot) {
  console.error('stage-templates: لا اسم بوت في catalog.json — تخطّي التخصيص')
  process.exit(0)
}

if (!existsSync(SRC)) {
  console.log('stage-templates: store-sites/ غير موجود — لا قوالب لتجهيزها')
  process.exit(0)
}

let staged = 0
for (const slug of readdirSync(SRC)) {
  const build = join(SRC, slug, 'build')
  if (!existsSync(join(build, 'index.html'))) continue
  const dest = join(OUT, slug)
  rmSync(dest, { recursive: true, force: true })
  cpSync(build, dest, { recursive: true })

  // المرجع المسطّح: نسخة العرض تخدم من جذر /templates/<slug>/ فتطلب app.js
  // لا build/app.js (الذي يعيد HTML من fallback الـSPA فلا تعمل الواجهة أبداً)
  {
    const htmlPath = join(dest, 'index.html')
    const html = readFileSync(htmlPath, 'utf8').replace('src="build/app.js"', 'src="app.js"')
    writeFileSync(htmlPath, html, 'utf8')
  }

  // تخصيص نسخة العرض: الاسم الفارغ → بوت المنصة (telegram فقط؛ واتساب يحتاج رقماً
  // دولياً وليس wa.me/qr، فيبقى فارغاً وتعرض الواجهة تنبيه العرض)
  const cfg = join(dest, 'config.js')
  if (existsSync(cfg)) {
    let js = readFileSync(cfg, 'utf8')
    js = js.replace(/(telegram:\s*)''/, `$1'${bot}'`)
    writeFileSync(cfg, js, 'utf8')
  }
  staged += 1
  console.log(`  ✓ ${slug} → public/templates/${slug} (telegram = @${bot})`)
}
console.log(`staged ${staged} template demo(s)`)
