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

  /* ---------- falling decorations ---------- */
  var anim = null;
  function startParticles(kind, host) {
    if (anim) { cancelAnimationFrame(anim.raf); if (anim.cv.parentNode) anim.cv.parentNode.removeChild(anim.cv); anim = null; }
    if (!kind || !host) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var cv = document.createElement('canvas'); cv.className = 'iu-fx'; cv.setAttribute('aria-hidden', 'true');
    host.appendChild(cv);
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), parts = [];
    var palettes = {
      snow: ['#ffffff'], confetti: ['#f6d67a', '#ffffff', '#e8b64a', '#9fb8e8'], hearts: ['#ff8fb1', '#ffd1de', '#e2557a'],
      petals: ['#ffd6e7', '#fff3b0', '#d8f0c8', '#e3d7ff'], maple: ['#d52b1e', '#ffffff'], leaves: ['#d9822b', '#b5602a', '#e8b04a', '#9c3d1a'],
      spooky: ['#ff9a3c', '#e46f1a', '#8a5cc2']
    };
    var cols = palettes[kind] || ['#fff'];
    function size() { W = host.clientWidth; H = host.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener('resize', size);
    var count = Math.round(Math.min(70, Math.max(24, W / 22)) * (kind === 'snow' ? 1 : .55));
    function make(initial) {
      var up = kind === 'hearts';
      return { x: Math.random() * W, y: initial ? Math.random() * H : (up ? H + 20 : -20),
        r: kind === 'snow' ? 1.2 + Math.random() * 2.6 : 5 + Math.random() * 6,
        vy: (up ? -1 : 1) * (kind === 'snow' ? .35 + Math.random() * .7 : .5 + Math.random() * .8),
        vx: (Math.random() - .5) * .4, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .04,
        sway: Math.random() * 6.28, c: cols[Math.floor(Math.random() * cols.length)], a: .55 + Math.random() * .4 };
    }
    for (var i = 0; i < count; i++) parts.push(make(true));
    function heart(r) { ctx.beginPath(); ctx.moveTo(0, r * .35); ctx.bezierCurveTo(-r, -r * .45, -r * .45, -r * 1.1, 0, -r * .45); ctx.bezierCurveTo(r * .45, -r * 1.1, r, -r * .45, 0, r * .35); ctx.fill(); }
    function leaf(r) { ctx.beginPath(); ctx.ellipse(0, 0, r, r * .5, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke(); }
    function maple(r) { ctx.beginPath(); var pts = [[0,-1],[.18,-.55],[.55,-.7],[.42,-.3],[.9,-.2],[.5,.05],[.6,.35],[.15,.25],[.08,.6],[0,.95],[-.08,.6],[-.15,.25],[-.6,.35],[-.5,.05],[-.9,-.2],[-.42,-.3],[-.55,-.7],[-.18,-.55]];
      pts.forEach(function (p, j) { j ? ctx.lineTo(p[0] * r, p[1] * r) : ctx.moveTo(p[0] * r, p[1] * r); }); ctx.closePath(); ctx.fill(); }
    function bat(r) { ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(-r * .55, -r * .45, -r * .2, -r * .1); ctx.lineTo(0, -r * .3); ctx.lineTo(r * .2, -r * .1);
      ctx.quadraticCurveTo(r * .55, -r * .45, r, 0); ctx.quadraticCurveTo(r * .5, -r * .05, r * .3, r * .25); ctx.quadraticCurveTo(0, 0, -r * .3, r * .25); ctx.quadraticCurveTo(-r * .5, -r * .05, -r, 0); ctx.fill(); }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p, j) {
        p.sway += .015; p.x += p.vx + Math.sin(p.sway) * (kind === 'snow' ? .3 : .6); p.y += p.vy; p.rot += p.vr;
        if (p.y > H + 24 || p.y < -24 || p.x < -30 || p.x > W + 30) parts[j] = make(false);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.a; ctx.fillStyle = p.c;
        if (kind === 'snow') { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.28); ctx.fill(); }
        else if (kind === 'confetti') ctx.fillRect(-p.r * .5, -p.r * .25, p.r, p.r * .5);
        else if (kind === 'hearts') heart(p.r);
        else if (kind === 'maple') maple(p.r);
        else if (kind === 'spooky') { if (j % 4 === 0) { ctx.fillStyle = '#2a1838'; ctx.rotate(-p.rot); bat(p.r * 1.3); } else leaf(p.r); }
        else leaf(p.r);
        ctx.restore();
      });
      anim.raf = requestAnimationFrame(frame);
    }
    anim = { cv: cv, raf: 0 }; frame();
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
    document.documentElement.classList.toggle('garland', key === 'christmas' && c.decorations !== false);
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
    startParticles(c.decorations && key !== 'classic' ? th.particles : '', hero);
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
