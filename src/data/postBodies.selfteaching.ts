/**
 * «فن التعلّم الذاتي» — the bilingual Craft of Self-Teaching course.
 * Facts (chapter list, durations, counts, voices) are taken from the
 * repository README; the videos stream from the repo through jsDelivr because
 * raw.githubusercontent.com serves MP4 as application/octet-stream.
 */
import type { Block } from './posts'

export const selfTeachingBody: Block[] = [
  {
    "type": "p",
    "text": "**فن التعلّم الذاتي** نسخة عربية وإنجليزية محدّثة من الكتاب المفتوح *The Craft of Self-Teaching* (自学是门手艺) لمؤلفه لي شياولاي (Li Xiaolai). الكتاب يستخدم Python ميداناً للتدريب، لكن هدفه أبعد من اللغة: أن تخرج منه قادراً على تعلّم أي شيء وحدك."
  },
  {
    "type": "stats",
    "items": [
      {
        "value": "13",
        "label": "فصلاً من المقدمة إلى بناء المشاريع"
      },
      {
        "value": "26",
        "label": "دفتر Jupyter (13 عربي + 13 إنجليزي)"
      },
      {
        "value": "30",
        "label": "فيديو شارحاً MP4 بدقة 1080p"
      },
      {
        "value": "24",
        "label": "تحدياً برمجياً بحلول مفصولة"
      }
    ]
  },
  {
    "type": "p",
    "text": "المستودع كاملاً مفتوح المصدر برخصة MIT على [GitHub](https://github.com/zeiad6/craft-of-selfteaching)، وكل ما في هذه الصفحة — الدفاتر، الحلول، والفيديوهات — يُشغَّل منه مباشرة."
  },
  {
    "type": "h2",
    "id": "watch-ar",
    "text": "شاهد الدورة كاملة بالعربية"
  },
  {
    "type": "p",
    "text": "خمسة عشر فيديو: الفصول الثلاثة عشر ثم ملحقا إعداد البيئة و Git. اختر فصلاً من القائمة ليبدأ تشغيله في المشغّل نفسه."
  },
  {
    "type": "videos",
    "lang": "ar",
    "items": [
      {
        "title": "00 · المقدمة والفلسفة",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_00-preface.mp4"
      },
      {
        "title": "01 · الانطلاقة الأولى",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_01-getting-started.mp4"
      },
      {
        "title": "02 · القيم والمعاملات",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_02-values-and-operators.mp4"
      },
      {
        "title": "03 · التحكم في التدفق",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_03-control-flow.mp4"
      },
      {
        "title": "04 · هياكل البيانات",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_04-data-structures.mp4"
      },
      {
        "title": "05 · الدوال وتفكيك المشكلات",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_05-functions.mp4"
      },
      {
        "title": "06 · النصوص والأنماط",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_06-strings-and-regex.mp4"
      },
      {
        "title": "07 · الملفات واستدامة البيانات",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_07-file-io.mp4"
      },
      {
        "title": "08 · البرمجة كائنية التوجه",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_08-oop.mp4"
      },
      {
        "title": "09 · الوحدات والمكتبات",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_09-modules.mp4"
      },
      {
        "title": "10 · الاختبارات والتنقيح",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_10-debugging-and-testing.mp4"
      },
      {
        "title": "11 · قراءة التوثيق الرسمي",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_11-reading-docs.mp4"
      },
      {
        "title": "12 · بناء المشاريع الحقيقية",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_12-beyond-basics.mp4"
      },
      {
        "title": "الملحق أ · إعداد بيئة التطوير",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_appendix-a-setup.mp4"
      },
      {
        "title": "الملحق ب · أساسيات Git و GitHub",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/ar_appendix-b-git.mp4"
      }
    ],
    "caption": "التعليق الصوتي العربي مولَّد آلياً بصوت ar-EG-ShakirNeural عبر Edge-TTS."
  },
  {
    "type": "h2",
    "id": "four-rules",
    "text": "القواعد الأربع للمتعلّم الذاتي"
  },
  {
    "type": "ol",
    "items": [
      "**اقرأ التوثيق أولاً.** معظم المشكلات التي تظنها معقدة حُلّت ووُثّقت في المراجع الرسمية.",
      "**رسالة الخطأ مرشد لا إهانة.** الـ Traceback في Python خريطة مجانية تدلّك على سطر العطل وطبيعته.",
      "**تعلّم بالتفكيك والتجربة.** لا تقرأ الكود كرواية: شغّله، غيّر المعاملات، اكسره عمداً وافهم لماذا انكسر.",
      "**المشاركة ذروة الفهم.** بناء مشاريع حقيقية ومساعدة متعلمين آخرين هو ما يرسّخ المهارة."
    ]
  },
  {
    "type": "quote",
    "text": "التعلّم الذاتي ليس مجرّد بديل عن المدرسة؛ بل هو الحرفة الأم التي تحدّد سقف تطوّرك طوال حياتك."
  },
  {
    "type": "h2",
    "id": "whats-new",
    "text": "ما الذي تضيفه هذه النسخة؟"
  },
  {
    "type": "ul",
    "items": [
      "**تعريب تقني متوازن:** صياغة عربية أصيلة مع إبقاء المصطلح العالمي واضحاً، ومسرد يضم أكثر من 100 مصطلح (GLOSSARY.md).",
      "**ترقية إلى Python 3.12+:** `match/case`، تلميحات الأنواع الحديثة، `@dataclass`، و `pathlib` بدل الأساليب القديمة.",
      "**مطابقة تامة بين اللغتين:** كل دفتر عربي له نظير إنجليزي، وكلاهما يعمل بنقرة واحدة على Google Colab.",
      "**تعلّم نشط داخل الدفتر:** فقرات «أخطاء شائعة»، «نصائح التعلّم الذاتي»، وأسئلة «اختبر نفسك» بإجابات منسدلة.",
      "**حلول مفصولة عن التمارين:** التحديات في الدفتر والحلول في ملفات مستقلة، حتى تحاول قبل أن ترى الجواب.",
      "**فحص آلي:** سير عمل GitHub Actions يتحقق من أن الدفاتر تعمل."
    ]
  },
  {
    "type": "h2",
    "id": "curriculum",
    "text": "المنهج: ثلاث مراحل وثلاثة عشر فصلاً"
  },
  {
    "type": "p",
    "text": "المدد تقديرية كما وردت في المستودع، ومجموعها 520 دقيقة — نحو 9 ساعات من العمل المركّز. كل صف يفتح الدفتر العربي على GitHub أو يشغّله على Colab دون تثبيت."
  },
  {
    "type": "table",
    "caption": "فصول الكتاب بالترتيب",
    "head": [
      "#",
      "الفصل",
      "المستوى",
      "المدة",
      "الدفتر",
      "تشغيل سحابي"
    ],
    "rows": [
      [
        "00",
        "المقدمة والفلسفة (Preface)",
        "مبتدئ",
        "20 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/00-preface/01-preface.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/00-preface/01-preface.ipynb)"
      ],
      [
        "01",
        "الانطلاقة الأولى (Getting Started)",
        "مبتدئ",
        "30 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/01-getting-started.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/01-getting-started.ipynb)"
      ],
      [
        "02",
        "القيم والمعاملات (Values & Operators)",
        "مبتدئ",
        "35 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/02-values-and-operators.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/02-values-and-operators.ipynb)"
      ],
      [
        "03",
        "التحكم في التدفق (Control Flow)",
        "مبتدئ",
        "40 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/03-control-flow.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/03-control-flow.ipynb)"
      ],
      [
        "04",
        "هياكل البيانات (Data Structures)",
        "مبتدئ",
        "45 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/04-data-structures.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/04-data-structures.ipynb)"
      ],
      [
        "05",
        "الدوال وتفكيك المشكلات (Functions)",
        "مبتدئ",
        "45 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/05-functions.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/05-functions.ipynb)"
      ],
      [
        "06",
        "النصوص والأنماط (Strings & Regex)",
        "مبتدئ",
        "40 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/06-strings-and-regex.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-1-foundations/06-strings-and-regex.ipynb)"
      ],
      [
        "07",
        "الملفات واستدامة البيانات (File I/O)",
        "متوسط",
        "35 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-2-practice/07-file-io.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-2-practice/07-file-io.ipynb)"
      ],
      [
        "08",
        "البرمجة كائنية التوجه (OOP)",
        "متوسط",
        "50 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-2-practice/08-oop.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-2-practice/08-oop.ipynb)"
      ],
      [
        "09",
        "الوحدات والمكتبات (Modules)",
        "متوسط",
        "35 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-2-practice/09-modules.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-2-practice/09-modules.ipynb)"
      ],
      [
        "10",
        "الاختبارات والتنقيح (Testing)",
        "متوسط",
        "40 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-2-practice/10-debugging-and-testing.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-2-practice/10-debugging-and-testing.ipynb)"
      ],
      [
        "11",
        "قراءة التوثيق الرسمي (Reading Docs)",
        "متقدم",
        "45 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-3-mastery/11-reading-docs.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-3-mastery/11-reading-docs.ipynb)"
      ],
      [
        "12",
        "بناء المشاريع الحقيقية (Beyond Basics)",
        "متقدم",
        "60 دقيقة",
        "[الدفتر](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/part-3-mastery/12-beyond-basics.ipynb)",
        "[Colab](https://colab.research.google.com/github/zeiad6/craft-of-selfteaching/blob/main/ar/part-3-mastery/12-beyond-basics.ipynb)"
      ]
    ]
  },
  {
    "type": "callout",
    "tone": "info",
    "title": "ملاحق ومراجع",
    "items": [
      "[الملحق أ: إعداد بيئة التطوير](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/appendices/01-setup-environment.md) — VS Code و JupyterLab وأدوات التنسيق Black و Ruff.",
      "[الملحق ب: أساسيات Git و GitHub](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/appendices/02-git-basics.md) — ما تحتاجه للتحكم في الإصدارات والمساهمة.",
      "[مسرد المصطلحات](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/GLOSSARY.md) — معجم عربي–إنجليزي موحّد.",
      "[فهرس التحديات والحلول](https://github.com/zeiad6/craft-of-selfteaching/blob/main/ar/challenges/README.md) — 24 تحدياً مع حلول مشروحة."
    ]
  },
  {
    "type": "h2",
    "id": "start",
    "text": "كيف تبدأ"
  },
  {
    "type": "h3",
    "id": "start-colab",
    "text": "بلا تثبيت: Google Colab"
  },
  {
    "type": "p",
    "text": "اضغط رابط Colab أمام أي فصل في الجدول أعلاه. يفتح الدفتر في المتصفح ويعمل على خوادم Google؛ تحتاج حساب Google فقط."
  },
  {
    "type": "h3",
    "id": "start-local",
    "text": "على جهازك"
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "git clone https://github.com/zeiad6/craft-of-selfteaching.git\ncd craft-of-selfteaching\npython -m venv .venv\nsource .venv/bin/activate   # على Windows: .venv\\Scripts\\activate\npip install -r requirements.txt\njupyter lab"
  },
  {
    "type": "callout",
    "tone": "tip",
    "title": "ترتيب مقترح لكل فصل",
    "items": [
      "شاهد فيديو الفصل أولاً لتأخذ الصورة العامة.",
      "افتح الدفتر وشغّل كل خلية بنفسك، وغيّر القيم.",
      "حلّ التحدي قبل فتح ملف الحل.",
      "اكتب بكلماتك ما فهمته، أو اشرحه لغيرك."
    ]
  },
  {
    "type": "h2",
    "id": "watch-en",
    "text": "النسخة الإنجليزية من الفيديوهات"
  },
  {
    "type": "p",
    "text": "الفيديوهات الخمسة عشر نفسها بتعليق إنجليزي، لمن يريد التعوّد على المصطلح الأصلي."
  },
  {
    "type": "videos",
    "lang": "en",
    "items": [
      {
        "title": "00 · Preface",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_00-preface.mp4"
      },
      {
        "title": "01 · Getting Started",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_01-getting-started.mp4"
      },
      {
        "title": "02 · Values & Operators",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_02-values-and-operators.mp4"
      },
      {
        "title": "03 · Control Flow",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_03-control-flow.mp4"
      },
      {
        "title": "04 · Data Structures",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_04-data-structures.mp4"
      },
      {
        "title": "05 · Functions",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_05-functions.mp4"
      },
      {
        "title": "06 · Strings & Regex",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_06-strings-and-regex.mp4"
      },
      {
        "title": "07 · File I/O",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_07-file-io.mp4"
      },
      {
        "title": "08 · OOP",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_08-oop.mp4"
      },
      {
        "title": "09 · Modules",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_09-modules.mp4"
      },
      {
        "title": "10 · Testing",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_10-debugging-and-testing.mp4"
      },
      {
        "title": "11 · Reading Docs",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_11-reading-docs.mp4"
      },
      {
        "title": "12 · Beyond Basics",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_12-beyond-basics.mp4"
      },
      {
        "title": "Appendix · Setup",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_appendix-a-setup.mp4"
      },
      {
        "title": "Appendix · Git",
        "src": "https://cdn.jsdelivr.net/gh/zeiad6/craft-of-selfteaching@main/videos/rendered/en_appendix-b-git.mp4"
      }
    ],
    "caption": "التعليق الإنجليزي بصوت en-US-ChristopherNeural عبر Edge-TTS."
  },
  {
    "type": "h2",
    "id": "video-engine",
    "text": "كيف أُنتجت الفيديوهات"
  },
  {
    "type": "p",
    "text": "الفيديوهات ليست تسجيل شاشة. محرك مفتوح المصدر داخل المستودع يقرأ نص كل فصل من `videos/ar` و `videos/en`، يولّد التعليق الصوتي، ويركّبه على لوحات الكود المرسومة. يمكنك إعادة توليد أي فيديو أو تعديل نصه:"
  },
  {
    "type": "code",
    "lang": "bash",
    "code": "python scripts/render_videos.py --chapter 01-getting-started --lang ar"
  },
  {
    "type": "p",
    "text": "التفاصيل في [دليل الفيديوهات](https://github.com/zeiad6/craft-of-selfteaching/blob/main/videos/README.md)."
  },
  {
    "type": "h2",
    "id": "license",
    "text": "الحقوق والمساهمة"
  },
  {
    "type": "p",
    "text": "الكتاب الأصلي للمؤلف لي شياولاي، وهذه النسخة تعريب وتطوير له منشورة برخصة MIT. المساهمات مرحّب بها: تصحيح ترجمة، تمرين جديد، أو إصلاح دفتر — راجع [CONTRIBUTING.md](https://github.com/zeiad6/craft-of-selfteaching/blob/main/CONTRIBUTING.md)."
  },
  {
    "type": "download",
    "href": "https://github.com/zeiad6/craft-of-selfteaching",
    "label": "افتح المستودع على GitHub",
    "meta": "craft-of-selfteaching · MIT · عربي + English",
    "also": [
      {
        "href": "https://github.com/zeiad6/craft-of-selfteaching/archive/refs/heads/main.zip",
        "label": "تنزيل المستودع كاملاً (ZIP)",
        "meta": "main.zip · GitHub"
      }
    ]
  }
]
