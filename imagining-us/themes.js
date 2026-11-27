/* Imagining Us: seasonal themes + editable site content.
   The live content lives in site-config.json (edited from admin.html).
   This file holds the theme presets, the built-in defaults, and the code that applies them. */
(function () {
  'use strict';

  var THEMES = {
    classic:      { name: 'Classic (no decorations)', ribbonBg: '', ribbonFg: '', particles: '', banner: '', gift: '' },
    christmas:    { name: 'Christmas', ribbonBg: 'linear-gradient(90deg,#7a1621,#b3263a 50%,#7a1621)', ribbonFg: '#fff6e8', accent: '#1f6b46', particles: 'snow',
                    banner: 'The paperback and audiobook make a thoughtful Christmas gift.', gift: 'A great Christmas gift' },
    newyear:      { name: 'New Year', ribbonBg: 'linear-gradient(90deg,#14223d,#2c3f6b 50%,#14223d)', ribbonFg: '#f6d67a', accent: '#c9a227', particles: 'confetti',
                    banner: 'Start the new year with clarity. Imagining Us is available now.', gift: 'Start the year with clarity' },
    valentines:   { name: "Valentine's Day", ribbonBg: 'linear-gradient(90deg,#8e1f45,#c8406b 50%,#8e1f45)', ribbonFg: '#fff0f4', accent: '#c8406b', particles: 'hearts',
                    banner: 'For anyone who has loved without a label. A meaningful Valentine’s gift.', gift: 'A meaningful Valentine’s gift' },
    easter:       { name: 'Easter / Spring', ribbonBg: 'linear-gradient(90deg,#6f8f5a,#9bb88a 50%,#6f8f5a)', ribbonFg: '#fbfff4', accent: '#7aa36a', particles: 'petals',
                    banner: 'A season of new beginnings. Let go, and make room to love again.', gift: 'A gift for new beginnings' },
    canadaday:    { name: 'Canada Day', ribbonBg: 'linear-gradient(90deg,#a3161d,#d52b1e 50%,#a3161d)', ribbonFg: '#ffffff', accent: '#d52b1e', particles: 'maple',
                    banner: 'Happy Canada Day from Jalen Vale.', gift: '' },
    thanksgiving: { name: 'Thanksgiving', ribbonBg: 'linear-gradient(90deg,#7c3a12,#b5602a 50%,#7c3a12)', ribbonFg: '#fff3e2', accent: '#b5602a', particles: 'leaves',
                    banner: 'Grateful for every reader. Happy Thanksgiving.', gift: 'A thoughtful gift' },
    halloween:    { name: 'Halloween', ribbonBg: 'linear-gradient(90deg,#1c1424,#3a2347 50%,#1c1424)', ribbonFg: '#ffb34d', accent: '#e46f1a', particles: 'spooky',
                    banner: 'Some of the most haunting relationships are the ones that never quite began.', gift: '' }
  };
  var ORDER = ['classic', 'christmas', 'newyear', 'valentines', 'easter', 'canadaday', 'thanksgiving', 'halloween'];

  var DEFAULTS = {
    version: 1,
    theme: 'auto',            // 'auto' picks by date; or any key in THEMES
    decorations: true,        // falling snow, hearts, leaves...
    banners: {},              // per-theme banner text overrides, e.g. {christmas: '...'}
    hero: {
      dedication: 'For those who lived a thousand futures\nwith someone who was never truly theirs.',
      lede: 'This book explores an under-examined form of intimacy, known as an almost-relationship. It is a compassionate guide that recognizes how a love that never quite began can still have an ending, and provides the means to promote healing by helping to separate what really happened from what you hoped would happen.',
      button: 'Get the Kindle edition, $7.16',
      buttonLink: 'https://www.amazon.ca/dp/B0HM5NNB43'
    },
    editionsIntro: 'Read it on Kindle today. The paperback and audiobook are on the way, and the Read-Along Edition, with narration on every page, arrives in January.',
    editions: [
      { id: 'kindle', title: 'Kindle eBook', status: 'Available now', available: true,
        desc: 'Available now on any Kindle device or the free Kindle app, with all 14 diagrams.',
        price: '$7.16', priceNote: 'CAD', button: 'Buy on Amazon', link: 'https://www.amazon.ca/dp/B0HM5NNB43', gift: false },
      { id: 'paperback', title: 'Paperback', status: 'Coming soon', available: false,
        desc: '86 pages, 6 × 9 inches, on cream paper with a glossy cover.',
        price: '$13.99', priceNote: 'CAD on Amazon', button: 'Buy on Amazon', link: '', gift: true },
      { id: 'audiobook', title: 'Audiobook', status: 'Coming soon', available: false,
        desc: 'The full book, narrated in just one hour, making it possible to learn about almost-relationships during a car ride, your daily walk or exercise routine, or a mundane chore at home.',
        price: '$11.99', priceNote: 'CAD on Spotify', button: 'Listen on Spotify', link: '', gift: true },
      { id: 'readalong', title: 'Read-Along Edition', status: 'January 2027', available: true,
        desc: 'The complete book with narration on every page. Read, listen, or do both at once.',
        price: 'This site', priceNote: 'only here', button: 'Try the sample', link: '#sample', gift: false, ghost: true, statusOn: false }
    ]
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(base, over) {
    var out = clone(base);
    if (!over || typeof over !== 'object') return out;
    Object.keys(over).forEach(function (k) {
      if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = merge(out[k], over[k]);
      else if (over[k] !== undefined) out[k] = over[k];
    });
    return out;
  }

  /* ---------- automatic theme by date (Ottawa calendar) ---------- */
  function easterSunday(y) { // anonymous Gregorian algorithm
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mo - 1, da);
  }
  function nthMonday(y, month, n) { var d = new Date(y, month, 1); while (d.getDay() !== 1) d.setDate(d.getDate() + 1); d.setDate(d.getDate() + 7 * (n - 1)); return d; }
  function autoTheme(now) {
    now = now || new Date();
    var y = now.getFullYear(), t = new Date(y, now.getMonth(), now.getDate()).getTime();
    function D(m, d) { return new Date(y, m, d).getTime(); }
    if (t >= D(10, 15) && t <= D(11, 26)) return 'christmas';
    if (t >= D(11, 27) || t <= D(0, 7)) return 'newyear';
    if (t >= D(1, 1) && t <= D(1, 14)) return 'valentines';
    var e = easterSunday(y).getTime(); if (t >= e - 14 * 864e5 && t <= e + 864e5) return 'easter';
    if (t >= D(5, 24) && t <= D(6, 1)) return 'canadaday';
    var tg = nthMonday(y, 9, 2).getTime(); if (t >= D(9, 1) && t <= tg) return 'thanksgiving';
    if (t > tg && t <= D(9, 31)) return 'halloween';
    return 'classic';
  }

  /* ---------- seasonal effects: light, fast falling decorations (sprites, paused when off-screen) ---------- */
  var anim = null;
  function startParticles(kind, host, opts) {
    opts = opts || {};
    if (anim) { anim.stop(); anim = null; }
    if (!kind || !host) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var back = document.createElement('canvas'), front = document.createElement('canvas'), ground = document.createElement('canvas');
    back.className = 'iu-fx'; front.className = 'iu-fx iu-front'; ground.className = 'iu-fx iu-front';
    [back, front, ground].forEach(function (c) { c.setAttribute('aria-hidden', 'true'); });
    host.insertBefore(back, host.firstChild); if (kind === 'snow') host.appendChild(ground);
    var bx = back.getContext('2d'), fx = front.getContext('2d'), gx = ground.getContext('2d');
    var W = 0, H = 0, dpr = 1, parts = [], visible = true, raf = 0;
    var mouse = { x: -999, y: -999, on: false };
    var PAL = {
      snow: ['#ffffff'], confetti: ['#f6d67a', '#ffffff', '#e8b64a', '#9fb8e8', '#f2a3b9'], hearts: ['#ff8fb1', '#ffd1de', '#e2557a', '#ffffff'],
      petals: ['#ffd6e7', '#fff3b0', '#d8f0c8', '#e3d7ff', '#ffffff'], maple: ['#d52b1e', '#e8453a', '#ffffff'],
      leaves: ['#d9822b', '#b5602a', '#e8b04a', '#9c3d1a', '#c9a227'], spooky: ['#ff9a3c', '#e46f1a', '#8a5cc2', '#b85c1d']
    };
    var cols = PAL[kind] || ['#fff'], up = kind === 'hearts';

    /* pre-drawn sprites: drawing images is much cheaper than drawing shapes with glow every frame */
    var sprites = {};
    function sprite(key, size, draw) {
      if (sprites[key]) return sprites[key];
      var c = document.createElement('canvas'), s = Math.ceil(size * 2 + 4); c.width = c.height = s;
      var x = c.getContext('2d'); x.translate(s / 2, s / 2); draw(x, size); sprites[key] = c; return c;
    }
    function flake(r) { var k = Math.round(r * 2) / 2; return sprite('f' + k, k + 2, function (c) {
      var g = c.createRadialGradient(0, 0, 0, 0, 0, k + 1.5); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, k + 1.5, 0, 6.28); c.fill(); }); }
    function shape(c, r, col) {
      c.fillStyle = col;
      if (kind === 'hearts') { c.beginPath(); c.moveTo(0, r * .35); c.bezierCurveTo(-r, -r * .45, -r * .45, -r * 1.1, 0, -r * .45); c.bezierCurveTo(r * .45, -r * 1.1, r, -r * .45, 0, r * .35); c.fill(); }
      else if (kind === 'confetti') c.fillRect(-r * .5, -r * .22, r, r * .44);
      else if (kind === 'petals') { c.beginPath(); c.ellipse(0, 0, r * .4, r * .7, 0, 0, 6.28); c.fill(); }
      else if (kind === 'maple') { c.beginPath(); [[0,-1],[.18,-.55],[.55,-.7],[.42,-.3],[.9,-.2],[.5,.05],[.6,.35],[.15,.25],[.08,.6],[0,.95],[-.08,.6],[-.15,.25],[-.6,.35],[-.5,.05],[-.9,-.2],[-.42,-.3],[-.55,-.7],[-.18,-.55]]
        .forEach(function (p, j) { j ? c.lineTo(p[0] * r, p[1] * r) : c.moveTo(p[0] * r, p[1] * r); }); c.closePath(); c.fill(); }
      else { c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, -r * .62, r, 0); c.quadraticCurveTo(0, r * .62, -r, 0); c.fill();
        c.strokeStyle = 'rgba(60,25,5,.35)'; c.lineWidth = .8; c.beginPath(); c.moveTo(-r * 1.1, 0); c.lineTo(r * .9, 0); c.stroke(); }
    }
    function batSprite() { return sprite('bat', 12, function (c) { var r = 11; c.fillStyle = '#21142c'; c.beginPath(); c.moveTo(-r, -r * .2);
      c.quadraticCurveTo(-r * .55, -r * .6, -r * .18, -r * .05); c.lineTo(0, -r * .28); c.lineTo(r * .18, -r * .05); c.quadraticCurveTo(r * .55, -r * .6, r, -r * .2);
      c.quadraticCurveTo(r * .5, 0, r * .32, r * .22); c.quadraticCurveTo(0, .02 * r, -r * .32, r * .22); c.quadraticCurveTo(-r * .5, 0, -r, -r * .2); c.fill(); }); }

    function size() {
      W = host.clientWidth; H = host.clientHeight;
      [back, ground].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      [bx, fx, gx].forEach(function (c) { c.setTransform(dpr, 0, 0, dpr, 0, 0); });
      drawGround(); drawLightsBase();
    }
    /* a fixed, soft layer of snow along the bottom (drawn once) */
    var groundY = [];
    function drawGround() {
      if (kind !== 'snow') return; groundY = [];
      var seed = 4.2; function n(x) { return Math.abs(Math.sin(x * 127.1 + seed) * 43758.5453 % 1); }
      for (var x = 0; x <= W + 8; x += 8) { var k = x / 80, i = Math.floor(k), f = k - i, s = (1 - Math.cos(f * Math.PI)) / 2;
        groundY.push(10 + (n(i) * (1 - s) + n(i + 1) * s) * 6); }
      gx.clearRect(0, 0, W, H); gx.beginPath(); gx.moveTo(0, H);
      groundY.forEach(function (h, j) { gx.lineTo(j * 8, H - h); }); gx.lineTo(W, H); gx.closePath();
      var g = gx.createLinearGradient(0, H - 18, 0, H); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dfe9f5');
      gx.save(); gx.shadowColor = 'rgba(30,50,90,.3)'; gx.shadowBlur = 8; gx.shadowOffsetY = -2; gx.fillStyle = g; gx.fill(); gx.restore();
    }
    function groundAt(x) { if (!groundY.length) return 0; return groundY[Math.max(0, Math.min(groundY.length - 1, Math.round(x / 8)))]; }

    /* Christmas lights: wire drawn once, bulbs are small pre-drawn glows that twinkle */
    var bulbs = [], wire = null;
    function drawLightsBase() {
      bulbs = []; wire = null; if (!opts.lights) return;
      wire = document.createElement('canvas'); wire.width = Math.round(W * dpr); wire.height = Math.round(80 * dpr);
      var w = wire.getContext('2d'); w.setTransform(dpr, 0, 0, dpr, 0, 0); w.strokeStyle = 'rgba(20,28,40,.75)'; w.lineWidth = 1.4;
      var spans = Math.max(3, Math.round(W / 300)), sw = W / spans, colsL = ['#ff4d5e', '#ffd34d', '#5fd38a', '#5fb4ff', '#ff9a4d'];
      for (var s = 0; s < spans; s++) { var sag = 26 + (s % 2) * 6; w.beginPath(); w.moveTo(s * sw, 4); w.quadraticCurveTo(s * sw + sw / 2, 4 + sag * 2, (s + 1) * sw, 4); w.stroke();
        for (var b = 1; b < 7; b++) { var t = b / 7, x = s * sw + t * sw, y = 4 + sag * 4 * t * (1 - t); w.fillStyle = '#2b2f36'; w.fillRect(x - 2, y - 1, 4, 5);
          bulbs.push({ x: x, y: y + 10, c: colsL[(s * 6 + b) % 5], ph: Math.random() * 6.28, sp: .8 + Math.random() * 1.4 }); } }
    }
    function bulb(col) { return sprite('b' + col, 16, function (c) { var g = c.createRadialGradient(0, 0, 1, 0, 0, 16); g.addColorStop(0, col); g.addColorStop(.25, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = .55; c.fillStyle = g; c.beginPath(); c.arc(0, 0, 16, 0, 6.28); c.fill(); c.globalAlpha = 1; c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 3.6, 6, 0, 0, 6.28); c.fill(); }); }

    size();
    var count = Math.round(Math.min(70, Math.max(30, W / 20)) * (kind === 'snow' ? 1 : .5));
    function make(initial) {
      var z = Math.random(), r = kind === 'snow' ? .8 + z * 2.6 : 4 + z * 7;
      return { x: Math.random() * W, y: initial ? Math.random() * H : (up ? H + 20 : -20 - Math.random() * 40), z: z, r: r,
        vy: (up ? -1 : 1) * (kind === 'snow' ? .3 + z * 1 : .35 + z * .9), vx: (Math.random() - .5) * .3, px: 0, py: 0,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .04, flip: Math.random() * 6.28, sway: Math.random() * 6.28, swaySp: .008 + Math.random() * .016,
        c: cols[Math.floor(Math.random() * cols.length)], a: kind === 'snow' ? .35 + z * .6 : .6 + z * .35, bat: kind === 'spooky' && Math.random() < .15 };
    }
    for (var i = 0; i < count; i++) parts.push(make(true));

    function frame(now) {
      raf = 0; if (!visible) return;
      bx.clearRect(0, 0, W, H);
      if (wire) { bx.drawImage(wire, 0, 0, W, 80); bulbs.forEach(function (b) { bx.globalAlpha = .55 + .45 * Math.sin(now / 1000 * b.sp + b.ph); var s = bulb(b.c); bx.drawImage(s, b.x - s.width / 2, b.y - s.height / 2); }); bx.globalAlpha = 1; }
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]; p.sway += p.swaySp;
        if (mouse.on) { var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 12100) { var d = Math.sqrt(d2) || 1, f = (1 - d / 110) * (1 + p.z); p.px += dx / d * f; p.py += dy / d * f; } }
        p.px *= .93; p.py *= .93;
        if (p.bat) { p.x += (p.vx > 0 ? 1 : -1) * (.8 + p.z) + p.px; p.y += Math.sin(p.sway * 3) * .6 + p.py; }
        else { p.x += p.vx + Math.sin(p.sway) * (kind === 'snow' ? .35 : .7) + p.px; p.y += p.vy + p.py; }
        p.rot += p.vr; p.flip += .03 + p.z * .03;
        if ((!up && p.y > H - groundAt(p.x) + 2) || p.y < -60 || p.y > H + 30 || p.x < -40 || p.x > W + 40) { parts[i] = make(false); continue; }
        var c = bx; c.globalAlpha = p.a;
        if (kind === 'snow') { var s = flake(p.r); c.drawImage(s, p.x - s.width / 2, p.y - s.height / 2); }
        else if (p.bat) { var b = batSprite(); c.save(); c.translate(p.x, p.y); c.scale(1, .6 + .4 * Math.abs(Math.sin(now / 120 + p.sway))); c.drawImage(b, -b.width / 2, -b.height / 2); c.restore(); }
        else { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); if (kind !== 'hearts') c.scale(Math.cos(p.flip), 1); shape(c, p.r, p.c); c.restore(); }
      }
      bx.globalAlpha = 1; fx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    function onMove(e) { var r = host.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; }
    function onLeave() { mouse.on = false; }
    var rt = 0; function onResize() { clearTimeout(rt); rt = setTimeout(size, 150); }
    function wake() { if (visible && !raf && !reduce) raf = requestAnimationFrame(frame); }
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) { visible = en[0].isIntersecting && !document.hidden; wake(); }) : null;
    if (io) io.observe(host);
    function onVis() { visible = !document.hidden; wake(); }
    host.addEventListener('pointermove', onMove, { passive: true }); host.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize); document.addEventListener('visibilitychange', onVis);
    anim = { stop: function () { cancelAnimationFrame(raf); if (io) io.disconnect(); host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis);
      [back, front, ground].forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); }); } };
    if (reduce) frame(performance.now()); else raf = requestAnimationFrame(frame);
  }

  /* ---------- apply config to the page ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function safeLink(u) { u = String(u || '').trim(); return /^(https:\/\/|#)/i.test(u) ? u : ''; }

  function apply(cfg, opts) {
    opts = opts || {};
    var c = merge(DEFAULTS, cfg), $ = function (id) { return document.getElementById(id); };
    var key = opts.theme || c.theme; if (key === 'auto' || !THEMES[key]) key = autoTheme();
    var th = THEMES[key];
    document.documentElement.setAttribute('data-season', key);
    if (th.accent) document.documentElement.style.setProperty('--season', th.accent); else document.documentElement.style.removeProperty('--season');

    // ribbon
    var rb = $('ribbon'), bannerText = (c.banners && c.banners[key] != null) ? c.banners[key] : th.banner;
    if (rb) {
      if (key !== 'classic' && bannerText) { rb.hidden = false; rb.style.background = th.ribbonBg; rb.style.color = th.ribbonFg; rb.querySelector('span').textContent = bannerText; }
      else rb.hidden = true;
    }
    // hero
    if ($('dedic')) { var parts = String(c.hero.dedication).split('\n'); $('dedic').innerHTML = parts.map(esc).join(' <br>'); }
    if ($('lede')) $('lede').textContent = c.hero.lede;
    ['heroBuy', 'endBuy'].forEach(function (id) { var b = $(id); if (!b) return; b.textContent = c.hero.button; var hl = safeLink(c.hero.buttonLink); if (hl) b.href = hl; });
    if ($('edIntro')) $('edIntro').textContent = c.editionsIntro;
    // editions
    var box = $('formats');
    if (box && Array.isArray(c.editions)) {
      box.innerHTML = c.editions.map(function (e) {
        var link = safeLink(e.link), live = e.available && link;
        var gift = (e.gift && th.gift) ? '<span class="gifttag">' + esc(th.gift) + '</span>' : '';
        var act = live ? '<a class="act ' + (e.ghost ? 'ghost' : 'buy') + '" href="' + esc(link) + '">' + esc(e.button) + '</a>'
                       : '<span class="act wait">Available soon</span>';
        return '<div class="fmt"><div><h3>' + esc(e.title) + '</h3><span class="st' + ((e.statusOn !== undefined ? e.statusOn : e.available) ? ' on' : '') + '">' + esc(e.status) + '</span>' + gift + '</div>' +
          '<p>' + esc(e.desc) + '</p><span class="pr">' + esc(e.price) + '<small>' + esc(e.priceNote) + '</small></span>' + act + '</div>';
      }).join('');
    }
    var hero = document.querySelector('.hero');
    startParticles(c.decorations && key !== 'classic' ? th.particles : '', hero, { lights: key === 'christmas' });
    return key;
  }

  function load(cb) {
    var q = new URLSearchParams(location.search), preview = q.get('theme');
    fetch('site-config.json?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (cfg) { var k = apply(cfg, { theme: preview && THEMES[preview] ? preview : '' }); if (cb) cb(k, cfg); });
  }

  window.IU = { THEMES: THEMES, ORDER: ORDER, DEFAULTS: DEFAULTS, merge: merge, autoTheme: autoTheme, apply: apply, load: load };
})();
