// Real-site flow against `npm run dev` (wrangler dev) on :8788 (D1 local)
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
const B='http://127.0.0.1:8788';
const JSQR=fs.readFileSync(require.resolve('jsqr/dist/jsQR.js'),'utf8');
const pos=k=>{const t=[...document.querySelectorAll('.lb')].find(e=>e.__data__.k===k);const d=t.__data__;const m=document.querySelector('#map g').getCTM();return {x:m.a*d.x+m.e,y:m.d*d.y+m.f}};
const log=(...a)=>console.log(...a);
async function newPage(b,opts={}){
  const ctx=await b.newContext({viewport:{width:1280,height:800},locale:'tr-TR',deviceScaleFactor:1,permissions:['clipboard-read','clipboard-write'],...opts});
  const p=await ctx.newPage(); p.errs=[];
  p.on('pageerror',e=>p.errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') p.errs.push('console: '+m.text()); });
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1:8788)/, r=>r.abort());
  return [ctx,p];
}
async function tapKeys(p,ks,mobile){ for(const k of ks){ const c=await p.evaluate(pos,k); if(mobile) await p.touchscreen.tap(c.x,c.y); else await p.mouse.click(c.x,c.y); await p.waitForTimeout(80);} }
async function decodeShot(p){
  await p.addScriptTag({content:JSQR});
  return p.evaluate(async()=>{ const img=document.getElementById('shot'); await img.decode(); const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight; const x=c.getContext('2d'); x.drawImage(img,0,0); const d=x.getImageData(0,0,c.width,c.height); const r=jsQR(d.data,c.width,c.height); return r?r.data:null; });
}
(async()=>{
  const b=await chromium.launch();
  // --- A: Turkish desktop
  let [ctxA,A]=await newPage(b);
  await A.goto(B+'/'); await A.waitForSelector('.lb',{state:'attached'});
  log('A url after / with tr-TR:', A.url());
  log('legal:', (await A.textContent('#legal')).replace(/\s+/g,' '));
  log('hint:', await A.textContent('#hint'));
  await tapKeys(A,['TR','DE','FR','IT','ES']);
  await A.fill('#q','gürc'); await A.waitForTimeout(100);
  log('search hits:', await A.$$eval('#res li',ls=>ls.map(l=>l.textContent).join(' | ')));
  await A.dispatchEvent('#res li .tg','pointerdown'); await A.waitForTimeout(100);
  log('after toggle via search:', await A.textContent('#n'), await A.$eval('#res li .tg',b=>b.textContent+' '+b.getAttribute('aria-label')));
  await A.keyboard.press('Escape');
  await A.fill('#q','japon'); await A.waitForTimeout(80); await A.keyboard.press('Enter'); await A.waitForTimeout(300); await A.keyboard.press('Enter'); await A.waitForTimeout(200);
  log('enter-enter toggled JP:', await A.textContent('#n'), await A.evaluate(()=>JSON.parse(localStorage.getItem('wmn.sel')).includes('JP')));
  await A.waitForTimeout(1000);
  await A.click('#save'); await A.waitForSelector('#sheet:not([hidden])'); await A.waitForTimeout(800);
  log('focus in sheet:', await A.evaluate(()=>document.activeElement.id), 'codebox:', await A.textContent('#codebox'));
  for (const f of ['story','square','wide']){ await A.click(`#fmt button[data-f="${f}"]`); await A.waitForTimeout(700);
    const src=await A.$eval('#shot',i=>i.src); const buf=await A.evaluate(async s=>{const r=await fetch(s);const b=new Uint8Array(await r.arrayBuffer());let t='';for(let i=0;i<b.length;i+=8192)t+=String.fromCharCode.apply(null,b.subarray(i,i+8192));return btoa(t)},src);
    fs.writeFileSync(`e-${f}.png`,Buffer.from(buf,'base64')); log('QR', f, '->', await decodeShot(A)); }
  await A.click('#qrT'); await A.waitForTimeout(700); log('QR off ->', await decodeShot(A), 'pressed', await A.getAttribute('#qrT','aria-pressed'));
  await A.click('#qrT'); await A.waitForTimeout(400);
  await A.click('#codebox button'); await A.waitForTimeout(600);
  const codeTxt=await A.textContent('#codebox b'); log('code box:', await A.textContent('#codebox'), '| toast:', await A.textContent('#toast'));
  await A.keyboard.press('Escape'); log('sheet hidden after Esc:', await A.isHidden('#sheet'));
  // --- B: fresh device restores with the code
  let [ctxB,Bp]=await newPage(b,{locale:'en-US',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  await Bp.goto(B+'/'); await Bp.waitForSelector('.lb',{state:'attached'});
  log('B url (en-US):', Bp.url(), 'count', await Bp.textContent('#n'));
  await Bp.screenshot({path:'e-phone-empty.png'});
  await Bp.click('#hint button'); await Bp.fill('#codeIn', codeTxt.toLowerCase().replace('-','')); 
  log('typed code shows as:', await Bp.inputValue('#codeIn'));
  await Bp.click('#dlgGo'); await Bp.waitForTimeout(800);
  log('B after restore:', await Bp.textContent('#n'), 'dlg hidden', await Bp.isHidden('#dlg'), 'toast', await Bp.textContent('#toast'));
  // wrong code
  await Bp.evaluate(()=>{}); 
  await tapKeys(Bp,['BR'],true); await Bp.waitForTimeout(1800);
  await Bp.screenshot({path:'e-phone-map.png'});
  // A picks up B's change on reload
  await A.reload(); await A.waitForSelector('.lb',{state:'attached'}); await A.waitForTimeout(1200);
  log('A after reload:', await A.textContent('#n'), 'has BR', await A.evaluate(()=>JSON.parse(localStorage.getItem('wmn.sel')).includes('BR')));
  // B deletes the code
  await Bp.click('#save'); await Bp.waitForSelector('#sheet:not([hidden])'); await Bp.waitForTimeout(600);
  await Bp.screenshot({path:'e-phone-sheet.png'});
  const del=Bp.locator('#codebox button',{hasText:'Delete'}); await del.click(); log('arm:', await Bp.textContent('#codebox')); await del.click(); await Bp.waitForTimeout(600);
  log('after delete:', await Bp.textContent('#codebox'), '|', await Bp.textContent('#toast'));
  await A.reload(); await A.waitForSelector('.lb',{state:'attached'}); await A.waitForTimeout(1000);
  log('A code after server delete:', await A.evaluate(()=>localStorage.getItem('wmn.code')), 'count kept', await A.textContent('#n'));
  // bad code
  await Bp.click('#close'); await Bp.evaluate(()=>{ document.querySelector('#hint').classList.remove('gone'); });
  await Bp.evaluate(()=>document.querySelector('#hint button').click()); await Bp.fill('#codeIn','ZZZZZZZZ'); await Bp.click('#dlgGo'); await Bp.waitForTimeout(500);
  log('bad code msg:', await Bp.textContent('#dlgErr'));
  await Bp.fill('#codeIn','12'); await Bp.click('#dlgGo'); log('short code msg:', await Bp.textContent('#dlgErr'));
  // language switch: B (English) -> Türkçe
  await Bp.click('#dlgX'); await Bp.click('#legal a[hreflang="tr"]'); await Bp.waitForLoadState('load'); await Bp.waitForTimeout(500);
  log('B after Türkçe link:', Bp.url(), await Bp.evaluate(()=>localStorage.getItem('wmn.lang')));
  await Bp.goto(B+'/'); await Bp.waitForTimeout(500); log('B visiting / with pref tr ->', Bp.url());
  log('A errors', A.errs, 'B errors', Bp.errs);
  await b.close();
})();
