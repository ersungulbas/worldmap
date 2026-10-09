const {chromium}=require('/opt/node-tools/node_modules/playwright');
const B='http://127.0.0.1:8788';
const pos=k=>{const t=[...document.querySelectorAll('.lb')].find(e=>e.__data__.k===k);const d=t.__data__;const m=document.querySelector('#map g').getCTM();return {x:m.a*d.x+m.e,y:m.d*d.y+m.f}};
const mode=process.argv[2]||'sheet';
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},locale:'tr-TR',isMobile:true,hasTouch:true,deviceScaleFactor:2});
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1:8788)/, r=>r.abort());
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(B+'/tr/'); await p.waitForSelector('.lb',{state:'attached'});
  if (mode==='sheet'){
    for(const k of ['TR','DE','FR','EG','SA']){ const c=await p.evaluate(pos,k); await p.touchscreen.tap(c.x,c.y); await p.waitForTimeout(80); }
    await p.click('#save'); await p.waitForTimeout(900); await p.screenshot({path:'f-phone-sheet.png'});
    await p.click('#codebox button'); await p.waitForTimeout(600); await p.screenshot({path:'f-phone-sheet2.png'});
  } else {
    console.log('banner visible', await p.isVisible('#consent'), '|', (await p.textContent('#consent')).replace(/\s+/g,' '));
    const st=await p.evaluate(()=>{const a=getComputedStyle(document.getElementById('cYes')), r=getComputedStyle(document.getElementById('cNo')); return [a.backgroundColor===r.backgroundColor, a.fontSize===r.fontSize, document.getElementById('cYes').offsetWidth, document.getElementById('cNo').offsetWidth];});
    console.log('equal buttons', st);
    await p.screenshot({path:'f-consent.png'});
    await p.click('#cNo'); console.log('after reject: banner', await p.isVisible('#consent'), 'ads script', await p.evaluate(()=>!!document.querySelector('script[src*="adsbygoogle"]')), 'stored', await p.evaluate(()=>localStorage.getItem('wmn.consent')));
    await p.reload(); await p.waitForSelector('.lb',{state:'attached'}); await p.waitForTimeout(500);
    console.log('reload after reject: banner', await p.isVisible('#consent'));
    await p.click('#legal button'); console.log('prefs reopens banner', await p.isVisible('#consent'));
    await p.click('#cYes'); console.log('after accept: ads script', await p.evaluate(()=>!!document.querySelector('script[src*="adsbygoogle"]')));
    for(const k of ['TR']){ const c=await p.evaluate(pos,k); await p.touchscreen.tap(c.x,c.y); }
    await p.click('#save'); await p.waitForTimeout(800); console.log('ad slot shown', await p.isVisible('#adbox'), await p.getAttribute('#adbox ins','data-ad-client'), await p.getAttribute('#adbox ins','data-ad-slot'));
    const r=await (await p.request.get(B+'/ads.txt')).text(); console.log('ads.txt:', r.trim());
    console.log('head meta', await p.evaluate(()=>document.querySelector('meta[name=google-adsense-account]')?.content));
  }
  console.log('errors', errs); await b.close();
})();
