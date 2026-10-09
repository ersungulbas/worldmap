const fs=require('fs');
const topo=JSON.parse(fs.readFileSync('data/world.json'));
const keys=[...new Set(topo.objects.countries.geometries.map(g=>g.properties.k))];
const en=new Intl.DisplayNames(['en'],{type:'region'}),tr=new Intl.DisplayNames(['tr'],{type:'region'});
const ov={CD:['DR Congo','Kongo DC'],CG:['Congo','Kongo'],HK:['Hong Kong','Hong Kong'],MO:['Macau','Makao'],MM:['Myanmar','Myanmar'],PS:['Palestine','Filistin'],CI:["Côte d'Ivoire",'Fildişi Sahili'],CV:['Cape Verde','Yeşil Burun Adaları'],TR:['Türkiye','Türkiye'],GS:['South Georgia','Güney Georgia'],IO:['Chagos Islands','Chagos Adaları'],ST:['São Tomé & Príncipe','São Tomé ve Príncipe'],
  // Türkiye's usage for the island of Cyprus
  XC:['Northern Cyprus','Kuzey Kıbrıs Türk Cumhuriyeti'],CY:['Cyprus','Güney Kıbrıs Rum Yönetimi']};
const N={};for(const k of keys){N[k]=ov[k]||[en.of(k),tr.of(k)];for(const g of topo.objects.countries.geometries)if(g.properties.k===k)delete g.properties.n;}
// short labels for the map
const S={US:['USA','ABD'],AE:['UAE','BAE'],GB:['UK','Birleşik Krallık'],CF:['Central African Rep.','Orta Afrika Cum.'],BA:['Bosnia & Herz.','Bosna-Hersek'],DO:['Dominican Rep.','Dominik Cum.'],XC:['N. Cyprus','KKTC'],CY:['Cyprus','Güney Kıbrıs']};
// extra search terms
const A={XC:'KKTC TRNC Kuzey Kıbrıs Turkish Republic of Northern Cyprus',CY:'GKRY Kıbrıs Rum Republic of Cyprus'};
fs.writeFileSync('data/world.min.json',JSON.stringify(topo));
fs.writeFileSync('data/names.json',JSON.stringify({N,S,A}));
console.log(keys.length, fs.statSync('data/world.min.json').size);
