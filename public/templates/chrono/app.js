import { art, heroArt } from './art.js';
import * as cart from './cart.js';
import { CONFIG } from './config.js';
import { I18N } from './i18n.js';
import { PRODUCTS } from './products.js';
/** ربط الواجهة — كل شيء يعمل بعد اكتمال الـDOM.
 *  لا طلبات شبكة، لا تتبّع: الحالة = اللغة والسلة، محلياً فقط. */
const el = (id) => {
    const found = document.getElementById(id);
    if (!found)
        throw new Error(`missing #${id}`);
    return found;
};
const t = (lang, key) => I18N[lang][key] ?? '';
const bi = (lang, b) => b[lang];
/** ثقة معلنة: الـHTML المارّ من هنا ثوابت من الكود (بنية + SVG). */
const trusted = (markup) => markup;
const CATS = [
    { id: 'classic', key: 'catClassic' },
    { id: 'sport', key: 'catSport' },
    { id: 'luxury', key: 'catLuxury' },
];
let lang = readLang();
let cat = 'all';
let query = '';
let sort = 'featured';
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
        // لا يهم
    }
}
/** تطبيع عربي/إنجليزي: حركات، تطويل، أرقام، همزات — كلمة واحدة تكفي. */
function norm(input) {
    return input
        .toLowerCase()
        .replace(/[ً-ْٰـ]/g, '')
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
        .replace(/[آأإٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .trim();
}
function applyI18n() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        const key = node.dataset['i18n'];
        if (!key)
            return;
        const val = t(lang, key); if (val.includes("<")) node.innerHTML = val; else node.textContent = val;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((node) => {
        const key = node.dataset['i18nPh'];
        if (key)
            node.setAttribute('placeholder', t(lang, key));
    });
    const cur = el('cart-total');
    cur.dataset['label'] = t(lang, 'cartTotal');
    renderChips();
    renderGrid();
    renderCart();
    syncCart();
}
function matches(p) {
    if (cat !== 'all' && p.cat !== cat)
        return false;
    const q = norm(query);
    if (!q)
        return true;
    const hay = norm(`${bi(lang, p.name)} ${bi(lang, p.desc)} ${bi(lang, p.meta)} ${p.specs.map((s) => bi(lang, s)).join(' ')}`);
    return hay.includes(q);
}
function shown() {
    const list = PRODUCTS.filter(matches);
    if (sort === 'asc')
        list.sort((a, b) => a.price - b.price);
    if (sort === 'desc')
        list.sort((a, b) => b.price - a.price);
    return list;
}
function priceTag(p) {
    const fmt = (n) => n.toLocaleString('en-US');
    const now = `${fmt(p.price)} ${t(lang, 'currency')}`;
    return p.old ? `<s>${fmt(p.old)}</s><b>${now}</b>` : `<b>${now}</b>`;
}
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
        chip.dataset['cat'] = id;
        chip.addEventListener('click', () => {
            cat = id;
            renderChips();
            renderGrid();
        });
        box.appendChild(chip);
    }
}
function node(p) {
    const card = document.createElement('article');
    card.className = 'product';
    card.tabIndex = 0;
    const badge = p.badge ? `<i class="badge">${bi(lang, p.badge)}</i>` : '';
    card.innerHTML = trusted(`<div class="art-wrap">${badge}${art(p.kind, p.id)}</div>` +
        `<div class="spec-chips">${p.specs.map((s) => `<span class="spec">${bi(lang, s)}</span>`).join('')}</div>` +
        `<h3></h3><p class="desc"></p><p class="meta"></p>` +
        `<div class="price">${priceTag(p)}</div>` +
        `<div class="row gap"><button class="btn primary sm add" type="button"></button>` +
        `<button class="btn ghosty sm view" type="button"></button></div>`);
    card.querySelector('h3').textContent = p.name[lang];
    card.querySelector('p.desc').textContent = p.desc[lang];
    card.querySelector('p.meta').textContent = p.meta[lang];
    const add = card.querySelector('button.add');
    add.textContent = t(lang, 'addToCart');
    add.addEventListener('click', () => {
        cart.add(p.id);
        toast(t(lang, 'added'));
        syncCart();
        renderCart();
    });
    const view = card.querySelector('button.view');
    view.textContent = t(lang, 'quickView');
    view.addEventListener('click', () => openQuick(p));
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')
            openQuick(p);
    });
    return card;
}
function renderGrid() {
    const grid = el('grid');
    grid.textContent = '';
    const list = shown();
    el('no-results').hidden = list.length > 0;
    const frag = document.createDocumentFragment();
    list.forEach((p) => frag.appendChild(node(p)));
    grid.appendChild(frag);
}
function openQuick(p) {
    const modal = el('modal');
    modal.textContent = '';
    const wrap = document.createElement('div');
    wrap.className = 'quick';
    wrap.innerHTML = trusted(`<div class="art-wrap lg">${art(p.kind, p.id)}</div>` +
        `<div class="quick-copy"><h3></h3><p class="desc"></p><p class="meta"></p>` +
        `<div class="spec-chips">${p.specs.map((s) => `<span class="spec">${bi(lang, s)}</span>`).join('')}</div>` +
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
        renderCart();
    });
    const close = wrap.querySelector('button.close');
    close.textContent = t(lang, 'close');
    close.addEventListener('click', closeModal);
    modal.appendChild(wrap);
    el('modal-backdrop').hidden = false;
    modal.hidden = false;
    add.focus();
}
function closeModal() {
    el('modal').hidden = true;
    el('modal-backdrop').hidden = true;
}
function openCart() {
    el('cart').hidden = false;
    el('cart-backdrop').hidden = false;
}
function closeCart() {
    el('cart').hidden = true;
    el('cart-backdrop').hidden = true;
}
function renderCart() {
    const box = el('cart-lines');
    box.textContent = '';
    const lines = cart.cart();
    el('cart-empty').hidden = lines.length > 0;
    el('cart-foot').hidden = lines.length === 0;
    for (const line of lines) {
        const p = PRODUCTS.find((x) => x.id === line.id);
        if (!p)
            continue;
        const row = document.createElement('div');
        row.className = 'cart-line';
        row.innerHTML = trusted(`<div class="art-wrap sm">${art(p.kind, p.id)}</div>` +
            `<div class="grow"><b class="ln"></b><span class="price">${p.price.toLocaleString('en-US')}</span></div>` +
            `<div class="stepper"><button class="step minus" type="button" aria-label="-">−</button>` +
            `<i class="qty"></i><button class="step plus" type="button" aria-label="+">+</button></div>` +
            `<button class="ghost del" type="button" aria-label="×">×</button>`);
        row.querySelector('.ln').textContent = p.name[lang];
        row.querySelector('.qty').textContent = String(line.qty);
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
    el('cart-total').querySelector('b').textContent = cart.fmt(cart.totalOf(PRODUCTS), lang);
}
function syncCart() {
    const n = cart.count();
    const badge = el('cart-count');
    badge.hidden = n === 0;
    badge.textContent = String(n);
}
function orderVia(target) {
    const who = target === 'wa' ? CONFIG.whatsapp : CONFIG.telegram;
    if (!who) {
        openDemo();
        return;
    }
    const msg = cart.orderMessage(lang, PRODUCTS);
    const url = target === 'wa'
        ? `https://wa.me/${who}?text=${encodeURIComponent(msg)}`
        : `https://t.me/${who}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
}
/** تنبيه العرض التجريبي — بدل مراسلة رقم لم يُخصص بعد. */
function openDemo() {
    const modal = el('modal');
    modal.textContent = '';
    const box = document.createElement('div');
    box.className = 'quick demo';
    box.innerHTML = trusted('<h3></h3><p class="desc"></p><div class="row"><button class="btn primary sm ok" type="button"></button></div>');
    box.querySelector('h3').textContent = t(lang, 'demoTitle');
    box.querySelector('p.desc').textContent = t(lang, 'demoText');
    const okBtn = box.querySelector('button.ok');
    okBtn.textContent = t(lang, 'demoOk');
    okBtn.addEventListener('click', closeModal);
    modal.appendChild(box);
    el('modal-backdrop').hidden = false;
    modal.hidden = false;
    okBtn.focus();
}
let toastTimer = 0;
function toast(msg) {
    const nodeEl = el('toast');
    nodeEl.textContent = msg;
    nodeEl.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        nodeEl.hidden = true;
    }, 2200);
}
/** عدّادات الهيرو — تتحرك مرة واحدة عند الوصول، وتبقى قيمتها النهائية. */
function animateStats() {
    const nums = document.querySelectorAll('[data-count]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = [...nums].map((n) => Number(n.dataset['count'] ?? 0));
    if (reduce) {
        nums.forEach((n, i) => {
            n.textContent = targets[i].toLocaleString('en-US');
        });
        return;
    }
    nums.forEach((n, i) => {
        const target = targets[i];
        const t0 = performance.now();
        const step = (now) => {
            const k = Math.min(1, (now - t0) / 900);
            n.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US');
            if (k < 1)
                requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    });
}
/** كشف التمرير: العناصر المعلّمة تظهر مرة واحدة فقط. */
function observeReveals() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
        nodes.forEach((n) => n.classList.add('in'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        }
    }, { rootMargin: '-40px' });
    nodes.forEach((n) => io.observe(n));
}
function boot() {
    el('hero-art').innerHTML = trusted(heroArt());
    el('year').textContent = String(new Date().getFullYear());
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
    });
    el('search').addEventListener('input', () => {
        query = el('search').value;
        renderGrid();
    });
    el('sort').addEventListener('change', () => {
        sort = el('sort').value;
        renderGrid();
    });
    el('cart-open').addEventListener('click', openCart);
    el('cart-close').addEventListener('click', closeCart);
    el('cart-backdrop').addEventListener('click', closeCart);
    el('modal-backdrop').addEventListener('click', closeModal);
    el('checkout-tg').addEventListener('click', () => orderVia('tg'));
    el('checkout-wa').addEventListener('click', () => orderVia('wa'));
    el('cart-clear').addEventListener('click', () => {
        cart.clear();
        syncCart();
        renderCart();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape')
            return;
        closeCart();
        if (!el('modal').hidden)
            closeModal();
    });
    applyI18n();
    animateStats();
    observeReveals();
}
boot();
