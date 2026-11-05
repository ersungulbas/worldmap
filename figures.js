// Draws the guide illustrations into static/guides/ (WebP) and their sizes into data/figures.json.
// Maps come from data/ (same borders and names as the app); the sharing shots come from the running app.
//   node figures.js            all figures (the "app" ones need `npm run dev` on :8788)
//   node figures.js schengen   only the figures whose id starts with "schengen"
// Run it after changing data/ or a figure below, then `node build.js`. Needs Playwright (Chromium).
const fs = require('fs'), path = require('path');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();

const OUT = 'static/guides', APP = 'http://127.0.0.1:8788';
const R = JSON.parse(fs.readFileSync('data/regions.json', 'utf8'));
const inCont = c => Object.keys(R.continent).filter(k => R.continent[k] === c);
const UN195 = new Set([...R.un, ...R.observers]);
const C = { blue: '#7fb2ee', blueB: '#4f8fd8', dark: '#2f6fd0', darkB: '#1f4f9e', orange: '#f6b26b', orangeB: '#d98a3a',
  purple: '#a594f5', purpleB: '#6f5fd6', green: '#8fd19e', greenB: '#4fa565', yellow: '#f5d76e', yellowB: '#c9a92c',
  coral: '#f2998f', coralB: '#d0655a', gray: '#dbe3ec', grayB: '#b3c0ce' };
const g = (codes, fill, stroke) => ({ codes, fill, stroke });

// sample traveler maps for the levels guide
const L20 = 'TR GR BG GE AZ DE FR IT ES NL BE AT CZ HU GB AE QA EG TH US'.split(' ');
const L60 = L20.concat('PT CH PL HR RS BA ME AL MK RO SK SI DK SE NO IE IS MA TN JO OM SA IN LK VN KH LA MY SG ID JP KR CN MX CA BR AU ZA KE TZ'.split(' '));
if (L20.length !== 20 || new Set(L60).size !== 60) throw new Error('sample maps: wrong count');

const SCHENGEN = 'AT BE BG HR CZ DK EE FI FR DE GR HU IS IT LV LI LT LU MT NL NO PL PT RO SK SI ES SE CH'.split(' ');
const LANDLOCKED = 'KZ MN TD NE ML BO ET ZM AF SS CF BW TM UZ PY ZW BF UG LA BY KG NP TJ MW HU AZ AT CZ RS SK CH BT MD LS AM BI RW MK SZ LU AD LI SM VA'.split(' ');
const SMALLEST = 'VA MC NR TV SM LI MH KN MV MT'.split(' ');
const LARGEST = 'RU CA US CN BR AU IN AR KZ DZ'.split(' ');
if (SCHENGEN.length !== 29 || LANDLOCKED.length !== 44) throw new Error('lists: wrong count');

// id, size, projection (Natural Earth like the app, or Mercator fitted to bbox points for regional maps), colour groups,
// markers for places too small to see, labels (from data/labels.json, so each language gets its own file)
const FIG = [
  { id: 'status-world', w: 1600, h: 820, groups: [g(R.un, C.blue, C.blueB), g(R.observers, C.dark, C.darkB), g(R.partial, C.orange, C.orangeB),
      g(Object.keys(R.continent).filter(k => !UN195.has(k) && !R.partial.includes(k)), C.gray, C.grayB)], markers: [['VA', C.dark], ['PS', C.dark]] },
  { id: 'microstates', w: 1200, h: 1100, lang: true, bbox: [[-3.5, 35.2], [17.5, 50.6]], groups: [g(['VA', 'SM', 'MC', 'LI', 'AD', 'MT', 'LU'], C.blue, C.blueB)],
    markers: [['VA', C.dark], ['SM', C.dark], ['MC', C.dark], ['LI', C.dark], ['AD', C.dark], ['MT', C.dark], ['LU', C.dark]],
    labels: ['VA', 'SM', 'MC', 'LI', 'AD', 'MT', 'LU'], labelOffset: { VA: [0, 40], SM: [0, -40], MC: [0, 40], LI: [0, -36], AD: [0, 40], MT: [-74, 0], LU: [0, -36] },
    context: ['FR', 'IT', 'CH', 'AT', 'ES', 'DE'] },
  { id: 'level-20', w: 1600, h: 820, groups: [g(L20, C.blue, C.blueB)] },
  { id: 'level-60', w: 1600, h: 820, groups: [g(L60, C.blue, C.blueB)] },
  { id: 'proj-mercator', w: 1600, h: 1050, proj: 'mercator', groups: [g(inCont('AF'), C.blue, C.blueB), g(['GL'], C.orange, C.orangeB)] },
  { id: 'proj-gallpeters', w: 1600, h: 1050, proj: 'gallPeters', groups: [g(inCont('AF'), C.blue, C.blueB), g(['GL'], C.orange, C.orangeB)] },
  { id: 'proj-naturalearth', w: 1600, h: 820, groups: [g(inCont('AF'), C.blue, C.blueB), g(['GL'], C.orange, C.orangeB)] },
  { id: 'route-central-europe', w: 1200, h: 900, lang: true, bbox: [[1.8, 45.4], [23.2, 54.0]],
    groups: [g(['BE', 'NL', 'LU'], C.blue, C.blueB), g(['CZ', 'AT', 'SK', 'HU'], C.purple, C.purpleB)], labels: ['BE', 'NL', 'LU', 'CZ', 'AT', 'SK', 'HU'], context: ['DE', 'FR', 'PL', 'CH'] },
  { id: 'route-baltics', w: 1200, h: 1000, lang: true, bbox: [[20.6, 53.7], [28.6, 60.7]],
    groups: [g(['EE', 'LV', 'LT'], C.blue, C.blueB)], labels: ['EE', 'LV', 'LT'], labelAt: { EE: [25.6, 58.75], LV: [25.4, 56.85] }, context: ['FI', 'PL', 'BY', 'RU'],
    contextAt: { FI: [25.0, 60.45], PL: [22.4, 53.95], BY: [27.2, 54.6], RU: [28.25, 57.9] } },
  { id: 'route-balkans', w: 1200, h: 1100, lang: true, bbox: [[13.6, 40.2], [23.0, 46.2]],
    groups: [g(['HR', 'ME', 'BA', 'AL', 'MK'], C.purple, C.purpleB)], labels: ['HR', 'ME', 'BA', 'AL', 'MK'], labelAt: { HR: [15.6, 45.55] },
    context: ['RS', 'SI', 'XK', 'GR', 'IT'], contextAt: { GR: [22.3, 40.55], IT: [16.1, 41.0] } },
  { id: 'route-caucasus', w: 1200, h: 800, lang: true, bbox: [[38.2, 37.9], [50.6, 44.1]], groups: [g(['GE', 'AM'], C.blue, C.blueB)], labels: ['GE', 'AM'], context: ['TR', 'AZ', 'RU', 'IR'] },
  { id: 'route-mekong', w: 1000, h: 1150, lang: true, bbox: [[95.8, 5.6], [110.2, 23.6]], groups: [g(['TH', 'LA', 'VN', 'KH'], C.blue, C.blueB)], labels: ['TH', 'LA', 'VN', 'KH'], context: ['MM', 'CN', 'MY'] },
  { id: 'route-central-america', w: 1200, h: 900, lang: true, bbox: [[-93.2, 6.8], [-76.8, 18.6]], groups: [g(['GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA'], C.blue, C.blueB)],
    labels: ['GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA'], labelOffset: { SV: [-10, 40], BZ: [26, -6] }, context: ['MX', 'CO'] },
  { id: 'route-gulf', w: 1200, h: 900, lang: true, bbox: [[45.2, 20.6], [60.4, 30.4]], groups: [g(['AE', 'OM', 'QA', 'BH'], C.blue, C.blueB), g(['SA'], C.purple, C.purpleB)],
    labels: ['AE', 'OM', 'QA', 'BH', 'SA'], labelAt: { SA: [48.2, 23.6], OM: [57.4, 21.6] }, labelOffset: { BH: [-50, -8], QA: [14, 34] }, context: ['IR', 'KW', 'YE'], contextAt: { IR: [53.5, 29.4] } },
  { id: 'schengen', w: 1200, h: 1150, proj: 'europe', bbox: [[-24.5, 65], [-9.6, 36.9], [34.6, 34.6], [31.5, 70.1], [25, 71.2], [24.5, 34.8], [-10, 51.5]],
    groups: [g(SCHENGEN, C.blue, C.blueB), g(['CY', 'IE'], C.orange, C.orangeB), g(['MC', 'SM', 'VA'], C.purple, C.purpleB)],
    markers: [['LI', C.blue], ['LU', C.blue], ['MT', C.blue], ['MC', C.purple], ['SM', C.purple], ['VA', C.purple]] },
  { id: 'continents', w: 1600, h: 820, groups: [g(inCont('AF').filter(k => UN195.has(k)), C.orange, C.orangeB), g(inCont('AS').filter(k => UN195.has(k)), C.coral, C.coralB),
      g(inCont('EU').filter(k => UN195.has(k)), C.blue, C.blueB), g(inCont('NA').filter(k => UN195.has(k)), C.purple, C.purpleB),
      g(inCont('SA').filter(k => UN195.has(k)), C.green, C.greenB), g(inCont('OC').filter(k => UN195.has(k)), C.yellow, C.yellowB)] },
  { id: 'smallest', w: 1600, h: 820, groups: [g(SMALLEST, C.blue, C.blueB)], numbers: SMALLEST,
    numberOffset: { VA: [44, 34], SM: [46, -26], MC: [-44, 22], LI: [-6, -52], MT: [26, 44], NR: [-40, 0], TV: [-34, 34], MH: [-12, -40] } },
  { id: 'largest', w: 1600, h: 820, groups: [g(LARGEST, C.blue, C.blueB)], numbers: LARGEST },
  { id: 'landlocked', w: 1600, h: 820, groups: [g(LANDLOCKED, C.blue, C.blueB), g(['LI', 'UZ'], C.orange, C.orangeB)], markers: [['LI', C.orange], ['SM', C.blue], ['VA', C.blue], ['AD', C.blue], ['LU', C.blue]] },
  { id: 'turkiye-neighbors', w: 1200, h: 800, lang: true, bbox: [[19.6, 29.2], [50.4, 45.4]],
    groups: [g(['TR'], C.dark, C.darkB), g(['GR', 'BG', 'GE', 'AM', 'AZ', 'IR', 'IQ', 'SY'], C.blue, C.blueB), g(['XC'], C.purple, C.purpleB)],
    labels: ['TR', 'GR', 'BG', 'GE', 'AM', 'AZ', 'IR', 'IQ', 'SY', 'XC'], labelDark: ['TR'], fontSize: 28,
    labelAt: { IR: [47.6, 35.4], AM: [45.0, 40.2], AZ: [48.3, 41.05], GE: [43.4, 42.35], IQ: [43.0, 33.6], XC: [31.0, 35.55], SY: [38.6, 35.2] }, labelLine: { XC: [32.95, 35.3] },
    labelText: { XC: { tr: 'KKTC', en: 'N. Cyprus' } }, context: ['RU', 'UA', 'RO', 'CY', 'LB', 'IL', 'JO', 'SA'], contextAt: { CY: [32.9, 34.35], SA: [41.5, 30.0] } },
  { id: 'share-formats', app: 'formats', lang: true },
  { id: 'share-compare', app: 'compare', lang: true },
];

// ---------- drawing, inside the browser page ----------
function draw({ spec, lang, world, labels, names }) {
  const { w, h } = spec, k = w / 1600;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d');
  const feats = topojson.feature(world, world.objects.countries).features;
  const dz = world.objects.disputed ? topojson.feature(world, world.objects.disputed).features : [];
  const byK = new Map(feats.map(f => [f.properties.k, f]));
  let p;
  if (spec.proj === 'mercator') p = d3.geoMercator();
  else if (spec.proj === 'gallPeters') { const c = Math.cos(Math.PI / 4); p = d3.geoProjection((l, f) => [l * c, Math.sin(f) / c]); }
  else if (spec.proj === 'europe') p = d3.geoAzimuthalEqualArea().rotate([-12, -52]);
  else p = spec.bbox ? d3.geoMercator() : d3.geoNaturalEarth1();
  const m = 18 * k;
  if (spec.bbox) p.fitExtent([[m, m], [w - m, h - m]], { type: 'MultiPoint', coordinates: spec.bbox });
  else if (spec.proj === 'mercator') {
    p.fitExtent([[m, m], [w - m, h - m]], { type: 'MultiPoint', coordinates: [[-180, -56], [180, 83.7]] });
  } else p.fitExtent([[m, m], [w - m, h - m]], { type: 'FeatureCollection', features: feats });
  const path = d3.geoPath(p, ctx);
  ctx.fillStyle = '#e9f0f6'; ctx.fillRect(0, 0, w, h);
  if (!spec.bbox) { ctx.beginPath(); path(d3.geoGraticule10()); ctx.strokeStyle = 'rgba(22,33,46,.06)'; ctx.lineWidth = 1; ctx.stroke(); }
  const colour = new Map(); for (const gr of spec.groups || []) for (const c of gr.codes) colour.set(c, gr);
  const lw = (spec.bbox ? 1.6 : 1) * Math.max(1, k * 1.1);
  for (const f of feats) {
    const gr = colour.get(f.properties.k);
    ctx.beginPath(); path(f); ctx.fillStyle = gr ? gr.fill : '#ffffff'; ctx.fill();
    ctx.strokeStyle = gr ? gr.stroke : '#c3ceda'; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
  }
  for (const f of dz) { ctx.beginPath(); path(f); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(); ctx.setLineDash([4 * k, 3 * k]); ctx.strokeStyle = '#c3ceda'; ctx.stroke(); ctx.setLineDash([]); }
  const at = (c, over) => { const A = (over || {})[c]; if (A) return p(A); const L = labels[lang][c] || labels.en[c]; return L ? p([L[0], L[1]]) : path.centroid(byK.get(c)); };
  const lines = c => { const t = (spec.labelText || {})[c]; if (t) return [typeof t === 'string' ? t : t[lang]]; const L = labels[lang][c]; return L ? L[3] : [names[c]]; };
  const text = (s, x, y, size, weight, fill, halo) => {
    ctx.font = `${weight} ${size}px Figtree`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = size * 0.28; ctx.strokeStyle = halo; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); ctx.fillStyle = fill; ctx.fillText(s, x, y);
  };
  for (const [c, fill] of spec.markers || []) {
    const [x, y] = at(c, spec.markerAt), mr = spec.bbox ? 11 * Math.max(k, 0.8) : 5; ctx.beginPath(); ctx.arc(x, y, mr, 0, 2 * Math.PI);
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = mr * 0.32; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  }
  const fs1 = spec.fontSize || (spec.bbox ? 34 : 26);
  for (const c of spec.context || []) {
    if (!labels[lang][c]) continue; const [x, y] = at(c, spec.contextAt);
    if (x < 30 || y < 30 || x > w - 30 || y > h - 30) continue;
    const ls = lines(c); ls.forEach((s, i) => text(s.toLocaleUpperCase(lang), x, y + (i - (ls.length - 1) / 2) * fs1 * 0.85, fs1 * 0.62, 700, 'rgba(93,107,124,.75)', 'rgba(255,255,255,.7)'));
  }
  for (const [c, to] of Object.entries(spec.labelLine || {})) {
    const [x, y] = at(c, spec.labelAt), [x2, y2] = p(to); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#0f3463'; ctx.lineWidth = 2; ctx.stroke();
  }
  for (const c of spec.labels || []) {
    let [x, y] = at(c, spec.labelAt); const o = (spec.labelOffset || {})[c]; if (o) { x += o[0]; y += o[1]; }
    const ls = lines(c), dark = (spec.labelDark || []).includes(c);
    ls.forEach((s, i) => text(s, x, y + (i - (ls.length - 1) / 2) * fs1 * 1.05, fs1, 700, dark ? '#ffffff' : '#0f3463', dark ? '#1f4f9e' : 'rgba(255,255,255,.92)'));
  }
  (spec.numbers || []).forEach((c, i) => {
    let [x, y] = at(c, spec.markerAt); const o = (spec.numberOffset || {})[c];
    if (o) { // true spot as a small dot, number pushed aside on a short line
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + o[0], y + o[1]); ctx.strokeStyle = '#1f4f9e'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 2 * Math.PI); ctx.fillStyle = '#1f4f9e'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      x += o[0]; y += o[1];
    }
    const r = 17; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = '#1f4f9e'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.font = '700 21px Figtree'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), x, y + 1);
  });
  // brand, bottom right
  ctx.font = `800 ${Math.round(26 * Math.max(k, 0.8))}px "Bricolage Grotesque"`; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  const bx = w - 22 * Math.max(k, 0.8), by = h - 20 * Math.max(k, 0.8), tw = ctx.measureText('.tech').width;
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(233,240,246,.9)'; ctx.strokeText('worldmap.tech', bx, by);
  ctx.fillStyle = '#2f6fd0'; ctx.fillText('.tech', bx, by); ctx.fillStyle = '#16212e'; ctx.fillText('worldmap', bx - tw, by);
  return cv.toDataURL('image/webp', 0.86);
}

// images made by the app itself (save sheet, friend comparison), served by `npm run dev`
async function appShot(b, spec, lang) {
  const home = APP + (lang === 'tr' ? '/tr/' : '/');
  const ctx = await b.newContext({ viewport: { width: 1280, height: 760 }, locale: lang === 'tr' ? 'tr-TR' : 'en-US', deviceScaleFactor: 1 });
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1:8788)/, r => r.abort());
  const p = await ctx.newPage();
  const mine = L20, friend = 'TR GR DE IT FR ES PT MA EG JO AE IN TH JP US MX BR AR'.split(' ');
  await p.goto(home); await p.evaluate(([s, l]) => { localStorage.setItem('wmn.sel', JSON.stringify(s)); localStorage.setItem('wmn.lang', l); localStorage.setItem('wmn.consent', 'n'); }, [mine, lang]);
  let out;
  if (spec.app === 'formats') {
    await p.goto(home); await p.waitForSelector('.lb', { state: 'attached' }); await p.waitForTimeout(1200);
    await p.click('#save'); await p.waitForSelector('#sheet:not([hidden])'); await p.waitForTimeout(800);
    const shots = [];
    for (const f of ['story', 'square', 'wide']) {
      await p.click(`#fmt button[data-f="${f}"]`); await p.waitForTimeout(900);
      shots.push(await p.$eval('#shot', async img => { await img.decode(); const r = await fetch(img.src); const bl = await r.blob(); return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(bl); }); }));
    }
    out = await p.evaluate(async shots => {
      const imgs = await Promise.all(shots.map(s => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = s; })));
      const W = 1600, gap = 28, m = 30, H = (W - 2 * m - 2 * gap) / imgs.reduce((a, i) => a + i.naturalWidth / i.naturalHeight, 0);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = Math.round(H + 2 * m); const c = cv.getContext('2d');
      c.fillStyle = '#e9f0f6'; c.fillRect(0, 0, cv.width, cv.height);
      let x = m; for (const i of imgs) { const iw = H * i.naturalWidth / i.naturalHeight;
        c.save(); c.shadowColor = 'rgba(22,33,46,.18)'; c.shadowBlur = 18; c.shadowOffsetY = 6; c.fillStyle = '#fff'; c.fillRect(x, m, iw, H); c.restore();
        c.drawImage(i, x, m, iw, H); x += iw + gap; }
      return cv.toDataURL('image/webp', 0.86);
    }, shots);
  } else {
    await p.goto('about:blank'); await p.goto(home + '#w' + friend.join('')); await p.waitForSelector('.lb', { state: 'attached' }); await p.waitForTimeout(1800);
    const png = await p.screenshot({ type: 'png' });
    out = await p.evaluate(async s => { const i = new Image(); await new Promise(r => { i.onload = r; i.src = s; });
      const cv = document.createElement('canvas'); cv.width = i.naturalWidth; cv.height = i.naturalHeight; cv.getContext('2d').drawImage(i, 0, 0); return cv.toDataURL('image/webp', 0.86); },
      'data:image/png;base64,' + png.toString('base64'));
  }
  await ctx.close();
  return out;
}

(async () => {
  const only = process.argv[2];
  const world = JSON.parse(fs.readFileSync('data/world.min.json', 'utf8'));
  const labels = JSON.parse(fs.readFileSync('data/labels.json', 'utf8')).L;
  const N = JSON.parse(fs.readFileSync('data/names.json', 'utf8')).N;
  const names = { en: Object.fromEntries(Object.entries(N).map(([c, v]) => [c, v[0]])), tr: Object.fromEntries(Object.entries(N).map(([c, v]) => [c, v[1]])) };
  const font = (f, fam, wt, range) => `@font-face{font-family:'${fam}';font-weight:${wt};src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2')${range ? ';unicode-range:' + range : ''}}`;
  const fd = 'node_modules/@fontsource/figtree/files/', bd = 'node_modules/@fontsource/bricolage-grotesque/files/';
  const ext = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  const css = [600, 700].map(wt => font(fd + `figtree-latin-${wt}-normal.woff2`, 'Figtree', wt) + font(fd + `figtree-latin-ext-${wt}-normal.woff2`, 'Figtree', wt, ext)).join('')
    + font(bd + 'bricolage-grotesque-latin-800-normal.woff2', 'Bricolage Grotesque', 800);
  const b = await chromium.launch();
  const page = await b.newPage();
  await page.setContent(`<style>${css}</style><p style="font:700 20px Figtree">aıİşğ</p><p style="font:800 20px 'Bricolage Grotesque'">x</p>`);
  await page.addScriptTag({ path: 'node_modules/d3/dist/d3.min.js' });
  await page.addScriptTag({ path: 'node_modules/topojson-client/dist/topojson-client.min.js' });
  await page.evaluate(() => Promise.all([document.fonts.load('600 20px Figtree'), document.fonts.load('700 20px Figtree', 'ıİşğ'), document.fonts.load('800 20px "Bricolage Grotesque"')]));
  fs.mkdirSync(OUT, { recursive: true });
  const sizesF = 'data/figures.json', sizes = fs.existsSync(sizesF) ? JSON.parse(fs.readFileSync(sizesF, 'utf8')) : {};
  for (const spec of FIG) {
    if (only && !spec.id.startsWith(only)) continue;
    for (const lang of spec.lang ? ['tr', 'en'] : [null]) {
      const url = spec.app ? await appShot(b, spec, lang) : await page.evaluate(draw, { spec, lang: lang || 'en', world, labels, names: names[lang || 'en'] });
      const buf = Buffer.from(url.split(',')[1], 'base64');
      const file = spec.id + (lang ? '.' + lang : '') + '.webp';
      fs.writeFileSync(path.join(OUT, file), buf);
      // WebP size: VP8X header (lossy with alpha/extended) or VP8 frame header
      const t = buf.toString('ascii', 12, 16);
      const [W, H] = t === 'VP8X' ? [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)] : t === 'VP8 ' ? [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff] : [spec.w, spec.h];
      sizes[spec.id] = { w: W, h: H, lang: !!spec.lang };
      console.log(file, W + 'x' + H, Math.round(buf.length / 1024) + ' KB');
    }
  }
  fs.writeFileSync(sizesF, JSON.stringify(Object.fromEntries(Object.entries(sizes).filter(([id]) => FIG.some(f => f.id === id)).sort()), null, 1) + '\n');
  await b.close();
})();
