import { CONFIG } from './config.js';
import { I18N } from './i18n.js';
/** السلة — حالة الزائر محلياً فقط: لا يُرسل شيء ولا يُجمع تتبّع.
 *  التخزين قد يكون معطّلاً (تصفح خفي) — كل عملية تتجاهل الخطأ بهدوء. */
const MAX_LINES = 40;
const MAX_QTY = 9;
function read() {
    try {
        const raw = localStorage.getItem(CONFIG.storageKey);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((l) => typeof l === 'object' && l !== null && typeof l.id === 'number' && Number.isFinite(l.qty));
    }
    catch {
        return [];
    }
}
function write(lines) {
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(lines));
    }
    catch {
        // لا مساحة أو تخزين معطل — السلة تبقى في الذاكرة فقط
    }
}
let lines = read();
export function cart() {
    return lines;
}
export function add(id) {
    const found = lines.find((l) => l.id === id);
    if (found)
        found.qty = Math.min(MAX_QTY, found.qty + 1);
    else if (lines.length < MAX_LINES)
        lines.push({ id, qty: 1 });
    write(lines);
}
export function setQty(id, qty) {
    if (qty <= 0) {
        remove(id);
        return;
    }
    const found = lines.find((l) => l.id === id);
    if (found)
        found.qty = Math.min(MAX_QTY, qty);
    write(lines);
}
export function remove(id) {
    lines = lines.filter((l) => l.id !== id);
    write(lines);
}
export function clear() {
    lines = [];
    write(lines);
}
export function count() {
    return lines.reduce((n, l) => n + l.qty, 0);
}
export function totalOf(products) {
    return lines.reduce((sum, l) => {
        const p = products.find((x) => x.id === l.id);
        return sum + (p ? p.price * l.qty : 0);
    }, 0);
}
export function fmt(n, lang = 'ar') {
    return `${n.toLocaleString('en-US')} ${I18N[lang].currency}`;
}
/** ملخص الطلب الجاهز — نص ثابت من بيانات الكود يرِد في الرسالة. */
export function orderMessage(lang, products) {
    const rows = lines
        .map((l) => {
        const p = products.find((x) => x.id === l.id);
        return p ? `• ${p.name[lang]} ×${l.qty} — ${fmt(p.price * l.qty, lang)}` : '';
    })
        .filter(Boolean);
    const head = lang === 'ar' ? 'طلب من متجر سمارت زون:' : 'Order from Smart Zone:';
    const total = lang === 'ar' ? `الإجمالي: ${fmt(totalOf(products), lang)}` : `Total: ${fmt(totalOf(products), lang)}`;
    return [head, ...rows, total].join('\n');
}
