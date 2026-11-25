/* Onebike – startsidans kreativa scroll: pinnad start, horisontell kategoribana, visir-spotlight, ordfyllning, zoom. */
(() => {
'use strict';
const OB = window.OB, { $, $$, esc, kr, RM } = OB;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = t => 1 - Math.pow(1 - t, 3);
const HP = window.HOME_PRODUCTS || [];
const byS = {}; HP.forEach(p => byS[p.s] = p);

/* ---------- produkter på startsidan ---------- */
const TABS = { mc: ['agv-k1-s-hjalm-mattsvart', 'agv-gt-2-silverspegel-visir', 'agv-gt-2-blaspegel-visir', 'agv-gt-2-morkrok-visir', 'agv-gt-2-guldspegel-visir', 'dainese-d-core-aero-byxa-svart-bla'], mx: [], sn: [] };
const rail = $('#rail');
let tab = 'mc';
function renderRail() {
  const list = HP.filter(p => p.t === tab);
  rail.innerHTML = list.map((p, i) => OB.card(p, i)).join('') + `<a href="kategori.html?c=${tab === 'mc' ? 'motorcykel' : tab === 'mx' ? 'motocross' : 'snoskoter'}" class="endcard"><span class="xp" style="font-size:28px;font-weight:800;line-height:1.05">Se hela sortimentet</span><span style="display:flex;flex-direction:column;gap:16px"><span style="font-size:15px;color:#C9C9CE">Över 2 000 produkter för motorcykel, motocross och snöskoter.</span><span class="go">${OB.icon.arrow}</span></span></a>`;
  $$('.tab').forEach(t => t.setAttribute('aria-pressed', String(t.dataset.tab === tab)));
  rail.scrollTo({ left: 0 });
  $$('.card', rail).forEach((c, i) => { c.classList.add('pop'); c.style.setProperty('--i', i); });
}
// gör byS tillgängligt för snabbköp innan hela katalogen laddats
OB.byS = OB.byS || {}; HP.forEach(p => { if (!OB.byS[p.s]) OB.byS[p.s] = p; });
$$('.tab').forEach(t => t.addEventListener('click', () => { tab = t.dataset.tab; renderRail(); }));
$('#prev').onclick = () => rail.scrollBy({ left: -Math.max(300, rail.clientWidth * .8), behavior: RM ? 'auto' : 'smooth' });
$('#next').onclick = () => rail.scrollBy({ left: Math.max(300, rail.clientWidth * .8), behavior: RM ? 'auto' : 'smooth' });
renderRail();

/* ---------- visir ---------- */
const VZ = HP.filter(p => p.v);
const spStage = $('#spStage');
spStage.insertAdjacentHTML('beforeend', VZ.map((p, i) => `<div class="vz vz-${i + 1}"><a href="produkt.html?p=${encodeURIComponent(p.s)}" tabindex="-1" aria-hidden="true"><img src="${esc(OB.img(p.i[0], 'small'))}" alt="${esc(p.n)}" loading="lazy"></a><div class="vz-row"><span>${esc(p.v)}<b>${kr(p.p)}</b></span><button class="add" data-quick="${esc(p.s)}" aria-label="Lägg ${esc(p.n)} i varukorgen">${OB.icon.plus}</button></div></div>`).join(''));
$('#spList').innerHTML = VZ.map(p => `<a class="sp-li" href="produkt.html?p=${encodeURIComponent(p.s)}"><i style="background:${p.g}"></i>${esc(p.v)}<b>${kr(p.p)}</b></a>`).join('');
const vzEls = $$('.vz'), spLis = $$('.sp-li');

/* ---------- löpband ---------- */
const mq = $('#mq'), bm = $('#bm');
mq.insertAdjacentHTML('beforeend', $('.mq-set', mq).outerHTML.replace('class="mq-set"', 'class="mq-set" aria-hidden="true"').repeat(2));
bm.insertAdjacentHTML('beforeend', $('.bm-set', bm).outerHTML.repeat(2));

/* ---------- ord för ord ---------- */
const stmt = $('#stmt');
stmt.innerHTML = stmt.textContent.trim().split(/\s+/).map(w => `<span class="wd">${esc(w)}</span>`).join(' ');
const words = $$('.wd', stmt);

/* ---------- nyheter (laddas efter start) ---------- */
const newRail = $('#newRail');
if (newRail) {
  const load = () => OB.products().then(P => { newRail.innerHTML = P.filter(p => p.w && p.i && p.i.length).slice(-16).reverse().map(OB.card).join(''); });
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 2500 }); else setTimeout(load, 1500);
}

/* ---------- scroll-motor ---------- */
const gears = $$('.gear');
const secStart = $('#start'), secKat = $('#kategorier'), secVis = $('#visir'), secSky = $('#skydd');
const panels = $$('.ip'), panelImgs = $$('.ip img'), iLogo = $('#iLogo'), iScrim = $('#iScrim'), iCopy = $('#iCopy'), wordsH = $$('#h1 .w'), fx = $$('#start .fx'), cue = $('#cue');
const track = $('#track'), cps = $$('.cp'), cpImgs = $$('.cp-img img'), hzNum = $('#hzNum'), hzBar = $('#hzBar');
const spHelmet = $('#spHelmet'), spGlow = $('#spGlow');
const zImg = $('#zImg'), zL = $('#zL'), zR = $('#zR'), zK = $('#zK');
const pars = $$('[data-par]'), ftBig = $('#ftBig'), ftL1 = ftBig && $('.l1', ftBig), ftL2 = ftBig && $('.l2', ftBig);
const gearSecs = gears.map(g => $(g.dataset.go));
let vw = innerWidth, vh = innerHeight, Y = scrollY, lastY = Y, prevY = -1, vel = 0, dirM = 1, mqX = 0, bmX = 0, mqW = 0, bmW = 0, hzDist = 0, katStatic = false, visStatic = false, lastT = performance.now();
const G = new Map();
const T = el => (G.get(el) || [0, 0]);
function layout() {
  vw = innerWidth; vh = innerHeight; katStatic = RM || vw < 900; visStatic = RM || vw < 900;
  if (!katStatic) { track.style.transform = ''; hzDist = Math.max(0, track.scrollWidth - vw); secKat.style.height = (vh + hzDist) + 'px'; } else { secKat.style.height = ''; hzDist = 0; }
  [secStart, secKat, secVis, secSky, ...gearSecs].forEach(el => { const r = el.getBoundingClientRect(); G.set(el, [r.top + scrollY, el.offsetHeight]); });
  cps.forEach(c => { c._l = c.offsetLeft; c._w = c.offsetWidth; });
  mqW = mq.firstElementChild.offsetWidth; bmW = bm.firstElementChild.offsetWidth;
  prevY = -1; update(true);
}
const P_ = el => { const [t, h] = T(el), len = h - vh; return len > 0 ? clamp((Y - t) / len) : 0; };
const near = el => { const [t, h] = T(el); return Y > t - vh && Y < t + h; };
let lastGear = -1;
function update(force) {
  if (!force && Y === prevY) return; prevY = Y;
  const sr = stmt.getBoundingClientRect();
  const pr = pars.map(im => im.parentElement.getBoundingClientRect());
  const fr = ftBig ? ftBig.getBoundingClientRect() : { top: 1e9 };
  let g = 0; gearSecs.forEach((s, i) => { if (T(s)[0] <= Y + vh * .45) g = i; });
  if (g !== lastGear) { gears.forEach((b, i) => { b.classList.toggle('on', i === g); if (i === g) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); lastGear = g; }
  if (RM) return;
  if (force || near(secStart)) {
    const p = P_(secStart);
    const a = ease(seg(p, 0, .3)); iLogo.style.transform = `translate3d(0,${(-a * 16).toFixed(2)}vh,0) scale(${(1 - .42 * a).toFixed(4)})`; iLogo.style.opacity = (1 - seg(p, .06, .3)).toFixed(3);
    panels.forEach((el, i) => { const b = ease(seg(p, .1 + i * .06, .44 + i * .06)); el.style.transform = `translate3d(0,${((1 - b) * 104).toFixed(2)}%,0)`; panelImgs[i].style.transform = `translate3d(0,${(p * -3).toFixed(2)}%,0) scale(${(1.24 - .17 * b).toFixed(4)})`; });
    iScrim.style.opacity = seg(p, .22, .5).toFixed(3);
    wordsH.forEach((w, k) => { const c = ease(seg(p, .44 + k * .05, .62 + k * .05)); w.style.transform = `translate3d(0,${((1 - c) * 112).toFixed(2)}%,0)`; });
    const d = ease(seg(p, .64, .82)); fx.forEach((el, k) => { el.style.opacity = d.toFixed(3); el.style.transform = `translate3d(0,${((1 - d) * (18 + k * 6)).toFixed(1)}px,0)`; });
    iCopy.style.pointerEvents = d > .5 ? 'auto' : 'none'; cue.style.opacity = (1 - seg(p, 0, .05)).toFixed(3);
  }
  if (!katStatic && (force || near(secKat))) {
    const p = P_(secKat); const x = -p * hzDist; track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    const w0 = cps[0]._w, l0 = cps[0]._l, ref = (l0 + w0 / 2) + ((vw - l0 - w0 / 2) - (l0 + w0 / 2)) * p;
    let idx = 0, bd = 1e9; cps.forEach((c, i) => { const dd = Math.abs(c._l + x + c._w / 2 - ref); if (dd < bd) { bd = dd; idx = i; } });
    cps.forEach((c, i) => c.classList.toggle('on', i === idx));
    hzNum.textContent = '0' + (idx + 1) + ' / 0' + cps.length; hzBar.style.transform = `scaleX(${(.25 + .75 * p).toFixed(3)})`;
    cpImgs.forEach((im, i) => { const c = cps[i]; const cx = c._l + x + c._w / 2; im.style.transform = `translate3d(${((cx - vw / 2) * -.06).toFixed(1)}px,0,0)`; });
  }
  if (!visStatic && (force || near(secVis))) {
    const p = P_(secVis); const h = ease(seg(p, 0, .25));
    spHelmet.style.transform = `translate(-50%,-50%) scale(${(.86 + .14 * h).toFixed(4)}) rotate(${(-10 + 10 * h).toFixed(2)}deg)`;
    const off = [[-260, -140, -18], [260, -160, 16], [-240, 180, 14], [240, 170, -14]]; let act = -1;
    vzEls.forEach((v, i) => { const e = ease(seg(p, .16 + i * .17, .34 + i * .17)); if (e > .6) act = i; const [dx, dy, r] = off[i]; v.style.opacity = e.toFixed(3); v.style.transform = `translate3d(${(dx * (1 - e)).toFixed(1)}px,${(dy * (1 - e)).toFixed(1)}px,0) rotate(${(r * (1 - e)).toFixed(2)}deg) scale(${(.7 + .3 * e).toFixed(4)})`; v.style.pointerEvents = e > .6 ? 'auto' : 'none'; });
    spLis.forEach((l, i) => l.classList.toggle('on', i === act)); spGlow.style.setProperty('--glow', act >= 0 ? VZ[act].g : '#C9CCD3');
  }
  if (sr.top < vh && sr.bottom > 0) { const p = clamp((vh * .82 - sr.top) / (sr.height + vh * .32)); const n = Math.round(p * words.length); words.forEach((w, i) => w.classList.toggle('lit', i < n)); }
  if (force || near(secSky)) {
    const p = P_(secSky); const s = .32 + .68 * ease(seg(p, 0, .55)); zImg.style.transform = `scale(${s.toFixed(4)})`; zImg.style.setProperty('--r', (22 / s).toFixed(1) + 'px');
    const e = ease(seg(p, .32, .62)); const nar = vw < 900; zL.style.opacity = e.toFixed(3); zR.style.opacity = e.toFixed(3);
    zL.style.transform = nar ? `translate3d(0,${((1 - e) * -30).toFixed(1)}px,0)` : `translate3d(${((1 - e) * 80).toFixed(1)}px,-50%,0)`;
    zR.style.transform = nar ? `translate3d(0,${((1 - e) * 30).toFixed(1)}px,0)` : `translate3d(${((1 - e) * -80).toFixed(1)}px,-50%,0)`;
    const k = ease(seg(p, .66, .84)); zK.style.opacity = k.toFixed(3); zK.style.transform = `translate3d(-50%,${((1 - k) * 24).toFixed(1)}px,0)`; zK.style.pointerEvents = k > .5 ? 'auto' : 'none';
  }
  pars.forEach((im, i) => { const r = pr[i]; if (r.bottom < 0 || r.top > vh) return; const f = parseFloat(im.dataset.par) || .08; const lim = r.height * .07; const c = clamp((r.top + r.height / 2 - vh / 2) * -f, -lim, lim); im.style.transform = `translate3d(0,${c.toFixed(1)}px,0)`; });
  if (ftBig && fr.top < vh) { const q = ease(clamp((vh - fr.top) / (vh * .75))); ftL1.style.transform = `translate3d(${((1 - q) * -14).toFixed(2)}%,0,0)`; ftL2.style.transform = `translate3d(${((1 - q) * 14).toFixed(2)}%,0,0)`; }
}
function marquees(dt) {
  if (RM) return;
  const sp = (.045 + Math.min(Math.abs(vel), 60) * .012) * dt; if (vel > 1) dirM = 1; else if (vel < -1) dirM = -1;
  if (mqW) { mqX -= sp * dirM; if (mqX <= -mqW) mqX += mqW; if (mqX > 0) mqX -= mqW; mq.style.transform = `translate3d(${mqX.toFixed(1)}px,0,0)`; }
  if (bmW) { bmX += sp * dirM * .8; if (bmX > 0) bmX -= bmW; if (bmX <= -bmW) bmX += bmW; bm.style.transform = `translate3d(${bmX.toFixed(1)}px,0,0)`; }
}
function frame(t) { const dt = Math.min(64, t - lastT); lastT = t; Y = scrollY; vel = Y - lastY; lastY = Y; update(false); marquees(dt); requestAnimationFrame(frame); }
$$('.gear').forEach(b => b.addEventListener('click', () => OB.goTo($(b.dataset.go))));
let rt; const relayout = () => { clearTimeout(rt); rt = setTimeout(layout, 120); };
addEventListener('resize', relayout);
if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(document.body);
addEventListener('load', layout);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
layout(); requestAnimationFrame(t => { lastT = t; frame(t); });
})();
