/* Onebike – gemensam logik för alla sidor: data, varukorg, favoriter, sök, meny, header, cookies, scroll. */
(() => {
'use strict';
const OB = window.OB = window.OB || {};
const $ = OB.$ = (s, c = document) => c.querySelector(s);
const $$ = OB.$$ = (s, c = document) => [...c.querySelectorAll(s)];
const html = document.documentElement;
const RM = OB.RM = html.classList.contains('rm');
const esc = OB.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kr = OB.kr = n => Math.round(n).toLocaleString('sv-SE') + ' kr';
const store = OB.store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const qs = OB.qs = () => new URLSearchParams(location.search);
const SHIP = OB.SHIP = 69;
OB.R = html.dataset.root || '';
OB.V = html.dataset.v ? '?v=' + html.dataset.v : '';   // versionsnyckel så att ny data inte fastnar i cachen           // '../' på engelska sidor (/en/)
OB.lang = html.lang === 'en' ? 'en' : 'sv';
const icon = OB.icon = {
  plus: '<svg class="ic" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" style="stroke-width:2.2"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14"/></svg>',
  plusS: '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  heart: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>',
  arrow: '<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  bag: '<svg class="ic" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  img: '<svg class="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/></svg>'
};

/* ---------- bilder ---------- */
const SW = 'https://cdn.starwebserver.se/shops/xbike/files/';
const DU = 'https://duellcdn-hrcgedh4hrdgbwg6.a03.azurefd.net/akeneo/';
const LV = 'https://sparkle-ride-shop.lovable.app';
OB.img = (p, size = 'medium') => {
  if (!p) return '';
  if (p.startsWith('~s/')) {
    const f = p.slice(3), m = f.match(/^(.*)\.(jpe?g|png|webp)$/i);
    return m ? SW + 'cache/' + m[1] + '_' + size + '.' + m[2] : SW + f;
  }
  if (p.startsWith('~d/')) return DU + p.slice(3);
  if (p.startsWith('/__l5e/')) return LV + p;
  if (p.startsWith(SW) && !p.includes('/cache/')) {
    const m = p.slice(SW.length).match(/^(.*)\.(jpe?g|png|webp)$/i);
    return m ? SW + 'cache/' + m[1] + '_' + size + '.' + m[2] : p;
  }
  return p;
};
OB.srcset = p => p && (p.startsWith('~s/') || (p.startsWith(SW) && !p.includes('/cache/'))) ? `${OB.img(p, 'small')} 500w, ${OB.img(p, 'medium')} 800w, ${OB.img(p, 'large')} 1000w` : '';
OB.imgTag = (p, alt, sizes, cls = '', eager = false) => {
  if (!p) return `<span class="noimg">${icon.img}</span>`;
  const ss = OB.srcset(p);
  return `<img src="${esc(OB.img(p))}"${ss ? ` srcset="${esc(ss)}" sizes="${sizes || '(min-width:1280px) 22vw,(min-width:700px) 30vw,48vw'}"` : ''} alt="${esc(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async"${cls ? ` class="${cls}"` : ''} onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:'noimg',innerHTML:OB.icon.img}))">`;
};

/* ---------- data ---------- */
let _p, _c;
OB.products = () => _p || (_p = fetch(OB.R + 'data/products.json' + OB.V).then(r => r.json()).then(list => {
  OB.P = list; OB.byS = {}; OB.groups = {};
  list.forEach(p => { OB.byS[p.s] = p; if (p.k) (OB.groups[p.k] = OB.groups[p.k] || []).push(p); });
  return list;
}));
OB.cats = () => _c || (_c = fetch(OB.R + 'data/categories.json' + OB.V).then(r => r.json()).then(c => {
  if (OB.R) Object.values(c).forEach(e => ['h', 'ci', 'lg'].forEach(k => { if (e[k] && /^assets\//.test(e[k])) e[k] = OB.R + e[k]; }));
  return (OB.C = c);
}));
OB.inCat = (p, e) => {
  if (!e) return false;
  if (e.b && p.b !== e.b) return false;
  if (e.r === 'brand') return true;
  if (e.r === 'sale') return !!p.o || p.c.includes('outlet');
  const m = e._m || (e._m = new Set(e.m || []));
  return p.c.some(c => m.has(c));
};
OB.pn = n => (OB._pn ? OB._pn(n) : n);
OB.HELMET = ['integralhjalmar', 'crosshjalm', 'mc-hjalmar', 'adventure-hjalmar', 'hjalmar', 'skoterhjalmar', 'oppningsbarhjalmar', 'barnhjalmar', 'mopedhjalmar', 'oppna-hjalmar'];
OB.isHelmet = p => !!p && p.c.some(c => OB.HELMET.includes(c)) && /hjälm/i.test(p.n) && !/visir|pinlock|huva|väska|kindkudd/i.test(p.n);
OB.avail = p => p.a === 1 ? '<span class="stock">I lager</span>' : p.a === 2 ? '<span class="stock lim">Få i lager</span>' : p.a === 3 ? '<span class="stock bo">Beställningsvara</span>' : '';
OB.pct = p => p.o ? Math.round((1 - p.p / p.o) * 100) : 0;

/* ---------- produktkort ---------- */
OB.card = (p, i = 0) => {
  const fav = !!favs[p.s];
  const pct = OB.pct(p);
  const badge = p.o ? `<span class="bdg o">−${pct}%</span>` : (p.w ? '<span class="bdg">Nyhet</span>' : '');
  const colors = p.k && OB.groups && OB.groups[p.k] && OB.groups[p.k].length > 1 ? OB.groups[p.k].length + ' färger' : '';
  const sz = p.z && p.z.length ? (p.z.length > 1 ? p.z[0] + '–' + p.z[p.z.length - 1] : p.z[0]) : '';
  const meta = [sz, colors].filter(Boolean).join(' · ');
  const fit = OB.fitsGarage ? OB.fitsGarage(p) : 0;
  const cmp = OB.isHelmet(p) ? `<button class="cmpb" data-cmp="${esc(p.s)}" aria-pressed="${!!(OB.cmpHas && OB.cmpHas(p.s))}" aria-label="Jämför ${esc(OB.pn(p.n))}" title="Jämför"><svg class="ic" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M8 4v16M16 4v16M4 8h8M12 16h8"/></svg></button>` : '';
  const name = OB.pn(p.n);
  return `<article class="card${fit === 2 ? ' fit' : ''}" style="--i:${i}"><a class="c-img" href="produkt.html?p=${encodeURIComponent(p.s)}" tabindex="-1" aria-hidden="true">${OB.imgTag(p.i && p.i[0], '', null)}</a>${badge}<button class="fav" data-fav="${esc(p.s)}" aria-pressed="${fav}" aria-label="${fav ? 'Ta bort' : 'Spara'} ${esc(name)} ${fav ? 'från favoriter' : 'som favorit'}">${icon.heart}</button>${cmp}${fit === 2 ? '<span class="bdg fitb">Passar din MC</span>' : ''}<div class="c-body"><span class="c-brand">${esc(p.b)}</span><h3 class="c-name"><a href="produkt.html?p=${encodeURIComponent(p.s)}">${esc(name)}</a></h3>${meta ? `<span class="c-meta">${esc(meta)}</span>` : '<span class="c-meta">&nbsp;</span>'}<div class="c-foot"><div class="c-price"><b class="${p.o ? 'sale' : ''}">${kr(p.p)}</b>${p.o ? `<span class="c-old">Rek. pris <s>${kr(p.o)}</s></span>` : OB.avail(p)}</div><button class="add" data-quick="${esc(p.s)}" aria-label="Lägg ${esc(name)} i varukorgen">${icon.plus}</button></div></div></article>`;
};

/* ---------- favoriter ---------- */
const favs = OB.favs = store.get('ob-favs', {});
const favCnt = $('#favCnt');
OB.renderFav = () => {
  const n = Object.keys(favs).length;
  if (favCnt) { favCnt.textContent = n; favCnt.classList.toggle('on', n > 0); }
  const fb = $('#favBtn'); if (fb) fb.setAttribute('aria-label', 'Favoriter, ' + n + ' sparade');
};
OB.toggleFav = (s, el) => {
  if (favs[s]) delete favs[s]; else favs[s] = Date.now();
  store.set('ob-favs', favs); OB.renderFav();
  $$(`[data-fav="${CSS.escape(s)}"]`).forEach(b => { b.setAttribute('aria-pressed', String(!!favs[s])); });
  if (el && !RM && el.animate) el.animate([{ transform: 'scale(.8)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 420 });
  document.dispatchEvent(new CustomEvent('ob:favs'));
};

/* ---------- varukorg ---------- */
const cart = OB.cart = store.get('ob-cart2', []);
const saveCart = () => { store.set('ob-cart2', cart); OB.renderCart(); document.dispatchEvent(new CustomEvent('ob:cart')); };
OB.cartCount = () => cart.reduce((a, l) => a + l.q, 0);
OB.lineInfo = l => {
  if (l.g) return { name: 'Presentkort ' + kr(l.g.amount), price: l.g.amount, img: null, sub: l.g.to ? 'Till ' + l.g.to : 'Digitalt presentkort' };
  const p = OB.byS && OB.byS[l.s];
  return p ? { name: OB.pn(p.n), price: p.p, img: p.i && p.i[0], sub: l.z ? 'Storlek ' + l.z : '', p } : { name: l.n || l.s, price: l.pr || 0, img: l.im, sub: l.z ? 'Storlek ' + l.z : '' };
};
OB.KIT = { pct: 10, min: 4 };  // kitrabatt: förslag – ändras här eller sätts till 0 innan lansering
OB.kitDiscount = () => {
  if (!OB.KIT.pct) return 0;
  const by = {}; cart.forEach(l => { if (l.kit && !l.g) (by[l.kit] = by[l.kit] || []).push(l); });
  let d = 0; Object.values(by).forEach(ls => { if (ls.length >= OB.KIT.min) d += ls.reduce((a, l) => a + OB.lineInfo(l).price * l.q, 0) * OB.KIT.pct / 100; });
  return Math.round(d);
};
OB.cartSub = () => cart.reduce((a, l) => a + OB.lineInfo(l).price * l.q, 0);
OB.cartTotal = () => OB.cartSub() - OB.kitDiscount();
OB.addToCart = (s, z, q = 1, extra) => {
  const p = OB.byS && OB.byS[s];
  let l = cart.find(x => x.s === s && (x.z || '') === (z || '') && !x.g);
  if (l) l.q += q; else { l = { s, z: z || '', q }; if (p) { l.n = p.n; l.pr = p.p; l.im = p.i && p.i[0]; } cart.push(l); }
  if (extra) Object.assign(l, extra);
  saveCart();
  OB.toast(p ? p.n + (z ? ' · ' + z : '') : 'Produkten');
  const c = $('#cartCnt'); if (c && c.animate && !RM) c.animate([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 380 });
};
OB.addGift = g => { cart.push({ s: 'presentkort-' + Date.now(), g, q: 1 }); saveCart(); OB.toast('Presentkort ' + kr(g.amount)); };
OB.renderCart = () => {
  const n = OB.cartCount(), sum = OB.cartTotal();
  const cc = $('#cartCnt'); if (cc) { cc.textContent = n; cc.classList.toggle('on', n > 0); }
  const cb = $('#cartBtn'); if (cb) cb.setAttribute('aria-label', 'Varukorg, ' + n + ' artiklar');
  const list = $('#drList'); if (!list) return;
  $('#drCnt').textContent = '(' + n + ')';
  $('#drSum').textContent = kr(sum);
  const kd = OB.kitDiscount(), kl = $('#drKit'); if (kl) { kl.hidden = !kd; kl.querySelector('b').textContent = '−' + kr(kd); }
  $('#drFoot').style.display = n ? '' : 'none';
  list.innerHTML = n ? cart.map((l, i) => {
    const f = OB.lineInfo(l);
    const pic = l.g ? `<span class="gc">Present&shy;kort</span>` : (f.img ? `<img src="${esc(OB.img(f.img, 'small'))}" alt="" loading="lazy">` : '<span class="gc" style="background:#F3F3F4"></span>');
    const link = l.g ? `<span>${esc(f.name)}</span>` : `<a href="produkt.html?p=${encodeURIComponent(l.s)}">${esc(f.name)}</a>`;
    return `<div class="ln">${pic}<div class="ln-b"><div class="ln-t">${link}<b>${kr(f.price * l.q)}</b></div>${f.sub ? `<small>${esc(f.sub)}</small>` : ''}${l.kit ? '<small class="kitt">Del av kit</small>' : ''}<div class="ln-c"><span class="qty"><button data-q="-1" data-i="${i}" aria-label="Minska antal">${icon.minus}</button><span>${l.q}</span><button data-q="1" data-i="${i}" aria-label="Öka antal">${icon.plusS}</button></span><button class="rmv" data-rm="${i}">Ta bort</button></div></div></div>`;
  }).join('') : `<div class="empty" style="border:0">${icon.bag.replace('class="ic"', 'class="ic" style="color:#A1A1A8"')}<p style="font-weight:700">Din varukorg är tom</p><a href="kategori.html?c=motorcykel" class="btn b-dark">Utforska sortimentet</a></div>`;
};

/* ---------- toast ---------- */
let tt;
OB.toast = (txt, head = 'Tillagd i varukorgen') => {
  const t = $('#toast'); if (!t) return;
  $('#toastH').textContent = head; $('#toastTxt').textContent = txt;
  t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3000);
};

/* ---------- överlägg ---------- */
let openOv = null, lastFocus = null;
OB.open = name => {
  const ov = $('#ov-' + name); if (!ov) return;
  if (openOv) OB.close(true);
  lastFocus = document.activeElement; ov.classList.add('open'); openOv = ov;
  document.body.classList.add('lock'); OB.lenis && OB.lenis.stop();
  $('#toast') && $('#toast').classList.remove('on');
  if (name === 'search') { OB.products(); setTimeout(() => $('#sIn').focus(), 40); renderSearch(); }
  else { const f = ov.querySelector('[data-autofocus]') || ov.querySelector('button,a,input'); f && f.focus({ preventScroll: true }); }
  document.dispatchEvent(new CustomEvent('ob:open', { detail: name }));
};
OB.close = silent => {
  if (!openOv) return;
  openOv.classList.remove('open'); openOv = null;
  document.body.classList.remove('lock'); OB.lenis && OB.lenis.start();
  if (!silent && lastFocus) lastFocus.focus({ preventScroll: true });
};
document.addEventListener('keydown', e => { if (e.key === 'Escape' && openOv) OB.close(); });

/* ---------- snabbköp (storleksval) ---------- */
OB.quick = s => {
  const p = OB.byS && OB.byS[s];
  if (!p) { location.href = 'produkt.html?p=' + encodeURIComponent(s); return; }
  if (!p.z || p.z.length <= 1) { OB.addToCart(s, p.z && p.z[0]); return; }
  const ov = $('#ov-quick');
  $('#qkBody').innerHTML = `<div style="display:flex;gap:14px;align-items:center;padding:14px 0"><span style="width:76px;height:76px;flex:none;border-radius:14px;background:#F3F3F4;display:flex;overflow:hidden">${p.i && p.i[0] ? `<img src="${esc(OB.img(p.i[0], 'small'))}" alt="" style="width:100%;height:100%;object-fit:contain;padding:6px;mix-blend-mode:multiply">` : ''}</span><span style="display:flex;flex-direction:column;gap:2px"><span class="c-brand">${esc(p.b)}</span><b style="font-size:15px;line-height:1.3">${esc(OB.pn(p.n))}</b><span style="font-weight:800">${kr(p.p)}</span></span></div><p class="opt-h"><b>Välj storlek</b><a href="storleksguide.html">Storleksguide</a></p><div class="sizes" id="qkSizes">${p.z.map(z => `<button data-qz="${esc(z)}" aria-pressed="false"${OB.mySizeFor && OB.mySizeFor(p, z) ? ' class="mine" title="Din sparade storlek"' : ''}>${esc(z)}</button>`).join('')}</div>`;
  ov.dataset.s = s; ov.dataset.z = '';
  $('#qkAdd').disabled = true; $('#qkAdd').textContent = 'Välj storlek';
  OB.open('quick');
};

/* ---------- smart sök: stavfel, synonymer (sv/en) och relevans ---------- */
const fold = OB.fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const SYN = { helmet: 'hjalm', helmets: 'hjalm', hjalmar: 'hjalm', lid: 'hjalm', jacket: 'jack', jackets: 'jack', jackor: 'jack', glove: 'handsk', gloves: 'handsk', boot: 'stovl', boots: 'stovl', shoes: 'sko', pants: 'byx', trousers: 'byx', visor: 'visir', shield: 'visir', goggle: 'glasogon', goggles: 'glasogon', protector: 'skydd', armour: 'skydd', armor: 'skydd', back: 'rygg', knee: 'kna', chest: 'brost', headset: 'intercom', snowmobile: 'skoter', sled: 'skoter', oil: 'olja', chain: 'kedj', lock: 'las', exhaust: 'avgas', kids: 'barn', youth: 'barn', junior: 'barn', women: 'dam', womens: 'dam', ladies: 'dam', lady: 'dam', men: 'herr', mens: 'herr', black: 'svart', white: 'vit', red: 'rod', blue: 'bla', grey: 'gra', gray: 'gra', yellow: 'gul', green: 'gron', pink: 'rosa', leather: 'skinn', rain: 'regn', winter: 'vinter', suit: 'stall', jersey: 'troj', shirt: 'troj', hoodie: 'hood', bag: 'vask', backpack: 'ryggsack', cleaner: 'rengor', clear: 'klar', smoke: 'rok', mirror: 'speg', motocross: 'cross', mx: 'cross', dirt: 'cross', modular: 'oppningsbar', flip: 'oppningsbar', fullface: 'integral', battery: 'batteri', charger: 'laddare', stand: 'stod', cover: 'kapell', tank: 'tank', phone: 'telefon', mount: 'fast', earplugs: 'oronpropp', neck: 'nack', elbow: 'armbag', shoulder: 'axel', vest: 'vast', underwear: 'understall', baselayer: 'understall' };
const dist = (a, b, max) => {  // begränsad Damerau-Levenshtein
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = []; for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) { let rmin = 1e9; for (let j = 1; j <= b.length; j++) { const c = a[i - 1] === b[j - 1] ? 0 : 1; let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c); if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 1); d[i][j] = v; if (v < rmin) rmin = v; } if (rmin > max) return max + 1; }
  return d[a.length][b.length];
};
let PW = null, VOC = null;
const prepSearch = () => {
  if (PW && PW.cats === !!OB.C) return;
  VOC = new Map();
  PW = OB.P.map(p => {
    const nm = fold(p.n + ' ' + p.b).split(/[^a-z0-9]+/).filter(Boolean);
    const ex = fold((p.l || '') + ' ' + (OB.C ? p.c.map(c => OB.C[c] ? OB.C[c].n : '').join(' ') : '')).split(/[^a-z0-9]+/).filter(Boolean);
    nm.concat(ex).forEach(w => VOC.set(w, (VOC.get(w) || 0) + 1));
    return { nm, ex, b: fold(p.b) };
  });
  PW.cats = !!OB.C;
};
OB.findProducts = raw => {
  if (!OB.P) return { r: [], fix: null };
  prepSearch();
  const terms = fold(raw).split(/[^a-z0-9]+/).filter(Boolean);
  if (!terms.length) return { r: [], fix: null };
  const fixes = [];
  const cands = terms.map(t => {
    const c = [t]; if (SYN[t]) c.push(SYN[t]);
    const has = [...VOC.keys()].some(w => c.some(x => w.startsWith(x) || (x.length > 3 && w.includes(x))));
    let fz = [];
    if (!has && t.length >= 4) {
      const max = t.length >= 7 ? 2 : 1; let best = null, bd = 9, bc = 0;
      for (const [w, n] of VOC) { if (w.length < 3) continue; const d1 = dist(t, w, max), d2 = w.length > t.length ? dist(t, w.slice(0, t.length), max) : 9; const dd = Math.min(d1, d2); if (dd <= max) { fz.push(w); if (dd < bd || (dd === bd && n > bc)) { best = w; bd = dd; bc = n; } } }
      if (best) fixes.push([t, best]);
    }
    return { c, fz: new Set(fz) };
  });
  const score = (W, k) => {
    let s = 0;
    const { c, fz } = cands[k];
    for (const w of W.nm) { for (const x of c) { if (w === x) s = Math.max(s, 6); else if (w.startsWith(x)) s = Math.max(s, 4); else if (x.length > 3 && w.includes(x)) s = Math.max(s, 2); } if (fz.has(w)) s = Math.max(s, 3); }
    if (s < 2) for (const w of W.ex) { for (const x of c) { if (w === x || w.startsWith(x)) s = Math.max(s, 2); else if (x.length > 3 && w.includes(x)) s = Math.max(s, 1); } if (fz.has(w)) s = Math.max(s, 1.5); }
    return s;
  };
  let r = [];
  OB.P.forEach((p, i) => { const W = PW[i]; let tot = 0; for (let k = 0; k < cands.length; k++) { const s = score(W, k); if (!s) { tot = -1; break; } tot += s; } if (tot > 0) { if (W.b === fold(raw).trim()) tot += 3; r.push([tot, p]); } });
  let loose = false;
  if (!r.length && terms.length > 1) {  // inga träffar på alla ord: visa närmaste
    loose = true;
    OB.P.forEach((p, i) => { let tot = 0; for (let k = 0; k < cands.length; k++) tot += score(PW[i], k); if (tot >= 4) r.push([tot, p]); });
  }
  r.sort((a, b) => b[0] - a[0] || (a[1].a === 3) - (b[1].a === 3) || a[1].x - b[1].x);
  const fix = fixes.length ? terms.map(t => (fixes.find(f => f[0] === t) || [t, t])[1]).join(' ') : null;
  return { r: r.map(x => x[1]), fix, loose };
};

/* ---------- sök ---------- */
const sIn = $('#sIn'), sGrid = $('#sGrid'), sHint = $('#sHint'), sCats = $('#sCats');
const norm = fold;
let sT;
function renderSearch() {
  if (!sIn) return;
  const raw = sIn.value.trim(), q = norm(raw);
  if (!OB.P || !OB.C) { sHint.textContent = 'Laddar sortimentet…'; Promise.all([OB.products(), OB.cats()]).then(renderSearch); return; }
  const terms = q.split(/\s+/).filter(Boolean);
  let r, fix = null, loose = false;
  if (terms.length) { const f = OB.findProducts(raw); r = f.r; fix = f.fix; loose = f.loose; }
  else r = OB.P.filter(p => p.w).slice(-12).reverse();
  sHint.innerHTML = terms.length ? (r.length ? `${r.length} ${loose ? 'närliggande träffar' : 'träffar'} för ”${esc(raw)}”` + (fix && fold(fix) !== q ? ` · Menade du <button class="fixq" data-fixq="${esc(fix)}">${esc(fix)}</button>?` : '') : 'Inga träffar för ”' + esc(raw) + '”. Prova ett märke, till exempel AGV, Alpinestars eller Falco.') : 'Nyheter i butiken';
  sGrid.innerHTML = r.slice(0, 24).map(p => `<a class="s-item" href="produkt.html?p=${encodeURIComponent(p.s)}">${p.i && p.i[0] ? `<img src="${esc(OB.img(p.i[0], 'tiny'))}" alt="" loading="lazy">` : '<span class="ph"></span>'}<span><b>${esc(OB.pn(p.n))}</b><small>${esc(p.b)} · ${kr(p.p)}</small></span></a>`).join('') + (r.length > 24 ? `<a class="btn b-red" href="kategori.html?q=${encodeURIComponent(raw)}" style="align-self:center">Visa alla ${r.length} träffar</a>` : '');
  if (sCats && OB.C && terms.length) {
    const cs = Object.entries(OB.C).filter(([k, c]) => !c.hidden && c.cnt && terms.every(t => norm(c.n).includes(t) || (SYN[t] && norm(c.n).includes(SYN[t])))).slice(0, 8);
    sCats.innerHTML = cs.map(([k, c]) => `<a href="kategori.html?c=${encodeURIComponent(k)}">${esc(c.n)} <small style="color:#8E8E95;margin-left:6px">${c.cnt}</small></a>`).join('');
  } else if (sCats) sCats.innerHTML = '';
}
if (sIn) {
  sIn.addEventListener('input', () => { clearTimeout(sT); sT = setTimeout(renderSearch, 90); });
  sIn.addEventListener('keydown', e => { if (e.key === 'Enter' && sIn.value.trim()) location.href = 'kategori.html?q=' + encodeURIComponent(sIn.value.trim()); });
  OB.cats();
}

/* ---------- klick ---------- */
document.addEventListener('click', e => {
  const el = e.target;
  const fq = el.closest('[data-fixq]'); if (fq) { sIn.value = fq.dataset.fixq; renderSearch(); sIn.focus(); return; }
  const quick = el.closest('[data-quick]'); if (quick) { e.preventDefault(); OB.products().then(() => OB.quick(quick.dataset.quick)); return; }
  const fav = el.closest('[data-fav]'); if (fav) { e.preventDefault(); OB.toggleFav(fav.dataset.fav, fav); return; }
  const qz = el.closest('[data-qz]'); if (qz) { const ov = $('#ov-quick'); ov.dataset.z = qz.dataset.qz; $$('#qkSizes button').forEach(b => b.setAttribute('aria-pressed', String(b === qz))); $('#qkAdd').disabled = false; $('#qkAdd').textContent = 'Lägg i varukorgen'; return; }
  if (el.closest('#qkAdd')) { const ov = $('#ov-quick'); if (ov.dataset.z) { OB.close(true); OB.addToCart(ov.dataset.s, ov.dataset.z); } return; }
  const q = el.closest('[data-q]'); if (q) { const l = cart[+q.dataset.i]; if (l) { l.q = Math.max(0, l.q + Number(q.dataset.q)); if (!l.q) cart.splice(+q.dataset.i, 1); saveCart(); } return; }
  const rm = el.closest('[data-rm]'); if (rm) { cart.splice(+rm.dataset.rm, 1); saveCart(); return; }
  const op = el.closest('[data-open]'); if (op) { e.preventDefault(); if (op.dataset.open === 'cart') OB.products().then(OB.renderCart); OB.open(op.dataset.open); return; }
  const ck = el.closest('[data-ck]'); if (ck) { const v = ck.dataset.ck; if (v === 'show') { $('#ck').classList.add('on'); return; } store.set('ob-ck', v); $('#ck').classList.remove('on'); document.dispatchEvent(new CustomEvent('ob:consent', { detail: v })); return; }
  const mmt = el.closest('[data-mm]'); if (mmt) { const li = mmt.closest('li'); li.classList.toggle('open'); mmt.setAttribute('aria-expanded', String(li.classList.contains('open'))); return; }
  if (el.closest('[data-close]')) { if (!el.closest('a[href]')) e.preventDefault(); OB.close(); return; }
  const a = el.closest('a[href^="#"]');
  if (a && a.getAttribute('href').length > 1) { const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) { e.preventDefault(); OB.goTo(t); } }
});
OB.goTo = (t, off = 0) => {
  if (OB.lenis) OB.lenis.scrollTo(t, { offset: off, duration: 1.2 });
  else { const y = t.getBoundingClientRect().top + scrollY + off; scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }); }
};

/* ---------- nyhetsbrev & kontakt via e-post ---------- */
$$('form[data-mail]').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault();
  const mail = f.querySelector('input[type=email]');
  const msg = f.parentElement.querySelector('.msg') || f.querySelector('.msg');
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { if (msg) msg.textContent = 'Ange en giltig e-postadress.'; mail.focus(); return; }
  const kind = f.dataset.mail;
  let subject = 'Prenumerera på Onebikes nyhetsbrev', body = 'Hej! Jag vill prenumerera på nyhetsbrevet.\n\nE-post: ' + (mail ? mail.value.trim() : '');
  if (kind === 'contact') {
    const g = n => (f.elements[n] ? f.elements[n].value.trim() : '');
    subject = g('subject') || 'Fråga till Onebike';
    body = g('message') + '\n\n' + g('name') + '\n' + g('email');
  }
  location.href = 'mailto:info@onebike.se?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  if (msg) msg.textContent = 'Ditt e-postprogram öppnas med meddelandet ifyllt – tryck på skicka där.';
}));

/* ---------- header ---------- */
const hdr = $('#hdr'), prog = $('#prog');
let lastY = scrollY, ticking = false;
const over = hdr && hdr.classList.contains('over');
function onScroll() {
  const y = scrollY;
  if (hdr) {
    if (over) hdr.classList.toggle('solid', y > 30);
    const down = y > lastY && y > 140;
    const hide = down && !openOv && !hdr.matches(':hover') && !hdr.contains(document.activeElement) && !document.body.classList.contains('no-hide');
    hdr.classList.toggle('hide', hide);
    document.body.classList.toggle('hdr-hidden', hide);
    if (prog) { const h = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h).toFixed(4) : 0})`; }
  }
  lastY = y; ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

/* ---------- reveal ---------- */
OB.reveal = (root = document) => {
  const els = $$('[data-rv]:not(.in)', root);
  if (RM || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  OB._io = OB._io || new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); OB._io.unobserve(en.target); } }), { rootMargin: '0px 0px -10% 0px' });
  els.forEach(el => OB._io.observe(el));
};

/* ---------- mjuk scroll (Lenis, bara mus/styrplatta) ---------- */
if (!RM && window.Lenis && matchMedia('(pointer:fine)').matches) {
  try {
    OB.lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1, prevent: n => !!(n.closest && n.closest('[data-lenis-prevent],.p-b,.side,.search-p,.menu-p,.rail,.circles,select')) });
    const raf = t => { OB.lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  } catch (e) { OB.lenis = null; }
}

/* ---------- cookies ---------- */
const ckEl = $('#ck');
if (ckEl && !store.get('ob-ck', null)) ckEl.classList.add('on');

/* ---------- start ---------- */
OB.renderFav();
OB.renderCart();
if (cart.length) OB.products().then(OB.renderCart);
OB.reveal();
})();
