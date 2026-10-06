/* ZeidexSoft storefront runtime — the Telegram Mini App at /store/.
 *
 * This file was referenced by index.html and never existed: the Mini App
 * rendered its four skeleton cards forever, and the theme toggle, the search
 * box, the category filters and the product sheet were all dead controls.
 * Everything below is what those controls were waiting for.
 *
 * Four rules, in order of how often they bite:
 *
 *   1. Theme is resolved before first paint by the inline script in index.html,
 *      and this file only re-applies it. A Mini App that flashes white before
 *      going dark reads as a broken page, not as a dark theme.
 *   2. Inside Telegram the palette is the client's, not ours: themeParams wins
 *      and the theme button is hidden by CSS. Outside, we own the choice and
 *      it follows prefers-color-scheme until the visitor overrides it.
 *   3. Search folds Arabic the same way worker/bots.ts folds it, so a word
 *      that finds a product in the bot finds it here too.
 *   4. No innerHTML with catalogue text anywhere. Nodes are built, so a
 *      description containing markup renders as text.
 */
(function () {
  'use strict'

  var tg = window.Telegram && window.Telegram.WebApp
  var inTg = !!(tg && tg.initData)

  /* ---------------------------------------------------------------- *
   * Tiny helpers
   * ---------------------------------------------------------------- */

  function $(sel) {
    return document.querySelector(sel)
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag)
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') n.className = attrs[k]
        else if (k === 'text') n.textContent = attrs[k]
        else if (k === 'html') n.innerHTML = attrs[k] // only ever called with our own SVG strings
        else if (attrs[k] != null) n.setAttribute(k, attrs[k])
      }
    }
    ;(kids || []).forEach(function (c) {
      if (c) n.appendChild(c)
    })
    return n
  }
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key)
      localStorage.setItem(key, value)
    } catch (e) {
      /* private mode: the choice just will not survive a reload */
    }
    return null
  }
  function haptic(kind) {
    try {
      if (inTg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(kind || 'light')
    } catch (e) {
      /* older clients without haptics */
    }
  }

  /* ---------------------------------------------------------------- *
   * Theme — the day/night switch
   *
   * Three sources, in this order:
   *   Telegram's colour scheme → the OS preference → whatever the visitor
   *   last chose here. The first two are "follow the system" and are
   *   re-evaluated whenever the OS flips, which is what makes the toggle
   *   mean something on a device that changes theme at sunset.
   * ---------------------------------------------------------------- */

  var THEME_KEY = 'zeidex-store-theme' // 'light' | 'dark' | null (follow system)
  var root = document.documentElement

  if (inTg) {
    root.setAttribute('data-tg', '')
    // Telegram owns the palette, but our brand surfaces (the hero gradient,
    // the price pill) still need to know which way to render.
    root.setAttribute('data-theme', tg.colorScheme === 'light' ? 'light' : 'dark')
  }

  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

  function systemTheme() {
    return mq && mq.matches ? 'dark' : 'light'
  }

  function applyTheme() {
    if (inTg) {
      // A theme change inside the client changes themeParams; re-read them.
      try {
        tg.ready()
        tg.onEvent('themeChanged', function () {
          root.setAttribute('data-theme', tg.colorScheme === 'light' ? 'light' : 'dark')
        })
      } catch (e) {
        /* ignore */
      }
      return
    }
    var forced = store(THEME_KEY)
    root.setAttribute('data-theme', forced === 'dark' || forced === 'light' ? forced : systemTheme())
    var btn = $('#theme')
    if (btn) {
      var dark = root.getAttribute('data-theme') === 'dark'
      btn.setAttribute('aria-label', dark ? 'الوضع النهاري' : 'الوضع الليلي')
      btn.setAttribute('aria-pressed', String(dark))
    }
  }

  function toggleTheme() {
    var dark = root.getAttribute('data-theme') === 'dark'
    store(THEME_KEY, dark ? 'light' : 'dark')
    applyTheme()
    haptic('light')
    // Report it the way the site does — a toast, because the icon swaps.
    say(dark ? '☀️ نهاري' : '🌙 ليلي')
  }

  /* ---------------------------------------------------------------- *
   * Language
   * ---------------------------------------------------------------- */

  var LANG_KEY = 'zeidex-store-lang'
  var lang = store(LANG_KEY) === 'en' ? 'en' : 'ar'

  var I18N = {
    brand: ['متجر ZeidexSoft', 'ZeidexSoft Store'],
    brandSub: ['منتجات رقمية · دفع بالنجوم', 'Digital goods · paid in Stars'],
    heroPill: ['Telegram Stars', 'Telegram Stars'],
    heroTitle: ['بوت متجرك الرقمي على تيليجرام', 'Your own digital store on Telegram'],
    heroText: [
      'بِع منتجاتك الرقمية بنجوم تيليجرام دون بطاقة أو بوابة دفع. هذا المتجر نفسه مثال حي على الباقة الاحترافية.',
      'Sell digital goods with Telegram Stars — no card, no payment gateway. This store is a live sample of the Pro plan.',
    ],
    trust1: ['دفع رسمي من تيليجرام', 'Official in-app payment'],
    trust2: ['تسليم فوري للإيصال', 'Instant delivery'],
    trust3: ['دعم بشري', 'Human support'],
    searchPh: ['ابحث في المنتجات…', 'Search the products…'],
    products: ['المنتجات', 'Products'],
    noResults: ['لا نتائج — جرّب كلمة أخرى.', 'No results — try another word.'],
    addHome: ['أضف المتجر إلى الشاشة الرئيسية', 'Add the store to your home screen'],
    outside: ['تتصفح من المتصفح — الشراء يفتح البوت في تيليجرام.', 'You are in a browser — buying opens the bot in Telegram.'],
    price: ['السعر', 'Price'],
    billing: ['الدفع', 'Billing'],
    tryBot: ['جرّب البوت', 'Try the bot'],
    getStars: ['شراء نجوم', 'Buy Stars'],
    close: ['إغلاق', 'Close'],
    done: ['تم ✓', 'Done ✓'],
    buyNow: ['اطلب الآن', 'Order now'],
    mostPopular: ['الأكثر طلباً', 'Most popular'],
    freeTry: ['جرّبه مجاناً', 'Try it free'],
    oneTime: ['مرة واحدة', 'One-time'],
    monthly: ['كل 30 يوماً', 'Every 30 days'],
    stars: ['نجمة', 'Stars'],
    or: ['أو', 'or'],
    loading: ['جارٍ التحميل…', 'Loading…'],
    failed: ['تعذّر تحميل المنتجات.', 'Could not load the products.'],
    count: ['منتج', 'products'],
    demo: ['جرّبه مجاناً', 'Try it free'],
  }

  var CATEGORY = {
    bots: ['باقات البوت', 'Bot packages'],
    types: ['بوت لكل نشاط', 'A bot for every business'],
    channel: ['خدمات', 'Services'],
    all: ['الكل', 'All'],
  }

  function t(key) {
    var pair = I18N[key]
    if (!pair) return key
    return lang === 'en' ? pair[1] : pair[0]
  }

  function applyLang() {
    root.lang = lang
    root.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      var v = t(n.getAttribute('data-i18n'))
      if (v) n.textContent = v
    })
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (n) {
      var v = t(n.getAttribute('data-i18n-placeholder'))
      if (v) n.setAttribute('placeholder', v)
    })
    var lb = $('#lang')
    if (lb) lb.textContent = lang === 'ar' ? 'EN' : 'ع'
    var s = $('#search')
    if (s) s.setAttribute('aria-label', t('searchPh'))
    render()
  }

  /* ---------------------------------------------------------------- *
   * Search — Arabic folding, identical to worker/bots.ts
   *
   * A buyer types "الدفع" and the product says "الدَّفع". Without the fold
   * that product is invisible, and the search box becomes the most expensive
   * dead control on the page.
   * ---------------------------------------------------------------- */

  function norm(input) {
    return String(input || '')
      .toLowerCase()
      .replace(/[ً-ْٰـ]/g, '') // harakat, superscript alef, tatweel
      .replace(/[٠-٩]/g, function (d) {
        return String(d.charCodeAt(0) - 0x660)
      })
      .replace(/[۰-۹]/g, function (d) {
        return String(d.charCodeAt(0) - 0x6f0)
      })
      .replace(/[آأإٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
  }

  function matches(p, words, whole) {
    var hay = norm(
      (lang === 'en' ? p.title_en : p.title) +
        ' ' +
        (lang === 'en' ? p.description_en : p.description) +
        ' ' +
        p.sku,
    )
    if (!words.length) return true
    if (whole && hay.indexOf(whole) > -1) return true
    return words.some(function (w) {
      return hay.indexOf(w) > -1
    })
  }

  /* ---------------------------------------------------------------- *
   * Artwork
   *
   * A stable hue pair per SKU. Not random: the same product must look the
   * same on every load, or the grid reshuffles its colours under the
   * reader and the "featured" card stops being recognisable.
   * ---------------------------------------------------------------- */

  function hues(sku) {
    var h = 0
    for (var i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) % 360
    return [h, (h + 42) % 360]
  }

  function art(product, big) {
    var hv = hues(product.sku)
    var box = el('div', { class: 'art' })
    box.style.setProperty('--a', 'hsl(' + hv[0] + ' 62% 46%)')
    box.style.setProperty('--b', 'hsl(' + hv[1] + ' 64% 36%)')
    if (product.image) {
      var img = el('img', {
        src: product.image,
        alt: '',
        width: big ? 104 : 76,
        height: big ? 104 : 76,
        loading: 'lazy',
        decoding: 'async',
      })
      box.appendChild(img)
    } else {
      box.appendChild(
        el('div', {
          class: 'star',
          html: '<svg viewBox="0 0 24 24" width="46" height="46" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z"/></svg>',
        }),
      )
    }
    return box
  }

  /* ---------------------------------------------------------------- *
   * Cards
   * ---------------------------------------------------------------- */

  function card(product, i) {
    var title = lang === 'en' ? product.title_en : product.title
    var desc = lang === 'en' ? product.description_en : product.description

    var node = el(
      'article',
      {
        class: 'card' + (product.featured ? ' featured' : ''),
        tabindex: '0',
        role: 'button',
        'aria-label': title,
        'data-sku': product.sku,
      },
      [],
    )
    node.style.setProperty('--i', String(i))

    if (product.featured) node.appendChild(el('span', { class: 'badge', text: t('mostPopular') }))

    var head = el('div', {}, [art(product)])
    if (product.monthly) head.appendChild(el('span', { class: 'per', text: t('monthly') }))

    var price = el('span', { class: 'price' })
    price.appendChild(
      el('span', {
        class: 'star',
        html: '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z"/></svg>',
      }),
    )
    price.appendChild(el('span', { text: Number(product.stars).toLocaleString('en-US') }))

    var go = el('span', { class: 'go' }, [])
    go.appendChild(el('span', { text: t('buyNow') }))
    go.appendChild(
      el('span', {
        class: 'arrow-nudge',
        html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block"><path d="M19 12H5m6-6-6 6 6 6"/></svg>',
      }),
    )

    node.appendChild(head)
    node.appendChild(
      el('div', { class: 'body' }, [
        el('h3', { text: title }),
        el('p', { text: desc }),
        el('div', { class: 'row' }, [price, go]),
      ]),
    )

    function open() {
      haptic('light')
      openSheet(product)
    }
    node.addEventListener('click', open)
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        open()
      }
    })
    return node
  }

    // A small, deliberate test surface. norm() is the one piece of this file
  // whose rules cannot be checked through the UI — see the comment above it —
  // and scripts/test-store-app.mjs asserts them directly. Exposing it costs
  // nothing: the page holds no secrets, and the alternative is a second copy
  // of the fold in the test that can silently drift from this one.
  window.__store = { norm: norm, matches: matches }

  /* ---------------------------------------------------------------- *
   * Render
   * ---------------------------------------------------------------- */

  var catalog = null
  var filter = 'all'
  var query = ''

  function visible() {
    if (!catalog) return []
    var whole = norm(query)
    var words = whole ? whole.split(' ').filter(Boolean) : []
    return catalog.products.filter(function (p) {
      if (filter !== 'all' && p.category !== filter) return false
      return matches(p, words, whole)
    })
  }

  function render() {
    var grid = $('#grid')
    if (!grid || !catalog) return

    var list = visible()
    grid.textContent = ''

    list.forEach(function (p, i) {
      grid.appendChild(card(p, i))
    })

    var count = $('#count')
    if (count) count.textContent = list.length + ' ' + t('count')

    var empty = $('#empty')
    if (empty) empty.hidden = list.length > 0

    // A miss shakes the search field rather than only swapping the grid for
    // a line of text. The empty grid reads as "the app broke"; the shake
    // reads as "that word matched nothing", which is what happened.
    if (query && !list.length) restart(grid, 'shake')
  }

  /** Replay a one-shot animation class that may already be on the element. */
  function restart(node, cls) {
    if (!node) return
    node.classList.remove(cls)
    void node.offsetWidth
    node.classList.add(cls)
  }

  function renderFilters() {
    var box = $('#filters')
    if (!box || !catalog) return
    var seen = {}
    catalog.products.forEach(function (p) {
      seen[p.category] = (seen[p.category] || 0) + 1
    })
    var keys = ['all'].concat(Object.keys(seen))
    if (keys.length < 2) {
      box.hidden = true
      return
    }
    box.hidden = false
    box.textContent = ''

    keys.forEach(function (k) {
      var label = (CATEGORY[k] || [k, k])[lang === 'en' ? 1 : 0]
      var b = el('button', {
        type: 'button',
        role: 'tab',
        text: label + (seen[k] ? ' · ' + seen[k] : ''),
        'aria-selected': String(filter === k),
      })
      b.addEventListener('click', function () {
        filter = k
        haptic('light')
        renderFilters()
        render()
      })
      box.appendChild(b)
    })
  }

  function renderFeature(catalog) {
    var btn = $('#feature')
    if (!btn) return
    var p = catalog.products.filter(function (x) {
      return x.featured
    })[0]
    if (!p) {
      btn.hidden = true
      return
    }
    btn.hidden = false
    btn.textContent = ''
    var hv = hues(p.sku)

    var left = el('span', {}, [])
    if (p.image) left.appendChild(el('img', { src: p.image, alt: '', width: 56, height: 56 }))
    else left.appendChild(el('span', { class: 'star', text: '⭐️', style: 'font-size:26px' }))

    btn.appendChild(left)
    btn.appendChild(
      el('span', {}, [
        el('b', { text: lang === 'en' ? p.title_en : p.title }),
        el('small', { text: Number(p.stars).toLocaleString('en-US') + ' ⭐️ · ' + t('mostPopular') }),
      ]),
    )
    btn.appendChild(el('span', { class: 'go-pill', text: t('buyNow') }))
    btn.style.setProperty('--a', 'hsl(' + hv[0] + ' 62% 46%)')
    btn.addEventListener('click', function () {
      haptic('light')
      openSheet(p)
    })
  }

  /* ---------------------------------------------------------------- *
   * Product sheet
   * ---------------------------------------------------------------- */

  var sheetProduct = null
  var okTimer = null

  function openSheet(p) {
    sheetProduct = p
    var sheet = $('#sheet')
    if (!sheet) return

    var title = lang === 'en' ? p.title_en : p.title
    var desc = lang === 'en' ? p.description_en : p.description

    var g = $('#sheet-gallery')
    g.textContent = ''
    g.appendChild(el('div', { class: 'tile' }, [art(p, true)]))
    if (p.category === 'bots') {
      var shot = el('img', { class: 'shot', src: '/store/img/storefront-ar.webp', alt: '', width: 180, height: 400, loading: 'lazy' })
      g.appendChild(shot)
    }

    $('#sheet-title').textContent = title
    $('#sheet-desc').textContent = desc

    var fl = $('#sheet-features')
    fl.textContent = ''
    var feats = (lang === 'en' ? p.features_en : p.features) || []
    feats.forEach(function (f) {
      fl.appendChild(
        el('li', {}, [
          el('span', {
            html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.5 4.5 4.5L19.5 6.5"/></svg>',
          }),
          el('span', { text: f }),
        ]),
      )
    })

    $('#sheet-price').textContent = Number(p.stars).toLocaleString('en-US') + ' ⭐️' + (p.usd ? ' · $' + p.usd : '')
    $('#sheet-billing').textContent = p.monthly ? t('monthly') : t('oneTime')

    var bot = catalog ? catalog.bot : ''
    var buy = $('#sheet-buy')
    // Reset the acknowledged state: re-opening a product you just tapped
    // must show a fresh button, not the green check from last time.
    clearTimeout(okTimer)
    buy.classList.remove('ok')
    buy.textContent = t('buyNow')
    buy.onclick = function () {
      haptic('medium')
      buyLink(p)
    }
    var demo = $('#sheet-demo')
    if (p.demo) {
      demo.hidden = false
      demo.textContent = t('freeTry')
      demo.href = 'https://t.me/' + bot + '?start=demo_' + encodeURIComponent(p.demo)
    } else demo.hidden = true

    $('#sheet-try').href = 'https://t.me/' + bot
    $('#sheet-stars').href = 'https://t.me/' + bot + '?start=buystars'

    sheet.hidden = false
    $('#backdrop').hidden = false
    sheet.classList.remove('shake')
    void sheet.offsetWidth

    // Inside Telegram the in-page buttons are hidden by CSS, so the buy
    // action has to move to the client's own MainButton or the sheet has
    // no way to be bought from.
    if (inTg) {
      try {
        tg.MainButton.setText(t('buyNow') + ' · ' + Number(p.stars).toLocaleString('en-US') + ' ⭐️')
        tg.MainButton.show()
        tg.MainButton.offClick(handlerMain)
        tg.MainButton.onClick(handlerMain)
      } catch (e) {
        /* ignore */
      }
    }
  }

  function handlerMain() {
    if (sheetProduct) {
      haptic('medium')
      buyLink(sheetProduct)
    }
  }

  function closeSheet() {
    var sheet = $('#sheet')
    if (!sheet || sheet.hidden) return
    sheet.hidden = true
    $('#backdrop').hidden = true
    sheetProduct = null
    if (inTg) {
      try {
        tg.MainButton.hide()
        tg.MainButton.offClick(handlerMain)
      } catch (e) {
        /* ignore */
      }
    }
  }

  function buyLink(p) {
    // Acknowledge the tap where the eye already is: the button turns green
    // with a drawn check for a beat before Telegram takes over. Opening the
    // client on a slow connection otherwise leaves the button looking idle,
    // which is exactly when people tap it twice.
    var buy = $('#sheet-buy')
    if (buy) {
      buy.classList.remove('ok')
      buy.textContent = t('done')
      // The check is injected as markup rather than textContent because it
      // has to carry the .check-path class that draws its stroke.
      var mark = document.createElement('span')
      mark.className = 'pop-check'
      mark.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">' +
        '<path class="check-path" d="m4.5 12.5 4.5 4.5L19.5 6.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      buy.insertBefore(mark, buy.firstChild)
      buy.classList.add('ok')
      clearTimeout(okTimer)
      okTimer = setTimeout(function () {
        buy.classList.remove('ok')
        buy.textContent = ''
        var lbl = document.createElement('span')
        lbl.textContent = t('buyNow')
        buy.appendChild(lbl)
      }, 1700)
    }

    var bot = catalog ? catalog.bot : ''
    var url = 'https://t.me/' + bot + '?start=buy_' + encodeURIComponent(p.sku)
    if (inTg) {
      // Inside the client a plain navigation to t.me would tear the Mini App
      // down; ask Telegram to open it as a link instead.
      try {
        tg.openLink(url)
        return
      } catch (e) {
        /* fall through */
      }
    }
    window.open(url, '_blank', 'noopener')
  }

  /* ---------------------------------------------------------------- *
   * Toast
   * ---------------------------------------------------------------- */

  var toastTimer = null
  function say(msg) {
    var n = $('#toast')
    if (!n) return
    n.textContent = msg
    n.hidden = false
    // Restart the entrance animation by cancelling it inline and reflowing.
    // Toggling the class would be wrong here: `.toast` is also what positions
    // the element, so removing it would drop the toast into the page flow.
    n.style.animation = 'none'
    void n.offsetWidth
    n.style.animation = ''
    clearTimeout(toastTimer)
    toastTimer = setTimeout(function () {
      n.hidden = true
    }, 2200)
  }

  /* ---------------------------------------------------------------- *
   * Wiring
   * ---------------------------------------------------------------- */

  function wire() {
    var themeBtn = $('#theme')
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme)
    if (mq && mq.addEventListener) {
      // Follow the OS while the visitor has not made an explicit choice.
      mq.addEventListener('change', function () {
        if (!inTg && !store(THEME_KEY)) applyTheme()
      })
    }

    var langBtn = $('#lang')
    if (langBtn)
      langBtn.addEventListener('click', function () {
        lang = lang === 'ar' ? 'en' : 'ar'
        store(LANG_KEY, lang)
        haptic('light')
        applyLang()
      })

    var s = $('#search')
    if (s) {
      s.addEventListener('input', function () {
        query = s.value
        render()
      })
    }

    $('#backdrop').addEventListener('click', closeSheet)
    $('#sheet-close').addEventListener('click', closeSheet)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSheet()
    })

    var home = $('#home-add')
    if (home) {
      var supported = inTg && typeof tg.addToHomeScreen === 'function'
      home.hidden = !supported
      if (supported)
        home.addEventListener('click', function () {
          haptic('light')
          tg.addToHomeScreen()
        })
    }

    if (!inTg) {
      var outside = $('#outside')
      if (outside) outside.hidden = false
      var wa = $('#wa')
      if (wa && catalog && catalog.whatsapp) {
        wa.hidden = false
        wa.href = catalog.whatsapp
      }
    }
  }

  /* ---------------------------------------------------------------- *
   * Boot
   * ---------------------------------------------------------------- */

  applyTheme()

  // The Stars pill carries the live dot: inside Telegram the payment rail is
  // genuinely live, and outside it the top-up link is one tap away. Same
  // class the site's LiveDot renders, so both surfaces read the same.
  var pill = document.querySelector('.pill')
  if (pill) {
    var dot = document.createElement('span')
    dot.className = 'live-dot'
    dot.style.color = '#ffd54a'
    dot.setAttribute('aria-hidden', 'true')
    pill.insertBefore(dot, pill.firstChild)
  }

  applyLang()
  wire()

  fetch('/store/catalog.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error(String(r.status))
      return r.json()
    })
    .then(function (data) {
      catalog = data
      var wa = $('#wa')
      if (wa && !inTg && catalog.whatsapp) {
        wa.hidden = false
        wa.href = catalog.whatsapp
      }
      renderFilters()
      renderFeature(catalog)
      render()
      if (inTg) {
        try {
          tg.ready()
          tg.expand()
        } catch (e) {
          /* ignore */
        }
      }
    })
    .catch(function () {
      var grid = $('#grid')
      if (grid) grid.textContent = ''
      var c = $('#count')
      if (c) c.textContent = t('failed')
      var e = $('#empty')
      if (e) e.hidden = false
      say(t('failed'))
    })
})()