/**
 * Post bodies live here, apart from the index.
 *
 * The blog index only needs title, excerpt, date, category and reading time,
 * so shipping every article's full text in the entry bundle wasted ~90 kB on
 * first paint. This module is imported dynamically by the post page, so a
 * visitor only downloads the text of the article they actually open.
 */
import type { Block } from './posts'
import { getProgram, primaryDownload } from './programs'

/** Injected ahead of the EDMS body so the button always matches programs.ts. */
const edms = getProgram('edms-archive-pro')!
const edmsFile = primaryDownload(edms)
const edmsDownload: Block = {
  type: 'download',
  href: edmsFile.href,
  label: `أرشيف برو ${edms.version} — ${edms.platform}`,
  meta: `${edmsFile.file} · ${edmsFile.size} · ${edmsFile.host}`,
}

const yusrProg = getProgram('yusr')!
const yusrPrimary = primaryDownload(yusrProg)
const yusrDownload: Block = {
  type: 'download',
  href: yusrPrimary.href,
  label: `${yusrProg.name} — ${yusrPrimary.file}`,
  meta: `${yusrPrimary.file} · ${yusrPrimary.size} · ${yusrPrimary.host}`,
  also: yusrProg.downloads.slice(1).map((d) => ({
    href: d.href,
    label: `${d.file} (${d.note || d.host})`,
    meta: `${d.file} · ${d.size} · ${d.host}`,
  })),
}

export const localCicdBody: Block[] = [
  {
    type: 'image',
    src: '/img/local-cicd-cover.png',
    fallback: '/img/local-cicd-cover.png',
    alt: 'تشغيل خطوط الأنابيب CI/CD محلياً عبر act و Docker',
    caption: 'دليل شامل لتشغيل واختبار سيرفرات GitHub Actions محلياً في كافة البيئات.',
  },
  {
    type: 'p',
    text: 'كل مطور برمجيات خاض تلك التجربة المزعجة: تعدل سطراً واحداً في الكود أو ملف إعدادات، تدفعه إلى المستودع عبر `git push`، ثم تجلس دقائق طويلة بانتظار تشغيل خوادم GitHub Actions في السحاب لتكتشف في النهاية وجود خطأ تنسيق تافه، أو غياب متغير بيئي، أو فشل حزمة اختبار كان بالإمكان اكتشافها خلال أجزاء من الثانية على جهازك الشخصي.',
  },
  {
    type: 'p',
    text: 'تشغيل خطوط أنابيب التكامل المستمر والتسليم المستمر (CI/CD) **محلياً** ينقل تجربة التطوير إلى مستوى آخر تماماً: تغذية راجعة فورية، انعدام تام لاستهلاك رصيد الدقائق السحابية المجانية، إمكانية التطوير والاختبار دون الحاجة لأي اتصال بالإنترنت (100% Offline-First)، وحماية الأسرار ومفاتيح الـ API من التسريب.',
  },
  {
    type: 'stats',
    items: [
      { value: '0 دقيقة', label: 'استهلاك دقائق سحابية' },
      { value: '< 1 ثانية', label: 'زمن بدء تشغيل الـ Runner' },
      { value: '100%', label: 'مطابقة لمعمارية GitHub' },
      { value: 'Multi-OS', label: 'Linux و Windows و Termux' },
    ],
  },
  {
    type: 'h2',
    id: 'why-local',
    text: 'لماذا تشغيل CI/CD محلياً على جهازك؟',
  },
  {
    type: 'p',
    text: 'الانتقال إلى تشغيل الـ Workflows محلياً لا يقتصر على كونه رفاهية، بل هو معيار احترافي يحل أربع معضلات أساسية يواجهها كل مهندس برمجيات وفرق العمل الحديثة:',
  },
  {
    type: 'ul',
    items: [
      'تقليص حلقة التغذية الراجعة (Feedback Loop) من 5-10 دقائق سحابياً إلى بضع ثوانٍ معدودة محلياً.',
      'حماية الحصة الشهرية للدقائق المجانية (GitHub Actions Free Tier) وتوفير تكاليف الخوادم للفرق والمشاريع الخاصة.',
      'إمكانية تصحيح أخطاء الـ Workflows تفاعلياً والدخول المباشر إلى الحاوية عبر طرفية bash لفحص المشكلة فور وقوعها.',
      'العمل الكامل في وضع عدم الاتصال (Offline) دون الاعتماد على توفر خدمة GitHub أو جودة اتصال الإنترنت.',
    ],
  },
  {
    type: 'h2',
    id: 'how-it-works',
    text: 'كيف يعمل محرك CI/CD المحلي (المعمارية)',
  },
  {
    type: 'image',
    src: '/img/local-cicd-architecture.png',
    fallback: '/img/local-cicd-architecture.png',
    alt: 'معمارية عمل محرك act وربطه بمقبس ديمون دوكر',
    caption: 'المعمارية المتكاملة: من قراءة ملفات YAML وحتى تشغيل الحاوية ومطابقة مسارات العمل.',
  },
  {
    type: 'p',
    text: 'الأداة القياسية الأقوى عالمياً في هذا المجال هي **act** (المطورة من قبل مجتمع nektos المفتوح المصدر). تعتمد فكرة الأداة على قراءة ملفات المسارات الموجودة في مجلد `.github/workflows/*.yml` وتحليل شجرة الاعتمادات (Dependency Graph)، ثم تتصل بمقبس Docker Daemon المحلي لتنفيذ المراحل الآتية:',
  },
  {
    type: 'ol',
    items: [
      'تحديد الـ Runner المطلوب لكل مهمة (مثل ubuntu-latest أو ubuntu-22.04).',
      'سحب أو استخدام صورة الحاوية المطابقة محلياً من سجل CatTheHacker المخصص لمحاكاة بيئة خوادم GitHub الرسمية.',
      'ربط مسار مشروعك الحالي (Workspace Mount) بداخل الحاوية دون الحاجة لإعادة رفع أو نقل الأكواد.',
      'حقن متغيرات البيئة والأسرار من ملفات .env و .secrets المحلية بأمان تام.',
      'تنفيذ كل خطوة (Step) ومراقبة شفرة الخروج (Exit Code) وعرض المخرجات الملونة في الطرفية لحظة بلحظة.',
    ],
  },
  {
    type: 'h2',
    id: 'install-linux',
    text: 'التثبيت على أنظمة Linux (Ubuntu / Debian / Arch)',
  },
  {
    type: 'p',
    text: 'على توزيعات لينكس ستحصل على الأداء الأسرع والأكثر كفاءة بفضل الاتصال المباشر بمقبس Unix Socket ونواة النظام.',
  },
  {
    type: 'p',
    text: 'أولاً: تثبيت محرك Docker Engine الرسمي وتفعيل إمكانية التشغيل دون الحاجة لكلمة مرور root:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `# تثبيت دوكر الرسمي عبر السكريبت الآلي المعتمد:
curl -fsSL https://get.docker.com | sh

# إضافة المستخدم الحالي لمجموعة دوكر لتفادي مشاكل الأذونات:
sudo usermod -aG docker $USER
newgrp docker

# تفعيل وتشغيل خدمة دوكر في خلفية النظام:
sudo systemctl enable --now docker`,
  },
  {
    type: 'p',
    text: 'ثانياً: تثبيت أداة act عبر السكريبت المباشر أو مدير الحزم:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `# على أنظمة Ubuntu و Debian و Fedora عبر السكريبت المعتمد:
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# على توزيعة Arch Linux عبر AUR:
yay -S act-cli

# التحقق من نجاح التثبيت وعرض الإصدار:
act --version`,
  },
  {
    type: 'h2',
    id: 'install-windows',
    text: 'التثبيت على نظام Windows (PowerShell و WSL2)',
  },
  {
    type: 'callout',
    tone: 'tip',
    title: 'المسار الموصى به: WSL2 + Docker Desktop',
    items: [
      'تشغيل Docker Desktop مع تفعيل محرك WSL2 يوفر سرعة إدخال/إخراج فائقة وتوافقاً تاماً مع نظام ملفات لينكس.',
      'يمكنك تشغيل act مباشرة داخل نافذة Ubuntu في WSL2 كأنك تعمل على خادم لينكس حقيقي.',
    ],
  },
  {
    type: 'p',
    text: 'إذا كنت تفضل تثبيت act واستخدامه مباشرة من خلال Windows PowerShell أو Windows Terminal (Native Windows)، يمكنك استخدام أحد مديري الحزم الرسميين:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `# الخيار 1: عبر مدير الحزم الافتراضي في ويندوز (winget):
winget install nektos.act

# الخيار 2: عبر Scoop (المفضل لمطوري الأدوات والأوامر):
scoop install act

# الخيار 3: عبر Chocolatey:
choco install act-cli`,
  },
  {
    type: 'p',
    text: 'ملاحظة مهمة لمستخدمي ويندوز: تأكد من تشغيل تطبيق Docker Desktop قبل إطلاق الأداة، وتأكد من تفعيل إعداد «Use the WSL 2 based engine» في إعدادات التطبيق العامة.',
  },
  {
    type: 'h2',
    id: 'install-termux',
    text: 'التشغيل في البيئات المقيدة (Android / Termux / PRoot)',
  },
  {
    type: 'p',
    text: 'في بيئات أندرويد عبر Termux أو بيئات PRoot المعزولة (مثل توزيعات Ubuntu المصغرة على الهواتف الذكية أو بيئات الحوسبة المحمولة)، لا تملك النواة صلاحية تشغيل كيرنل Docker بشكل مباشر لعدم توفر cgroups وصلاحيات root للنواة الأساسية.',
  },
  {
    type: 'p',
    text: 'الحل التقني الصحيح هو ربط act عبر مقبس شبكي (TCP Socket) بخادم Docker يعمل على نفس الشبكة المحلية أو عبر نفق SSH آمن:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `# 1. توجيه مقبس دوكر عبر منفذ TCP محلي:
export DOCKER_HOST="tcp://127.0.0.1:2375"

# 2. في حال كان دوكر يعمل على خادم خارجي أو VPS:
ssh -N -L 2375:/var/run/docker.sock user@remote-vps &
export DOCKER_HOST="tcp://127.0.0.1:2375"

# 3. تثبيت ثنائية act لمعمارية ARM64 داخل Termux أو PRoot:
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | bash -s -- -b /usr/local/bin`,
  },
  {
    type: 'h2',
    id: 'config-actrc',
    text: 'ضبط ملف الإعداد السحري .actrc وصور الحاويات',
  },
  {
    type: 'p',
    text: 'لكي لا تضطر لتحديد الخيارات وصور الحاويات في كل مرة تشغل فيها أمراً، يدعم act ملف إعدادات افتراضي يوضع في مجلدك الرئيسي (~/.actrc) أو في جذر المشروع (.actrc). هذا الملف يمثل التكوين الذهبي الذي يحل 90% من المشاكل مقدماً:',
  },
  {
    type: 'code',
    lang: 'text',
    code: `-P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-latest
-P ubuntu-22.04=ghcr.io/catthehacker/ubuntu:act-22.04
-P ubuntu-20.04=ghcr.io/catthehacker/ubuntu:act-20.04
--container-architecture linux/amd64`,
  },
  {
    type: 'table',
    caption: 'مقارنة خيارات صور المشغل (Runner Images) لأداة act',
    head: ['حجم الصورة', 'اسم الحاوية', 'المزايا والمكتبات', 'الاستخدام الأمثل'],
    rows: [
      ['~200 MB', 'node:slim (Micro)', 'سريعة التحميل وخفيفة جداً', 'المشاريع البسيطة التي تتطلب Node فقط'],
      ['~1.5 GB', 'catthehacker act-latest (Medium)', 'متوازنة وتضم Git, Python, Node, Docker CLI', 'الخيار الموصى به لـ 95% من المشاريع'],
      ['~18 GB', 'catthehacker full (Large)', 'مطابقة تامة لسيرفرات GitHub (Rust, .NET, Android)', 'المشاريع الضخمة التي تبني حزم أندرويد وسطح المكتب'],
    ],
  },
  {
    type: 'h2',
    id: 'daily-usage',
    text: 'أوامر التشغيل اليومية وتمرير الأسرار (.secrets)',
  },
  {
    type: 'image',
    src: '/img/local-cicd-terminal.png',
    fallback: '/img/local-cicd-terminal.png',
    alt: 'طرفية تشغيل act بنجاح واختبار المشاريع',
    caption: 'تنفيذ المهام واختبارها محلياً في ثوانٍ مع نتائج ملونة وشاملة.',
  },
  {
    type: 'p',
    text: 'أهم الأوامر العملية التي ستستخدمها في يومك البرمجي لإجراء الفحوصات قبل كل عملية push:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `# 1. استعراض كافة المسارات والمهام (Jobs) المعرفة في المشروع:
act -l

# 2. تشغيل حدث الـ Push الافتراضي:
act push

# 3. تشغيل مهمة معينة بالاسم (مثلاً وظيفة test فقط توفيراً للوقت):
act -j test

# 4. محاكاة حدث الـ Pull Request لفحص فروع الترقية:
act pull_request

# 5. تشغيل مع تمرير الأسرار والمتغيرات البيئية من ملفات محلية:
act -j test --secret-file .secrets --env-file .env`,
  },
  {
    type: 'callout',
    tone: 'warn',
    title: 'تأمين ملف الأسرار (.secrets)',
    items: [
      'ملف .secrets يحتوي على مفاتيح حساسة مثل GITHUB_TOKEN و DATABASE_URL.',
      'أضف فوراً .secrets و .secrets.* إلى ملف .gitignore لمنع رفعها إلى المستودع العام بطريق الخطأ.',
    ],
  },
  {
    type: 'h2',
    id: 'troubleshoot',
    text: 'حلول الأخطاء الشائعة والحرجة (7 مشاكل شائعة)',
  },
  {
    type: 'image',
    src: '/img/local-cicd-troubleshoot.png',
    fallback: '/img/local-cicd-troubleshoot.png',
    alt: 'جدول تشخيص وحل أعطال CI/CD محلياً',
    caption: 'خارطة تشخيص الأعطال الشائعة والحلول المباشرة لتشغيل CI/CD دون عوائق.',
  },
  {
    type: 'p',
    text: 'هذه الحلول تمثل خلاصة التجارب العملية لمعالجة أشهر 7 أخطاء يتعثر بها المطورون عند تشغيل CI/CD محلياً:',
  },
  {
    type: 'h3',
    id: 'err-daemon',
    text: '1. فشل الاتصال بمقبس دوكر (Cannot connect to Docker daemon)',
  },
  {
    type: 'p',
    text: 'السبب: خدمة Docker غير مشغلة، أو أن المستخدم لا يملك صلاحية القراءة من مقبس `/var/run/docker.sock`. الحل الجذري:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker`,
  },
  {
    type: 'h3',
    id: 'err-arch',
    text: '2. خطأ المعمارية على معالجات ARM64 و Apple Silicon (exec format error)',
  },
  {
    type: 'p',
    text: 'السبب: تشغيل حاوية x86_64 على معالج ARM64 دون توجيه المحاكي. الحل: إضافة خيار المعمارية الصريح للأمر أو وضعه في .actrc:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `# تمرير معمارية الحاوية صراحة:
act --container-architecture linux/amd64

# أو تثبيت محاكي qemu للنواة لدعم تشغيل كافة المنصات:
docker run --privileged --rm tonistiigi/binfmt --install all`,
  },
  {
    type: 'h3',
    id: 'err-crlf',
    text: '3. أخطاء نهايات الأسطر في ويندوز (\\r: command not found)',
  },
  {
    type: 'p',
    text: 'السبب: Git على ويندوز يقوم أحياناً بتحويل نهايات الأسطر إلى CRLF مما يعطل مفسر bash داخل الحاوية. الحل: توحيد نهايات الأسطر إلى LF:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `# ضبط إعدادات Git لمنع تحويل الأسطر إلى CRLF:
git config core.autocrlf input

# تحويل الملفات الحالية دفعة واحدة:
dos2unix .github/workflows/*.yml`,
  },
  {
    type: 'h3',
    id: 'err-composite',
    text: '4. فشل استنساخ الحركات المركبة (Failed to resolve action / 401)',
  },
  {
    type: 'p',
    text: 'السبب: بعض الحركات (Actions) تتطلب رمز دخول مصرح من GitHub لتنزيل ملفات الـ Action من الـ Marketplace. الحل: تمرير توكن GitHub الحقيقي للأداة:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `# قراءة التوكن مباشرة من أداة gh الرسمية:
act -s GITHUB_TOKEN="$(gh auth token)"

# أو حفظه في ملف .secrets:
echo "GITHUB_TOKEN=$(gh auth token)" >> .secrets`,
  },
  {
    type: 'h3',
    id: 'err-services',
    text: '5. فشل تشغيل حاويات الخدمات (Postgres و Redis و Docker-in-Docker)',
  },
  {
    type: 'p',
    text: 'السبب: قيود العزل الافتراضية تمنع الحاوية من تشغيل ديمون فرعي أو الوصول لمنافذ الخدمات. الحل: تشغيل act بصلاحيات مميزة ودعم الـ DinD:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `act --privileged --container-daemon-socket /var/run/docker.sock`,
  },
  {
    type: 'h3',
    id: 'err-artifacts',
    text: '6. تعذر حفظ واسترجاع النواتج (upload-artifact / download-artifact)',
  },
  {
    type: 'p',
    text: 'السبب: أداة act لا تتصل بسيرفر التخزين السحابي لـ GitHub لحفظ النواتج والمخرجات. الحل: تفعيل خادم النواتج المحلي المدمج:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `act --artifact-server-path /tmp/artifacts`,
  },
  {
    type: 'h3',
    id: 'err-space',
    text: '7. خطأ نفاد مساحة القرص (No space left on device)',
  },
  {
    type: 'p',
    text: 'السبب: تراكم الحاويات المنتهية وشبكات act المعزولة بمرور الوقت. الحل: تنظيف دوري للبيئة:',
  },
  {
    type: 'code',
    lang: 'bash',
    code: `docker system prune -f --volumes`,
  },
  {
    type: 'h2',
    id: 'checklist',
    text: 'قائمة التحقق السريعة قبل تشغيل الـ Pipeline',
  },
  {
    type: 'checklist',
    items: [
      'التأكد من تشغيل ديمون Docker محلياً والتحقق عبر: docker info',
      'وجود ملف .actrc في مجلد المشروع لتعريف صور الحاويات المعتمدة',
      'إدراج ملف .secrets في .gitignore لتفادي تسريب المفاتيح الحساسة',
      'توحيد نهايات أسطر ملفات الـ Workflows إلى LF وليس CRLF',
      'فحص المسارات المتاحة محلياً عبر أمر: act -l',
      'تشغيل الاختبارات محلياً بـ act -j test قبل إطلاق أمر git push إلى المستودع',
    ],
  },
]

export const yusrBody: Block[] = [
  {
    type: 'image',
    src: '/img/screen-dashboard.png',
    fallback: '/img/screen-dashboard.png',
    alt: 'واجهة لوحة تحكم نظام يُسر للمحاسبة وإدارة الأوقاف والجمعيات الخيرية',
    caption: 'نظام يُسر v0.2.1 — لوحة التحكم المالية ومؤشرات الأداء.',
  },
  {
    type: 'p',
    text: '**يُسر (Yusr)** منظومة برمجية متكاملة وسيادية لإدارة ومحاسبة المنظمات غير الربحية والجمعيات الخيرية ولجان الزكاة وصناديق الأوقاف. صُمم النظام بهندسة مستقلة 100% تعمل على جهازك دون أي تبعيات سحابية أو اشتراكات شهرية، مع ضمان كامل لخصوصية البيانات وسريتها.',
  },
  yusrDownload,
  {
    type: 'h2',
    id: 'overview',
    text: 'نظرة عامة على نظام يُسر',
  },
  {
    type: 'p',
    text: 'تعتمد المنظومة على محرك عالي الكفاءة مكتوب بلغة **Rust** مع خادم قواعد بيانات **PostgreSQL 18** مدمج ذاتياً داخل حزمة التثبيت دون الحاجة إلى تثبيت إضافي أو إعداد يدوي. كما يتميز بواجهة سطح مكتب حديثة مبنية بـ **Tauri v2** وتدعم العمل باللغتين العربية والإنجليزية.',
  },
  {
    type: 'stats',
    items: [
      { value: '100%', label: 'عمل مستقل بلا إنترنت' },
      { value: 'SHA-256', label: 'دفتر أستاذ ضد التلاعب' },
      { value: 'PostgreSQL 18', label: 'قاعدة بيانات مدمجة' },
      { value: 'ZATCA', label: 'فوترة إلكترونية معتمدة' },
    ],
  },
  {
    type: 'h2',
    id: 'ledger',
    text: 'دفتر الأستاذ الرقمي ومكافحة التلاعب',
  },
  {
    type: 'p',
    text: 'يعتمد النظام على دفتر حسابات مالي مشفر بسلسلة كتل (Hash-Chain) باستخدام خوارزمية **SHA-256**. جميع القيود المحاسبية تسجّل بطريقة Write-Once وغير قابلة للتعديل أو الحذف السري، وأي تصحيح يتم حصراً عبر **القيود العكسية** النظامية مع توثيق اسم المستخدم وتاريخ العملية بدقة جنائية.',
  },
  {
    type: 'image',
    src: '/img/screen-report.png',
    fallback: '/img/screen-report.png',
    alt: 'التقارير المالية الموقعة تشفيرياً في نظام يسر',
    caption: 'تقارير مالية شفافة مختومة برمز استجابة سريعة QR وبصمة دفتر الأستاذ.',
  },
  {
    type: 'h2',
    id: 'advisor',
    text: 'المستشار الذكي المحلي (Offline AI Advisor)',
  },
  {
    type: 'p',
    text: 'يحتوي نظام يُسر على مستشار مالي ومحاسبي ذكي مدرب خصيصاً على معايير المنظمات غير الربحية وأحكام الزكاة والأوقاف. يعمل المستشار عبر محرك llama.cpp محلياً داخل جهازك دون إرسال أي بيانات أو حسابات إلى خوادم خارجية أو شركات الذكاء الاصطناعي.',
  },
  {
    type: 'image',
    src: '/img/screen-advisor.png',
    fallback: '/img/screen-advisor.png',
    alt: 'المستشار الذكي المحلي في نظام يسر',
    caption: 'تحليل مالي واستشارات محاسبية فورية دون اتصال بالإنترنت.',
  },
  {
    type: 'h2',
    id: 'zatca',
    text: 'الفاتورة الإلكترونية وهيئة الزكاة (ZATCA)',
  },
  {
    type: 'p',
    text: 'النظام مجهّز بالكامل لمتطلبات الفاتورة الإلكترونية للمرحلة الثانية لهيئة الزكاة والضريبة والجمارك (ZATCA)، بما يشمل التوقيع التشفيري ECDSA secp256k1، وتوليد فواتير UBL 2.1 XML، وسلسلة بصمات الفواتير، والأختام التشفيرية المعتمدة.',
  },
  {
    type: 'h2',
    id: 'backup',
    text: 'النسخ الاحتياطي التلقائي متعدد المسارات',
  },
  {
    type: 'p',
    text: 'محرّك نسخ احتياطي لحظي يعمل في الخلفية ويقوم بأخذ لقطات ذرية من قاعدة البيانات pg_dump والتحقق من سلامة البصمات. يمكن توجيه النسخ تلقائياً إلى أقراص USB محمولة، أو أقسام تخزين ثانوية، أو مزامنة مشفرة عند الرغبة.',
  },
  {
    type: 'image',
    src: '/img/screen-backup.png',
    fallback: '/img/screen-backup.png',
    alt: 'إدارة النسخ الاحتياطي التلقائي في نظام يسر',
    caption: 'نسخ احتياطي متعدد المسارات مع التحقق الذاتي من سلامة البيانات.',
  },
  {
    type: 'h2',
    id: 'network',
    text: 'العمل في شبكة داخلية LAN والصلاحيات',
  },
  {
    type: 'p',
    text: 'يدعم النظام التحويل الفوري بنقرة واحدة من وضع الجهاز الفردي (Standalone 127.0.0.1) إلى وضع خادم الشبكة المحلية (LAN Server 0.0.0.0)، مما يتيح لكافة أجهزة المحاسبين والباحثين الاجتماعيين في المؤسسة الاتصال بالخادم الرئيسي بصلاحيات دقيقة (مدير، محاسب، باحث، مراجع، مشاهد).',
  },
  {
    type: 'callout',
    tone: 'info',
    title: 'بيانات الدخول الافتراضية',
    items: [
      'اسم المستخدم الافتراضي: admin',
      'كلمة المرور الافتراضية: admin12345',
      'يتوفر زر تعبئة تلقائية فورية على شاشة تسجيل الدخول.',
      'يُنصح بتغيير كلمة المرور فور أول تسجيل دخول من شاشة إدارة المستخدمين.',
    ],
  },
  {
    type: 'h2',
    id: 'get',
    text: 'التحميل والتثبيت',
  },
  yusrDownload,
]


export const aiFakeBody: Block[] = [
  {
    type: 'image',
    src: '/img/verityscope-cover.png',
    fallback: '/img/verityscope-cover.png',
    alt: 'VerityScope — كاشف التزييف العميق بالذكاء الاصطناعي',
    caption: 'VerityScope v0.4.0 — حماية الحقيقة في كل لحظة.',
  },
  {
    type: 'p',
    text: '**VerityScope** تطبيق أندرويد يكشف التزييف العميق في **الصور والفيديو والنصوص** محلياً على الجهاز، بلا رفع أي ملف. مكتوب بـKotlin وJetpack Compose فوق `onnxruntime-android`، ويجمع 5 نماذج ViT مع فحص بيانات المصدر في حكم واحد يحمل دليله.',
  },
  {
    type: 'download',
    href: 'https://www.mediafire.com/file/38z57gqtgndpioy/VerityScope-v0.4.0-universal.apk/file',
    label: 'تحميل VerityScope v0.4.0 — APK',
    meta: 'VerityScope-v0.4.0-universal.apk · 240.1 MB · أندرويد 8.0+ · كل المعالجات · MediaFire',
  },
  {
    type: 'callout',
    tone: 'warn',
    title: 'قبل التثبيت',
    items: [
      'يتطلب السماح بالتثبيت من **مصادر غير معروفة**.',
      'حجم الملف 240.1 MB — حزمة شاملة واحدة لكل المعالجات (arm64-v8a, armeabi-v7a, x86, x86_64)، والنموذج الأساسي مضمّن داخلها.',
      'إن ظهرت رسالة «الحزمة تبدو غير صالحة» فالتنزيل لم يكتمل: أعد التحميل وتأكد أن بصمة SHA-256 هي `4053c21f1f24ff759218f4bc5ac391d4536ea67b5a579736ff059871a7c32ba7`.',
      'من نسخة v0.4.0 سابقة يتم التحديث فوقها مباشرة (نفس الحزمة ونفس التوقيع). أما النسخ الأقدم الموقّعة بالمفتاح القديم فتحتاج `uninstall` أولاً.',
    ],
  },

  {
    type: 'h2',
    id: 'whats-new',
    text: 'ما الجديد في v0.4.0',
  },
  {
    type: 'stats',
    items: [
      { value: '5', label: 'نماذج AI محلية' },
      { value: '3', label: 'نماذج كحد أقصى في الفحص الذكي' },
      { value: '10', label: 'فحوصات مجانية يومياً' },
      { value: '4', label: 'معماريات في حزمة واحدة' },
    ],
  },
  {
    type: 'ul',
    items: [
      '**الفحص الذكي (Smart Scan)** — يختار أقوى نموذج متحقَّق منه على جهازك ويضيف إليه شركاء حسب قدرة الهاتف (1 أو 2 أو 3 نماذج)، ثم يدمج قراءاتها.',
      '**وضع عدم الاتصال** — الفحص المحلي لا يبدأ إلا بنموذج تطابقت بصمته SHA-256، مع تنزيل مسبق اختياري عبر Wi-Fi غير محدود. وإن لم يوجد نموذج محلي تظهر رسالة واضحة بدل فشل صامت.',
      '**حماية الذاكرة** — فحص لقدرة الجهاز في الإعدادات يحذّر قبل اختيار نموذج أثقل مما يحتمله الهاتف.',
      '**تقرير PDF جنائي** — يجمع قراءة كل نموذج وبيانات المصدر في تقرير واحد، يُحفظ في Downloads أو يُشارك مباشرة.',
      '**أداة الشاشة الرئيسية + المشاركة** — فحص بلمسة من الـWidget، واستقبال الصور والفيديو والنصوص من أي تطبيق عبر «مشاركة» (ملف واحد أو عدة ملفات).',
      '**تبديل اللغة** — عربي/إنجليزي من داخل التطبيق.',
      '**حزمة APK شاملة واحدة** — تعمل على كل المعالجات بدل ملف منفصل لكل معالج.',
      '**حصة الفحص** — 10 فحوصات مجانية يومياً تتجدد منتصف الليل، وبلا حد للحساب المميّز.',
      '**ترقية آمنة لسجل الفحوصات** — يُنقل السجل عند الترقية، والرجوع لإصدار أقدم لا يسبب انهياراً (يُعاد إنشاء السجل فارغاً).',
    ],
  },

  {
    type: 'h2',
    id: 'how-it-works',
    text: 'كيف يعمل',
  },
  {
    type: 'p',
    text: 'كل صورة أو إطار فيديو يمر بنماذج ViT عبر ONNX Runtime، ثم تُدمج القراءات عبر **دمج log-odds**: تُجمع أدلة كل نموذج في فضاء اللوغاريتم بدل متوسط احتمالات بسيط يجرّه نموذج واثق خطأً. بعدها يُضاف فحص بيانات المصدر.',
  },
  {
    type: 'ul',
    items: [
      '**صور:** النموذج المختار — أو حتى 3 نماذج في الفحص الذكي — مع بيانات المصدر.',
      '**فيديو:** استخراج إطارات مع دمج يراعي القمم: الإطارات التي تتجاوز 80% ترفع النتيجة، فلحظة تزييف قصيرة لا تختفي في المتوسط.',
      '**نصوص:** 7 إشارات أسلوبية بالعربية والإنجليزية.',
      '**سحابي (اختياري):** Sightengine وHive وReality Defender وSensity بمفتاحك الخاص، وتُدمج نتيجتها مع المحلية.',
      'كل نتيجة تحمل **دليلاً**: قراءة كل نموذج على حدة، واتفاقها أو اختلافها، ومستوى الخطر.',
    ],
  },

  {
    type: 'h2',
    id: 'text-detection',
    text: 'كشف النصوص المولّدة',
  },
  {
    type: 'p',
    text: 'فحص أسلوبي إحصائي بلا نموذج لغوي، يحتاج 40 كلمة على الأقل، ويجمع 7 إشارات:',
  },
  {
    type: 'table',
    caption: 'إشارات كشف النص ووزن كل منها في النتيجة.',
    head: ['الإشارة', 'الوزن'],
    rows: [
      ['تفاوت أطوال الجمل (burstiness)', '28%'],
      ['تنوّع المفردات (Type-Token)', '20%'],
      ['عبارات AI المعروفة (39 عبارة، منها 10 عربية)', '18%'],
      ['تنوّع بدايات الجمل', '10%'],
      ['تجانس أطوال الفقرات', '10%'],
      ['تكرار الثلاثيات (trigrams)', '8%'],
      ['كثافة الشرطة الطويلة (—)', '6%'],
    ],
  },

  {
    type: 'h2',
    id: 'models',
    text: 'النماذج المتاحة',
  },
  {
    type: 'table',
    caption: 'النموذج الأول مضمّن في الحزمة، والبقية تُنزَّل عند الطلب ويُتحقق من بصمة كل ملف SHA-256 قبل استخدامه.',
    head: ['النموذج', 'الحجم', 'الأفضل لـ'],
    rows: [
      ['CommunityForensics ViT INT8', '23 MB', 'مضمّن · افتراضي · صور AI الشائعة'],
      ['Frontier 2026 FP16', '44 MB', 'مولّدات 2025–2026 (FLUX, GPT Image, Imagen 4)'],
      ['Real vs Fake ViT', '87 MB', 'كاشف عام قوي · شريك ensemble'],
      ['3-Class ViT', '87 MB', 'يفصل Deepfake عن AI-generated'],
      ['Deep-Fake Detector v2', '87 MB', 'معمارية مستقلة تجريبية'],
    ],
  },

  {
    type: 'h2',
    id: 'metadata',
    text: 'فحص بيانات المصدر',
  },
  {
    type: 'p',
    text: 'يقرأ البصمة التي يتركها المولّد داخل الملف: اعتمادات المحتوى C2PA، و`trainedAlgorithmicMedia` من IPTC، ومعاملات Stable Diffusion وComfyUI وInvokeAI، وأسماء نحو 30 مولّداً (FLUX, Midjourney, DALL·E, Imagen, Seedream, Kling, Sora, Veo…)، وبيانات EXIF للكاميرا.',
  },
  {
    type: 'callout',
    tone: 'info',
    title: 'قاعدة الحكم',
    items: [
      'علامة صريحة لمولّد ترفع احتمال AI إلى **95%** كحد أدنى.',
      'وجود كاميرا في EXIF يرفع الثقة في حكم «حقيقي» بـ5% فقط وبسقف 92% — لأن هذه البيانات سهلة الحذف والتزوير.',
    ],
  },

  {
    type: 'h2',
    id: 'screens',
    text: 'من الواجهة',
  },
  {
    type: 'image',
    src: '/img/aifake-1.webp',
    fallback: '/img/aifake-1.jpg',
    alt: 'شاشة التطبيق الرئيسية مع مؤشر الأصالة الدائري',
    caption: 'الشاشة الرئيسية — مؤشر الأصالة الدائري.',
  },
  {
    type: 'image',
    src: '/img/aifake-2.webp',
    fallback: '/img/aifake-2.jpg',
    alt: 'نتائج الفحص مع قراءة كل نموذج على حدة',
    caption: 'تفصيل النتيجة — قراءة كل نموذج واتفاقها أو اختلافها.',
  },
  {
    type: 'image',
    src: '/img/aifake-3.webp',
    fallback: '/img/aifake-3.jpg',
    alt: 'السجل والإعدادات داخل التطبيق',
    caption: 'سجل الفحوصات والإعدادات.',
  },

  {
    type: 'h2',
    id: 'download',
    text: 'التحميل',
  },
  {
    type: 'download',
    href: 'https://www.mediafire.com/file/38z57gqtgndpioy/VerityScope-v0.4.0-universal.apk/file',
    label: 'تحميل من MediaFire',
    meta: 'VerityScope-v0.4.0-universal.apk · 240.1 MB',
  },

  {
    type: 'h2',
    id: 'limits',
    text: 'حدود يجب أن تعرفها',
  },
  {
    type: 'ul',
    items: [
      'دقة الكواشف المفتوحة **تنخفض بشدة** على التزييف الحديث — النتيجة احتمالية دائماً.',
      'فحص النص أسلوبي وليس نموذجاً لغوياً، محدود بسقف ثقة 75%.',
      'فحص الملفات الصوتية غير مدعوم في هذا الإصدار.',
      'الفحص الذكي يحتاج نماذج منزّلة ومتحقَّقاً منها؛ بدونها يعمل بالنموذج المضمّن وحده.',
      'الهواتف الضعيفة تستخدم نموذجاً واحداً وإطارات فيديو أقل — أسرع لكن أقل دقة.',
    ],
  },
  {
    type: 'callout',
    tone: 'tip',
    title: 'الخلاصة',
    items: [
      'التطبيق أداة **مساعدة على الحكم**، لا دليل قاطع.',
      'اجمع نتيجته مع فحص بيانات المصدر وتحقّق بشري قبل أي قرار.',
    ],
  },
]

const zeidexConvertAndroidBody: Block[] = [
  {
    type: 'image',
    src: '/img/zeidex-convert-android-cover.webp',
    fallback: '/img/zeidex-convert-android-cover.jpg',
    alt: 'تطبيق Zeidex Convert للأندرويد — محوّل ملفات محلي شامل',
    caption: 'Zeidex Convert v1.2.0 للأندرويد — خصوصية مطلقة وأداء محلي فائق دون إنترنت.',
  },
  {
    type: 'download',
    href: 'https://www.mediafire.com/file/vikc6vaxcd64vyd/zeidex-convert-v1.2.0.apk/file',
    label: 'تحميل Zeidex Convert v1.2.0 — APK (MediaFire)',
    meta: 'zeidex-convert-v1.2.0.apk · Android 8.0+ · 10.8 MB · MediaFire',
  },
  {
    type: 'callout',
    tone: 'tip',
    title: 'خصوصية تامة 100% دون اتصال بالإنترنت',
    items: [
      'التطبيق يعمل بشكل كامل على هاتفك ولا يطلب أي إذن للوصول إلى شبكة الإنترنت.',
      'كافة عمليات التحويل والضغط واستخراج الفيديو تجري محلياً عبر معالج الرسوميات ومحركات أندرويد الأصلية.',
      'الحزمة موقعة رقمياً بشهادة Zeidexsoft الرسمية لضمان الأمان والنزاهة.',
    ],
  },
  {
    type: 'h2',
    id: 'features',
    text: 'الميزات الأساسية والقدرات',
  },
  {
    type: 'p',
    text: 'تطبيق **Zeidex Convert** هو الحل الشامل والمجاني لأجهزة أندرويد لمعالجة كافة أنواع الملفات والوسائط محلياً بسرعة وأمان تام، مبني بأحدث تقنيات Jetpack Compose و Kotlin الحديثة.',
  },
  {
    type: 'ul',
    items: [
      '**تحويل متعدد الصيغ**: تحويل الصور (JPG, PNG, WEBP, BMP, PDF, ICO)، استخراج الصوت من الفيديو (MP3, M4A, AAC, WAV)، فك وضغط الأرشيفات (ZIP, TAR, GZ)، وتحويل المستندات.',
      '**إصلاح ودعم استخراج فيديو الصور الحية**: استخراج مقاطع الفيديو المدمجة في صور Motion Photo وصور Apple Live Photo وحفظها كملفات MP4 نقية.',
      '**أداة تحسين الجودة (Media Booster)**: تكبير الفيديوهات إلى دقة 1080p FHD، مضاعفة معدل البت، وتوضيح تفاصيل الصور بمصفوفات حِدة متطورة.',
      '**إشعارات الحفظ الفورية**: إشعار نظام أندرويد يظهر فور اكتمال العملية مع مسار التخزين الكامل وخيارات التشغيل والمشاركة الفورية.',
      '**العمل بالخلفية والاستئناف**: خدمة أمامية نشطة لمعالجة الملفات الكبيرة في الخلفية مع إمكانية إيقاف واستئناف المهام في أي وقت.',
    ],
  },
  {
    type: 'h2',
    id: 'live-photos',
    text: 'استخراج فيديو الصور الحية (Motion & Live Photos)',
  },
  {
    type: 'p',
    text: 'حل متكامل يدعم 6 خوارزميات ثنائية ذكية لاستخراج الفيديو عالي الدقة من الصور الحية بمختلف أنواعها دون الحاجة لأي خادم سحابي:',
  },
  {
    type: 'ul',
    items: [
      '**Samsung Galaxy**: قراءة مقطورة البيانات الثنائية المخصصة `MotionPhoto_Data` بدقة البايت.',
      '**Google Pixel وهواتف أندرويد الحديثة**: مسح بيانات XMP APP1 الوصفية واستخراج `MicroVideoOffset` و `Item:Length`.',
      '**Apple Live Photos**: دعم حزم `.livp` وأرشيفات ZIP وملفات MOV المزدوجة.',
      '**ماسح ثنائي شامل (Universal Reverse Scan)**: البحث عن صناديق الفيديو (`ftyp`, `moov`, `mdat`, `wide`) للأجهزة التي لا تلتزم بالمعايير القياسية.',
    ],
  },
  {
    type: 'h2',
    id: 'screens',
    text: 'صور وواجهات التطبيق',
  },
  {
    type: 'image',
    src: '/img/zeidex-convert-android-1.webp',
    fallback: '/img/zeidex-convert-android-1.jpg',
    alt: 'شاشة التحويل واختيار الصيغ وإدارة المهام في تطبيق Zeidex Convert للأندرويد',
    caption: 'الشاشة الرئيسية: بطاقات تحويل تفاعلية مع إمكانية اختيار الصيغ والتحكم بجودة الضغط.',
  },
  {
    type: 'image',
    src: '/img/zeidex-convert-android-2.webp',
    fallback: '/img/zeidex-convert-android-2.jpg',
    alt: 'شاشة الأدوات: استخراج فيديو الصور الحية وأداة تحسين الجودة وتوليد QR ودمج PDF',
    caption: 'لوحة الأدوات الذكية: استخراج فوري لفيديو الصورة الحية وأداة تحسين الجودة الفائقة.',
  },
  {
    type: 'image',
    src: '/img/zeidex-convert-android-3.webp',
    fallback: '/img/zeidex-convert-android-3.jpg',
    alt: 'شاشة الإعدادات: التحقق من التوقيع الرقمي، التحديثات، والتخزين التلقائي المنظم',
    caption: 'الإعدادات المتقدمة: التحقق المشفر من توقيع الحزم والتخزين التلقائي المنظم.',
  },
  {
    type: 'h2',
    id: 'enhancer',
    text: 'أداة تحسين جودة الفيديو والصور',
  },
  {
    type: 'p',
    text: 'تتضمن علامة تبويب الأدوات قسماً متخصصاً لرفع جودة الوسائط باستخدام المعالجة الأصلية:',
  },
  {
    type: 'table',
    head: ['الميزة', 'النوع', 'الوصف'],
    rows: [
      ['1080p FHD Upscale', 'فيديو', 'تكبير أبعاد الفيديو إلى دقة 1080p كاملة وتحديث معدل الإطارات عبر تسريع العتاد.'],
      ['Bitrate Boost', 'فيديو', 'رفع معدل البت حتى 10 Mbps وتنقية تدفق الفيديو من التشويش الرقمي.'],
      ['Audio Boost', 'صوت وفيديو', 'مضاعفة نقاء مسار الصوت حتى 256 kbps وضبط توازن مستوى الصوت.'],
      ['Laplacian Sharpening', 'صور', 'مصفوفة 3x3 متطورة لتقوية وتوضيح تفاصيل الحواف والخطوط الدقيقة.'],
      ['Auto-Contrast & Vibrance', 'صور', 'موازنة ألوان وتباين الصورة وتوسيع المدى الديناميكي تلقائياً.'],
      ['2X Super-Resolution', 'صور', 'مضاعفة أبعاد الصورة الأصلية مرتين بفلترة ثنائية التكعيب تحافظ على النعومة.'],
      ['تصدير BMP النقطي', 'صور', 'حفظ صور عالية الدقة بصيغة Windows Bitmap 24-bit غير المضغوطة.'],
    ],
  },
  {
    type: 'h2',
    id: 'storage',
    text: 'الحفظ التلقائي المنظم في ذاكرة الهاتف',
  },
  {
    type: 'p',
    text: 'تُحفظ كافة الملفات الناتجة تلقائياً في ذاكرة الهاتف داخل مجلد التطبيق المخصص Download/ZeidexConvert/ مع مجلدات فرعية منظمة (Images, Videos, Audio, PDF, Documents, Archives, LivePhotos, QR) مع الفهرسة الفورية في معارض الصور ومشغلات الفيديو.',
  },
  {
    type: 'h2',
    id: 'security',
    text: 'الأمان والخصوصية المطلقة 100% محلي',
  },
  {
    type: 'checklist',
    items: [
      'بدون إذن إنترنت (INTERNET Permission غير موجود في مانيفست التطبيق نهائياً)',
      'محلي 100% ولا يتم رفع أي ملف إلى أي سيرفر أو خدمة خارجية',
      'حماية ضد ZipSlip عند فك ضغط الأرشيفات لمنع استبدال ملفات النظام',
      'توقيع رقمي رسمي ومحمي بشهادة Zeidexsoft الأصلية (SHA-256)',
      'كاشف تلقائي للتحديثات يتحقق من مطابقة التوقيع وبصمة الشهادة قبل أي تحديث',
    ],
  },
  {
    type: 'h2',
    id: 'get',
    text: 'روابط التحميل المباشرة',
  },
  {
    type: 'download',
    href: 'https://www.mediafire.com/file/vikc6vaxcd64vyd/zeidex-convert-v1.2.0.apk/file',
    label: 'تحميل مباشر من MediaFire',
    meta: 'zeidex-convert-v1.2.0.apk · 10.8 MB · أحدث إصدار v1.2.0',
  },
]

const edmsAndroid: Block[] = [
  {
    type: 'p',
    text: '**عميل أندرويد أصلي لنظام أرشيف برو** — نفس النظام الذي له نسخة سطح مكتب لويندوز. مكتوب بـKotlin وJetpack Compose، ويعمل بإحدى طريقتين تختارهما من شاشة الدخول.',
  },
  {
    type: 'download',
    href: 'https://www.mediafire.com/file/inn8lf6tznv95nx/app-debug.apk/file',
    label: 'تحميل عميل أرشيف برو — APK',
    meta: 'app-debug.apk · Android 8.0+ · MediaFire',
    also: [
      {
        href: 'https://drive.google.com/uc?export=download&id=1FxWSMfMpix-uE33fNSd3layuidLGIbQu',
        label: 'نسخة بديلة على Google Drive',
        meta: 'نفس الملف · Google Drive',
      },
    ],
  },
  {
    type: 'callout',
    tone: 'warn',
    title: 'قبل التثبيت',
    items: [
      'يتطلب السماح بالتثبيت من **مصادر غير معروفة**.',
      'المسح الضوئي يحتاج خدمات Google Play، وهي سبب حد `minSdk` عند أندرويد 8.0.',
      'كل تحديث يجب أن يُوقَّع **بالمفتاح نفسه**، وإلا رفض أندرويد تثبيته فوق نسخة موجودة.',
    ],
  },

  {
    type: 'h2',
    id: 'two-modes',
    text: 'طريقتان للتشغيل',
  },
  {
    type: 'ul',
    items: [
      '**على هذا الجهاز** — النظام كاملاً محلياً: قاعدة بيانات، تخزين ملفات، مستخدمون وصلاحيات. بلا حاسوب وبلا إنترنت.',
      '**الاتصال بالنسخة المكتبية** — واجهة الحاسوب مقدَّمة عبر بوابة HTTPS بشهادة مثبّتة، مع ما لا تجيده صفحة الويب على الهاتف: التقاط المستندات والتنزيلات.',
    ],
  },

  {
    type: 'h2',
    id: 'compatibility',
    text: 'التوافق مع سطح المكتب',
  },
  {
    type: 'p',
    text: 'القاعدة والنسخة الاحتياطية ومجموعة كلمات المرور تنتقل في الاتجاهين **بلا تحويل** — وهذا هو الجزء الذي يحدد إن كان الطلب يستحق تطبيقاً منفصلاً أصلاً.',
  },
  {
    type: 'ul',
    items: [
      '**قاعدة البيانات**: مخطط الحاسوب نفسه، جدولاً بجدول وعموداً بعمود.',
      '**كلمات المرور**: بصمة `scrypt` بصيغة `scrypt$32768$8$1$salt$hash`. أندرويد لا يشحن scrypt، لذلك نُفِّذ [RFC 7914](https://www.rfc-editor.org/rfc/rfc7914) في `Passwords.kt` ويُختبر على متجهات الاختبار الرسمية.',
      '**الملفات**: نفس التخطيط `storage/documents/YYYY/MM/<hex>.<ext>`، والمصغّرات تحت `storage/thumbnails/…`.',
      '**النسخ الاحتياطية**: ملفات ZIP ببنية `manifest.json` + `database/` + `storage/`. الملف يرفض أي شيء ليس نسخة أرشيف، ويحمي نفسه من zip-slip.',
    ],
  },

  {
    type: 'h2',
    id: 'trust',
    text: 'نموذج الثقة',
  },
  {
    type: 'p',
    text: 'الاتصال بين الهاتف والحاسوب مقيس بالكامل — لا يوجد مسار «ثق في الشبكة».',
  },
  {
    type: 'ul',
    items: [
      'الاقتران `edms://pair?h=…&p=…&fp=…&c=…` يحمل **SHA-256** لشهادة الحاسوب ذاتية التوقيع.',
      'كل اتصال أصلي أو عبر WebView يجب أن يقدّم تلك الشهادة بالضبط، فتنفس الدبوس يعمل على IP محلي أو اسم DDNS أو عنوان VPN.',
      'رمز الجهاز مخزّن مشفّراً بـAES-GCM تحت مفتاح لا يغادر Android Keystore.',
      'الـWebView يعمل بـ`allowFileAccess = false`، وأي رابط غير معروف يُسلَّم للمتصفح.',
    ],
  },

  {
    type: 'h2',
    id: 'tests',
    text: 'نتائج الاختبار',
  },
  {
    type: 'p',
    text: 'اختبارات وحدة على JVM، تُشغَّل بـ`./gradlew :app:testDebugUnitTest`:',
  },
  {
    type: 'table',
    caption: '12 اختباراً · 0 فشل · 0 متجاهَل · 1.954 ثانية',
    head: ['الملف', 'ما يغطّيه'],
    rows: [
      ['PasswordsTest', 'متجه RFC 7914 · تحقّق من بصمة سطح المكتب · دورة حفظ وتحميل مع تنقية'],
      ['CredentialsTest', 'استبدال اسم مستخدم موجود بدل تكراره · حساسية حالة الاسم · النقل إلى الخانة الأحدث · بقاء الحقول عبر JSON · حذف السطر بلا اسم'],
      ['PureLogicTest', 'تطبيع البحث العربي وتشكيله · سلامة جدول المراجع في مولّد PDF'],
      ['UpdaterTest', 'مقارنة إصدارات ذات نقاط رقمية'],
    ],
  },
  {
    type: 'callout',
    tone: 'info',
    title: 'ملاحظة عن بيئة البناء',
    items: [
      'البناء يحتاج **JDK 17**. على JDK 25 يفشل AGP 8.5.2 برسالة `IllegalArgumentException: 25.0.4.1` بلا أي سياق.',
      'مفتاح التوقيع **ليس في المستودع**؛ يُقرأ من متغيرات البيئة أو من ملف `keystore.properties` غير المتتبَّع.',
    ],
  },

  {
    type: 'h2',
    id: 'limits',
    text: 'ما يجب أن تعرفه',
  },
  {
    type: 'ul',
    items: [
      'نسخة سطح المكتب تشحن JavaScript يمكن قراءته؛ نسخة أندرويد تمرّ على R8 في الوضع الكامل مع تقليص الموارد.',
      'ما يبقى من الأسماء هو ما تحتاجه المنصة بالضرورة: مكوّنات المانيفست. الإبقاء على `Signature` و`InnerClasses` **محذوفان عمداً** لأنهما يعيدان كتابة الأسماء الأصلية داخل DEX حتى بعد تغيير اسم الصنف.',
      'نسخة `app-debug.apk` هنا نسخة تصحيح، موقّعة بمفتاح تطوير لا بمفتاح الإصدار.',
      'المسح الضوئي معطل عملياً على الأجهزة بلا خدمات Google Play.',
    ],
  },
  {
    type: 'callout',
    tone: 'tip',
    title: 'التوثيق الكامل',
    items: [
      'التوثيق الأصلي — بما فيه نموذج الثقة وتفاصيل R8 وخطوات البناء — في مستودع المشروع.',
    ],
  },
]

const archive106: Block[] = [
  {
    type: 'image',
    src: '/img/archive-1.0.6-dashboard.webp',
    fallback: '/img/archive-1.0.6-dashboard.jpg',
    alt: 'لوحة التحكم في أرشيف 1.0.6',
    caption: 'لوحة التحكم في أرشيف 1.0.6.',
  },
  {
    type: 'p',
    text: '**أرشيف 1.0.6** تحديث أمني وإصلاحات ومزايا جديدة لنظام الأرشفة الإلكترونية. يعمل على ويندوز 64-بت، والترقية من 1.0.0 تحافظ على المستندات والحسابات وكلمات المرور كما هي.',
  },
  {
    type: 'download',
    href: 'https://github.com/zeiad6/Edms-archive/releases/download/v1.0.6/EDMS-Archive-1.0.6-Setup-x64.exe',
    label: 'تحميل أرشيف 1.0.6 — ويندوز 64-بت',
    meta: 'EDMS-Archive-1.0.6-Setup-x64.exe · 238.6 MB · GitHub',
    also: [
      {
        href: 'https://www.mediafire.com/file/cezytgi4hqxmorc/EDMS-Archive-1.0.6-Setup-x64.exe/file',
        label: 'تحميل من MediaFire',
        meta: 'نفس الملف · 238.6 MB · MediaFire',
      },
      {
        href: 'https://drive.google.com/file/d/1AkBwaNUwlovtOPS4SyCvkz0LSU7hvDbn/view?usp=drivesdk',
        label: 'تحميل من Google Drive',
        meta: 'نفس الملف · نسخة احتياطية',
      },
    ],
  },
  {
    type: 'table',
    caption: 'بطاقة الإصدار',
    head: ['البند', 'القيمة'],
    rows: [
      ['الإصدار', '1.0.6'],
      ['المنصة', 'Windows x64 (NSIS)'],
      ['اسم الملف', 'EDMS-Archive-1.0.6-Setup-x64.exe'],
      ['الحجم', '238.6 MB'],
      ['تاريخ الإصدار', '2026-10-04'],
      ['التوقيع', 'غير موقّع (يظهر تنبيه SmartScreen)'],
    ],
  },
  { type: 'h2', id: 'whats-new', text: 'ما الجديد' },
  {
    type: 'ul',
    items: [
      '**أمان:** إغلاق ثغرة كانت تتجاوز إلزام تغيير كلمة المرور عند أول دخول.',
      '**أمان:** الحذف النهائي يحذف الملفات من القرص، وليس السجل فقط.',
      '**أمان:** نافذة البرنامج لا تنتقل إلى مواقع خارجية، والروابط الخارجية تُفتح في المتصفح.',
      '**أمان:** رسائل الخطأ لا تكشف المسارات الداخلية للنظام.',
      '**الحزم:** تحديث `next` إلى 16.3.7 و`dompurify` و`brace-expansion`، ونتيجة `npm audit` صفر ثغرات.',
      '**واجهة:** لوحة أوامر سريعة `Ctrl+K` للتنقل بين الصفحات.',
      '**الدخول:** زر لإظهار كلمة المرور، وخيار لحفظ بيانات الدخول مشفّرة.',
      '**سجل التدقيق:** تسميات عربية لكل أحداث السجل.',
      '**التثبيت الجديد:** ينشئ حساب مدير واحداً بدلاً من ستة حسابات تجريبية، وتغيير كلمة المرور إجباري عند أول دخول.',
    ],
  },
  {
    type: 'stats',
    items: [
      { value: '0', label: 'ثغرات في npm audit' },
      { value: '351', label: 'اختباراً ناجحاً' },
      { value: '3', label: 'خطوات تحقق من الترقية' },
    ],
  },
  { type: 'h2', id: 'stability', text: 'الإقلاع والاختبارات' },
  {
    type: 'p',
    text: 'أصلحنا عطل الإقلاع على التثبيت الجديد: كانت شاشة الدخول تطلب جدول المستخدمين قبل إنشائه، فتفشل الصفحة ويُغلق البرنامج. الآن تُنشأ قاعدة البيانات عند بدء الخادم قبل أي طلب، وينتظر البرنامج اكتمال تحميل الواجهة الفعلي.',
  },
  {
    type: 'p',
    text: 'كل إصدار يمر بفحص كامل على GitHub Actions: فحص الأنواع، و ESLint، والاختبارات، ثم بناء المثبّت، واختبار إقلاع يشترط ظهور الواجهة، واختبار ترقية على بيانات نسخة 1.0.0.',
  },
  {
    type: 'image',
    src: '/img/archive-1.0.6-installer.webp',
    fallback: '/img/archive-1.0.6-installer.jpg',
    alt: 'هوية صفحات المثبّت بشعار Zeidex',
    caption: 'صفحات المثبّت بهوية Zeidex.',
  },
  { type: 'h2', id: 'upgrade', text: 'الترقية من 1.0.0' },
  {
    type: 'checklist',
    items: [
      'أغلق البرنامج تماماً.',
      'شغّل المثبّت الجديد، وسيُحدِّث البرنامج في المكان نفسه.',
      'لا تحتاج إلى إزالة النسخة القديمة أولاً.',
      'المستندات والحسابات وكلمات المرور تبقى كما هي.',
    ],
  },
  {
    type: 'callout',
    tone: 'tip',
    title: 'احتياط اختياري',
    items: ['نفّذ نسخة احتياطية من **الإعدادات ← النسخ الاحتياطي** قبل أي تحديث. الترقية لا تحتاجها، لكنها تمنحك أماناً إضافياً.'],
  },
  { type: 'h2', id: 'smartscreen', text: 'تنبيه SmartScreen' },
  {
    type: 'callout',
    tone: 'warn',
    title: 'البناء غير موقّع رقمياً',
    items: ['قد تظهر شاشة SmartScreen عند أول تشغيل. اختر «المزيد من المعلومات» ثم «تشغيل على أي حال».'],
  },
  { type: 'h2', id: 'links', text: 'المصدر والروابط' },
  {
    type: 'ul',
    items: [
      'الإصدار على GitHub: [v1.0.6](https://github.com/zeiad6/Edms-archive/releases/tag/v1.0.6)',
      'المستودع: [zeiad6/Edms-archive](https://github.com/zeiad6/Edms-archive)',
      'الموقع: [zeidexsoft.com](https://zeidexsoft.com/)',
    ],
  },
]

export const postBodies: Record<string, Block[]> = {
  "local-cicd-guide": localCicdBody,
  "yusr": yusrBody,
  "zeidex-convert-android": zeidexConvertAndroidBody,

  "archive-1-0-6": archive106,

  "ai-fake-detector-android": aiFakeBody,

  "edms-archive-android": edmsAndroid,

  "cloudcli-setup-guide": [
      {
        type: 'p',
        text: 'مقال تعليمي طويل يوثّق البيئة كما هي مثبّتة فعلياً على جهاز **Linux/arm64 داخل PRoot**، خطوة بخطوة، مع شرح وظيفة كل مكوّن وكيفية إضافته.',
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'تنبيه أمني',
        items: [
          'كل المفاتيح في الأمثلة رمزية (`<ضع-مفتاحك-هنا>`).',
          'لا تنسخ مفاتيح حقيقية داخل المقالات أو المستودعات.',
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '3', label: 'وكلاء برمجة مربوطون' },
          { value: '~90', label: 'مهارة لكل أداة' },
          { value: '~238', label: 'وكيلاً في OpenCode' },
          { value: '~25', label: 'سيرفر MCP' },
        ],
      },

      { type: 'h2', id: 'roadmap', text: 'خارطة الطريق: ما الذي بنيناه؟' },
      {
        type: 'p',
        text: 'الفكرة باختصار: **CloudCLI هو المحور** — واجهة ويب تقود Claude Code من المتصفح، وتقدّم خدمة تحكّم بالمتصفح (browser-use) يستهلكها كل من Codex و OpenCode عبر بروتوكول MCP. حول هذا المحور تدور ثلاثة وكلاء برمجة، ومكتبة ضخمة من المهارات والوكلاء المتخصصين، وعشرات سيرفرات MCP.',
      },
      {
        type: 'hub',
        center: { title: 'CloudCLI :3001', sub: 'المحور — واجهة ويب + browser-use' },
        nodes: [
          { title: 'Claude Code', sub: 'اشتراك Pro · OAuth مباشر من أنثروبيك', role: 'يقوده CloudCLI مباشرة' },
          { title: 'Codex', sub: 'بوابة ccpro · `gpt-5.5`', role: 'browser-use عبر MCP' },
          { title: 'OpenCode', sub: 'OpenRouter + محلي · `sonnet-5`', role: 'browser-use عبر MCP' },
        ],
        caption: 'CloudCLI يقود Claude Code، ويخدم Codex و OpenCode بأداة تحكّم المتصفح عبر MCP.',
      },
      {
        type: 'table',
        caption: 'جدول البيئة',
        head: ['المكوّن', 'القيمة الفعلية'],
        rows: [
          ['النظام', 'Linux aarch64 (arm64) داخل PRoot-Distro'],
          ['Node', 'عبر npm النظامي (`/usr/bin/node`)'],
          ['Claude Code', 'v2.1.280 — مصادقة Pro (OAuth) على موديلات أنثروبيك'],
          ['Codex', '`@openai/codex@0.155.1` — عبر `model_provider` خارجي'],
          ['CloudCLI', '`@cloudcli-ai/cloudcli@1.37.3` — بورت `3001`'],
          ['OpenCode', 'الموديل الافتراضي `openrouter/anthropic/claude-sonnet-5`'],
          ['مسارات الإعداد', '`~/.claude/` ، `~/.codex/` ، `~/.config/opencode/` ، `~/.cloudcli/`'],
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'لماذا PRoot مهم؟',
        items: [
          'غياب الـ uid mapping يكسر بعض الميزات، مثل cross-session messaging في Claude Code.',
          'الحل موثّق في [الجزء السابع](#ops).',
        ],
      },

      { type: 'h2', id: 'install', text: 'الجزء الأول: تثبيت CloudCLI' },
      { type: 'h3', id: 'what-is-cloudcli', text: 'ما هو CloudCLI؟' },
      {
        type: 'p',
        text: 'حزمة npm باسم `@cloudcli-ai/cloudcli` — وصفها الرسمي: **"A web-based UI for Claude Code CLI"**، أي واجهة ويب تتحكم في Claude Code من المتصفح، وتشمل:',
      },
      {
        type: 'ul',
        items: [
          'سيرفر ويب (افتراضياً على البورت `3001`).',
          'أوامر `sandbox` لتشغيل بيئات Docker معزولة.',
          'سيرفر `browser-use-mcp` — وهذه هي **نقطة الربط** مع باقي الأدوات ([الجزء الثاني](#connect)).',
          'أمر `status` يعرض أماكن الإعداد وقاعدة البيانات.',
        ],
      },
      { type: 'h3', id: 'install-steps', text: 'خطوات التثبيت' },
      {
        type: 'code',
        lang: 'bash',
        code: `# 1) تثبيت عام عبر npm (يحتاج صلاحيات الكتابة على /usr/lib/node_modules)
npm install -g @cloudcli-ai/cloudcli

# 2) التحقق من الإصدار
cloudcli version          # 1.37.3 وقت كتابة الدليل
# أو
cloudcli --help

# 3) فحص الحالة وأماكن الملفات
cloudcli status`,
      },
      {
        type: 'table',
        caption: 'مخرجات cloudcli status الحقيقية على هذا الجهاز',
        head: ['البند', 'المسار'],
        rows: [
          ['مجلد التثبيت', '`/usr/lib/node_modules/@cloudcli-ai/cloudcli`'],
          ['قاعدة البيانات', '`/root/.cloudcli/auth.db`'],
          ['البورت', '`3001` (افتراضي، يُغيَّر بـ `--port` أو `SERVER_PORT`)'],
          ['مسار Claude CLI الذي يقوده', '`claude` (افتراضي، يُغيَّر بـ `CLAUDE_CLI_PATH`)'],
          ['مجلد مشاريع Claude', '`/root/.claude/projects`'],
          ['ملف الإعداد', '`/usr/lib/node_modules/@cloudcli-ai/cloudcli/.env`'],
        ],
      },
      { type: 'h3', id: 'run', text: 'التشغيل' },
      {
        type: 'code',
        lang: 'bash',
        code: `cloudcli                  # تشغيل بالإعدادات الافتراضية (بورت 3001)
cloudcli --port 8080      # بورت مخصص
cloudcli status           # فحص الإعداد وأماكن البيانات
cloudcli update           # التحديث لآخر إصدار`,
      },
      {
        type: 'table',
        caption: 'متغيرات البيئة المدعومة',
        head: ['المتغير', 'الوظيفة', 'الافتراضي'],
        rows: [
          ['`SERVER_PORT` / `PORT`', 'بورت السيرفر', '`3001`'],
          ['`DATABASE_PATH`', 'مكان قاعدة البيانات', '`~/.cloudcli/auth.db`'],
          ['`CLAUDE_CLI_PATH`', 'أمر Claude الذي يقوده', '`claude`'],
          ['`CONTEXT_WINDOW`', 'حجم نافذة السياق', '`160000`'],
        ],
      },
      { type: 'p', text: 'التوثيق الرسمي: [cloudcli.ai](https://cloudcli.ai)' },

      { type: 'h2', id: 'connect', text: 'الجزء الثاني: ربط الوكلاء الثلاثة' },
      { type: 'p', text: 'هنا جوهر الموضوع: ثلاث أدوات مختلفة، كل واحدة مربوطة بطريقتها.' },
      { type: 'h3', id: 'connect-claude', text: 'الربط الأول: Claude Code — يقوده CloudCLI مباشرة' },
      {
        type: 'p',
        text: 'العلاقة هنا **قيادة مباشرة**: CloudCLI يشغّل أمر `claude` نفسه (حسب `CLAUDE_CLI_PATH`) ويعرض جلساته في واجهة الويب، ويقرأ مشاريعه من `~/.claude/projects`.',
      },
      { type: 'p', text: 'أما مصادقة Claude Code نفسها فهي **اشتراك Pro عبر OAuth** (وليس مفتاح API):' },
      {
        type: 'ul',
        items: [
          'الدليل: `~/.claude/.credentials.json` فيه `claudeAiOauth` مع `subscriptionType: pro`.',
          'الطلبات تذهب مباشرة إلى أنثروبيك بموديلات `opus` / `sonnet` الأصلية.',
          'الإعداد الرئيسي: `~/.claude/settings.json` — وأهم ما فيه:',
        ],
      },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "model": "opus",
  "language": "arabic"
}`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'قاعدة ذهبية تعلّمناها بالتجربة',
        items: [
          'لا تصدّر `ANTHROPIC_BASE_URL` نحو أي بوابة خارجية في ملفات الشل (`~/.bashrc` / `~/.zshrc`)، لأن هذا يحوّل Claude Code من اشتراك Pro إلى بوابة مدفوعة بالتوكن.',
          'ملف `~/.config/openrouter/env.sh` مصمّم بوعي بحيث يصدّر `OPENROUTER_API_KEY` فقط ولا يمس `ANTHROPIC_*` — وهذا تصميم مقصود وليس نقصاً.',
        ],
      },
      { type: 'h3', id: 'connect-codex', text: 'الربط الثاني: Codex — يستهلك browser-use من CloudCLI عبر MCP' },
      { type: 'p', text: 'Codex مربوط من جهتين. **أ) مزوّد النموذج (بوابة ccpro)** في `~/.codex/config.toml`:' },
      {
        type: 'code',
        lang: 'toml',
        code: `model_provider = "JY"

[model_providers.JY]
name = "JY"
base_url = "https://api.ccpro.cn/v1"
wire_api = "responses"
env_key = "OPENAI_API_KEY"
requires_openai_auth = true

model = "gpt-5.5"`,
      },
      {
        type: 'p',
        text: 'أي أن Codex يتحدث بروتوكول OpenAI-compatible مع بوابة `api.ccpro.cn`، والمفتاح يُقرأ من متغير البيئة `OPENAI_API_KEY` — وليس مخزناً كنص في الملف، وهذه ممارسة صحيحة.',
      },
      { type: 'p', text: '**ب) سيرفر browser-use من CloudCLI** في نفس الملف `config.toml`:' },
      {
        type: 'code',
        lang: 'toml',
        code: `[mcp_servers.cloudcli-browser]
command = "/usr/bin/node"
args = [
  "/usr/lib/node_modules/@cloudcli-ai/cloudcli/dist-server/server/modules/browser-use/browser-use-mcp.js"
]

  [mcp_servers.cloudcli-browser.env]
  CLOUDCLI_BROWSER_USE_MCP_TOKEN = "<ضع-التوكن-هنا>"
  CLOUDCLI_BROWSER_USE_API_URL = "http://127.0.0.1:3001/api/browser-use-mcp"`,
      },
      {
        type: 'p',
        text: 'لاحظ السلسلة: Codex ← (stdio عبر node) ← سكربت `browser-use-mcp.js` ← (HTTP محلي) ← سيرفر CloudCLI على `127.0.0.1:3001`. هذا السكربت يعمل فعلياً كعملية (`ps` يُظهره)، أي أن الربط حي وليس نظرياً.',
      },
      {
        type: 'ol',
        items: [
          'ثبّت CloudCLI ([الجزء الأول](#install)) وشغّل السيرفر على `3001`.',
          'انسخ كتلة `[mcp_servers.cloudcli-browser]` أعلاه إلى `~/.codex/config.toml`.',
          'ضع التوكن الحقيقي (يُستخرج من واجهة CloudCLI) مكان العنصر النائب.',
          'أعد تشغيل Codex — سيظهر سيرفر `cloudcli-browser` في قائمة MCP.',
        ],
      },
      { type: 'h3', id: 'connect-opencode', text: 'الربط الثالث: OpenCode — OpenRouter للموديلات + browser-use من CloudCLI' },
      { type: 'p', text: 'OpenCode مربوط من جهتين أيضاً. **أ) مزوّد النموذج الافتراضي (OpenRouter)** في `~/.config/opencode/opencode.jsonc`:' },
      {
        type: 'code',
        lang: 'jsonc',
        code: `{
  "$schema": "https://opencode.ai/config.json",
  "model": "openrouter/anthropic/claude-sonnet-5",
  "provider": {
    "openrouter": {
      "options": {
        "baseURL": "https://openrouter.ai/api/v1",
        "apiKey": "<ضع-مفتاح-OpenRouter-هنا>"
      },
      "models": {
        "anthropic/claude-sonnet-5": { "name": "Claude Sonnet 5", "...": "..." },
        "anthropic/claude-opus-5":   { "name": "Claude Opus 5",   "...": "..." },
        "anthropic/claude-haiku-4.5": { "name": "Claude Haiku 4.5", "...": "..." }
      }
    }
  }
}`,
      },
      {
        type: 'p',
        text: '**ب) سيرفر browser-use من CloudCLI:** ضمن كتلة `"mcp"` في نفس الملف يوجد مدخل `cloudcli-browser` (بنفس فكرة Codex: سكربت node + عنوان `127.0.0.1:3001`)، إلى جانب ~25 سيرفر MCP آخر ([الجزء الخامس](#mcp)).',
      },
      {
        type: 'ol',
        items: [
          'ثبّت OpenCode وأنشئ `~/.config/opencode/opencode.jsonc`.',
          'أضف كتلة `provider.openrouter` بمفتاحك.',
          'أضف مدخل `cloudcli-browser` تحت كتلة `"mcp"` بنفس نمط باقي السيرفرات.',
          'ملف `opencode.jsonc` يقبل التعليقات (`//`) — استغلّها لتوثيق كل سيرفر.',
        ],
      },
      { type: 'h3', id: 'compare', text: 'جدول المقارنة السريع' },
      {
        type: 'table',
        head: ['الأداة', 'مصادقة النموذج', 'دور CloudCLI معها'],
        rows: [
          ['Claude Code', 'Pro OAuth مباشر لأنثروبيك', '**قيادة**: يشغّل `claude` ويعرضه ويب'],
          ['Codex', 'بوابة ccpro عبر `OPENAI_API_KEY`', '**خدمة**: يستهلك `browser-use` عبر MCP'],
          ['OpenCode', 'OpenRouter عبر `opencode.jsonc`', '**خدمة**: يستهلك `browser-use` عبر MCP'],
        ],
      },

      { type: 'h2', id: 'skills', text: 'الجزء الثالث: المهارات (Skills)' },
      { type: 'h3', id: 'what-is-skill', text: 'ما هي المهارة؟' },
      {
        type: 'p',
        text: 'المهارة مجلد فيه ملف `SKILL.md` يبدأ بترويسة `name` و `description`، ثم تعليمات مفصلة. الوكيل **يحمّلها فقط عندما تطابق المهمة وصفها** — أي أنها توسعة قدرات عند الطلب. القاعدة: مهارة واحدة للمهمة المطابقة، ولا تحمّل ما لا تحتاج.',
      },
      {
        type: 'table',
        caption: 'أماكن المهارات — نفس المكتبة مكررة لتصل لكل أداة',
        head: ['المسار', 'يخدم'],
        rows: [
          ['`~/.config/opencode/skill/`', 'OpenCode (~90 مهارة)'],
          ['`~/.claude/skills/`', 'Claude Code (~90 مهارة)'],
          ['`~/.codex/skills/`', 'Codex (~90 مهارة)'],
          ['`~/.agents/skills/`', 'مكتبة مشتركة (مثل `agent-reach` و `android-kotlin`)'],
        ],
      },
      { type: 'h3', id: 'key-skills', text: 'أهم المهارات المستخدمة هنا' },
      {
        type: 'table',
        caption: 'مهارات البنية والذاكرة',
        head: ['المهارة', 'الوظيفة'],
        rows: [
          ['`error-memory`', 'ذاكرة أخطاء دائمة في SQLite — تحفظ كل خطأ مع إصلاحه حتى لا يتكرر. تُستدعى في بداية الجلسات وعند أي خطأ جديد'],
          ['`codebase-memory`', 'رسم معرفي (Knowledge Graph) للكود: من ينادي من، تتبع الاستدعاءات، تحليل الأثر قبل التعديل'],
          ['`agent-reach`', '**بوابة الإنترنت**: بحث ويب، جلب صفحات، GitHub، يوتيوب، RSS — لأي بحث خارجي'],
          ['`agent-handoff-protocol`', 'بروتوكول تمرير السياق بين الوكلاء عند تفويض المهام'],
          ['`advisor-orchestrator-worker`', 'تقسيم المهام الضخمة على فريق وكلاء (مستشار + عمّال) بالتوازي'],
          ['`cli-hub-meta-skill`', 'اكتشاف وتثبيت أدوات CLI جاهزة للوكلاء ذاتياً (`cli-hub search/install`)'],
          ['`model-router`', 'توجيه المهام للموديل الأنسب: رخيص للسهل، قوي للمعقد'],
        ],
      },
      {
        type: 'table',
        caption: 'مهارات الأمن السيبراني — التخصص الأبرز في هذه البيئة',
        head: ['المهارة', 'الوظيفة'],
        rows: [
          ['`violin-pentest`', 'اختبار اختراق مُشرَف ومصرّح به: دورة كاملة (نطاق ← استطلاع ← ثغرات ← استغلال ← تقرير)، و35 مسرحية لكل أصناف الثغرات'],
          ['`cyberintel`', 'قاعدة استخبارات سيبرانية محلية (CVE/KEV/تقنيات هجوم) + سكربت تحديث يومي'],
          ['`kali-pentest`', 'تنفيذ الاختبار عبر أدوات Kali (SSH/Docker): جمع معلومات، تحليل ثغرات، اختبار ويب و API'],
          ['`lite-pentest-toolkit`', 'عدة الاستطلاع على الجهاز نفسه (nmap بصيغة آمنة بدون root، subfinder، nuclei، sqlmap…)'],
          ['`ondevice-llm-redteam`', 'تشغيل نماذج صغيرة محلياً (llama.cpp) واختبار قيودها بدون سحابة'],
          ['`llm-restriction-bypass`', 'منهجيات اختبار قيود الـ LLM في نطاق مصرّح به (للريد تيم)'],
          ['`skill-inspector`', '**فاحص أمان المهارات**: يفحص أي مهارة قبل تثبيتها (تحليل ثابت + مراجعة دلالية) ويحكم `APPROVE/CAUTION/REJECT`'],
          ['`finding-triage`', 'فرز نتائج فحص Hacktron (إيجابي حقيقي/كاذب) ثم إصلاح أو قبول مخاطرة'],
          ['`patch-diff-analyzer`', 'تحليل الفروق بين نسخ البرامج المجمّعة لاكتشاف الإصلاحات الأمنية'],
          ['`hacktron-supply-chain`', 'فحص سلاسل الإمداد (npm/PyPI) ضد قاعدة البرمجيات الخبيثة — مجاني وبدون مفتاح'],
          ['`owasp-top-10` · `api-security` · `security-auditor` · `vulnerability-scanning` · `container-security` · `cryptography-patterns` · `secret-management` · `supply-chain-defense` · `zero-trust-architecture` · `guardrails-alignment` · `incident-response`', 'منظومة الدفاع: أنماط الوقاية، تدقيق الحاويات والأسرار والتشفير، والاستجابة للحوادث'],
        ],
      },
      {
        type: 'table',
        caption: 'مهارات التطوير',
        head: ['المهارة', 'الوظيفة'],
        rows: [
          ['`android-build`', 'بناء APK واختبار مشاريع أندرويد على arm64 (إصلاح aapt2، تشخيص البناء، تثبيت عبر ADB)'],
          ['`mobile-automation`', 'التحكم بالأجهزة (نقر/سحب/لقطات/شجرة الوصول) عبر Mobile Next MCP'],
          ['`api-designer` · `api-testing` · `business-logic` · `identity-auth` · `web-app` · `misconfig` · `llm-security` · `pentest`', 'تصميم واختبار الـ APIs والهوية ومنطق الأعمال (مرافقة لمسرحيات violin)'],
          ['`planning-reasoning` · `tool-use-patterns` · `memory-management` · `observability-tracing` · `workflow-templates`', 'هندسة الوكلاء أنفسهم: تخطيط، تنسيق أدوات، ذاكرة، تتبع'],
          ['`professional-code-gen` · `design-patterns` · `tech-stacks` · `architecture-designer` · `system-design`', 'معايير توليد الكود الاحترافي واختيار التقنيات'],
          ['`payment-integration` · `realtime-communication` · `caching-strategies` · `background-jobs` · `search-implementation` · `file-processing` · `data-visualization` · `web-scraping-patterns` · `extensions-development` · `desktop-app-patterns` · `cross-platform` · `build-systems` · `build-configuration` · `cli-development` · `database-designer` · `state-management` · `form-validation`', 'مهارات تنفيذية لكل طبقات التطبيق'],
        ],
      },
      {
        type: 'table',
        caption: 'مهارات المحتوى والسيو',
        head: ['المهارة', 'الوظيفة'],
        rows: [
          ['`seo-audit` · `seo-coach` · `seo-project-setup` · `seo-report` · `keyword-research` · `keyword-clustering` · `competitor-analysis` · `competitive-landscape` · `link-prospecting` · `local-seo`', 'منظومة سيو كاملة: تدقيق، كلمات مفتاحية، منافسون، تقارير HTML'],
          ['`arabic-expert`', 'تحسين المحتوى العربي وصياغته'],
          ['`deslop`', 'إزالة بصمات الكتابة الآلية من النصوص لتبدو بشرية'],
          ['`first-reader` · `thinking-out-loud` · `directing-stickman-videos` · `brag` · `pdfcn` · `leetcode-helper` · `project-graveyard` · `commit-archaeologist` · `scope-creep-detector` · `dependency-doctor`', 'مهارات مساندة: مراجعة المسودات، فيديوهات، PDF، خوارزميات، تشريح المشاريع الميتة'],
        ],
      },
      { type: 'h3', id: 'add-skill', text: 'كيف تضيف مهارة جديدة؟' },
      { type: 'p', text: '**الطريقة 1 — من مستودع (الأسهل):**' },
      {
        type: 'code',
        lang: 'bash',
        code: `npx skills add <owner>/<repo>               # مثال: npx skills add vercel-labs/agent-skills
npx skills add <owner>/<repo> -a opencode   # لأوبن كود تحديداً
npx skills find <keyword>                   # بحث عن مهارة`,
      },
      { type: 'p', text: '**الطريقة 2 — يدوياً:** انسخ المجلد للمسارات الثلاثة لتصل لكل الأدوات.' },
      {
        type: 'code',
        lang: 'bash',
        code: `SKILL=my-skill
cp -r ./$SKILL ~/.config/opencode/skill/$SKILL
cp -r ./$SKILL ~/.claude/skills/$SKILL
cp -r ./$SKILL ~/.codex/skills/$SKILL`,
      },
      { type: 'p', text: '**الطريقة 3 — اكتب مهارتك:** أنشئ مجلداً فيه `SKILL.md` يبدأ بـ:' },
      {
        type: 'code',
        lang: 'markdown',
        code: `---
name: my-skill
description: ماذا تفعل ومتى تُستخدم (سطر واحد دقيق — هذا ما يقرر التحميل)
---
# تعليمات مفصلة...`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'قاعدة أمنية',
        items: [
          'قبل تثبيت أي مهارة خارجية، افحصها بمهارة `skill-inspector`.',
          'المهارات كود يُنفَّذ بصلاحياتك.',
        ],
      },

      { type: 'h2', id: 'agents', text: 'الجزء الرابع: الوكلاء (Agents)' },
      { type: 'h3', id: 'skill-vs-agent', text: 'الفرق بين المهارة والوكيل' },
      {
        type: 'ul',
        items: [
          '**المهارة** = معرفة تُحمَّل: كيف تفعل شيئاً.',
          '**الوكيل** = عامل مستقل يُفوَّض له: من ينفّذ مهمة كاملة بأدواته.',
        ],
      },
      { type: 'h3', id: 'agents-inventory', text: 'ما لدينا فعلياً' },
      {
        type: 'table',
        head: ['المكان', 'العدد', 'أمثلة'],
        rows: [
          ['`~/.config/opencode/agent/`', '**~238 وكيلاً**', '`security` · `debugger` · `code-reviewer` · `penetration-tester` · `frontend` · `backend` · `architect` · `mobile` · `devops` · `llm-redteam` · `web-hunter` · `api-security` · `forensics-analyst` · `threat-modeler` … مكتبة تغطي كل تخصص: أمن، تطوير، سحابة، بيانات، موبايل، CTF، OSINT'],
          ['`~/.claude/agents/`', '4 مخصصون', '`codebase-memory` + `codebase-memory-scout` + `codebase-memory-auditor` (ثلاث طبقات لاستكشاف الكود) و `opencrabs`'],
          ['`~/.codex/agents/`', '3 (بصيغة toml)', '`codebase-memory` · `codebase-memory-scout` · `codebase-memory-auditor`'],
          ['`~/.codex/AGENTS.md`', '—', 'تعليمات عامة للوكلاء في مشاريع Codex'],
        ],
      },
      { type: 'h3', id: 'add-agent', text: 'كيف تضيف وكيلاً؟' },
      {
        type: 'ul',
        items: [
          '**في OpenCode:** أنشئ ملف `~/.config/opencode/agent/my-agent.md` (يُكتشف تلقائياً)، ثم استدعه من المحادثة.',
          '**في Codex:** أنشئ ملف `~/.codex/agents/my-agent.toml` بنفس نمط الموجود.',
          '**في Claude Code:** أنشئ ملف `~/.claude/agents/my-agent.md`.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'نصيحة من التجربة',
        items: [
          'لا تنشئ وكيلاً جديداً لما تفعله مهارة موجودة.',
          'الوكلاء للمهام المستقلة متعددة الخطوات، والمهارات للمعرفة المتخصصة.',
        ],
      },

      { type: 'h2', id: 'mcp', text: 'الجزء الخامس: سيرفرات MCP' },
      { type: 'h3', id: 'what-is-mcp', text: 'ما هو MCP؟' },
      {
        type: 'p',
        text: 'بروتوكول يمنح الوكيل **أدوات خارجية** (متصفح، ملفات، قواعد بيانات، بحث…) عبر سيرفرات محلية أو عناوين HTTP. كل سيرفر = عملية مستقلة = استهلاك ذاكرة — وهذه الملاحظة تقودنا لفكرة `mcp-idle` في [الجزء السادس](#plugins).',
      },
      { type: 'h3', id: 'mcp-inventory', text: 'سيرفرات MCP المستخدمة هنا' },
      {
        type: 'table',
        caption: 'جرد فعلي — سيرفرات مشتركة بين Codex و OpenCode و Claude Code',
        head: ['السيرفر', 'الوظيفة'],
        rows: [
          ['`cloudcli-browser`', 'تحكّم المتصفح عبر CloudCLI (نقطة الربط — [الجزء الثاني](#connect))'],
          ['`codebase-memory-mcp`', 'الرسم المعرفي للكود (`/root/.local/bin/codebase-memory-mcp`) — مربوط أيضاً كـ hooks في Claude و Codex'],
          ['`bytez`', 'كتالوج الموديلات والتوثيق (HTTP: `https://docs.bytez.com/mcp`)'],
          ['`playwright`', 'أتمتة المتصفح واختبار E2E'],
          ['`filesystem`', 'قراءة/كتابة الملفات المحلية'],
          ['`sqlite`', 'استعلام قواعد SQLite المحلية'],
          ['`memory`', 'ذاكرة key-value دائمة بين الجلسات'],
          ['`fetch`', 'طلبات HTTP للـ APIs'],
          ['`sequential-thinking`', 'تفكير خطوة بخطوة للمسائل المعقدة'],
          ['`excel`', 'معالجة جداول Excel'],
          ['`context7`', 'توثيق المكتبات والأطر (يُستخدم أولاً لأي سؤال API)'],
          ['`hacktron`', 'مراجعات أمنية (مهندس أمن AI عبر HTTPS)'],
          ['`mobile-mcp` / `mobile-next`', 'أتمتة أجهزة أندرويد و iOS'],
          ['`mcpandroidbuild` + `android-builder`', 'بناء واختبار مشاريع أندرويد (Gradle) على arm64'],
          ['`scrapling` / `scrapegraph`', 'كشط الويب واستخراج البيانات'],
          ['`puppeteer`', 'محرك متصفح بديل'],
          ['`brave-search`', 'بحث ويب بديل (يحتاج `BRAVE_API_KEY`)'],
          ['`stash`', 'قاعدة معرفة مشتركة بين الجلسات'],
          ['`openknowledge`', 'قاعدة معرفة مفتوحة'],
        ],
      },
      {
        type: 'table',
        caption: 'أماكن تعريفها',
        head: ['الأداة', 'ملف التعريف'],
        rows: [
          ['Codex', '`~/.codex/config.toml` تحت `[mcp_servers.*]`'],
          ['OpenCode', '`~/.config/opencode/opencode.jsonc` تحت كتلة `"mcp"`'],
          ['Claude Code', '`~/.claude.json` تحت `mcpServers`'],
        ],
      },
      { type: 'h3', id: 'add-mcp', text: 'كيف تضيف سيرفر MCP؟' },
      { type: 'p', text: '**في Codex (`~/.codex/config.toml`) — سيرفر محلي:**' },
      {
        type: 'code',
        lang: 'toml',
        code: `[mcp_servers.my-server]
command = "/usr/bin/node"
args = ["/path/to/server.js"]
env_vars = []`,
      },
      { type: 'p', text: '**في Codex — سيرفر HTTP:**' },
      {
        type: 'code',
        lang: 'toml',
        code: `[mcp_servers.my-server]
type = "http"
url = "https://example.com/mcp"`,
      },
      { type: 'p', text: '**في OpenCode (`opencode.jsonc`) — سيرفر محلي:**' },
      {
        type: 'code',
        lang: 'jsonc',
        code: `"mcp": {
  "my-server": {
    "type": "local",
    "command": ["/usr/bin/node", "/path/to/server.js"],
    "enabled": true
  }
}`,
      },
      { type: 'p', text: '**في Claude Code:** عبر أمر `claude mcp add <name> -- <command...>` أو تحرير `~/.claude.json`.' },
      {
        type: 'callout',
        tone: 'warn',
        title: 'تحذير الذاكرة',
        items: [
          'كل سيرفر محلي عملية node تكلّف 50–115MB.',
          'على أندرويد هذا يقتل الجلسة (LMKD) — الحل: `mcp-idle` في [الجزء السادس](#plugins).',
        ],
      },

      { type: 'h2', id: 'plugins', text: 'الجزء السادس: الإضافات والبلجنز والأوامر' },
      { type: 'h3', id: 'claude-plugins', text: 'إضافات Claude Code (Marketplaces)' },
      { type: 'p', text: 'المثبتة فعلياً في `~/.claude/plugins/marketplaces` والمفعّلة في `settings.json`:' },
      {
        type: 'table',
        head: ['الإضافة', 'المصدر', 'الوظيفة'],
        rows: [
          ['`ponytail`', '`DietrichGebert/ponytail`', 'إضافات إنتاجية لجلسات Claude'],
          ['`caveman`', '`JuliusBrussee/caveman`', 'نمط عمل بدائي/مباشر'],
          ['`ops-marketplace`', '`Lifecycle-Innovations-Limited/claude-ops`', 'عمليات وتشغيل'],
          ['`taste-skill`', '`Leonxlnx/taste-skill`', 'مهارات ذوق وتصميم'],
          ['`impeccable`', '`pbakaus/impeccable`', 'جودة ودقة المخرجات'],
          ['`lmnr`', '`lmnr-ai/lmnr-claude-code-plugin`', 'مراقبة وتتبع (Laminar)'],
          ['`claude-plugins-official`', 'السوق الرسمي', 'إضافات أنثروبيك الرسمية'],
        ],
      },
      { type: 'p', text: 'تُدار من `settings.json` عبر `enabledPlugins` و `extraKnownMarketplaces`.' },
      { type: 'h3', id: 'opencode-plugins', text: 'بلجنز OpenCode العالمية' },
      { type: 'p', text: 'في `~/.config/opencode/plugin/`، وتعمل تلقائياً لكل الوكلاء والموديلات:' },
      {
        type: 'table',
        head: ['البلجن', 'الوظيفة'],
        rows: [
          ['`mcp-idle.ts`', '**الأهم**: يُوقف سيرفرات MCP المحلية افتراضياً (توفير ~300MB + تجنب القتل من أندرويد). الإيقاظ بـ `mcp-idle on <name>` ثم إعادة تشغيل opencode'],
          ['`memory-rotate.ts`', 'تدوير أسبوعي لقاعدة `opencode.db` (يحتفظ بآخر يوم عمل فقط) حتى لا تتضخم الذاكرة'],
        ],
      },
      {
        type: 'p',
        text: 'الأوامر: `mcp-idle status/doctor/on/off` و `memory-rotate status/dry-run` — ولها أوامر سلاش `/mcp-status` و `/mcp-on` و `/mcp-off` و `/mcp-idle` و `/memory-rotate`.',
      },
      { type: 'h3', id: 'opencode-commands', text: 'أوامر OpenCode الجاهزة (21 أمراً)' },
      { type: 'p', text: 'في `~/.config/opencode/command/` — أهمها:' },
      {
        type: 'table',
        head: ['الأمر', 'الوظيفة'],
        rows: [
          ['`/mcp-status` `/mcp-on` `/mcp-off`', 'إدارة سيرفرات MCP'],
          ['`/skillspector`', 'فحص أمان مهارة قبل تثبيتها'],
          ['`/cli-anything` (+ `list/refine/test/validate`)', 'تحويل أي برنامج GUI إلى CLI للوكلاء'],
          ['`/stickman-video`', 'تحويل نص إلى فيديو stickman (مع `HARNESS.md` المنهجي)'],
          ['`/brag`', 'تحويل المشروع إلى فيديو إطلاق قابل للمشاركة'],
          ['`/cyber-search` `/cyber-update`', 'البحث والتحديث في الاستخبارات السيبرانية'],
          ['`/recommend`', 'توصيات تقنية'],
        ],
      },

      { type: 'h2', id: 'ops', text: 'الجزء السابع: نصائح تشغيلية من أرض الواقع' },
      { type: 'h3', id: 'proot-socket', text: 'مشكلة cross-session messaging في PRoot' },
      { type: 'p', text: '**العرض:** عند بدء `claude` تظهر رسالة:' },
      {
        type: 'code',
        lang: 'text',
        code: `Cross-session messaging is off: its socket directory could not be set up:
this process runs in a user namespace without a uid mapping...`,
      },
      {
        type: 'p',
        text: '**السبب:** PRoot بلا uid mapping — العملية تظهر كـ overflow uid، فيرفض Claude ربط `/tmp/cc-socks` لتعذّر التحقق من الملكية.',
      },
      { type: 'p', text: '**الحل المثبت هنا (يعمل من أول مرة):**' },
      {
        type: 'code',
        lang: 'bash',
        code: `mkdir -m 700 -p ~/.claude-socks
# ثم شغّل claude دائماً بهذا الفلاج المخفي:
claude --messaging-socket-path ~/.claude-socks/claude.sock`,
      },
      {
        type: 'p',
        text: 'ملاحظتان من التجربة: الفلاج يأخذ **مسار ملف** (وليس مجلداً)، والمجلد الأب يجب أن يكون `700`. ولجعله دائماً أضفنا إلى `~/.bashrc` و `~/.zshrc`:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `alias claude='claude --messaging-socket-path "$HOME/.claude-socks/claude.sock"'`,
      },
      { type: 'h3', id: 'openrouter-402', text: 'مشكلة تحويل Claude Code إلى OpenRouter' },
      {
        type: 'ul',
        items: [
          '**العرض:** خطأ `402 ... openrouter.ai ... adjust the key\'s total limit` رغم وجود اشتراك Pro.',
          '**السبب:** اختيار موديل بصيغة بوابة (`anthropic/z-ai/glm-5.3`) بدل موديل أنثروبيك الأصلي — فيذهب الطلب إلى OpenRouter بمفتاح فارغ.',
          '**الحل:** حذف مدخل البوابة من `modelSettings` في `~/.claude/settings.json`، والإبقاء على `"model": "opus"`، ثم اختيار Opus أو Sonnet بأمر `/model` داخل الجلسة.',
        ],
      },
      { type: 'h3', id: 'keys', text: 'إدارة المفاتيح بأمان' },
      {
        type: 'ul',
        items: [
          'المفاتيح في ملفات بصلاحيات `600` (مثل `~/.config/openrouter/env.sh`)، وتُحمَّل من `~/.bashrc`/`~/.zshrc` — ولا تُكتب أبداً كنص في ملفات الإعداد المشاركة.',
          '`auth.json` الخاص بـ Codex يبقى فارغاً من الأسرار؛ المفتاح يأتي من متغير البيئة (`OPENAI_API_KEY`، `BYTEZ_API_KEY`…).',
          'قبل أي `commit`: راجع `git status` و `git diff`، ولا ترفع أسراراً أبداً.',
        ],
      },
      { type: 'h3', id: 'maintenance', text: 'عادات الصيانة' },
      {
        type: 'ul',
        items: [
          '**نسخ احتياطية:** انسخ ملف الإعداد قبل أي تعديل كبير (`cp config.toml config.toml.bak-$(date +%F)`).',
          '**الذاكرة على أندرويد:** أبقِ سيرفرات MCP الخاملة نائمة (`mcp-idle off-all` بعد المهمة)، ولا تشغّل `opencode web` بجانب الـ TUI — يضاعف البصمة ~300MB.',
          '**ذاكرة الأخطاء:** قبل أي عملية خطرة اسأل قاعدة `~/.local/share/opencode/errors.db`، وبعد كل إصلاح جديد احفظه فيها — هكذا تتراكم خبرة البيئة بدل أن تضيع.',
        ],
      },

      { type: 'h2', id: 'checklist', text: 'قائمة تحقق نهائية' },
      {
        type: 'checklist',
        items: [
          '`cloudcli status` يعمل ويعرض قاعدة البيانات والمشاريع',
          'سيرفر CloudCLI على `3001` وسكربت `browser-use-mcp.js` يعمل (`ps`)',
          '`~/.codex/config.toml` فيه `model_provider` + كتلة `cloudcli-browser` بالتوكن الصحيح',
          '`~/.config/opencode/opencode.jsonc` فيه المزوّد + مدخل `cloudcli-browser` تحت `"mcp"`',
          'Claude Code بمصادقة Pro (`/status`) والموديل `opus` عبر `/model`',
          'لا يوجد `ANTHROPIC_BASE_URL` في ملفات الشل',
          'alias الـ `claude` مع `messaging-socket-path` في الشل المستخدم',
          'المهارات منسوخة للمسارات الثلاثة (أو مثبتة عبر `npx skills`)',
          'أي مهارة خارجية مفحوصة بـ `skill-inspector`',
          'نسخ `.bak` قبل تعديل ملفات الإعداد',
        ],
      },
      {
        type: 'quote',
        text: 'وُثّق من بيئة حقيقية عاملة — حدّث الأرقام (الإصدارات والمسارات) كلما غيّرت شيئاً، فالدليل الجيد حي يتطور مع البيئة.',
      },
    ],
  "edms-archive-pro": [
    edmsDownload,
    {
      type: 'p',
        text: '**أرشيف برو (EDMS Pro)** نظام إدارة وثائق إلكترونية مبني كخادم مركزي على جهاز مخصَّص. المستخدمون لا يدخلون إلى الملفات مباشرة — بل إلى خادم يقدّم لهم واجهة عبر المتصفح و HTTPS.',
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'تحميل مباشر',
        items: [
          '**الإصدار:** 1.0.0 — بنية Windows x64.',
          'حزمة NSIS واحدة. لا توجد نسخة محمولة على USB ولا ملف ZIP.',
          'اقرأ [ملاحظات التوقيع الرقمي](#unsigned) قبل التشغيل.',
        ],
      },
      {
        type: 'p',
        text:       `**رابط التحميل:** ${edmsFile.href}`,
      },
      {
        type: 'table',
        caption: 'بطاقة تعريف المنتج',
        head: ['البند', 'القيمة'],
        rows: [
          ['اسم المنتج', 'EDMS Pro / أرشيف برو'],
          ['الإصدار', '1.0.0'],
          ['معرّف التطبيق', '`sa.edms.archive.pro`'],
          ['اسم الملف التنفيذي', '`edms-archive-pro`'],
          ['قاعدة البيانات', 'SQLite (ملف واحد على قرص الخادم)'],
          ['بنية التثبيت', 'Windows x64 (NSIS)'],
        ],
      },

      { type: 'h2', id: 'architecture', text: 'بنية التشغيل' },
      {
        type: 'p',
        text: 'القرار المعماري الأهم: **الخادم مستقل تماماً عن واجهة الاستخدام**. النظام يعمل على جهاز مخصَّص، ولوحة Electron محلية لإدارة الخادم وتشغيله، بينما يصل المستخدمون من أجهزتهم عبر المتصفح.',
      },
      {
        type: 'ul',
        items: [
          '**قاعدة البيانات SQLite** — ملف واحد على قرص الخادم، بلا خادم قاعدة بيانات منفصل يحتاج تثبيتاً أو إدارة.',
          'يُربط الخادم على `0.0.0.0` والمنفذ قابل للتهيئة عبر `EDMS_PORT`.',
          'تُخزَّن الملفات وملف قاعدة البيانات على قرص الخادم فقط.',
          '**لا يصل العملاء مباشرة إلى قاعدة البيانات ولا إلى مجلد التخزين** — كل شيء يمرّ عبر طبقة الصلاحيات.',
          'إعدادات الخادم السرّية في `userData/pro.env` خارج المثبّت.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'لماذا SQLite؟',
        items: [
          '**لا خادم قاعدة بيانات منفصل:** المثبّت وحده يكفي، ولا حاجة لتثبيت محرك آخر أو إدارته.',
          'القاعدة كلها ملف واحد، فالنسخ الاحتياطي والنقل إلى جهاز آخر أبسط.',
          'SQLite يسمح بكاتب واحد في اللحظة نفسها، وهذا يناسب خادماً مركزياً واحداً تمرّ عبره كل الطلبات.',
        ],
      },
      { type: 'h2', id: 'search', text: 'البحث والفهرسة' },
      {
        type: 'p',
        text: 'بحث نصي كامل عبر **SQLite FTS5**. الفهرسة تشمل العنوان والوصف ونص **OCR** والكلمات المفتاحية ورقم المستند.',
      },
      {
        type: 'code',
        lang: 'sql',
        code: `-- أدوات FTS5 في الفهرسة والاستعلام
fts5       -- جدول فهرسة نصية افتراضي (virtual table)
MATCH      -- استعلام البحث بالكلمات
"عبارة"    -- مطابقة عبارة كاملة بين علامتي تنصيص
كلمة*      -- البحث ببادئة الكلمة
bm25()     -- ترتيب النتائج حسب الصلة`,
      },
      {
        type: 'p',
        text: 'FTS5 مدمج في SQLite نفسه: الفهرس يعيش في ملف القاعدة ذاته، فلا خدمة بحث منفصلة تحتاج تشغيلاً أو مزامنة.',
      },
      { type: 'h2', id: 'documents', text: 'إدارة الوثائق والإصدارات' },
      {
        type: 'p',
        text: 'كل رفع يجري داخل **transaction واحدة** — إما أن يُعتمد الملف كاملاً أو لا يُعتمد. لا توجد حالة نصفية في القاعدة.',
      },
      {
        type: 'ul',
        items: [
          'التحقق من النوع والحجم و**التوقيع السحري للملف** (magic bytes) — لا يُوثق بالامتداد.',
          'فحص malware قبل اعتماد الملف.',
          'معالجة OCR في الخلفية مع إمكانية إعادة المحاولة.',
          'حذف ناعم مع سلة محذوفات.',
          'تنزيل وتصدير جماعي مع حماية الصلاحيات.',
        ],
      },
      { type: 'h3', id: 'versions', text: 'سجل إصدارات غير قابل للاستبدال' },
      {
        type: 'p',
        text: 'كل وثيقة لها سجل إصدارات لا يُستبدل. لكل إصدار رقم فريد، ولا يمكن حذف تاريخ.',
      },
      {
        type: 'checklist',
        items: [
          'رقم إصدار فريد داخل كل مستند',
          'رفع وتنزيل الإصدارات السابقة',
          'استعادة نسخة قديمة دون حذف التاريخ',
          'عرض الرافع والتاريخ والحجم والملاحظات',
          'عرض فرق الحجم بين الإصدارات',
        ],
      },
      { type: 'h2', id: 'workflow', text: 'الموافقات وسير العمل' },
      {
        type: 'p',
        text: 'قوالب سير عمل متعددة الخطوات، مع إسناد كل خطوة إلى مستخدم أو دور، ومهل زمنية قابلة للضبط.',
      },
      {
        type: 'ul',
        items: [
          'طلبات موافقة: قبول أو رفض مع تعليق.',
          'إشعارات داخل التطبيق مع سجل تدقيق كامل.',
          'دعم الإرجاع إلى الخطوة السابقة عند الرفض.',
          '**سجل أحداث متسلسل** لكل Workflow — يسلسله زمنياً.',
        ],
      },
      { type: 'h2', id: 'security', text: 'الأمان والهوية' },
      {
        type: 'p',
        text: 'طبقات المصادقة والتفويض في النظام:',
      },
      {
        type: 'table',
        head: ['الطبقة', 'التنفيذ'],
        rows: [
          ['الجلسات', 'مخزّنة في قاعدة البيانات وقابلة للإبطال الفوري'],
          ['الكوكيز', 'موقّعة ومحمية'],
          ['تحديد المحاولات', 'دائم لمحاولات تسجيل الدخول'],
          ['MFA', 'TOTP مع QR لإعداد التطبيق'],
          ['استرداد الحساب', 'رموز HMAC أحادية الاستخدام قابلة لإعادة التوليد'],
          ['SSO', 'OIDC Authorization Code + PKCE'],
          ['التحقق من الرمز', '`state` و `nonce` وتوقيع RS256 عبر JWKS'],
          ['التفويض', 'RBAC مع عزل حسب الدور والقسم ودرجة السرية'],
          ['حماية الطلبات', 'Host و Origin و CSP و CSRF لمسارات التعديل'],
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'لماذا الجلسات في القاعدة؟',
        items: [
          'الجلسة المخزّنة يمكن **إبطالها فوراً** من الطرف الآخر.',
          'الجلسة في الذاكرة (الافتراضية) لا يمكن إلغاؤها إلا بانتظار انتهاء صلاحيتها.',
          'هذا فرق حاسم عند إنهاء حساب موظف أو إبطال جهاز مفقود.',
        ],
      },
      { type: 'h2', id: 'signature', text: 'التوقيعات التشفيرية' },
      {
        type: 'p',
        text: 'كل ملف يمكن توقيعه والتحقق من عدم تغيّره لاحقاً باستخدام **SHA-256 مع Ed25519**. النظام يعرض الخوارزمية والمزود والتاريخ والحالة.',
      },
      {
        type: 'ul',
        items: [
          'توقيع Ed25519 — مفتاحان فقط، لا آلة معقّدة.',
          'التحقق من سلامة الملف ومنع تغيّره بعد التوقيع.',
          'دعم **مزود PKI خارجي** عند توفير المفاتيح والشهادات — أي جهة مؤسستك، لا النظام نفسه.',
        ],
      },
      { type: 'h2', id: 'dlp', text: 'DLP ومنع تسريب البيانات' },
      {
        type: 'p',
        text: 'سياسات قابلة للتهيئة تعمل بوضع **التدقيق** (تسجيل بلا منع) أو **المنع**. تُطبَّق على الرفع والتنزيل والتصدير الجماعي.',
      },
      {
        type: 'code',
        lang: 'text',
        code: `صيغ يدعم استخراج النص منها:
  PDF    DOCX    XLSX    PPTX

ما يُسجَّل عند المخالفة:
  السياسة · المستخدم · المستند · العملية · المقتطف المطابق

الحماية من التعبيرات النمطية شديدة التعقيد (ReDoS)`,
      },
      { type: 'h2', id: 'retention', text: 'الاحتفاظ والحجز القانوني' },
      {
        type: 'p',
        text: 'سياسات احتفاظ عامة أو حسب القسم ونوع المستند. عند التعادل يُختار **الأكثر تحديداً ثم الأطول** — حتى لا تُحذف مستندات محمية بسياسة عامة أضعف.',
      },
      {
        type: 'ul',
        items: [
          'منع الإتلاف قبل انتهاء مدة الاحتفاظ.',
          '**Legal Hold** مع السبب ومرجع القضية والمنشئ والتواريخ.',
          'الإفراج عن الحجز دون حذف سجله التاريخي.',
          'تجاوز المستندات المحمية بأمان عند تفريغ السلة.',
        ],
      },
      { type: 'h2', id: 'backup', text: 'النسخ الاحتياطي والاستعادة' },
      {
        type: 'p',
        text: 'النسخة الاحتياطية لقطة متّسقة من ملف قاعدة SQLite تُؤخذ والخادم يعمل. قبل الاستعادة تُنشأ **نسخة رجوع**، وعند الفشل يحدث rollback تلقائي.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# نسخة يدوية من سطر الأوامر — استبدل edms.db بمسار ملف القاعدة على الخادم
sqlite3 edms.db ".backup 'backup.db'"
sqlite3 backup.db "PRAGMA integrity_check;"`,
      },
      {
        type: 'ul',
        items: [
          'تضمين ملفات التخزين والسكربتات والإعدادات غير السرّية.',
          '**Manifest موقَّع بـ HMAC مع بصمة SHA-256 لكل ملف.**',
          'تشفير اختياري لملف النسخة الاحتياطية.',
          'سجلات نجاح وفشل لعملية الاستعادة.',
        ],
      },
      { type: 'h2', id: 'ops', text: 'التشغيل والمراقبة' },
      {
        type: 'ul',
        items: [
          'Liveness و Readiness endpoints.',
          'فحص قاعدة البيانات والتخزين والمساحة الحرة وإعداد النشر.',
          '**Prometheus metrics.**',
          'SIEM webhook قابل للتهيئة.',
          'سجل تدقيق للعمليات الأمنية والإدارية.',
        ],
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'التكاملات تتطلب طرفاً خارجياً',
        items: [
          'لا يُفترض نجاح الاتصال الحقيقي دون endpoints ومفاتيح وشهادات المزود.',
          'لا تنسخ ملف قاعدة البيانات يدوياً والخادم يعمل — قد تحصل على نسخة غير متّسقة. استخدم أداة النسخ في النظام.',
          'أي تكامل خارجي يحتاج ضبطاً قبل أن يعمل — لا تفترض أنه جاهز.',
        ],
      },
      { type: 'h2', id: 'results', text: 'نتائج التحقق' },
      {
        type: 'stats',
        items: [
          { value: '345', label: 'اختباراً ناجحاً' },
          { value: '30', label: 'ملف اختبار' },
          { value: '0', label: 'ثغرات إنتاج' },
          { value: '0', label: 'أخطاء ESLint' },
        ],
      },
      {
        type: 'ul',
        items: [
          '**TypeScript:** ناجح بلا أخطاء.',
          '**ESLint:** ناجح — صفر أخطاء وصفر تحذيرات.',
          '**الاختبارات:** 345/345 ناجحة ضمن 30/30 ملفاً.',
          '**بناء الإنتاج (Webpack):** ناجح.',
          '**ثغرات اعتماديات الإنتاج:** صفر.',
        ],
      },
      { type: 'h2', id: 'unsigned', text: 'ملاحظات قبل التثبيت' },
      {
        type: 'callout',
        tone: 'warn',
        title: 'الحزمة غير موقّعة رقمياً',
        items: [
          'حزمة التثبيت **غير موقّعة** — سيعرض Windows SmartScreen تحذيراً عند التشغيل.',
          'هذا سلوك متوقّع لنسخة أولية، لكنه يعني أن Windows لا يتحقق من الناشر.',
          'نزّل من المصدر المذكور فقط، وتحقق من حجم الملف قبل التشغيل.',
          'هدف الإصدارات القادمة: توقيع رقمي من جهة إصدار معروفة.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'حدود التحقق المعلنة بصراحة',
        items: [
          'بنية التثبيت NSIS بصيغة x64 فقط: لا نسخة محمولة ولا ملف ZIP.',
          'اختبر الاستعادة على نسخة بيانات تجريبية قبل الاعتماد عليها في الإنتاج.',
        ],
      },
      {
        type: 'quote',
        text: 'نظام أرشفة يُقيَّم بما يمنعه من الضياع، لا بما يخزّنه فقط.',
      },
      { type: 'h2', id: 'get', text: 'التحميل' },
      {
        type: 'p',
        text: '**أرشيف برو — الإصدار 1.0.0 لنظام Windows x64**',
      },
      {
        type: 'p',
        text:       `**رابط التحميل:** ${edmsFile.href}`,
      },
      {
        type: 'p',
        text: 'بعد التثبيت: شغّل `edms-archive-pro`، اضبط المنفذ الذي تريده عبر `EDMS_PORT` في `userData/pro.env`، ثم ابدأ الخادم.',
      },
      {
        type: 'checklist',
        items: [
          'تحقّق من مصدر التنزيل',
          'غيّر كلمات المرور الافتراضية قبل الإنتاج',
          'خذ نسخة احتياطية من القاعدة قبل أي تحديث',
          'اختبر النسخ الاحتياطي والاستعادة على بيانات تجريبية',
          'اختبر سياسات DLP على ملفات نموذجية',
          'فعّل TOTP قبل إدخال مستخدمين حقيقيين',
          'راجع سجل التدقيق بعد أول أسبوع',
        ],
      },
    ],
  "google-antigravity-on-ubuntu": [
      {
        type: 'p',
        text: 'Antigravity بيئة تطوير من Google تجمع الوكلاء والـ MCP Servers وأدوات الأتمتة في واجهة واحدة. تركيبها على أوبونتو يمرّ بخمس مراحل، ولكل منها شرط يسبقها.',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'ما ستحصل عليه في النهاية',
        items: [
          'محرك Antigravity مثبَّت من مستودع Google الرسمي.',
          'خادم خلفي لإدارة الوكلاء، يعمل في الخلفية داخل `tmux`.',
          'واجهة ويب على `localhost:8585` مع تسجيل دخول بحساب Google.',
          'Python SDK داخل بيئة افتراضية معزولة (`venv`).',
          'واجهة IDE مستقلة على نمط VS Code.',
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '5', label: 'مراحل التثبيت' },
          { value: '8585', label: 'المنفذ الافتراضي' },
          { value: 'venv', label: 'بيئة Python معزولة' },
          { value: '1', label: 'حساب Google للدخول' },
        ],
      },

      { type: 'h2', id: 'prereq', text: 'الخطوة صفر — الحزم الأساسية' },
      {
        type: 'p',
        text: 'قبل أي شيء، ثبّت الأدوات التي ستُستخدم في كل المراحل التالية. أهمها `tmux` — بدونه تفقد الخادم بمجرد إغلاق الطرفية.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `sudo apt update
sudo apt install -y curl git python3 python3-pip tmux nodejs npm`,
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'لماذا `tmux` تحديداً؟',
        items: [
          '`tmux` يبقي العملية حية بعد إغلاق الطرفية أو انقطاع الشبكة.',
          'يمكنك الرجوع إلى الجلسة نفسها لاحقاً بالاسم — دون إعادة تشغيل الخادم.',
          'إن لم تكن مثبَّتة، ستضطر لتكرار أمر التشغيل في كل مرة.',
        ],
      },

      { type: 'h2', id: 'engine', text: 'الخطوة 1 — تثبيت محرك Antigravity' },
      {
        type: 'p',
        text: 'يُثبَّت المحرك من مستودع APT رسمي. الخطوات الأربع: إنشاء مجلد المفاتيح، تنزيل مفتاح التوقيع، تسجيل المستودع، ثم التثبيت.',
      },
      {
        type: 'p',
        text: 'أولاً: مجلد المفاتيح ودالة مفتاح التوقيع:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg \\
  | sudo gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg`,
      },
      {
        type: 'p',
        text: '`--dearmor` يحوّل المفتاح من صيغة ASCII Armor إلى الصيغة الثنائية التي يتطلّبها APT في مجلد `keyrings`.',
      },
      {
        type: 'p',
        text: 'ثانياً: تسجيل المستودع ثم التثبيت:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] \\
https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ \\
antigravity-debian main" | sudo tee /etc/apt/sources.list.d/antigravity.list > /dev/null

sudo apt update
sudo apt install -y antigravity`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'إذا فشل التوقيع',
        items: [
          'رسالة `NO_PUBKEY` تعني أن المفتاح لم يُحفظ بشكل صحيح — أعد خطوة تنزيل المفتاح.',
          'تأكد أن `antigravity.list` موجود فعلاً: `cat /etc/apt/sources.list.d/antigravity.list`',
          'المفتاح يجب أن يكون في `/etc/apt/keyrings/` وليس في `/usr/share/keyrings/` لهذا التثبيت.',
        ],
      },

      { type: 'h2', id: 'sdk', text: 'الخطوة 2 — Python SDK داخل بيئة معزولة' },
      {
        type: 'p',
        text: 'حزمة `google-antigravity` هي ما يمنحك القدرة على تشغيل أدواتك المخصصة والـ MCP Servers وسيناريوهات الأتمتة المتقدمة.',
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'أنشئ البيئة داخل مجلد مشروع لا في المنزل',
        items: [
          'الأمر التالي يفترض أنك داخل مجلد مشروع.',
          'إن شغّلته في `~` ستجد `.venv` في مجلدك الشخصي — بلا معنى.',
          '`mkdir ~/projects/antigravity && cd $_` قبل التنفيذ.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `sudo apt update
sudo apt install python3-venv python3-pip

python3 -m venv .venv
source .venv/bin/activate

pip install google-antigravity`,
      },
      {
        type: 'p',
        text: 'بعد `source` ستلاحظ أن سطر الأوامر تغيّر ليبدأ بـ `(.venv)`. هذا مؤكّد أن البيئة نشطة.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# للتأكّد من نجاح التثبيت
python -c "import antigravity; print('SDK جاهز')"

# ولإيقاف البيئة والعودة للعادي
deactivate`,
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'لماذا `venv` وليس تثبيتاً عاماً؟',
        items: [
          'عزل كامل عن حزم النظام — تحديث `pip` لن يكسر أدوات أوبونتو.',
          'حذف البيئة بحذف مجلد واحد.',
          'يمكن تثبيت إصدارات مختلفة لكل مشروع دون تعارض.',
        ],
      },

      { type: 'h2', id: 'web-ui', text: 'الخطوة 3 — تشغيل واجهة الويب' },
      {
        type: 'p',
        text: 'يأتي المحرك مضمّناً خادماً خلفياً (Agent Harness) يدير الوكلاء والمشاريع عبر المنافذ المحلية. نُشغّله داخل `tmux` ليبقى بعد إغلاق الطرفية.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `tmux new -s antigravity-server`,
      },
      {
        type: 'p',
        text: 'أنت الآن داخل جلسة جديدة. ابدأ الخدمة منها:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `agy server start --port 8585 --host 0.0.0.0`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'انتبه لسطر `--host 0.0.0.0`',
        items: [
          'هذا الرابط يربط الخادم بـ **كل واجهات الشبكة** — أي أن أي جهاز على نفس الشبكة يستطيع الوصول.',
          'إن كنت تعمل منفرداً، استبدله بـ `--host 127.0.0.1` ليقتصر على جهازك.',
          'الخادم على منفذ بلا مصادقة قبل تسجيل الدخول — لا تفتحه على الإنترنت العام.',
        ],
      },
      {
        type: 'p',
        text: 'الآن اخرج من الجلسة **دون إيقاف الخادم**: اضغط `Ctrl + B` ثم `D` (detach).',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# عند الحاجة لاستعادة الجلسة
tmux attach -t antigravity-server

# لعرض الجلسات دون الدخول
tmux ls

# لإنهاء الخادم نهائياً
tmux kill-session -t antigravity-server`,
      },
      { type: 'h3', id: 'login', text: 'الدخول والتفعيل' },
      {
        type: 'p',
        text: 'افتح المتصفح على العنوان التالي:',
      },
      {
        type: 'code',
        lang: 'text',
        code: `http://localhost:8585`,
      },
      {
        type: 'p',
        text: 'سيطلب منك النظام الضغط على **Continue with Google** وتسجيل الدخول بحساب Gmail الشخصي. هذه الخطوة **مطلوبة** لتفعيل نماذج Gemini (مثل Flash و Pro) التي تدير الوكلاء محلياً.',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'لماذا تسجيل الدخول إلى Google؟',
        items: [
          'النماذج التي تحرّك الوكلاء تعمل عبر خوادم Google، لا محلياً بالكامل.',
          'الحساب يحدّد الحصة (quota) والصلاحيات المتاحة لك.',
          'عند نسخ أو نقل الجلسة، سجّل الدخول بالحساب نفسه حتى تتعرّف الأدوات عليك.',
        ],
      },

      { type: 'h2', id: 'ide', text: 'الخطوة 4 — واجهة التطوير الكاملة (IDE)' },
      {
        type: 'p',
        text: 'إن أردت واجهة شبيهة بـ VS Code مع لوحة Manager لإدارة المهام والوكلاء بصرياً، ثبّتها بسكربت البناء الرسمي:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `curl -fsSL https://antigravity.google/cli/install.sh | bash`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'قبل أن تشغّل `curl | bash`',
        items: [
          'هذا الأمر ينفّذ سكربتاً **بلا مراجعة** بصلاحياتك الكاملة.',
          'الفحص الآمن: نزّل السكربت واقرأه أولاً.',
          '`curl -fsSL https://antigravity.google/cli/install.sh -o install.sh`، ثم `less install.sh` للمراجعة، ثم `bash install.sh`.',
          'من مصدر رسمي موثوق، الاختصار مقبول — لكن الفحص لا يكلّف شيئاً.',
        ],
      },
      { type: 'h3', id: 'first-run', text: 'أول تشغيل — خطوات تسجيل الدخول' },
      {
        type: 'ol',
        items: [
          'شغّل `agy` في الطرفية.',
          'سيعرض خيارين — اكتب `1` ثم `Enter`.',
          'انسخ الرابط الظاهر أمامك على الشاشة.',
          'افتحه في المتصفح، ثم اضغط **Continue with Google** وسجّل الدخول.',
          'انسخ رمز التفويض الظاهر في الصفحة.',
          'ارجع إلى الطرفية والصق الرمز، ثم `Enter`.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `agy`,
      },
      {
        type: 'p',
        text: 'بعد نجاح الربط، ستعمل الواجهة بأمر واحد:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `agyweb`,
      },
      {
        type: 'p',
        text: 'عند فتح النافذة في المتصفح: اضغط على **النقاط الثلاث** ← ثم **Install** ← **إنشاء اختصار**، لتثبيتها كتطبيق مستقل.',
      },
      { type: 'h3', id: 'stop-web', text: 'إيقاف واجهة الويب' },
      {
        type: 'callout',
        tone: 'tip',
        title: 'أغلقها عند الانتهاء',
        items: [
          'الواجهة تستهلك موارد الجهاز حتى بلا استخدام.',
          'أمر واحد يغلقها بالكامل:',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `agyweb-stop`,
      },

      { type: 'h2', id: 'daily', text: 'الأوامر اليومية' },
      {
        type: 'table',
        caption: 'مرجع سريع — احفظه',
        head: ['الأمر', 'الوظيفة'],
        rows: [
          ['`agy`', 'تشغيل الواجهة الرسومية والدخول لأول مرة'],
          ['`agyweb`', 'فتح واجهة الويب'],
          ['`agyweb-stop`', 'إغلاق واجهة الويب'],
          ['`agy server start`', 'تشغيل الخادم الخلفي (داخل tmux)'],
          ['`tmux attach -t antigravity-server`', 'استعادة جلسة الخادم'],
          ['`source .venv/bin/activate`', 'تفعيل بيئة Python'],
          ['`deactivate`', 'الخروج من بيئة Python'],
        ],
      },

      { type: 'h2', id: 'troubleshoot', text: 'حل المشاكل المتكرّرة' },
      {
        type: 'ul',
        items: [
          '**المنفذ 8585 مشغول** — غيّر الرقم في `--port` ثم افتح المنفذ الجديد في المتصفح.',
          '**الخادم يموت عند إغلاق الطرفية** — نسيت `Ctrl+B` ثم `D`. أعد التشغيل داخل `tmux`.',
          '**`python -m venv` يفشل** — غالباً `python3-venv` غير مثبَّت. ثبّته ثم أعد إنشاء البيئة.',
          '**تسجيل الدخول لا يكتمل** — تأكد أن المتصفح على `localhost` لا على عنوان IP للجهاز.',
          '**الواجهة لا تفتح** — تحقق أن الجلسة حيّة: `tmux ls` يجب أن يعرض `antigravity-server`.',
        ],
      },
      {
        type: 'checklist',
        items: [
          'كل الحزم الأساسية مثبَّتة و `tmux` يعمل',
          'مفتاح التوقيع موجود في `/etc/apt/keyrings/`',
          'الملف `antigravity.list` مسجَّل و `apt update` بلا أخطاء',
          'حزمة `antigravity` مثبَّتة بنجاح',
          'البيئة الافتراضية داخل مجلد المشروع لا في المنزل',
          'الخادم يعمل داخل جلسة `tmux` ومفصول عنها',
          'تسجيل دخول Google تم عبر `localhost`',
          'الاختصار أُنشئ من قائمة النقاط الثلاث',
        ],
      },
      {
        type: 'quote',
        text: 'أغلق واجهة الويب عند الانتهاء. الأداة الجيدة التي لا تُغلق، تستهلك جهازك دون أن تعرف.',
      },
    ],
  "opencode-tooling-guide": [
      {
        type: 'p',
        text: 'بنينا موقعاً كاملاً من صفر: واجهة، ربط مع تيك توك، صفحة روابط، ومدونة بسبع مقالات. خلف كل ذلك توجد منظومة أدوات — وكلاء ومهارات وسيرفرات MCP — لا يعرفها أغلب المبتدئين.',
      },
      {
        type: 'p',
        text: 'هذه المقالة توثّق ما استُخدم **فعلاً**، لا ما هو متاح. لكل أداة: آلية عملها، وموضع استدعائها، وطريقة تثبيتها، ثم **الفخّ** الذي لم يذكره أي توثيق رسمي.',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'لماذا هذا الموضوع يهمّك',
        items: [
          'الأدوات الجيدة لا تعوّض التفكير، لكنها تكشف أخطاء لا يكشفها فحص آلي.',
          'معظم الأدوات موثّقة رسمياً بلا مثال واقعي — وهذا هو الفجوة التي تملؤها.',
          'قائمة الأدوات وحدها لا تكفي؛ الأهم هو **متى تستدعي كل واحدة** ومتى لا تستدعيها.',
        ],
      },
      {
        type: 'stats',
        items: [
          { value: '8', label: 'وكلاء موثّقون' },
          { value: '8', label: 'سيرفرات MCP' },
          { value: '4', label: 'مهارات' },
          { value: '3', label: 'عيوب حرجة كُشفت' },
        ],
      },
      { type: 'h2', id: 'agents', text: 'الوكلاء: عقول بسياق نظيف' },
      {
        type: 'p',
        text: 'الوكيل عقل منفصل بسياق نظيف. يعطيه OpenCode مهمة محدّدة فيقرأ ما يحتاجه فقط، فيوفّر ذاكرة السياق الأساسية. الفرق بين وكيل وآخر ليس في الذكاء، بل في **التخصّص وطريقة التفكير**.',
      },
      {
        type: 'table',
        caption: 'الوكلاء الأساسية وأين استُخدم كل واحد',
        head: ['الوكيل', 'متى تستدعيه', 'نتيجة حقيقية من هذا المشروع'],
        rows: [
          ['`code-reviewer`', 'قبل أي commit، بمراجعة مُوجَّهة', 'كشف 3 عيوب حرجة لا يراها الفحص الآلي'],
          ['`debugger`', 'خطأ غير بديهي أو البناء يفشل', '30 خطأ في tsc ← سطر واحد بعد عزل السبب'],
          ['`frontend`', 'مكوّن واجهة جديد', 'SonarGrid على canvas، Aurora بـ CSS خالص'],
          ['`ui-designer`', 'ألوان ومسافات وثيم', 'نظام رموز دلالية بدل قيم متفرقة'],
          ['`speed-coder`', 'تعديل أقل من 20 سطراً', 'استبدال خاصية CSS، حذف استيراد، تحديث نطاق'],
          ['`researcher`', 'قرار تقني يحتاج مصادر', 'استخراج بيانات حساب تيك توك الحقيقي'],
          ['`docs-expert`', 'سؤال عن سلوك API في مكتبة', 'توثيق Framer Motion و Tailwind v4 عبر Context7'],
        ],
      },
      { type: 'h3', id: 'reviewer-lesson', text: 'قوة المراجعة في الطلب لا في الوكيل' },
      {
        type: 'p',
        text: 'المراجعة المفتوحة أخرجت حشواً كثيراً. حين طلبت **قائمة تحقق صريحة**، خرجت ثلاثة عيوب قابلة للتنفيذ. الفرق ليس في الوكيل — في طريقة صياغة الطلب.',
      },
      {
        type: 'code',
        lang: 'text',
        code: `❌ «راجع المشروع»

✅ «راجع: روابط تالفة، تجاوز أفقي في RTL،
           أصناف ميتة، أسوأ حالة»`,
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'قاعدة اختيار الوكيل',
        items: [
          'ابدأ بـ `speed-coder` إن كان الملف محدّداً ونطاق ضيّق.',
          'انتقل للوكيل الأثقل فقط حين تكون المهمة **مفاهيمية** لا **تحريرية**.',
          'لا تستخدم وكيلاً سريعاً على قرار معماري — السرعة تُنفّذ الجواب الخاطئ أسرع.',
        ],
      },
      { type: 'h2', id: 'mcp-idle', text: 'الدرس الأهم: أوقف سيرفرات MCP افتراضياً' },
      {
        type: 'p',
        text: 'كل سيرفر MCP محلي **عملية Node مستقلة** تكلّف بين 50 و115 ميغابايت. ستة منها تعني نحو 600 ميغابايت وست عمليات دائمة.',
      },
      {
        type: 'p',
        text: 'على أندرويد، المشكلة ليست تعارضاً مع تطبيق آخر. **LMKD** لا يهتم بمن مخطئ: كلما ارتفعت الذاكرة صار opencode أكبر عملية قابلة للقتل، فيقتله. في مشروعنا كاد المتصفح يُقتل عند كل محاولة فحص.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `mcp-idle status          # ما المتوقف وما النشط + RSS حيّ
mcp-idle doctor          # التشخيص + فحص العمليات
mcp-idle on <name>       # استيقاظ سيرفر (يلزم إعادة تشغيل opencode)
mcp-idle off <name>
mcp-idle on-all | off-all`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'الفخّ الذي لا يظهر',
        items: [
          '`mcp-idle on X` يبدو ناجحاً بلا أثر — لأن opencode يحلّ اتصالات MCP **عند الإقلاع فقط**.',
          'الحل: نفّذ الأمر ثم **أخرج وأعد تشغيل** opencode.',
          'السيرفرات البعيدة (context7، hacktron) تعمل دائماً — HTTPS بلا عملية محلية.',
          'بعد انتهاء المهمة نفّذ `mcp-idle off X` وإلا تراكمت البصمة.',
        ],
      },
      { type: 'h2', id: 'skills', text: 'المهارات: تعليمات تُحمَّل عند الحاجة' },
      {
        type: 'p',
        text: 'المهارة تختلف عن الوكيل: هي نصّ يوجّه، لا عقل منفصل ينفّذ. تُحمَّل فقط حين تتقاطع مع المهمة، فلا تستهلك سياقاً غير ضروري.',
      },
      {
        type: 'table',
        head: ['المهارة', 'الدور', 'ملاحظة عملية'],
        rows: [
          ['`@agent-reach`', 'قراءة صفحات ومستودعات من 16 قناة', 'Twitter و Reddit و IG تحتاج كوكيز — لا تفترض أنها تعمل'],
          ['`@error-memory`', 'قاعدة دائمة تحفظ الأخطاء وإصلاحاتها', 'ابحث فيها قبل أي عملية خطرة'],
          ['`@vercel/agent-skills`', 'قواعد TypeScript و React', 'مرجع معتمد من Vercel'],
          ['`skillspector`', 'فحص أمني قبل تثبيت أي مهارة', 'ابدأ بـ `noLlm=true`: أسرع وأرخص وبلا مفتاح'],
        ],
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'قاعدة أمنية',
        items: [
          'المهارة نصّ يُنفَّذ بصلاحياتك — ومهارة خبيثة باب خلفي.',
          'راجع أي مهارة قبل تثبيتها، ولا تثبّت من مصدر مجهول أبداً.',
          '**هذه الأدوات للقراءة فقط**: لا تنشر ولا تعلّق ولا تُعجب.',
        ],
      },
      { type: 'h2', id: 'errors-found', text: 'ثلاثة أخطاء حقيقية كشفتها المراجعة' },
      {
        type: 'p',
        text: 'هذه أكثر أمثلة عملية في هذا المشروع. الثلاثة مرّت على `tsc` و `eslint` بلا أي تحذير.',
      },
      {
        type: 'ol',
        items: [
          '**مشاركة تُبلَّغ عن فشل بعد نجاحها.** `navigator.share` يُرجع `undefined` لا `boolean`، فكود `return navigator.share(...).catch(() => false)` كان يُظهر «تعذرت المشاركة» بعد أن شارك المستخدم فعلاً.',
          '**كل affordance التفاعلي ميت في الموقع كله.** الأصناف كانت مكتوبة كقواعد CSS في `@layer utilities`، و Tailwind لا يولّد لها variants. النتيجة: `hover:border-strong` و `bg-elevated/80` صفر في الـ CSS المبني.',
          '**نقاط غير مرئية.** `s.icon.replace("text-","bg-")` يبني اسم صنف وقت التشغيل، وماسح Tailwind لا يمسح إلا النص الحرفي.',
        ],
      },
      {
        type: 'code',
        lang: 'css',
        code: `❌ /* لا variants، لا opacity modifiers */
@layer utilities {
  .bg-elevated { background-color: var(--bg-elevated); }
}

✅ /* ينتج hover:bg-elevated و bg-elevated/80 */
@theme inline {
  --color-elevated: var(--bg-elevated);
}`,
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'قاعدة الفرق بين @theme و @utility',
        items: [
          '**`@theme inline`** يدعم الاثنين: variants **و** `/NN` opacity.',
          '**`@utility`** يدعم variants فقط — لا opacity modifiers.',
          'اختر `@theme` إن كان الاسم يطابق خاصية لون واحدة، و `@utility` حين يكون الاسم ملتبساً.',
        ],
      },
      { type: 'h2', id: 'npm-trap', text: 'الفخ الذي لا يُصدر خطأ أبداً' },
      {
        type: 'p',
        text: 'هذا الدرس وحده يستحق القراءة. عند تثبيت الاعتماديات، أبلغ npm **بنجاح** — بينما `vite` و `typescript` و `@types/react` مفقودة تماماً.',
      },
      {
        type: 'p',
        text: 'السبب أن البيئة تصدّر `NODE_ENV=production`، و npm يعتبر `devDependencies` اختيارية في الإنتاج، فتخطّاها بصمت. **لا يوجد تحذير ولا خطأ — فقط أداة مفقودة لاحقاً.**',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# الحل محلياً
NODE_ENV=development npm install --include=dev

# وللنشر على Netlify — وإلا فشل البناء بغياب vite
[build.environment]
  NODE_ENV = "production"
  NPM_FLAGS = "--include=dev"`,
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# لا تثق بـ «نجح التثبيت» — تحقّق بنفسك
ls node_modules/.bin/vite node_modules/typescript \\
  >/dev/null && echo "✅" || echo "❌ devDependencies متخطّاة"`,
      },
      { type: 'h2', id: 'security', text: 'الأمان والخصوصية في البناء' },
      {
        type: 'p',
        text: 'القاعدة التي التُزمت بها طوال البناء: **التوكنات لا تدخل المشروع أبداً**.',
      },
      {
        type: 'table',
        head: ['القاعدة', 'التطبيق'],
        rows: [
          ['التوكن خارج المستودع', 'حُفظ في `~/.netlify/config.json` بصلاحيات 600'],
          ['الاستخدام عبر البيئة', '`NETLIFY_AUTH_TOKEN` لا يمرّ بسطر أوامر'],
          ['أداة ثقيلة خارج المشروع', '`netlify-cli` (150 ميغابايت) حُذف من devDependencies'],
          ['`.gitignore`', 'يحمي `dist/` و `.netlify/` و `.env*`'],
          ['ترويسات CSP', '`script-src \'self\'` و `object-src \'none\'` و HSTS'],
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# فحص قبل أي commit
grep -rn "nfp_\\|ntfm_\\|ghp_\\|nvapi-" . \\
  --exclude-dir=node_modules --exclude-dir=dist
find . -name ".env*" -not -path "*/node_modules/*"
git check-ignore dist .netlify .env && echo "✅ محمي"`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'قائمة allowlist للروابط',
        items: [
          'مرّر أي `href` من مصدر خارجي بقائمة سماح قبل وضعه.',
          'بلا ذلك يصبح الحوض `javascript:` تنفيذياً بمجرد إدخال المقالات من CMS.',
          'القائمة تُغلق الباب قبل أن يُفتح — لا بعد أول اختراق.',
        ],
      },
      { type: 'h2', id: 'lessons', text: 'دروس من النشر الفعلي' },
      { type: 'h3', id: 'lesson-401', text: '401 على كل شيء بعد النشر' },
      {
        type: 'p',
        text: 'النشر نجح، لكن كل مسار رجّع **401** والجسم `Login Redirect`. السبب: الحساب فيه `site_sso_login: true` أي «الدخول مطلوب لمشاهدة المواقع».',
      },
      {
        type: 'p',
        text: 'الـ API رفض تغييره على مستوى الحساب (خطة Free). قُبل على مستوى الموقع:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `curl -X PATCH \\
  -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"sso_login": false}' \\
  https://api.netlify.com/api/v1/sites/<site-id>`,
      },
      {
        type: 'p',
        text: 'النتيجة فوراً: **200** على كل المسارات. لكن للوقاية من التكرار عطّل الخاصية على مستوى الحساب نفسه.',
      },
      { type: 'h3', id: 'lesson-domain', text: 'النطاق المحجوز عالمياً' },
      {
        type: 'p',
        text: '`ghost778.netlify.app already exists` — أسماء `netlify.app` محجوزة عالمياً بلا أولوية لحسابك. استُخدم `ghost-778` أولاً، ثم أُعيدت تسمية الموقع لاحقاً إلى `zidex`. كل تسمية تعني تحديث `canonical` و`og:url` و`sitemap.xml` و`robots.txt` — أربعة مواضع تنسى واحداً منها فتترك بياناتك تشير إلى نطاق ميّت.',
      },
      {
        type: 'checklist',
        items: [
          '`<link rel="canonical">` و `og:url` في `index.html`',
          'سطر `Sitemap:` في `robots.txt`',
          'كل `<loc>` في `sitemap.xml`',
          'أي رابط مطلق مكتوب يدوياً في الشيفرة',
        ],
      },
      { type: 'h2', id: 'checklist', text: 'قائمة تحقق نهائية' },
      {
        type: 'checklist',
        items: [
          '`tsc` صفر أخطاء',
          '`eslint` صفر أخطاء',
          'لا أسرار في المشروع ولا في الحزمة المبنية',
          '`.gitignore` يحمي `dist` و `.netlify` و `.env`',
          'ترويس CSP حاضر على الموقع الحيّ',
          'الصفحة الرئيسية تُرجع 200 لا 401',
          'روابط SPA تعمل على رابط عميق',
        ],
      },
      { type: 'h2', id: 'adapters', text: 'ما يناسبك أنت' },
      {
        type: 'p',
        text: 'ابدأ صغيراً. لا تنسخ المنظومة كاملة — معظمها يعمل بلا أي إعداد إضافي.',
      },
      {
        type: 'ol',
        items: [
          '**ضروري:** وكيل واحد للمراجعة، ووكيل واحد للتنفيذ السريع.',
          '**مفيد:** مهارة ذاكرة الأخطاء، و Context7 لتوثيق المكتبات.',
          '**حسب الحاجة:** سيرفرات MCP إضافية — أضفها عند الحاجة الفعلية فقط.',
          '**لا تضفه بلا سبب:** أي أداة لا تعرف متى ستستخدمها ذاكرة محجوزة بلا فائدة.',
        ],
      },
      {
        type: 'quote',
        text: 'الأداة الجيدة لا تجعلك أسرع فحسب، بل تُظهر لك الخطأ الذي كنت ستنشره.',
      },
    ],
  "docker-on-android-termux": [
      {
        type: 'p',
        text: 'لا يمكن تشغيل محرّك Docker مباشرة داخل Termux. السبب ليس Termux نفسه، بل أن Docker يحتاج إلى ميزات في **نواة لينكس** مثل cgroups و namespaces، وهي غير متاحة — أو مقيّدة — في نواة أندرويد الأساسية.',
      },
      {
        type: 'p',
        text: 'الحل الأنضف والأكثر استقراراً بدون روت هو إنشاء **آلة افتراضية خفيفة جداً بنظام Alpine Linux** عبر محاكي QEMU. ولأن النظام الافتراضي يملك نواته الخاصة، يعمل Docker داخله كما يعمل على أي خادم عادي.',
      },
      { type: 'h2', id: 'prereq', text: 'قبل أن تبدأ: ما ستحتاجه' },
      {
        type: 'ul',
        items: [
          '**مساحة تخزين:** قرص افتراضي ٤ غيغابايت كحد أقصى، لكنه لا يستهلك كامل الحجم إلا عند الاستخدام الفعلي.',
          '**ذاكرة:** يحتاج النظام ١ غيغابايت كحد أدنى للتشغيل المريح.',
          '**معالج:** نواتان افتراضيان (`smp cpus=2`) كافية للحاويات الخفيفة.',
          '**وقت أول إعداد:** ٢٠–٣٠ دقيقة تنزيلاً وتثبيتاً، بعدها التشغيل يستغرق ثوانٍ.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'لماذا QEMU وليس Termux Proot',
        items: [
          '**Termux Proot** أسرع وأخف، لكنه يبقى بلا cgroups ولا صلاحيات حقيقية — فبعض صور Docker لا تعمل معه.',
          '**QEMU** يعطيك نظاماً كاملاً بنواة سليمة و devtmpfs و cgroups، أي بيئة مطابقة لبيئة الإنتاج.',
          'المقايضة واضحة: ثبات وأصالة مقابل وقت تشغيل أطول وحجم أكبر.',
        ],
      },

      { type: 'h2', id: 'step-1', text: 'الخطوة ١ — تثبيت الحزم الأساسية في Termux' },
      {
        type: 'p',
        text: 'افتح Termux وحدّث المستودعات. ثم أضف مستودع x11-repo، وهو ضروري لأن بعض حزم QEMU غير موجودة في المستودع الأساسي ويفشل تثبيتها بدونه.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `pkg update && pkg upgrade -y
pkg install x11-repo -y
pkg install qemu-utils qemu-system-x86-64-headless wget -y`,
      },

      { type: 'h2', id: 'step-2', text: 'الخطوة ٢ — إنشاء مجلد العمل وتحميل Alpine' },
      {
        type: 'p',
        text: 'أنشئ مجلداً مخصصاً للعمل، ثم نزّل نسخة Alpine المخصصة للبيئات الافتراضية (alpine-virt)، وهي أصغر نسخة تحتوي على ما تحتاجه لتشغيل الحاويات. بعد التحميل أنشئ قرصاً وهمياً بحجم ٤ غيغابايت.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `mkdir alpine && cd alpine
wget http://dl-cdn.alpinelinux.org/alpine/v3.12/releases/x86_64/alpine-virt-3.12.3-x86_64.iso
qemu-img create -f qcow2 alpine.img 4G`,
      },
      {
        type: 'p',
        text: 'ملف القرص بصيغة qcow2 ولا يشغل ٤ غيغابايت فعلياً، بل ينمو مع الاستخدام فقط.',
      },

      { type: 'h2', id: 'step-3', text: 'الخطوة ٣ — تشغيل النظام الافتراضي لأول مرة' },
      {
        type: 'p',
        text: 'شغّل الآلة الافتراضية بالأمر التالي. لاحظ أن الأمر يفتح أيضاً المنفذ ٢٢٢٢ على المضيف لتستطيع الدخول لاحقاً عبر SSH بدل كتابة الأوامر داخل المحاكي.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `qemu-system-x86_64 -machine q35 -m 1024 -smp cpus=2 -cpu qemu64 \\
 -netdev user,id=n1,hostfwd=tcp::2222-:22 -device virtio-net,netdev=n1 \\
 -cdrom alpine-virt-3.12.3-x86_64.iso -nographic alpine.img`,
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'تسجيل الدخول الأول',
        items: [
          'عند ظهور `localhost login:` اكتب `root` ثم اضغط Enter.',
          'لا توجد كلمة مرور في النسخة الافتراضية، والدخول يكون مباشر.',
          '`-nographic` يعني أن المحاكي يعمل داخل الطرفية بدون نافذة رسومية — الأنسب لـ Termux.',
        ],
      },
      {
        type: 'p',
        text: 'شرح المعاملات: `-machine q35` يختار نوع المحاكاة، و `-m 1024` يخصص ١ غيغابايت ذاكرة، و `-smp cpus=2` نواتان، و `hostfwd` يمرّر منفذ المضيف إلى منفذ النظام الداخلي.',
      },

      { type: 'h2', id: 'step-4', text: 'الخطوة ٤ — تفعيل الشبكة والمستودعات' },
      {
        type: 'p',
        text: 'النظام يعمل من قرص ISO يحتوي على الحزم الأساسية فقط، لذلك تحتاج أولاً إلى تفعيل الإنترنت.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `setup-interfaces -a
service networking start`,
      },
      {
        type: 'p',
        text: 'إذا طلب منك الأمر `setup-interfaces -a` أي خيارات، اضغط Enter في كل موضع لاعتماد القيم الافتراضية. ثم استبدل روابط المستودعات المدمجة بروابط خوادم Alpine، لأن حزمة Docker تقع في مستودع Community.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `cat <<EOF > /etc/apk/repositories
http://dl-cdn.alpinelinux.org/alpine/v3.12/main
http://dl-cdn.alpinelinux.org/alpine/v3.12/community
EOF`,
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'أشيع خطأ هنا',
        items: [
          'نسيان مستودع `community` يجعل `apk add docker` يفشل بخطأ «package not found» رغم أنه موجود فعلاً.',
          'الإصدار ٣.١٢ في الروابط أعلاه يجب أن يطابق إصدار ملف ISO الذي نزّلته. لو غيّرت أحدهما غيّر الآخر.',
          'لا تفتح الملف ولا تحذفه — استبدل محتواه بالكامل كما في الأمر أعلاه.',
        ],
      },

      { type: 'h2', id: 'step-5', text: 'الخطوة ٥ — تثبيت Docker وتشغيله' },
      {
        type: 'p',
        text: 'حدّث قائمة الحزم، ثبّت Docker، ثم فعّله وأضفه إلى قائمة الخدمات التي تعمل تلقائياً عند إقلاع النظام.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `apk update
apk add docker
service docker start
rc-update add docker boot`,
      },
      {
        type: 'p',
        text: 'الأمر `rc-update add docker boot` هو ما يجعل Docker يعمل تلقائياً في كل مرة تشغّل فيها الآلة، فلا تحتاج لتكرّر `service docker start`.',
      },

      { type: 'h2', id: 'step-6', text: 'الخطوة ٦ — اختبار المحرك' },
      {
        type: 'p',
        text: 'شغّل الحاوية الرسمية للاختبار. إذا ظهرت رسالة «Hello from Docker!» فالمحرك يعمل بكفاءة تامة.',
      },
      {
        type: 'code',
        lang: 'bash',
        code: 'docker run hello-world',
      },
      {
        type: 'stats',
        items: [
          { value: '4 GB', label: 'حجم القرص الافتراضي' },
          { value: '1 GB', label: 'الذاكرة الدنيا' },
          { value: '2222', label: 'منفذ SSH من المضيف' },
        ],
      },

      { type: 'h2', id: 'ports', text: 'إدارة المنافذ: نشر تطبيق ويب' },
      {
        type: 'p',
        text: 'هناك طبقة عزل بين حاويات Docker وهاتف الأندرويد، فأي منفذ تريد فتحه على الهاتف يجب أن يُمرَّر مرتين: مرة عند تشغيل QEMU، ومرة عند تشغيل الحاوية.',
      },
      {
        type: 'ol',
        items: [
          'أوقف الآلة الافتراضية بأمان بالأمر `poweroff` من داخل Alpine.',
          'أعد تشغيل QEMU مع إضافة `hostfwd` للمنفذ المطلوب — هنا ٨٠٨٠ على المضيف يقابل ٨٠ داخل الحاوية.',
          'شغّل الحاوية على المنفذ الداخلي ٨٠.',
          'افتح المتصفح على `http://localhost:8080`.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `qemu-system-x86_64 -machine q35 -m 1024 -smp cpus=2 -cpu qemu64 \\
 -netdev user,id=n1,hostfwd=tcp::2222-:22,hostfwd=tcp::8080-:80 -device virtio-net,netdev=n1 \\
 -nographic alpine.img`,
      },
      {
        type: 'p',
        text: 'بعدها شغّل حاوية Nginx وانظر النتيجة من متصفح الهاتف:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: 'docker run -d -p 80:80 nginx',
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'كيف تختار رقم المنفذ',
        items: [
          'الرقم الأول (8080) هو ما تكتبه في عنوان المتصفح على الهاتف.',
          'الرقم الثاني (80) هو ما تسمّيه داخل `docker run -p`.',
          'إن شغّلت عدة تطبيقات معاً، اختر منفذاً مختلفاً لكل واحد: 8080، 8081، 8082…',
        ],
      },

      { type: 'h2', id: 'shutdown', text: 'إيقاف النظام بأمان' },
      {
        type: 'p',
        text: 'لا تُغلق تطبيق Termux مباشرة ولا تقتل العملية من مدير المهام — الإغلاق المفاجئ يسبّب تلف ملفات القرص الافتراضي ويفقدك الحاويات.',      },
      {
        type: 'code',
        lang: 'bash',
        code: 'poweroff',
      },
      {
        type: 'p',
        text: 'استخدم الأمر داخل نظام Alpine وانتظر حتى تعود إلى سطر أوامر Termux. بعدها تحتفظ بكل ما بنيته داخل القرص.',
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'لا تفعل هذا',
        items: [
          'لا تُغلق Termux من قائمة تطبيقات أندرويد، وإلا خاطرت بخسارة الحاويات أو نظام الملفات.',
          'لا تنفّذ `kill` على عملية QEMU — فالقرص qcow2 لا يتحمّل الكتابة المتقطعة.',
          'لا تحذف ملف ISO بعد أول إقلاع دون التأكد، قد تحتاجه لإعادة التثبيت.',
        ],
      },

      { type: 'h2', id: 'ssh', text: 'الوصول عبر SSH بدلاً من كتابة الأوامر يدوياً' },
      {
        type: 'p',
        text: 'بما أن المنفذ ٢٢٢٢ مُمرَّر إلى المضيف، يمكنك الدخول من Termux نفسه دون التعامل مع محاكي الواجهة النصية:',
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# داخل Termux
pkg install openssh -y
ssh -p 2222 root@localhost

# أو من جهاز آخر على نفس الشبكة
ssh -p 2222 root@<عنوان-الآلة>`,
      },
      {
        type: 'checklist',
        items: [
          'أمر QEMU يعمل من داخل مجلد alpine',
          'عند `localhost login:` اكتب root ثم Enter',
          'تم استبدال محتوى /etc/apk/repositories بالكامل',
          'مستودع community موجود في الروابط',
          '`docker run hello-world` يطبع رسالة الترحيب',
          'قبل الإغلاق: `poweroff` وليس إغلاق التطبيق',
        ],
      },
      {
        type: 'quote',
        text: 'الطريقة لا تتفوّق على Docker Desktop في الأداء، لكنها تجعل الحاويات ممكنة على جهاز لا يفترض أن يشغّلها أصلاً.',
      },
      {
        type: 'p',
        text: 'ابدأ بحاوية بسيطة مجرّدة، وأضف منفذاً واحداً فقط لكل تطبيق، وستحصل على بيئة تطوير Docker كاملة على هاتفك — بدون روت، وبدون تعديل نواة.',
      },
    ],
  "first-30-seconds": [
      {
        type: 'p',
        text: 'كل فيديو تنشره يمر بلحظة واحدة فقط قبل أن يقرر المشاهد خروجه: **الجزء الأول من الثانية**. الأرقام التي جمعناها من مئات الحسابات تتفق على قاعدة واحدة: الفيديو الذي لا يُثبت وجوده في تلك اللحظة لا يستحق بقية الوقت الذي منحته إياه أصلاً.',
      },
      { type: 'p', text: 'هذه المقالة تشرح كيف تبني خطافاً يعمل، وكيف تعرف أن خطافك يفشل قبل أن تنشر أصلاً.' },
      { type: 'h2', id: 'the-3-questions', text: 'الأسئلة الثلاثة التي يجيب عنها أول مشهد' },
      {
        type: 'p',
        text: 'المشاهد لا يسأل نفسه «هل يعجبني هذا؟» في البداية، بل ثلاثة أسئلة فقط تجيب عنها لقطتك الأولى:',
      },
      {
        type: 'ol',
        items: [
          '**ما هذا؟** — لقطة واحدة تختصر الموضوع بصرياً. لقطة مقصوصة تكفي، لا جملة تعريفية.',
          '**لماذا يهمني؟** — ميزة واضحة، أو مفاجأة، أو وعد بنتيجة محددة.',
          '**لماذا الآن؟** — سبب يجعل التصفّح الآن أفضل من غداً: ترند، حدث، أو مرآة شخصية.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'اختبار الـ 3 كلمات',
        items: [
          'اكتب وصف الفيديو في ثلاث كلمات فقط.',
          'إذا احتاجت جملة كاملة لوصفه، فاللقطة الأولى غامضة.',
          'عدّل اللقطة حتى تختصر نفسها في ثلاث كلمات.',
        ],
      },
      { type: 'h2', id: 'hook-types', text: 'خمسة أنواع من الخطافات، ولكل منها موضع' },
      {
        type: 'p',
        text: 'لا يوجد خطاف «أفضل» بالمطلق. النوع الذي ينجح في فيديو تعليمي قد يفشل تماماً في فيديو كوميدي. هذه الخمسة تغطي أغلب الحالات:',
      },
      {
        type: 'ul',
        items: [
          '**النتيجة أولاً** — ابدأ من النهاية. أقوى خطاف على الإطلاق لأنه يخلق فجوة فضول فورية.',
          '**السؤال المستحيل** — «كيف صرت عائداً بهذا الشكل في ٣٠ يوماً؟» ثم صمت نصف ثانية.',
          '**الخطأ الشائع** — «هذا الخطأ كلّفني ٦ أشهر»، مع إظهار الخطأ على الشاشة قبل التصحيح.',
          '**العدّ التنازلي بصرياً** — ثلاثة عناصر تظهر تباعاً، بدون كلام. تصلح ممتازاً للصمت.',
          '**الاعتراف** — «أول فيديو لي كان كارثةً كاملة». الاعتراف بالصادق يجذب أسرع من ادعاء القوة.',
        ],
      },
      { type: 'h2', id: 'audio', text: 'الصوت أول من الصورة' },
      {
        type: 'p',
        text: 'المنصّات الحديثة ترفع الصوت تلقائياً عند التمرير، لذا اجعل صوتك محسوساً قبل أن ترى العين اللقطة. ثلاث قواعد عملية:',
      },
      {
        type: 'ul',
        items: [
          'ابدأ الكلام أو الصوت المؤثر في **الإطار الأول**، لا بعده بنصف ثانية.',
          'ارفع الصوت بضع درجات في أول ٥ ثوانٍ فقط، ثم عُد للمستوى الطبيعي.',
          'تجنّب الصمت الافتتاحي — صمت أول ثانيتين هو أسرع طريق لجعل المشاهد يتجاوز.',
        ],
      },
      {
        type: 'code',
        lang: 'text',
        code: `الهيكل الزمني المقترح (٣٠ ثانية)

0.0s – 0.3s   خطاف بصري + صوتي فوري
0.3s – 1.0s   الوعد بالنتيجة في جملة واحدة
1.0s – 3.0s   أسرع لقطاتك — إثبات بصري
3.0s – 22.0s  المحتوى الأساسي + نقلات كل ٢–٣ ثوانٍ
22.0s – 28.0s الذروة أو الكشف
28.0s – 30.0s دعوة للفعل واحدة، واضحة وقابلة للقياس`,
      },
      { type: 'h2', id: 'measure', text: 'كيف تعرف أن الخطاف نجح' },
      {
        type: 'stats',
        items: [
          { value: '≥ 70%', label: 'نسبة إكمال ٣ ثوانٍ' },
          { value: '≥ 40%', label: 'نسبة إكمال ١٥ ثانية' },
          { value: '≥ 12%', label: 'معدل النقر على الوصف' },
        ],
      },
      {
        type: 'p',
        text: 'هذه ليست أرقاماً سحرية، بل خطوط أساس. المهم أن تقارن كل فيديو بالفيديو السابق لك، لا بالمتوسط العام. فيديو نسبة إكماله ٦٠٪ قد يكون ممتازاً إذا كان الفيديو الذي قبله ٢٠٪.',
      },
      {
        type: 'quote',
        text: 'الخطاف ليس خدعة. هو أول شيء صحيح في الفيديو.',
        by: 'مبدأ عمل Zidex',
      },
      { type: 'h2', id: 'checklist', text: 'قائمة فحص قبل النشر' },
      {
        type: 'checklist',
        items: [
          'اللقطة الأولى تشرح الموضوع في ثلاث كلمات',
          'الصوت يبدأ مع أول إطار، لا بعده',
          'لا يوجد صمت أطول من ٠٫٥ ثانية في البداية',
          'أول انتقال سريع يحدث قبل الثانية الثانية',
          'الدعوة للفعل واحدة فقط، وتقيس شيئاً محدداً',
          'النص المكتوب يطابق ما يُقال منطوقاً',
        ],
      },
      {
        type: 'p',
        text: 'طبّق هذه القائمة على الفيديو القادم، ثم قارن نسبة الإكمال عند ٣ ثوانٍ. هذا كل ما تحتاجه في البداية.',
      },
    ],
  "tiktok-algorithm-2026": [
      {
        type: 'p',
        text: 'أكبر سوء فهم عند صنّاع المحتوى الجدد: أن خوارزمية تيك توك تحاسبك على عدد متابعيك. هذا غير صحيح منذ سنوات. النظام يوزّع على جودة التفاعل في كل دفعة تجريبية، والمتابعات مجرد ناتج جانبي.',
      },
      { type: 'h2', id: 'four-stages', text: 'مراحل التوزيع الأربع' },
      {
        type: 'p',
        text: 'كل فيديو يمر بأربع مراحل، ولكل مرحلة معيار مختلف. الفشل في أي مرحلة يوقف الفيديو فوراً:',
      },
      {
        type: 'ol',
        items: [
          '**المرحلة ١ — دفعة أولية (٢٠–٥٠ مشاهدة).** يعرضه النظام لمشاهدين عشوائيين في فئتك. لا يتجاوز حدًّا أدنى للمشاهدة.',
          '**المرحلة ٢ — الدفعة الثانية (٥٠–٥٠٠).** يكرّر الفيديو نفسه على شريحة أوسع من الجمهور. هنا تظهر مشكلة المحتوى «الموجود للمعجبين فقط».',
          '**المرحلة ٣ — التوسع (٥٠٠–٥٠٬٠٠٠).** يبدأ النظام بالبحث الدلالي: يجرّب الفيديو على مهتمين بالموضوع لا بالمؤلف.',
          '**المرحلة ٤ — الانتشار الواسع (٥٠٬٠٠٠+).** يُعرض على جماهير أوسع. هنا تصبح سرعة الإعادة والمدة الإضافية أهم من النقرات.',
        ],
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'أين يموت معظم الفيديوهات',
        items: [
          'الموت الأول: نسبة إكمال منخفضة في المرحلة الأولى — الخطاف ضعيف.',
          'الموت الثاني: تفاعل عاطفي ضعيف — مشاهدات بدون تعليقات أو حفظ.',
          'الموت الثالث: موضوع ضيق جداً — لا يوجد جمهور يبحث عنه خارج متابعيك.',
        ],
      },
      { type: 'h2', id: 'signals-ranked', text: 'الإشارات مرتبة حسب التأثير' },
      {
        type: 'p',
        text: 'ليست كل الإشارات متساوية. الترتيب العملي من الأقوى أثراً إلى الأضعف:',
      },
      {
        type: 'ul',
        items: [
          '**مدة المشاهدة** — المؤشر الأم. كل ثانية إضافية فوق الطول الطبيعي تُحتسب مرتين.',
          '**إعادة المشاهدة (Replay)** — إشارة قصد قوية جداً، أهم من الإعجاب أحياناً.',
          '**المشاركة** — كل مشاركة تعني توصية مجانية لثلاثة أشخاص خارج جمهورك.',
          '**الحفظ** — يحوّل المحتوى من ترفيه إلى مرجع، ويدفع البحث الدلالي.',
          '**التعليق والسؤال** — يفتح محادثة، ويرفع التوزيع مجدداً.',
          '**الإعجاب** — إشارة ضعيفة نسبياً، وكثيرون يضغطون بلا انتباه.',
        ],
      },
      { type: 'h2', id: 'cadence', text: 'التوقيت والنشر المتكرر' },
      {
        type: 'p',
        text: 'الاستمرارية لا تعني النشر يومياً، بل تعني جدولاً يقدر الجمهور على توقعه. فيديو ممتاز كل ثلاثة أيام أفضل من خمسة متوسطة يومياً:',
      },
      {
        type: 'checklist',
        items: [
          'ثبّت يومين للنشر واحترمهما',
          'انشر ضمن نافذة ذروة الجمهور (غالباً ٨–١١ مساءً محلياً)',
          'أعد نشر أفضل فيديو بأسلوب جديد بعد ٣ أشهر',
          'لا تحذف فيديو حتى لو لم ينتشر — بياناتك منه',
        ],
      },
      {
        type: 'code',
        lang: 'text',
        code: `متى تغيّر أمورك — إشارات تحذير

•  إكمال منخفض ← الخطاف غير واضح، عدّل أول ٣ ثوانٍ
•  مشاهدات عالية + متابعة شبه معدومة ← الموضوع لا يخدم قناة
•  حفظ عالٍ + مشاركة منخفضة ← محتوى مرجعي، اربطه بخطوة تالية
•  كل شيء منخفض ← الصوت أو الصورة، وليس الخوارزمية`,
      },
      {
        type: 'quote',
        text: 'الخوارزمية لا تقيس جودة الفيديو. تقيس ما يفعله المشاهدون بدون أن يطلب منهم أحد.',
      },
      { type: 'h2', id: 'what-to-do', text: 'ماذا تفعل غداً' },
      {
        type: 'p',
        text: 'خذ آخر عشرة فيديوهات وحسب نسبة إكمال ٣ ثوانٍ لكل واحد، ثم رتّبها تنازلياً. الأدنى في القائمة ليس فيديو «سيئ الفكرة» بالضرورة، بل غالباً الفيديو الأحدث نشراً — وهذا يخبرك أن نظامك لم يستقر بعد.',
      },
      {
        type: 'p',
        text: 'اصلح الأسوأ فقط هذا الأسبوع. فيديو واحد محسّن أفضل من عشرة محاولات عشوائية.',
      },
    ],
  "dark-mode-that-works": [
      {
        type: 'p',
        text: 'الوضع الليلي السيئ ليس مجرد «مختلف» عن النهاري، بل أسوأ منه. حين يضع المطور خلفية سوداء نقيّة ونصاً أبيض نقيّاً، تبدو الحروف محفورة ويهتز المقابل البؤري للعين. الحل ليس لوناً آخر، بل نظاماً.',
      },
      { type: 'h2', id: 'the-problem', text: 'لماذا الأسود النقي عدو القراءة' },
      {
        type: 'p',
        text: 'ثلاثة أسباب فيزيائية حقيقية:',
      },
      {
        type: 'ul',
        items: [
          '**التباين المفرط** — نص أبيض على أسود يحقق نسبة تباين قريبة من ٢١:١، أي أكثر بكثير مما تحتاجه العين. والنتيجة إجهاد في المسار البؤري.',
          '**توهج الحروف (Halation)** — الشاشات المضيئة تُنتج هالة حول النص الأبيض، فتلتبس الحروف بطبقاتها.',
          '**اختفاء غير محسوس** — الأسود المطلق يبتلع التفاصيل الدقيقة كالتدرجات والحدود الرفيعة.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'القاعدة العملية',
        items: [
          'لا تستخدم #000000 أبداً كخلفية. استخدم رمادياً داكناً جداً مثل #05060A.',
          'لا تستخدم #FFFFFF للنص الأساسي. استخدم أبيضاً مزاحاً للأزرق مثل #F4F5F8.',
          'التباين المستهدف للنص الأساسي: ١٢:١ إلى ١٥:١، وليس ٢١:١.',
        ],
      },
      { type: 'h2', id: 'tokens', text: 'نظام الـ Tokens: طبقة واحدة تتغير، والباقي لا يُلمس' },
      {
        type: 'p',
        text: 'أكثر ما يفسد الوضعين معاً هو تكرار القيم. الحل هو تعريف **دلالات** بدل ألوان:',
      },
      {
        type: 'code',
        lang: 'css',
        code: `:root {
  --bg: var(--color-ink-50);
  --fg: var(--color-ink-950);
  --fg-muted: var(--color-ink-500);
  --line: color-mix(in oklab, var(--color-ink-950) 10%, transparent);
  --accent: var(--color-ghost-600);
}

.dark {
  --bg: var(--color-ink-950);          /* ليس أسود نقياً */
  --fg: #f4f5f8;                        /* ليس أبيض نقياً */
  --fg-muted: #a2a8b8;
  --line: color-mix(in oklab, #ffffff 11%, transparent);
  --accent: var(--color-ghost-400);     /* أفتح في الليلي */
}

/* الاستهلاك لا يعرف الوضع أبداً */
.my-card {
  background: var(--bg-elevated);
  color: var(--fg);
  border: 1px solid var(--line);
}`,
      },
      {
        type: 'p',
        text: 'لاحظ نمطين أساسيين: **الـ accent يصبح أفتح** في الوضع الليلي لأن التباين يجب أن يبرز، و**الـ line يعتمد على alpha** فيلائم الخلفيتين تلقائياً.',
      },
      { type: 'h2', id: 'anti-flicker', text: 'منع الوميض عند التبديل' },
      {
        type: 'p',
        text: 'الوميض الأبيض عند تحميل الصفحة هو أشهر عيب في أي وضع ليلي. سببه أن React يُركّب بعد أن يُرسم الإطار الأول. الحل: سكربت متزامن في `head` قبل أي CSS:',
      },
      {
        type: 'code',
        lang: 'html',
        code: `<script>
  (function () {
    var stored = localStorage.getItem('ghost-theme');
    var system = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    var theme = stored || system;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  })()
</script>`,
      },
      {
        type: 'p',
        text: 'هذا السكربت يُنفَّذ قبل تلوين أول بكسل، فالنتيجة صفر وميض — مهما كان بطء الشبكة.',
      },
      { type: 'h2', id: 'images', text: 'الصور والأيقونات لا تتبع الوضع تلقائياً' },
      {
        type: 'ul',
        items: [
          'أضف `filter: invert(1) hue-rotate(180deg)` للصور الملونة في الوضع الليلي، أو استخدم `picture` مع `source media`.',
          'استخدم أيقونات SVG حبرية (`currentColor`) لتتبع النص تلقائياً.',
          'تجنّب الشعار كصورة: اجعله SVG ليتبع الوضعين.',
        ],
      },
      { type: 'h2', id: 'respect-preference', text: 'احترام تفضيل النظام' },
      {
        type: 'p',
        text: 'لا تفرض الوضع أبداً. اتبع نظام المستخدم حتى يغيّر يدوياً، ثم توقّف عن متابعته — لأن المستخدم غيّر رأيه بقرار:',
      },
      {
        type: 'checklist',
        items: [
          'الافتراضي من `prefers-color-scheme`',
          'الاختيار اليدوي يُحفظ في localStorage',
          'بعد الاختيار اليدوي لا تستمع لتغيير النظام',
          'السكربت المتزامن يمنع الوميض',
          '`<meta name="theme-color">` يتبدّل مع الوضع',
        ],
      },
    ],
  "link-hub-that-converts": [
      {
        type: 'p',
        text: 'أكثر خطأ شائع في صفحات الروابط: وضع عشرة روابط متشابهة في قائمة واحدة. النتيجة أن الزائر لا يضغط أياً منها. الصفحة الناجحة هي التي ترتّب الخيارات حسب احتمال النقر وتجعل القرار سهلاً.',
      },
      { type: 'h2', id: 'hierarchy', text: 'الهرمية قبل التنسيق' },
      {
        type: 'p',
        text: 'قبل أي سؤال عن الألوان، أجب: ماذا تريد أن يفعل الزائر؟ غالباً واحد من ثلاثة، ولن يفعل أكثر من واحد:',
      },
      {
        type: 'ol',
        items: [
          '**يتابعك** — لذلك الرابط الأول يجب أن يكون حسابك، وأن يكون الأضخم بصرياً.',
          '**يستهلك محتوى** — مدونة أو سلسلة، هنا تذهب إلى المقالات.',
          '**يتواصل** — تعاون تجاري أو سؤال من زائر، برابط وزن بصري أقل.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'قاعدة 7–2–1',
        items: [
          '٧ روابط لمحتوى أو أدوات تخدم الجمهور.',
          'رابطان لصفحات تخصّك (عنك، blog).',
          'رابط خارجي واحد فقط — لا تزاحمه بغيره.',
        ],
      },
      { type: 'h2', id: 'card-design', text: 'البطاقة تحتاج أكثر من رابط' },
      {
        type: 'p',
        text: 'كل بطاقة تحتوي أربع معلومات: أيقونة، عنوان، سطر وصف، وشارة اختيارية. سطر الوصف هو الأهم — هو الذي يخبر الزائر ماذا يحصل بالضبط قبل الضغط.',
      },
      {
        type: 'ul',
        items: [
          'العنوان: فعل أو مورد واضح، لا كلمة غامضة مثل «اضغط هنا».',
          'الوصف: جملة واحدة تصف الناتج، لا الوصف الداخلي.',
          'الشارة: استخدمها لما هو جديد فعلاً — «جديد» أو «الأكثر قراءة».',
          'الأيقونة: اربطها بلون ثابت لا بلون عشوائي كل أسبوع.',
        ],
      },
      { type: 'h2', id: 'friction', text: 'الاحتكاك يقتل التحويل' },
      {
        type: 'stats',
        items: [
          { value: '< 1s', label: 'زمن الفتح المستهدف' },
          { value: '1', label: 'نقرة (لا نافذة جديدة لمرة واحدة)' },
          { value: '4', label: 'روابط أو أقل في العرض الأول' },
        ],
      },
      {
        type: 'p',
        text: 'افتح الروابط الخارجية في نفس التبويب. فتح نافذة جديدة يقطع سياق المستخدم ويقلّل العودة. الاستثناء الوحيد: نسخ الرابط، أو أي إجراء قد يُفقد المستخدم بياناته.',
      },
      { type: 'h2', id: 'measure', text: 'ما الذي يجب أن تقيسه' },
      {
        type: 'ul',
        items: [
          'نسبة الضغط على الرابط الأول — أهم رقم في الصفحة كلها.',
          'أي الروابط تُتجاهل دائماً؟ احذفها أو أعد صياغتها.',
          'معدل عودة من المدونة إلى صفحة الروابط.',
          'الزمن بين أول زيارة وآخر زيارة (يعكس جودة العمود).',
        ],
      },
      {
        type: 'quote',
        text: 'كل رابط إضافي لا يضغطه أحد هو ضجيج. الضجيج لا يضيف قيمة، بل يخفض قيمة ما هو مهم.',
        by: 'مبدأ صفحة الروابط',
      },
      { type: 'h2', id: 'checklist', text: 'قائمة فحص' },
      {
        type: 'checklist',
        items: [
          'الرابط الأول هو الأهم بصرياً، لا الأكثر تحديثاً',
          'كل بطاقة لها وصف من جملة واحدة',
          'لا رابط ميت — افحصها كلها دورياً',
          'الروابط الخارجية في نفس التبويب',
          'الصفحة تعمل بنفس الجودة على الجوال',
          'نمط الرابط واضح أثناء التحويم (hover/focus)',
        ],
      },
    ],
  "mobile-first-performance": [
      {
        type: 'p',
        text: 'متوسط المستخدم يزور صفحتك على جهاز عمره سنتان، على شبكة بطيئة، وهو في عجلة. كل قرار تقني يجب أن يُحاكم بهذا السيناريو، لا على شاشة مكتبية سريعة.',
      },
      { type: 'h2', id: 'metrics', text: 'المؤشرات الأربعة التي تهم' },
      {
        type: 'ol',
        items: [
          '**LCP** — أكبر عنصر ظاهر. الهدف أقل من ٢.٥ ثانية على شبكات الجوال.',
          '**INP** — استجابة التفاعل. يحلّ محل FID. الهدف أقل من ٢٠٠ مللي ثانية.',
          '**CLS** — استقرار التخطيط. أقل من ٠.١. أي قفزة في التخطيط تكلّفك نقرات.',
          '**TTFB** — زمن أول بايت. أقل من ٨٠٠ مللي ثانية على الاستضافة الثابتة.',
        ],
      },
      {
        type: 'callout',
        tone: 'warn',
        title: 'أين تذهب الطاقة فعلاً',
        items: [
          'JavaScript التحليلي (hydration) — ليس الحجم بل وقت التنفيذ.',
          'خطوط الويب: كل خط بأربعة أوزان يعني أربعة طلبات. ابدأ بخط واحد بوزنين.',
          'الصور: مقاس غير مناسب يحمّل ٣ أضعاف الحاجة على الجوال.',
          'الحركات: `transform` و `opacity` فقط — أي خاصية أخرى تسبّب إعادة تخطيط في كل إطار.',
        ],
      },
      { type: 'h2', id: 'cls', text: 'CLS: أكثر خطأ يقع فيه المبتدئون' },
      {
        type: 'p',
        text: 'القفزة المفاجئة في التخطيط سببها عنصر بلا أبعاد محجوزة. القاعدة: أي عنصر سيظهر لاحقاً يحتاج `width` و `height` أو `aspect-ratio`:',
      },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- خطأ: الصورة بلا أبعاد، المتصفح يحجز لا شيء -->
<img src="cover.jpg" alt="غلاف" />

<!-- صواب: أبعاد صريحة تمنع القفزة -->
<img
  src="cover.jpg"
  alt="غلاف"
  width="1200"
  height="630"
  loading="lazy"
  decoding="async"
/>

<!-- بديل نظيف: حاوية بنسبة أبعاد ثابتة -->
<div class="aspect-video overflow-hidden">
  <img src="cover.jpg" alt="غلاف" class="h-full w-full object-cover" />
</div>`,
      },
      { type: 'h2', id: 'font', text: 'الخطوط: أكبر مصدر صامت للبطء' },
      {
        type: 'p',
        text: 'تحميل خط عربي كامل بأربعة أوزان يساوي ٤ طلبات و٤٠٠ كيلوبايت. ثلاثة تصحيحات عملية:',
      },
      {
        type: 'ul',
        items: [
          'استخدم `font-display: swap` لتفادي نص غير مرئي.',
          'حمّل وزناً واحداً في الـ hero، وأضف الباقي عند الحاجة فقط.',
          '`preconnect` لخادم الخطوط يقلّل TTFB للخط نفسه.',
        ],
      },
      { type: 'h2', id: 'measure-real', text: 'قِس على جهاز متوسط' },
      {
        type: 'p',
        text: 'اختبار Lighthouse على جهازك يخدعك. لأرقام صادقة:',
      },
      {
        type: 'checklist',
        items: [
          'خنق الشبكة إلى «Slow 4G» قبل القياس.',
          'خنق المعالج بنسبة ٤ أضعاف.',
          'قِس في وضع التصفح الخاص (بدون إضافات).',
          'كرّر القياس ٣ مرات خذ المتوسط.',
          'افحص على جهاز Android متوسط الفئة فعلياً إن أمكن.',
        ],
      },
      {
        type: 'code',
        lang: 'text',
        code: `ميزانية أداء عملية

< 200KB   JavaScript المُحمَّل مبدئياً  ✅
< 100KB   CSS المُحمَّل مبدئياً          ✅
< 1.4s    LCP على Slow 4G               ✅
< 200ms   INP على خنق 4×               ✅`,
      },
    ],
  "consistent-visual-identity": [
      {
        type: 'p',
        text: 'الانطباع الأول لا يتكوّن من المحتوى، بل من الشكل. زائر جديد يرى منشوراً واحداً فقط، فيصعب عليه تذكّرك غداً. الهوية هي ما يجعله يتذكّرك.',
      },
      { type: 'h2', id: 'four-elements', text: 'أربعة عناصر تكفي' },
      {
        type: 'ol',
        items: [
          '**لونان بالضبط** — لون أساسي للتمييز، ولون ثانوي للتباين. لا ثالث. أكثر من ذلك يحوّل الهوية إلى فوضى.',
          '**شكل ثابت** — زوايا حادة، مستديرة، أو هجينة. اختر واحداً والتزم به في كل زر وبطاقة.',
          '**طباعة واحدة** — خط واحد بوزنين. العربية تحتاج خطاً يدعم التشكيل بشكل صحيح — لا ترضَ بخط بديل سيّئ.',
          '**صورة رمزية واحدة** — أيقونة واحدة تُستخدم في كل مكان: صورة الملف الشخصي، الأفاتار، والعلامة المائية على الفيديو.',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: 'اختبار الثلاث ثوانٍ',
        items: [
          'اعرض منشوراتك الخمسة الأخيرة في صف واحد.',
          'هل يبدو كأنها من نفس الشخص خلال ٣ ثوانٍ؟',
          'إن كان لا، فالمشكلة في الشكل لا في المحتوى.',
        ],
      },
      { type: 'h2', id: 'contrast', text: 'التباين هو الاحترافية' },
      {
        type: 'p',
        text: 'الألوان الجميلة التي لا تُقرأ لا تستحق وجودها. القاعدة العملية: كل نص أصغر من ١٨ بكسل يحتاج تبايناً لا يقل عن ٤.٥:١، والعناوين الكبيرة ٣:١ تكفي.',
      },
      {
        type: 'code',
        lang: 'text',
        code: `قياس التباين يدوياً

1. خذ لون النص ولون الخلفية كـ hex
2. احسب الإضاءة النسبية (L) لكل منهما
3. النسبة = (L₁ + 0.05) / (L₂ + 0.05)
4. النتيجة ≥ 4.5 للنص العادي، ≥ 3 للعناوين

نصيحة: استخدم color-mix في CSS لتهدئة الألوان
بدلاً من البحث عن shade يدوي.`,
      },
      { type: 'h2', id: 'motion', text: 'الحركة جزء من الهوية' },
      {
        type: 'p',
        text: 'حركة واحدة مميزة تفعل أكثر من عشر انتقالات عادية. اختر «إيقاعاً» واحداً — مدة واحدة، منحنى واحد — وطبّقه في كل الموقع:',
      },
      {
        type: 'ul',
        items: [
          'مدة: ٠.٢ – ٠.٣ ثانية للتفاعلات، ٠.٥ – ٠.٨ للظهور.',
          'منحنى: `cubic-bezier(0.16, 1, 0.3, 1)` ناعم، أو `spring` للقفزات.',
          'الخصائص: `transform` و `opacity` فقط — أي خاصية أخرى تسبّب إعادة تخطيط في كل إطار.',
          'احترم `prefers-reduced-motion` دائماً: من يطلب تقليل الحركة يحتاجها فعلاً.',
        ],
      },
      {
        type: 'quote',
        text: 'الاتساق لا يعني الجمال. الاتساق يعني أن الزائر يعرفك بعد منشور واحد.',
      },
      { type: 'h2', id: 'checklist', text: 'قائمة فحص الهوية' },
      {
        type: 'checklist',
        items: [
          'لونان فقط، لا ثالث',
          'نصف قطر زوايا واحد في كل مكان',
          'خط واحد بوزنين، بدعم تشكيل صحيح',
          'أيقونة واحدة متكررة',
          'نسبة تباين ≥ 4.5 للنصوص الصغيرة',
          'مدة انتقال واحدة، وحركة تحترم تفضيل تقليل الحركة',
          'نفس الصفحة على الجوال والحاسوب',
        ],
      },
    ],
}
