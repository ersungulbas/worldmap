// One-off: favicon/app icons and the 1200x630 social preview images (static/).
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'), path=require('path');
const S='static', A=S+'/assets';
const icon=fs.readFileSync(A+'/icon.svg','utf8');
const fontDir=path.resolve('pkgs');
const ff=(fam,file,w)=>`@font-face{font-family:'${fam}';font-weight:${w};src:url(file://${fontDir}/${file})}`;
const fonts=[ff('Bricolage Grotesque','fontsource-bricolage-grotesque-5.3.0/package/files/bricolage-grotesque-latin-800-normal.woff2',800),
  ff('Bricolage Grotesque','fontsource-bricolage-grotesque-5.3.0/package/files/bricolage-grotesque-latin-ext-800-normal.woff2',800),
  ff('Figtree','fontsource-figtree-5.3.0/package/files/figtree-latin-600-normal.woff2',600),ff('Figtree','fontsource-figtree-5.3.0/package/files/figtree-latin-ext-600-normal.woff2',600),
  ff('Figtree','fontsource-figtree-5.3.0/package/files/figtree-latin-700-normal.woff2',700),ff('Figtree','fontsource-figtree-5.3.0/package/files/figtree-latin-ext-700-normal.woff2',700)].join('\n');
function ico(pngs){ // ICO container with PNG payloads
  const n=pngs.length, head=Buffer.alloc(6+16*n); head.writeUInt16LE(0,0); head.writeUInt16LE(1,2); head.writeUInt16LE(n,4);
  let off=6+16*n; pngs.forEach(([size,buf],i)=>{const o=6+16*i; head[o]=size>=256?0:size; head[o+1]=size>=256?0:size; head[o+2]=0; head[o+3]=0; head.writeUInt16LE(1,o+4); head.writeUInt16LE(32,o+6); head.writeUInt32LE(buf.length,o+8); head.writeUInt32LE(off,o+12); off+=buf.length;});
  return Buffer.concat([head,...pngs.map(p=>p[1])]);
}
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({deviceScaleFactor:1});
  const tmp=path.resolve('tmp-asset.html');
  const load=async html=>{ fs.writeFileSync(tmp,html); await p.goto('file://'+tmp,{waitUntil:'load'}); };
  const shot=async(html,w,h,out)=>{ await p.setViewportSize({width:w,height:h}); await load(`<meta charset="utf-8"><style>${fonts}html,body{margin:0;background:transparent}</style>`+html); await p.evaluate(()=>document.fonts.ready); const buf=await p.screenshot({omitBackground:true,clip:{x:0,y:0,width:w,height:h}}); if(out) fs.writeFileSync(out,buf); return buf; };
  const sq=(s,svg)=>`<div style="width:${s}px;height:${s}px">${svg.replace('<svg ','<svg width="'+s+'" height="'+s+'" ')}</div>`;
  const full=icon.replace('rx="14"','rx="0"');  // iOS/Android add their own rounding
  await shot(sq(180,full),180,180,A+'/apple-touch-icon.png');
  await shot(sq(192,icon),192,192,A+'/icon-192.png');
  await shot(sq(512,icon),512,512,A+'/icon-512.png');
  // maskable: globe inside the 80% safe zone on a full-bleed background
  await shot(`<div style="width:512px;height:512px;background:#2f7ee0;display:grid;place-items:center">${icon.replace('<svg ','<svg width="400" height="400" ')}</div>`,512,512,A+'/icon-maskable-512.png');
  const p16=await shot(sq(16,icon),16,16), p32=await shot(sq(32,icon),32,32), p48=await shot(sq(48,icon),48,48);
  fs.writeFileSync(S+'/favicon.ico',ico([[16,p16],[32,p32],[48,p48]]));
  // social previews: real map render with a sample traveller
  const topo=fs.readFileSync('data/world.min.json','utf8');
  const d3=fs.readFileSync('pkgs/d3-7.9.0/package/dist/d3.min.js','utf8'), tj=fs.readFileSync('pkgs/topojson-client-3.1.0/package/dist/topojson-client.min.js','utf8');
  const visited=['TR','XC','DE','FR','IT','ES','PT','GR','NL','GB','AT','CZ','HU','GE','AZ','AE','EG','MA','TH','JP','US','MX','BR','CA','ID','IN'];
  for (const [lang,title,sub,chip] of [['tr','Dünyanın yüzde kaçını gördün?','Gittiğin ülkelere dokun, haritanı paylaş, arkadaşınla karşılaştır.','26 ülke · %13'],['en','How much of the world have you seen?','Tap the countries you’ve visited, share your map, compare with friends.','26 countries · 13%']]){
    await p.setViewportSize({width:1200,height:630});
    await load(`<meta charset="utf-8"><style>${fonts}
      body{margin:0;width:1200px;height:630px;background:#e9f0f6;font-family:Figtree;color:#16212e;position:relative;overflow:hidden}
      .t{position:absolute;left:64px;top:64px;width:500px}
      .b{font:800 30px 'Bricolage Grotesque';letter-spacing:-.01em}.b span{color:#2f7ee0}
      h1{font:800 60px/1.02 'Bricolage Grotesque';letter-spacing:-.02em;margin:56px 0 20px}
      p{font:600 25px/1.35 Figtree;color:#5d6b7c;margin:0}
      .chip{display:inline-block;margin-top:34px;background:#fff;border-radius:16px;padding:12px 20px;font:800 26px 'Bricolage Grotesque';color:#2f7ee0;box-shadow:0 6px 24px rgba(20,40,70,.12)}
      svg{position:absolute;right:28px;top:115px}
      path{fill:#fff;stroke:#c3ceda;stroke-width:.7;stroke-linejoin:round}path.on{fill:#7fb2ee;stroke:#4f8fd8}
    </style><div class="t"><div class="b">worldmap<span>.tech</span></div><h1>${title}</h1><p>${sub}</p><div class="chip">${chip}</div></div><svg id="m" width="640" height="400"></svg>
    <script>${d3}</script><script>${tj}</script><script>
      const topo=${topo}; const f=topojson.feature(topo,topo.objects.countries).features; const v=new Set(${JSON.stringify(visited)});
      const pr=d3.geoNaturalEarth1().fitSize([640,400],{type:'FeatureCollection',features:f}); const pa=d3.geoPath(pr);
      d3.select('#m').selectAll('path').data(f).join('path').attr('d',pa).attr('class',d=>v.has(d.properties.k)?'on':'');
    </script>`);
    await p.evaluate(()=>document.fonts.ready); console.log(lang, await p.evaluate(()=>document.querySelectorAll('#m path').length), await p.evaluate(()=>document.fonts.check("800 60px 'Bricolage Grotesque'")));
    fs.writeFileSync(`${A}/og-${lang}.png`, await p.screenshot({type:'png'}));
  }
  await b.close(); fs.unlinkSync(tmp); console.log('assets ok');
})();
