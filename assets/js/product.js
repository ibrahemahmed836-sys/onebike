/* Onebike – produktsida: galleri, färger, storlek, köp, beskrivning, relaterat. */
(() => {
'use strict';
const OB = window.OB, { $, $$, esc, kr } = OB;
const slug = OB.qs().get('p') || '';
const root = $('#pd');
let p, size = '';

const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 64; };
const descFor = s => fetch(`data/desc/${String(hash(s)).padStart(2, '0')}.json`).then(r => r.json()).then(m => m[s]).catch(() => null);

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
  const [P, C] = await Promise.all([OB.products(), OB.cats()]);
  p = OB.byS[slug];
  if (!p) {
    root.innerHTML = `<div class="wrap" style="padding-block:80px;display:flex;flex-direction:column;gap:16px;align-items:flex-start"><p class="lbl">404</p><h1 class="h2">Produkten finns inte längre</h1><p class="lead">Den kan ha sålt slut eller bytt namn. Sök efter något liknande eller utforska sortimentet.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn b-red" data-open="search">Sök i butiken</button><a class="btn b-line" href="kategorier.html">Alla kategorier</a></div></div>`;
    return;
  }
  document.title = p.n + ' | Onebike';
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
  if (one) size = sizes[0];
  const fav = !!OB.favs[p.s];
  root.innerHTML = `<div class="wrap">${crumbs(C)}<div class="pd">${gallery(imgs)}<div class="pi">
    <a class="brand" href="${brandHref(C, p.b)}">${esc(p.b)}</a>
    <h1>${esc(p.n)}</h1>
    <div class="pprice"><b class="${p.o ? 'sale' : ''}">${kr(p.p)}</b>${p.o ? `<s>${kr(p.o)}</s><span class="pct">−${pct}%</span>` : ''}</div>
    ${OB.avail(p) ? `<div>${OB.avail(p)}</div>` : ''}
    ${grp.length > 1 ? `<div><p class="opt-h"><span>Färg: <b>${esc(p.l || '')}</b></span><span class="mut">${grp.length} alternativ</span></p><div class="swatches">${grp.map(g => `<a href="produkt.html?p=${encodeURIComponent(g.s)}" aria-current="${g.s === p.s}" title="${esc(g.l || g.n)}" aria-label="${esc(g.l || g.n)}">${g.i && g.i[0] ? `<img src="${esc(OB.img(g.i[0], 'tiny'))}" alt="" loading="lazy">` : ''}</a>`).join('')}</div></div>` : (p.l ? `<p class="opt-h" style="margin:0"><span>Färg: <b>${esc(p.l)}</b></span></p>` : '')}
    ${sizes.length ? `<div><p class="opt-h"><b id="sizeLbl">${one ? 'Storlek: ' + esc(sizes[0]) : 'Välj storlek'}</b><a href="storleksguide.html">Storleksguide</a></p><div class="sizes" id="sizes" role="group" aria-label="Storlek">${sizes.map(z => `<button data-z="${esc(z)}" aria-pressed="${one}">${esc(z)}</button>`).join('')}</div><p id="sizeErr" class="mut" style="color:#C8141C;font-size:13px;min-height:18px;margin-top:6px" aria-live="polite"></p></div>` : ''}
    <div class="buy"><button class="btn b-red" id="buy">${OB.icon.plus.replace('width="20" height="20"', 'width="18" height="18"')}Lägg i varukorgen</button><button class="icb" data-fav="${esc(p.s)}" aria-pressed="${fav}" aria-label="Spara som favorit">${OB.icon.heart.replace('<svg', '<svg class="ic"')}</button></div>
    <a class="lnk" href="mailto:info@onebike.se?subject=${encodeURIComponent('Fråga om ' + p.n)}&body=${encodeURIComponent('Hej! Jag har en fråga om ' + p.n + ' (' + location.href + ').\n\n')}" style="font-weight:600;font-size:14px">Fråga om produkten${OB.icon.arrow}</a>
    <ul class="usp"><li>${OB.icon.arrow.replace('class="ic"', 'class="ic" style="color:#16A34A"')}Auktoriserad svensk återförsäljare</li><li>${OB.icon.arrow.replace('class="ic"', 'class="ic" style="color:#16A34A"')}Snabba leveranser från vårt lager</li><li>${OB.icon.arrow.replace('class="ic"', 'class="ic" style="color:#16A34A"')}30 dagars öppet köp</li></ul>
    <div class="acc">
      <details open><summary>Produktbeskrivning<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="body" style="white-space:normal">${fmtDesc(extra && extra.d)}<p class="mut" style="font-size:13px">Varumärke: ${esc(p.b)}</p></div></details>
      <details><summary>Leverans &amp; retur<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="body" style="white-space:normal"><p>Onebike erbjuder snabba leveranser och 30 dagars öppet köp. Frakt ${kr(OB.SHIP)}. Läs våra köpvillkor för fullständiga leverans- och returvillkor.</p><a class="lnk" href="kopvillkor.html">Läs köpvillkoren${OB.icon.arrow}</a></div></details>
      <details><summary>Behöver du hjälp?<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="body" style="white-space:normal"><p>Mejla <a href="mailto:info@onebike.se" style="text-decoration:underline">info@onebike.se</a> eller ring <a href="tel:+46737351135" style="text-decoration:underline;white-space:nowrap">073-735 11 35</a>. Vi hjälper dig med produktfrågor och rätt passform.</p></div></details>
    </div>
  </div></div></div>${related(C)}
  <div class="buybar" id="buybar"><div class="t"><span>${esc(p.n)}</span><b>${kr(p.p)}</b></div><button class="btn b-red" id="buy2">${sizes.length && !one ? 'Välj storlek' : 'Lägg i varukorgen'}</button></div>`;
  wire(imgs);
  OB.reveal(root);
  // strukturerad data för sökmotorer
  const ld = document.createElement('script'); ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.n, brand: { '@type': 'Brand', name: p.b }, image: imgs.map(u => OB.img(u, 'large')), description: extra && extra.d || '', offers: { '@type': 'Offer', priceCurrency: 'SEK', price: p.p, availability: 'https://schema.org/' + (p.a === 1 ? 'InStock' : p.a === 2 ? 'LimitedAvailability' : 'BackOrder') } });
  document.head.appendChild(ld);
}

function wire(imgs) {
  const main = $('#galMain');
  const setCur = i => { $$('.gal-dots button,.gal-th button').forEach(b => b.setAttribute('aria-current', String(+b.dataset.go === i))); };
  let cur = 0;
  if (main) {
    let st; main.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(() => { cur = Math.round(main.scrollLeft / main.clientWidth); setCur(cur); }, 60); }, { passive: true });
  }
  const go = i => { if (!main) return; cur = Math.max(0, Math.min(imgs.length - 1, i)); main.scrollTo({ left: cur * main.clientWidth, behavior: OB.RM ? 'auto' : 'smooth' }); setCur(cur); };
  root.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g && root.contains(g) && g.closest('.gal')) { go(+g.dataset.go); return; }
    const s = e.target.closest('[data-step]'); if (s) { go(cur + +s.dataset.step); return; }
    const z = e.target.closest('[data-zoom]'); if (z) { openLB(+z.dataset.zoom, imgs); return; }
    const b = e.target.closest('[data-z]'); if (b && b.closest('#sizes')) { size = b.dataset.z; $$('#sizes button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#sizeLbl').textContent = 'Storlek: ' + size; $('#sizes').classList.remove('err'); $('#sizeErr').textContent = ''; $('#buy2').textContent = 'Lägg i varukorgen'; return; }
    if (e.target.closest('#buy') || e.target.closest('#buy2')) { buy(); return; }
    const r = e.target.closest('[data-rail]'); if (r) { const el = document.getElementById(r.dataset.rail); el.scrollBy({ left: +r.dataset.dir * Math.max(280, el.clientWidth * 0.8), behavior: OB.RM ? 'auto' : 'smooth' }); }
  });
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

init().catch(err => { console.error(err); root.innerHTML = '<div class="wrap" style="padding-block:80px"><p class="h3">Kunde inte ladda produkten</p><p class="mut">Ladda om sidan och försök igen.</p></div>'; });
})();
