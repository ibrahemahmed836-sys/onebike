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
    const n = OB.cartCount(), sub = OB.cartSub(), kd = OB.kitDiscount(), ship = n ? OB.SHIP : 0;
    $('#coEmpty').hidden = !!n; form.hidden = !n; $('#coSide').hidden = !n;
    lines.innerHTML = OB.cart.map(l => { const f = OB.lineInfo(l); return `<div class="ln">${l.g ? '<span class="gc">Present&shy;kort</span>' : f.img ? `<img src="${esc(OB.img(f.img, 'small'))}" alt="" loading="lazy">` : '<span class="gc" style="background:#F3F3F4"></span>'}<div class="ln-b"><div class="ln-t"><span>${esc(f.name)}</span><b>${kr(f.price * l.q)}</b></div><small>${l.q} × ${kr(f.price)}${f.sub ? ' · ' + esc(f.sub) : ''}</small></div></div>`; }).join('');
    sumEl.innerHTML = `<div class="sum" style="font-size:15px"><span>Delsumma</span><span class="tnum">${kr(sub)}</span></div>${kd ? `<div class="sum kitd" style="font-size:15px"><span>Kitrabatt ${OB.KIT.pct} %</span><span class="tnum">−${kr(kd)}</span></div>` : ''}<div class="sum" style="font-size:15px"><span>Frakt</span><span class="tnum">${kr(ship)}</span></div><div class="sum" style="padding-top:10px;border-top:1px solid #E7E7EA"><span style="font-weight:700">Totalt</span><b class="tnum">${kr(sub - kd + ship)}</b></div><small class="mut">Inklusive moms</small>`;
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
    const sub = OB.cartSub(), kd = OB.kitDiscount();
    const body = `Hej Onebike!\n\nJag vill beställa:\n${rows}\n\nDelsumma: ${kr(sub)}${kd ? '\nKitrabatt: −' + kr(kd) : ''}\nFrakt: ${kr(OB.SHIP)}\nTotalt: ${kr(sub - kd + OB.SHIP)}\nÖnskat betalsätt: ${pay}\n\nNamn: ${g('fn')} ${g('ln')}\nE-post: ${g('em')}\nTelefon: ${g('ph')}\nAdress: ${g('ad')}, ${g('zip')} ${g('city')}, ${g('country')}\n${g('note') ? '\nMeddelande: ' + g('note') + '\n' : ''}`;
    location.href = 'mailto:info@onebike.se?subject=' + encodeURIComponent('Beställning från webbutiken – ' + g('fn') + ' ' + g('ln')) + '&body=' + encodeURIComponent(body);
    $('#coDone').hidden = false; OB.goTo($('#coDone'), -100);
  });
  const wt = $('#walletTxt');
  if (wt) { const ap = window.ApplePaySession && ApplePaySession.canMakePayments && (() => { try { return ApplePaySession.canMakePayments(); } catch (e) { return false; } })(); wt.textContent = ap ? ' och Apple Pay' : (window.PaymentRequest ? ' och Google Pay' : ''); }
  render();
}

/* ---------- konto ---------- */
if (page === 'konto') {
  OB.products().then(() => {
    const seen = (OB.store.get('ob-seen', []) || []).map(s => OB.byS[s]).filter(Boolean);
    const favs = Object.keys(OB.favs).map(s => OB.byS[s]).filter(Boolean);
    $('#kFav').textContent = favs.length; $('#kCart').textContent = OB.cartCount(); $('#kSeen').textContent = seen.length;
    $('#seenRail').innerHTML = seen.length ? seen.slice(0, 12).map(OB.card).join('') : '<p class="mut" style="padding:0 4px">Produkter du tittar på visas här.</p>';
    konto();
  });
  ['ob:garage', 'ob:watch'].forEach(ev => document.addEventListener(ev, () => OB.P && konto()));
}
function konto() {
  const box = id => $('#' + id + ' .kb');
  const g = OB.garage();
  box('kGarage').innerHTML = g ? `<p><b style="font-size:20px">${esc(g.make)} ${esc(g.model || '')}</b>${g.year ? `<br><span class="mut">Årsmodell ${esc(g.year)}</span>` : ''}</p><div class="kbtn"><a class="btn b-red" href="reservdelar.html">Delar som passar</a><button class="btn b-line" data-garage>Ändra</button></div>` : `<p class="mut">Spara din motorcykel så visar vi delar som passar den först.</p><button class="btn b-dark" data-garage>Lägg till motorcykel</button>`;
  const m = OB.mySize();
  box('kSize').innerHTML = m ? `<p><b style="font-size:32px" class="xp">${esc(m.size)}${m.alt ? '/' + esc(m.alt) : ''}</b><br><span class="mut">Huvudomfång ${esc(String(m.cm).replace('.', ','))} cm</span></p><div class="kbtn"><a class="btn b-red" href="kategori.html?c=mc-hjalmar&z=${encodeURIComponent(m.size)}">Hjälmar i min storlek</a><a class="btn b-line" href="storleksguide.html">Mät igen</a></div>` : `<p class="mut">Mät ditt huvud en gång – sedan markerar vi din storlek på varje hjälm.</p><a class="btn b-dark" href="storleksguide.html">Hitta min storlek</a>`;
  const gear = OB.gear();
  const due = x => { const d = OB.gearDue(x); if (!d) return ''; const days = Math.round((new Date(d) - new Date()) / 864e5); return `<span class="due${days < 60 ? ' soon' : ''}">${x.type === 'hjalm' ? 'Byt senast' : 'Nästa service'} ${esc(d)}${days < 0 ? ' · passerat' : ''}</span>`; };
  box('kGear').innerHTML = `${gear.length ? `<ul class="gear-l">${gear.map(x => `<li><span><b>${esc(x.name)}</b><small class="mut">${esc({ hjalm: 'Hjälm', dair: 'D-Air airbag', annat: 'Utrustning' }[x.type] || 'Utrustning')}${x.date ? ' · köpt ' + esc(x.date) : ''}</small>${due(x)}</span><span class="gear-b">${OB.gearDue(x) ? `<button class="btn b-line" data-ics="${esc(x.id)}">Lägg i kalendern</button>` : ''}<button class="icb" data-gdel="${esc(x.id)}" aria-label="Ta bort ${esc(x.name)}">×</button></span></li>`).join('')}</ul>` : '<p class="mut">Lägg till din hjälm eller airbag så påminner vi dig i tid – direkt i din kalender.</p>'}
    <form class="form gear-f" id="gearF" novalidate><div class="two"><div class="fld"><label for="gfT">Typ</label><select id="gfT"><option value="hjalm">Hjälm</option><option value="dair">D-Air airbag</option><option value="annat">Annan utrustning</option></select></div><div class="fld"><label for="gfN">Namn</label><input id="gfN" placeholder="t.ex. Shoei NXR 2" required></div></div>
    <div class="two"><div class="fld"><label for="gfD">Köpdatum</label><input id="gfD" type="date"></div><div class="fld"><label for="gfX">Nästa service / byte</label><input id="gfX" type="date"><small class="mut" id="gfH">Hjälm: lämna tomt så föreslår vi 5 år efter köp.</small></div></div>
    <button class="btn b-dark" type="submit" style="justify-self:start">Lägg till</button></form>
    <p class="mut" style="font-size:13px">Många tillverkare rekommenderar att hjälmen byts efter ungefär fem år, eller direkt efter en smäll. Följ alltid tillverkarens anvisning – för D-Air gäller Dainese serviceschema.</p>`;
  const bk = OB.store.get('ob-book', []);
  box('kBook').innerHTML = bk.length ? `<ul class="gear-l">${bk.map(b => `<li><span><b>${esc(b.sys)}</b><small class="mut">${esc(b.case)} · önskad dag ${esc(b.date)} (${esc(b.slot.toLowerCase())}) · ref ${esc(b.ref)}</small><span class="steps-s"><i class="on">Förfrågan skickad</i><i>Bekräftad</i><i>Inlämnad</i><i>Klar</i></span></span></li>`).join('')}</ul><p class="mut" style="font-size:13px">Status uppdateras via e-post från oss tills bokningssystemet är inkopplat.</p>` : '<p class="mut">Inga bokningar än.</p><a class="btn b-dark" href="d-air.html">Boka D-Air service</a>';
  const w = OB.watches();
  box('kWatch').innerHTML = w.length ? `<ul class="gear-l">${w.map((x, i) => `<li><span><a href="produkt.html?p=${encodeURIComponent(x.s)}"><b>${esc(OB.pn(x.n))}</b></a><small class="mut">${x.z ? `<span>Storlek ${esc(x.z)}</span> · ` : ''}<span>${x.st && x.pc ? 'Lager och pris' : x.st ? 'Lager' : 'Pris'}</span>${x.pc ? ' (' + kr(x.pr) + ')' : ''} · <span>sedan ${esc(x.d)}</span></small></span><button class="icb" data-wdel="${i}" aria-label="Avsluta bevakning">×</button></li>`).join('')}</ul>` : '<p class="mut">Tryck på <b>Bevaka pris &amp; lager</b> på en produkt så hamnar den här.</p>';
}
if (page === 'konto') {
  document.addEventListener('submit', e => {
    if (e.target.id !== 'gearF') return; e.preventDefault();
    const n = $('#gfN').value.trim(); if (!n) { $('#gfN').closest('.fld').classList.add('bad'); $('#gfN').focus(); return; }
    OB.addGear({ type: $('#gfT').value, name: n, date: $('#gfD').value, next: $('#gfX').value }); konto();
  });
  document.addEventListener('click', e => {
    const d = e.target.closest('[data-gdel]'); if (d) { OB.store.set('ob-gear', OB.gear().filter(x => x.id !== d.dataset.gdel)); konto(); return; }
    const w = e.target.closest('[data-wdel]'); if (w) { const l = OB.watches(); l.splice(+w.dataset.wdel, 1); OB.store.set('ob-watch', l); konto(); return; }
    const c = e.target.closest('[data-ics]'); if (c) { const x = OB.gear().find(g => g.id === c.dataset.ics); if (x) OB.ics('onebike-paminnelse', [{ date: OB.gearDue(x), title: (x.type === 'hjalm' ? 'Dags att byta hjälm: ' : 'Service: ') + x.name, desc: 'Påminnelse från Onebike. Boka eller hitta ny utrustning på onebike.se – vi hjälper dig gärna: 073-735 11 35.' }]); }
  });
}

/* ---------- storleksguide ---------- */
if (page === 'storlek' && $('#sizeTool')) {
  const inp = $('#hcm'), rng = $('#hcmR');
  let shape = (OB.mySize() || {}).shape || 'mellan';
  if (OB.mySize()) { inp.value = rng.value = OB.mySize().cm; }
  const upd = from => {
    if (from === 'r') inp.value = rng.value; else rng.value = inp.value;
    const r = OB.helmetSize(inp.value); if (!r) return;
    $('#sRes').textContent = r.size + (r.alt ? '/' + r.alt : '');
    const sh = { rund: 'Med rund huvudform: välj modeller som beskrivs som runda eller mellanovala, och prova gärna – tryck vid tinningarna betyder att formen är för smal.', lang: 'Med lång oval huvudform: välj modeller som beskrivs som långovala – tryck mot pannan betyder att formen är för rund.', mellan: 'Mellanoval form passar de flesta hjälmar på marknaden.' }[shape];
    $('#sResTxt').textContent = (r.between ? 'Du ligger mellan två storlekar – prova båda och välj den mindre om den sitter tätt utan tryckpunkter. ' : r.small ? 'Under 51 cm: titta på barn- och ungdomshjälmar eller fråga oss. ' : r.big ? 'Över 66 cm: alla modeller finns inte så stora – fråga oss gärna. ' : '') + sh;
    $$('.stab tr[data-size]').forEach(tr => tr.classList.toggle('on', tr.dataset.size === r.size || tr.dataset.size === r.alt));
    $('#sShop').href = 'kategori.html?c=mc-hjalmar&z=' + encodeURIComponent(r.size === 'XXL' ? 'XXL,2XL' : r.size);
  };
  inp.addEventListener('input', () => upd('i')); rng.addEventListener('input', () => upd('r'));
  $('#sizeTool').addEventListener('click', e => {
    const b = e.target.closest('[data-hstep]'); if (b) { inp.value = Math.min(68, Math.max(48, (+inp.value || 57) + +b.dataset.hstep)); upd('i'); return; }
    const sh = e.target.closest('[data-shape]'); if (sh) { shape = sh.dataset.shape; $$('[data-shape]').forEach(x => x.setAttribute('aria-checked', String(x === sh))); upd('i'); return; }
    if (e.target.closest('#sSave')) { const r = OB.helmetSize(inp.value); OB.store.set('ob-size', { cm: +inp.value, size: r.size, alt: r.alt || null, shape, d: new Date().toISOString().slice(0, 10) }); $('#sSaved').textContent = 'Sparad! Din storlek ' + r.size + ' markeras nu på alla hjälmar i butiken.'; OB.toast('Storlek ' + r.size + ' · ' + inp.value + ' cm', 'Din storlek är sparad'); }
  });
  $$('[data-shape]').forEach(x => x.setAttribute('aria-checked', String(x.dataset.shape === shape)));
  upd('i');
}

/* ---------- hitta visir ---------- */
if (page === 'visir') {
  OB.compat().then(CP => {
    const byBrand = {};
    Object.entries(CP.a).forEach(([s, v]) => {
      const p = OB.byS[s]; if (!p || !v.t.some(OB.isHelmet)) return;
      v.l.forEach(l => { const b = p.b; byBrand[b] = byBrand[b] || {}; const key = Object.keys(byBrand[b]).find(x => OB.fold(x).replace(/[^a-z0-9]/g, '') === OB.fold(l).replace(/[^a-z0-9]/g, '')) || l; (byBrand[b][key] = byBrand[b][key] || new Set()).add(s); });
    });
    const brands = Object.keys(byBrand).sort((a, b) => a.localeCompare(b, 'sv'));
    const q = OB.qs(); let brand = q.get('m') || '', model = q.get('mod') || '';
    const render = () => {
      $('#vfBrands').innerHTML = brands.map(b => `<button type="button" class="chip${b === brand ? ' on' : ''}" data-vb="${esc(b)}" aria-pressed="${b === brand}">${esc(b)}</button>`).join('');
      const models = brand ? Object.keys(byBrand[brand]).sort((a, b) => a.localeCompare(b, 'sv', { numeric: true })) : [];
      $('#vfModels').innerHTML = brand ? models.map(m => `<button type="button" class="chip${m === model ? ' on' : ''}" data-vm="${esc(m)}" aria-pressed="${m === model}">${esc(m)}</button>`).join('') : '<p class="mut">Välj märke först.</p>';
      const res = $('#vfRes');
      if (brand && model && byBrand[brand][model]) {
        const list = [...byBrand[brand][model]].map(s => OB.byS[s]).filter(Boolean);
        const helmets = [...new Map(list.flatMap(a => CP.a[a.s].t.filter(OB.isHelmet)).map(h => [h.s, h])).values()];
        res.innerHTML = `<div class="phead" style="padding:0;margin:24px 0 12px"><div><p class="lbl">${list.length} tillbehör</p><h2 class="h3">Passar ${esc(brand)} ${esc(model)}</h2></div></div><div class="grid g4">${list.map(OB.card).join('')}</div>${helmets.length ? `<p class="mut" style="margin-top:18px;font-size:14px">Hjälmar i butiken med den här modellbeteckningen: ${helmets.slice(0, 8).map(h => `<a href="produkt.html?p=${encodeURIComponent(h.s)}" style="text-decoration:underline">${esc(OB.pn(h.n))}</a>`).join(', ')}.</p>` : ''}`;
        OB.reveal(res);
      } else res.innerHTML = '';
      history.replaceState(null, '', location.pathname + (brand ? '?m=' + encodeURIComponent(brand) + (model ? '&mod=' + encodeURIComponent(model) : '') : ''));
    };
    $('#vf').addEventListener('click', e => {
      const b = e.target.closest('[data-vb]'); if (b) { brand = b.dataset.vb; model = ''; render(); return; }
      const m = e.target.closest('[data-vm]'); if (m) { model = m.dataset.vm; render(); OB.goTo($('#vfRes'), -120); }
    });
    render();
  });
}

/* ---------- bygg ditt kit ---------- */
if (page === 'kit') {
  const STEPS = {
    gata: [['hjalm', 'Hjälm', ['mc-hjalmar']], ['jacka', 'Jacka', ['jackor', 'skinnstall']], ['byxor', 'Byxor', ['byxor']], ['handskar', 'Handskar', ['mc-handskar']], ['stovlar', 'Stövlar & skor', ['sportstovlar', 'touringstovlar', 'mc-skor', 'adventurestovlar']], ['skydd', 'Extra skydd (valfritt)', ['skydd'], 1]],
    motocross: [['hjalm', 'Crosshjälm', ['crosshjalm']], ['glas', 'Crossglasögon', ['crossglasogon']], ['troja', 'Tröja', ['troja']], ['byxor', 'Crossbyxor', ['crossbyxor']], ['handskar', 'Handskar', ['crosshandskar']], ['stovlar', 'Crosstövlar', ['stovlar', 'endurostovlar']], ['skydd', 'Skydd (valfritt)', ['skydd-2'], 1]],
    snoskoter: [['hjalm', 'Skoterhjälm', ['skoterhjalmar']], ['overall', 'Overall', ['skoteroveraller', 'skoteroverall-herr', 'skoteroverall-dam']], ['glas', 'Glasögon', ['skoterglasogon']], ['handskar', 'Handskar', ['skoterhandskar']], ['stovlar', 'Stövlar', ['skoterstovlar']], ['under', 'Underställ (valfritt)', ['understall', 'understall-4', 'regnklader-understall'], 1]]
  };
  const q = OB.qs();
  let st = OB.store.get('ob-kit', { style: '', pick: {} });
  if (q.get('stil') && STEPS[q.get('stil')] && st.style !== q.get('stil')) st = { style: q.get('stil'), pick: {} };
  const save = () => OB.store.set('ob-kit', st);
  Promise.all([OB.products(), OB.cats()]).then(([P, C]) => {
    const RX = { hjalm: null, jacka: /jack|ställ|stall|hoodie|tröja med skydd/i, byxor: /byx|jeans|ställ|stall|leggings/i, handskar: /handsk|glove/i, stovlar: /stövl|stovl|sko\b|skor\b|boot|sneaker/i, glas: /glasögon|glasogon|goggle/i, troja: /tröj|troj|jersey|shirt/i, overall: /overall|monosuit|ställ|stall|suit/i, skydd: /skydd|väst|vast|airbag|protector|ryggplatta|bröst|knä|armbåg/i, under: /underst|baselayer|tröja|byxa|balaclava/i };
    const inC = (slugs, k) => P.filter(p => slugs.some(s => C[s] && OB.inCat(p, C[s])) && p.a !== 3 && p.i && p.i.length && (k === 'hjalm' ? OB.isHelmet(p) : !RX[k] || RX[k].test(p.n)));
    if (q.get('med') && st.style) { const p = OB.byS[q.get('med')]; if (p) STEPS[st.style].forEach(([k, , sl]) => { if (sl.some(s => C[s] && OB.inCat(p, C[s]))) st.pick[k] = { s: p.s, z: '' }; }); save(); }
    const temp = () => {
      const box = $('#kitTemp'); box.hidden = st.style !== 'snoskoter'; if (box.hidden) return;
      const t = +(box.dataset.t || -15);
      const rec = t <= -20 ? ['Varmt underställ i ull eller syntet + mellanlager i fleece', 'Fodrad, vattentät overall', 'Fodrade handskar – gärna med värme, plus ett par extra torra', 'Elvärmt visir eller anti-imma-glasögon och balaclava', 'Fodrade skoterstövlar med ullsockor']
        : t <= -8 ? ['Funktionsunderställ + tunt mellanlager', 'Fodrad overall', 'Fodrade handskar', 'Hjälm med dubbelvisir/pinlock eller glasögon mot imma', 'Skoterstövlar med varm innersko']
        : ['Tunt underställ som transporterar bort fukt', 'Overall – ofodrad eller med ventilation', 'Tunnare handskar för bättre grepp', 'Glasögon med god ventilation', 'Vattentäta stövlar'];
      box.innerHTML = `<div class="temp"><div><p class="lbl">Klä dig efter vädret</p><h2 class="h3">Planerad temperatur: <span class="tnum">${t} °C</span></h2><input type="range" min="-35" max="5" step="1" value="${t}" id="tR" aria-label="Temperatur i grader"></div><ul>${rec.map(r => `<li>${OB.icon.arrow}${r}</li>`).join('')}</ul></div>`;
      $('#tR').oninput = e => { box.dataset.t = e.target.value; temp(); $('#tR').focus(); };
    };
    const render = () => {
      $$('.kst').forEach(b => b.setAttribute('aria-checked', String(b.dataset.style === st.style)));
      temp();
      const steps = STEPS[st.style]; const box = $('#kitSteps'), sum = $('#kitSum');
      if (!steps) { box.innerHTML = '<p class="mut" style="padding:8px 0">Välj körstil ovan för att börja.</p>'; sum.hidden = true; return; }
      box.innerHTML = steps.map(([k, t, sl, opt], i) => {
        const pk = st.pick[k], pp = pk && OB.byS[pk.s];
        const list = inC(sl, k).slice(0, 18);
        return `<section class="kstep${pp ? ' done' : ''}" id="ks-${k}"><div class="ks-h"><span class="tool-n">${pp ? '✓' : i + 1}</span><h2 class="h3">${t}</h2>${pp ? `<button class="lnk" data-kclr="${k}">Byt</button>` : ''}</div>
        ${pp ? `<div class="ks-pick"><img src="${esc(OB.img(pp.i[0], 'small'))}" alt=""><div><b>${esc(OB.pn(pp.n))}</b><span class="tnum">${kr(pp.p)}</span>${pp.z && pp.z.length > 1 ? `<div class="sizes">${pp.z.map(z => `<button type="button" data-kz="${k}|${esc(z)}" aria-pressed="${pk.z === z}"${OB.mySizeFor(pp, z) ? ' class="mine"' : ''}>${esc(z)}</button>`).join('')}</div>${pk.z ? '' : '<small class="err">Välj storlek</small>'}` : ''}</div></div>`
          : `<div class="rail ks-rail">${list.map(p => `<button type="button" class="kpick" data-kp="${k}|${esc(p.s)}"><img src="${esc(OB.img(p.i[0], 'small'))}" alt="" loading="lazy"><span class="c-brand">${esc(p.b)}</span><b>${esc(OB.pn(p.n))}</b><span class="tnum">${kr(p.p)}</span></button>`).join('')}<a class="kpick more" href="kategori.html?c=${sl[0]}">Se alla ${list.length >= 18 ? '' : ''}${OB.icon.arrow}</a></div>${opt ? `<button class="lnk" data-kskip="${k}">Hoppa över</button>` : ''}`}
        </section>`;
      }).join('');
      const picks = steps.map(([k]) => st.pick[k] && OB.byS[st.pick[k].s] ? [k, OB.byS[st.pick[k].s], st.pick[k].z] : null).filter(Boolean);
      const req = steps.filter(s => !s[3]).length, doneReq = steps.filter(s => !s[3] && st.pick[s[0]]).length;
      const total = picks.reduce((a, [, p]) => a + p.p, 0), disc = picks.length >= OB.KIT.min && OB.KIT.pct ? Math.round(total * OB.KIT.pct / 100) : 0;
      const needSize = picks.some(([, p, z]) => p.z && p.z.length > 1 && !z);
      sum.hidden = false;
      sum.innerHTML = `<p class="lbl">Ditt kit</p><div class="kprog"><i style="width:${(doneReq / req * 100).toFixed(0)}%"></i></div><p class="mut" style="font-size:14px">${doneReq} av ${req} steg klara</p>
        <ul>${picks.map(([k, p, z]) => `<li><span>${esc(OB.pn(p.n))}${z ? ' · ' + esc(z) : ''}</span><b class="tnum">${kr(p.p)}</b></li>`).join('') || '<li class="mut">Inget valt än.</li>'}</ul>
        ${disc ? `<div class="sum kitd"><span>Kitrabatt ${OB.KIT.pct} %</span><b class="tnum">−${kr(disc)}</b></div>` : (OB.KIT.pct ? `<p class="mut" style="font-size:13px">Välj minst ${OB.KIT.min} delar så får du ${OB.KIT.pct} % kitrabatt.</p>` : '')}
        <div class="sum"><span style="font-weight:700">Totalt</span><b class="tnum" style="font-size:22px">${kr(total - disc)}</b></div>
        <button class="btn b-red b-block" id="kitAdd" ${picks.length ? '' : 'disabled'}>${needSize ? 'Välj storlekar först' : 'Lägg kitet i varukorgen'}</button>`;
    };
    $('#kit').addEventListener('click', e => {
      const t = e.target;
      const s = t.closest('.kst'); if (s) { if (st.style !== s.dataset.style) st = { style: s.dataset.style, pick: {} }; save(); render(); OB.goTo($('#kitSteps'), -120); return; }
      const kp = t.closest('[data-kp]'); if (kp) { const [k, slug] = kp.dataset.kp.split('|'); const p = OB.byS[slug]; st.pick[k] = { s: slug, z: p.z && p.z.length === 1 ? p.z[0] : (p.z || []).find(z => OB.mySizeFor(p, z)) || '' }; save(); render(); const nx = $('.kstep:not(.done)'); if (nx) OB.goTo(nx, -140); return; }
      const kz = t.closest('[data-kz]'); if (kz) { const [k, z] = kz.dataset.kz.split('|'); st.pick[k].z = z; save(); render(); return; }
      const kc = t.closest('[data-kclr]'); if (kc) { delete st.pick[kc.dataset.kclr]; save(); render(); return; }
      const ks = t.closest('[data-kskip]'); if (ks) { $('#ks-' + ks.dataset.kskip).classList.add('done'); $('#ks-' + ks.dataset.kskip).hidden = true; return; }
      if (t.closest('#kitAdd')) {
        const steps = STEPS[st.style]; const picks = steps.map(([k]) => st.pick[k]).filter(Boolean);
        const miss = picks.find(pk => { const p = OB.byS[pk.s]; return p.z && p.z.length > 1 && !pk.z; });
        if (miss) { OB.toast('Välj storlek på alla delar i kitet.', 'Storlek saknas'); return; }
        const id = 'kit-' + Date.now().toString(36);
        picks.forEach(pk => OB.addToCart(pk.s, pk.z, 1, { kit: id }));
        OB.toast(picks.length + ' delar' + (picks.length >= OB.KIT.min && OB.KIT.pct ? ' · ' + OB.KIT.pct + ' % kitrabatt' : ''), 'Kitet ligger i varukorgen');
        st.pick = {}; save(); render();
      }
    });
    render();
  });
}

/* ---------- jämför hjälmar ---------- */
if (page === 'jamfor') {
  Promise.all([OB.products(), OB.cats()]).then(([P, C]) => {
    const helmets = P.filter(OB.isHelmet);
    const inp = $('#cmpQ'), sug = $('#cmpSug');
    const rows = [
      ['Pris', p => `<b class="tnum">${kr(p.p)}</b>${p.o ? ` <s class="mut">${kr(p.o)}</s>` : ''}`],
      ['Typ', p => esc((C[p.m] && C[p.m].n) || '–')],
      ['Storlekar', p => esc(p.z && p.z.length ? p.z.join(', ') : '–')],
      ['Färger', p => p.k && OB.groups[p.k] ? OB.groups[p.k].length + ' st' : '1'],
      ['Certifiering', p => p.tg && p.tg.includes('e6') ? 'ECE 22.06' : p.tg && p.tg.includes('e5') ? 'ECE 22.05' : '–'],
      ['Skal', p => p.tg && p.tg.includes('cf') ? 'Kolfiber' : p.tg && p.tg.includes('gf') ? 'Komposit/glasfiber' : p.tg && p.tg.includes('pc') ? 'Termoplast' : '–'],
      ['Vikt', p => p.wt ? 'ca ' + p.wt.toLocaleString('sv-SE') + ' g' : '–'],
      ['Skalstorlekar', p => p.sk || '–'],
      ['Pinlock', p => p.tg && p.tg.includes('pl') ? '✓' : '–'],
      ['Solvisir', p => p.tg && p.tg.includes('sv') ? '✓' : '–'],
      ['Intercom-redo', p => p.tg && p.tg.includes('ic') ? '✓' : '–'],
      ['Lager', p => OB.avail(p) || '–']
    ];
    const render = () => {
      const l = OB.cmpList().map(s => OB.byS[s]).filter(Boolean);
      const box = $('#cmpTbl');
      if (!l.length) { box.innerHTML = `<div class="empty"><p class="h3">Inga hjälmar valda</p><p class="mut">Sök ovan eller tryck på jämför-ikonen på en hjälm i butiken.</p><a class="btn b-dark" href="kategori.html?c=mc-hjalmar">Bläddra bland hjälmar</a></div>`; return; }
      box.innerHTML = `<div class="cmp-wrap" data-lenis-prevent><table class="cmp"><thead><tr><th class="sr">Egenskap</th>${l.map(p => `<th scope="col"><div class="cmp-h"><button class="icb" data-cmp="${esc(p.s)}" aria-label="Ta bort">×</button><a href="produkt.html?p=${encodeURIComponent(p.s)}"><img src="${esc(OB.img(p.i && p.i[0], 'small'))}" alt=""><span class="c-brand">${esc(p.b)}</span><b>${esc(OB.pn(p.n))}</b></a><button class="add" data-quick="${esc(p.s)}" aria-label="Lägg i varukorgen">${OB.icon.plus}</button></div></th>`).join('')}${l.length < 3 ? '<th class="cmp-ph"><span>Lägg till en hjälm till</span></th>' : ''}</tr></thead><tbody>${rows.map(([t, fn]) => `<tr><th scope="row">${t}</th>${l.map(p => `<td>${fn(p)}</td>`).join('')}${l.length < 3 ? '<td></td>' : ''}</tr>`).join('')}</tbody></table></div>`;
    };
    const search = () => {
      const v = inp.value.trim(); if (!v) { sug.innerHTML = ''; return; }
      const r = OB.findProducts(v).r.filter(OB.isHelmet).slice(0, 8);
      sug.innerHTML = r.map(p => `<button type="button" data-cmp="${esc(p.s)}" class="s-item">${p.i ? `<img src="${esc(OB.img(p.i[0], 'tiny'))}" alt="">` : ''}<span><b>${esc(OB.pn(p.n))}</b><small>${kr(p.p)}</small></span></button>`).join('') || '<p class="mut" style="padding:10px">Ingen hjälm matchar.</p>';
    };
    inp.addEventListener('input', search);
    document.addEventListener('ob:cmp', () => { render(); inp.value = ''; sug.innerHTML = ''; });
    render();
  });
}

/* ---------- D-Air-bokning ---------- */
if (page === 'dair') {
  const cal = $('#dCal'); let pick = '';
  const days = []; const d0 = new Date(); d0.setDate(d0.getDate() + 1);
  for (let d = new Date(d0); days.length < 30; d.setDate(d.getDate() + 1)) { const w = d.getDay(); if (w && w < 6) days.push(new Date(d)); }
  const fmt = d => d.toISOString().slice(0, 10);
  const wd = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'], mo = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const draw = () => { cal.innerHTML = `<div class="cal-row" role="radiogroup" aria-label="Önskad dag" data-lenis-prevent>${days.map(d => `<button type="button" role="radio" aria-checked="${fmt(d) === pick}" data-day="${fmt(d)}"><small>${wd[d.getDay()]}</small><b>${d.getDate()}</b><small>${mo[d.getMonth()]}</small></button>`).join('')}</div>`; };
  cal.addEventListener('click', e => { const b = e.target.closest('[data-day]'); if (b) { pick = b.dataset.day; draw(); $('#dErr').textContent = ''; } });
  draw();
  const f = $('#dairForm');
  f.addEventListener('submit', e => {
    e.preventDefault();
    let bad = null;
    $$('[required]', f).forEach(i => { const ok = i.type === 'checkbox' ? i.checked : i.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(i.value.trim()) : !!i.value.trim(); const fl = i.closest('.fld'); if (fl) fl.classList.toggle('bad', !ok); if (!ok && !bad) bad = i; });
    if (!pick && !bad) bad = cal;
    $('#dErr').textContent = bad ? (bad === cal ? 'Välj önskad dag.' : 'Fyll i de markerade fälten.') : '';
    if (bad) { (bad.focus ? bad : cal).focus && bad.focus(); OB.goTo(bad === cal ? cal : bad, -140); return; }
    const v = n => (f.elements[n] ? (f.elements[n].value || '').trim() : '');
    const ref = 'DA-' + Date.now().toString(36).toUpperCase().slice(-6);
    const b = { ref, sys: v('sys'), case: v('case'), date: pick, slot: v('slot'), drop: v('drop'), d: new Date().toISOString().slice(0, 10) };
    const all = OB.store.get('ob-book', []); all.unshift(b); OB.store.set('ob-book', all.slice(0, 20));
    OB.mailto('Bokningsförfrågan D-Air service ' + ref, `Hej Onebike!\n\nJag vill boka D-Air service.\n\nReferens: ${ref}\nProdukt: ${b.sys}\nSerienummer: ${v('ser') || '–'}\nÄrende: ${b.case}\nÖnskad dag: ${pick} (${b.slot.toLowerCase()})\nInlämning: ${b.drop}\n\nNamn: ${v('name')}\nTelefon: ${v('tel')}\nE-post: ${v('mail')}\n${v('msg') ? '\nMeddelande: ' + v('msg') + '\n' : ''}`);
    f.hidden = true;
    const done = $('#dDone'); done.hidden = false;
    done.innerHTML = `<div class="tool done-box"><p class="lbl">Förfrågan ${esc(ref)}</p><h2 class="h3">Tack! Nu öppnas ditt e-postprogram.</h2><p>Tryck på skicka i mejlet. Vi bekräftar tiden via e-post eller telefon.</p><p class="mut"><span>Önskad dag</span>: ${esc(pick)} · <span>${esc(b.slot)}</span></p><div class="kbtn"><button class="btn b-dark" id="dIcs">${'<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'}Lägg i kalendern (preliminärt)</button><a class="btn b-line" href="konto.html#kBook">Mina bokningar</a></div></div>`;
    $('#dIcs').onclick = () => OB.ics('onebike-d-air', [{ date: pick, title: 'D-Air service hos Onebike (preliminär) – ' + ref, desc: b.sys + ' · ' + b.case + '. Tiden gäller när Onebike har bekräftat den. 073-735 11 35' }]);
    OB.goTo(done, -120);
  });
}
})();