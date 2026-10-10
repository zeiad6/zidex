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
