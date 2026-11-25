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
OB.products = () => _p || (_p = fetch('data/products.json').then(r => r.json()).then(list => {
  OB.P = list; OB.byS = {}; OB.groups = {};
  list.forEach(p => { OB.byS[p.s] = p; if (p.k) (OB.groups[p.k] = OB.groups[p.k] || []).push(p); });
  return list;
}));
OB.cats = () => _c || (_c = fetch('data/categories.json').then(r => r.json()).then(c => (OB.C = c)));
OB.inCat = (p, e) => {
  if (!e) return false;
  if (e.b && p.b !== e.b) return false;
  if (e.r === 'brand') return true;
  if (e.r === 'sale') return !!p.o || p.c.includes('outlet');
  const m = e._m || (e._m = new Set(e.m || []));
  return p.c.some(c => m.has(c));
};
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
  return `<article class="card" style="--i:${i}"><a class="c-img" href="produkt.html?p=${encodeURIComponent(p.s)}" tabindex="-1" aria-hidden="true">${OB.imgTag(p.i && p.i[0], '', null)}</a>${badge}<button class="fav" data-fav="${esc(p.s)}" aria-pressed="${fav}" aria-label="${fav ? 'Ta bort' : 'Spara'} ${esc(p.n)} ${fav ? 'från favoriter' : 'som favorit'}">${icon.heart}</button><div class="c-body"><span class="c-brand">${esc(p.b)}</span><h3 class="c-name"><a href="produkt.html?p=${encodeURIComponent(p.s)}">${esc(p.n)}</a></h3>${meta ? `<span class="c-meta">${esc(meta)}</span>` : '<span class="c-meta">&nbsp;</span>'}<div class="c-foot"><div class="c-price"><b class="${p.o ? 'sale' : ''}">${kr(p.p)}</b>${p.o ? `<span class="c-old">Rek. pris <s>${kr(p.o)}</s></span>` : OB.avail(p)}</div><button class="add" data-quick="${esc(p.s)}" aria-label="Lägg ${esc(p.n)} i varukorgen">${icon.plus}</button></div></div></article>`;
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
  return p ? { name: p.n, price: p.p, img: p.i && p.i[0], sub: l.z ? 'Storlek ' + l.z : '', p } : { name: l.n || l.s, price: l.pr || 0, img: l.im, sub: l.z ? 'Storlek ' + l.z : '' };
};
OB.cartTotal = () => cart.reduce((a, l) => a + OB.lineInfo(l).price * l.q, 0);
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
  $('#drFoot').style.display = n ? '' : 'none';
  list.innerHTML = n ? cart.map((l, i) => {
    const f = OB.lineInfo(l);
    const pic = l.g ? `<span class="gc">Present&shy;kort</span>` : (f.img ? `<img src="${esc(OB.img(f.img, 'small'))}" alt="" loading="lazy">` : '<span class="gc" style="background:#F3F3F4"></span>');
    const link = l.g ? `<span>${esc(f.name)}</span>` : `<a href="produkt.html?p=${encodeURIComponent(l.s)}">${esc(f.name)}</a>`;
    return `<div class="ln">${pic}<div class="ln-b"><div class="ln-t">${link}<b>${kr(f.price * l.q)}</b></div>${f.sub ? `<small>${esc(f.sub)}</small>` : ''}<div class="ln-c"><span class="qty"><button data-q="-1" data-i="${i}" aria-label="Minska antal">${icon.minus}</button><span>${l.q}</span><button data-q="1" data-i="${i}" aria-label="Öka antal">${icon.plusS}</button></span><button class="rmv" data-rm="${i}">Ta bort</button></div></div></div>`;
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
  $('#qkBody').innerHTML = `<div style="display:flex;gap:14px;align-items:center;padding:14px 0"><span style="width:76px;height:76px;flex:none;border-radius:14px;background:#F3F3F4;display:flex;overflow:hidden">${p.i && p.i[0] ? `<img src="${esc(OB.img(p.i[0], 'small'))}" alt="" style="width:100%;height:100%;object-fit:contain;padding:6px;mix-blend-mode:multiply">` : ''}</span><span style="display:flex;flex-direction:column;gap:2px"><span class="c-brand">${esc(p.b)}</span><b style="font-size:15px;line-height:1.3">${esc(p.n)}</b><span style="font-weight:800">${kr(p.p)}</span></span></div><p class="opt-h"><b>Välj storlek</b><a href="storleksguide.html">Storleksguide</a></p><div class="sizes" id="qkSizes">${p.z.map(z => `<button data-qz="${esc(z)}" aria-pressed="false">${esc(z)}</button>`).join('')}</div>`;
  ov.dataset.s = s; ov.dataset.z = '';
  $('#qkAdd').disabled = true; $('#qkAdd').textContent = 'Välj storlek';
  OB.open('quick');
};

/* ---------- sök ---------- */
const sIn = $('#sIn'), sGrid = $('#sGrid'), sHint = $('#sHint'), sCats = $('#sCats');
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let sT;
function renderSearch() {
  if (!sIn) return;
  const raw = sIn.value.trim(), q = norm(raw);
  if (!OB.P) { sHint.textContent = 'Laddar sortimentet…'; OB.products().then(renderSearch); return; }
  const terms = q.split(/\s+/).filter(Boolean);
  let r;
  if (terms.length) {
    r = [];
    for (const p of OB.P) {
      const h = p._h || (p._h = norm(p.n + ' ' + p.b + ' ' + (p.l || '') + ' ' + (OB.C ? p.c.map(c => OB.C[c] ? OB.C[c].n : '').join(' ') : '')));
      if (terms.every(t => h.includes(t))) { r.push(p); }
    }
    r.sort((a, b) => (norm(a.n).startsWith(terms[0]) ? 0 : 1) - (norm(b.n).startsWith(terms[0]) ? 0 : 1) || a.a - b.a);
  } else r = OB.P.filter(p => p.w).slice(-12).reverse();
  sHint.textContent = terms.length ? (r.length ? r.length + ' träffar för ”' + raw + '”' : 'Inga träffar för ”' + raw + '”. Prova ett märke, till exempel AGV, Alpinestars eller Falco.') : 'Nyheter i butiken';
  sGrid.innerHTML = r.slice(0, 24).map(p => `<a class="s-item" href="produkt.html?p=${encodeURIComponent(p.s)}">${p.i && p.i[0] ? `<img src="${esc(OB.img(p.i[0], 'tiny'))}" alt="" loading="lazy">` : '<span class="ph"></span>'}<span><b>${esc(p.n)}</b><small>${esc(p.b)} · ${kr(p.p)}</small></span></a>`).join('') + (r.length > 24 ? `<a class="btn b-red" href="kategori.html?q=${encodeURIComponent(raw)}" style="align-self:center">Visa alla ${r.length} träffar</a>` : '');
  if (sCats && OB.C && terms.length) {
    const cs = Object.entries(OB.C).filter(([k, c]) => !c.hidden && c.cnt && terms.every(t => norm(c.n).includes(t))).slice(0, 8);
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
