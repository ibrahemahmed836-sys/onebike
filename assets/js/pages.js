/* Onebike – mindre sidor: alla kategorier, varumärken, favoriter, kassa, presentkort, konto. */
(() => {
'use strict';
const OB = window.OB, { $, $$, esc, kr } = OB;
const page = document.body.dataset.page;
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ---------- alla kategorier ---------- */
if (page === 'kategorier') {
  OB.cats().then(C => {
    const box = $('#allcats'), inp = $('#catq');
    const tops = ['motorcykel', 'motocross', 'snoskoter', 'reservdelar'];
    const list = Object.entries(C).filter(([k, c]) => !c.hidden && c.cnt && c.r !== 'brand' && !c.b);
    const groupOf = k => { let s = k, g = 0; while (C[s] && C[s].pa && g++ < 6) s = C[s].pa; return tops.includes(s) ? s : 'ovrigt-x'; };
    const render = () => {
      const q = norm(inp.value.trim());
      const hit = list.filter(([k, c]) => !q || norm(c.n).includes(q));
      const groups = {};
      hit.forEach(([k, c]) => { (groups[groupOf(k)] = groups[groupOf(k)] || []).push([k, c]); });
      const order = [...tops, 'ovrigt-x'].filter(g => groups[g]);
      box.innerHTML = order.length ? order.map(g => `<section style="padding-block:18px;border-top:1px solid #E7E7EA"><h2 class="h3" style="margin-bottom:14px">${g === 'ovrigt-x' ? 'Mer i sortimentet' : esc(C[g].n)}</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">${groups[g].sort((a, b) => b[1].cnt - a[1].cnt).map(([k, c]) => `<a href="kategori.html?c=${encodeURIComponent(k)}" style="display:flex;align-items:center;gap:12px;min-height:60px;padding:8px 14px 8px 8px;border-radius:14px;border:1px solid #E7E7EA;transition:border-color .2s" onmouseover="this.style.borderColor='#0B0B0C'" onmouseout="this.style.borderColor='#E7E7EA'">${c.ci ? `<img src="${esc(c.ci)}" alt="" loading="lazy" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex:none">` : `<span style="width:44px;height:44px;border-radius:50%;background:#F1F1F3;flex:none;display:flex;align-items:center;justify-content:center;font-weight:900;font-stretch:125%;color:#A1A1A8;font-size:14px">${esc(c.n.slice(0, 2))}</span>`}<span style="flex:1;font-weight:600;font-size:15px;line-height:1.25">${esc(c.n)}</span><small class="mut tnum">${c.cnt}</small></a>`).join('')}</div></section>`).join('') : `<div class="empty"><p class="h3">Inga kategorier matchar ”${esc(inp.value)}”</p><button class="btn b-dark" data-open="search">Sök bland produkterna i stället</button></div>`;
    };
    inp.addEventListener('input', render); render();
  });
}

/* ---------- varumärken ---------- */
if (page === 'varumarken') {
  Promise.all([OB.cats(), OB.products()]).then(([C, P]) => {
    const cnt = {}; P.forEach(p => cnt[p.b] = (cnt[p.b] || 0) + 1);
    const bcat = {}; Object.entries(C).forEach(([k, c]) => { if (c.r === 'brand' && !c.hidden && !bcat[c.b]) bcat[c.b] = [k, c]; });
    const brands = Object.keys(cnt).sort((a, b) => a.localeCompare(b, 'sv'));
    const box = $('#brands'), inp = $('#bq');
    const render = () => {
      const q = norm(inp.value.trim());
      box.innerHTML = brands.filter(b => !q || norm(b).includes(q)).map(b => {
        const e = bcat[b]; const href = e ? 'kategori.html?c=' + encodeURIComponent(e[0]) : 'kategori.html?q=' + encodeURIComponent(b);
        const logo = e && e[1].lg ? `<img src="${esc(e[1].lg)}" alt="${esc(b)}" loading="lazy" style="max-height:44px;max-width:140px;width:auto;height:auto;${e[1].inv ? 'filter:invert(1)' : ''}">` : `<span class="xp" style="font-size:24px;font-weight:900;font-style:italic;letter-spacing:-.02em;line-height:1">${esc(b)}</span>`;
        return `<a href="${href}" class="tile">${'<span class="t-logo">' + logo + '</span>'}<span style="display:flex;flex-direction:column;gap:2px"><span class="t-name">${esc(b)}</span><span class="t-cnt">${cnt[b]} produkter</span></span></a>`;
      }).join('') || '<p class="mut">Inget märke matchar.</p>';
    };
    inp.addEventListener('input', render); render();
  });
}

/* ---------- favoriter ---------- */
if (page === 'favoriter') {
  const box = $('#favgrid'), head = $('#favcount');
  const render = () => OB.products().then(() => {
    const list = Object.entries(OB.favs).sort((a, b) => b[1] - a[1]).map(([s]) => OB.byS[s]).filter(Boolean);
    head.textContent = list.length + (list.length === 1 ? ' sparad produkt' : ' sparade produkter');
    box.innerHTML = list.length ? list.map(OB.card).join('') : `<div class="empty" style="grid-column:1/-1"><p class="h3">Vad drömmer du om?</p><p class="mut">Här samlas produkterna du sparar med hjärtat.</p><a class="btn b-red" href="kategori.html?c=motorcykel">Hitta din nya favorit</a></div>`;
  });
  document.addEventListener('ob:favs', () => setTimeout(render, 250));
  render();
}

/* ---------- presentkort ---------- */
if (page === 'presentkort') {
  const f = $('#gcForm'), prev = { amt: $('#gcAmt'), to: $('#gcTo'), msg: $('#gcMsg') };
  let amount = 500;
  const upd = () => {
    const custom = $('#gcCustom').value.replace(/\D/g, '');
    if (custom) amount = Math.min(10000, Math.max(100, +custom));
    prev.amt.textContent = kr(amount);
    prev.to.textContent = $('#gcName').value.trim() || 'Mottagarens namn';
    prev.msg.textContent = $('#gcText').value.trim() || 'Din personliga hälsning visas här.';
  };
  f.addEventListener('click', e => { const b = e.target.closest('[data-amt]'); if (b) { amount = +b.dataset.amt; $('#gcCustom').value = ''; $$('[data-amt]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); upd(); } });
  f.addEventListener('input', upd);
  f.addEventListener('submit', e => {
    e.preventDefault();
    const em = $('#gcEmail'), ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim());
    em.closest('.fld').classList.toggle('bad', !ok); $('#gcErr').textContent = ok ? '' : 'Ange mottagarens e-postadress.';
    if (!ok) { em.focus(); return; }
    OB.addGift({ amount, to: $('#gcName').value.trim(), email: em.value.trim(), text: $('#gcText').value.trim() });
  });
  upd();
}

/* ---------- kassa ---------- */
if (page === 'kassa') {
  const lines = $('#coLines'), sumEl = $('#coSum'), form = $('#coForm');
  const render = () => OB.products().then(() => {
    const n = OB.cartCount(), sub = OB.cartTotal(), ship = n ? OB.SHIP : 0;
    $('#coEmpty').hidden = !!n; form.hidden = !n; $('#coSide').hidden = !n;
    lines.innerHTML = OB.cart.map(l => { const f = OB.lineInfo(l); return `<div class="ln">${l.g ? '<span class="gc">Present&shy;kort</span>' : f.img ? `<img src="${esc(OB.img(f.img, 'small'))}" alt="" loading="lazy">` : '<span class="gc" style="background:#F3F3F4"></span>'}<div class="ln-b"><div class="ln-t"><span>${esc(f.name)}</span><b>${kr(f.price * l.q)}</b></div><small>${l.q} × ${kr(f.price)}${f.sub ? ' · ' + esc(f.sub) : ''}</small></div></div>`; }).join('');
    sumEl.innerHTML = `<div class="sum" style="font-size:15px"><span>Delsumma</span><span class="tnum">${kr(sub)}</span></div><div class="sum" style="font-size:15px"><span>Frakt</span><span class="tnum">${kr(ship)}</span></div><div class="sum" style="padding-top:10px;border-top:1px solid #E7E7EA"><span style="font-weight:700">Totalt</span><b class="tnum">${kr(sub + ship)}</b></div><small class="mut">Inklusive moms</small>`;
  });
  document.addEventListener('ob:cart', render);
  form.addEventListener('submit', e => {
    e.preventDefault();
    let bad = null;
    $$('[required]', form).forEach(i => {
      const v = i.type === 'checkbox' ? i.checked : i.value.trim();
      const ok = i.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(i.value.trim()) : !!v;
      const fl = i.closest('.fld'); if (fl) fl.classList.toggle('bad', !ok);
      if (!ok && !bad) bad = i;
    });
    $('#coErr').textContent = bad ? 'Fyll i de markerade fälten.' : '';
    if (bad) { bad.focus(); return; }
    const g = n => (form.elements[n] ? form.elements[n].value.trim() : '');
    const pay = (form.querySelector('[name=pay]:checked') || {}).value || '';
    const rows = OB.cart.map(l => { const f = OB.lineInfo(l); return `- ${l.q} × ${f.name}${f.sub ? ' (' + f.sub + ')' : ''} – ${kr(f.price * l.q)}`; }).join('\n');
    const sub = OB.cartTotal();
    const body = `Hej Onebike!\n\nJag vill beställa:\n${rows}\n\nDelsumma: ${kr(sub)}\nFrakt: ${kr(OB.SHIP)}\nTotalt: ${kr(sub + OB.SHIP)}\nÖnskat betalsätt: ${pay}\n\nNamn: ${g('fn')} ${g('ln')}\nE-post: ${g('em')}\nTelefon: ${g('ph')}\nAdress: ${g('ad')}, ${g('zip')} ${g('city')}, ${g('country')}\n${g('note') ? '\nMeddelande: ' + g('note') + '\n' : ''}`;
    location.href = 'mailto:info@onebike.se?subject=' + encodeURIComponent('Beställning från webbutiken – ' + g('fn') + ' ' + g('ln')) + '&body=' + encodeURIComponent(body);
    $('#coDone').hidden = false; OB.goTo($('#coDone'), -100);
  });
  render();
}

/* ---------- konto ---------- */
if (page === 'konto') {
  OB.products().then(() => {
    const seen = (OB.store.get('ob-seen', []) || []).map(s => OB.byS[s]).filter(Boolean);
    const favs = Object.keys(OB.favs).map(s => OB.byS[s]).filter(Boolean);
    $('#kFav').textContent = favs.length; $('#kCart').textContent = OB.cartCount(); $('#kSeen').textContent = seen.length;
    $('#seenRail').innerHTML = seen.length ? seen.slice(0, 12).map(OB.card).join('') : '<p class="mut" style="padding:0 4px">Produkter du tittar på visas här.</p>';
  });
}
})();
