// Precompute map labels (position, size, line breaks) for both languages with the real fonts,
// using the site build served by `wrangler pages dev site` on :8788. Writes data/labels.json.
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const b=await chromium.launch(); const out={L:{}};
  for (const [lang,path,loc] of [['en','/','en-US'],['tr','/tr/','tr-TR']]){
    const ctx=await b.newContext({viewport:{width:1600,height:900},locale:loc});
    await ctx.route(/^(?!http:\/\/127\.0\.0\.1:8788)/, r=>r.abort());
    const p=await ctx.newPage(); await p.goto('http://127.0.0.1:8788'+path+'?dumplabels');
    await p.waitForFunction(()=>window.__wmDump,null,{timeout:60000});
    const d=await p.evaluate(()=>window.__wmDump);
    if (d.lang!==lang) throw new Error('language mismatch '+d.lang);
    out.L[lang]=d.L; out.B=d.B; await ctx.close();
  }
  fs.writeFileSync('data/labels.json', JSON.stringify(out));
  console.log('labels', Object.keys(out.L.en).length, Object.keys(out.L.tr).length, 'bytes', fs.statSync('data/labels.json').size, 'B', JSON.stringify(out.B));
  await b.close();
})();
