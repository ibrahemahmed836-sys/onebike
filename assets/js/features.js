/* Onebike – funktioner för förare: mitt garage, min storlek, jämför, bevaka, recensioner, utrustning & påminnelser,
   säsong, app-installation och engelsk översättning. Allt sparas lokalt i webbläsaren tills butikens system kopplas in. */
(() => {
'use strict';
const OB = window.OB, { $, $$, esc, kr, store } = OB;
const MAIL = 'info@onebike.se';
const today = () => new Date().toISOString().slice(0, 10);
const okMail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
OB.mailto = (subject, body) => { location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body); };

/* ---------- generiskt dialogfönster ---------- */
OB.modal = (title, body, foot = '') => {
  $('#genT').textContent = title; $('#genB').innerHTML = body; $('#genF').innerHTML = foot; $('#genF').hidden = !foot;
  OB.open('gen');
  return $('#ov-gen');
};

/* ---------- kalenderfil (.ics) ---------- */
OB.ics = (name, events) => {
  const d = s => s.replace(/-/g, '');
  const escI = s => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Onebike//SV', 'CALSCALE:GREGORIAN'];
  events.forEach((e, i) => {
    const end = new Date(e.date + 'T12:00:00'); end.setDate(end.getDate() + 1);
    lines.push('BEGIN:VEVENT', 'UID:' + Date.now() + '-' + i + '@onebike.se', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART;VALUE=DATE:' + d(e.date), 'DTEND;VALUE=DATE:' + end.toISOString().slice(0, 10).replace(/-/g, ''), 'SUMMARY:' + escI(e.title), 'DESCRIPTION:' + escI(e.desc || ''),
      'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', 'DESCRIPTION:' + escI(e.title), 'END:VALARM', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  a.download = name + '.ics'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
};

/* ---------- säsong ---------- */
OB.season = () => {
  const q = OB.qs().get('season'); if (q === 'winter' || q === 'summer') return q;
  const m = new Date().getMonth() + 1; return (m >= 11 || m <= 3) ? 'winter' : 'summer';
};

/* ---------- min storlek ---------- */
const SIZES = [['XXS', 51, 52], ['XS', 53, 54], ['S', 55, 56], ['M', 57, 58], ['L', 59, 60], ['XL', 61, 62], ['XXL', 63, 64], ['3XL', 65, 66]];
const SZN = z => String(z || '').toUpperCase().replace(/\s/g, '').replace(/^2XL$/, 'XXL').replace(/^XXXL$/, '3XL').replace(/^2XS$/, 'XXS');
OB.helmetSize = cm => {
  cm = +cm; if (!cm) return null;
  if (cm < 51) return { size: 'XXS', small: true };
  if (cm > 66) return { size: '3XL', big: true };
  const f = SIZES.find(([, a, b]) => cm >= a && cm <= b + .49);
  if (f) return { size: f[0] };
  const lo = SIZES.filter(([, , b]) => b < cm).pop(), hi = SIZES.find(([, a]) => a > cm);
  return { size: lo ? lo[0] : hi[0], alt: hi && lo ? hi[0] : null, between: true };
};
OB.mySize = () => store.get('ob-size', null);
OB.mySizeFor = (p, z) => { const m = OB.mySize(); return !!(m && OB.isHelmet(p) && SZN(z) === SZN(m.size)); };

/* ---------- mitt garage ---------- */
OB.BIKES = ['BMW', 'Ducati', 'Honda', 'Husqvarna', 'Kawasaki', 'KTM', 'Suzuki', 'Triumph', 'Yamaha', 'Aprilia', 'Harley-Davidson', 'Beta', 'GasGas', 'Sherco', 'TM'];
OB.garage = () => store.get('ob-garage', null);
const fold = OB.fold;
const modelKey = s => fold(s).replace(/[^a-z0-9]/g, '');
OB.fitsGarage = p => {
  const g = OB.garage(); if (!g || !g.make || !p) return 0;
  const n = fold(p.n);
  if (!n.includes(fold(g.make)) && !(g.model && modelKey(p.n).includes(modelKey(g.model)))) return 0;
  if (!g.model) return 1;
  if (!modelKey(p.n).includes(modelKey(g.model))) return 1;
  if (g.year) {  // årsintervall i namnet, t.ex. "2019-2024", "2021-" eller "19-"
    const y = +g.year; const m = p.n.match(/\b((?:19|20)?\d{2})\s*-\s*((?:19|20)?\d{2})?(?!\d)/);
    if (m) { const yy = v => v ? (+v < 100 ? 2000 + +v : +v) : 9999; const a = yy(m[1]), b = m[2] ? yy(m[2]) : 9999; if (a > 1990 && (y < a || y > b)) return 1; }
  }
  return 2;
};
OB.openGarage = () => {
  const g = OB.garage() || {};
  const models = new Set();
  (OB.P || []).forEach(p => { if (/avgas|akrapovic|yoshimura|garage|depå|stöd/i.test(p.n + ' ' + p.c.join(' '))) { const m = p.n.match(/\b(?:BMW|Ducati|Honda|Husqvarna|Kawasaki|KTM|Suzuki|Triumph|Yamaha|Aprilia)\s+([A-Z0-9][\w-]{1,10}(?:\s?[A-Z0-9][\w-]{0,6})?)/); if (m) models.add(m[1].replace(/\s+\d{4}.*$/, '')); } });
  OB.modal('Mitt garage', `<form id="gForm" class="form" novalidate style="padding-top:8px">
    <p class="mut">Spara din motorcykel så visar vi delar som passar den först – och markerar dem med <b>Passar din MC</b>.</p>
    <div class="fld"><label for="gMake">Märke *</label><select id="gMake" required><option value="">Välj märke…</option>${OB.BIKES.map(b => `<option${g.make === b ? ' selected' : ''}>${b}</option>`).join('')}</select></div>
    <div class="fld"><label for="gModel">Modell</label><input id="gModel" list="gModels" value="${esc(g.model || '')}" placeholder="t.ex. S1000RR, MT-07, CRF450R" autocomplete="off"><datalist id="gModels">${[...models].slice(0, 80).map(m => `<option value="${esc(m)}">`).join('')}</datalist></div>
    <div class="fld"><label for="gYear">Årsmodell</label><input id="gYear" inputmode="numeric" maxlength="4" value="${esc(g.year || '')}" placeholder="t.ex. 2021"></div>
    <p class="err" id="gErr" aria-live="polite"></p></form>`,
    `<div class="row" style="display:flex;gap:10px">${g.make ? '<button class="btn b-line" id="gClear" style="flex:none">Ta bort</button>' : ''}<button class="btn b-red" id="gSave" style="flex:1">Spara min motorcykel</button></div>`);
  if (!OB.P) OB.products().then(() => { const dl = $('#gModels'); if (dl && !dl.children.length) { OB.close(true); OB.openGarage(); } });
  $('#gSave').onclick = () => {
    const make = $('#gMake').value, model = $('#gModel').value.trim(), year = $('#gYear').value.replace(/\D/g, '').slice(0, 4);
    if (!make) { $('#gErr').textContent = 'Välj märke på din motorcykel.'; $('#gMake').focus(); return; }
    store.set('ob-garage', { make, model, year }); OB.close(); OB.toast(make + (model ? ' ' + model : '') + (year ? ' (' + year + ')' : ''), 'Sparad i Mitt garage');
    document.dispatchEvent(new CustomEvent('ob:garage'));
  };
  const c = $('#gClear'); if (c) c.onclick = () => { localStorage.removeItem('ob-garage'); OB.close(); document.dispatchEvent(new CustomEvent('ob:garage')); };
};

/* ---------- jämför ---------- */
OB.cmpList = () => store.get('ob-cmp', []);
OB.cmpHas = s => OB.cmpList().includes(s);
const renderCmpBar = () => {
  const bar = $('#cmpBar'); if (!bar) return;
  const l = OB.cmpList();
  if (!l.length || !['lista', 'produkt'].includes(document.body.dataset.page)) { bar.hidden = true; document.body.classList.remove('has-cmp'); return; }
  const pics = l.map(s => { const p = OB.byS && OB.byS[s]; return `<span class="cb-it">${p && p.i ? `<img src="${esc(OB.img(p.i[0], 'tiny'))}" alt="">` : ''}<button data-cmp="${esc(s)}" aria-label="Ta bort ${esc(p ? OB.pn(p.n) : s)} från jämförelsen">×</button></span>`; }).join('');
  bar.innerHTML = `<div class="cb-in"><span class="cb-t"><b>Jämför hjälmar</b><small>${l.length} av 3 valda</small></span><span class="cb-pics">${pics}</span><a class="btn b-red" href="jamfor.html">Jämför${OB.icon.arrow}</a></div>`;
  bar.hidden = false; document.body.classList.add('has-cmp');
};
OB.toggleCmp = s => {
  let l = OB.cmpList();
  if (l.includes(s)) l = l.filter(x => x !== s);
  else { if (l.length >= 3) { OB.toast('Ta bort en hjälm för att lägga till en ny.', 'Max tre hjälmar'); return; } l.push(s); }
  store.set('ob-cmp', l);
  $$(`[data-cmp="${CSS.escape(s)}"]`).forEach(b => b.setAttribute('aria-pressed', String(l.includes(s))));
  renderCmpBar(); document.dispatchEvent(new CustomEvent('ob:cmp'));
};

/* ---------- bevaka pris & lager ---------- */
OB.watches = () => store.get('ob-watch', []);
OB.openWatch = p => {
  const sizes = p.z || [];
  OB.modal('Bevaka pris och lager', `<form id="wForm" class="form" novalidate style="padding-top:8px">
    <p class="mut">Vi mejlar dig när <b>${esc(OB.pn(p.n))}</b> finns i lager i din storlek eller när priset sänks.</p>
    ${sizes.length > 1 ? `<div class="fld"><label for="wSize">Storlek</label><select id="wSize"><option value="">Alla storlekar</option>${sizes.map(z => `<option${OB.mySizeFor(p, z) ? ' selected' : ''}>${esc(z)}</option>`).join('')}</select></div>` : ''}
    <div class="fld"><span style="font-weight:700">Meddela mig när</span><label class="chk"><input type="checkbox" id="wStock" checked><span>Den finns i lager</span></label><label class="chk"><input type="checkbox" id="wPrice" checked><span>Priset sänks (nu ${kr(p.p)})</span></label></div>
    <div class="fld"><label for="wMail">Din e-post *</label><input id="wMail" type="email" autocomplete="email" required></div>
    <label class="chk fld"><input type="checkbox" id="wOk" required><span>Onebike får spara min e-post för just den här bevakningen. Jag kan avsluta den när som helst.</span></label>
    <p class="err" id="wErr" aria-live="polite"></p></form>`,
    `<button class="btn b-red b-block" id="wSave">Starta bevakning</button><p class="mut" style="font-size:13px;margin-top:8px">Bevakningen skickas till Onebike via ditt e-postprogram och sparas under Mitt Onebike.</p>`);
  $('#wSave').onclick = () => {
    const mail = $('#wMail').value.trim(), size = $('#wSize') ? $('#wSize').value : (sizes[0] || '');
    if (!okMail(mail)) { $('#wErr').textContent = 'Ange en giltig e-postadress.'; $('#wMail').focus(); return; }
    if (!$('#wOk').checked) { $('#wErr').textContent = 'Godkänn att vi sparar e-posten för bevakningen.'; return; }
    const w = OB.watches().filter(x => !(x.s === p.s && x.z === size));
    w.unshift({ s: p.s, n: p.n, z: size, pr: p.p, d: today(), st: $('#wStock').checked, pc: $('#wPrice').checked }); store.set('ob-watch', w.slice(0, 30));
    OB.close();
    OB.mailto('Bevakning: ' + p.n + (size ? ' (' + size + ')' : ''), `Hej Onebike!\n\nMeddela mig när ${p.n}${size ? ' i storlek ' + size : ''}:\n${$('#wStock').checked ? '- finns i lager\n' : ''}${$('#wPrice').checked ? '- sänks i pris (nu ' + kr(p.p) + ')\n' : ''}\nProdukt: ${location.href}\nE-post: ${mail}\n`);
    OB.toast(OB.pn(p.n), 'Bevakning startad');
    document.dispatchEvent(new CustomEvent('ob:watch'));
  };
};

/* ---------- recensioner ---------- */
OB.reviews = s => (store.get('ob-rev', {})[s] || []);
OB.openReview = p => {
  const stars = [1, 2, 3, 4, 5].map(n => `<label class="star"><input type="radio" name="rStar" value="${n}"${n === 5 ? ' checked' : ''}><span aria-hidden="true">★</span><span class="sr">${n} av 5</span></label>`).join('');
  OB.modal('Skriv en recension', `<form id="rForm" class="form" novalidate style="padding-top:8px">
    <p class="mut">Hjälp andra förare med passformen på <b>${esc(OB.pn(p.n))}</b>.</p>
    <div class="fld"><span style="font-weight:700">Betyg</span><div class="stars" role="radiogroup" aria-label="Betyg">${stars}</div></div>
    <div class="fld"><span style="font-weight:700">Hur var storleken?</span><div class="chips"><label class="chipr"><input type="radio" name="rFit" value="Liten"><span>Liten i storleken</span></label><label class="chipr"><input type="radio" name="rFit" value="Rätt" checked><span>Rätt storlek</span></label><label class="chipr"><input type="radio" name="rFit" value="Stor"><span>Stor i storleken</span></label></div></div>
    <div class="two">${p.z && p.z.length ? `<div class="fld"><label for="rSize">Storlek du köpte</label><select id="rSize"><option value="">–</option>${p.z.map(z => `<option>${esc(z)}</option>`).join('')}</select></div>` : ''}<div class="fld"><label for="rLen">Din längd (cm)</label><input id="rLen" inputmode="numeric" maxlength="3"></div></div>
    <div class="fld"><label for="rHead">${OB.isHelmet(p) ? 'Huvudomfång (cm)' : 'Vikt (kg)'}</label><input id="rHead" inputmode="decimal" maxlength="5"></div>
    <div class="fld"><label for="rTxt">Din recension *</label><textarea id="rTxt" required placeholder="Passform, komfort, ljud, ventilation …"></textarea></div>
    <div class="fld"><label for="rName">Namn som visas *</label><input id="rName" autocomplete="given-name" required></div>
    <p class="err" id="rErr" aria-live="polite"></p></form>`,
    `<button class="btn b-red b-block" id="rSave">Skicka recension</button><p class="mut" style="font-size:13px;margin-top:8px">Recensioner granskas av Onebike innan de publiceras för alla. Din visas direkt för dig.</p>`);
  $('#rSave').onclick = () => {
    const txt = $('#rTxt').value.trim(), name = $('#rName').value.trim();
    if (txt.length < 10 || !name) { $('#rErr').textContent = 'Skriv minst en mening och ditt namn.'; return; }
    const r = { st: +($('[name=rStar]:checked') || {}).value || 5, fit: ($('[name=rFit]:checked') || {}).value || 'Rätt', z: $('#rSize') ? $('#rSize').value : '', len: $('#rLen').value.replace(/\D/g, ''), hd: $('#rHead').value.trim(), t: txt, n: name, d: today() };
    const all = store.get('ob-rev', {}); (all[p.s] = all[p.s] || []).unshift(r); store.set('ob-rev', all);
    OB.close();
    OB.mailto('Recension: ' + p.n, `Ny recension att granska\n\nProdukt: ${p.n}\n${location.href}\n\nBetyg: ${r.st}/5\nStorlek: ${r.fit}${r.z ? ' (köpt ' + r.z + ')' : ''}\nLängd: ${r.len || '–'} cm\n${OB.isHelmet(p) ? 'Huvudomfång' : 'Vikt'}: ${r.hd || '–'}\n\n${r.t}\n\n– ${r.n}`);
    document.dispatchEvent(new CustomEvent('ob:rev', { detail: p.s }));
  };
};

/* ---------- utrustning & påminnelser ---------- */
OB.gear = () => store.get('ob-gear', []);
OB.addGear = g => { const l = OB.gear(); l.unshift(Object.assign({ id: Date.now().toString(36) }, g)); store.set('ob-gear', l.slice(0, 40)); };
OB.gearDue = g => {
  if (g.next) return g.next;
  if (g.type === 'hjalm' && g.date) { const d = new Date(g.date); d.setFullYear(d.getFullYear() + 5); return d.toISOString().slice(0, 10); }
  return '';
};

/* ---------- kompatibilitet (tillbehör ↔ modeller) ---------- */
let _cp;
OB.compat = () => _cp || (_cp = Promise.all([OB.products(), fetch(OB.R + 'data/compat.json' + OB.V).then(r => r.json())]).then(([P, j]) => {
  const a = {}, t = {};
  Object.entries(j).forEach(([ax, [labels, tx]]) => {
    const ap = P[+ax]; if (!ap) return;
    a[ap.s] = { l: labels, t: tx.map(i => P[i]).filter(Boolean) };
    tx.forEach(i => { const tp = P[i]; if (tp) (t[tp.s] = t[tp.s] || []).push(ap); });
  });
  return (OB.CP = { a, t });
}).catch(() => (OB.CP = { a: {}, t: {} })));

/* ---------- skyddsetiketter ---------- */
OB.TAGS = {
  e6: ['ECE 22.06', 'Hjälmen är godkänd enligt den senaste europeiska standarden ECE 22.06, med tuffare krav på bland annat roterande krafter och visir.'],
  e5: ['ECE 22.05', 'Godkänd enligt den tidigare europeiska hjälmstandarden ECE 22.05.'],
  pl: ['Pinlock', 'Visiret är förberett för eller levereras med Pinlock-lins mot imma.'],
  sv: ['Solvisir', 'Inbyggt solvisir som fälls ned vid behov.'],
  ic: ['Intercom-redo', 'Förberedd för kommunikationssystem, till exempel med plats för högtalare.'],
  cf: ['Kolfiber', 'Skal i kolfiber eller kolfiberkomposit – starkt och lätt.'],
  gf: ['Kompositskal', 'Skal i glasfiber- eller kompositmaterial.'],
  pc: ['Termoplast', 'Skal i polykarbonat/termoplast.'],
  mp: ['MIPS', 'MIPS-skikt som minskar rotationskrafter vid sned islagsvinkel.']
};
OB.tagList = p => {
  const out = (p.tg || []).filter(t => OB.TAGS[t]).map(t => OB.TAGS[t]);
  if (p.cl) out.push(['EN 17092 klass ' + p.cl, 'Plagget är testat som skyddsplagg enligt EN 17092. AAA är högsta klassen, därefter AA och A.']);
  if (p.lv) out.push(['Skydd nivå ' + p.lv, 'CE-godkänt skydd. Nivå 2 tål mer energi än nivå 1.']);
  if (p.wt) out.push(['Vikt ca ' + p.wt.toLocaleString('sv-SE') + ' g', 'Vikten enligt tillverkaren, oftast för storlek M.']);
  if (p.sk) out.push([p.sk + ' skalstorlekar', 'Fler skalstorlekar ger bättre passform och mindre hjälm på mindre huvuden.']);
  return out;
};

/* ---------- storleksverktyg i dialog ---------- */
OB.openSizeTool = (p, onSave) => {
  const m = OB.mySize() || { cm: 57 };
  OB.modal('Hitta din hjälmstorlek', `<div style="display:flex;flex-direction:column;gap:14px;padding-top:6px"><p class="mut">Mät runt huvudets bredaste del, ungefär en centimeter ovanför ögonbrynen och öronen.</p>
    <div class="stepper"><button type="button" data-mh="-0.5" aria-label="Minska">−</button><input id="mhcm" type="number" inputmode="decimal" min="48" max="68" step="0.5" value="${m.cm}" aria-label="Huvudomfång i cm"><span>cm</span><button type="button" data-mh="0.5" aria-label="Öka">+</button></div>
    <div class="size-res" style="margin:0"><div><p class="lbl">Din storlek</p><p class="size-big" id="mhRes"></p><p class="mut" id="mhTxt"></p></div></div>
    <a class="lnk" href="storleksguide.html">Så mäter du – och så ska hjälmen sitta${OB.icon.arrow}</a></div>`,
    '<button class="btn b-red b-block" id="mhSave">Spara och visa min storlek</button>');
  const inp = $('#mhcm');
  const upd = () => { const r = OB.helmetSize(inp.value); if (!r) return; $('#mhRes').textContent = r.size + (r.alt ? '/' + r.alt : ''); $('#mhTxt').textContent = r.between ? 'Mellan två storlekar – prova båda. Välj den mindre om den sitter tätt utan tryckpunkter.' : (p && p.z && !p.z.some(z => OB.fold(z) === OB.fold(r.size)) ? 'Den här hjälmen finns tyvärr inte i din storlek.' : 'Enligt den vanligaste storlekstabellen.'); };
  $('#genB').onclick = e => { const b = e.target.closest('[data-mh]'); if (b) { inp.value = Math.min(68, Math.max(48, (+inp.value || 57) + +b.dataset.mh)); upd(); } };
  inp.oninput = upd; upd();
  $('#mhSave').onclick = () => { const r = OB.helmetSize(inp.value); if (!r) return; store.set('ob-size', { cm: +inp.value, size: r.size, alt: r.alt || null, shape: (OB.mySize() || {}).shape || 'mellan', d: today() }); OB.close(); OB.toast('Storlek ' + r.size + ' · ' + inp.value + ' cm', 'Din storlek är sparad'); onSave && onSave(); };
};

/* ---------- klick ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const c = t.closest('[data-cmp]'); if (c) { e.preventDefault(); OB.products().then(() => OB.toggleCmp(c.dataset.cmp)); return; }
  const g = t.closest('[data-garage]'); if (g) { e.preventDefault(); OB.products().then(OB.openGarage); return; }
  const ins = t.closest('[data-install]'); if (ins) { e.preventDefault(); install(); return; }
});

/* ---------- app (PWA) ---------- */
let deferred = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const showInstall = on => { $$('[data-install]').forEach(b => b.hidden = !on); $$('[data-install-box]').forEach(b => b.hidden = !on); };
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; showInstall(true); });
addEventListener('appinstalled', () => { deferred = null; showInstall(false); OB.toast('Onebike finns nu på din hemskärm.', 'Appen är installerad'); });
function install() {
  if (deferred) { deferred.prompt(); deferred.userChoice.finally(() => { deferred = null; }); return; }
  OB.modal('Lägg Onebike på hemskärmen', isIOS
    ? '<ol class="steps-ol"><li>Tryck på <b>Dela</b>-knappen i Safari (rutan med pilen uppåt).</li><li>Välj <b>Lägg till på hemskärmen</b>.</li><li>Tryck på <b>Lägg till</b>. Klart!</li></ol>'
    : '<ol class="steps-ol"><li>Öppna webbläsarens meny (⋮ eller ⋯).</li><li>Välj <b>Installera app</b> eller <b>Lägg till på startskärmen</b>.</li><li>Bekräfta. Onebike öppnas sedan som en egen app.</li></ol>');
}
if (!standalone() && isIOS) showInstall(true);
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !OB.qs().has('nosw')) {
  addEventListener('load', () => navigator.serviceWorker.register(OB.R + 'sw.js', { scope: OB.R || './' }).catch(() => {}));
}

/* ---------- språkväxling: behåll sida och parametrar ---------- */
$$('a[data-lang]').forEach(a => { a.href = a.getAttribute('href').split('?')[0] + location.search + location.hash; });

/* ---------- engelsk översättning (bara på /en/) ---------- */
if (OB.lang === 'en' && window.OB_I18N) {
  const D = OB_I18N.s || {}, R = (OB_I18N.r || []).map(([a, b]) => [new RegExp('^' + a + '$'), b]);
  const W = OB_I18N.w || {};
  const tr = txt => {
    const k = txt.replace(/\s+/g, ' ').trim(); if (!k || k.length > 400) return null;
    let v = D[k];
    if (v == null) for (const [re, b] of R) { if (re.test(k)) { v = k.replace(re, b); break; } }
    return v == null ? null : txt.replace(txt.trim(), v);
  };
  // produktnamn: ordvis (färger, plaggtyper) – märken och modeller lämnas orörda
  const keys = Object.keys(W).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const reW = keys.length ? new RegExp('(^|[\\s/(,–-])(' + keys.join('|') + ')(?=$|[\\s/),–-])', 'gi') : null;
  OB._pn = n => reW ? n.replace(reW, (m, pre, w) => { const lw = w.toLowerCase(); const en = W[lw] || W[w] || w; return pre + (w[0] === w[0].toUpperCase() ? en.charAt(0).toUpperCase() + en.slice(1) : en); }) : n;
  const ATTR = ['placeholder', 'aria-label', 'title', 'alt'];
  const fixEl = el => {
    if (!el || el.nodeType !== 1 || el.closest('script,style,[data-notr]')) return;
    ATTR.forEach(a => { const v = el.getAttribute(a); if (v) { const t = tr(v); if (t != null && t !== v) el.setAttribute(a, t); } });
  };
  const walk = root => {
    if (root.nodeType === 3) { const t = tr(root.nodeValue); if (t != null && t !== root.nodeValue) root.nodeValue = t; return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA)$/.test(root.nodeName) || (root.closest && root.closest('[data-notr]'))) return;
    fixEl(root);
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: n => n.nodeType === 1 && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    let n; while ((n = it.nextNode())) { if (n.nodeType === 3) { const t = tr(n.nodeValue); if (t != null && t !== n.nodeValue) n.nodeValue = t; } else fixEl(n); }
  };
  walk(document.body);
  new MutationObserver(ms => ms.forEach(m => {
    if (m.type === 'characterData') walk(m.target);
    else if (m.type === 'attributes') fixEl(m.target);
    else m.addedNodes.forEach(walk);
  })).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTR });
  const tt = () => { const t = tr(document.title.replace(/\s*\|\s*Onebike$/, '')); if (t) document.title = t + ' | Onebike'; };
  tt(); new MutationObserver(tt).observe($('title'), { childList: true });
}

/* ---------- start ---------- */
if (OB.cmpList().length) OB.products().then(renderCmpBar); else renderCmpBar();
document.addEventListener('ob:garage', () => { $$('[data-garage-label]').forEach(el => { const g = OB.garage(); el.textContent = g ? g.make + (g.model ? ' ' + g.model : '') + (g.year ? ' · ' + g.year : '') : 'Lägg till din motorcykel'; }); });
document.dispatchEvent(new CustomEvent('ob:garage'));
})();
