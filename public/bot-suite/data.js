/** كل بوت معروض للبيع — واجهته الرسومية ولوحة تحكمه产生的 من هذه البيانات وحدها.
 *  النصوص مكتوبة هنا مرتين (ar/en) ولا يدخل المستخدم أي محتوى يُعرض كـHTML. */
export const BOTS = [
    {
        sku: 'store-bot-basic',
        name: { ar: 'بوت المتجر الذكي', en: 'Smart Store Bot' },
        tagline: { ar: 'متجر رقمي كامل داخل تيليجرام', en: 'A full digital store inside Telegram' },
        palette: ['#7c3aed', '#00a88c'],
        glyph: 'bag',
        panelTitle: { ar: 'لوحة متجرك', en: 'Your store panel' },
        kpis: [
            { label: { ar: 'طلبات اليوم', en: 'Orders today' }, value: '37' },
            { label: { ar: 'نجوم محصّلة', en: 'Stars earned' }, value: '52,480' },
            { label: { ar: 'زوار فريدون', en: 'Unique visitors' }, value: '1,204' },
        ],
        tableHead: [
            { ar: 'المنتج', en: 'Product' },
            { ar: 'المشتري', en: 'Buyer' },
            { ar: 'الحالة', en: 'Status' },
        ],
        rows: [
            { cells: ['دورة التصميم', '@sara_d', 'سُلّمت'], tone: 'ok' },
            { cells: ['قالب متجر', '@omar_k', 'قيد التنفيذ'], tone: 'warn' },
            { cells: ['بوت دعم', '@noor.a', 'سُلّمت'], tone: 'ok' },
            { cells: ['50 صورة', '@fahd_1', 'بانتظار الدفع'], tone: 'off' },
            { cells: ['خطة شهرية', '@layla_9', 'سُلّمت'], tone: 'ok' },
        ],
        toggles: [
            { label: { ar: 'التسليم التلقائي', en: 'Auto delivery' }, on: true },
            { label: { ar: 'إشعار كل طلب', en: 'Notify on order' }, on: true },
        ],
        chat: [
            { from: 'bot', text: { ar: 'أهلاً بك في متجر ZeidexSoft 🛍️', en: 'Welcome to the ZeidexSoft store 🛍️' }, chip: { ar: '/shop متجرك جاهز', en: '/shop your store is ready' } },
            {
                from: 'bot',
                text: { ar: 'اختر قسماً:', en: 'Pick a section:' },
                replies: [
                    { label: { ar: '🤖 بوتات', en: '🤖 Bots' }, to: 1 },
                    { label: { ar: '🧩 أنظمة', en: '🧩 Systems' }, to: 2 },
                ],
            },
            { from: 'user', text: { ar: '🤖 بوتات', en: '🤖 Bots' } },
            {
                from: 'bot',
                text: { ar: 'بوت المتجر الذكي — 1750 نجمة ⭐', en: 'Smart Store Bot — 1750 Stars ⭐' },
                chip: { ar: 'فاتورة دفع ⭐ 1750', en: 'Payment invoice ⭐ 1750' },
            },
            {
                from: 'bot',
                text: { ar: 'تم الدفع ✅ وصلك الملف تلقائياً:', en: 'Paid ✅ your file arrived automatically:' },
                chip: { ar: 'store-bot-basic.zip', en: 'store-bot-basic.zip' },
            },
        ],
    },
    {
        sku: 'store-bot-pro',
        name: { ar: 'بوت المتجر المتكامل', en: 'Integrated Store Bot' },
        tagline: { ar: 'Mini App بلغتين واشتراكات شهرية', en: 'Bilingual Mini App + subscriptions' },
        palette: ['#6366f1', '#ec4899'],
        glyph: 'star',
        panelTitle: { ar: 'لوحة المبيعات', en: 'Sales panel' },
        kpis: [
            { label: { ar: 'مبيعات 30 يوماً', en: '30-day sales' }, value: '318,940' },
            { label: { ar: 'مشتركون نشطون', en: 'Active subscribers' }, value: '412' },
            { label: { ar: 'متوسط الفاتورة', en: 'Average invoice' }, value: '1,940' },
        ],
        tableHead: [
            { ar: 'الخطة', en: 'Plan' },
            { ar: 'المشتركون', en: 'Subscribers' },
            { ar: 'التجديد', en: 'Renewal' },
        ],
        rows: [
            { cells: ['أساسية شهرية', '286', 'تلقائي'], tone: 'ok' },
            { cells: ['احترافية شهرية', '126', 'تلقائي'], tone: 'ok' },
            { cells: ['استضافة', '94', 'خلال 6 أيام'], tone: 'warn' },
            { cells: ['تجربة', '18', 'تنتهي غداً'], tone: 'warn' },
        ],
        toggles: [
            { label: { ar: 'ثيم لياري/نهاري', en: 'Light/dark theme' }, on: true },
            { label: { ar: 'فاتورة الاشتراك الشهري', en: 'Monthly invoice' }, on: true },
        ],
        chat: [
            { from: 'user', text: { ar: 'افتح المتجر', en: 'Open the store' } },
            {
                from: 'bot',
                text: { ar: 'Mini App متجرك — عربي/إنجليزي 🌗', en: 'Your store Mini App — AR/EN 🌗' },
                chip: { ar: 't.me/…/store', en: 't.me/…/store' },
            },
            {
                from: 'bot',
                text: { ar: 'اختر الاشتراك الشهري:', en: 'Pick the monthly plan:' },
                replies: [
                    { label: { ar: '⭐ 750 شهرياً', en: '⭐ 750 monthly' }, to: 1 },
                    { label: { ar: 'رجوع', en: 'Back' }, to: 0 },
                ],
            },
            { from: 'user', text: { ar: '⭐ 750 شهرياً', en: '⭐ 750 monthly' } },
            {
                from: 'bot',
                text: { ar: 'تم الاشتراك — يتجدد تلقائياً ويمكنك الإلغاء من إعدادات تيليجرام.', en: 'Subscribed — renews automatically; cancel any time from Telegram settings.' },
                chip: { ar: 'رابط دعوة خاص 🔗', en: 'Private invite link 🔗' },
            },
        ],
    },
    {
        sku: 'store-bot-hosting',
        name: { ar: 'استضافة بوتك', en: 'Bot hosting' },
        tagline: { ar: 'تشغيل 24/7 مع نسخ وتحديثات', en: '24/7 uptime with backups and updates' },
        palette: ['#0e7490', '#2563eb'],
        glyph: 'server',
        panelTitle: { ar: 'لوحة الاستضافة', en: 'Hosting panel' },
        kpis: [
            { label: { ar: 'زمن التشغيل', en: 'Uptime' }, value: '99.98%' },
            { label: { ar: 'آخر نسخة', en: 'Last backup' }, value: '02:14' },
            { label: { ar: 'تنبيهات مفتوحة', en: 'Open alerts' }, value: '0' },
        ],
        tableHead: [
            { ar: 'العملية', en: 'Operation' },
            { ar: 'الوقت', en: 'Time' },
            { ar: 'النتيجة', en: 'Result' },
        ],
        rows: [
            { cells: ['نسخة احتياطية', '02:14', 'نجحت'], tone: 'ok' },
            { cells: ['تحديث أمني', 'أمس', 'طُبّق'], tone: 'ok' },
            { cells: ['إعادة تشغيل', 'قبل 3 أيام', 'نجحت'], tone: 'ok' },
            { cells: ['فحص صحة', 'الآن', 'سليم'], tone: 'ok' },
        ],
        toggles: [
            { label: { ar: 'تنبيه عند التوقف', en: 'Alert on downtime' }, on: true },
            { label: { ar: 'تحديث تلقائي', en: 'Auto updates' }, on: false },
        ],
        chat: [
            {
                from: 'bot',
                text: { ar: 'حالة بوتك الآن:', en: 'Your bot status:' },
                chip: { ar: '✅ يعمل · uptime 99.98%', en: '✅ running · 99.98% uptime' },
            },
            {
                from: 'bot',
                text: { ar: 'آخر نسخة احتياطية 02:14 — استعادة بضغطة.', en: 'Last backup 02:14 — restore with one tap.' },
                replies: [
                    { label: { ar: 'تجديد 30 يوماً', en: 'Renew 30 days' }, to: 1 },
                    { label: { ar: 'اطلب نسخة الآن', en: 'Backup now' }, to: 0 },
                ],
            },
            { from: 'user', text: { ar: 'تجديد 30 يوماً', en: 'Renew 30 days' } },
            { from: 'bot', text: { ar: 'تم التجديد ⭐ 750 — إيصال الدفع في المحادثة.', en: 'Renewed ⭐ 750 — the receipt is in this chat.' } },
        ],
    },
    {
        sku: 'group-bot',
        name: { ar: 'مشرف المجموعات الآلي', en: 'Group Admin Bot' },
        tagline: { ar: 'تحقق، فلترة، ترحيب وقوانين', en: 'Captcha, filters, welcome and rules' },
        palette: ['#059669', '#10b981'],
        glyph: 'shield',
        panelTitle: { ar: 'لوحة الإشراف', en: 'Moderation panel' },
        kpis: [
            { label: { ar: 'أعضاء جدد اليوم', en: 'New members today' }, value: '64' },
            { label: { ar: 'رسائل محجوبة', en: 'Blocked messages' }, value: '212' },
            { label: { ar: 'تحذيرات', en: 'Warnings' }, value: '9' },
        ],
        tableHead: [
            { ar: 'العضو', en: 'Member' },
            { ar: 'السبب', en: 'Reason' },
            { ar: 'الإجراء', en: 'Action' },
        ],
        rows: [
            { cells: ['@spam_x1', 'رابط إعلاني', 'حظر'], tone: 'off' },
            { cells: ['@newbie2', 'لم يحلّ الكابتشا', 'تحذير'], tone: 'warn' },
            { cells: ['@user3', 'كلمة ممنوعة', 'تحذير'], tone: 'warn' },
            { cells: ['@promo9', 'تكرار روابط', 'كتم 24س'], tone: 'off' },
            { cells: ['@safe4', '—', 'سليم'], tone: 'ok' },
        ],
        toggles: [
            { label: { ar: 'كابتشا للأعضاء الجدد', en: 'Captcha for newcomers' }, on: true },
            { label: { ar: 'فلترة الروابط', en: 'Link filter' }, on: true },
            { label: { ar: 'رسالة ترحيب', en: 'Welcome message' }, on: true },
        ],
        chat: [
            {
                from: 'bot',
                text: { ar: 'مرحباً @nouf — حلّ الكابتشا خلال دقيقتين:', en: 'Hi @nouf — solve the captcha within two minutes:' },
                chip: { ar: 'كم 7 + 5؟', en: 'What is 7 + 5?' },
            },
            {
                from: 'bot',
                text: { ar: 'اختر إجابتك:', en: 'Pick your answer:' },
                replies: [
                    { label: { ar: '11', en: '11' }, to: 1 },
                    { label: { ar: '12', en: '12' }, to: 2 },
                ],
            },
            { from: 'user', text: { ar: '12', en: '12' } },
            { from: 'bot', text: { ar: 'تم التحقق ✅ أهلاً بك في المجموعة.', en: 'Verified ✅ welcome to the group.' } },
        ],
    },
    {
        sku: 'support-bot',
        name: { ar: 'بوت خدمة العملاء', en: 'Support Bot' },
        tagline: { ar: 'ردود فورية وتحويل لإنسان', en: 'Instant replies and human handoff' },
        palette: ['#0284c7', '#38bdf8'],
        glyph: 'headset',
        panelTitle: { ar: 'لوحة التذاكر', en: 'Tickets panel' },
        kpis: [
            { label: { ar: 'تذاكر اليوم', en: 'Tickets today' }, value: '58' },
            { label: { ar: 'متوسط الرد', en: 'Average reply' }, value: '42ث' },
            { label: { ar: 'بدون موظف', en: 'Handled by bot' }, value: '81%' },
        ],
        tableHead: [
            { ar: 'التذكرة', en: 'Ticket' },
            { ar: 'الموضوع', en: 'Topic' },
            { ar: 'الحالة', en: 'Status' },
        ],
        rows: [
            { cells: ['#1042', 'استرجاع مبلغ', 'محوّلة'], tone: 'warn' },
            { cells: ['#1041', 'سعر الخطة', 'أُجيب آلياً'], tone: 'ok' },
            { cells: ['#1040', 'تسجيل الدخول', 'أُجيب آلياً'], tone: 'ok' },
            { cells: ['#1039', 'طلب ميزة', 'محوّلة'], tone: 'warn' },
            { cells: ['#1038', 'سؤال عام', 'أُجيب آلياً'], tone: 'ok' },
        ],
        toggles: [
            { label: { ar: 'ردود الأسئلة الشائعة', en: 'FAQ auto-replies' }, on: true },
            { label: { ar: 'زر التحويل لموظف', en: 'Human handoff button' }, on: true },
        ],
        chat: [
            {
                from: 'bot',
                text: { ar: 'كيف أساعدك؟ اختر سؤالاً:', en: 'How can I help? Pick a question:' },
                replies: [
                    { label: { ar: 'كيف أدفع؟', en: 'How do I pay?' }, to: 1 },
                    { label: { ar: 'أريد موظفاً', en: 'I want a human' }, to: 3 },
                ],
            },
            { from: 'user', text: { ar: 'كيف أدفع؟', en: 'How do I pay?' } },
            {
                from: 'bot',
                text: { ar: 'الدفع بنجوم تيليجرام ⭐ بلا بطاقة، أو TON وUSDT وكريمي من الموقع.', en: 'Pay with Telegram Stars ⭐ without a card, or TON, USDT and Kuraimi on the site.' },
            },
            { from: 'user', text: { ar: 'أريد موظفاً', en: 'I want a human' } },
            {
                from: 'bot',
                text: { ar: 'حوّلتك للموظف — تذكرتك:', en: 'Handed you to staff — your ticket:' },
                chip: { ar: 'تذكرة #1043', en: 'Ticket #1043' },
            },
        ],
    },
    {
        sku: 'booking-bot',
        name: { ar: 'بوت الحجوزات الذكي', en: 'Smart Booking Bot' },
        tagline: { ar: 'خدمة، يوم، ساعة — بلا تعارض', en: 'Service, day, hour — no double booking' },
        palette: ['#d97706', '#f59e0b'],
        glyph: 'calendar',
        panelTitle: { ar: 'لوحة المواعيد', en: 'Appointments panel' },
        kpis: [
            { label: { ar: 'مواعيد اليوم', en: 'Today’s slots' }, value: '14' },
            { label: { ar: 'تعارضات', en: 'Conflicts' }, value: '0' },
            { label: { ar: 'تذكيرات أُرسلت', en: 'Reminders sent' }, value: '312' },
        ],
        tableHead: [
            { ar: 'الوقت', en: 'Time' },
            { ar: 'العميل', en: 'Client' },
            { ar: 'الخدمة', en: 'Service' },
        ],
        rows: [
            { cells: ['10:00', '@ahmed', 'استشارة'], tone: 'ok' },
            { cells: ['11:30', '@mona', 'متابعة'], tone: 'ok' },
            { cells: ['13:00', '@saleh', 'زيارة'], tone: 'warn' },
            { cells: ['15:30', '@reem', 'استشارة'], tone: 'ok' },
            { cells: ['17:00', '—', 'متاح'], tone: 'off' },
        ],
        toggles: [
            { label: { ar: 'تذكير قبل الموعد', en: 'Reminder before slot' }, on: true },
            { label: { ar: 'منع الحجز المزدوج', en: 'No double booking' }, on: true },
        ],
        chat: [
            {
                from: 'bot',
                text: { ar: 'اختر الخدمة:', en: 'Pick a service:' },
                replies: [
                    { label: { ar: 'استشارة', en: 'Consultation' }, to: 1 },
                    { label: { ar: 'زيارة', en: 'Visit' }, to: 1 },
                ],
            },
            { from: 'user', text: { ar: 'استشارة', en: 'Consultation' } },
            {
                from: 'bot',
                text: { ar: 'اختر الوقت:', en: 'Pick a time:' },
                replies: [
                    { label: { ar: 'غداً 10:00', en: 'Tomorrow 10:00' }, to: 2 },
                    { label: { ar: 'غداً 15:30', en: 'Tomorrow 15:30' }, to: 2 },
                ],
            },
            { from: 'user', text: { ar: 'غداً 10:00', en: 'Tomorrow 10:00' } },
            {
                from: 'bot',
                text: { ar: 'تم الحجز ✅ وسيصلك تذكير قبل الموعد.', en: 'Booked ✅ a reminder will reach you before the slot.' },
                chip: { ar: 'موعد: غداً 10:00', en: 'Slot: tomorrow 10:00' },
            },
        ],
    },
    {
        sku: 'subs-bot',
        name: { ar: 'بوت الاشتراكات الذكي', en: 'Smart Subscriptions Bot' },
        tagline: { ar: 'رابط خاص وإخراج تلقائي', en: 'Private link and auto-removal' },
        palette: ['#c026d3', '#e879f9'],
        glyph: 'key',
        panelTitle: { ar: 'لوحة المشتركين', en: 'Subscribers panel' },
        kpis: [
            { label: { ar: 'مشتركون نشطون', en: 'Active members' }, value: '386' },
            { label: { ar: 'تنتهي خلال 7 أيام', en: 'Expiring in 7 days' }, value: '21' },
            { label: { ar: 'أُخرجوا تلقائياً', en: 'Auto-removed' }, value: '64' },
        ],
        tableHead: [
            { ar: 'المشترك', en: 'Member' },
            { ar: 'ينتهي', en: 'Expires' },
            { ar: 'الحالة', en: 'Status' },
        ],
        rows: [
            { cells: ['@huda', '2026-11-02', 'نشط'], tone: 'ok' },
            { cells: ['@bander', '2026-10-12', 'يقترب'], tone: 'warn' },
            { cells: ['@rana', '2026-10-10', 'يقترب'], tone: 'warn' },
            { cells: ['@ziad', '2026-09-30', 'أُخرج'], tone: 'off' },
            { cells: ['@lina', '2026-12-01', 'نشط'], tone: 'ok' },
        ],
        toggles: [
            { label: { ar: 'إخراج عند الانتهاء', en: 'Remove on expiry' }, on: true },
            { label: { ar: 'تذكير قبل 3 أيام', en: 'Remind 3 days ahead' }, on: true },
        ],
        chat: [
            {
                from: 'bot',
                text: { ar: 'اشترك في القناة الخاصة ⭐ 750 شهرياً:', en: 'Subscribe to the private channel ⭐ 750 monthly:' },
                chip: { ar: 'فاتورة ⭐ 750', en: 'Invoice ⭐ 750' },
            },
            {
                from: 'bot',
                text: { ar: 'تم الاشتراك ✅ هذا رابطك الخاص:', en: 'Subscribed ✅ here is your private link:' },
                chip: { ar: 't.me/+AbC…', en: 't.me/+AbC…' },
            },
            { from: 'bot', text: { ar: 'ينتهي اشتراكك بعد 30 يوماً، وسيصلك تنبيه قبل 3 أيام.', en: 'Your access ends in 30 days; you will be warned 3 days ahead.' } },
        ],
    },
    {
        sku: 'quiz-bot',
        name: { ar: 'بوت المسابقات التفاعلي', en: 'Interactive Quiz Bot' },
        tagline: { ar: 'جولات بوقت محدد ولوحة صدارة', en: 'Timed rounds and a leaderboard' },
        palette: ['#ea580c', '#f97316'],
        glyph: 'trophy',
        panelTitle: { ar: 'لوحة الجولات', en: 'Rounds panel' },
        kpis: [
            { label: { ar: 'جولات اليوم', en: 'Rounds today' }, value: '6' },
            { label: { ar: 'مشاركون', en: 'Participants' }, value: '238' },
            { label: { ar: 'أعلى نتيجة', en: 'Top score' }, value: '980' },
        ],
        tableHead: [
            { ar: 'الجولة', en: 'Round' },
            { ar: 'الفائز', en: 'Winner' },
            { ar: 'النقاط', en: 'Points' },
        ],
        rows: [
            { cells: ['جولة 12', '@majed', '980'], tone: 'ok' },
            { cells: ['جولة 11', '@sara', '910'], tone: 'ok' },
            { cells: ['جولة 10', '@ali', '860'], tone: 'ok' },
            { cells: ['جولة 9', '@hind', '820'], tone: 'warn' },
            { cells: ['جولة 8', '@turki', '780'], tone: 'warn' },
        ],
        toggles: [
            { label: { ar: 'اختبارات تيليجرام الأصلية', en: 'Native Telegram quizzes' }, on: true },
            { label: { ar: 'وقت محدد للسؤال', en: 'Per-question timer' }, on: true },
        ],
        chat: [
            {
                from: 'bot',
                text: { ar: 'جولة سريعة — أي سؤال؟', en: 'Quick round — which answer?' },
                chip: { ar: 'ما عاصمة السعودية؟', en: 'What is the capital of Saudi Arabia?' },
                replies: [
                    { label: { ar: 'جدة', en: 'Jeddah' }, to: 1 },
                    { label: { ar: 'الرياض', en: 'Riyadh' }, to: 2 },
                ],
            },
            { from: 'user', text: { ar: 'جدة', en: 'Jeddah' } },
            { from: 'bot', text: { ar: 'إجابة خاطئة ❌ الصحيحة: الرياض.', en: 'Wrong ❌ the answer is Riyadh.' } },
            { from: 'user', text: { ar: 'الرياض', en: 'Riyadh' } },
            {
                from: 'bot',
                text: { ar: 'صحيح ✅ +100 نقطة:', en: 'Correct ✅ +100 points:' },
                chip: { ar: 'لوحة الصدارة 🏆', en: 'Leaderboard 🏆' },
            },
        ],
    },
    {
        sku: 'ai-bot',
        name: { ar: 'بوت المساعد الذكي', en: 'AI Assistant Bot' },
        tagline: { ar: 'يجيب من معلوماتك فقط', en: 'Answers from your data only' },
        palette: ['#0d9488', '#84cc16'],
        glyph: 'spark',
        panelTitle: { ar: 'لوحة المعرفة', en: 'Knowledge panel' },
        kpis: [
            { label: { ar: 'أسئلة اليوم', en: 'Questions today' }, value: '1,918' },
            { label: { ar: 'دقة الإجابة', en: 'Answer accuracy' }, value: '96%' },
            { label: { ar: 'حوّلت لإنسان', en: 'Handed to human' }, value: '4%' },
        ],
        tableHead: [
            { ar: 'المصدر', en: 'Source' },
            { ar: 'الحجم', en: 'Size' },
            { ar: 'آخر تحديث', en: 'Updated' },
        ],
        rows: [
            { cells: ['الأسعار.pdf', '1.2MB', 'أمس'], tone: 'ok' },
            { cells: ['الأسئلة الشائعة.md', '48KB', 'قبل 3 أيام'], tone: 'ok' },
            { cells: ['دليل المنتج.docx', '860KB', 'أسبوع'], tone: 'warn' },
            { cells: ['سياسة الاسترجاع.txt', '12KB', 'شهر'], tone: 'warn' },
        ],
        toggles: [
            { label: { ar: 'الرد من المعرفة فقط', en: 'Answer from knowledge only' }, on: true },
            { label: { ar: 'زر التحويل لإنسان', en: 'Human handoff button' }, on: true },
        ],
        chat: [
            { from: 'user', text: { ar: 'كم سعر الخطة الاحترافية؟', en: 'How much is the Pro plan?' } },
            {
                from: 'bot',
                text: { ar: 'الخطة الاحترافية 49.5 دولاراً أو 3500 نجمة — من ملف الأسعار المعتمد.', en: 'The Pro plan is $49.5 or 3500 Stars — from the approved price sheet.' },
                chip: { ar: 'المصدر: الأسعار.pdf', en: 'Source: prices.pdf' },
            },
            { from: 'user', text: { ar: 'وهل يوجد خصم جماعي؟', en: 'Is there a bulk discount?' } },
            { from: 'bot', text: { ar: 'لا أجد هذا في معلوماتك — أحوّلك لموظف يجيبك.', en: 'I cannot find that in your data — handing you to staff.' } },
        ],
    },
    {
        sku: 'multibot-crm',
        name: { ar: 'منصة CRM الموحدة', en: 'Unified CRM Platform' },
        tagline: { ar: 'بوتاتك كلها من واجهة واحدة', en: 'All your bots in one console' },
        palette: ['#4f46e5', '#8b5cf6'],
        glyph: 'grid',
        panelTitle: { ar: 'لوحة كل البوتات', en: 'All-bots console' },
        kpis: [
            { label: { ar: 'بوتات مُدارة', en: 'Managed bots' }, value: '12' },
            { label: { ar: 'عملاء موحّدون', en: 'Unified contacts' }, value: '8,412' },
            { label: { ar: 'أتمتة نشطة', en: 'Active automations' }, value: '17' },
        ],
        tableHead: [
            { ar: 'البوت', en: 'Bot' },
            { ar: 'الطلبات', en: 'Orders' },
            { ar: 'الحالة', en: 'Status' },
        ],
        rows: [
            { cells: ['متجر →', '37', 'نشط'], tone: 'ok' },
            { cells: ['دعم →', '58', 'نشط'], tone: 'ok' },
            { cells: ['حجوزات →', '14', 'نشط'], tone: 'ok' },
            { cells: ['مجموعات →', '64', 'موقوف'], tone: 'off' },
            { cells: ['واتساب →', '23', 'نشط'], tone: 'ok' },
        ],
        toggles: [
            { label: { ar: 'عرض موحّد للعملاء', en: 'Unified contact view' }, on: true },
            { label: { ar: 'أتمتة بين البوتات', en: 'Cross-bot automation' }, on: true },
        ],
        chat: [
            {
                from: 'bot',
                text: { ar: 'لوحة CRM: 12 بوتاً، 8412 عميلاً.', en: 'CRM console: 12 bots, 8412 contacts.' },
                chip: { ar: 'عرض موحّد للعميل @sara', en: 'Unified view of @sara' },
            },
            { from: 'bot', text: { ar: 'كل محادثاتها في كل بوتاتك في بطاقة واحدة.', en: 'Every conversation across your bots in one card.' } },
        ],
    },
    {
        sku: 'workflow-engine',
        name: { ar: 'محرك الأتمتة الذكي', en: 'Workflow Automation Engine' },
        tagline: { ar: 'ربط بلا كود مع n8n والويبهوك', en: 'No-code hooks into n8n and webhooks' },
        palette: ['#e11d48', '#fb7185'],
        glyph: 'flow',
        panelTitle: { ar: 'لوحة التدفقات', en: 'Flows panel' },
        kpis: [
            { label: { ar: 'تدفقات نشطة', en: 'Active flows' }, value: '23' },
            { label: { ar: 'أحداث اليوم', en: 'Events today' }, value: '4,107' },
            { label: { ar: 'فشل', en: 'Failures' }, value: '2' },
        ],
        tableHead: [
            { ar: 'التدفق', en: 'Flow' },
            { ar: 'المشغّل', en: 'Trigger' },
            { ar: 'المرات', en: 'Runs' },
        ],
        rows: [
            { cells: ['عميل جديد → Sheets', 'customer_new', '812'], tone: 'ok' },
            { cells: ['طلب → Slack', 'order', '1,204'], tone: 'ok' },
            { cells: ['رسالة → n8n', 'message', '2,091'], tone: 'ok' },
            { cells: ['انتهاء اشتراك → بريد', 'expired', '2 فشل'], tone: 'warn' },
        ],
        toggles: [
            { label: { ar: 'ربط ويبهوك موقع', en: 'Outbound webhook' }, on: true },
            { label: { ar: 'قوالب Google Sheets', en: 'Google Sheets templates' }, on: true },
        ],
        chat: [
            {
                from: 'bot',
                text: { ar: 'حدث: عميل جديد @sara — نُفّذ التدفق:', en: 'Event: new customer @sara — flow ran:' },
                chip: { ar: 'Sheets ✅ Slack ✅ بريد ✅', en: 'Sheets ✅ Slack ✅ Email ✅' },
            },
            { from: 'bot', text: { ar: 'يمكنك إضافة التدفق من اللوحة بلا كود.', en: 'Add flows from the console without code.' } },
        ],
    },
    {
        sku: 'whatsapp-bot-pro',
        name: { ar: 'بوت واتساب للأعمال', en: 'WhatsApp Business Bot' },
        tagline: { ar: 'ربط رسمي أو جلسة آمنة', en: 'Official Cloud API or secure session' },
        palette: ['#16a34a', '#22c55e'],
        glyph: 'chat',
        panelTitle: { ar: 'لوحة المحادثات', en: 'Conversations panel' },
        kpis: [
            { label: { ar: 'محادثات اليوم', en: 'Chats today' }, value: '96' },
            { label: { ar: 'طلبات من واتساب', en: 'WhatsApp orders' }, value: '31' },
            { label: { ar: 'رد آلي', en: 'Auto-replied' }, value: '74%' },
        ],
        tableHead: [
            { ar: 'العميل', en: 'Customer' },
            { ar: 'آخر رسالة', en: 'Last message' },
            { ar: 'الحالة', en: 'Status' },
        ],
        rows: [
            { cells: ['+966 5x…', 'أريد السعر', 'أُجيب آلياً'], tone: 'ok' },
            { cells: ['+967 7x…', 'متى يوصل؟', 'محوّلة'], tone: 'warn' },
            { cells: ['+971 5x…', 'طلب منتج', 'أُجيب آلياً'], tone: 'ok' },
            { cells: ['+20 1x…', 'شكوى', 'محوّلة'], tone: 'warn' },
            { cells: ['+966 5x…', 'شكراً', 'أُجيب آلياً'], tone: 'ok' },
        ],
        toggles: [
            { label: { ar: 'ربط Cloud API رسمي', en: 'Official Cloud API link' }, on: true },
            { label: { ar: 'ربط تيليجرام المزدوج', en: 'Dual Telegram link' }, on: true },
        ],
        chat: [
            {
                from: 'bot',
                text: { ar: 'مرحباً بك في متجر دُرّة 🌿 كيف أساعدك؟', en: 'Welcome to the Durra store 🌿 how can I help?' },
                chip: { ar: 'واتساب بزنس · موثّق', en: 'WhatsApp Business · verified' },
            },
            {
                from: 'bot',
                text: { ar: 'اختر:', en: 'Pick:' },
                replies: [
                    { label: { ar: 'الأسعار', en: 'Prices' }, to: 1 },
                    { label: { ar: 'تتبع طلبي', en: 'Track my order' }, to: 3 },
                ],
            },
            { from: 'user', text: { ar: 'الأسعار', en: 'Prices' } },
            {
                from: 'bot',
                text: { ar: 'علبة الضيافة 349 ر.س، سكّري 1كجم 189 ر.س — والطلب متاح أيضاً عبر تيليجرام.', en: 'Hospitality box SAR 349, Sukkari 1kg SAR 189 — ordering also works on Telegram.' },
            },
        ],
    },
];
export const botBySku = (sku) => BOTS.find((b) => b.sku === sku);
