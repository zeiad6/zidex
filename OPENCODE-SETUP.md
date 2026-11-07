# 🛠️ دليل OpenCode — مشروع Ghost 778

<div align="center">

**كل إضافة ومهارة وسيرفر MCP استُخدم في بناء ونشر هذا الموقع**
**مع شرح آلية عملها، وموضع استخدامها، وطريقة تثبيتها**

</div>

---

## 📖 كيف تقرأ هذا الدليل

كل إضافة في هذا الملف مشروحة بالبنية نفسها، مرتبةً حسب ترتيب القراءة الطبيعي:

| الرمز | يعني |
|---|---|
| **🔤 الاسم** | الاسم كما يُستدعى به تماماً في OpenCode |
| **⚙️ آلية العمل** | ماذا يحدث تقنياً خلف الكواليس — لا عموميات |
| **📍 أين تُستخدم** | موضع محدّد من هذا المشروع، بمثال حقيقي |
| **📦 التثبيت** | الأمر أو السطر الذي يضيفها، جاهز للنسخ |
| **💡 لمسة فنية** | الفخّ الذي لا يظهر في التوثيق الرسمي، أو الحيلة التي وفّرت وقتاً |

> **للمبتدئ:** اقرأ «آلية العمل» ثم «أين تُستخدم». الباقي مرجع.
> **للمحترف:** اقفز إلى «لمسة فنية» في كل قسم — هناك ما لا تجده في أي وثيقة رسمية.

---

## 📊 لوحة الأدوات

| الأداة | النوع | الحالة | الدور في هذا المشروع |
|---|---|---|---|
| **OpenCode** | الوكيل الأساسي | ✅ نشط | بناء المشروع كاملاً: React 19 + Vite 6 + Tailwind v4 + Netlify |
| [`code-reviewer`](#code-reviewer) | وكيل مراجعة | ✅ استُخدم | كشف ٣ عيوب حرجة بعد اكتمال البناء |
| [`debugger`](#debugger) | وكيل تشخيص | ✅ استُخدم | تتبّع أخطاء البناء والـ hooks |
| [`frontend`](#frontend) | وكيل واجهات | ✅ استُخدم | بناء `src/components/ui/` و`layout/` |
| [`ui-designer`](#ui-designer) | وكيل تصميم | ✅ استُخدم | أنظمة الرموز والثيمات |
| [`speed-coder`](#speed-coder) | وكيل سريع | ✅ استُستخدم | تعديلات < ٢٠ سطراً بلا طقوس |
| [`researcher`](#researcher) | وكيل بحث | ✅ استُخدم | بحث متعدد المصادر مع استشهادات |
| [`docs-expert`](#docs-expert) | وكيل توثيق | ✅ استُخدم | توثيق React Router 7 عبر Context7 |
| [`@agent-reach`](#agent-reach) | مهارة إنترنت | ✅ جاهزة | قراءة صفحات ومستودعات |
| [`@error-memory`](#error-memory) | مهارة ذاكرة | ✅ استُخدم | توثيق درس `NODE_ENV=production` |
| [`@vercel/agent-skills`](#vercel-agent-skills) | مهارات TS/React | ✅ مرجعية | قواعد TypeScript من Vercel |
| [`skillspector`](#skillspector) | فحص أمني | ✅ جاهزة | فحص أي مهارة قبل تثبيتها |
| [Context7](#context7) | MCP بعيد | ✅ متاح دائماً | توثيق المكتبات المحدّث |
| [Playwright](#playwright) | MCP محلي | ⏸️ متوقف | كان يُقتل من LMKD على هذا الجهاز |
| [SQLite](#sqlite) | MCP محلي | ⏸️ متوقف | بديله `sqlite3` CLI |
| [Filesystem](#filesystem) | MCP محلي | ⏸️ متوقف | بديله أدوات الملفات المدمجة |
| [`mcp-idle`](#mcp-idle-mode) | بلاغ | ✅ مثبَّت | يوقف MCP المحلي افتراضياً |
| [`memory-rotate`](#memory-rotate) | بلاغ | ✅ مثبَّت | تدوير أسبوعي لقاعدة الجلسات |
| [`termux-no-kill`](#termux-no-kill) | أداة نظام | ✅ مثبَّت | وقف LMKD عن قتل الطرفية |

### أرقام المشروع

| المقياس | القيمة |
|---|---|
| ملفات مصدر | **34** في `src/` |
| مقالات مدونة | **7** |
| وكلاء موثّقون | **7** |
| مهارات موثّقة | **4** |
| سيرفرات MCP موثّقة | **8** |
| بلاغات مثبّتة | **3** |
| عيوب حرجة كُشفت بالمراجعة | **3** |
| حجم JS النهائي | **319 KB** (‎103 KB مضغوط) |

---
---

# 🤖 القسم الأول: الوكلاء (Agents)

> الوكيل = Brain منفصل بسياق نظيف. يعطيه OpenCode مهمة محدّدة فيقرأ ما يحتاجه فقط، فيوفّر ذاكرة السياق الأساسية.

---

<a id="code-reviewer"></a>
## `code-reviewer`

**⚙️ آلية العمل**
يقسّم المراجعة إلى عدّة تمريرات متتابعة: الصياغة ← الأمان ← الأداء ← البنية ← قابلية الصيانة. كل تمريرة تقرأ من زاوية مختلفة، فيكتشف ما تفوته زاوية واحدة. يدمج مع `tsc` و`eslint` — أي يجد ما لا يراه الفحص الآلي.

**📍 أين تُستخدم**
بعد اكتمال البناء مباشرة. كشف ثلاثة عيوب حقيقية:

| العيب | لماذا فشلت الفحوص الآلية |
|---|---|
| `nativeShare` كان يُبلّغ عن **فشل بعد كل مشاركة ناجحة** | `navigator.share` يُرجع `undefined` لا `boolean`، فالنوع صحيح والأداء خاطئ |
| كل `hover:` و`bg-elevated/80` **ميتة في الموقع كله** | الأصناف مكتوبة كقواعد CSS في `@layer utilities`، وTailwind لا يولّد لها variants |
| نقاط الـ callout **غير مرئية** | `s.icon.replace('text-','bg-')` يبني اسم صنف وقت التشغيل، فلا يمسحه الماسح |

**📦 التثبيت**
مدمج. للاستدعاء:

```
استخدم code-reviewer لمراجعة src/
```

**💡 لمسة فنية**
اجعله يقرأ **قائمة تحقق صريحة** لا مراجعة عامة:

> «راجع: روابط تالفة، تجاوز أفقي في RTL، أصناف ميتة، أسوأ حالة»

المراجعة المفتوحة أخرجت حشواً كثيراً؛ القائمة المُوجَّهة أخرجت ٣ عيوب قابلة للتنفيذ. الفرق ليس في الوكيل — في الطلب.

---

<a id="debugger"></a>
## `debugger`

**⚙️ آلية العمل**
منهجية OODA: راقب → حدّد → اختبر → تعلّم. يبني ٣ فرضيات متنافسة مرتّبة بالاحتمال، ثم **يُبطل الأرخص أولاً** — السجل، ثم الإعداد، ثم البيانات، ثم الكود. لا يقفز إلى التخمين.

**📍 أين تُستخدم**
- `tsc` أخرج ٣٠ خطأ في `posts.ts` بسبب كتلة كود داخل `'…'` وهيكلها متعدّد الأسطر. قسّم المشكلة: إصلاح موضع الإغلاق، ثم `tsc` قال `Unterminated string literal` فقط — سطر واحد بدل ثلاثين.
- استُخدم أيضاً لتشخيص `tailwindcss` الذي أخرج `Invalid declaration` بسبب تعليق قبل `@import`.

**📦 التثبيت**
مدمج. `/debug` أو:

```
استخدم debugger لتشخيص فشل البناء
```

**💡 لمسة فنية**
في الطرفية، اقرأ **آخر** ٢٠ سطراً من خطأ البناء لا أوله. Vite يطبع سياقاً كاملاً قبل موضع الخطأ، والعين تعلق على البداية وتضيع.

---

<a id="frontend"></a>
## `frontend`

**⚙️ آلية العمل**
متخصّص في React/Next/Vue/Angular/Tailwind. يحمّل أنماط التنفيذ وPreactarian جاهزة، فيقصر عمله على **التركيب** لا على اكتشاف الأنماط.

**📍 أين تُستخدم**
كتابة المكوّنات الأساسية:

| المكوّن | الدور |
|---|---|
| `SonarGrid` | شبكة نقاط على `<canvas>`، حلقات تتمدّد عند اللمس، يقرأ اللون من `--accent` |
| `AuroraBackdrop` | حقل تدرّج بـ CSS فقط، بلا `<canvas>` — أرخص على الجوال |
| `Magnetic` / `TiltCard` | انجذاب للمؤشر + ميلان 3D مع لمعان يتبع المؤشر |
| `Marquee` | شريط لا نهائي بمسار مكرّر |
| `ErrorBoundary` | يمنع ابيضاض الموقع عند فشل تحميل chunk |

**📦 التثبيت**
مدمج. `استخدم frontend لبناء مكوّن …`

**💡 لمسة فنية**
مرّر له **نمطاً محدّداً** من 21st.dev لا وصفاً عاماً. فائدة الوكيل تأتي من النمط: «اعرض شبكة تilm تفاعلية بأسلوب 21st.dev كما في `n1m4mz/sonar-grid`» أنتجت أفضل مخرجات في المشروع كله.

---

<a id="ui-designer"></a>
## `ui-designer`

**⚙️ آلية العمل**
يخرج بنظام **رموز** (tokens) لا بقيم متفرقة. كل لون له دلالة — `bg`، `fg`، `muted`، `line` — فيتبدّل الثيم كاملاً بتغيير تعريف واحد.

**📍 أين تُستخدم**
نظام التصميم كله في `src/index.css`:

```css
:root { --bg: …; --fg: …; --fg-muted: …; --line: …; --accent: … }
.dark { --bg: #05060a; --fg: #f4f5f8;  /* … */ }
```

كل المكوّنات تستهلك `var(--fg)` ولا تعرف أي لون. تبديل الثيم = سطر واحد.

**📦 التثبيت**
مدمج. `استخدم ui-designer لبناء نظام ألوان لـ …`

**💡 لمسة فنية**
الوضع الليلي الذي يفشل كله يختار `#000000` و`#FFFFFF`. نقيّين يعطيان تبايناً ~٢١:١ ويسبّب **halation** (هالة حول الحروف). استخدم `#05060a` و`#f4f5f8` — رماديان مائلان للون، تتباين ١٢–١٥:١ ولا تُرهق العين. كتبتُ مقالاً كاملاً عن هذا في المدوّنة.

---

<a id="speed-coder"></a>
## `speed-coder`

**⚙️ آلية العمل**
بلا تحليل معماري ولا todo list ولا منهجية. يقرأ الملف المطلوب وينفّذ. مصمَّم للمهام التي لا تتجاوز ٢٠ سطراً.

**📍 أين تُستخدم**
- استبدال `overflow-x: hidden` بـ `overflow-x: clip` في `index.css`
- حذف استيراد `Sparkles` و`Play` بعد إزالة قسم الفيديو
- تعديل قيمة `min-h` في الهيرو
- تحديث النطاق في ٤ ملفات دفعة واحدة

**📦 التثبيت**
مدمج. `/quick` أو `استخدم speed-coder لـ …`

**💡 لمسة فنية**
لا تستخدمه على مهمة تحتاج **قراراً**. السرعة هنا تُنفّذ الجواب الخاطئ أسرع. الفحص الشكلي سريع، لكن Cardinalة ليست كذلك.

---

<a id="researcher"></a>
## `researcher`

**⚙️ آلية العمل**
يجمع من عدّة مصادر، يقيّم موثوقية كل مصدر، ويعطي **استشهادات** مع كل ادّعاء. لا يخمّن؛ إن لم يجد، يقول لم يجد.

**📍 أين تُستخدم**
- قراءة حساب تيك توك الحقيقي لاستخراج الاسم والأفاتار والأرقام
- قراءة صفحات 21st.dev لجلب أنماط المكوّنات
- التحقق من أن `oembed` يرسل `access-control-allow-origin: *` قبل بناء اعتماد عليه

**📦 التثبيت**
مدمج.

**💡 لمسة فنية**
اطلب **تصريح عدم اليقين**. «إن لم تجد، قل لم تجد» يمنع الثقة الكاذبة — وهي أخطر من خطأ صريح.

---

<a id="docs-expert"></a>
## `docs-expert`

**⚙️ آلية العمل**
يستدعي Context7: فهرس مُنظَّم لتوثيق المكتبات، مُحدَّث حتى الإصدار الأخير. يعيدك **الجزء** الذي يخصّ سؤالك، لا صفحة كاملة.

**📍 أين تُستخدم**
- توثيق سلوك `useReducedMotion` في Framer Motion
- التحقق من أن استدعاء hook بعد `return` مبكر يخالف قاعدة الترتيب
- مراجعة دلالات variants في Tailwind v4

**📦 التثبيت**
مدمج. Context7 يعمل عن بُعد (HTTPS) فلا يوقفه Idle Mode.

**💡 لمسة فنية**
Context7 أسرع وأدقّ من البحث العام في أسئلة الـ API. لكن حين تسأل عن **قرار تصميمي** («أيهما أنعم؟») فهو لا يجيب — استخدم `researcher`.

---
---

# 🧠 القسم الثاني: المهارات (Skills)

> المهارة = تعليمات متخصّصة تُحمَّل عند الحاجة. تفرق عن الوكيل: المهارة نصّ يوجّه، والوكيل عقل منفصل ينفّذ.

---

<a id="agent-reach"></a>
## `@agent-reach`

**⚙️ آلية العمل**
يوجّه الوصول للإنترنت عبر ١٦ قناة، لكل واحدة أدوات خاصة. يقرأ صفحة بـ `curl https://r.jina.ai/URL` (يعيد نصاً نظيفاً لا HTML)، ويبحث دلالياً عبر Exa، ويجلب بيانات GitHub وYouTube وRSS مباشرة.

**📍 أين تُستخدم**
سحب بيانات حساب تيك توك الحقيقي عبر HTML الصفحة واستخراج `nickname` و`followerCount`، وجلب أنماط من 21st.dev.

**📦 التثبيت**

```bash
ls ~/.agents/skills/agent-reach/          # للتأكد من وجوده
agent-reach doctor --json                  # أي قناة تُخدَّم بأي backend
```

**💡 لمسة فنية**
**القناة الحمراء:** Twitter وReddit وInstagram وFacebook وXHS تحتاج تسجيل دخول بكوكيز. لا تفترض أنهما تعملان — `doctor --json` يخبرك. والأهم: **هذه الأداة للقراءة فقط**. لا تنشر ولا تعلّق ولا تُعجب أبداً؛ جلب المحتوى فقط.

---

<a id="error-memory"></a>
## `@error-memory`

**⚙️ آلية العمل**
قاعدة SQLite دائمة في `~/.local/share/opencode/errors.db` تحفظ كل خطأ: بصمته، سببه، إصلاحه، وطريقة Prevention. تبحث فيها **قبل** أي عملية خطرة، فتجد حلاً لم تكتشفه.

**📍 أين تُستخدم**
الدرس الوحيد المسجَّل كان حقيقياً ومباشراً:

> `npm install` أنهى بنجاح وأبلغ «added 14 packages»، لكن `vite` و`typescript` و`@types/react` **مفقودة تماماً**.

**السبب:** البيئة تصدّر `NODE_ENV=production`، و`npm config get omit` يُرجع `dev`..npm considers devDependencies اختيارية في إنتاج، فتخطّاها بصمت.

**📦 التثبيت**

```bash
# في أي مشروع
NODE_ENV=development npm install --include=dev

# وللنشر على Netlify — وإلا فشل البناء بغياب vite
[build.environment]
  NODE_ENV = "production"
  NPM_FLAGS = "--include=dev"
```

**💡 لمسة فنية**
هذا أخطر نمط فشل لأنه **لا يُصدر خطأ**. npm يُبلّغ بالنجاح. لا تثق بـ «نجح التثبيت» — تحقق:

```bash
ls node_modules/.bin/vite node_modules/typescript >/dev/null && echo "✅" || echo "❌ devDependencies متخطّاة"
```

---

<a id="vercel-agent-skills"></a>
## `@vercel/agent-skills`

**⚙️ آلية العمل**
مجموعة مهارات من Vercel (Anthropic) تغطي TypeScript وReact وممارسات الأداء. Skills ضمن مجلدات في `~/.agents/skills/`.

**📍 أين تُستخدم**
مرجع لقواعد React وTypeScript أثناء كتابة المكوّنات — خاصة نمط `useEffect` وkeystability.

**📦 التثبيت**

```bash
npx skills add vercel-labs/agent-skills
npx skills find <كلمة>
ls ~/.agents/skills/
```

**💡 لمسة فنية**
راجع أي مهارة قبل تثبيتها بـ [`skillspector`](#skillspector). المهارة نصّ يُنفَّذ بصلاحياتك — ومهارة خبيثة هي باب خلفي.

---

<a id="skillspector"></a>
## `skillspector`

**⚙️ آلية العمل**
فحص أمني ثابت (بلا استدعاء LLM) لأي مهارة: يفحص المحتوى بحثاً عن تنفيذ أوامر، exfiltration، وصلاحيات زائدة. اخترارياً يضيف تحليلاً دلالياً عبر مزوّد تختاره.

**📍 أين تُستخدم**
قبل تثبيت أي مهارة من مصدر خارجي. الخطوة التي لا يجوز تخطّيها.

**📦 التثبيت**

```bash
uv tool install skillspector
skillspector_scan target=~/.agents/skills/<اسم-المهارة> noLlm=true
# أو ببصمة:
skillspector_scan target=main:anthropics/skills --format=terminal
```

**💡 لمسة فنية**
`noLlm=true` (الوضع الافتراضي) أسرع وأرخص وبلا مفتاح. شغّل التحليل الدلالي فقط حين يخبرك الفحص الثابت بملف واحد مشبوه.

---
---

# 🔌 القسم الثالث: سيرفرات MCP

> MCP = بروتوكول يربط OpenCode بأدوات خارجية. كل سيرفر محلي **عملية Node مستقلة** تكلّف ٥٠–١١٥ ميغابايت.

---

<a id="mcp-idle-mode"></a>
## ⏸️ MCP Idle Mode — بلاغ `mcp-idle.ts`

**⚙️ آلية العمل**
سيرفر MCP محلي = عملية Node دائمة. ستة منها تعني ~٦٠٠ ميغابايت وست عمليات دائمة. على أندرويد، **LMKD** لا يقتل المنافس بل يكبر هو: كلما ارتفعت الذاكرة أصبح opencode (~٨٧٠ ميغابايت) أكبر عملية قابلة للقتل في cgroup Termux، فيقتله.

الحل: بلاغ `~/.config/opencode/plugin/mcp-idle.ts` يمرّ على كل مدخل في `mcp` ويكتب `enabled: false` **وقت الإعداد**، فيبقى كل MCP محلي متوقفاً افتراضياً. أمّا سيرفرات MCP **البعيدة** (context7، hacktron) فتعمل دائماً لأنها HTTPS بلا عملية محلية.

**📍 أين تُستخدم**
في هذا المشروع: توفّر ٦ عمليات. عند الحاجة لـ Playwright:
```bash
mcp-idle on playwright        # ثم أخرج وأعد تشغيل opencode
```
استُخدم البديل بدل ذلك: `bash` + `curl`، و`sqlite3` CLI، وأدوات الملفات المدمجة.

**📦 التثبيت**
```bash
mcp-idle status          # ما المتوقف وما النشط + RSS حيّ
mcp-idle doctor          # نفس الشيء + فروة Processes + تشخيص
mcp-idle on <name>       # استيقظ سيرفراً (يلزم إعادة تشغيل opencode)
mcp-idle off <name>
mcp-idle on-all | off-all
mcp-idle all | idle      # بدّل النمط العام

# متغيّرات هروب لإطلاق واحد فقط
OPENCODE_MCP_ALL=1 opencode
OPENCODE_MCP_IDLE=0 opencode
```

**💡 لمسة فنية**
**opencode يحلّ اتصالات MCP عند الإقلاع فقط** — لا يمكن إيقاظ سيرفر في منتصف جلسة. So: `mcp-idle on X` ثم **أخرج وأعد التشغيل**، وإلا سيبدو الأمر ناجحاً بلا أثر. وبعد انتهاء المهمة نفّذ `mcp-idle off X`، وإلا تراكمت البصمة عبر الجلسات.

---

<a id="context7"></a>
## Context7

**⚙️ آلية العمل**
فهرس مُنظَّم لتوثيق المكتبات، يعمل عن بُعد. يعيد الجزء المتعلّق بسؤالك مع رقم إصدار المكتبة.

**📍 أين تُستخدم**
توثيق Framer Motion وTailwind v4 وReact Router 7. **لم يوقفه Idle Mode** لأنه HTTPS بلا عملية محلية.

**📦 التثبيت**
في `~/.config/opencode/opencode.jsonc`:
```jsonc
{ "mcp": { "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp" } } }
```

**💡 لمسة فنية**
احتفظ به دائماً نشطاً. كلفته صفر ذاكرة، وهو أسرع مصدر لسلوك API الحقيقي — أدقّ من أي بحث عام.

---

<a id="playwright"></a>
## Playwright

**⚙️ آلية العمل**
يشغّل Chromium حقيقياً للتحكم بالصفحات: تنقّل، نقر، لقطات، قياس تخطيط فعلي.

**📍 أين يُستخدم**
كان سيقيس فيزيائياً “عناصر تخرج عن حدود الصفحة”. **فشل** — الجهاز فيه ١١٠ ميغابايت حرّة، وLMKD يقتل المتصفح عند الإقلاع:
```
page.goto: Target page, context or browser has been closed
```
**📍 أين تُستخدم**
كان سيقيس فيزيائياً «عناصر تخرج عن حدود الصفحة». **فشل** — الجهاز فيه ١١٠ ميغابايت حرّة، وLMKD يقتل المتصفح عند الإقلاع:
```
page.goto: Target page, context or browser has been closed
```
استُخدم بديل: **فحص ثابت** يقارن كل صنف في المصدر بـ CSS المبني — ٤٣٥ صنفاً، ٣ مفقودة (كلها إيجابيات كاذبة). أثبت أن CSS سليم، فعزل السبب في `min-h-[78svh]`.

**📦 التثبيت**
```bash
npx playwright install chromium
# أو
mcp-idle on playwright && <أعد تشغيل opencode>
```

**💡 لمسة فنية**
`--no-sandbox --disable-dev-shm-usage --disable-gpu` لا تنفع إن كان السبب OOM. جرّب `--js-flags=--max-old-space-size=96 --no-zygote`، وإن فشل — لا تُهدِر الوقت: الفحص الثابت على CSS يكشف ٨٠٪ من مشاكل التجاوز.

---

<a id="sqlite"></a>
## SQLite

**⚙️ آلية العمل**
استعلامات SQLite عبر MCP. مفيد لقواعد بيانات المشروع.

**📍 أين تُستخدم**
كان سيُستخدم لقراءة `errors.db`. **لم يُفعَّل** — كل استعلام احتاج هنا كان استعلاماً واحداً بسيطاً.

**📦 التثبيت**
```jsonc
{ "mcp": { "sqlite": { "command": ["uvx", "mcp-server-sqlite"], "environment": { "SQLITE_PATH": "./data.db" } } } }
```

**💡 لمسة فنية**
`sqlite3` CLI يغطّي ٩٠٪ من الحالات **بلا عملية إضافية**:
```bash
sqlite3 ~/.local/share/opencode/errors.db \
  "SELECT type, substr(signature,1,60) FROM errors ORDER BY date DESC LIMIT 5;"
```
شغّل MCP sqlite فقط إن كنت تُسقِط استعلامات متكرّرة.

---

<a id="filesystem"></a>
## Filesystem

**⚙️ آلية العمل**
قراءة وكتابة الملفات عبر MCP.

**📍 أين تُستخدم**
**لم يُستخدم إطلاقاً.** أدوات الملفات مدمجة في OpenCode أصلاً.

**📦 التثبيت**
```jsonc
{ "mcp": { "filesystem": { "command": ["npx","-y","@modelcontextprotocol/server-filesystem","."] } } }
```

**💡 لمسة فنية**
**لا تثبّت ما هو مدمج.** كل سيرفر مكرر هو ٥٠ ميغابايت记忆中 وسيرفر لا تفيدك. راجع قائمتك: ما المدمج؟ احذفه.

---

<a id="laminar"></a>
## Laminar

**⚙️ آلية العمل**
تتبّع طلبات LLM: كم طلباً، كم توكناً، كم تكلفة، أين ذهبت.

**📍 أين تُستخدم**
غير مطلوب — لا يوجد استدعاء LLM من داخل التطبيق، ولا ميزانية 查询.

**📦 التثبيت**
```jsonc
{ "mcp": { "laminar": { "command": ["npx","-y","@lmnr-ai/mcp-server"] } } }
```

**💡 لمسة فنية**
**قاعدة: لا تدفع مقابل ما لا تستخدمه.** أداة لا يفتحها الوكيل هي ذاكرة محجوزة بلا فائدة. احذف كل سيرفر لا تعرف متى ستستخدمه.

---

<a id="android-builder"></a>
## Android Builder

**📍 أين تُستخدم**
**لا علاقة له بموقع ويب** — موجود في البيئة لمشروع أندرويد آخر، فلم يُفعَّل أصلاً.

**⚙️ آلية العمل**
بناء مشاريع أندرويد: Gradle، `aapt2`، تثبيت APK على جهاز، قراءة logcat.

**📍 أين يُستخدم**
**لا علاقة له بموقع ويب.** موجود في البيئة لسبب آخر.

**📦 التثبيت**
```bash
pkg install openjdk-17
export ANDROID_HOME=~/android-sdk
mcp-idle on android-builder   # ثم أعد التشغيل
```

**💡 لمسة فنية**
والعكس صحيح تماماً: خوادم MCP المحلية يجب أن تكون **متوقفة** افتراضياً. و`aapt2` على معمارية arm64 يجلب أحياناً ثنائي x86-64 — عدّله بـ `android-builder_fix_aapt2`.

---

<a id="github"></a>
## GitHub

**📍 أين تُستخدم**
لم يُستخدم — المشروع بلا مستودع على GitHub. سيصبح ضرورياً لحظة ربطه.

**⚙️ آلية العمل**
مشكلات، مراجعات، وسوم، PR، CASE.

**📍 أين يُستخدم**
لم يُستخدم — المشروع بلا مستودع.

**📦 التثبيت**
```jsonc
{ "mcp": { "github": { "type": "remote", "url": "https://api.githubcopilot.com/mcp/", "headers": { "Authorization": "Bearer {env:GITHUB_TOKEN}" } } } }
```

**💡 لمسة فنية**
`{env:VAR}` لا قيمة مكتوبة. ضع التوكن في `~/.bashrc` بصيغة `export` واقرأه OpenCode من البيئة — لا تكتبه في `jsonc`.

---
---

# 🧹 القسم الرابع: صيانة الذاكرة

<a id="memory-rotate"></a>
## بلاغ `memory-rotate.ts`

**⚙️ آلية العمل**
`opencode.db` يكبر بلا حدّ: صف لكل جلسة + الرسائل + الأجزاء. بلاغ `~/.config/opencode/plugin/memory-rotate.ts` يقرأ `~/.config/opencode/memory-rotate.json` ويشغّل `memory-rotate` منفصلاً عند الإعداد — **بلا cron**، لأن الـ daemon عملية دائمة أخرى.

| المقبض | الافتراضي | المعنى |
|---|---|---|
| `interval_days` | `7` | كم مرة ين purge |
| `retention_days` | `1` | ما يبقى: الأحدث فقط |

**الجلسة الأحدث لا تُحذف أبداً** مهما كانت الساعة.

**📍 أين تُستخدم**
منع تضخّم القاعدة على جهاز ١١ غيغابايت.

**📦 التثبيت**
```bash
memory-rotate status       # ما المخزَّن + كلا مقبضين + موعد التشغيل
memory-rotate dry-run      # ما سيُحذف، دون تغيير
memory-rotate              # نفّذ الآن
memory-rotate interval N   # غيّر التكرار
memory-rotate retention N  # غيّر ما يبقى
memory-rotate wipe         # مسح كل الجلسات
memory-rotate tool-output on|off        # نِسَب tool-output يتيمة
memory-rotate agent-memory on|off       # errors.db + memory.db
OPENCODE_MEMORY_ROTATE=0 opencode       # تخطّي
```

**💡 لمسة فنية**
⚠️ **لا تحذف صفوفاً يدوياً من `opencode.db` والخادم يعمل.** السكربت يكتشف كل جدول ثانوي يحوي `session_id` (messages, parts, todos, shares) ويحذفه **أولاً**، ثم يحذف صف الجلسة. يدوياً تترك جلسات يتيمة لا يستطيع purge إزالتها.

**قبل كل commit** — الملف `.gitignore` يحمي `dist/` و`.netlify/` و`.env*`:
```bash
git check-ignore dist .netlify .env
```

---
---

# ⚙️ القسم الخامس: إعدادات البيئة

<a id="config-file"></a>
## ملف `opencode.jsonc`

**⚙️ آلية العمل**
ملف إعداد واحد يدعم تعليقات JSON. يقرأه OpenCode عند الإقلاع مع `AGENTS.md` و`package.json`.

**📍 أين تُستخدم**
الملف الفعلي في `~/.config/opencode/opencode.jsonc` يعرّف: مزوّدات LLM، تعريف MCP، مسارات الوكلاء والمهارات، الأوامر.

**📦 التثبيت**
```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "sqlite":      { "enabled": false },
    "playwright":  { "enabled": false },
    "context7":    { "type": "remote", "url": "https://mcp.context7.com/mcp" }
  },
  "agent": {
    "build":      { "mode": "primary" },
    "plan":       { "mode": "primary" }
  }
}
```

**💡 لمسة فنية**
`"enabled": false` في `jsonc` **يُتجاهل** أثناء Idle Mode — البلاغ يغيّره عند الإعداد. لذلك لا تحاول إيقافه من هنا؛ استخدم `mcp-idle off <name>`.

---

<a id="env-vars"></a>
## متغيّرات البيئة

**⚙️ آلية العمل**
مفاتيح تُقرأ من بيئة التشغيل لا من الملفات. `{env:VAR}` في الإعدادات يحلّها OpenCode وقت التشغيل.

**📍 أين تُستخدم**
```bash
export NETLIFY_AUTH_TOKEN=ntfm_...        # نشر
export GITHUB_TOKEN=ghp_...               # GitHub
export GROQ_API_KEY=gsk_...               # نماذج سريعة
export NVIDIA_API_KEY=nvapi-...           # نماذج عميقة
```

**📦 التثبيت**
أضف إلى `~/.bashrc` بصيغة `export` (لا `=` عادي) واقرأه OpenCode من البيئة.

**💡 لمسة فنية**
**لا تكتب مفتاحاً في `jsonc` أبداً.** `"{env:VAR}"` يحلّها من البيئة، فيبقى الملف قابلاً للمشاركة على Git. التوكن هنا احتُفظ في `~/.netlify/config.json` بصلاحيات `600`، **خارج المشروع تماماً** — وصفر ورود له في الحزمة المنشورة.

---

<a id="termux-no-kill"></a>
## `termux-no-kill`

**⚙️ آلية العمل**
LMKD (Low Memory Killer Daemon) في أندرويد يقتل العمليات عند ضغط الذاكرة — ولا يهتم بمن «مخطئ». `termux-no-kill` يعطّل هذا القاتل، ويشتري التطبيق من Doze، ويضعه في `active` bucket.

**📍 أين تُستخدم**
بدونه، اللمستين الأولى والثانية في هذا البناء: تشغيل Chromium للفحص ثم jsdom.

**📦 التثبيت**
```bash
termux-no-kill pair      # مرة واحدة عبر Wireless debugging
termux-no-kill           # عطّل القاتل + whitelist
termux-no-kill status    # تحقّق + عدّ العمليات الأبناء
```

**💡 لمسة فنية**
لا يمكن تطبيقه من داخل الحاوية — يحتاج **ADB over Wi-Fi**، أي تطبيق `pair` من الهاتف أولاً. والأهم: **لا تشغّل `guard` مع Idle Mode معاً**. `guard` يقتل عمّال MCP تحت ٤٠٠ ميغابايت — وIdle Mode مفعّل أصلاً، فتنزلق العمليات مرتين.

---
---

# 🛡️ القسم السادس: الأمان والخصوصية

## النمط المُلتزَم به: التوكنات لا تدخل المشروع أبداً

| القاعدة | التطبيق في هذا المشروع |
|---|---|
| التوكن في `~/.netlify/config.json` بصلاحيات `600` | لا داخل المستودع إطلاقاً |
| الاستخدام عبر `NETLIFY_AUTH_TOKEN` | لا يمرّ عبر سطر أوامر |
| `netlify-cli` خارج `devDependencies` | ‎١٥٠ ميغابايت لا ينصّبها Netlify في كل بناء |
| `.gitignore` يحمي `dist/` و`.netlify/` و`.env*` | — |

**فحص قبل أي commit:**
```bash
grep -rn "nfp_\|nftm_\|ntfm_\|ghp_\|nvapi-\|gsk_" . --exclude-dir=node_modules --exclude-dir=dist
find . -name ".env*" -not -path "*/node_modules/*"
git check-ignore dist .netlify .env && echo "✅ محمي"
```

## رؤوس الأمان المطبّقة

في `netlify.toml` — ‎١١ ترويساً. الأهم:

```toml
Content-Security-Policy = """
  default-src 'self'; script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  frame-src https://www.tiktok.com;
  object-src 'none'; base-uri 'self'; form-action 'self';
  frame-ancestors 'self'; upgrade-insecure-requests"""
Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
Permissions-Policy = "camera=(), microphone=(), geolocation=(), interest-cohort=()"
Referrer-Policy = "strict-origin-when-cross-origin"
X-Content-Type-Options = "nosniff"
X-Frame-Options = "SAMEORIGIN"
```

**💡 لمسة فنية**
`script-src 'self'` هو **الذي يمنع XSS**. `style-src` يحتاج `'unsafe-inline'` لأن React يضبط الأنماط وقت التشغيل. و`default-src 'none'` يكسر الصفحة نفسها، فالقاعدة هي `'self'` مع منح كل صلاحية صراحةً.

**💡 لمسة فنية**
لا تستخدم `media="print" onload="this.media='all'"` لتحميل الخط بلا حجب — `onload` سكربت مضمّن، وCSP `script-src 'self'` **يمنعه**. نتيجتك: خط لا يُحمَّل أبداً وصمت غريب. استعمل وسم `<link>` عادياً مع `display=swap`.

## قائمة سماح للروابط

قبل وضع أي `href` من مصدر خارجي، مرّره بقائمة سماح:

```ts
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i
const safeHref = (href: string) => (SAFE_HREF.test(href) ? href : undefined)
```

**💡 لمسة فنية**
اليوم المحتوى من ملف في المستودع، فليس باباً مفتوحاً. لكن حين تأتي المقالات من CMS أو رفع مستخدم، `href` غير مُرشَّح يصبح **حوض `javascript:` تنفيذياً**. القائمة تُغلق الباب قبل أن يُفتح.

---
---

# 📚 القسم السابع: بناء ونشر مشروع كامل

## الخطوات القابلة للتكرار

```bash
# 1) التهيئة
npm create vite@latest my-app -- --template react-ts
cd my-app && NODE_ENV=development npm install --include=dev

# 2) الأنماط والحركة
npm i framer-motion lucide-react clsx tailwind-merge
npm i -D tailwindcss @tailwindcss/vite
#   ثم في vite.config.ts:  plugins: [react(), tailwindcss()]

# 3) بوابة الجودة
npx tsc -b          # 0 أخطاء
npx eslint .        # 0 أخطاء

# 4) البناء
npx vite build      # dist/

# 5) فحص دخان بلا متصفح
#    jsdom + حزمة iife: تركيب DOM، تثبيت rAF/IntersectionObserver/ResizeObserver،
#    تحميل الحزمة، التنقّل بين المسارات، جمع أخطاء النافذة → 0

# 6) النشر
netlify deploy --dir=dist --site=<id> --prod --message "…"
```

## الدرس الأول: `site_sso_login` حجب كل شيء (401)

**العَرَض:** النشر نجح، لكن `curl` يُرجع **401 على كل مسار**، والجسم `Login Redirect`指向 `app.netlify.com/edge-access`.

**السبب:** الحساب فيه `site_sso_login: true` — إعداد «الدخول مطلوب لمشاهدة المواقع».

**لماذا لم يُحلّ من مستوى الحساب؟**
```
HTTP 422 — "Account is not eligible to update global access controls"
```
الخطة `Free` لا تسمح بتغييره على مستوى الحساب.

**الحل — على مستوى الموقع:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sso_login": false}' \
  https://api.netlify.com/api/v1/sites/<site-id>
```
`PATCH /api/v1/sites/<id>` بـ `{"sso_login": false}` — النتيجة فوراً **200** على كل المسارات.

**💡 لمسة فنية**
`site_sso_login` و`password_context` و`visitor_access` اختيارات **متباينة**. `password_context: "none"` يرفضه الـ API بـ `not included in the list`. جرّب قيمة واحدة في كل مرة وراقب `HTTP 422` — الرسالة تخبرك بأي حقل رفض.

**💡 لمسة فنية**
للمنع من التكرار: عطّل **الخاصية على مستوى الحساب** من `Team settings → Access control`. وإلا سيعود 401 عند إنشاء كل موقع جديد.

## الدرس الثاني: النطاق المحجوز عالمياً

**العَرَض:** `ghost778.netlify.app already exists. Trying ghost778-458…`

**السبب:** أسماء `*.netlify.app` محجوزة **عالمياً** — لا أولوية لحسابك.

**الحل:** اسم بديل، ثم **حدّث ٤ مواضع** لتطابق النطاق الحقيقي:

| الملف | ما يُحدَّث |
|---|---|
| `index.html` | `<link rel="canonical">` + `og:url` + `og:image` + `twitter:image` |
| `public/robots.txt` | `Sitemap:` |
| `public/sitemap.xml` | كل `<loc>` |
| `src/lib/utils.ts` | أي رابط مطلق مكتوب يدوياً |

**💡 لمسة فنية**
`--account-slug` لتحديد الحساب. الـ API أرجع `account_id: 6ab88f2b0b89b5803f562660` وهو **نفس** معرّف الفريق المذكور — أ不错的 طريقة للتأكد قبل النشر.

---
---

# 🔧 القسم الثامن: حل المشاكل الشائعة

| العَرَض | السبب | الحل |
|---|---|---|
| `npm install` ينجح لكن `vite` و`typescript` مفقودان | `NODE_ENV=production` + `omit=dev` | `NODE_ENV=development npm install --include=dev` |
| فشل بناء Netlify بـ `vite: not found` | نفس السبب أعلاه | `NPM_FLAGS = "--include=dev"` في `netlify.toml` |
| `Invalid declaration` في CSS مع Tailwind v4 | تعليق قبل `@import 'tailwindcss'` | `@import` يجب أن يكون أول شيء في الملف |
| `hover:` أو `/NN` لا تعمل | الصنف في `@layer utilities` كقاعدة CSS | انقله إلى `@theme inline` (يدعم variants و`/NN`) أو `@utility` (يدعم variants فقط) |
| الأصناف لا تعمل **في الحزمة المنشورة** فقط | استُخدمت نسخة `::before` غير موجودة | تأكد أن الاسم **حرفي** في المصدر — Tailwind لا يمسح أسماء مبنية وقت التشغيل |
| 401 على كل المسارات بعد النشر | `site_sso_login` على مستوى الحساب | `PATCH /api/v1/sites/<id>` بـ `{"sso_login": false}` |
| `ghost778 already exists` | أسماء `netlify.app` محجوزة عالمياً | اسم بديل + تحديث canonical/sitemap/robots |
| Chromium `Target page, context or browser has been closed` | OOM / LMKD | فحص ثابت على CSS المبني بدل المتصفح |
| عنصر يخرج عن الحدود في RTL | `overflow-x: hidden` لا يقطع حافة بداية السطر | `overflow-x: clip` |
| لوحة فاخرة في RTL | عمود grid بـ `min-width: auto` | `min-w-0` على العمود |
| كلمة عربية طويلة تكسر التخطيط | لا شَرطة في العربية | `overflow-wrap: anywhere` |
| `navigator.share` يُبلّغ نجاحاً كأنه فشل | يُرجع `undefined` لا `boolean` | `await` في `try` ثم `return true` |
| معالم سوداء فوق خلفية داكنة | `#000` + `#FFF` (تباين ٢١:١) | `#05060a` + `#f4f5f8` (تباين ١٢–١٥:١) |
| بناء أبطأ من نصف دقيقة | بناء Netlify البعيد | `netlify deploy --dir=dist` لرفع `dist` مباشرة |
| `mcp-idle on X` لا يظهر | الاتصالات تُحلّ عند الإقلاع فقط | أعد تشغيل opencode |

---
---

# 📖 القسم التاسع: قائمة تحقق سريعة

> [!TIP]
> **قبل النشر**
> - [ ] `npx tsc -b` — صفر أخطاء
> - [ ] `npx eslint .` — صفر أخطاء
> - [ ] `grep -rn "nfp_\|ntfm_\|ghp_" . --exclude-dir=node_modules` — فارغ
> - [ ] `git check-ignore dist .netlify .env` — محمي
> - [ ] `curl -sI <domain> | grep -i content-security` — حاضر
> - [ ] `curl -s -o /dev/null -w "%{http_code}" <domain>/` — **200** لا 401
> - [ ] `<html>` بلا `class="dark"` إن كان النهاري افتراضياً
> - [ ] canonical وsitemap يطابقان النطاق الحقيقي
> - [ ] تنقّل SPA يعمل على رابط عميق

> [!WARNING]
> **لا تفعل**
> - ✗ تكتب مفتاحاً في `jsonc` — استخدم `{env:VAR}`
> - ✗ تحذف صفوفاً من `opencode.db` والخادم يعمل
> - ✗ تثق بـ «npm install نجح» — تحقق بـ `ls node_modules/.bin/vite`
> - ✗ تدفع مقابل MCP لا تستعمله
> - ✗ `git add -A` في مستودع فيه `.env`
> - ✗ تفتح `#000000` و`#FFFFFF` في الوضع الليلي

---
---

# 📖 المصادر

## رسمي
- OpenCode — <https://opencode.ai/docs>
- Tailwind CSS v4 — <https://tailwindcss.com/docs>
- Framer Motion — <https://motion.dev/docs>
- Netlify Headers — <https://docs.netlify.com/manage/configuration/headers/>
- MCP — <https://modelcontextprotocol.io>
- 21st.dev — <https://21st.dev>
- Anthropic Skills — <https://github.com/anthropics/skills>
- Vercel Agent Skills — <https://github.com/vercel-labs/agent-skills>
- NVIDIA SkillSpector — <https://github.com/NVIDIA/SkillSpector>

## محلي
| الأداة | المسار |
|---|---|
| Blaug MCP Idle | `~/.config/opencode/plugin/mcp-idle.ts` |
| Blaug تدوير الذاكرة | `~/.config/opencode/plugin/memory-rotate.ts` |
| إعدادات تدوير الذاكرة | `~/.config/opencode/memory-rotate.json` |
| قاعدة الأخطاء | `~/.local/share/opencode/errors.db` |
| قواعد الجلسات | `~/.local/share/opencode/opencode.db` |
|Skills | `~/.agents/skills/` |
| توكن Netlify | `~/.netlify/config.json` (صلاحيات `600`) |

## داخل المشروع
| الملف | الدور |
|---|---|
| `netlify.toml` | البناء + ‎١١ ترويس أمان + التخزين المؤقت |
| `public/_redirects` | بديل SPA: `/* /index.html 200` |
| `index.html` | سكربت ما-قبل الرسم للثيم (بلا وميض) |
| `src/index.css` | رموز التصميم + `overflow-x: clip` |
| `src/lib/site.ts` | مصدر الحقيقة الوحيد للمحتوى |
| `src/data/posts.ts` | المقالات كنموذج AST مُصنَّف |

---

<div align="center">

**بُني بـ OpenCode — ٣ عيوب حرجة كُشفت بالمراجعة، ١ درسا npm، ١ درس Netlify**

</div>
