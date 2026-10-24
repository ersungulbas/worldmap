// Builds two things from src.html:
//   worldmapnet.html  self-contained preview (claude.ai artifact): data inlined, libraries from CDNs
//   site/             worldmap.tech static files for Cloudflare Workers (wrangler.jsonc): /, /tr/, text pages, assets
// Inputs: data/ (map + names), content/ (copy + legal texts), static/ (icons, page.css), server/_worker.js,
// site.config.json (domain, contact, owner, AdSense ids).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { minify } = require('terser');
const C = JSON.parse(fs.readFileSync('site.config.json', 'utf8'));
const read = f => fs.readFileSync(f, 'utf8');
const readJ = f => JSON.parse(read(f));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hash = buf => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
const OUT = 'site';
// ADS_CLIENT/ADS_SLOT override the config for local consent tests
const ADS = process.env.ADS_CLIENT ? { client: process.env.ADS_CLIENT, slot: process.env.ADS_SLOT || '' } : C.ads;
if (ADS.client && !/^ca-pub-\d{16}$/.test(ADS.client)) throw new Error(`ads.client should look like ca-pub-0000000000000000, got ${ADS.client}`);
// client id alone: site verification only (meta tag + ads.txt); client + slot: consent banner and ads
const ADS_ON = !!(ADS.client && ADS.slot);
const write = (f, data) => { const p = path.join(OUT, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };
const copy = (from, to) => write(to, fs.readFileSync(from));

const LIB = {
  d3: 'node_modules/d3/dist/d3.min.js',
  topo: 'node_modules/topojson-client/dist/topojson-client.min.js',
  qr: 'node_modules/qrcode-generator/qrcode.js',
  fonts: { 'Figtree': ['node_modules/@fontsource/figtree', 'figtree', [500, 600, 700]],
           'Bricolage Grotesque': ['node_modules/@fontsource/bricolage-grotesque', 'bricolage-grotesque', [500, 700, 800]] }
};
const content = f => path.join('content', f);
const META = readJ(content('meta.json'));
const SNIP = fs.existsSync(content('snippets.json')) ? readJ(content('snippets.json')) : {};
const FAQ = { tr: readJ(content('faq.tr.json')), en: readJ(content('faq.en.json')) };

(async () => {
  const qrMin = (await minify(read(LIB.qr), { compress: true, mangle: true, format: { comments: /MIT|Copyright/i } })).code;
  const world = read('data/world.min.json');
  // label positions + world bounds precomputed by dumplabels.js (optional; the app lays labels out itself without them)
  const names = JSON.stringify(Object.assign(readJ('data/names.json'), fs.existsSync('data/labels.json') ? readJ('data/labels.json') : {}));
  let src = read('src.html');
  // texts that come from the legal drafts
  const consentLink = lang => lang === 'tr' ? '<a href="/gizlilik/#cerezler">Gizlilik ve çerezler</a>' : '<a href="/privacy/#cookies">Privacy and cookies</a>';
  const S = {
    __FOOTER_TR__: SNIP.footer_tr || 'Bilgiler genel amaçlıdır, doğruluğu garanti edilmez.',
    __FOOTER_EN__: SNIP.footer_en || 'Information is for general purposes and comes with no warranty.',
    __CONSENT_TR__: (SNIP.consent_tr || 'Reklamları gösterebilmek için çerez kullanmak istiyoruz. İzin vermezsen site aynen çalışır.') + ' ' + consentLink('tr'),
    __CONSENT_EN__: (SNIP.consent_en || 'We would like to use cookies to show ads. If you say no, everything still works.') + ' ' + consentLink('en'),
    __ACCEPT_TR__: SNIP.accept_tr || 'Kabul et', __REJECT_TR__: SNIP.reject_tr || 'Reddet',
    __ACCEPT_EN__: SNIP.accept_en || 'Accept', __REJECT_EN__: SNIP.reject_en || 'Reject'
  };
  for (const [k, v] of Object.entries(S)) src = src.split(k).join(String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"'));
  const fill = (h, o) => h.replace('__CFG__', () => JSON.stringify(o.cfg)).replace('__WORLDSRC__', () => o.worldSrc || '')
    .replace('__WORLD__', () => o.world || '').replace('__NAMES__', () => names).replace('__QR__', () => qrMin)
    .replace('<!--HEAD-->', () => o.head).replace('<!--LIBS-->', () => o.libs).replace('<!--INTRO-->', () => o.intro || '');

  // ---------- 1. artifact preview ----------
  const artifact = fill(src, {
    cfg: { env: 'artifact', lang: null }, world,
    head: `<title>worldmap.tech</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Tap the countries you've been to and share your travel map.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@500;600;700&display=swap">`,
    libs: `<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js"></script>`
  });
  fs.writeFileSync('worldmapnet.html', artifact);

  // ---------- 2. site ----------
  fs.rmSync(OUT, { recursive: true, force: true });
  // assets: libraries, data, fonts (self-hosted: no third-party requests before consent)
  const V = {};
  const asset = (name, data) => { write('assets/' + name, data); V[name] = hash(data); };
  asset('d3.min.js', fs.readFileSync(LIB.d3));
  asset('topojson-client.min.js', fs.readFileSync(LIB.topo));
  asset('world.json', world);
  let fontCss = '/* Figtree and Bricolage Grotesque, SIL Open Font License 1.1 (via Fontsource) */\n';
  for (const [fam, [dir, slug, weights]] of Object.entries(LIB.fonts))
    for (const w of weights) for (const sub of ['latin-ext', 'latin']) {
      const file = `${slug}-${sub}-${w}-normal.woff2`;
      copy(path.join(dir, 'files', file), 'assets/fonts/' + file);
      const block = read(path.join(dir, `${w}.css`)).split('/* ' + slug + '-' + sub + '-' + w + '-normal */')[1] || '';
      const range = (block.match(/unicode-range:([^;]+);/) || [])[1];
      if (!range) throw new Error('no unicode-range for ' + file);
      fontCss += `@font-face{font-family:'${fam}';font-style:normal;font-display:swap;font-weight:${w};src:url(/assets/fonts/${file}) format('woff2');unicode-range:${range.trim()}}\n`;
    }
  asset('fonts.css', fontCss);
  for (const f of fs.readdirSync('static/assets')) asset(f, fs.readFileSync('static/assets/' + f));
  copy('static/favicon.ico', 'favicon.ico');

  const PAGES = { tr: { app: '/tr/', faq: '/sss/', about: '/hakkinda/', contact: '/iletisim/', privacy: '/gizlilik/', terms: '/kosullar/' },
    en: { app: '/', faq: '/faq/', about: '/about/', contact: '/contact/', privacy: '/privacy/', terms: '/terms/' } };
  const other = l => l === 'tr' ? 'en' : 'tr';
  // guides ("Rehber"): content/guides/<key>.<lang>.md, each with a small front matter (slug, title, description)
  const front = s => {
    const m = s.match(/^---\n([\s\S]*?)\n---\n/), meta = {};
    if (m) for (const l of m[1].split('\n')) { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
    return { meta, body: m ? s.slice(m[0].length) : s };
  };
  const GUIDES = {}, GUIDE_ORDER = ['countries', 'counting', 'levels', 'routes', 'projections', 'sharing'];
  if (fs.existsSync(content('guides'))) for (const f of fs.readdirSync(content('guides')).sort()) {
    const m = f.match(/^([a-z0-9-]+)\.(tr|en)\.md$/);
    if (m) (GUIDES[m[1]] ??= {})[m[2]] = front(read(content('guides/' + f)));
  }
  const gkeys = Object.keys(GUIDES).filter(k => GUIDES[k].tr && GUIDES[k].en)
    .sort((a, b) => ((GUIDE_ORDER.indexOf(a) + 1) || 99) - ((GUIDE_ORDER.indexOf(b) + 1) || 99));
  PAGES.tr.guides = '/rehber/'; PAGES.en.guides = '/guides/';
  for (const k of gkeys) for (const l of ['tr', 'en']) {
    const g = GUIDES[k][l].meta;
    if (!/^[a-z0-9-]+$/.test(g.slug || '') || !g.title || !g.description) throw new Error(`guides/${k}.${l}.md: slug, title and description are required`);
    PAGES[l]['g:' + k] = (l === 'tr' ? '/rehber/' : '/guides/') + g.slug + '/';
  }
  const GUIDES_DATE = '2026-10-21';
  const icons = `<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/icon.svg?v=${V['icon.svg']}" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=${V['apple-touch-icon.png']}">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#e9f0f6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0c141e" media="(prefers-color-scheme: dark)">`;
  const fontsHead = `<link rel="preload" href="/assets/fonts/figtree-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts.css?v=${V['fonts.css']}">`;
  const social = (lang, url, title, desc) => `<meta property="og:type" content="website">
<meta property="og:site_name" content="worldmap.tech">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${C.origin}/assets/og-${lang}.png?v=${V['og-' + lang + '.png']}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(META[lang].og_title)}">
<meta property="og:locale" content="${lang === 'tr' ? 'tr_TR' : 'en_US'}">
<meta property="og:locale:alternate" content="${lang === 'tr' ? 'en_US' : 'tr_TR'}">
<meta name="twitter:card" content="summary_large_image">`;
  const alts = key => `<link rel="alternate" hreflang="en" href="${C.origin}${PAGES.en[key]}">
<link rel="alternate" hreflang="tr" href="${C.origin}${PAGES.tr[key]}">
<link rel="alternate" hreflang="x-default" href="${C.origin}${PAGES.en[key]}">`;
  const adsMeta = ADS.client ? `<meta name="google-adsense-account" content="${esc(ADS.client)}">` : '';

  const T = {
    tr: { back: 'Haritaya dön', other: 'English', foot: S.__FOOTER_TR__, faq: 'SSS', about: 'Hakkında', guides: 'Rehber', privacy: 'Gizlilik', terms: 'Koşullar', contact: 'İletişim', contactP: '/iletisim/', map: 'Harita', rights: 'Tüm hakları saklıdır.', self: 'Türkçe' },
    en: { back: 'Back to the map', other: 'Türkçe', foot: S.__FOOTER_EN__, faq: 'FAQ', about: 'About', guides: 'Guides', privacy: 'Privacy', terms: 'Terms', contact: 'Contact', contactP: '/contact/', map: 'Map', rights: 'All rights reserved.', self: 'English' }
  };
  // small markdown: ## headings, - lists, **bold**, [links](/path/)
  const md = s => s.split(/\n{2,}/).map(b => {
    b = b.trim(); if (!b) return '';
    const inl = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
    if (b.startsWith('### ')) return `<h3>${inl(b.slice(4))}</h3>`;
    if (b.startsWith('## ')) return `<h2>${inl(b.slice(3))}</h2>`;
    if (b.startsWith('# ')) return `<h2>${inl(b.slice(2))}</h2>`;
    if (/^- /m.test(b)) return '<ul>' + b.split('\n').map(l => `<li>${inl(l.replace(/^- /, ''))}</li>`).join('') + '</ul>';
    return `<p>${inl(b.replace(/\n/g, ' '))}</p>`;
  }).join('\n');
  // app pages: "/" is English, "/tr/" Turkish; Turkish browsers landing on "/" go to "/tr/" unless they chose English
  const langRedirect = `<script>(function(){try{var p=localStorage.getItem("wmn.lang"),h=location.hash,t=location.pathname;if(t==="/"&&(p==="tr"||(!p&&/^tr\\b/i.test(navigator.language||""))))location.replace("/tr/"+h);else if(t==="/tr/"&&p==="en")location.replace("/"+h);}catch(e){}})();</script>`;
  for (const lang of ['en', 'tr']) {
    const m = META[lang], url = C.origin + PAGES[lang].app, P = PAGES[lang];
    const ld = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'worldmap.tech', url, description: m.description,
      applicationCategory: 'TravelApplication', operatingSystem: 'Any', inLanguage: lang, isAccessibleForFree: true,
      image: `${C.origin}/assets/og-${lang}.png`, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } };
    const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.description)}">
<link rel="canonical" href="${url}">
${alts('app')}
${social(lang, url, m.og_title, m.og_description)}
${icons}
${fontsHead}
<link rel="preload" href="/assets/world.json?v=${V['world.json']}" as="fetch" crossorigin>
${adsMeta}
${langRedirect}
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
    const noscript = `<noscript><div style="position:fixed;inset:0;z-index:50;background:var(--ocean);padding:32px 20px;font:500 17px/1.6 var(--f-body)">
<p><b>worldmap.tech</b></p><p>${esc(m.description)}</p><p>${lang === 'tr' ? 'Harita JavaScript ile çalışır.' : 'The map needs JavaScript.'}</p>
<p><a href="${P.guides}">${lang === 'tr' ? 'Rehber' : 'Guides'}</a> · <a href="${P.about}">${lang === 'tr' ? 'Hakkında' : 'About'}</a> · <a href="${P.faq}">${lang === 'tr' ? 'Sıkça sorulan sorular' : 'FAQ'}</a> · <a href="${P.privacy}">${lang === 'tr' ? 'Gizlilik' : 'Privacy'}</a> · <a href="${P.terms}">${lang === 'tr' ? 'Koşullar' : 'Terms'}</a> · <a href="${P.contact}">${T[lang].contact}</a></p></div></noscript>`;
    // text under the map: what the tool is, how to use it, a few FAQ answers and the guides
    const tr = lang === 'tr', homeF = content(`home.${lang}.md`);
    const intro = fs.existsSync(homeF) ? `<section id="intro" aria-label="${tr ? 'worldmap.tech hakkında' : 'About worldmap.tech'}">
${md(read(homeF))}
<h2>${tr ? 'Sıkça sorulan sorular' : 'Frequently asked questions'}</h2>
${FAQ[lang].slice(0, 5).map(x => `<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('\n')}
<p><a href="${P.faq}">${tr ? 'Tüm sorular ve cevaplar' : 'All questions and answers'}</a></p>
${gkeys.length ? `<h2>${tr ? 'Rehber' : 'Guides'}</h2>
<ul>${gkeys.map(k => { const g = GUIDES[k][lang].meta; return `<li><a href="${P['g:' + k]}">${esc(g.title)}</a><br>${esc(g.description)}</li>`; }).join('')}</ul>` : ''}
<p class="more"><a href="${P.about}">${T[lang].about}</a> · <a href="${P.guides}">${T[lang].guides}</a> · <a href="${P.faq}">${T[lang].faq}</a> · <a href="${P.privacy}">${T[lang].privacy}</a> · <a href="${P.terms}">${T[lang].terms}</a> · <a href="${P.contact}">${T[lang].contact}</a> · <a href="#app">${T[lang].back}</a></p>
</section>` : '';
    let html = fill(src, {
      cfg: { env: 'site', lang, ads: ADS }, intro, worldSrc: ` data-src="/assets/world.json?v=${V['world.json']}"`,
      head, libs: `<script defer src="/assets/d3.min.js?v=${V['d3.min.js']}"></script>
<script defer src="/assets/topojson-client.min.js?v=${V['topojson-client.min.js']}"></script>`
    });
    html = html.replace('<div id="app">', noscript + '\n<div id="app">');
    // the bottom strip is in the HTML from the start (first paint); the app re-renders it with handlers
    const o = other(lang), Ts = T[lang], sepI = '<i aria-hidden="true">·</i>';
    const strip = `<span>${esc(Ts.foot)}</span>${intro ? `${sepI}<a href="#intro">${tr ? 'Nasıl çalışır?' : 'How it works'}</a>` : ''}${sepI}<a href="${P.guides}">${Ts.guides}</a>${sepI}<a href="${P.terms}">${Ts.terms}</a>${sepI}<a href="${P.privacy}">${Ts.privacy}</a>${sepI}<a href="${P.faq}">${Ts.faq}</a>${sepI}<a href="${Ts.contactP}">${Ts.contact}</a>`
      + (ADS_ON ? `${sepI}<button type="button">${lang === 'tr' ? 'Çerez tercihleri' : 'Cookie preferences'}</button>` : '')
      + `${sepI}<a href="${PAGES[o].app}" hreflang="${o}" lang="${o}">${T[o].self}</a>`;
    html = html.replace('<footer id="legal"></footer>', `<footer id="legal">${strip}</footer>`);
    write(P.app.slice(1) + 'index.html', `<!doctype html>\n<html lang="${lang}">\n${html}\n</html>\n`);
  }

  // text pages
  const ownerFill = (h, lang) => h
    .replace(/\{\{OWNER_NAME\}\}/g, C.owner.name ? esc(C.owner.name) : `<mark>${lang === 'tr' ? 'ad soyad eklenecek' : 'name to be added'}</mark>`)
    .replace(/\{\{OWNER_CITY\}\}/g, C.owner.city ? esc(C.owner.city) : `<mark>${lang === 'tr' ? 'şehir eklenecek' : 'city to be added'}</mark>`)
    .replace(/\{\{PHONE_LI\}\}/g, C.owner.phone ? `<li>${lang === 'tr' ? 'Telefon' : 'Phone'}: ${esc(C.owner.phone)}</li>` : '')
    .replace(/\{\{EMAIL\}\}/g, `<a href="mailto:${C.email}">${C.email}</a>`)
    .replace(/\{\{UPDATED\}\}/g, C.updated[lang]);
  const page = ({ lang, key, title, desc, body, ld, extraHead = '', robots = '' }) => {
    const P = PAGES[lang], url = C.origin + P[key], t = T[lang];
    // site menu under the header; the current page (or section, for guide articles) is marked
    const cur = k => key === k ? ' aria-current="page"' : k === 'guides' && key.startsWith('g:') ? ' aria-current="true"' : '';
    const menu = `<nav class="menu" aria-label="${lang === 'tr' ? 'Site menüsü' : 'Site menu'}">`
      + (gkeys.length ? `<a href="${P.guides}"${cur('guides')}>${t.guides}</a>` : '')
      + ['faq', 'about', 'contact'].map(k => `<a href="${P[k]}"${cur(k)}>${t[k]}</a>`).join('') + '</nav>';
    return `<!doctype html>
<html lang="${lang}">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${robots}<link rel="canonical" href="${url}">
${alts(key)}
${social(lang, url, title, desc)}
${icons}
${fontsHead}
<link rel="preload" href="/assets/fonts/bricolage-grotesque-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/figtree-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/figtree-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/page.css?v=${V['page.css']}">
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}${extraHead}
<header class="top"><a class="brand" href="${P.app}">worldmap<span>.tech</span></a>
<nav><a class="btn ghost" href="${PAGES[other(lang)][key]}" hreflang="${other(lang)}" lang="${other(lang)}">${t.other}</a><a class="btn" href="${P.app}">${t.back}</a></nav></header>
${menu}
<main><article class="card">
${body}
</article></main>
<footer class="foot">${esc(t.foot)}<br><a href="${P.guides}">${t.guides}</a> <i>·</i> <a href="${P.about}">${t.about}</a> <i>·</i> <a href="${P.terms}">${t.terms}</a> <i>·</i> <a href="${P.privacy}">${t.privacy}</a> <i>·</i> <a href="${P.faq}">${t.faq}</a> <i>·</i> <a href="${t.contactP}">${t.contact}</a> <i>·</i> <a href="mailto:${C.email}">${C.email}</a><br>© 2026 worldmap.tech · ${t.rights}</footer>
</html>
`;
  };
  for (const lang of ['tr', 'en']) {
    const m = META[lang], P = PAGES[lang];
    const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang,
      mainEntity: FAQ[lang].map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) };
    const faqBody = `<h1>${lang === 'tr' ? 'Sıkça sorulan sorular' : 'Frequently asked questions'}</h1>
<p class="lead">${esc(m.faq_description)}</p>
${FAQ[lang].map(x => `<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('\n')}
${md(read(content(`about.${lang}.md`)))}
<p><a class="btn" href="${P.app}">${T[lang].back}</a></p>`;
    write(P.faq.slice(1) + 'index.html', page({ lang, key: 'faq', title: m.faq_title, desc: m.faq_description, body: faqBody, ld: faqLd }));
    for (const [key, file, title, desc] of [
      ['privacy', lang === 'tr' ? 'gizlilik.tr.html' : 'privacy.en.html', lang === 'tr' ? 'Gizlilik Politikası ve KVKK Aydınlatma Metni | worldmap.tech' : 'Privacy Policy | worldmap.tech',
        lang === 'tr' ? 'worldmap.tech hangi verileri nerede tutar, çerezler, reklamlar ve KVKK kapsamındaki hakların.' : 'What worldmap.tech stores and where, cookies, ads, and your rights under GDPR, KVKK and other laws.'],
      ['terms', lang === 'tr' ? 'kosullar.tr.html' : 'terms.en.html', lang === 'tr' ? 'Kullanım Koşulları ve Sorumluluk Reddi | worldmap.tech' : 'Terms of Use and Disclaimer | worldmap.tech',
        lang === 'tr' ? 'worldmap.tech kullanım koşulları, sorumluluk reddi, harita sınırları ve açık kaynak lisansları.' : 'worldmap.tech terms of use, disclaimer, map borders and open-source licences.']]) {
      const f = path.join('content', file);
      let body = fs.existsSync(f) ? ownerFill(read(f), lang) : `<h1>${esc(title.split(' | ')[0])}</h1><p><mark>…</mark></p>`;
      if (key === 'privacy') body += `\n<p><button class="btn" type="button" id="resetConsent">${lang === 'tr' ? 'Çerez tercihimi sıfırla' : 'Reset my cookie choice'}</button> <span id="rcOk" class="meta" hidden>${lang === 'tr' ? 'Sıfırlandı: haritayı bir sonraki açışında yeniden sorulacak.' : 'Done: you will be asked again next time you open the map.'}</span></p>
<script>document.getElementById("resetConsent").onclick=function(){try{localStorage.removeItem("wmn.consent")}catch(e){}document.getElementById("rcOk").hidden=false};</script>`;
      write(P[key].slice(1) + 'index.html', page({ lang, key, title, desc, body }));
    }
  }

  // about pages
  for (const lang of ['tr', 'en']) {
    const f = content(`aboutpage.${lang}.md`); if (!fs.existsSync(f)) continue;
    const tr = lang === 'tr', title = tr ? 'worldmap.tech hakkında' : 'About worldmap.tech';
    const desc = tr ? 'worldmap.tech nedir, kim yapıyor, harita verileri nereden geliyor, gizlilik ve iletişim bilgileri.'
      : 'What worldmap.tech is, who makes it, where the map data comes from, privacy and how to get in touch.';
    write(PAGES[lang].about.slice(1) + 'index.html', page({ lang, key: 'about', title: title + ' | worldmap.tech', desc,
      ld: { '@context': 'https://schema.org', '@type': 'AboutPage', name: title, inLanguage: lang, url: C.origin + PAGES[lang].about },
      body: `<h1>${esc(title)}</h1>\n${ownerFill(md(read(f)), lang)}\n<p><a class="btn" href="${PAGES[lang].app}">${T[lang].back}</a></p>` }));
  }

  // contact pages
  for (const lang of ['tr', 'en']) {
    const f = content(`contact.${lang}.md`); if (!fs.existsSync(f)) continue;
    const tr = lang === 'tr', title = tr ? 'İletişim' : 'Contact';
    const desc = tr ? 'worldmap.tech ile iletişim: e-posta adresi, hangi konularda yazabileceğin, yanıt süreleri ve kişisel veri başvuruları.'
      : 'How to contact worldmap.tech: email address, what to write about, reply times and personal data requests.';
    write(PAGES[lang].contact.slice(1) + 'index.html', page({ lang, key: 'contact', title: title + ' | worldmap.tech', desc,
      ld: { '@context': 'https://schema.org', '@type': 'ContactPage', name: title, inLanguage: lang, url: C.origin + PAGES[lang].contact,
        mainEntity: { '@type': 'Organization', name: 'worldmap.tech', url: C.origin + PAGES.en.app, email: C.email } },
      body: `<h1>${esc(title)}</h1>\n${ownerFill(md(read(f)), lang)}\n<p><a class="btn" href="${PAGES[lang].app}">${T[lang].back}</a></p>` }));
  }

  // guide pages and the guide index
  const fmtDate = (d, lang) => new Date(d + 'T12:00:00Z').toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  for (const lang of ['tr', 'en']) {
    const P = PAGES[lang], t = T[lang], tr = lang === 'tr';
    const card = k => { const g = GUIDES[k][lang].meta; return `<li><a href="${P['g:' + k]}">${esc(g.title)}</a><br><span class="meta">${esc(g.description)}</span></li>`; };
    const idxTitle = tr ? 'Rehber: ülkeler, rotalar ve seyahat haritaları' : 'Guides: countries, routes and travel maps';
    const idxDesc = tr ? 'Dünyada kaç ülke var, hangi ziyaret sayılır, gezgin seviyeleri, çok ülkeli rotalar, harita projeksiyonları ve haritanı paylaşma üzerine yazılar.'
      : 'How many countries there are, what counts as a visit, traveler levels, multi-country routes, map projections and sharing your travel map.';
    if (gkeys.length) write(P.guides.slice(1) + 'index.html', page({ lang, key: 'guides', title: idxTitle + ' | worldmap.tech', desc: idxDesc,
      ld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: idxTitle, inLanguage: lang, url: C.origin + P.guides,
        hasPart: gkeys.map(k => ({ '@type': 'Article', headline: GUIDES[k][lang].meta.title, url: C.origin + P['g:' + k] })) },
      body: `<h1>${tr ? 'Rehber' : 'Guides'}</h1>\n<p class="lead">${esc(idxDesc)}</p>\n<ul class="guides">${gkeys.map(card).join('')}</ul>\n<p><a class="btn" href="${P.app}">${t.back}</a></p>` }));
    for (const k of gkeys) {
      const g = GUIDES[k][lang], key = 'g:' + k, url = C.origin + P[key];
      const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: g.meta.title, description: g.meta.description, inLanguage: lang,
        datePublished: GUIDES_DATE, dateModified: GUIDES_DATE, mainEntityOfPage: url, image: `${C.origin}/assets/og-${lang}.png`,
        author: C.owner.name ? { '@type': 'Person', name: C.owner.name } : { '@type': 'Organization', name: 'worldmap.tech' },
        publisher: { '@type': 'Organization', name: 'worldmap.tech', url: C.origin + PAGES.en.app, logo: { '@type': 'ImageObject', url: `${C.origin}/assets/icon-512.png` } } };
      const more = gkeys.filter(x => x !== k);
      const body = `<p class="meta"><a href="${P.guides}">${t.guides}</a> · ${fmtDate(GUIDES_DATE, lang)}</p>
<h1>${esc(g.meta.title)}</h1>
${md(g.body)}
<p><a class="btn" href="${P.app}">${tr ? 'Haritanı işaretle' : 'Mark your map'}</a></p>
${more.length ? `<h2>${tr ? 'Diğer yazılar' : 'More guides'}</h2>
<ul class="guides">${more.map(card).join('')}</ul>` : ''}`;
      write(P[key].slice(1) + 'index.html', page({ lang, key, title: g.meta.title + ' | worldmap.tech', desc: g.meta.description, body, ld }));
    }
  }

  // 404: both languages, not indexed
  const NF = readJ(content('notfound.json'));
  write('404.html', `<!doctype html>
<html lang="tr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>404 · worldmap.tech</title>
${icons}
${fontsHead}
<link rel="stylesheet" href="/assets/page.css?v=${V['page.css']}">
<main class="nf"><svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity=".55"><circle cx="32" cy="32" r="22"/><ellipse cx="32" cy="32" rx="9" ry="22"/><path d="M10.5 25h43M10.5 39h43"/></g><circle cx="47" cy="17" r="6" fill="#ff9f43"/></svg>
<h1>${esc(NF.tr.title)}</h1><p class="lead">${esc(NF.tr.text)}</p><p><a class="btn" href="/tr/">${esc(NF.tr.button)}</a></p>
<h1 lang="en" style="margin-top:44px">${esc(NF.en.title)}</h1><p class="lead" lang="en">${esc(NF.en.text)}</p><p lang="en"><a class="btn" href="/">${esc(NF.en.button)}</a></p></main>
</html>
`);

  // crawler + platform files
  const urls = ['app', 'faq', 'about', 'privacy', 'terms'].concat(fs.existsSync(content('contact.en.md')) ? ['contact'] : [], gkeys.length ? ['guides', ...gkeys.map(k => 'g:' + k)] : []);
  const lastmod = k => k === 'contact' ? '2026-10-24' : k === 'guides' || k === 'about' || k.startsWith('g:') ? GUIDES_DATE : '2026-10-09';
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.flatMap(k => ['en', 'tr'].map(l => `  <url><loc>${C.origin}${PAGES[l][k]}</loc><lastmod>${lastmod(k)}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${C.origin}${PAGES.en[k]}"/>
    <xhtml:link rel="alternate" hreflang="tr" href="${C.origin}${PAGES.tr[k]}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${C.origin}${PAGES.en[k]}"/></url>`)).join('\n')}
</urlset>
`);
  write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${C.origin}/sitemap.xml\n`);
  write('llms.txt', read(content('llms.txt')).trimEnd() + (gkeys.length ? '\n\n## Guides\n\n' + gkeys.flatMap(k => ['en', 'tr'].map(l =>
    `- [${GUIDES[k][l].meta.title}](${C.origin}${PAGES[l]['g:' + k]}): ${GUIDES[k][l].meta.description}`)).join('\n') : '') + '\n');
  // third-party notices, linked from the terms pages
  const lic = [
    ['Natural Earth (map data)', 'licenses/natural-earth.txt'],
    ['world-atlas 2.0.2 (ISC)', 'licenses/world-atlas.txt'],
    ['D3 7.9.0 (ISC)', 'node_modules/d3/LICENSE'],
    ['topojson-client 3.1.0 (ISC)', 'node_modules/topojson-client/LICENSE'],
    ['qrcode-generator 1.4.4 (MIT)', 'licenses/qrcode-generator.txt'],
    ['i18n-iso-countries 7.14.0 (MIT), country names', 'licenses/i18n-iso-countries.txt'],
    ['Bricolage Grotesque (SIL OFL 1.1)', 'node_modules/@fontsource/bricolage-grotesque/LICENSE'],
    ['Figtree (SIL OFL 1.1)', 'node_modules/@fontsource/figtree/LICENSE'],
  ];
  write('licenses.txt', 'worldmap.tech uses the following third-party components.\n\n'
    + lic.map(([h, f]) => `${'='.repeat(72)}\n${h}\n${'='.repeat(72)}\n\n${read(path.join(__dirname, f)).trim()}\n`).join('\n'));
  write('site.webmanifest', JSON.stringify({ name: 'worldmap.tech', short_name: 'worldmap', description: META.en.description, start_url: '/', scope: '/', display: 'standalone',
    background_color: '#e9f0f6', theme_color: '#2f7ee0',
    icons: [{ src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/assets/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }, { src: '/assets/icon.svg', sizes: 'any', type: 'image/svg+xml' }] }, null, 2));
  if (ADS.client) write('ads.txt', `google.com, ${ADS.client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
  write('_headers', `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  X-Frame-Options: SAMEORIGIN
  Strict-Transport-Security: max-age=31536000

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/favicon.ico
  Cache-Control: public, max-age=604800
`);

  const size = f => fs.statSync(path.join(OUT, f)).size;
  console.log('artifact', artifact.length, '| site index', size('index.html'), 'tr', size('tr/index.html'), 'world', size('assets/world.json'));
})().catch(e => { console.error(e); process.exit(1); });
