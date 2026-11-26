/* Onebike – produktsida: galleri, färger, storlek, köp, beskrivning, relaterat. */
(() => {
'use strict';
const OB = window.OB, { $, $$, esc, kr } = OB;
const slug = OB.qs().get('p') || '';
const root = $('#pd');
let p, size = '', wired = false;

const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 64; };
const descFor = s => fetch(`${OB.R}data/desc/${String(hash(s)).padStart(2, '0')}.json${OB.V}`).then(r => r.json()).then(m => m[s]).catch(() => null);

function fmtDesc(d) {
  if (!d) return '<p>Kontakta oss om du vill veta mer om produkten – vi hjälper dig gärna med passform och val.</p>';
  const parts = d.split(/\s+-\s+(?=\S)/).map(x => x.trim()).filter(Boolean);
  const first = parts.shift();
  const bullets = parts.filter(x => x.length < 220);
  const rest = parts.filter(x => x.length >= 220);
  return `<p>${esc(first)}</p>${rest.map(x => `<p>${esc(x)}</p>`).join('')}${bullets.length ? `<ul style="list-style:disc;padding-left:20px;display:flex;flex-direction:column;gap:4px;white-space:normal">${bullets.map(x => `<li>${esc(x.replace(/[-–]\s*$/, ''))}</li>`).join('')}</ul>` : ''}`;
}

function gallery(imgs) {
  if (!imgs.length) return `<div class="gal"><div class="gal-main" style="aspect-ratio:1/1;align-items:center;justify-content:center;color:#B4B4BA">${OB.icon.img}</div></div>`;
  const figs = imgs.map((u, i) => `<figure data-zoom="${i}"><img src="${esc(OB.img(u, 'large'))}" alt="${esc(p.n)}${i ? ' – bild ' + (i + 1) : ''}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></figure>`).join('');
  const dots = imgs.length > 1 ? `<div class="gal-dots">${imgs.map((_, i) => `<button aria-label="Visa bild ${i + 1}" data-go="${i}" aria-current="${i === 0}"></button>`).join('')}</div>` : '';
  const th = imgs.length > 1 ? `<div class="gal-th">${imgs.map((u, i) => `<button data-go="${i}" aria-label="Visa bild ${i + 1}" aria-current="${i === 0}"><img src="${esc(OB.img(u, 'tiny'))}" alt="" loading="lazy"></button>`).join('')}</div>` : '';
  const nav = imgs.length > 1 ? `<button class="gal-nav p" data-step="-1" aria-label="Föregående bild"><svg class="ic" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><button class="gal-nav n" data-step="1" aria-label="Nästa bild"><svg class="ic" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>` : '';
  return `<div class="gal"><div style="position:relative"><div class="gal-main" id="galMain">${figs}</div>${nav}</div>${dots}${th}</div>`;
}

function brandHref(C, b) {
  const hit = Object.entries(C).find(([k, c]) => c.r === 'brand' && c.b === b && !c.hidden);
  return hit ? 'kategori.html?c=' + encodeURIComponent(hit[0]) : 'kategori.html?q=' + encodeURIComponent(b);
}

function crumbs(C) {
  const chain = []; let s = p.m && C[p.m] ? p.m : (p.c.find(c => C[c] && !C[c].hidden) || null), g = 0;
  while (s && C[s] && g++ < 6) { chain.unshift(s); s = C[s].pa; }
  return `<nav class="crumbs" aria-label="Brödsmulor"><a href="index.html">Hem</a>${chain.map(s => `<span aria-hidden="true">/</span><a href="kategori.html?c=${encodeURIComponent(s)}">${esc(C[s].n)}</a>`).join('')}<span aria-hidden="true">/</span><span aria-current="page">${esc(p.n)}</span></nav>`;
}

function related(C) {
  const sameCat = OB.P.filter(x => x.s !== p.s && x.m && x.m === p.m && x.k !== p.k);
  const pool = sameCat.length >= 4 ? sameCat : OB.P.filter(x => x.s !== p.s && x.c.some(c => p.c.includes(c)) && x.k !== p.k);
  const near = pool.sort((a, b) => Math.abs(a.p - p.p) - Math.abs(b.p - p.p)).slice(0, 12);
  const brand = OB.P.filter(x => x.b === p.b && x.s !== p.s && x.m !== p.m && x.k !== p.k).slice(0, 12);
  const seen = (OB.store.get('ob-seen', []) || []).filter(s => s !== p.s).map(s => OB.byS[s]).filter(Boolean).slice(0, 12);
  const rail = (id, title, list, dk) => list.length ? `<section class="sec-s${dk ? ' gr' : ''}" aria-labelledby="${id}"><div class="wrap phead"><div><p class="lbl">${dk ? 'Senast visade' : 'Mer att upptäcka'}</p><h2 class="h3" id="${id}">${title}</h2></div><div class="arrows"><button class="ab" data-rail="${id}r" data-dir="-1" aria-label="Föregående">${'<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'}</button><button class="ab" data-rail="${id}r" data-dir="1" aria-label="Nästa">${OB.icon.arrow}</button></div></div><div class="rail" id="${id}r">${list.map(OB.card).join('')}</div></section>` : '';
  return rail('relA', 'Passar din nästa tur', near) + rail('relB', 'Mer från ' + esc(p.b), brand) + rail('relC', 'Du har tittat på', seen, true);
}

async function init() {
  const [P, C, CP] = await Promise.all([OB.products(), OB.cats(), OB.compat()]);
  p = OB.byS[slug];
  if (!p) {
    root.innerHTML = `<div class="wrap" style="padding-block:80px;display:flex;flex-direction:column;gap:16px;align-items:flex-start"><p class="lbl">404</p><h1 class="h2">Produkten finns inte längre</h1><p class="lead">Den kan ha sålt slut eller bytt namn. Sök efter något liknande eller utforska sortimentet.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn b-red" data-open="search">Sök i butiken</button><a class="btn b-line" href="kategorier.html">Alla kategorier</a></div></div>`;
    return;
  }
  document.title = OB.pn(p.n) + ' | Onebike';
  const md = $('meta[name=description]'); if (md) md.setAttribute('content', `${p.n} från ${p.b} – ${kr(p.p)}. Snabb leverans och 30 dagars öppet köp hos Onebike.`);
  const seen = OB.store.get('ob-seen', []).filter(s => s !== p.s); seen.unshift(p.s); OB.store.set('ob-seen', seen.slice(0, 16));

  const extra = await descFor(p.s);
  let imgs = (p.i || []).slice();
  if (extra && extra.im && imgs.length < 2 && imgs[0]) {
    const stem = (OB.img(imgs[0]).split('/').pop() || '').replace(/(_(tiny|small|medium|large))?\.(jpe?g|png|webp)$/i, '');
    extra.im.forEach(u => { const f = u.split('/').pop().replace(/\.(jpe?g|png|webp)$/i, ''); if (stem && f.startsWith(stem) && f !== stem && !imgs.includes(u)) imgs.push(u); });
  }
  const grp = (p.k && OB.groups[p.k]) || [p];
  const pct = OB.pct(p);
  const sizes = p.z || [];
  const one = sizes.length === 1;
  size = '';
  if (one) size = sizes[0];
  const fav = !!OB.favs[p.s];
  const helmet = OB.isHelmet(p);
  const tags = OB.tagList(p);
  const mine = OB.mySize();
  const myOk = mine && helmet && sizes.some(z => OB.mySizeFor(p, z));
  const fit = OB.fitsGarage(p), g = OB.garage();
  const isPart = p.c.some(c => (C.reservdelar && C.reservdelar.m || []).includes(c));
  const fitLine = fit === 2 ? `<p class="fitl ok">${OB.icon.arrow}Passar din ${esc(g.make + ' ' + (g.model || '') + (g.year ? ' (' + g.year + ')' : ''))}</p>`
    : fit === 1 ? `<p class="fitl">Kontrollera att modellen passar din ${esc(g.make + ' ' + (g.model || ''))} – <a href="kundservice.html">fråga oss</a> om du är osäker.</p>`
    : (isPart ? `<p class="fitl"><button class="lnk" data-garage>Lägg till din MC i Mitt garage</button> så ser du direkt vad som passar.</p>` : '');
  const acc = CP.a[p.s], forMe = (CP.t[p.s] || []).filter((x, i, a) => a.findIndex(y => y.s === x.s) === i);
  const accBlock = acc ? `<div class="compat"><p class="opt-h"><b>Passar till</b><span class="mut">enligt tillverkaren</span></p><div class="chips">${acc.l.map(l => `<span class="chip on" style="cursor:default">${esc(p.b)} ${esc(l)}</span>`).join('')}</div><div class="cl-list">${acc.t.filter((x, i, a) => a.findIndex(y => (y.k && y.k === x.k)) === i || !x.k).slice(0, 6).map(x => `<a href="produkt.html?p=${encodeURIComponent(x.s)}">${x.i && x.i[0] ? `<img src="${esc(OB.img(x.i[0], 'tiny'))}" alt="" loading="lazy">` : ''}<span>${esc(OB.pn(x.n))}</span></a>`).join('')}</div></div>` : '';
  const revs = OB.reviews(p.s);
  root.innerHTML = `<div class="wrap">${crumbs(C)}<div class="pd">${gallery(imgs)}<div class="pi">
    <a class="brand" href="${brandHref(C, p.b)}">${esc(p.b)}</a>
    <h1>${esc(OB.pn(p.n))}</h1>
    <div class="pprice"><b class="${p.o ? 'sale' : ''}">${kr(p.p)}</b>${p.o ? `<s>${kr(p.o)}</s><span class="pct">−${pct}%</span>` : ''}</div>
    ${OB.avail(p) ? `<div>${OB.avail(p)}</div>` : ''}
    ${tags.length ? `<div class="ptags">${tags.map(([t, d], i) => `<button type="button" class="ptag" aria-expanded="false" aria-controls="tg${i}">${esc(t)}</button>`).join('')}</div><div class="ptag-d">${tags.map(([t, d], i) => `<p id="tg${i}" hidden><b>${esc(t)}</b><br><span>${esc(d)}</span></p>`).join('')}</div>` : ''}
    ${fitLine}
    ${grp.length > 1 ? `<div><p class="opt-h"><span>Färg: <b>${esc(OB.pn(p.l || ''))}</b></span><span class="mut">${grp.length} alternativ</span></p><div class="swatches">${grp.map(g => `<a href="produkt.html?p=${encodeURIComponent(g.s)}" aria-current="${g.s === p.s}" title="${esc(g.l || g.n)}" aria-label="${esc(g.l || g.n)}">${g.i && g.i[0] ? `<img src="${esc(OB.img(g.i[0], 'tiny'))}" alt="" loading="lazy">` : ''}</a>`).join('')}</div></div>` : (p.l ? `<p class="opt-h" style="margin:0"><span>Färg: <b>${esc(OB.pn(p.l))}</b></span></p>` : '')}
    ${sizes.length ? `<div><p class="opt-h"><b id="sizeLbl">${one ? 'Storlek: ' + esc(sizes[0]) : 'Välj storlek'}</b>${helmet ? '<button class="lnk" id="mySize" type="button">Hitta din storlek</button>' : '<a href="storleksguide.html">Storleksguide</a>'}</p><div class="sizes" id="sizes" role="group" aria-label="Storlek">${sizes.map(z => `<button data-z="${esc(z)}" aria-pressed="${one}"${OB.mySizeFor(p, z) ? ' class="mine"' : ''}>${esc(z)}</button>`).join('')}</div>${helmet && mine ? `<p class="mut mys" style="font-size:13px;margin-top:6px">${myOk ? `Markerad: din sparade storlek (${esc(String(mine.cm).replace('.', ','))} cm).` : `Din sparade storlek ${esc(mine.size)} finns inte i den här modellen.`}</p>` : ''}<p id="sizeErr" class="mut" style="color:#C8141C;font-size:13px;min-height:18px;margin-top:6px" aria-live="polite"></p></div>` : ''}
    <div class="buy"><button class="btn b-red" id="buy">${OB.icon.plus.replace('width="20" height="20"', 'width="18" height="18"')}Lägg i varukorgen</button><button class="icb" data-fav="${esc(p.s)}" aria-pressed="${fav}" aria-label="Spara som favorit">${OB.icon.heart.replace('<svg', '<svg class="ic"')}</button></div>
    <div class="pacts">${helmet ? `<button class="btn b-line" data-cmp="${esc(p.s)}" aria-pressed="${OB.cmpHas(p.s)}">${'<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 4v16M16 4v16M4 8h8M12 16h8"/></svg>'}<span>Jämför</span></button>` : ''}<button class="btn b-line" id="watch">${'<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>'}Bevaka pris &amp; lager</button>${kitStyle() ? `<a class="btn b-line" href="kit.html?stil=${kitStyle()}&med=${encodeURIComponent(p.s)}">${'<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 4h8l1 3h3v13H4V7h3z"/><path d="M9 12h6M12 9v6"/></svg>'}Bygg kit</a>` : ''}</div>
    ${accBlock}
    <a class="lnk" href="mailto:info@onebike.se?subject=${encodeURIComponent('Fråga om ' + p.n)}&body=${encodeURIComponent('Hej! Jag har en fråga om ' + p.n + ' (' + location.href + ').\n\n')}" style="font-weight:600;font-size:14px">Fråga om produkten${OB.icon.arrow}</a>
    <ul class="usp"><li>${OB.icon.arrow.replace('class="ic"', 'class="ic" style="color:#16A34A"')}Auktoriserad svensk återförsäljare</li><li>${OB.icon.arrow.replace('class="ic"', 'class="ic" style="color:#16A34A"')}Snabba leveranser från vårt lager</li><li>${OB.icon.arrow.replace('class="ic"', 'class="ic" style="color:#16A34A"')}30 dagars öppet köp</li></ul>
    <div class="acc">
      <details open><summary>Produktbeskrivning<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="body" style="white-space:normal">${fmtDesc(extra && extra.d)}<p class="mut" style="font-size:13px">Varumärke: ${esc(p.b)}</p></div></details>
      <details><summary>Leverans &amp; retur<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="body" style="white-space:normal"><p>Onebike erbjuder snabba leveranser och 30 dagars öppet köp. Frakt ${kr(OB.SHIP)}. Läs våra köpvillkor för fullständiga leverans- och returvillkor.</p><a class="lnk" href="kopvillkor.html">Läs köpvillkoren${OB.icon.arrow}</a></div></details>
      <details><summary>Behöver du hjälp?<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="body" style="white-space:normal"><p>Mejla <a href="mailto:info@onebike.se" style="text-decoration:underline">info@onebike.se</a> eller ring <a href="tel:+46737351135" style="text-decoration:underline;white-space:nowrap">073-735 11 35</a>. Vi hjälper dig med produktfrågor och rätt passform.</p></div></details>
    </div>
  </div></div></div>
  ${forMe.length ? `<section class="sec-s" aria-labelledby="accH"><div class="wrap phead"><div><p class="lbl">Passar den här modellen</p><h2 class="h3" id="accH">Visir och tillbehör som passar</h2></div><a class="lnk" href="hitta-visir.html">Hitta visir${OB.icon.arrow}</a></div><div class="rail">${forMe.slice(0, 16).map(OB.card).join('')}</div></section>` : ''}
  <section class="sec-s rev" id="reviews" aria-labelledby="revH"><div class="wrap"><div class="phead" style="padding:0"><div><p class="lbl">Recensioner</p><h2 class="h3" id="revH">Vad säger förarna?</h2></div><button class="btn b-dark" id="revBtn">Skriv en recension</button></div><div id="revList">${revHTML(revs)}</div></div></section>
  ${related(C)}
  <div class="buybar" id="buybar"><div class="t"><span>${esc(OB.pn(p.n))}</span><b>${kr(p.p)}</b></div><button class="btn b-red" id="buy2">${sizes.length && !one ? 'Välj storlek' : 'Lägg i varukorgen'}</button></div>`;
  wire(imgs);
  OB.reveal(root);
  // strukturerad data för sökmotorer
  const old = $('script[type="application/ld+json"]'); if (old) old.remove();
  const ld = document.createElement('script'); ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.n, brand: { '@type': 'Brand', name: p.b }, image: imgs.map(u => OB.img(u, 'large')), description: extra && extra.d || '', offers: { '@type': 'Offer', priceCurrency: 'SEK', price: p.p, availability: 'https://schema.org/' + (p.a === 1 ? 'InStock' : p.a === 2 ? 'LimitedAvailability' : 'BackOrder') } });
  document.head.appendChild(ld);
}

function kitStyle() {
  const has = l => p.c.some(c => l.includes(c));
  if (has(['skoterhjalmar', 'skoteroveraller', 'skoterhandskar', 'skoterglasogon', 'skoterstovlar', 'skoterklader'])) return 'snoskoter';
  if (has(['crosshjalm', 'troja', 'crossbyxor', 'crosshandskar', 'crossglasogon', 'stovlar', 'crossutrustning'])) return 'motocross';
  if (has(['mc-hjalmar', 'integralhjalmar', 'jackor', 'byxor', 'mc-handskar', 'sportstovlar', 'touringstovlar', 'mc-skor', 'skinnstall'])) return 'gata';
  return '';
}
function revHTML(revs) {
  if (!revs.length) return '<div class="rev-empty"><p><b>Inga recensioner ännu.</b> Har du kört med den? Dela passform och känsla – det hjälper nästa förare att välja rätt storlek.</p></div>';
  const n = revs.length, avg = revs.reduce((a, r) => a + r.st, 0) / n;
  const fc = { Liten: 0, 'Rätt': 0, Stor: 0 }; revs.forEach(r => fc[r.fit] = (fc[r.fit] || 0) + 1);
  const pos = ((fc.Stor - fc.Liten) / n + 1) / 2 * 100;
  return `<div class="rev-sum"><div><b class="xp" style="font-size:40px;line-height:1">${avg.toFixed(1).replace('.', ',')}</b><span class="stars-s" aria-label="${avg.toFixed(1)} av 5">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))}</span><small class="mut">${n} recension${n > 1 ? 'er' : ''}</small></div><div class="fitm"><span>Liten</span><span class="fit-bar"><i style="left:${pos.toFixed(0)}%"></i></span><span>Stor</span></div></div>` +
    revs.map(r => `<article class="rev-it"><p><span class="stars-s">${'★'.repeat(r.st)}${'☆'.repeat(5 - r.st)}</span> <b>${esc(r.n)}</b> <small class="mut"><span>${esc(r.d)}</span> <span>väntar på granskning</span></small></p><p class="mut" style="font-size:13px"><span>${esc(r.fit === 'Rätt' ? 'Rätt storlek' : r.fit === 'Liten' ? 'Liten i storleken' : 'Stor i storleken')}</span>${r.z ? `<span> · köpte ${esc(r.z)}</span>` : ''}${r.len ? `<span> · ${esc(r.len)} cm lång</span>` : ''}</p><p>${esc(r.t)}</p></article>`).join('');
}

let gImgs = [], gCur = 0;
const setCur = i => { $$('.gal-dots button,.gal-th button').forEach(b => b.setAttribute('aria-current', String(+b.dataset.go === i))); };
const go = i => { const main = $('#galMain'); if (!main) return; gCur = Math.max(0, Math.min(gImgs.length - 1, i)); main.scrollTo({ left: gCur * main.clientWidth, behavior: OB.RM ? 'auto' : 'smooth' }); setCur(gCur); };
function wire(imgs) {
  gImgs = imgs; gCur = 0;
  const main = $('#galMain');
  if (main) {
    let st; main.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(() => { gCur = Math.round(main.scrollLeft / main.clientWidth); setCur(gCur); }, 60); }, { passive: true });
  }
  if (!wired) root.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g && root.contains(g) && g.closest('.gal')) { go(+g.dataset.go); return; }
    const s = e.target.closest('[data-step]'); if (s) { go(gCur + +s.dataset.step); return; }
    const z = e.target.closest('[data-zoom]'); if (z) { openLB(+z.dataset.zoom, gImgs); return; }
    const b = e.target.closest('[data-z]'); if (b && b.closest('#sizes')) { size = b.dataset.z; $$('#sizes button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#sizeLbl').textContent = 'Storlek: ' + size; $('#sizes').classList.remove('err'); $('#sizeErr').textContent = ''; $('#buy2').textContent = 'Lägg i varukorgen'; return; }
    if (e.target.closest('#buy') || e.target.closest('#buy2')) { buy(); return; }
    const tg = e.target.closest('.ptag'); if (tg) { const id = tg.getAttribute('aria-controls'); const open = tg.getAttribute('aria-expanded') !== 'true'; $$('.ptag').forEach(x => x.setAttribute('aria-expanded', 'false')); $$('.ptag-d p').forEach(x => x.hidden = true); if (open) { tg.setAttribute('aria-expanded', 'true'); document.getElementById(id).hidden = false; } return; }
    if (e.target.closest('#watch')) { OB.openWatch(p); return; }
    if (e.target.closest('#revBtn')) { OB.openReview(p); return; }
    if (e.target.closest('#mySize')) { OB.openSizeTool(p, () => init()); return; }
    const r = e.target.closest('[data-rail]'); if (r) { const el = document.getElementById(r.dataset.rail); el.scrollBy({ left: +r.dataset.dir * Math.max(280, el.clientWidth * 0.8), behavior: OB.RM ? 'auto' : 'smooth' }); }
  });
  wired = true;
  // sticky köpknapp på mobil när huvudknappen är ur bild
  const bar = $('#buybar'), btn = $('#buy');
  if ('IntersectionObserver' in window && bar && btn) {
    new IntersectionObserver(es => { const off = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; bar.classList.toggle('on', off); document.body.classList.toggle('has-buybar', off); }).observe(btn);
  }
}

function buy() {
  if (p.z && p.z.length > 1 && !size) {
    $('#sizes').classList.add('err'); $('#sizeErr').textContent = 'Välj en storlek först.';
    OB.goTo($('#sizes'), -160);
    return;
  }
  OB.addToCart(p.s, size);
}

function openLB(i, imgs) {
  let lb = $('#lb');
  if (!lb) { lb = document.createElement('div'); lb.id = 'lb'; lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Bilder'); document.body.appendChild(lb); }
  lb.innerHTML = `<button class="icb x" aria-label="Stäng bilder"><svg class="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button><div class="lb-main" data-lenis-prevent>${imgs.map(u => `<figure><img src="${esc(OB.img(u, 'large'))}" alt="${esc(p.n)}"></figure>`).join('')}</div>`;
  lb.classList.add('on'); document.body.classList.add('lock'); OB.lenis && OB.lenis.stop();
  const m = $('.lb-main', lb); requestAnimationFrame(() => m.scrollTo({ left: i * m.clientWidth }));
  const close = () => { lb.classList.remove('on'); document.body.classList.remove('lock'); OB.lenis && OB.lenis.start(); document.removeEventListener('keydown', key); };
  const key = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') m.scrollBy({ left: m.clientWidth, behavior: 'smooth' }); if (e.key === 'ArrowLeft') m.scrollBy({ left: -m.clientWidth, behavior: 'smooth' }); };
  $('.x', lb).onclick = close; document.addEventListener('keydown', key);
  $('.x', lb).focus();
}

document.addEventListener('ob:rev', e => { if (p && e.detail === p.s) { const l = $('#revList'); if (l) l.innerHTML = revHTML(OB.reviews(p.s)); } });
document.addEventListener('ob:garage', () => { if (p && $('#pd .pd')) init(); });
init().catch(err => { console.error(err); root.innerHTML = '<div class="wrap" style="padding-block:80px"><p class="h3">Kunde inte ladda produkten</p><p class="mut">Ladda om sidan och försök igen.</p></div>'; });
})();
