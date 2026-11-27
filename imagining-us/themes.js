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

  /* ---------- seasonal effects: falling layers, piles that build up, cursor interaction ---------- */
  var anim = null;
  function startParticles(kind, host, opts) {
    opts = opts || {};
    if (anim) { anim.stop(); anim = null; }
    if (!kind || !host) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var back = document.createElement('canvas'), front = document.createElement('canvas');
    back.className = 'iu-fx iu-back'; front.className = 'iu-fx iu-front';
    back.setAttribute('aria-hidden', 'true'); front.setAttribute('aria-hidden', 'true');
    host.insertBefore(back, host.firstChild); host.appendChild(front);
    var bx = back.getContext('2d'), fx = front.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), parts = [], pile = [], t0 = performance.now();
    var mouse = { x: -999, y: -999, vx: 0, vy: 0, on: false };
    var PAL = {
      snow: ['#ffffff'], confetti: ['#f6d67a', '#ffffff', '#e8b64a', '#9fb8e8', '#f2a3b9'], hearts: ['#ff8fb1', '#ffd1de', '#e2557a', '#ffffff'],
      petals: ['#ffd6e7', '#fff3b0', '#d8f0c8', '#e3d7ff', '#ffffff'], maple: ['#d52b1e', '#e8453a', '#ffffff'],
      leaves: ['#d9822b', '#b5602a', '#e8b04a', '#9c3d1a', '#c9a227'], spooky: ['#ff9a3c', '#e46f1a', '#8a5cc2', '#b85c1d']
    };
    var cols = PAL[kind] || ['#fff'];
    var piles = kind === 'snow' || kind === 'leaves' || kind === 'spooky' || kind === 'maple';
    var up = kind === 'hearts';
    var COL = 4; // pile resolution in px

    function size() {
      W = host.clientWidth; H = host.clientHeight;
      [back, front].forEach(function (c) { c.width = W * dpr; c.height = H * dpr; });
      bx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.ceil(W / COL) + 1; while (pile.length < n) pile.push(0); pile.length = n;
    }
    size();
    var density = Math.min(150, Math.max(50, W / 9)) * (kind === 'snow' ? 1 : .45);
    function make(initial) {
      var z = Math.random(); // 0 far .. 1 near
      var big = kind === 'snow' ? 0.8 + z * 3.4 : 4 + z * 8;
      return { x: Math.random() * W, y: initial ? Math.random() * H : (up ? H + 20 : -20 - Math.random() * 40), z: z, r: big,
        vy: (up ? -1 : 1) * (kind === 'snow' ? .25 + z * 1.1 : .35 + z * 1.0), vx: (Math.random() - .5) * .3, px: 0, py: 0,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .05, flip: Math.random() * 6.28,
        sway: Math.random() * 6.28, swaySp: .008 + Math.random() * .02, c: cols[Math.floor(Math.random() * cols.length)],
        a: kind === 'snow' ? .35 + z * .6 : .6 + z * .35, bat: kind === 'spooky' && Math.random() < .18 };
    }
    for (var i = 0; i < density; i++) parts.push(make(true));
    // snow that settles on top of the book (front and spine), and shakes off when the book is hovered
    var bookEl = null /* snow on the book: turned off */, caps = [], NB = 48, prof = [], HMAX = 34;
    var nzb = noise1(NB, 5.3); for (var c0 = 0; c0 < NB; c0++) prof.push(6 + nzb[c0] * 6);
    if (bookEl) {
      var mk = function (parent, cls) { var cv = document.createElement('canvas'); cv.className = 'iu-cap ' + cls; cv.setAttribute('aria-hidden', 'true'); parent.appendChild(cv); return cv; };
      caps.push({ cv: mk(bookEl, 'iu-cap-front'), spine: false });
      var sp = bookEl.querySelector('.spine'); if (sp) caps.push({ cv: mk(sp, 'iu-cap-spine'), spine: true });
    }
    var heapDirty = true;
    function noise1(n, seed) { // smooth random profile (no visible repetition)
      var pts = [], out = [], step = 7; for (var k = 0; k <= Math.ceil(n / step) + 1; k++) pts.push(Math.sin((k + seed) * 127.1) * 43758.5453 % 1);
      for (var j = 0; j < n; j++) { var a = Math.floor(j / step), f = (j % step) / step, s = (1 - Math.cos(f * Math.PI)) / 2; out.push(Math.abs(pts[a]) * (1 - s) + Math.abs(pts[a + 1]) * s); }
      return out;
    }
    function drawHeap(cap) {
      var cv = cap.cv, w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      if (Math.max.apply(null, prof) < .6) return;
      var base = h - 12, P = cap.spine ? (function () { var a = []; for (var k = 0; k < 8; k++) a.push(prof[Math.min(NB - 1, k)] * .9); return a; })() : prof, n = P.length;
      function hy(x) { var u = x / w * (n - 1), i = Math.floor(u), f = u - i, a = P[Math.max(0, Math.min(n - 1, i))], b = P[Math.max(0, Math.min(n - 1, i + 1))];
        var edge = Math.min(1, x / (w * .06), (w - x) / (w * .06)); return (a + (b - a) * f) * Math.max(0, edge); }
      var top = []; for (var x = 0; x <= w; x += 2) top.push([x, base - hy(x)]);
      // body of the heap
      c.beginPath(); c.moveTo(0, base); top.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(w, base);
      // overhang drooping over the front edge
      for (var x2 = w; x2 >= 0; x2 -= 6) { var d = Math.min(10, hy(x2) * .34) * (0.55 + 0.45 * Math.abs(Math.sin(x2 * .37 + 1.3))); c.lineTo(x2, base + d); }
      c.closePath();
      var g = c.createLinearGradient(0, base - HMAX, 0, base + 10); g.addColorStop(0, '#ffffff'); g.addColorStop(.55, '#f4f8fd'); g.addColorStop(.85, '#d9e5f2'); g.addColorStop(1, '#bccbe0');
      c.save(); c.shadowColor = 'rgba(15,30,60,.35)'; c.shadowBlur = 6; c.shadowOffsetY = 3; c.fillStyle = g; c.fill(); c.restore();
      // puffy lumps on top, lit from the upper left
      for (var x3 = 4; x3 < w - 4; x3 += 9) { var hh = hy(x3); if (hh < 2.5) continue;
        var r = Math.min(9, 2 + hh * .35), cy = base - hh + r * .55, rg = c.createRadialGradient(x3 - r * .35, cy - r * .45, r * .1, x3, cy, r);
        rg.addColorStop(0, '#ffffff'); rg.addColorStop(.7, '#f2f6fb'); rg.addColorStop(1, 'rgba(220,232,245,0)');
        c.fillStyle = rg; c.beginPath(); c.arc(x3, cy, r, 0, 6.28); c.fill(); }
      // soft blue shadow where the snow meets the cover
      var sg = c.createLinearGradient(0, base - 2, 0, base + 10); sg.addColorStop(0, 'rgba(120,150,190,0)'); sg.addColorStop(1, 'rgba(120,150,190,.35)');
      c.globalCompositeOperation = 'source-atop'; c.fillStyle = sg; c.fillRect(0, base - 2, w, 14); c.globalCompositeOperation = 'source-over';
    }
    function bookTop() { // top edge of the book's front, in hero coordinates
      if (!bookEl) return null; var hr = host.getBoundingClientRect(), r = (bookEl.querySelector('.front') || bookEl).getBoundingClientRect();
      return { l: r.left - hr.left, r: r.right - hr.left, t: r.top - hr.top };
    }
    function heapAt(u) { var i = Math.max(0, Math.min(NB - 1, Math.round(u * (NB - 1)))); return prof[i]; }
    function addHeap(u, amt) { var i0 = u * (NB - 1);
      for (var k = 0; k < NB; k++) { var d = (k - i0) / 2.6; var add = amt * Math.exp(-d * d); if (add > .01) prof[k] = Math.min(HMAX, prof[k] + add * (1 - prof[k] / (HMAX + 4))); }
      heapDirty = true; }
    function shakeOff() {
      if (!bookEl || bookEl.classList.contains('iu-shake')) return;
      var bt = bookTop(); bookEl.classList.add('iu-shake'); setTimeout(function () { bookEl.classList.remove('iu-shake'); }, 700);
      if (bt) for (var k = 0; k < NB; k++) { var h = prof[k], n = Math.round(h * .6);
        for (var m = 0; m < n; m++) parts.push({ x: bt.l + (k + Math.random()) / NB * (bt.r - bt.l), y: bt.t - Math.random() * h, z: .8 + Math.random() * .2,
          r: 1.3 + Math.random() * (m % 5 === 0 ? 4 : 2.2), vy: -1.5 - Math.random() * 2.5, g: .16 + Math.random() * .06, vx: 0,
          px: (Math.random() - .5) * 4 + (k / NB - .5) * 3, py: 0, rot: 0, vr: 0, flip: 0, sway: 0, swaySp: 0, c: '#ffffff', a: .95, clump: true }); }
      for (var j = 0; j < NB; j++) prof[j] = 0; heapDirty = true;
    }
    if (bookEl) bookEl.addEventListener('pointerenter', shakeOff);
    // start the ground drift as a soft, uneven dusting, then let it build up
    if (kind === 'snow') { var nz = noise1(pile.length, 3.7), nz2 = noise1(pile.length, 9.1); for (var q0 = 0; q0 < pile.length; q0++) pile[q0] = 8 + nz[q0] * 4 + nz2[q0] * 2; }

    function heart(c, r) { c.beginPath(); c.moveTo(0, r * .35); c.bezierCurveTo(-r, -r * .45, -r * .45, -r * 1.1, 0, -r * .45); c.bezierCurveTo(r * .45, -r * 1.1, r, -r * .45, 0, r * .35); c.fill(); }
    function leaf(c, r) { c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, -r * .62, r, 0); c.quadraticCurveTo(0, r * .62, -r, 0); c.fill();
      c.strokeStyle = 'rgba(60,25,5,.35)'; c.lineWidth = .8; c.beginPath(); c.moveTo(-r * 1.15, 0); c.lineTo(r * .9, 0); c.stroke(); }
    function maple(c, r) { c.beginPath(); var pts = [[0,-1],[.18,-.55],[.55,-.7],[.42,-.3],[.9,-.2],[.5,.05],[.6,.35],[.15,.25],[.08,.6],[0,.95],[-.08,.6],[-.15,.25],[-.6,.35],[-.5,.05],[-.9,-.2],[-.42,-.3],[-.55,-.7],[-.18,-.55]];
      pts.forEach(function (p, j) { j ? c.lineTo(p[0] * r, p[1] * r) : c.moveTo(p[0] * r, p[1] * r); }); c.closePath(); c.fill(); }
    function bat(c, r, flap) { var w = .55 + .45 * Math.abs(Math.sin(flap)); c.fillStyle = '#21142c'; c.beginPath(); c.moveTo(-r, -r * .2 * w);
      c.quadraticCurveTo(-r * .55, -r * .55 * w, -r * .18, -r * .05); c.lineTo(0, -r * .28); c.lineTo(r * .18, -r * .05); c.quadraticCurveTo(r * .55, -r * .55 * w, r, -r * .2 * w);
      c.quadraticCurveTo(r * .5, 0, r * .32, r * .22); c.quadraticCurveTo(0, .02 * r, -r * .32, r * .22); c.quadraticCurveTo(-r * .5, 0, -r, -r * .2 * w); c.fill(); }
    function petal(c, r) { c.beginPath(); c.ellipse(0, 0, r * .55, r, 0, 0, 6.28); c.fill(); }

    function groundAt(x) { var i = Math.max(0, Math.min(pile.length - 1, Math.round(x / COL))); return pile[i]; }
    function deposit(x, amt, spread) {
      var i0 = Math.round(x / COL), cap = kind === 'snow' ? 20 : 22;
      for (var k = -spread; k <= spread; k++) { var j = i0 + k; if (j < 0 || j >= pile.length) continue;
        var w = 1 - Math.abs(k) / (spread + 1); pile[j] = Math.min(cap, pile[j] + amt * w); }
    }
    var landed = []; // leaves that have come to rest on the pile (drawn as part of it)

    /* Christmas string lights along the top of the hero */
    var bulbs = [];
    if (opts.lights) {
      var spans = Math.max(3, Math.round(W / 300)), sw = W / spans;
      for (var s = 0; s < spans; s++) for (var b = 1; b < 7; b++) {
        var tt = b / 7, x = s * sw + tt * sw, sag = 26 + (s % 2) * 6, y = 4 + sag * 4 * tt * (1 - tt);
        bulbs.push({ x: x, y: y, c: ['#ff4d5e', '#ffd34d', '#5fd38a', '#5fb4ff', '#ff9a4d'][(s * 6 + b) % 5], ph: Math.random() * 6.28, sp: .8 + Math.random() * 1.4 });
      }
    }
    function drawLights(now) {
      if (!bulbs.length) return;
      var spans = Math.max(3, Math.round(W / 300)), sw = W / spans;
      bx.strokeStyle = 'rgba(20,28,40,.75)'; bx.lineWidth = 1.4;
      for (var s = 0; s < spans; s++) { var sag = 26 + (s % 2) * 6; bx.beginPath(); bx.moveTo(s * sw, 4); bx.quadraticCurveTo(s * sw + sw / 2, 4 + sag * 2, (s + 1) * sw, 4); bx.stroke(); }
      bulbs.forEach(function (b) {
        var glow = .55 + .45 * Math.sin(now / 1000 * b.sp + b.ph);
        bx.save(); bx.translate(b.x, b.y);
        bx.fillStyle = '#2b2f36'; bx.fillRect(-2, -1, 4, 5);
        bx.shadowColor = b.c; bx.shadowBlur = 10 + 14 * glow; bx.globalAlpha = .7 + .3 * glow; bx.fillStyle = b.c;
        bx.beginPath(); bx.ellipse(0, 10, 3.6, 6, 0, 0, 6.28); bx.fill(); bx.restore();
      });
    }
    function drawPile(c) {
      if (!piles) return;
      if (kind === 'snow') {
        c.save(); c.beginPath(); c.moveTo(0, H);
        for (var i = 0; i < pile.length; i++) c.lineTo(i * COL, H - pile[i]);
        c.lineTo(W, H); c.closePath();
        var g = c.createLinearGradient(0, H - 50, 0, H); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dfe9f5');
        c.fillStyle = g; c.shadowColor = 'rgba(30,50,90,.35)'; c.shadowBlur = 10; c.shadowOffsetY = -2; c.fill(); c.restore();
        // sparkle on the drift surface
        c.save(); c.globalAlpha = .7; c.fillStyle = '#fff';
        for (var s = 3; s < pile.length; s += 7) { var tw = Math.abs(Math.sin(s * 78.233) * 43758.5453 % 1); if (pile[s] > 6 && ((performance.now() / 1000 + tw * 9) % 3) < .25) c.fillRect(s * COL, H - pile[s] + 2 + tw * 6, 1.6, 1.6); }
        c.restore();
      } else {
        landed.forEach(function (p) { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = .95; c.fillStyle = p.c; (kind === 'maple' ? maple : leaf)(c, p.r); c.restore(); });
      }
    }
    function drawPart(c, p, now) {
      c.save(); c.translate(p.x, p.y); c.globalAlpha = p.a; c.fillStyle = p.c;
      if (kind === 'snow') {
        if (p.z < .35) { c.shadowColor = 'rgba(255,255,255,.9)'; c.shadowBlur = 4; }
        c.beginPath(); c.arc(0, 0, p.r, 0, 6.28); c.fill();
      } else {
        c.rotate(p.rot);
        if (kind === 'confetti') { c.scale(1, Math.cos(p.flip)); c.fillRect(-p.r * .5, -p.r * .22, p.r, p.r * .44); }
        else if (kind === 'hearts') heart(c, p.r * .8);
        else if (kind === 'maple') { c.scale(Math.cos(p.flip), 1); maple(c, p.r); }
        else if (kind === 'petals') { c.scale(Math.cos(p.flip), 1); petal(c, p.r * .6); }
        else if (p.bat) { c.rotate(-p.rot); bat(c, p.r * 1.4, now / 120 + p.sway); }
        else { c.scale(Math.cos(p.flip), 1); leaf(c, p.r); }
      }
      c.restore();
    }
    function step(now) {
      var elapsed = (now - t0) / 1000;
      bx.clearRect(0, 0, W, H); fx.clearRect(0, 0, W, H);
      if (caps.length && (!anim.btAt || now - anim.btAt > 400)) { anim.bt = bookTop(); anim.btAt = now; }
      if (heapDirty) { caps.forEach(drawHeap); heapDirty = false; }
      drawLights(now);
      // cursor velocity decays
      mouse.vx *= .9; mouse.vy *= .9;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.sway += p.swaySp;
        // cursor: push nearby pieces away and give them some of the cursor's motion
        if (mouse.on) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, R = 120;
          if (d2 < R * R) { var d = Math.sqrt(d2) || 1, f = (1 - d / R) * (1.2 + p.z);
            p.px += dx / d * f + mouse.vx * .04 * (1 - d / R); p.py += dy / d * f + mouse.vy * .04 * (1 - d / R); }
        }
        p.px *= .94; p.py *= .94;
        if (p.bat) { p.x += (p.vx > 0 ? 1 : -1) * (.8 + p.z) + p.px; p.y += Math.sin(p.sway * 3) * .6 + p.py; }
        else { if (p.g) { p.vy = Math.min(7, p.vy + p.g); } p.x += p.vx + (p.g ? 0 : Math.sin(p.sway) * (kind === 'snow' ? .35 : .8)) + p.px; p.y += p.vy + p.py; }
        p.rot += p.vr; p.flip += .03 + p.z * .03;
        if (caps.length && p.vy > 0 && !p.clump) { var bt2 = anim.bt; if (bt2 && p.x > bt2.l + 2 && p.x < bt2.r - 2) { var u = (p.x - bt2.l) / (bt2.r - bt2.l), surf = bt2.t - heapAt(u);
          if (p.y > surf - 3 && p.y < surf + 9) { addHeap(u, 1.0 + p.r * .55); parts[i] = make(false); continue; } } }
        var ground = H - (piles ? groundAt(p.x) : 0);
        if (piles && !up && !p.bat && p.vy > 0 && p.y >= ground - p.r * .5 && p.x > 0 && p.x < W) {
          // settle: snow adds to the drift, leaves come to rest on top of the pile
          if (kind === 'snow') deposit(p.x, p.clump ? .06 : .1 + p.r * .04, 6);
          else { deposit(p.x, p.clump ? .4 : 1.1, 2); if (landed.length < 260) landed.push({ x: p.x, y: ground - 2, r: p.r * .9, rot: Math.random() * 6.28, c: p.c }); }
          if (p.clump) { parts.splice(i, 1); i--; } else parts[i] = make(false); continue;
        }
        if (p.y > H + 30 || p.y < -60 || p.x < -40 || p.x > W + 40) { if (p.clump) { parts.splice(i, 1); i--; } else parts[i] = make(false); continue; }
        drawPart(p.z > .72 ? fx : bx, p, now);
      }
      // the cursor ploughs through the drift: a smooth dent under it, snow pushed up ahead of it, and some kicked into the air
      if (piles && mouse.on) {
        var i0 = Math.round(mouse.x / COL), surfY = H - groundAt(mouse.x), sp = Math.min(1.5, Math.hypot(mouse.vx, mouse.vy) / 10);
        if (mouse.y > surfY - 22 && sp > .05) {
          // dust through it: thin the snow gently under the cursor and spread it thinly around, no ridges
          var R = 10, moved = 0;
          for (var k = -R; k <= R; k++) { var j = i0 + k; if (j < 0 || j >= pile.length) continue; var f = 1 - Math.abs(k) / (R + 1), take = pile[j] * .025 * f * sp; pile[j] -= take; moved += take; }
          var spread = 34, kept = moved * .7;
          for (var k2 = -spread; k2 <= spread; k2++) { if (Math.abs(k2) <= R) continue; var j2 = i0 + k2; if (j2 >= 0 && j2 < pile.length) pile[j2] += kept / (2 * (spread - R)); }
          if (kind === 'snow' && parts.length < density * 1.4) for (var kk = 0; kk < Math.min(3, moved * 3); kk++)
            parts.push({ x: mouse.x + (Math.random() - .5) * 24, y: surfY + 1, z: .85, r: .8 + Math.random() * 1.4, vy: -.6 - Math.random() * 1.4 * sp, g: .06, vx: 0,
              px: mouse.vx * .15 + (Math.random() - .5) * 1.5, py: 0, rot: 0, vr: 0, flip: 0, sway: Math.random() * 6, swaySp: .02, c: '#ffffff', a: .85, clump: true });
        }
        if (kind !== 'snow' && mouse.y > H - 60) landed = landed.filter(function (l) { var dx = l.x - mouse.x, dy = l.y - mouse.y;
          if (dx * dx + dy * dy < 900) { parts.push({ x: l.x, y: l.y - 4, z: .9, r: l.r, vy: -2 - Math.random() * 2, g: .08, vx: 0, px: (dx > 0 ? 1 : -1) * 2 + mouse.vx * .2, py: 0,
            rot: l.rot, vr: .1, flip: 0, sway: 0, swaySp: .02, c: l.c, a: .95, clump: true }); return false; } return true; });
      }
      // let drifts settle a little so they stay smooth
      for (var s = 1; s < pile.length - 1; s++) { var avg = (pile[s - 1] + pile[s + 1]) / 2; pile[s] += (avg - pile[s]) * .05; }
      drawPile(fx);
      if (!reduce) anim.raf = requestAnimationFrame(step);
    }
    function onMove(e) {
      var r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (mouse.on) { mouse.vx = x - mouse.x; mouse.vy = y - mouse.y; }
      mouse.x = x; mouse.y = y; mouse.on = true;
    }
    function onLeave() { mouse.on = false; }
    function onResize() { size(); }
    host.addEventListener('pointermove', onMove); host.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);
    anim = { raf: 0, stop: function () { cancelAnimationFrame(anim.raf); host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize); [back, front].forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); });
      caps.forEach(function (k) { if (k.cv.parentNode) k.cv.parentNode.removeChild(k.cv); }); if (bookEl) bookEl.removeEventListener('pointerenter', shakeOff); } };
    if (reduce) {
      // still picture: some flakes, a settled drift, and the lights
      for (var q = 0; q < pile.length; q++) pile[q] = kind === 'snow' ? 18 + 8 * Math.sin(q / 9) : 0;
      step(performance.now());
    } else anim.raf = requestAnimationFrame(step);
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
