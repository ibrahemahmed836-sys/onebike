/* Onebike – kategori-, märkes-, sök-, nyhets- och reservdelslistor med filter. */
(() => {
'use strict';
const OB = window.OB, { $, $$, esc, kr } = OB;
const MODE = document.body.dataset.list || 'cat';
const PER = 24;
const P0 = OB.qs();
const S = {
  c: P0.get('c') || (MODE === 'new' ? '' : MODE === 'parts' ? 'reservdelar' : ''),
  q: P0.get('q') || '',
  b: new Set((P0.get('b') || '').split(',').filter(Boolean)),
  z: new Set((P0.get('z') || '').split(',').filter(Boolean)),
  f: new Set((P0.get('f') || '').split(',').filter(Boolean)),
  a: P0.get('a') === '1',
  min: P0.get('min') || '', max: P0.get('max') || '',
  sort: P0.get('sort') || (MODE === 'new' ? 'new' : 'pop'),
  bike: P0.get('mc') || (MODE === 'parts' && !P0.has('mc') && OB.garage() ? OB.garage().make : ''),
  g: new Set((P0.get('sk') || '').split(',').filter(Boolean)),
  shown: PER
};
const SIZE_ORDER = ['3XS','2XS','XXS','XS','S','S/M','M','M/L','L','L/XL','XL','2XL','XXL','3XL','XXXL','4XL','5XL','6XL'];
const sizeKey = z => { const i = SIZE_ORDER.indexOf(z.toUpperCase()); if (i >= 0) return [0, i]; const n = parseFloat(z.replace(',', '.')); return isNaN(n) ? [2, z] : [1, n]; };
const cmpSize = (a, b) => { const A = sizeKey(a), B = sizeKey(b); return A[0] - B[0] || (A[1] < B[1] ? -1 : A[1] > B[1] ? 1 : 0); };
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const BIKES = ['BMW','Ducati','Honda','Husqvarna','Kawasaki','KTM','Suzuki','Triumph','Yamaha','Aprilia','Harley-Davidson','Beta','GasGas','Sherco','TM'];

let C, P, base = [], cat = null, view = [];

function setUrl() {
  const u = new URLSearchParams();
  if (S.c && MODE === 'cat') u.set('c', S.c);
  if (S.q) u.set('q', S.q);
  if (S.b.size) u.set('b', [...S.b].join(','));
  if (S.z.size) u.set('z', [...S.z].join(','));
  if (S.f.size) u.set('f', [...S.f].join(','));
  if (S.a) u.set('a', '1');
  if (S.min) u.set('min', S.min);
  if (S.max) u.set('max', S.max);
  if (S.bike) u.set('mc', S.bike);
  if (S.g.size) u.set('sk', [...S.g].join(','));
  if (S.sort !== (MODE === 'new' ? 'new' : 'pop')) u.set('sort', S.sort);
  const str = u.toString();
  history.replaceState(null, '', location.pathname + (str ? '?' + str : ''));
}

function crumbsFor(slug) {
  const out = []; let s = C[slug] && C[slug].pa, guard = 0;
  while (s && C[s] && guard++ < 6) { out.unshift(s); s = C[s].pa; }
  return out;
}

function buildBase() {
  if (MODE === 'new') { base = P.filter(p => p.w); return; }
  if (S.q) { const f = OB.findProducts(S.q); base = f.r; S.fix = f.fix; S.loose = f.loose; return; }
  cat = C[S.c] || null;
  base = cat ? P.filter(p => OB.inCat(p, cat)) : P.slice();
}

function passes(p, skip) {
  if (skip !== 'b' && S.b.size && !S.b.has(p.b)) return false;
  if (skip !== 'z' && S.z.size && !(p.z && p.z.some(z => S.z.has(z)))) return false;
  if (skip !== 'f' && S.f.size && !S.f.has(p.f || 'Övriga')) return false;
  if (skip !== 'a' && S.a && !(p.a === 1 || p.a === 2)) return false;
  if (skip !== 'p') {
    if (S.min && p.p < +S.min) return false;
    if (S.max && p.p > +S.max) return false;
  }
  if (skip !== 'mc' && S.bike && !norm(p.n).includes(norm(S.bike)) && !(OB.garage() && OB.garage().make === S.bike && OB.fitsGarage(p) === 2)) return false;
  if (skip !== 'g' && S.g.size && ![...S.g].every(k => hasTag(p, k))) return false;
  return true;
}

const TAGF = [['e6', 'ECE 22.06'], ['pl', 'Pinlock'], ['sv', 'Inbyggt solvisir'], ['ic', 'Intercom-redo'], ['mp', 'MIPS'], ['cf', 'Kolfiberskal'], ['gf', 'Kompositskal'], ['pc', 'Termoplastskal'], ['cAAA', 'EN 17092 klass AAA'], ['cAA', 'EN 17092 klass AA'], ['cA', 'EN 17092 klass A'], ['l2', 'Skydd nivå 2'], ['l1', 'Skydd nivå 1']];
function hasTag(p, k) { if (k[0] === 'c' && k.length > 1 && k !== 'cf') return p.cl === k.slice(1); if (k[0] === 'l' && k.length === 2) return p.lv === +k[1]; return !!(p.tg && p.tg.includes(k)); }
function sortList(list) {
  const s = S.sort;
  if (S.q && s === 'pop') return list.slice();
  if (MODE === 'parts' && s === 'pop' && OB.garage()) return list.slice().sort((a, b) => OB.fitsGarage(b) - OB.fitsGarage(a) || (a.a === 3) - (b.a === 3) || a.x - b.x);
  const by = {
    pop: (a, b) => (a.a === 3) - (b.a === 3) || a.x - b.x,
    new: (a, b) => b.x - a.x,
    pa: (a, b) => a.p - b.p, pd: (a, b) => b.p - a.p,
    az: (a, b) => a.n.localeCompare(b.n, 'sv'),
    sale: (a, b) => OB.pct(b) - OB.pct(a)
  }[s] || ((a, b) => a.x - b.x);
  return list.slice().sort(by);
}

function facet(skip, keyFn) {
  const m = new Map();
  for (const p of base) { if (!passes(p, skip)) continue; for (const k of keyFn(p)) if (k) m.set(k, (m.get(k) || 0) + 1); }
  return m;
}

function filtersHTML(id) {
  const brands = facet('b', p => [p.b]);
  const sizes = facet('z', p => p.z || []);
  const cols = facet('f', p => [p.f || 'Övriga']);
  const inStock = base.filter(p => passes(p, 'a') && (p.a === 1 || p.a === 2)).length;
  const bl = [...new Set([...brands.keys(), ...S.b])].sort((a, b) => a.localeCompare(b, 'sv'));
  const sl = [...new Set([...sizes.keys(), ...S.z])].sort(cmpSize);
  const cl = [...new Set([...cols.keys(), ...S.f])].sort((a, b) => (a === 'Övriga') - (b === 'Övriga') || a.localeCompare(b, 'sv'));
  const chev = '<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const grp = (key, title, body, closed) => `<div class="fgrp${closed ? ' closed' : ''}" data-g="${key}"><button type="button" aria-expanded="${!closed}">${title}${chev}</button><div class="fbody">${body}</div></div>`;
  let h = '';
  if (MODE === 'parts') {
    h += grp('mc', 'Din motorcykel', `<div class="fsizes">${BIKES.map(b => `<button type="button" data-fbike="${esc(b)}" aria-pressed="${S.bike === b}">${esc(b)}</button>`).join('')}</div>`);
  }
  if (bl.length > 1 || S.b.size) h += grp('b', 'Varumärke', `${bl.length > 8 ? `<input class="fsearch" type="search" placeholder="Sök märke" data-fsearch aria-label="Sök varumärke">` : ''}${bl.map(b => `<label class="fopt" data-name="${esc(norm(b))}"><input type="checkbox" data-fb="${esc(b)}" ${S.b.has(b) ? 'checked' : ''}><span>${esc(b)}</span><small>${brands.get(b) || 0}</small></label>`).join('')}`);
  const tg = facet('g', p => TAGF.map(([k]) => hasTag(p, k) ? k : null));
  const tl = TAGF.filter(([k]) => tg.get(k) || S.g.has(k));
  if (tl.length) h += grp('g', 'Skydd &amp; funktioner', tl.map(([k, t]) => `<label class="fopt"><input type="checkbox" data-fg="${k}" ${S.g.has(k) ? 'checked' : ''}><span>${t}</span><small>${tg.get(k) || 0}</small></label>`).join(''), !S.g.size && base.length > 400);
  h += grp('a', 'Tillgänglighet', `<label class="fopt"><input type="checkbox" data-fa ${S.a ? 'checked' : ''}><span>Endast i lager</span><small>${inStock}</small></label>`);
  if (sl.length) h += grp('z', 'Storlek', `<div class="fsizes">${sl.slice(0, 60).map(z => `<button type="button" data-fz="${esc(z)}" aria-pressed="${S.z.has(z)}">${esc(z)}</button>`).join('')}</div>`, sl.length > 40 && !S.z.size);
  if (cl.length > 1) h += grp('f', 'Färg', cl.map(c => `<label class="fopt"><input type="checkbox" data-ff="${esc(c)}" ${S.f.has(c) ? 'checked' : ''}><span>${esc(c === 'Övriga' ? 'Övriga / flerfärgad' : c)}</span><small>${cols.get(c) || 0}</small></label>`).join(''), !S.f.size);
  h += grp('p', 'Pris', `<div class="fprice"><input inputmode="numeric" pattern="[0-9]*" placeholder="Från kr" value="${esc(S.min)}" data-fmin aria-label="Lägsta pris"><input inputmode="numeric" pattern="[0-9]*" placeholder="Till kr" value="${esc(S.max)}" data-fmax aria-label="Högsta pris"></div><div class="fsizes" style="margin-top:8px">${[['', '1500', 'Under 1 500 kr'], ['1500', '4000', '1 500 – 4 000 kr'], ['4000', '8000', '4 000 – 8 000 kr'], ['8000', '', 'Över 8 000 kr']].map(([a, b, t]) => `<button type="button" data-fp="${a}|${b}" aria-pressed="${S.min === a && S.max === b}">${t}</button>`).join('')}</div>`);
  return h;
}

function activeHTML() {
  const x = [];
  S.b.forEach(b => x.push(['b', b, b]));
  S.z.forEach(z => x.push(['z', z, 'Storlek ' + z]));
  S.f.forEach(f => x.push(['f', f, f]));
  if (S.a) x.push(['a', '1', 'I lager']);
  if (S.min || S.max) x.push(['p', '', (S.min ? kr(+S.min) : '0 kr') + ' – ' + (S.max ? kr(+S.max) : '…')]);
  if (S.bike) x.push(['mc', S.bike, S.bike]);
  S.g.forEach(k => x.push(['g', k, (TAGF.find(t => t[0] === k) || [k, k])[1]]));
  if (!x.length) return '';
  return x.map(([k, v, t]) => `<button class="chip on" data-x="${k}" data-v="${esc(v)}">${esc(t)} <svg class="ic" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`).join('') + `<button class="chip" data-x="all">Rensa alla</button>`;
}
const nActive = () => S.b.size + S.z.size + S.f.size + S.g.size + (S.a ? 1 : 0) + (S.min || S.max ? 1 : 0) + (S.bike ? 1 : 0);

function renderFilters() {
  const h = filtersHTML();
  const side = $('#side'), fs = $('#fsBody');
  // behåll stängda/öppna grupper
  const closed = new Set($$('.fgrp.closed', side || document).map(g => g.dataset.g));
  if (side) { side.innerHTML = `<p style="font-weight:800;font-size:18px;font-stretch:118%;padding-bottom:6px">Filtrera</p>` + h; }
  if (fs) fs.innerHTML = h;
  if (closed.size && side) $$('.fgrp', side).forEach(g => g.classList.toggle('closed', closed.has(g.dataset.g)));
  const n = nActive();
  $$('.fbtn .n').forEach(e => { e.textContent = n; e.classList.toggle('on', n > 0); });
  $('#activef').innerHTML = activeHTML();
}

function renderGrid(reset) {
  const grid = $('#grid');
  if (reset) S.shown = PER;
  const slice = view.slice(0, S.shown);
  grid.innerHTML = slice.length ? slice.map((p, i) => OB.card(p, i)).join('') : `<div class="empty" style="grid-column:1/-1"><p class="h3">Inga produkter matchar</p><p class="mut">Prova att ta bort ett filter eller sök på något annat.</p>${nActive() ? '<button class="btn b-dark" data-x="all">Rensa filter</button>' : '<a class="btn b-dark" href="kategorier.html">Alla kategorier</a>'}</div>`;
  const more = $('#more');
  if (view.length > S.shown) {
    more.innerHTML = `<p class="mut tnum" style="font-size:14px">Visar ${slice.length} av ${view.length} produkter</p><span class="bar"><i style="width:${(slice.length / view.length * 100).toFixed(1)}%"></i></span><button class="btn b-line" id="moreBtn">Visa fler produkter</button>`;
    more.hidden = false;
  } else { more.innerHTML = view.length ? `<p class="mut tnum" style="font-size:14px">Visar alla ${view.length} produkter</p>` : ''; }
}

function apply(resetGrid = true) {
  view = sortList(base.filter(p => passes(p)));
  const c = $('#count'); if (c) c.textContent = view.length.toLocaleString('sv-SE') + ' produkter';
  $$('[data-showcount]').forEach(e => e.textContent = 'Visa ' + view.length.toLocaleString('sv-SE') + ' produkter');
  renderFilters(); renderGrid(resetGrid); setUrl();
}

/* ---------- huvud ---------- */
function heroCat() {
  const hero = $('#hero');
  let title = 'Sortiment', intro = '', img = null, crumbs = [], label = 'Onebike / Ride with us', logo = null, logoInv = false;
  if (MODE === 'new') { title = 'Nyheter'; intro = 'Det senaste från utvalda kvalitetsmärken – nya hjälmar, kläder, stövlar och tillbehör.'; label = 'Nytt i butiken'; }
  else if (S.q) { title = 'Sökresultat'; intro = S.loose ? `Inga produkter matchade alla ord i ”${S.q}” – här är de närmaste träffarna.` : `${base.length.toLocaleString('sv-SE')} produkter matchar ”${S.q}”.`; label = 'Sök'; }
  else if (cat) {
    title = cat.n; intro = OB.lang === 'en' ? '' : (cat.i || cat.d || ''); img = cat.h || null; crumbs = crumbsFor(S.c);
    if (cat.r === 'brand' && cat.lg) { logo = cat.lg; logoInv = !!cat.inv; }
    document.title = (cat.t || cat.n) + ' | Onebike';
    const md = $('meta[name=description]'); if (md && cat.d) md.setAttribute('content', cat.d);
  } else if (S.c) { title = 'Kategorin hittades inte'; intro = 'Den här kategorin finns inte längre. Utforska hela sortimentet i stället.'; }
  if (MODE === 'cat' && S.q) document.title = 'Sök: ' + S.q + ' | Onebike';
  hero.classList.toggle('plain', !img);
  hero.innerHTML = `${img ? `<div class="bg"><img src="${esc(img)}" alt="" fetchpriority="high"></div>` : ''}<div class="wrap in"><nav class="crumbs" aria-label="Brödsmulor"><a href="index.html">Hem</a><span aria-hidden="true">/</span><a href="kategorier.html">Sortiment</a>${crumbs.map(s => `<span aria-hidden="true">/</span><a href="kategori.html?c=${encodeURIComponent(s)}">${esc(C[s].n)}</a>`).join('')}<span aria-hidden="true">/</span><span aria-current="page">${esc(title)}</span></nav><p class="lbl" style="color:#fff">${esc(label)}</p>${logo ? `<img src="${esc(logo)}" alt="${esc(title)}" style="height:56px;width:auto;max-width:220px;object-fit:contain;object-position:left;${logoInv ? 'filter:invert(1)' : ''}">` : ''}<h1 class="h1">${esc(title)}</h1>${intro ? `<p class="i">${esc(intro)}</p>` : ''}${S.q && S.fix && norm(S.fix) !== norm(S.q) ? `<p class="i">Menade du <a href="kategori.html?q=${encodeURIComponent(S.fix)}" style="text-decoration:underline;color:#fff;font-weight:700">${esc(S.fix)}</a>?</p>` : ''}<p class="cnt-l tnum">${base.length.toLocaleString('sv-SE')} produkter</p></div>`;
}

function circlesHTML() {
  if (MODE !== 'cat' || S.q || !cat) return '';
  let list = (cat.ch || []).filter(s => C[s] && C[s].cnt);
  let current = null;
  if (!list.length && cat.pa && C[cat.pa]) { list = (C[cat.pa].ch || []).filter(s => C[s] && C[s].cnt); current = S.c; }
  if (cat.r === 'brand') {
    const m = new Map();
    for (const p of base) for (const c of p.c) m.set(c, (m.get(c) || 0) + 1);
    const top = Object.entries(C).filter(([k, c]) => c.ci && !c.b && m.get(k) && c.r === 'cat').map(([k]) => k).sort((a, b) => m.get(b) - m.get(a)).slice(0, 12);
    return top.map(k => `<a href="kategori.html?c=${encodeURIComponent(k)}&b=${encodeURIComponent(cat.b)}"><img src="${esc(C[k].ci)}" alt="" loading="lazy"><span>${esc(C[k].n)}</span></a>`).join('');
  }
  if (!list.length) return '';
  const ph = n => `<span class="ph">${esc(n.slice(0, 2))}</span>`;
  const items = list.map(s => `<a href="kategori.html?c=${encodeURIComponent(s)}"${s === current ? ' aria-current="page" style="color:#0B0B0C"' : ''}>${C[s].ci ? `<img src="${esc(C[s].ci)}" alt="" loading="lazy"${s === current ? ' style="border-color:#E11D26"' : ''}>` : ph(C[s].n)}<span>${esc(C[s].n)}</span></a>`).join('');
  const all = current ? `<a href="kategori.html?c=${encodeURIComponent(cat.pa)}" class="all"><span class="ph">Alla</span><span>Visa alla</span></a>` : '';
  return all + items;
}

function partsHTML() {
  const P2 = [['Avgassystem', 'parts-exhaust', 'avgasror', true], ['Bromssystem', 'parts-brakes', '', false], ['Kedja & drev', 'parts-chain', '', false], ['Filter & service', 'parts-service', '', false], ['Belysning & el', 'parts-lights', '', false], ['Fjädring', 'parts-suspension', '', false], ['Garage', 'parts-garage-3', 'depa-garage', true]];
  return P2.map(([n, img, slug, live]) => `<${live ? `a href="kategori.html?c=${slug}"` : 'div'} class="part" style="position:relative;flex:none;width:min(62vw,240px);aspect-ratio:4/3;border-radius:18px;overflow:hidden;background:#151518;color:#fff;scroll-snap-align:start;display:block"><img src="${OB.R}assets/lv/${img}.webp" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${live ? '' : 'filter:grayscale(1) brightness(.55)'}"><span style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.8))"></span><span style="position:absolute;left:16px;right:16px;bottom:14px;display:flex;flex-direction:column;gap:2px"><b style="font-size:18px;font-stretch:118%">${n}</b><small style="font-size:13px;color:${live ? '#86EFAC' : '#A1A1A8'}">${live ? 'Finns nu' : 'Kommer snart'}</small></span></${live ? 'a' : 'div'}>`).join('');
}

/* ---------- händelser ---------- */
function onFilterClick(e) {
  const t = e.target;
  const g = t.closest('.fgrp>button'); if (g) { const gr = g.parentElement; gr.classList.toggle('closed'); g.setAttribute('aria-expanded', String(!gr.classList.contains('closed'))); return; }
  const fz = t.closest('[data-fz]'); if (fz) { const z = fz.dataset.fz; S.z.has(z) ? S.z.delete(z) : S.z.add(z); apply(); return; }
  const fp = t.closest('[data-fp]'); if (fp) { const [a, b] = fp.dataset.fp.split('|'); if (S.min === a && S.max === b) { S.min = ''; S.max = ''; } else { S.min = a; S.max = b; } apply(); return; }
  const fbk = t.closest('[data-fbike]'); if (fbk) { S.bike = S.bike === fbk.dataset.fbike ? '' : fbk.dataset.fbike; apply(); return; }
}
function onFilterChange(e) {
  const t = e.target;
  if (t.matches('[data-fb]')) { t.checked ? S.b.add(t.dataset.fb) : S.b.delete(t.dataset.fb); apply(); }
  else if (t.matches('[data-ff]')) { t.checked ? S.f.add(t.dataset.ff) : S.f.delete(t.dataset.ff); apply(); }
  else if (t.matches('[data-fa]')) { S.a = t.checked; apply(); }
  else if (t.matches('[data-fg]')) { t.checked ? S.g.add(t.dataset.fg) : S.g.delete(t.dataset.fg); apply(); }
  else if (t.matches('[data-fmin],[data-fmax]')) { S.min = (t.closest('.fprice').querySelector('[data-fmin]').value || '').replace(/\D/g, ''); S.max = (t.closest('.fprice').querySelector('[data-fmax]').value || '').replace(/\D/g, ''); apply(); }
}
function onFilterInput(e) {
  const t = e.target;
  if (t.matches('[data-fsearch]')) { const v = norm(t.value); $$('.fopt[data-name]', t.closest('.fbody')).forEach(o => o.style.display = o.dataset.name.includes(v) ? '' : 'none'); }
}

async function init() {
  const grid = $('#grid');
  grid.innerHTML = Array.from({ length: 8 }, () => '<div class="skel"></div>').join('');
  [P, C] = await Promise.all([OB.products(), OB.cats()]);
  buildBase();
  if (MODE !== 'parts') heroCat();
  const circ = $('#circles'); if (circ) { const h = circlesHTML(); circ.innerHTML = h; circ.closest('.subnav').hidden = !h; }
  const parts = $('#parts'); if (parts) parts.innerHTML = partsHTML();
  const gb = $('#garage');
  const garageBar = () => { if (!gb) return; const g = OB.garage(); gb.innerHTML = g ? `<span class="gi">${'<svg class="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 10 12 4l9 6v10H3z"/><path d="M7 20v-6h10v6M7 17h10"/></svg>'}</span><span class="gt"><small>Mitt garage</small><b>${esc(g.make + (g.model ? ' ' + g.model : '') + (g.year ? ' · ' + g.year : ''))}</b></span><button class="btn b-line" data-garage>Ändra</button>` : `<span class="gi">${'<svg class="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 10 12 4l9 6v10H3z"/><path d="M7 20v-6h10v6M7 17h10"/></svg>'}</span><span class="gt"><small>Mitt garage</small><b>Spara din motorcykel – vi visar det som passar först</b></span><button class="btn b-red" data-garage>Lägg till MC</button>`; };
  garageBar();
  document.addEventListener('ob:garage', () => { garageBar(); if (MODE === 'parts') { const g = OB.garage(); S.bike = g ? g.make : ''; apply(); } });
  const sortSel = $('#sort'); if (sortSel) { if (S.q) { const o = sortSel.querySelector('option[value=pop]'); if (o) o.textContent = 'Relevans'; } sortSel.value = S.sort; sortSel.addEventListener('change', () => { S.sort = sortSel.value; apply(); }); }
  [$('#side'), $('#fsBody')].forEach(el => { if (!el) return; el.addEventListener('click', onFilterClick); el.addEventListener('change', onFilterChange); el.addEventListener('input', onFilterInput); });
  document.addEventListener('click', e => {
    const x = e.target.closest('[data-x]');
    if (x) { const k = x.dataset.x, v = x.dataset.v; if (k === 'all') { S.b.clear(); S.z.clear(); S.f.clear(); S.g.clear(); S.a = false; S.min = ''; S.max = ''; S.bike = ''; } else if (k === 'g') S.g.delete(v); else if (k === 'b') S.b.delete(v); else if (k === 'z') S.z.delete(v); else if (k === 'f') S.f.delete(v); else if (k === 'a') S.a = false; else if (k === 'p') { S.min = ''; S.max = ''; } else if (k === 'mc') S.bike = ''; apply(); return; }
    if (e.target.closest('#moreBtn')) { S.shown += PER; renderGrid(false); }
  });
  // automatisk "visa fler" när man närmar sig slutet
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting && view.length > S.shown && S.shown < PER * 6) { S.shown += PER; renderGrid(false); } }, { rootMargin: '600px 0px' });
    io.observe($('#more'));
  }
  apply();
}
init().catch(err => { console.error(err); $('#grid').innerHTML = '<div class="empty" style="grid-column:1/-1"><p class="h3">Kunde inte ladda sortimentet</p><p class="mut">Kontrollera anslutningen och ladda om sidan.</p></div>'; });
})();
