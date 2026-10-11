/** الثيم النهاري/ليلي — مصدره واحد: داخل تيليجرام ثيم العميل، وخارجه اختيار الزائر.
 *  الترتيب ملزم: تيليجرام → الاختيار المخزَّن → إعداد النظام. */
import { haptic, onTelegramThemeChange, telegramScheme, telegramThemeVars } from './tg.js';
const STORAGE_KEY = 'bot-suite-theme';
const THEME_COLORS = { light: '#f2f5fb', dark: '#0b1020' };
const readStored = () => {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v === 'light' || v === 'dark' ? v : null;
    }
    catch {
        return null;
    }
};
const systemPrefers = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
/** الثيم الفعلي الآن. داخل تيليجرام لا رأي للزائر — العميل هو الذي يقرّر. */
export const currentTheme = () => telegramScheme() ?? readStored() ?? systemPrefers();
/** هل يستطيع الزائر تبديل الثيم من داخلنا؟ لا وهو داخل تيليجرام. */
export const themeSwitchable = () => telegramScheme() === undefined;
export function applyTheme(mode) {
    document.documentElement.dataset.theme = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[mode]);
    // داخل تيليجرام: ألوان العميل تصير قيماً فعليّة للتصميم
    const vars = telegramThemeVars();
    const map = {
        '--tg-bg': vars['bg_color'],
        '--tg-surface': vars['secondary_bg_color'] ?? vars['section_bg_color'],
        '--tg-ink': vars['text_color'],
        '--tg-muted': vars['hint_color'],
        '--tg-accent': vars['button_color'],
        '--tg-accent-ink': vars['button_text_color'],
        '--tg-line': vars['section_bg_color'],
    };
    for (const [k, v] of Object.entries(map)) {
        if (v)
            document.documentElement.style.setProperty(k, v);
    }
}
/** تبديل يدوي — يعود بالثيم الجديد بعد حفظه (متجاهَل داخل تيليجرام). */
export function toggleTheme() {
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    try {
        localStorage.setItem(STORAGE_KEY, next);
    }
    catch {
        // تخزين معطل — الثيم يبقى لهذه الجلسة
    }
    applyTheme(next);
    haptic('toggle');
    return next;
}
/** تيليجرام يبدّل ثيمه (أو يتبع نظام الهاتف) — نعيد البناء كلّه خلفه. */
export function followTelegramTheme(cb) {
    onTelegramThemeChange(() => {
        const scheme = telegramScheme();
        if (scheme)
            applyTheme(scheme);
        cb();
    });
    // وفي المتصفح: تابع تغيّر نظام التشغيل إن لم يختر الزائر ثيمة بنفسه
    if (themeSwitchable() && !readStored() && window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
            applyTheme(currentTheme());
            cb();
        });
    }
}
