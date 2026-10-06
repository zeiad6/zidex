import json
import os

filepath = os.environ.get(
    'CATALOG_PATH',
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'store', 'catalog.json'),
)

with open(filepath, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# The shop's bot, read from BOT_USERNAME instead of being written here.
#
# This line used to hardcode a name, and it is the reason every buy link on the
# storefront was a 404: the username it wrote was never the bot's real one, and
# nothing failed loudly — the links just opened Telegram's "Contact @name" page.
# The bot is renamed in BotFather, not in this repository, so the value has to
# come from the same place the token does. See docs/BOT-NAME.md.
catalog['bot'] = os.environ['BOT_USERNAME'].lstrip('@')

# Update bot titles and descriptions
updates = {
    "store-bot-basic": {
        "title": "بوت المتجر الذكي — الباقة الأساسية",
        "title_en": "Smart Store Bot — Basic",
        "description": "بوت متجر رقمي متطور باسمك: حتى 50 منتجاً، دفع بنجوم تيليجرام، تسليم تلقائي للمنتج، وإشعار لك بكل طلب. أداء سريع جداً.",
        "description_en": "An advanced digital store bot under your name: up to 50 products, Stars checkout, auto delivery. Blazing fast performance."
    },
    "store-bot-pro": {
        "title": "بوت المتجر المتكامل — الباقة الاحترافية",
        "title_en": "Integrated Store Bot — Pro",
        "description": "واجهة متجر Mini App بتصميم عصري واحترافي: أقسام ومنتجات غير محدودة، لغتان، ثيم نهاري وليلي، ربط بموقعك، وإحصائيات متقدمة.",
        "description_en": "Modern Mini App storefront: unlimited categories/products, bilingual, light/dark themes, linked to site, advanced stats."
    },
    "group-bot": {
        "title": "بوت المشرف الآلي للمجموعات",
        "title_en": "Automated Group Admin Bot",
        "description": "حماية متطورة لمجموعتك: تحقق ذكي من الأعضاء، منع الروابط والسبام بدقة عالية، ترحيب، تحذيرات، وتقارير تفصيلية للمشرفين.",
        "description_en": "Advanced group protection: smart captcha, high-accuracy link/spam filters, welcomes, warnings, detailed admin reports."
    },
    "support-bot": {
        "title": "بوت خدمة العملاء الفوري",
        "title_en": "Instant Customer Support Bot",
        "description": "ردود فورية وذكية على الأسئلة الشائعة، يحوّل المحادثة لموظف عند اللزوم، إدارة تذاكر متطورة، وتقييم جودة الخدمة.",
        "description_en": "Smart instant FAQ replies, human handoff, advanced ticketing, and service quality rating."
    },
    "booking-bot": {
        "title": "بوت الحجوزات والمواعيد الذكي",
        "title_en": "Smart Booking Bot",
        "description": "نظام حجوزات آلي متكامل: اختيار الخدمة والموعد، تزامن دقيق لمنع التضارب، تذكير تلقائي، ودفع العربون بنجوم تيليجرام.",
        "description_en": "Fully automated booking system: precise slot sync to prevent double-booking, auto reminders, and Stars deposits."
    },
    "subs-bot": {
        "title": "بوت إدارة الاشتراكات الذكي",
        "title_en": "Smart Subscriptions Bot",
        "description": "إدارة آلية لاشتراكات قنواتك الخاصة: بيع بالنجوم، إضافة وإزالة الأعضاء تلقائياً، تذكير بالتجديد، وإحصائيات نمو تفصيلية.",
        "description_en": "Automated private channel subscriptions: sell in Stars, auto add/remove members, renewal reminders, detailed growth stats."
    },
    "quiz-bot": {
        "title": "بوت المسابقات التفاعلية المطور",
        "title_en": "Advanced Interactive Quiz Bot",
        "description": "مسابقات وتحديات تفاعلية مشوقة: جولات بوقت، لوحة صدارة لحظية، بنك أسئلة متطور، وتوزيع جوائز للفائزين تلقائياً.",
        "description_en": "Engaging interactive challenges: timed rounds, real-time leaderboard, advanced question bank, and auto prize distribution."
    },
    "ai-bot": {
        "title": "بوت المساعد الذكي المتطور",
        "title_en": "Advanced AI Assistant Bot",
        "description": "مساعد ذكاء اصطناعي فائق التطور: يجيب من قاعدة معرفة نشاطك فقط بدقة تامة، تحويل سريع للموظف، ويدعم العربية والإنجليزية بطلاقة.",
        "description_en": "Cutting-edge AI assistant: answers exclusively and accurately from your knowledge base, fast human handoff, fluent bilingual support."
    }
}

for prod in catalog['products']:
    sku = prod['sku']
    if sku in updates:
        prod['title'] = updates[sku]['title']
        prod['title_en'] = updates[sku]['title_en']
        prod['description'] = updates[sku]['description']
        prod['description_en'] = updates[sku]['description_en']

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print("catalog.json updated successfully.")
