// Builds data/world.json from world-atlas 50m with Türkiye's official positions applied:
//  - Northern Cyprus (KKTC) is its own country (key XC)
//  - Crimea belongs to Ukraine, the Golan Heights to Syria
//  - Western Sahara is part of Morocco, Somaliland part of Somalia
//  - Siachen Glacier stays a neutral, non-selectable disputed area
const fs=require('fs'), d3=require('./d3.cjs'), topojson=require('./topo.cjs'), server=require('./tserver.cjs'), pc=require('./pc.cjs');
const codes=require('./pkgs/i18n-iso-countries-7.14.0/package/codes.json');
const num2a2={}; for (const c of codes) num2a2[c[2]]=c[0];
const raw=JSON.parse(fs.readFileSync('data/package/countries-50m.json'));
const dispNE=JSON.parse(fs.readFileSync('../ne/ne_50m_admin_0_breakaway_disputed_areas.geojson'));
const golan=dispNE.features.find(f=>(f.properties.NAME||f.properties.BRK_NAME)==='Golan Heights');
if(!golan) throw new Error('no golan');

const drop=new Set(['Antarctica','Indian Ocean Ter.','Ashmore and Cartier Is.','Fr. S. Antarctic Lands','Heard I. and McDonald Is.']);
const byName={'Somaliland':'SO','N. Cyprus':'XC','Kosovo':'XK','Åland':'FI','W. Sahara':'MA'};
const feats=topojson.feature(raw,raw.objects.countries).features;
const polysOf=g=>g.type==='Polygon'?[g.coordinates]:g.coordinates;
// d3 wants clockwise exteriors (planar lon/lat); polygon-clipping returns counter-clockwise ones
const toD3=mp=>({type:'MultiPolygon',coordinates:mp.map(poly=>poly.map(r=>r.slice().reverse()))});
const countries=[], disputed=[];
const byKey={};
for (const f of feats){
  const n=f.properties.name;
  if (drop.has(n)) continue;
  if (n==='Siachen Glacier'){ disputed.push({type:'Feature',properties:{k:'_SI'},geometry:f.geometry}); continue; }
  const k=byName[n]||num2a2[f.id];
  if (!k) throw new Error('no key '+n);
  (byKey[k] ||= []).push(f.geometry);
}
// Crimea: lift the polygon out of Russia
const ru=byKey.RU[0]; const ruP=polysOf(ru);
const ci=ruP.findIndex(p=>{const c=d3.geoCentroid({type:'Polygon',coordinates:p}); return c[0]>32&&c[0]<37&&c[1]>44&&c[1]<46.3;});
if (ci<0) throw new Error('no crimea'); const crimea=ruP[ci];
byKey.RU=[{type:'MultiPolygon',coordinates:ruP.filter((_,i)=>i!==ci)}];
const union=(...gs)=>toD3(pc.union(...gs.map(g=>polysOf(g))));
byKey.UA=[union(...byKey.UA,{type:'Polygon',coordinates:crimea})];
// Golan Heights: out of Israel, into Syria
const gol=polysOf(golan.geometry);
// The two sources draw the Golan's edges slightly differently, so the cut leaves thin
// slivers next to the main body of Israel; those go to Syria with the Golan itself.
const ring2=r=>{let a=0;for(let i=0,j=r.length-1;i<r.length;j=i++)a+=(r[j][0]-r[i][0])*(r[j][1]+r[i][1]);return Math.abs(a/2);};
const ilParts=pc.difference(polysOf(byKey.IL[0]), gol).sort((a,b)=>ring2(b[0])-ring2(a[0]));
byKey.IL=[toD3([ilParts[0]])];
byKey.SY=[toD3(pc.union(polysOf(byKey.SY[0]), gol, ...ilParts.slice(1).map(p=>[p])))];
// one shape each for Morocco + Western Sahara and Somalia + Somaliland
byKey.MA=[union(...byKey.MA)];
byKey.SO=[union(...byKey.SO)];
for (const [k,gs] of Object.entries(byKey)) for (const g of gs){
  const a=d3.geoArea(g); if (a>1) throw new Error('winding '+k+' '+a);
  countries.push({type:'Feature',properties:{k},geometry:g});
}
const topo=server.topology({countries:{type:'FeatureCollection',features:countries},disputed:{type:'FeatureCollection',features:disputed}},1e5);
fs.writeFileSync('data/world.json',JSON.stringify(topo));
console.log('features',countries.length,'keys',Object.keys(byKey).length,'disputed',disputed.length,'bytes',fs.statSync('data/world.json').size);
// sanity: who owns these points now
const back=topojson.feature(topo,topo.objects.countries);
const pts={Crimea:[34.1,45.0],Golan:[35.75,33.0],Tiberias:[35.53,32.79],Haifa:[35.0,32.8],WSahara:[-12,26],WS1:[-14,24],Somaliland:[45,9.5],NCyprus:[33.6,35.25],SCyprus:[33,34.8],Moscow:[37.6,55.7],Kyiv:[30.5,50.45]};
for (const [n,p] of Object.entries(pts)) console.log(n.padEnd(11), back.features.filter(f=>d3.geoContains(f,p)).map(f=>f.properties.k).join(',')||'-');
