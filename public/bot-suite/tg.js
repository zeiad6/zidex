/** جسر Telegram WebApp — كل ما يربط الواجهة بتيليجرام في ملف واحد.
 *
 *  القاعدة: الواجهة تعمل كاملاً في متصفح عادي بلا تيليجرام. كل دالة هنا تتحقق
 *  من وجود الـSDK أولاً وترجع بهدوء إن غاب — لا استثناءات، لا شاشة بيضاء.
 *  الـSDK يُحمَّل سكربتاً كلاسيكياً في index.html قبل الحزمة، فإن فشل التحميل
 *  (حجب، انقطاع) بقيت الواجهة فهي «وضع المتصفح». */
export const webapp = () => {
    try {
        return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
    }
    catch {
        return undefined;
    }
};
/** داخل تيليجرام فقط: وجود initData يعني فتحاً حقيقياً من بوت، لا صفحة في متصفح. */
export const inTelegram = () => {
    const wa = webapp();
    return !!wa && wa.initData.length > 0;
};
/** ثيم العميل كما يختاره في تيليجرام — المصدر الأول للثيم داخل التطبيق. */
export const telegramScheme = () => webapp()?.colorScheme;
/** ألوان ثيم تيليجرام كمصدر قيم CSS — داخل التطبيق فقط. */
export const telegramThemeVars = () => webapp()?.themeParams ?? {};
export function telegramReady() {
    const wa = webapp();
    if (!wa)
        return;
    try {
        wa.ready();
        wa.expand();
        wa.setHeaderColor?.('secondary_bg_color');
        wa.setBackgroundColor?.('bg_color');
    }
    catch {
        // إصدار قديم بلا setHeaderColor — لا يهم
    }
}
/** اهتزاز خفيف عند اللمس — يُهمل بصمت إن لم يدعمه العميل. */
export function haptic(kind = 'tap') {
    const h = webapp()?.HapticFeedback;
    if (!h)
        return;
    try {
        if (kind === 'toggle')
            h.selectionChanged();
        else if (kind === 'done')
            h.notificationOccurred('success');
        else if (kind === 'warn')
            h.notificationOccurred('warning');
        else
            h.impactOccurred('light');
    }
    catch {
        // لا شيء
    }
}
/** زر الرجوع الأصلي: يظهر فقط في عرض البوت داخل تيليجرام. */
export function backButton(show, onClick) {
    const wa = webapp();
    if (!wa)
        return;
    try {
        wa.BackButton.offClick(onClick);
        if (show) {
            wa.BackButton.onClick(onClick);
            wa.BackButton.show();
        }
        else {
            wa.BackButton.hide();
        }
    }
    catch {
        // لا شيء
    }
}
/** الزر الرئيسي السفلي: يظهر في عرض البوت ليفتح الشراء كما يفعل أي Mini App. */
export function mainButton(text, onClick) {
    const wa = webapp();
    if (!wa)
        return;
    try {
        wa.MainButton.offClick(onClick);
        wa.MainButton.setText(text);
        wa.MainButton.onClick(onClick);
        wa.MainButton.show();
    }
    catch {
        // لا شيء
    }
}
export function hideMainButton() {
    try {
        webapp()?.MainButton.hide();
    }
    catch {
        // لا شيء
    }
}
/** متابعة تغيّر ثيم العميل: يعاد بناء الواجهة كاملة عند التبديل. */
export function onTelegramThemeChange(cb) {
    const wa = webapp();
    if (!wa)
        return;
    try {
        wa.onEvent('themeChanged', cb);
    }
    catch {
        // لا شيء
    }
}
/** فتح رابط خارجي: داخل تيليجرام يفتح متصفحه المدمج، وخارجه تبويباً جديداً. */
export function openExternal(url) {
    if (inTelegram()) {
        try {
            webapp()?.openLink(url);
            return;
        }
        catch {
            // يسقط للفتح العادي
        }
    }
    window.open(url, '_blank', 'noopener');
}
/** ارتفاع النافذة الفعلي في تيليجرام — يمنع الشريط السفلي من تغطية المحتوى. */
export function viewportHeight() {
    return webapp()?.viewportStableHeight ?? null;
}
