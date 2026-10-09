import { art, heroArt } from './art.js';
import * as cart from './cart.js';
import { CONFIG } from './config.js';
import { I18N } from './i18n.js';
import { PRODUCTS } from './products.js';
/** ربط الواجهة — كل شيء هنا يعمل بعد اكتمال الـDOM (script defer).
 *  لا طلبات شبكة، لا تتبع، لا تخزين بعيد: الحالة = اللغة والسلة، محلياً فقط. */
const el = (id) => {
    const found = document.getElementById(id);
    if (!found)
        throw new Error(`missing #${id}`);
    return found;
};
const t = (lang, key) => I18N[lang][key] ?? '';
const bi = (lang, b) => b[lang];
/** علامة ثقة معلنة: الـHTML المارّ من هنا ثوابت من الكود فقط (بنية + SVG
 *  من art.ts)، ولا مدخلات مستخدم فيه. أي نص من بيانات المنتجات أو المستخدم
 *  يُعرض عبر textContent خارجه. check.mjs يرفض أي innerHTML بلا هذه العلّة. */
const trusted = (markup) => markup;
const CATS = [
    { id: 'perfume', key: 'catPerfume' },
    { id: 'oud', key: 'catOud' },
    { id: 'gifts', key: 'catGifts' },
];
// ── الحالة ────────────────────────────────────────────────────────────────
let lang = readLang();
let cat = 'all';
let query = '';
function readLang() {
    try {
        const saved = localStorage.getItem(CONFIG.langKey);
        if (saved === 'ar' || saved === 'en')
            return saved;
    }
    catch {
        // تخزين معطل — العربية هي الافتراض
    }
    return 'ar';
}
function writeLang() {
    try {
        localStorage.setItem(CONFIG.langKey, lang);
    }
    catch {
        // لا يهم — الجلسة القادمة تعود للعربية
    }
}
// ── اللغة: تطبيق الترجمة على كل عقدة تحمل data-i18n ──────────────────────
// القيم من I18N وحدها ومكتوبة هنا (لا مدخلات مستخدم) — يسمح بـHTML فقط
// للقيم التي تحمل علامة < وهي موثوقة، فلا حقن ممكن.
function applyI18n() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        const key = node.dataset['i18n'];
        if (!key)
            return;
        const val = t(lang, key);
        if (val.includes('<'))
            node.innerHTML = val;
        else
            node.textContent = val;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((node) => {
        const key = node.dataset['i18nPh'];
        if (key)
            node.placeholder = t(lang, key);
    });
}
// ── الأقسام والبحث والشبكة ────────────────────────────────────────────────
function renderChips() {
    const box = el('chips');
    box.textContent = '';
    const all = ['all', ...CATS.map((c) => c.id)];
    for (const id of all) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `chip${cat === id ? ' on' : ''}`;
        chip.textContent = id === 'all' ? t(lang, 'all') : t(lang, CATS.find((c) => c.id === id).key);
        chip.setAttribute('aria-pressed', String(cat === id));
        chip.addEventListener('click', () => {
            cat = id;
            renderChips();
            renderGrid();
        });
        box.appendChild(chip);
    }
}
function matches(p) {
    if (cat !== 'all' && p.cat !== cat)
        return false;
    if (!query)
        return true;
    const q = query.toLowerCase();
    return (p.name[lang].toLowerCase().includes(q) ||
        p.desc[lang].toLowerCase().includes(q) ||
        p.meta[lang].toLowerCase().includes(q));
}
function priceTag(p) {
    const now = cart.fmt(p.price);
    return p.old ? `<s>${cart.fmt(p.old)}</s><b>${now}</b>` : `<b>${now}</b>`;
}
/** بطاقة المنتج — كل مدخل إلى الـDOM يمر عبر التطهير: أسماء المنتجات
 *  نصوص مكتوبة في products.ts (لا مدخلات مستخدم)، ومع ذلك تُعرض عبر
 *  textContent ما أمكن؛ HTML المجمّع هنا من دوالنا وحدها. */
function renderGrid() {
    const grid = el('grid');
    grid.textContent = '';
    const shown = PRODUCTS.filter(matches);
    el('no-results').hidden = shown.length > 0;
    shown.forEach((p, i) => {
        const card = document.createElement('article');
        card.className = 'card product';
        card.tabIndex = 0;
        const badge = p.badge ? `<i class="badge">${bi(lang, p.badge)}</i>` : '';
        card.innerHTML = trusted(`<div class="art-wrap">${badge}${art(p.kind, i)}</div>` +
            `<h3></h3><p class="desc"></p>` +
            `<div class="price">${priceTag(p)}</div>` +
            `<div class="row gap"><button class="btn primary sm add" type="button"></button>` +
            `<button class="btn ghosty sm view" type="button"></button></div>`);
        // النصوص عبر textContent — لا تفسير HTML من أي مصدر
        card.querySelector('h3').textContent = p.name[lang];
        card.querySelector('p.desc').textContent = p.desc[lang];
        const add = card.querySelector('button.add');
        add.textContent = t(lang, 'addToCart');
        add.addEventListener('click', () => {
            cart.add(p.id);
            toast(t(lang, 'added'));
            syncCart();
        });
        const view = card.querySelector('button.view');
        view.textContent = t(lang, 'quickView');
        view.addEventListener('click', () => openQuick(p));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter')
                openQuick(p);
        });
        grid.appendChild(card);
    });
}
// ── العرض السريع ─────────────────────────────────────────────────────────
function openQuick(p) {
    const modal = el('modal');
    modal.textContent = '';
    modal.appendChild(quickNode(p));
    el('modal-backdrop').hidden = false;
    modal.hidden = false;
    modal.querySelector('button.add')?.focus();
}
function quickNode(p) {
    const wrap = document.createElement('div');
    wrap.className = 'quick';
    wrap.innerHTML = trusted(`<div class="art-wrap">${art(p.kind, p.id)}</div>` +
        `<div class="quick-copy"><h3></h3><p class="desc"></p><p class="meta"></p>` +
        `<div class="price">${priceTag(p)}</div>` +
        `<div class="row gap"><button class="btn primary sm add" type="button"></button>` +
        `<button class="btn ghosty sm close" type="button"></button></div></div>`);
    wrap.querySelector('h3').textContent = p.name[lang];
    wrap.querySelector('p.desc').textContent = p.desc[lang];
    wrap.querySelector('p.meta').textContent = p.meta[lang];
    const add = wrap.querySelector('button.add');
    add.textContent = t(lang, 'addToCart');
    add.addEventListener('click', () => {
        cart.add(p.id);
        toast(t(lang, 'added'));
        closeModal();
        syncCart();
    });
    const close = wrap.querySelector('button.close');
    close.textContent = t(lang, 'close');
    close.addEventListener('click', closeModal);
    return wrap;
}
function closeModal() {
    el('modal').hidden = true;
    el('modal-backdrop').hidden = true;
}
// ── السلة ────────────────────────────────────────────────────────────────
function openCart() {
    el('cart-drawer').hidden = false;
    el('cart-backdrop').hidden = false;
    renderCart();
}
function closeCart() {
    el('cart-drawer').hidden = true;
    el('cart-backdrop').hidden = true;
}
function renderCart() {
    const lines = cart.cart();
    const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
    const box = el('cart-lines');
    box.textContent = '';
    el('cart-empty').hidden = lines.length > 0;
    el('cart-foot').hidden = lines.length === 0;
    for (const line of lines) {
        const p = byId.get(line.id);
        if (!p)
            continue;
        const row = document.createElement('div');
        row.className = 'cart-line';
        row.innerHTML = trusted(`<div class="art-wrap sm">${art(p.kind, p.id)}</div>` +
            `<div class="grow"><b class="ln"></b><span class="price">${cart.fmt(p.price)}</span></div>` +
            `<div class="stepper"><button class="step minus" type="button" aria-label="-">−</button>` +
            `<i class="qty"></i><button class="step plus" type="button" aria-label="+">+</button></div>` +
            `<button class="ghost del" type="button" aria-label="×">×</button>`);
        // الكمية رقم من حالة محلية — تُعرض نصاً لا HTML
        row.querySelector('.qty').textContent = String(line.qty);
        row.querySelector('.ln').textContent = p.name[lang];
        row.querySelector('.minus').addEventListener('click', () => {
            cart.setQty(line.id, line.qty - 1);
            syncCart();
            renderCart();
        });
        row.querySelector('.plus').addEventListener('click', () => {
            cart.setQty(line.id, line.qty + 1);
            syncCart();
            renderCart();
        });
        row.querySelector('.del').addEventListener('click', () => {
            cart.remove(line.id);
            toast(t(lang, 'removed'));
            syncCart();
            renderCart();
        });
        box.appendChild(row);
    }
    if (lines.length > 0)
        el('cart-total').textContent = cart.fmt(cart.totalOf(PRODUCTS));
}
/** عدّاد السلة في الشريط — النقطة الوحيدة التي تلمس العدّاد. */
function syncCart() {
    const n = cart.count();
    const badge = el('cart-count');
    badge.hidden = n === 0;
    badge.textContent = String(n);
    if (!el('cart-drawer').hidden)
        renderCart();
}
// ── الطلب: واتساب أو تيليجرام — أو تنبيه العرض إن لم يُخصص التواصل بعد ────
function orderVia(target) {
    if (cart.cart().length === 0)
        return;
    const text = encodeURIComponent(cart.orderMessage(lang, PRODUCTS));
    const number = target === 'wa' ? CONFIG.whatsapp : CONFIG.telegram;
    if (number) {
        const base = target === 'wa' ? `https://wa.me/${number}` : `https://t.me/${number}`;
        window.open(`${base}?text=${text}`, '_blank', 'noopener');
    }
    else {
        demoNotice();
    }
}
/** تنبيه العرض التجريبي — بدل مراسلة رقم لم يُخصص بعد. */
function demoNotice() {
    const modal = el('modal');
    modal.textContent = '';
    const box = document.createElement('div');
    box.className = 'quick demo';
    box.innerHTML =
        '<h3></h3><p class="desc"></p><div class="row"><button class="btn primary sm ok" type="button"></button></div>';
    box.querySelector('h3').textContent = t(lang, 'demoTitle');
    box.querySelector('p.desc').textContent = t(lang, 'demoText');
    const ok = box.querySelector('button.ok');
    ok.textContent = t(lang, 'demoOk');
    ok.addEventListener('click', closeModal);
    modal.appendChild(box);
    el('modal-backdrop').hidden = false;
    modal.hidden = false;
    ok.focus();
}
// ── إشعار صغير ────────────────────────────────────────────────────────────
let toastTimer = 0;
function toast(msg) {
    const node = el('toast');
    node.textContent = msg;
    node.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        node.hidden = true;
    }, 2400);
}
// ── عدادات الواجهة تعد صعوداً عند وصولها للنظر ────────────────────────────
function animateStats() {
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            const target = entry.target;
            if (!entry.isIntersecting || seen.has(target))
                continue;
            seen.add(target);
            const to = Number(target.dataset['count'] ?? '0');
            const suffix = target.dataset['suffix'] ?? '';
            const started = performance.now();
            const step = (now) => {
                const k = Math.min((now - started) / 900, 1);
                target.textContent = `${Math.round(to * (1 - Math.pow(1 - k, 3)))}${suffix}`;
                if (k < 1)
                    requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }
    });
    document.querySelectorAll('#stats b[data-count]').forEach((n) => io.observe(n));
}
// ── الإقلاع ────────────────────────────────────────────────────────────────
function boot() {
    el('hero-art').innerHTML = trusted(heroArt());
    el('year').textContent = String(new Date().getFullYear());
    // روابط التواصل في التذييل — تظهر فقط إن خُصصت، فيبقى العرض نظيفاً
    if (CONFIG.whatsapp) {
        const wa = el('wa-link');
        wa.href = `https://wa.me/${CONFIG.whatsapp}`;
        wa.textContent = t(lang, 'waLabel');
        wa.hidden = false;
    }
    if (CONFIG.telegram) {
        const tg = el('tg-link');
        tg.href = `https://t.me/${CONFIG.telegram}`;
        tg.textContent = t(lang, 'tgLabel');
        tg.hidden = false;
    }
    el('lang').addEventListener('click', () => {
        lang = lang === 'ar' ? 'en' : 'ar';
        writeLang();
        applyI18n();
        renderChips();
        renderGrid();
    });
    el('search').addEventListener('input', (e) => {
        query = e.target.value.trim().toLowerCase();
        renderGrid();
    });
    el('cart-open').addEventListener('click', openCart);
    el('cart-close').addEventListener('click', closeCart);
    el('cart-backdrop').addEventListener('click', closeCart);
    el('modal-backdrop').addEventListener('click', closeModal);
    el('order-wa').addEventListener('click', () => orderVia('wa'));
    el('order-tg').addEventListener('click', () => orderVia('tg'));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeCart();
        }
    });
    applyI18n();
    renderChips();
    renderGrid();
    syncCart();
    animateStats();
}
boot();
