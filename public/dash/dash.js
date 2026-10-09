/* ZeidexSoft store-bot dashboard (public/dash/). One page, no framework: a login that
 * eats the /web link's #id=…&k=… fragment, then tabs that render the /api/dash/<id>/state
 * and send the same endpoints the Telegram commands back. The key lives only in
 * sessionStorage; the fragment is wiped from the address bar the moment it is read. */
'use strict'

var state = null // the last /state answer, reused by every tab's render
var session = null // { id, key }

function $(sel, root) { return (root || document).querySelector(sel) }
function el(tag, attrs, kids) {
  var n = document.createElement(tag)
  if (attrs) Object.keys(attrs).forEach(function (k) {
    if (k === 'text') n.textContent = attrs[k]
    else if (k === 'html') n.innerHTML = attrs[k]
    else if (k === 'on') Object.keys(attrs[k]).forEach(function (ev) { n.addEventListener(ev, attrs[k][ev]) })
    else n.setAttribute(k, attrs[k])
  })
  ;(kids || []).forEach(function (c) { n.appendChild(c) })
  return n
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

var toastTimer = null
function toast(msg) {
  var t = $('#toast')
  t.textContent = msg
  t.hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(function () { t.hidden = true }, 2600)
}

/* ── the API ─────────────────────────────────────────────── */
function api(method, action, body) {
  return fetch('/api/dash/' + session.id + '/' + action, {
    method: method,
    headers: { authorization: 'Bearer ' + session.key, 'content-type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  }).then(function (r) {
    if (r.status === 403) { logout(); throw new Error('انتهت صلاحية المفتاح — أرسل /web في البوت لمفتاح جديد.') }
    return r.json().catch(function () { return {} }).then(function (data) {
      if (!r.ok) throw new Error(data && (data.error || data.message) ? (data.error || data.message) : 'تعذر التنفيذ (' + r.status + ')')
      return data
    })
  })
}

function loadState() {
  return api('GET', 'state').then(function (data) {
    state = data
    render()
  })
}

/* ── login ───────────────────────────────────────────────── */
function readFragment() {
  // The /web link puts its key in the fragment: it never reaches a server, and it
  // is wiped the moment it is read so a shared screen or a history entry can't leak it.
  var h = location.hash.replace(/^#/, '')
  if (!h) return false
  var id = null, k = null
  h.split('&').forEach(function (p) {
    var kv = p.split('=')
    if (kv[0] === 'id') id = kv[1]
    if (kv[0] === 'k') k = kv.slice(1).join('=')
  })
  if (id && k) {
    session = { id: id, key: k }
    try { sessionStorage.setItem('zdash', JSON.stringify(session)) } catch (e) {}
    history.replaceState(null, '', '/dash/')
    return true
  }
  return false
}

function login() {
  var id = $('#f-id').value.trim()
  var key = $('#f-key').value.trim()
  var err = $('#f-err')
  if (!/^\d{4,15}$/.test(id) || !key) {
    err.textContent = 'أدخل رقم البوت والمفتاح كما وصلا من الأمر /web.'
    err.hidden = false
    return
  }
  err.hidden = true
  session = { id: id, key: key }
  try { sessionStorage.setItem('zdash', JSON.stringify(session)) } catch (e) {}
  enter()
}

function enter() {
  loadState()
    .then(function () {
      $('#login').hidden = true
      $('#app').hidden = false
    })
    .catch(function (e) {
      session = null
      try { sessionStorage.removeItem('zdash') } catch (e2) {}
      $('#f-err').textContent = e.message
      $('#f-err').hidden = false
    })
}

function logout() {
  session = null
  state = null
  try { sessionStorage.removeItem('zdash') } catch (e) {}
  $('#app').hidden = true
  $('#login').hidden = false
}

/* ── render ──────────────────────────────────────────────── */
function fmt(n) { return Number(n || 0).toLocaleString('en-US') }

function render() {
  if (!state) return
  var b = state.bot
  $('#b-user').textContent = b.username
  var plan = { free: '🎁 مجانية', trial: '🧪 تجربة', paid: '💎 مدفوعة' }[b.plan] || b.plan
  if (b.lapsed) plan += ' — منتهية'
  $('#b-plan').textContent = plan
  var st = $('#b-status')
  st.textContent = b.paused ? '⏸ متوقف' : '▶️ يعمل'
  st.className = 'pill ' + (b.paused ? 'off' : 'ok')
  $('#b-open').onclick = function () { open('https://t.me/' + b.username, '_blank') }

  $('#stats').textContent = ''
  ;[
    ['👥 العملاء', fmt(b.users)],
    ['🧾 الطلبات', fmt(b.orders)],
    ['⭐️ النجوم المكتسبة', fmt(b.stars)],
    ['📦 المنتجات', state.items.length + ' / ' + b.caps.items],
    ['❓ الأسئلة الشائعة', state.faqs.length + ' / ' + b.caps.faqs],
    ['📁 الملفات المخزنة', fmt(state.files.length)],
  ].forEach(function (pair) {
    $('#stats').appendChild(el('div', { class: 'stat' }, [
      el('b', { text: pair[1] }),
      el('span', { text: pair[0] }),
    ]))
  })

  $('#i-count').textContent = '(' + state.items.length + '/' + b.caps.items + ')'
  renderItems()
  $('#q-count').textContent = '(' + state.faqs.length + ')'
  renderFaqs()
  $('#l-count').textContent = '(' + state.files.length + ')'
  renderFiles()
  $('#s-welcome').value = state.bot.welcome
  $('#s-pause').textContent = state.bot.paused ? '▶️ استئناف المتجر' : '⏸ إيقاف المتجر للصيانة'
}

function sectionName(id) {
  var s = state.sections.filter(function (x) { return x.id === id })[0]
  return s ? s.name : ''
}

function renderItems() {
  var box = $('#items')
  box.textContent = ''
  if (!state.items.length) {
    box.appendChild(el('p', { class: 'hint', text: 'لا منتجات بعد — أضف أول منتج بزر «＋ منتج جديد».' }))
    return
  }
  state.items.forEach(function (it) {
    var meta = '⭐️ ' + fmt(it.stars) + ' نجمة' + (it.usd ? ' (~$' + it.usd + ')' : '') +
      (it.section ? ' · 🗂 ' + esc(sectionName(it.section)) : '') +
      (it.sku ? ' · <code>' + esc(it.sku) + '</code>' : '')
    box.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'grow' }, [
        el('div', { class: 'title', html: esc(it.title) + (it.deliver ? ' <span class="tag deliver">⚡️ تسليم تلقائي</span>' : '') }),
        el('div', { class: 'meta', html: meta }),
        it.desc ? el('div', { class: 'desc', text: it.desc }) : null,
        it.features && it.features.length ? el('div', { class: 'desc hint', text: '✦ ' + it.features.join(' · ') }) : null,
      ].filter(Boolean)),
      el('div', { class: 'row' }, [
        el('button', { class: 'ghost', text: '⚡️ التسليم', on: { click: function () { deliverDialog(it) } } }),
        el('button', { class: 'ghost', text: '✏️ تعديل', on: { click: function () { itemDialog(it) } } }),
        el('button', { class: 'ghost danger', text: '🗑 حذف', on: { click: function () { delItem(it) } } }),
      ]),
    ]))
  })
}

function renderFaqs() {
  var box = $('#faqs')
  box.textContent = ''
  if (!state.faqs.length) {
    box.appendChild(el('p', { class: 'hint', text: 'لا أسئلة بعد — أضف أول سؤال.' }))
    return
  }
  state.faqs.forEach(function (f, i) {
    box.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'grow' }, [
        el('div', { class: 'title', text: f.q }),
        el('div', { class: 'desc hint', text: f.a }),
      ]),
      el('button', { class: 'ghost danger', text: '🗑', title: 'حذف السؤال', on: { click: function () {
        api('DELETE', 'faqs/' + i).then(function () { toast('حُذف السؤال'); return loadState() }).catch(fail)
      } } }),
    ]))
  })
}

function renderFiles() {
  var box = $('#files')
  box.textContent = ''
  if (!state.files.length) {
    box.appendChild(el('p', { class: 'hint', text: 'لا ملفات مخزنة — أرسل أي ملف إلى البوت وسيُفهرس هنا.' }))
    return
  }
  state.files.forEach(function (f) {
    var icon = { document: '📄', photo: '🖼', video: '🎬', animation: '🎞', audio: '🎵', voice: '🎙' }[f.type] || '📄'
    box.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'grow' }, [
        el('div', { class: 'title', text: icon + ' ' + f.title }),
        el('div', { class: 'meta', text: '#' + f.id + ' · ' + f.type }),
      ]),
      el('div', { class: 'row' }, [
        el('button', { class: 'ghost', text: '📤 إرسال لعميل', on: { click: function () { sendFileDialog(f) } } }),
        el('button', { class: 'ghost danger', text: '🗑', title: 'حذف الملف', on: { click: function () {
          api('DELETE', 'files/' + f.id).then(function () { toast('حُذف الملف'); return loadState() }).catch(fail)
        } } }),
      ]),
    ]))
  })
}

/* ── dialogs ─────────────────────────────────────────────── */
function fail(e) { toast(e.message || 'خطأ غير متوقع') }

function openDialog(node) {
  var d = $('#dialog')
  d.textContent = ''
  d.appendChild(node)
  $('#backdrop').hidden = false
  d.hidden = false
}
function closeDialog() {
  $('#dialog').hidden = true
  $('#backdrop').hidden = true
}
$('#backdrop').addEventListener('click', closeDialog)

function field(labelText, input) {
  return el('label', { text: labelText }, [input]) // label wraps its input: tap anywhere focuses it
}
function input(attrs) { return el('input', attrs) }
function textArea(attrs) { return el('textarea', attrs) }

// One form for both add and edit: edit is the same form with the values filled in.
function itemDialog(it) {
  var isEdit = !!it
  var title = input({ value: isEdit ? it.title : '', placeholder: 'مثال: دورة تصميم كاملة', dir: 'auto' })
  var stars = input({ value: isEdit ? it.stars : '', placeholder: '150', inputmode: 'numeric', dir: 'ltr' })
  var usd = input({ value: isEdit && it.usd ? it.usd : '', placeholder: 'اختياري — 19.5', inputmode: 'decimal', dir: 'ltr' })
  var desc = textArea({ rows: 3, placeholder: 'وصف المنتج كما يظهر للعميل…' })
  if (isEdit) desc.value = it.desc || ''
  var demo = input({ value: isEdit && it.demo ? it.demo : '', placeholder: 'اختياري — https://…', dir: 'ltr' })
  var feats = textArea({ rows: 3, placeholder: 'ميزة في كل سطر (حتى 8 ميزات) — تظهر في بطاقة المنتج' })
  if (isEdit && it.features) feats.value = it.features.join('\n')
  var after = textArea({ rows: 3, placeholder: 'خطوة بعد الشراء في كل سطر (حتى 6) — اختياري' })
  if (isEdit && it.after) after.value = it.after.join('\n')
  var secSel = el('select', {})
  secSel.appendChild(el('option', { value: '', text: 'بدون قسم' }))
  state.sections.forEach(function (s) {
    var o = el('option', { value: String(s.id), text: s.name })
    if (isEdit && it.section === s.id) o.selected = true
    secSel.appendChild(o)
  })
  // The web store's SKU: the storefront's "اطلب الآن" opens t.me/<bot>?start=buy_<sku>,
  // which lands on this item — so the two stores sell the same record.
  var sku = input({ value: isEdit && it.sku ? it.sku : '', placeholder: 'مثال: aifake-pro', dir: 'ltr' })
  var form = el('div', {}, [
    el('h2', { text: isEdit ? '✏️ تعديل المنتج' : '＋ منتج جديد' }),
    field('اسم المنتج', title),
    field('المعرف (SKU) — يربطه بمتجر الويب', sku),
    field('السعر بالنجوم (⭐️)', stars),
    field('السعر التقريبي بالدولار (اختياري)', usd),
    field('الوصف', desc),
    field('القسم', secSel),
    field('رابط معاينة (اختياري)', demo),
    field('الميزات', feats),
    field('خطوات ما بعد الشراء', after),
    el('div', { class: 'row' }, [
      el('button', { class: 'primary', text: isEdit ? 'حفظ' : 'إضافة المنتج', on: { click: save } }),
      el('button', { class: 'ghost', text: 'إلغاء', on: { click: closeDialog } }),
    ]),
  ])
  function save() {
    var p = {
      title: title.value.trim(),
      sku: sku.value.trim() || (isEdit ? '' : undefined),
      stars: Number(stars.value.trim()),
      // 0 is the API's "clear it": null is ignored by PUT, 0 fails the > 0 test and clears
      usd: usd.value.trim() === '' ? (isEdit ? 0 : undefined) : Number(usd.value.trim()),
      desc: desc.value.trim(),
      section: secSel.value === '' ? (isEdit ? null : undefined) : Number(secSel.value),
      demo: demo.value.trim() || (isEdit ? '' : undefined),
      features: feats.value.trim()
        ? feats.value.trim().split('\n').map(function (s) { return s.trim() }).filter(Boolean)
        : (isEdit ? [] : undefined),
      after: after.value.trim()
        ? after.value.trim().split('\n').map(function (s) { return s.trim() }).filter(Boolean)
        : (isEdit ? [] : undefined),
    }
    if (!p.title || !Number.isInteger(p.stars) || p.stars < 1) return toast('الاسم وسعر النجوم مطلوبان')
    // edit sends only what it means to change; add sends the whole item
    if (isEdit) Object.keys(p).forEach(function (k) { if (p[k] === undefined) delete p[k] })
    api(isEdit ? 'PUT' : 'POST', isEdit ? 'items/' + it.id : 'items', p)
      .then(function () { closeDialog(); toast(isEdit ? 'حُفظ المنتج' : 'أُضيف المنتج'); return loadState() })
      .catch(fail)
  }
  openDialog(form)
}

function delItem(it) {
  openDialog(el('div', {}, [
    el('h2', { text: '🗑 حذف «' + it.title + '»؟' }),
    el('p', { class: 'hint', text: 'لا يمكن التراجع — التسليم التلقائي المضبوط له يُحذف معه.' }),
    el('div', { class: 'row' }, [
      el('button', { class: 'danger', text: 'حذف نهائي', on: { click: function () {
        api('DELETE', 'items/' + it.id).then(function () { closeDialog(); toast('حُذف المنتج'); return loadState() }).catch(fail)
      } } }),
      el('button', { class: 'ghost', text: 'إلغاء', on: { click: closeDialog } }),
    ]),
  ]))
}

// What the buyer receives the moment they pay: a secret text, one of the stored
// files, or nothing — the exact choice /deliver gives, as a form.
function deliverDialog(it) {
  var text = textArea({ rows: 3, placeholder: 'كود / رابط / كلمة مرور — يصل المشتري فوراً بعد الدفع' })
  if (it.deliver && it.deliver.text) text.value = it.deliver.text
  var fileSel = el('select', {})
  fileSel.appendChild(el('option', { value: '', text: '— بدون ملف —' }))
  state.files.forEach(function (f) {
    fileSel.appendChild(el('option', { value: String(f.id), text: f.title }))
  })
  openDialog(el('div', {}, [
    el('h2', { text: '⚡️ التسليم التلقائي — «' + it.title + '»' }),
    it.deliver
      ? el('p', { class: 'hint', text: 'الحالي: ' + (it.deliver.text ? 'نص سري' : 'ملف') + ' — أي حفظ جديد يستبدله.' })
      : el('p', { class: 'hint', text: 'غير مضبوط: المشتري يصلك إشعار الطلب ويصله وعد بالتواصل.' }),
    field('نص سري (كود أو رابط)', text),
    field('أو ملف من المخزن', fileSel),
    el('div', { class: 'row' }, [
      el('button', { class: 'primary', text: 'حفظ', on: { click: function () {
        if (fileSel.value) {
          api('POST', 'deliver', { item: it.id, file: Number(fileSel.value) })
            .then(function () { closeDialog(); toast('التسليم: ملف — يُرسل فور الدفع'); return loadState() }).catch(fail)
        } else if (text.value.trim()) {
          api('POST', 'deliver', { item: it.id, text: text.value.trim() })
            .then(function () { closeDialog(); toast('التسليم: نص — يُرسل فور الدفع'); return loadState() }).catch(fail)
        } else {
          api('POST', 'deliver', { item: it.id, clear: true })
            .then(function () { closeDialog(); toast('أُلغي التسليم التلقائي'); return loadState() }).catch(fail)
        }
      } } }),
      it.deliver ? el('button', { class: 'ghost danger', text: 'إلغاء التسليم', on: { click: function () {
        api('POST', 'deliver', { item: it.id, clear: true })
          .then(function () { closeDialog(); toast('أُلغي التسليم التلقائي'); return loadState() }).catch(fail)
      } } }) : null,
      el('button', { class: 'ghost', text: 'إغلاق', on: { click: closeDialog } }),
    ].filter(Boolean)),
  ]))
}

function sendFileDialog(f) {
  var to = input({ placeholder: 'رقم تيليجرام للعميل', inputmode: 'numeric', dir: 'ltr' })
  openDialog(el('div', {}, [
    el('h2', { text: '📤 إرسال «' + f.title + '»' }),
    field('رقم المستخدم', to),
    el('div', { class: 'row' }, [
      el('button', { class: 'primary', text: 'إرسال الآن', on: { click: function () {
        var n = Number(to.value.trim())
        if (!Number.isInteger(n) || n < 1) return toast('أدخل رقم المستخدم')
        api('POST', 'files/send', { user: n, file: f.id })
          .then(function () { closeDialog(); toast('أُرسل الملف') })
          .catch(fail)
      } } }),
      el('button', { class: 'ghost', text: 'إلغاء', on: { click: closeDialog } }),
    ]),
  ]))
}

function faqDialog() {
  var q = input({ placeholder: 'كيف أستلم المنتج؟' })
  var a = textArea({ rows: 3, placeholder: 'فوراً وبشكل تلقائي بعد الدفع…' })
  openDialog(el('div', {}, [
    el('h2', { text: '＋ سؤال شائع' }),
    field('السؤال', q),
    field('الجواب', a),
    el('div', { class: 'row' }, [
      el('button', { class: 'primary', text: 'إضافة', on: { click: function () {
        if (!q.value.trim() || !a.value.trim()) return toast('السؤال والجواب مطلوبان')
        api('POST', 'faqs', { q: q.value.trim(), a: a.value.trim() })
          .then(function () { closeDialog(); toast('أُضيف السؤال'); return loadState() }).catch(fail)
      } } }),
      el('button', { class: 'ghost', text: 'إلغاء', on: { click: closeDialog } }),
    ]),
  ]))
}

/* ── wiring ──────────────────────────────────────────────── */
$('#tabs').addEventListener('click', function (e) {
  var b = e.target.closest('button')
  if (!b) return
  $('#tabs').querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b) })
  ;['stats', 'items', 'faqs', 'files', 'settings'].forEach(function (t) {
    $('#tab-' + t).hidden = t !== b.dataset.tab
  })
})
$('#i-add').addEventListener('click', function () { itemDialog(null) })
$('#q-add').addEventListener('click', faqDialog)
$('#s-save').addEventListener('click', function () {
  var w = $('#s-welcome').value.trim()
  if (!w) return toast('الترحيب لا يمكن أن يكون فارغاً')
  api('POST', 'welcome', { text: w }).then(function () { toast('حُفظ الترحيب') }).catch(fail)
})
$('#s-pause').addEventListener('click', function () {
  api('POST', 'pause', { paused: !state.bot.paused })
    .then(function (r) { toast(r.paused ? 'المتجر متوقف للصيانة' : 'المتجر يعمل الآن'); return loadState() })
    .catch(fail)
})
$('#b-refresh').addEventListener('click', function () { loadState().then(function () { toast('حُدثت البيانات') }).catch(fail) })
$('#b-out').addEventListener('click', logout)
$('#f-go').addEventListener('click', login)
$('#f-key').addEventListener('keydown', function (e) { if (e.key === 'Enter') login() })
$('#f-id').addEventListener('keydown', function (e) { if (e.key === 'Enter') login() })
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDialog() })

/* boot: fragment first, then a remembered session, else the login form */
if (readFragment()) {
  // The /web link is the login: the fragment carried the key, so the owner lands
  // straight in the dashboard. The form stays the fallback for a link whose fragment
  // never arrived (some in-app browsers strip it) or a code pasted by hand.
  enter()
} else {
  try {
    var kept = sessionStorage.getItem('zdash')
    if (kept) {
      session = JSON.parse(kept)
      enter()
    }
  } catch (e) {}
}

