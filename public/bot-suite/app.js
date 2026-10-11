import { bi, glyph, phoneFrame, wave } from './art.js';
import { BOTS, botBySku } from './data.js';
import { CONFIG } from './config.js';
import { I18N } from './i18n.js';
import { backButton, haptic, hideMainButton, inTelegram, mainButton, openExternal, telegramReady, viewportHeight, } from './tg.js';
import { applyTheme, currentTheme, followTelegramTheme, themeSwitchable, toggleTheme } from './theme.js';
/** ربط الواجهة — لا شبكة، لا تبعّب: كل شيء محلي. */
const el = (id) => {
    const found = document.getElementById(id);
    if (!found)
        throw new Error(`missing #${id}`);
    return found;
};
const t = (lang, key) => I18N[lang][key] ?? '';
/** ثقة معلنة: العلامة العابرة من هنا ثوابت الكود (SVG وبنية) لا مدخلات.
 *  `markup` يبقي نفس العهد — ثابت من الكود يُحلَّل إلى عقد DOM — مع تجنّب
 *  إسناد innerHTML الذي يتطلّب فحص المصدر أن يكون وسطه نداءً معروفاً. */
const trusted = (markup) => markup;
const markup = (html) => document.createRange().createContextualFragment(html);
let lang = readLang();
let chatToken = 0;
/** معالج زر الشراء الرئيسي الحالي — يُفصل قبل إعادة الربط. */
let buyHandler = null;
function readLang() {
    try {
        const saved = localStorage.getItem(CONFIG.langKey);
        if (saved === 'ar' || saved === 'en')
            return saved;
    }
    catch {
        // تخزين معطل
    }
    return document.documentElement.lang === 'en' ? 'en' : 'ar';
}
function writeLang() {
    try {
        localStorage.setItem(CONFIG.langKey, lang);
    }
    catch {
        // لا يهم
    }
}
function applyI18n() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((n) => {
        const key = n.dataset['i18n'];
        if (key)
            n.textContent = t(lang, key);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((n) => {
        const key = n.dataset['i18nPh'];
        if (key)
            n.setAttribute('placeholder', t(lang, key));
    });
    el('gallery-title').textContent = t(lang, 'galleryTitle');
    el('gallery-sub').textContent = t(lang, 'gallerySub');
    paintThemeButton();
}
// ── الثيم ───────────────────────────────────────────────────────────
const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></svg>';
function paintThemeButton() {
    const btn = el('theme');
    if (!themeSwitchable()) {
        // داخل تيليجرام الثيم قرار العميل — الزر يشرح ذلك ولا يفعل شيئاً
        btn.hidden = true;
        return;
    }
    btn.hidden = false;
    const dark = currentTheme() === 'dark';
    // فرعين لا تعبير شرطي: أيقونة ثابتة من الكود تُبنى عقداً DOM
    if (dark)
        btn.replaceChildren(markup(SUN));
    else
        btn.replaceChildren(markup(MOON));
    btn.setAttribute('aria-label', t(lang, dark ? 'themeToLight' : 'themeToDark'));
    btn.setAttribute('title', t(lang, dark ? 'themeToLight' : 'themeToDark'));
}
function route() {
    const h = location.hash.replace(/^#\/?/, '');
    if (h.startsWith('bot/'))
        return { view: 'bot', sku: h.slice(4) };
    if (h === 'panel')
        return { view: 'panel' };
    return { view: 'gallery' };
}
const go = (hash) => {
    haptic('tap');
    location.hash = hash;
};
// ── المعرض ───────────────────────────────────────────────────────────
function nodeCard(b) {
    const card = document.createElement('article');
    card.className = 'card reveal';
    card.tabIndex = 0;
    card.style.setProperty('--pa', b.palette[0]);
    card.style.setProperty('--pb', b.palette[1]);
    card.innerHTML = trusted(`<div class="card-art">${glyph(b.glyph, b.palette)}</div>` +
        `<div><h3 class="card-name"></h3><p class="card-tag"></p></div>` +
        `<div class="card-actions"><a class="btn primary sm open"></a>` +
        `<a class="btn ghosty sm buy"></a></div>`);
    card.querySelector('.card-name').textContent = bi(lang, b.name);
    card.querySelector('.card-tag').textContent = bi(lang, b.tagline);
    const open = card.querySelector('.open');
    open.textContent = t(lang, 'open');
    open.href = `#/bot/${b.sku}`;
    const buy = card.querySelector('.buy');
    buy.textContent = t(lang, 'buy');
    buy.href = `${CONFIG.shop}/${b.sku}`;
    buy.target = '_blank';
    buy.rel = 'noopener';
    buy.addEventListener('click', (e) => {
        e.preventDefault();
        haptic('tap');
        openExternal(`${CONFIG.shop}/${b.sku}`);
    });
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')
            go(`#/bot/${b.sku}`);
    });
    return card;
}
function viewGallery() {
    const grid = el('grid');
    grid.textContent = '';
    const frag = document.createDocumentFragment();
    BOTS.forEach((b) => frag.appendChild(nodeCard(b)));
    grid.appendChild(frag);
}
// ── واجهة البوت: محادثة + لوحة ───────────────────────────────────────
function bubble(node) {
    const wrap = document.createElement('div');
    wrap.className = `msg ${node.from}`;
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = node.text;
    wrap.appendChild(b);
    if (node.chip) {
        const chip = document.createElement('span');
        chip.className = 'chip-attach';
        chip.textContent = node.chip;
        wrap.appendChild(chip);
    }
    return wrap;
}
async function runChat(bot) {
    const token = ++chatToken;
    const box = el('chat');
    box.textContent = '';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
    const endChat = () => {
        const again = document.createElement('button');
        again.type = 'button';
        again.className = 'link-btn restart';
        again.textContent = t(lang, 'restart');
        again.addEventListener('click', () => void runChat(bot));
        box.appendChild(again);
        box.scrollTop = box.scrollHeight;
    };
    const renderReplies = (b, replies) => {
        const row = document.createElement('div');
        row.className = 'replies';
        replies.forEach((r) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'reply';
            btn.textContent = bi(lang, r.label);
            btn.addEventListener('click', () => {
                haptic('tap');
                row.remove();
                box.appendChild(bubble({ from: 'user', text: bi(lang, r.label) }));
                box.scrollTop = box.scrollHeight;
                void pushBot(r.to);
            });
            row.appendChild(btn);
        });
        box.appendChild(row);
        box.scrollTop = box.scrollHeight;
    };
    async function pushBot(i) {
        if (token !== chatToken)
            return;
        const node = bot.chat[i];
        if (!node) {
            endChat();
            return;
        }
        if (node.from === 'bot') {
            const typing = document.createElement('div');
            typing.className = 'msg bot';
            const tb = document.createElement('div');
            tb.className = 'bubble typing';
            tb.textContent = t(lang, 'botSpeaking');
            typing.appendChild(tb);
            box.appendChild(typing);
            await wait(620);
            if (token !== chatToken)
                return;
            typing.remove();
        }
        box.appendChild(bubble({
            from: node.from,
            text: bi(lang, node.text),
            chip: node.chip ? bi(lang, node.chip) : undefined,
        }));
        box.scrollTop = box.scrollHeight;
        if (node.replies?.length) {
            renderReplies(bot, node.replies);
            return;
        }
        await wait(520);
        if (token !== chatToken)
            return;
        await pushBot(i + 1);
    }
    await pushBot(0);
}
function toggleRow(label, on, onChange) {
    const row = document.createElement('div');
    row.className = 'toggle';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `switch${on ? ' on' : ''}`;
    btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-checked', String(on));
    const knob = document.createElement('span');
    knob.className = 'knob';
    btn.appendChild(knob);
    const txt = document.createElement('span');
    txt.className = 'toggle-label';
    txt.textContent = label;
    row.append(btn, txt);
    btn.addEventListener('click', () => {
        const next = !btn.classList.contains('on');
        btn.classList.toggle('on', next);
        btn.setAttribute('aria-checked', String(next));
        haptic('toggle');
        onChange();
    });
    return row;
}
function viewBot(sku) {
    const bot = botBySku(sku);
    if (!bot) {
        location.hash = '#/';
        return;
    }
    el('view-title').textContent = bi(lang, bot.name);
    el('view-sub').textContent = bi(lang, bot.tagline);
    // رأس البوت: أيقونة بلونيه
    const avatar = el('bot-avatar');
    avatar.textContent = '';
    avatar.innerHTML = trusted(glyph(bot.glyph, bot.palette));
    avatar.style.setProperty('--pa', bot.palette[0]);
    avatar.style.setProperty('--pb', bot.palette[1]);
    // الشراء: داخل تيليجرام الزر الرئيسي، وخارجه رابط للمتجر
    const buyUrl = `${CONFIG.shop}/${bot.sku}`;
    const openBuy = () => {
        haptic('tap');
        openExternal(buyUrl);
    };
    if (buyHandler)
        hideMainButton();
    buyHandler = openBuy;
    if (inTelegram())
        mainButton(t(lang, 'buyBtn'), openBuy);
    const buy = el('bot-buy');
    buy.hidden = inTelegram();
    buy.textContent = t(lang, 'buyBtn');
    buy.href = buyUrl;
    buy.style.setProperty('--pa', bot.palette[0]);
    buy.style.setProperty('--pb', bot.palette[1]);
    buy.onclick = (e) => {
        e.preventDefault();
        openBuy();
    };
    const phoneWrap = el('phone-wrap');
    phoneWrap.textContent = '';
    phoneWrap.innerHTML = trusted(phoneFrame(bot.palette, t(lang, 'phone')));
    void runChat(bot);
    const panel = el('bot-panel');
    panel.textContent = '';
    panel.style.setProperty('--pa', bot.palette[0]);
    panel.style.setProperty('--pb', bot.palette[1]);
    panel.innerHTML = trusted(`<div class="panel-head"><div><h2 class="panel-name"></h2><p class="panel-sub"></p></div>${wave(bot.palette[1])}</div>`);
    panel.querySelector('.panel-name').textContent = bi(lang, bot.panelTitle);
    panel.querySelector('.panel-sub').textContent = t(lang, 'panelHint');
    const kpis = document.createElement('div');
    kpis.className = 'kpis';
    for (const k of bot.kpis) {
        const card = document.createElement('div');
        card.className = 'kpi';
        const v = document.createElement('b');
        v.className = 'kpi-v';
        v.textContent = k.value;
        const l = document.createElement('span');
        l.className = 'kpi-l';
        l.textContent = bi(lang, k.label);
        card.append(v, l);
        kpis.appendChild(card);
    }
    panel.appendChild(kpis);
    const table = document.createElement('table');
    table.className = 'tbl';
    const thead = document.createElement('thead');
    const htr = document.createElement('tr');
    for (const h of bot.tableHead) {
        const th = document.createElement('th');
        th.textContent = bi(lang, h);
        htr.appendChild(th);
    }
    thead.appendChild(htr);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (const r of bot.rows) {
        const tr = document.createElement('tr');
        if (r.tone)
            tr.className = `tone-${r.tone}`;
        r.cells.forEach((c) => {
            const td = document.createElement('td');
            td.textContent = c;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    panel.appendChild(table);
    const toggles = document.createElement('div');
    toggles.className = 'toggles';
    for (const tg of bot.toggles)
        toggles.appendChild(toggleRow(bi(lang, tg.label), tg.on, () => toast(tg.on ? t(lang, 'toastOn') : t(lang, 'toastOff'))));
    panel.appendChild(toggles);
}
// ── لوحة التحكم الموحّدة ─────────────────────────────────────────────
const consoleState = new Map(BOTS.map((b) => [b.sku, b.sku !== 'group-bot']));
const rules = ['عميل جديد → Sheets', 'طلب جديد → Slack', 'انتهاء اشتراك → بريد'];
function viewPanel() {
    const root = el('panel-root');
    root.textContent = '';
    root.innerHTML = trusted(`<div class="console">
      <div class="console-head"><div><h2 class="console-title"></h2><p class="console-sub"></p></div>
        <a class="btn ghosty sm" href="${CONFIG.shop}" target="_blank" rel="noopener" data-i18n="siteLink">زيارة المتجر</a></div>
      <div class="kpis big" id="c-kpis"></div>
      <section class="block"><h3 class="block-t" id="c-bots-t"></h3>
        <table class="tbl" id="c-bots"></table></section>
      <div class="grid2">
        <section class="block"><h3 class="block-t" id="c-orders-t"></h3>
          <table class="tbl" id="c-orders"></table></section>
        <section class="block"><h3 class="block-t" id="c-auto-t"></h3>
          <p class="hint" id="c-auto-hint"></p>
          <form class="rule-form" id="c-rule">
            <input type="text" id="c-rule-input" data-i18n-ph="autoPlaceholder" />
            <button class="btn primary sm" type="submit" id="c-rule-add"></button>
          </form>
          <ul class="rules" id="c-rules"></ul></section>
      </div>
    </div>`);
    root.querySelector('.console-title').textContent = t(lang, 'consoleTitle');
    root.querySelector('.console-sub').textContent = t(lang, 'consoleSub');
    root.querySelector('#c-bots-t').textContent = t(lang, 'botsTitle');
    root.querySelector('#c-orders-t').textContent = t(lang, 'ordersTitle');
    root.querySelector('#c-auto-t').textContent = t(lang, 'autoTitle');
    root.querySelector('#c-auto-hint').textContent = t(lang, 'autoHint');
    root.querySelector('#c-rule-add').textContent = t(lang, 'autoAdd');
    root.querySelectorAll('[data-i18n]').forEach((n) => {
        const key = n.dataset['i18n'];
        if (key)
            n.textContent = I18N[lang][key] ?? '';
    });
    const kpis = root.querySelector('#c-kpis');
    const active = [...consoleState.values()].filter(Boolean).length;
    const cards = [
        [String(active), t(lang, 'k1')],
        ['142', t(lang, 'k2')],
        ['3,918', t(lang, 'k3')],
        ['96,240', t(lang, 'k4')],
    ];
    for (const [v, l] of cards) {
        const c = document.createElement('div');
        c.className = 'kpi big';
        const b = document.createElement('b');
        b.className = 'kpi-v';
        b.textContent = v;
        const s = document.createElement('span');
        s.className = 'kpi-l';
        s.textContent = l;
        c.append(b, s);
        kpis.appendChild(c);
    }
    const bt = root.querySelector('#c-bots');
    const bhead = document.createElement('thead');
    const btr = document.createElement('tr');
    for (const h of [t(lang, 'thBot'), t(lang, 'thStatus'), t(lang, 'thOrders'), t(lang, 'thAction')]) {
        const th = document.createElement('th');
        th.textContent = h;
        btr.appendChild(th);
    }
    bhead.appendChild(btr);
    bt.appendChild(bhead);
    const bbody = document.createElement('tbody');
    const orders = [37, 58, 14, 9, 4, 12, 31];
    BOTS.forEach((b, i) => {
        const tr = document.createElement('tr');
        const nameTd = document.createElement('td');
        nameTd.innerHTML = trusted(`<span class="cell-bot">${glyph(b.glyph, b.palette)}<b></b></span>`);
        nameTd.querySelector('b').textContent = bi(lang, b.name);
        tr.appendChild(nameTd);
        const stTd = document.createElement('td');
        const on = consoleState.get(b.sku) === true;
        stTd.innerHTML = trusted(`<span class="pill ${on ? 'ok' : 'off'}"><i></i><span class="st"></span></span>`);
        stTd.querySelector('.st').textContent = on ? t(lang, 'running') : t(lang, 'paused');
        tr.appendChild(stTd);
        const oTd = document.createElement('td');
        oTd.textContent = String(orders[i % orders.length] ?? 0);
        tr.appendChild(oTd);
        const aTd = document.createElement('td');
        const wrap = document.createElement('div');
        wrap.className = 'acts';
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'btn ghosty sm';
        toggle.textContent = on ? t(lang, 'pause') : t(lang, 'resume');
        toggle.addEventListener('click', () => {
            const next = consoleState.get(b.sku) !== true;
            consoleState.set(b.sku, next);
            haptic('toggle');
            toast(next ? t(lang, 'toastResumed') : t(lang, 'toastPaused'));
            viewPanel();
        });
        const backup = document.createElement('button');
        backup.type = 'button';
        backup.className = 'btn ghosty sm';
        backup.textContent = t(lang, 'backup');
        backup.addEventListener('click', () => {
            haptic('done');
            toast(t(lang, 'toastBackup'));
        });
        wrap.append(toggle, backup);
        aTd.appendChild(wrap);
        tr.appendChild(aTd);
        bbody.appendChild(tr);
    });
    bt.appendChild(bbody);
    const ot = root.querySelector('#c-orders');
    const ohead = document.createElement('thead');
    const otr = document.createElement('tr');
    for (const h of [t(lang, 'thOrder'), t(lang, 'thBuyer'), t(lang, 'thState')]) {
        const th = document.createElement('th');
        th.textContent = h;
        otr.appendChild(th);
    }
    ohead.appendChild(otr);
    ot.appendChild(ohead);
    const obody = document.createElement('tbody');
    const orderRows = [
        ['دورة التصميم', '@sara_d', 'ok'],
        ['قالب متجر', '@omar_k', 'warn'],
        ['بوت دعم', '@noor.a', 'ok'],
        ['50 صورة', '@fahd_1', 'off'],
    ];
    for (const [prod, buyer, tone] of orderRows) {
        const tr = document.createElement('tr');
        tr.className = `tone-${tone}`;
        for (const c of [prod, buyer]) {
            const td = document.createElement('td');
            td.textContent = c;
            tr.appendChild(td);
        }
        const td = document.createElement('td');
        td.textContent = tone === 'ok' ? t(lang, 'running') : tone === 'warn' ? '…' : t(lang, 'paused');
        tr.appendChild(td);
        obody.appendChild(tr);
    }
    ot.appendChild(obody);
    const list = root.querySelector('#c-rules');
    const paintRules = () => {
        list.textContent = '';
        for (const r of rules) {
            const li = document.createElement('li');
            li.textContent = r;
            list.appendChild(li);
        }
    };
    paintRules();
    root.querySelector('#c-rule').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = root.querySelector('#c-rule-input');
        const v = input.value.trim();
        if (!v)
            return;
        rules.unshift(v);
        input.value = '';
        paintRules();
        haptic('done');
        toast(t(lang, 'toastRule'));
    });
}
// ── إشعار ────────────────────────────────────────────────────────────
let toastTimer = 0;
function toast(msg) {
    const n = el('toast');
    n.textContent = msg;
    n.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        n.hidden = true;
    }, 2400);
}
// ── عدّادات ──────────────────────────────────────────────────────────
function animateStats() {
    const nums = document.querySelectorAll('[data-count]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nums.forEach((n) => {
        const target = Number(n.dataset['count'] ?? 0);
        if (reduce) {
            n.textContent = target.toLocaleString('en-US');
            return;
        }
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
    }, { rootMargin: '-30px' });
    nodes.forEach((n) => io.observe(n));
}
// ── التشغيل ──────────────────────────────────────────────────────────
function paintRunState() {
    const chip = el('run-state');
    chip.querySelector('span').textContent = t(lang, inTelegram() ? 'inTelegram' : 'inBrowser');
}
function render() {
    const r = route();
    el('gallery-view').hidden = r.view !== 'gallery';
    el('bot-view').hidden = r.view !== 'bot';
    el('panel-view').hidden = r.view !== 'panel';
    document.querySelectorAll('[data-nav]').forEach((n) => {
        const active = (n.dataset['nav'] === 'panel' && r.view === 'panel') || (n.dataset['nav'] === 'gallery' && r.view !== 'panel');
        n.classList.toggle('on', active);
    });
    // زر الرجوع الأصلي يظهر في عرض البوت داخل تيليجرام فقط
    backButton(r.view === 'bot', () => go('#/'));
    if (r.view !== 'bot' && buyHandler) {
        hideMainButton();
        buyHandler = null;
    }
    if (r.view === 'gallery') {
        viewGallery();
        el('gallery-title').textContent = t(lang, 'galleryTitle');
        el('gallery-sub').textContent = t(lang, 'gallerySub');
    }
    if (r.view === 'bot')
        viewBot(r.sku);
    if (r.view === 'panel')
        viewPanel();
    observeReveals();
}
function boot() {
    applyTheme(currentTheme());
    telegramReady();
    // داخل تيليجرام: ارتفاع النافذة الفعلي يمنع الشريط السفلي من تغطية المحتوى
    const vh = viewportHeight();
    if (vh)
        document.documentElement.style.setProperty('--tg-viewport-h', `${vh}px`);
    el('year').textContent = String(new Date().getFullYear());
    el('lang').addEventListener('click', () => {
        lang = lang === 'ar' ? 'en' : 'ar';
        writeLang();
        haptic('toggle');
        applyI18n();
        render();
    });
    el('theme').addEventListener('click', () => {
        toggleTheme();
        paintThemeButton();
        render();
    });
    el('tab-home').addEventListener('click', () => go('#/'));
    el('tab-panel').addEventListener('click', () => go('#/panel'));
    window.addEventListener('hashchange', render);
    followTelegramTheme(() => {
        paintThemeButton();
        render();
    });
    paintRunState();
    applyI18n();
    render();
    animateStats();
}
boot();
