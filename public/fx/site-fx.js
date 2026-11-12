/* ============================================================================
   ZeidexSoft — Interface & Ambient Motion Layer
   Vanilla JS, no dependencies, no build step. Loaded with `defer` on every
   page. Each module is independent: if one fails the rest still run, and with
   JavaScript disabled the pages remain complete and readable.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotionQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };
  var reduceMotion = !!reduceMotionQuery.matches;
  var finePointer = window.matchMedia
    ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
    : true;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  // Four cores or fewer is the phone / low-end laptop band: the field still
  // reads, it just carries fewer motes and links.
  var lowPower = (navigator.hardwareConcurrency || 8) <= 4;

  root.classList.add('fx-on');

  var pointer = { x: 0, y: 0, active: false, ts: 0 };

  /* ------------------------------------------------------------------ *
   * 0. Small helpers
   * ------------------------------------------------------------------ */
  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        node.setAttribute(key, attrs[key]);
      });
    }
    return node;
  }

  function on(target, type, handler, options) {
    target.addEventListener(type, handler, options || { passive: true });
  }

  /* ------------------------------------------------------------------ *
   * 1. Ambient background stage
   * ------------------------------------------------------------------ */
  var stage = null;

  function buildStage() {
    if (document.getElementById('fx-bg')) {
      stage = document.getElementById('fx-bg');
      return;
    }

    stage = el('div', null, { id: 'fx-bg', 'aria-hidden': 'true' });

    var layer = el('div', 'fx-layer');
    var drift = el('div', 'fx-drift');
    drift.appendChild(el('div', 'fx-aurora fx-aurora--a'));
    drift.appendChild(el('div', 'fx-aurora fx-aurora--b'));
    drift.appendChild(el('div', 'fx-sweep'));
    drift.appendChild(el('div', 'fx-dots'));
    layer.appendChild(drift);

    // The floor and its horizon stay outside the pointer drift: a ground plane
    // that slides under the cursor reads as a bug, not as depth.
    layer.appendChild(el('div', 'fx-floor'));
    layer.appendChild(el('div', 'fx-horizon'));

    stage.appendChild(layer);
    stage.appendChild(el('div', 'fx-grain'));
    stage.appendChild(el('div', 'fx-vignette'));

    document.body.appendChild(stage);
  }

  /* ------------------------------------------------------------------ *
   * 2. Canvas motes — a slow flow field behind the content
   *    One pre-rendered glow sprite + destination-out trails. No shadow
   *    blur, no per-particle gradients, capped DPR and frame rate.
   * ------------------------------------------------------------------ */
  function initCanvas() {
    if (reduceMotion || saveData) return;

    var canvas = el('canvas', null, { id: 'fx-canvas', 'aria-hidden': 'true' });
    stage.appendChild(canvas);

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var width = 0;
    var height = 0;
    var particles = [];
    var raf = 0;
    var lastFrame = 0;
    var paused = false;
    var elapsed = 0;
    var minGap = 23;
    var linkRange = 132;

    var sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    var sctx = sprite.getContext('2d');
    var glow = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, 'rgba(200, 248, 255, 1)');
    glow.addColorStop(0.22, 'rgba(80, 220, 255, 0.5)');
    glow.addColorStop(0.55, 'rgba(59, 130, 246, 0.16)');
    glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
    sctx.fillStyle = glow;
    sctx.fillRect(0, 0, 64, 64);

    function count() {
      var ideal = Math.round((width * height) / (lowPower ? 38000 : 26000));
      return Math.max(lowPower ? 18 : 26, Math.min(lowPower ? 56 : 88, ideal));
    }

    function spawn(index) {
      var seed = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        z: 0.45 + Math.random() * 0.75,
        r: 1.1 + Math.random() * 2.2,
        a: 0.1 + Math.random() * 0.22,
        seed: seed,
        drift: 0.014 + Math.random() * 0.016
      };
    }

    function resize() {
      width = stage.clientWidth || window.innerWidth;
      height = stage.clientHeight || window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Phones repaint fewer frames: the field is slow enough that it reads
      // the same, and the battery is worth more than the extra frames.
      minGap = width < 720 ? 34 : 23;
      linkRange = width < 720 ? 96 : lowPower ? 112 : 136;

      var target = count();
      particles = particles.slice(0, target);
      while (particles.length < target) particles.push(spawn(particles.length));
    }

    function frame(now) {
      raf = window.requestAnimationFrame(frame);
      if (paused) return;

      // Frame ceiling: the field is slow, extra frames buy nothing.
      if (now - lastFrame < minGap) return;
      lastFrame = now;
      elapsed += 1;

      // Fade previous positions into a trail. Transparent-safe erase.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.11)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        // Cheap pseudo-noise field: two incommensurable waves.
        var angle =
          Math.sin(p.x * 0.0019 + elapsed * 0.0038 + p.seed) * 2.4 +
          Math.cos(p.y * 0.0025 - elapsed * 0.0029) * 2.4;

        p.vx += Math.cos(angle) * p.drift * p.z;
        p.vy += Math.sin(angle) * p.drift * p.z;

        // The pointer only pushes motes while it is actually moving.
        if (pointer.active && now - pointer.ts > 1500) pointer.active = false;

        if (pointer.active) {
          var dx = p.x - pointer.x;
          var dy = p.y - pointer.y;
          var dist2 = dx * dx + dy * dy;
          var radius = 130;
          if (dist2 < radius * radius && dist2 > 1) {
            var force = (1 - Math.sqrt(dist2) / radius) * 0.55;
            var inv = 1 / Math.sqrt(dist2);
            p.vx += dx * inv * force;
            p.vy += dy * inv * force;
          }
        }

        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -40) p.x = width + 40;
        else if (p.x > width + 40) p.x = -40;
        if (p.y < -40) p.y = height + 40;
        else if (p.y > height + 40) p.y = -40;

        var size = p.r * 8;
        ctx.globalAlpha = p.a;
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      }

      // Constellation pass: motes that drift close enough are tied together.
      // This is what turns a field of dots into a network, which is the thing
      // the product actually sells. One path, one stroke, no per-pair state.
      var range2 = linkRange * linkRange;
      ctx.beginPath();
      for (var a = 0; a < particles.length; a++) {
        var pa = particles[a];
        for (var b = a + 1; b < particles.length; b++) {
          var pb = particles[b];
          var lx = pa.x - pb.x;
          var ly = pa.y - pb.y;
          if (lx * lx + ly * ly > range2) continue;
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
        }
      }
      ctx.globalAlpha = 1;
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(125, 225, 255, 0.045)';
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function start() {
      if (raf) return;
      lastFrame = 0;
      raf = window.requestAnimationFrame(frame);
    }

    function stop() {
      if (!raf) return;
      window.cancelAnimationFrame(raf);
      raf = 0;
    }

    resize();
    start();

    var resizeTimer = 0;
    on(window, 'resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 180);
    });

    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
      if (document.hidden) stop();
      else start();
    });

    // If the visitor switches reduced motion on mid-session, tear it down.
    var onMotionChange = function () {
      reduceMotion = reduceMotionQuery.matches;
      if (reduceMotion) {
        stop();
        canvas.style.display = 'none';
      } else {
        canvas.style.display = '';
        resize();
        start();
      }
    };
    if (reduceMotionQuery.addEventListener) reduceMotionQuery.addEventListener('change', onMotionChange);
  }

  /* ------------------------------------------------------------------ *
   * 3. Cursor light
   * ------------------------------------------------------------------ */
  function initCursor() {
    if (reduceMotion || !finePointer || saveData) return;

    var light = el('div', null, { id: 'fx-cursor', 'aria-hidden': 'true' });
    document.body.appendChild(light);

    var tx = window.innerWidth / 2;
    var ty = window.innerHeight * 0.3;
    var cx = tx;
    var cy = ty;
    var running = false;

    function frame() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      light.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) {
        window.requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    var driftX = 0;
    var driftY = 0;
    var driftQueued = false;

    function pushDrift() {
      if (driftQueued || !stage) return;
      driftQueued = true;
      window.requestAnimationFrame(function () {
        driftQueued = false;
        stage.style.setProperty('--fx-px', driftX.toFixed(3));
        stage.style.setProperty('--fx-py', driftY.toFixed(3));
      });
    }

    on(window, 'pointermove', function (event) {
      tx = event.clientX;
      ty = event.clientY;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      pointer.ts = performance.now();
      light.classList.add('is-on');

      // Normalised -1…1, so the background leans by a fixed few pixels rather
      // than tracking raw coordinates.
      driftX = (event.clientX / window.innerWidth) * 2 - 1;
      driftY = (event.clientY / window.innerHeight) * 2 - 1;
      pushDrift();

      if (!running) {
        running = true;
        window.requestAnimationFrame(frame);
      }
    });

    document.addEventListener('pointerleave', function () {
      light.classList.remove('is-on');
      pointer.active = false;
    });
  }

  /* ------------------------------------------------------------------ *
   * 4. Navigation state from the URL (fixes the alias routes)
   * ------------------------------------------------------------------ */
  var ROUTE_MAP = {
    '/': '/',
    '/index.html': '/',
    '/bots.html': '/bots.html',
    '/shop.html': '/bots.html',
    '/programs.html': '/programs.html',
    '/program.html': '/programs.html',
    '/templates.html': '/templates.html',
    '/blog.html': '/blog.html',
    '/trial.html': '/trial.html',
    '/pricing.html': '/trial.html',
    '/pay.html': '/trial.html',
    '/about.html': '/about.html',
    '/links.html': '/about.html'
  };

  function currentRoute() {
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    return ROUTE_MAP[path] || path;
  }

  function normaliseHref(href) {
    if (!href) return '';
    try {
      var url = new URL(href, window.location.origin);
      // External links (Telegram, TikTok) must never match a page route.
      if (url.origin !== window.location.origin) return '';
      var path = url.pathname.replace(/\/+$/, '') || '/';
      return ROUTE_MAP[path] || path;
    } catch (error) {
      return '';
    }
  }

  function initNavState() {
    var route = currentRoute();
    var navs = document.querySelectorAll('header nav, #mobileMenu');
    if (!navs.length) return;

    Array.prototype.forEach.call(navs, function (nav) {
      nav.classList.add('fx-nav');
      var links = nav.querySelectorAll('a[href]');
      Array.prototype.forEach.call(links, function (link) {
        var target = normaliseHref(link.getAttribute('href'));
        if (target && target === route) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });

    // The mobile drawer duplicates the desktop links; close it on navigation.
    var toggle = document.getElementById('mobileMenuBtn');
    var drawer = document.getElementById('mobileMenu');
    if (toggle && drawer) {
      on(drawer, 'click', function (event) {
        if (event.target.closest('a')) {
          drawer.classList.add('hidden');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * 5. Page hero marking
   * ------------------------------------------------------------------ */
  function markPageHero() {
    var heading = document.querySelector('section h1');
    // The home hero has its own scale and choreography; leave it alone.
    if (!heading || heading.id === 'hero-title') return;
    var band = heading.closest('section');
    if (band) band.classList.add('fx-page-hero');
  }

  /* ------------------------------------------------------------------ *
   * 5c. Page accent
   *    Each page already leaned on one hue in its markup. Naming that hue
   *    lets one set of rules govern every interactive state, instead of the
   *    cyan default fighting an emerald page.
   * ------------------------------------------------------------------ */
  var ACCENTS = {
    '/': 'cyan',
    '/bots.html': 'cyan',
    '/programs.html': 'emerald',
    '/templates.html': 'violet',
    '/blog.html': 'blue',
    '/trial.html': 'emerald',
    '/about.html': 'cyan'
  };

  function initAccent() {
    var accent = ACCENTS[currentRoute()] || 'cyan';
    root.setAttribute('data-fx-accent', accent);
  }

  /* ------------------------------------------------------------------ *
   * 5d. Controls get one motion language
   *    The markup has no shared button class: some controls are <a>, some
   *    <button>, each with its own utilities. The script finds the ones that
   *    actually read as controls and gives them .fx-btn.
   * ------------------------------------------------------------------ */
  function initButtons() {
    var nodes = document.querySelectorAll('a[href], button, summary');
    var candidates = [];

    Array.prototype.forEach.call(nodes, function (node) {
      if (node.classList.contains('fx-btn')) return;
      if (node.closest('#fx-bg, nav, #mobileMenu, #mobileMenuBtn, #fx-mobile-cta, #fx-top, footer, #toastNotification')) return;
      var rect = node.getBoundingClientRect();
      // A card that happens to be a link is not a button.
      if (rect.width < 24 || rect.height < 20) return;
      if (rect.height > 92 || rect.width > 480) return;
      candidates.push(node);
    });

    // Read every computed style first, then write: no layout thrash.
    var accepted = candidates.filter(function (node) {
      var style = window.getComputedStyle(node);
      var fill = style.backgroundColor;
      var hasFill = fill !== 'rgba(0, 0, 0, 0)' && fill !== 'transparent';
      var hasBorder = parseFloat(style.borderTopWidth) > 0;
      return hasFill || hasBorder;
    });

    accepted.forEach(function (node) {
      node.classList.add('fx-btn');
      // Tap ripple: the only press feedback a phone gets beyond the scale.
      if (!reduceMotion) on(node, 'pointerdown', function (event) {
        var box = node.getBoundingClientRect();
        var ink = document.createElement('span');
        ink.className = 'fx-ripple';
        ink.style.left = event.clientX - box.left + 'px';
        ink.style.top = event.clientY - box.top + 'px';
        ink.style.setProperty('--fx-ripple-size', Math.max(box.width, box.height) * 2.2 + 'px');
        ink.addEventListener('animationend', function () { ink.remove(); });
        node.appendChild(ink);
      });
      if (!finePointer) return;

      var rect = null;
      on(node, 'pointerenter', function () {
        rect = node.getBoundingClientRect();
      });
      on(node, 'pointermove', function (event) {
        if (!rect) rect = node.getBoundingClientRect();
        node.style.setProperty('--btn-x', event.clientX - rect.left + 'px');
        node.style.setProperty('--btn-y', event.clientY - rect.top + 'px');
      });
    });

    // Plain action links get link motion, not button motion.
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.classList.contains('fx-btn') || node.classList.contains('fx-link')) return;
      if (node.closest('#fx-bg, nav, #mobileMenu, #mobileMenuBtn, #fx-mobile-cta, #fx-top, footer, #toastNotification')) return;
      var rect = node.getBoundingClientRect();
      if (rect.width < 30 || rect.height < 16) return;
      if (rect.height > 52 || rect.width > 420) return;
      var text = (node.textContent || '').trim();
      if (!text || text.length > 48) return;
      if (!node.querySelector('svg') && text.length > 32) return;
      node.classList.add('fx-link');
    });
  }

  /* ------------------------------------------------------------------ *
   * 5b. Interface normalisation hooks
   *    The markup is authored with per-page Tailwind scales. These classes
   *    let the stylesheet take over the three objects that must look the
   *    same on every page: the band rhythm, the section heading and the
   *    footer wordmark.
   * ------------------------------------------------------------------ */
  function markRhythm() {
    var hero = document.querySelector('.fx-page-hero');

    Array.prototype.forEach.call(document.querySelectorAll('section'), function (section) {
      if (section === hero) return;
      // Never touch a section nested inside another section: only the outer
      // band owns the vertical gap.
      if (section.parentElement && section.parentElement.closest('section')) return;
      section.classList.add('fx-band');
    });

    Array.prototype.forEach.call(document.querySelectorAll('section h2'), function (heading) {
      // Article bodies own their own heading scale.
      if (heading.closest('article')) return;
      heading.classList.add('fx-h2');
    });

    Array.prototype.forEach.call(document.querySelectorAll('footer span'), function (node) {
      var text = node.textContent.replace(/\s+/g, ' ').trim();
      if (!/^Zeidex\s*Soft$/i.test(text)) return;
      node.classList.add('fx-brand-word');
    });

    // Arabic set in a monospace face breaks its joins: the fallback is a
    // monospaced Latin face, so every letter gets its own cell and the word
    // reads as two. Any element that directly holds Arabic text while its
    // computed family is monospace is moved to the site's text face. Numbers
    // and Latin identifiers inside the same block keep their mono.
    try {
      var arabic = /[\u0600-\u06FF\u0750-\u077F]/;
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      var fixed = [];
      while (walker.nextNode()) {
        var node = walker.currentNode;
        if (!arabic.test(node.nodeValue)) continue;
        var parent = node.parentElement;
        if (!parent || fixed.indexOf(parent) !== -1) continue;
        fixed.push(parent);
        var family = window.getComputedStyle(parent).fontFamily || '';
        if (family.toLowerCase().indexOf('mono') === -1) continue;
        parent.style.fontFamily = 'var(--fx-sans)';
      }
    } catch (error) {
      // Decorative only: the page reads fine without it.
    }
  }

  /* ------------------------------------------------------------------ *
   * 6. Entrance choreography
   * ------------------------------------------------------------------ */
  function collectRevealTargets() {
    // index.html authors its own choreography with [data-reveal]; those
    // elements are already opacity:0 in the page's CSS, so they must be
    // observed here — otherwise a CDN failure would leave whole sections
    // invisible.
    var explicit = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (explicit.length) return explicit;

    var targets = [];
    var seen = [];

    function push(node, index) {
      if (!node || seen.indexOf(node) !== -1) return;
      if (node.closest('#fx-bg')) return;
      seen.push(node);
      node.setAttribute('data-fx-reveal', '');
      if (typeof index === 'number') node.style.setProperty('--fx-i', String(index));
      targets.push(node);
    }

    Array.prototype.forEach.call(document.querySelectorAll('section'), function (section) {
      var heading = section.querySelector('h1, h2');
      if (!heading) {
        // No heading in this section: reveal the cards on their own.
      } else {
        push(heading);
        var next = heading.nextElementSibling;
        if (next && next.tagName === 'P') push(next, 1);
        else {
          var parentNext = heading.parentElement && heading.parentElement.nextElementSibling;
          if (parentNext && parentNext.tagName === 'P') push(parentNext, 1);
        }
      }

      var blocks = section.querySelectorAll('.bento-card, .techfy-glass, .prog-card');
      Array.prototype.forEach.call(blocks, function (block, index) {
        push(block, Math.min(index, 5));
      });
    });

    return targets;
  }

  function initReveal() {
    var targets = collectRevealTargets();
    if (!targets.length) return;

    function showAll() {
      targets.forEach(function (node) {
        node.classList.add('is-in');
      });
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    var observer;

    try {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
      );
    } catch (error) {
      // If observation cannot be set up, every target is shown at once. The
      // reveal is decoration; the content behind it is not.
      showAll();
      return;
    }

    targets.forEach(function (node) {
      observer.observe(node);
    });
  }

  /* ------------------------------------------------------------------ *
   * 7. Count-up numbers
   * ------------------------------------------------------------------ */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var format = new Intl.NumberFormat('en-US');

    function run(node) {
      if (node.dataset.fxCounted) return;
      node.dataset.fxCounted = '1';

      var target = parseInt(node.getAttribute('data-count'), 10) || 0;
      var prefix = node.getAttribute('data-prefix') || '';
      var suffix = node.getAttribute('data-suffix') || '';

      if (reduceMotion || target === 0) {
        node.textContent = prefix + format.format(target) + suffix;
        return;
      }

      var duration = 1250;
      var start = performance.now();

      function tick(now) {
        var progress = Math.min((now - start) / duration, 1);
        var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        node.textContent = prefix + format.format(Math.round(target * eased)) + suffix;
        if (progress < 1) window.requestAnimationFrame(tick);
      }

      window.requestAnimationFrame(tick);
    }

    if ('IntersectionObserver' in window && !reduceMotion) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            run(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.3 }
      );
      Array.prototype.forEach.call(counters, function (node) {
        observer.observe(node);
      });
    } else {
      Array.prototype.forEach.call(counters, run);
    }
  }

  /* ------------------------------------------------------------------ *
   * 8. Hero headline entrance + terminal caret
   * ------------------------------------------------------------------ */
  function initHero() {
    var heading = document.getElementById('hero-title');
    if (heading && !reduceMotion && !heading.dataset.fxSplit) {
      var words = heading.textContent.trim().split(/\s+/);
      if (words.length > 1) {
        heading.dataset.fxSplit = '1';
        heading.textContent = '';
        words.forEach(function (word, index) {
          var span = el('span', 'fx-word');
          span.style.setProperty('--i', String(index));
          span.textContent = word;
          heading.appendChild(span);
          if (index < words.length - 1) heading.appendChild(document.createTextNode(' '));
        });
      }
    }

    var code = document.querySelector('#cockpitTerminal code');
    if (code && !code.querySelector('.fx-caret')) {
      var caret = el('span', 'fx-caret', { 'aria-hidden': 'true' });
      code.appendChild(caret);
    }
  }

  /* ------------------------------------------------------------------ *
   * 9. Card spotlight (pointer only)
   * ------------------------------------------------------------------ */
  function initSpotlight() {
    if (reduceMotion || !finePointer) return;

    Array.prototype.forEach.call(document.querySelectorAll('.bento-card, .prog-card'), function (card) {
      if (card.dataset.fxSpot) return;
      card.dataset.fxSpot = '1';
      on(card, 'pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', event.clientX - rect.left + 'px');
        card.style.setProperty('--spot-y', event.clientY - rect.top + 'px');
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 10. Scroll UI: progress, header state, parallax, back to top, mobile bar
   * ------------------------------------------------------------------ */
  function initScrollUi() {
    var header = document.querySelector('header');

    var progress = el('div', null, { id: 'fx-progress', 'aria-hidden': 'true' });
    document.body.appendChild(progress);

    var backToTop = el('button', null, {
      id: 'fx-top',
      type: 'button',
      'aria-label': 'العودة إلى أعلى الصفحة'
    });
    backToTop.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    on(backToTop, 'click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    document.body.appendChild(backToTop);

    var mobileBar = el('div', null, { id: 'fx-mobile-cta', 'aria-label': 'إجراءات سريعة' });
    mobileBar.innerHTML =
      '<a class="fx-cta-ghost" href="/trial.html">تجربة 3 أيام</a>' +
      '<a class="fx-cta-solid" href="https://t.me/ZeidexStoreBot" target="_blank" rel="noopener noreferrer">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.196 1.006.128.832.928z"/>' +
      '</svg><span>بوت المتجر</span></a>';
    document.body.appendChild(mobileBar);
    document.body.classList.add('fx-has-mobile-cta');

    var ticking = false;
    var parallax = document.querySelector('#fx-bg .fx-layer');

    function measureHeader() {
      if (!header) return;
      root.style.setProperty('--fx-header-h', header.offsetHeight + 'px');
    }

    function update() {
      var y = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(y / max, 1) : 0;

      progress.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';

      if (header) header.classList.toggle('fx-scrolled', y > 8);
      backToTop.classList.toggle('is-on', y > 900);
      mobileBar.classList.toggle('is-on', y > 560);

      if (parallax && !reduceMotion) {
        parallax.style.setProperty('--fx-scroll', (Math.min(y, 1600) * -0.055).toFixed(2) + 'px');
      }

      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    on(window, 'scroll', requestUpdate);
    on(window, 'resize', function () {
      measureHeader();
      requestUpdate();
    });

    measureHeader();
    update();
  }

  /* ------------------------------------------------------------------ *
   * 11. Inline handlers under a strict CSP
   *    The production CSP is hash-based (no 'unsafe-inline'), which blocks
   *    every onclick="…" attribute in the markup: modals, filters and copy
   *    buttons do nothing on the live site. This external script is allowed,
   *    so it reads the attribute, removes it, and makes the same call itself.
   *    Only page functions named open…/close…/set…/reset…/copy…/preview… with
   *    literal arguments are accepted; nothing is evaluated.
   * ------------------------------------------------------------------ */
  var CALL_SHAPE = /^\s*((?:open|close|set|reset|copy|preview)[A-Z]\w*)\(([\s\S]*)\)\s*;?\s*$/;
  var ARG_SHAPE = /\s*(?:'((?:[^'\\]|\\[\s\S])*)'|(-?\d+(?:\.\d+)?)|document\.getElementById\('([^']+)'\)\.(value|textContent))\s*(,|$)/y;

  function parseInlineCall(source) {
    var shape = CALL_SHAPE.exec(source || '');
    if (!shape) return null;
    var args = [];
    var rest = shape[2];
    ARG_SHAPE.lastIndex = 0;
    while (ARG_SHAPE.lastIndex < rest.length) {
      var token = ARG_SHAPE.exec(rest);
      if (!token) return rest.trim() === '' ? { name: shape[1], args: args } : null;
      if (token[1] !== undefined) {
        args.push({ text: token[1].replace(/\\([\s\S])/g, function (_, ch) { return ch === 'n' ? '\n' : ch; }) });
      } else if (token[2] !== undefined) {
        args.push({ text: Number(token[2]) });
      } else {
        args.push({ id: token[3], prop: token[4] });
      }
    }
    return { name: shape[1], args: args };
  }

  function initInlineCalls() {
    // Capture phase: the attribute is gone before the browser would run it,
    // so where no CSP applies (local dev) the call still happens only once.
    document.addEventListener('click', function (event) {
      var node = event.target && event.target.closest ? event.target.closest('[onclick], [data-fx-call]') : null;
      if (!node) return;
      var source = node.getAttribute('onclick');
      if (source !== null) {
        if (!parseInlineCall(source)) return;
        node.setAttribute('data-fx-call', source);
        node.removeAttribute('onclick');
      }
      var call = parseInlineCall(node.getAttribute('data-fx-call'));
      var fn = call && window[call.name];
      if (typeof fn !== 'function') return;
      fn.apply(node, call.args.map(function (arg) {
        if (!arg.id) return arg.text;
        var ref = document.getElementById(arg.id);
        return ref ? ref[arg.prop] : '';
      }));
    }, true);
  }

  /* ------------------------------------------------------------------ *
   * 12. Article video player
   *    Chapter links point at the real file, so the list works without this.
   *    With it, a click loads the chapter into the player above the list.
   * ------------------------------------------------------------------ */
  function initPlayers() {
    document.addEventListener('click', function (event) {
      var link = event.target && event.target.closest ? event.target.closest('[data-fx-player] ol a') : null;
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button) return;
      var player = link.closest('[data-fx-player]');
      var video = player.querySelector('video');
      if (!video) return;
      event.preventDefault();
      Array.prototype.forEach.call(player.querySelectorAll('ol a[aria-current]'), function (node) {
        node.removeAttribute('aria-current');
      });
      link.setAttribute('aria-current', 'true');
      var now = player.querySelector('.post-player-now');
      if (now) now.textContent = link.textContent;
      video.src = link.href;
      var started = video.play();
      // Autoplay can be refused; the controls are still there.
      if (started && started.catch) started.catch(function () {});
      if (video.getBoundingClientRect().top < 0) {
        video.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function boot() {
    // Each module is isolated: a failure in one must never blank the page or
    // stop navigation state, reveals and the scroll UI from working.
    [
      initInlineCalls,
      initPlayers,
      buildStage,
      initCanvas,
      initCursor,
      initNavState,
      initAccent,
      initButtons,
      markPageHero,
      markRhythm,
      initReveal,
      initCounters,
      initHero,
      initSpotlight,
      initScrollUi
    ].forEach(function (module) {
      try {
        module();
      } catch (error) {
        // Silent by design: the layer is decorative and must not break the page.
        if (window.console && console.warn) console.warn('[fx]', module.name, error);
      }
    });

    // The button pass reads computed styles, and the Tailwind CDN may not have
    // injected its sheet by the time a deferred script runs. Run it again once
    // everything is in — adding the class twice is a no-op.
    function secondButtonPass() {
      try {
        initButtons();
      } catch (error) {
        // Decorative only.
      }
    }

    if (document.readyState === 'complete') {
      window.setTimeout(secondButtonPass, 150);
    } else {
      window.addEventListener('load', function () {
        window.setTimeout(secondButtonPass, 150);
      }, { once: true });
    }
  }

  // The script is deferred, so the body exists by the time it runs. Booting
  // here — instead of on DOMContentLoaded — means a slow third-party CDN can
  // no longer hold the background and the navigation state hostage.
  if (document.body) {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  }
})();
