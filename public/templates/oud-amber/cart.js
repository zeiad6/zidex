import { CONFIG } from './config.js';
import { I18N } from './i18n.js';
/** منطق السلة — نقّي بالكامل (لا يلمس DOM)، فيُفحص ويُجرَّب بمعزل عن المتصفح.
 *  السلة تعيش في جهاز الزائر وحده: تُخزن محلياً ولا تُرسل لأي خادم —
 *  الأمان بالتصميم: لا شيء يجمعه المتجر عن زائره إطلاقاً. */
const t = (lang, key) => I18N[lang][key] ?? '';
/** سقف معقول لعدد الأسطر — يمنع السلة من النمو بلا حدود في التخزين المحلي. */
export const MAX_LINES = 40;
export const MAX_QTY = 9;
function read() {
    try {
        const raw = localStorage.getItem(CONFIG.storageKey);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((l) => typeof l === 'object' && l !== null &&
            Number.isInteger(l.id) && Number.isInteger(l.qty) &&
            l.qty >= 1 && l.qty <= MAX_QTY).slice(0, MAX_LINES);
    }
    catch {
        return []; // تخزين محلي معطوب أو معطل — سلة فارغة بدل الانهيار
    }
}
function write(lines) {
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(lines));
    }
    catch {
        // التخزين معطل (وضع خاص) — السلة تعمل في الذاكرة للجلسة فقط
    }
}
/** نسخة الجلسة — يقرأها boot مرة ويكتب التغييرات عبر السلسلة. */
let lines = read();
export function cart() {
    return lines;
}
export function add(id) {
    const found = lines.find((l) => l.id === id);
    if (found) {
        if (found.qty < MAX_QTY)
            lines = lines.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l));
    }
    else if (lines.length < MAX_LINES) {
        lines = [...lines, { id, qty: 1 }];
    }
    write(lines);
}
export function setQty(id, qty) {
    if (qty < 1)
        return void remove(id);
    if (qty > MAX_QTY)
        return;
    lines = lines.map((l) => (l.id === id ? { ...l, qty } : l));
    write(lines);
}
export function remove(id) {
    lines = lines.filter((l) => l.id !== id);
    write(lines);
}
export function count() {
    return lines.reduce((n, l) => n + l.qty, 0);
}
export function totalOf(products) {
    const price = new Map(products.map((p) => [p.id, p.price]));
    return lines.reduce((sum, l) => sum + (price.get(l.id) ?? 0) * l.qty, 0);
}
/** صيغة السعر — بالدولار، فواصل آلاف للقراءة السريعة. */
export function fmt(n) {
    return `$${n.toLocaleString('en-US')}`;
}
/** رسالة الطلب الجاهزة — بلغة الواجهة، تصل صاحب المتجر نصاً كاملاً
 *  فيه كل منتج وكميته والإجمالي، فيكفي الإرسال. */
export function orderMessage(lang, products) {
    const byId = new Map(products.map((p) => [p.id, p]));
    const rows = lines
        .map((l) => {
        const p = byId.get(l.id);
        if (!p)
            return '';
        return `• ${p.name[lang]} ×${l.qty} — ${fmt(p.price * l.qty)}`;
    })
        .filter(Boolean);
    const head = t(lang, 'orderTitle');
    const foot = `${t(lang, 'orderTotalLine')}: ${fmt(totalOf(products))}\n${t(lang, 'orderFrom')}`;
    return rows.length ? `${head}\n${rows.join('\n')}\n${foot}` : head;
}
