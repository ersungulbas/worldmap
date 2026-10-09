// Crawl every page in the sitemap (+404) on the local server; check each internal link/asset answers 200.
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const B='http://127.0.0.1:8788', ORIGIN='https://worldmap.tech';
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({locale:'en-US'});
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1:8788)/, r=>r.abort());
  const p=await ctx.newPage();
  const sm=await (await ctx.request.get(B+'/sitemap.xml')).text();
  const pages=[...new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replace(ORIGIN,'')))].concat(['/404-check']);
  const seen=new Map(), bad=[];
  for (const pg of pages){
    await p.goto(B+pg); await p.waitForTimeout(pg==='/'||pg==='/tr/'?1500:200);
    const refs=await p.evaluate(()=>[...document.querySelectorAll('a[href],link[href],script[src],img[src],meta[property="og:image"],meta[property="og:url"],link[rel=canonical]')]
      .map(e=>e.getAttribute('href')||e.getAttribute('src')||e.getAttribute('content')));
    for (let r of refs){
      if(!r||r.startsWith('mailto:')||r.startsWith('blob:')||r.startsWith('data:')) continue;
      r=r.replace(ORIGIN,''); if(/^https?:/.test(r)){ seen.set(r,'external'); continue; }
      const u=new URL(r,B+pg); u.hash=''; const k=u.pathname+u.search; if(seen.has(k)) continue;
      const res=await ctx.request.get(u.href,{maxRedirects:0}); seen.set(k,res.status()); if(res.status()!==200) bad.push([pg,k,res.status()]);
    }
  }
  console.log('pages',pages.length,'checked',[...seen.values()].filter(v=>v!=='external').length,'external',[...seen.entries()].filter(e=>e[1]==='external').map(e=>e[0]));
  console.log('not 200:',bad);
  await b.close();
})();
