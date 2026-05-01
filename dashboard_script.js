// ============================================================
// CONSTANTS
// ============================================================
const MN=['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MN3=['','Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const CATC={Decongelato:'#3b82f6',Allevamento:'#10b981',Congelato:'#6366f1',Molluschi:'#f59e0b',Crostacei:'#ec4899',Fresco:'#06b6d4',Franco:'#a855f7','Sotto Sale':'#d97706',Mare:'#0891b2',Altro:'#9ca3af'};
const CBDG={Decongelato:'b-de',Allevamento:'b-al',Congelato:'b-co',Molluschi:'b-mo',Crostacei:'b-cr',Fresco:'b-fr',Franco:'b-cr','Sotto Sale':'b-ss',Mare:'b-ma'};
const SUPC=['#3b82f6','#10b981','#f59e0b','#ec4899','#6366f1','#a855f7','#0891b2','#d97706','#ef4444','#84cc16'];

let RAW=[], PER='mese';
let crossFilter=null;
let tableSortCol=null, tableSortAsc=true;
let rawSortCol=null, rawSortAsc=true;

// ============================================================
// NOME PESCE — normalizzazione (case + varianti)
// ============================================================
const FISH_NORM=(function(){
  const map={
    // Coda di rospo
    'coda di rospo':'Coda di Rospo','code di rospo':'Coda di Rospo',
    // Cozze
    'cozza grecia':'Cozze Grecia','cozze grecia':'Cozze Grecia',
    'cozza pelosa':'Cozze Pelosa','cozza sfusa':'Cozze Sfusa','cozza treccia':'Cozze Treccia','cozze treccia':'Cozze Treccia',
    'cozze spagna':'Cozze Spagna','cozze':'Cozze',
    // Gamberi
    'gamberi 20/30':'Gamberi 20/30','gamberi salipci':'Gamberi Salipci',
    'gamberoni l1':'Gamberoni L1','l1 argentino':'Gamberoni L1',
    'gamberi':'Gamberi',
    // Merluzzo
    'merluzzi':'Merluzzo Prima','merluzzo 1':'Merluzzo Prima','merluzzo prima':'Merluzzo Prima','merluzzo':'Merluzzo Prima',
    'merluzzo 2':'Merluzzo Seconda','merluzzo seconda':'Merluzzo Seconda',
    // Orata / Orate — A e G sono prodotti distinti
    'orata':'Orata A','orata a':'Orata A',
    'orate':'Orata A','orate a':'Orata A',
    'orata g':'Orata G','orate g':'Orata G',
    // Pancasio / Pangasio
    'pancasio':'Pangasio','pangasio':'Pangasio',
    // Persico
    'persico':'Filetto Persico','filetto persico':'Filetto Persico',
    // Pesce spada
    'pesce spada':'Pesce Spada',
    // Pescatrice
    'pescatrici':'Pescatrice','pescatrice':'Pescatrice',
    'polpo t7':'Polpo T7','polpo  t7':'Polpo T7','polpo t4':'Polpo T4',
    'polpo t8':'Polpo T8','polpi t8':'Polpo T8','polipi t8':'Polpo T8',
    // Polpo / Polpi / Polipo → Polpo
    'polpo':'Polpo','polpi':'Polpo','polipo':'Polpo',
    // Raia / Raya / Razza
    'raia':'Razza','raya':'Razza','razza':'Razza',
    // Sarde
    'sarde':'Sarde',
    // Seppia / Seppie — tutte Seppia (singolare canonico)
    'seppia':'Seppia','seppie':'Seppia',
    'seppia 10/20':'Seppia Pulita 10/20','seppia cioco':'Seppia Cioco',
    'seppia pulita':'Seppia Pulita','seppia pulita 10/20':'Seppia Pulita 10/20',
    'seppia sporca':'Seppia Sporca',
    'seppie 10/20':'Seppia Pulita 10/20','seppie 20/40':'Seppie 20/40',
    'seppie cioco':'Seppia Cioco','seppie pulita':'Seppia Pulita',
    'seppie pulita gold':'Seppia Pulita Gold','seppie pulite':'Seppia Pulita',
    'seppie pulite 10/20':'Seppia Pulita 10/20',
    // Ombrina
    'ombrina':'Ombrina','ombrine':'Ombrina',
    // Sogliola
    'sogliola':'Sogliola','sogliola (lingua)':'Sogliola Lingua',
    'sogliola (tigri)':'Sogliola Tigri','sogliola tigri':'Sogliola Tigri',
    'sogliola(tigri)':'Sogliola Tigri','sogliole tigri':'Sogliola Tigri',
    // Spigola / Spigole
    'spigola':'Spigola A','spigola a':'Spigola A','spigole':'Spigola A',
    'spigola g':'Spigola G','spigole g':'Spigola G',
    'spigole 2g':'Spigole 2G','spigole 3g':'Spigole 3G',
    // Baccalà
    'baccala congelato':'Baccalà Congelato','baccalà salato':'Baccalà Salato',
    // Vongole
    'vongole':'Vongole','vongole lupini':'Vongole Lupini','vongole v.':'Vongole V.',
    // Lupini
    'lupini mega':'Lupini Mega','lupini':'Lupini',
  };
  return function(raw){
    const k=String(raw||'').trim().toLowerCase();
    if(map[k])return map[k];
    // Title-case fallback
    return String(raw||'').trim().replace(/\b\w/g,c=>c.toUpperCase());
  };
})();

// ============================================================
// CSV PARSER
// ============================================================
function parseCSV(txt){
  const rows=[];let cur=[],cell='',inQ=false;
  for(let i=0;i<txt.length;i++){
    const c=txt[i];
    if(inQ){if(c==='"'){if(txt[i+1]==='"'){cell+='"';i++;}else inQ=false;}else cell+=c;}
    else{if(c==='"')inQ=true;else if(c===','){cur.push(cell);cell='';}else if(c==='\n'){cur.push(cell);rows.push(cur);cur=[];cell='';}else if(c!=='\r')cell+=c;}
  }
  if(cell.length||cur.length){cur.push(cell);rows.push(cur);}
  return rows.filter(r=>r.length>1);
}
function parseNum(s){
  if(s==null)return 0;
  let v=String(s).trim().replace(/\u20ac/g,'').replace(/\s/g,'').replace(/%/g,'').replace(/\./g,'').replace(/,/g,'.');
  const n=parseFloat(v);return isFinite(n)?n:0;
}
function parseDate(s){
  const m=String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m)return null;return new Date(+m[3],+m[2]-1,+m[1]);
}
function isoWeek(d){
  const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);
  const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));
  return Math.ceil((((t-y0)/86400000)+1)/7);
}
// ISO week start (Monday) and end (Sunday) dates
function weekRange(wk,y){
  const jan4=new Date(Date.UTC(y,0,4));
  const startMs=jan4.getTime()-((jan4.getUTCDay()||7)-1)*86400000+(wk-1)*7*86400000;
  const start=new Date(startMs);
  const end=new Date(startMs+6*86400000);
  return{start,end};
}
function fmtDateShort(d){return String(d.getUTCDate()).padStart(2,'0')+'/'+String(d.getUTCMonth()+1).padStart(2,'0')+'/'+d.getUTCFullYear();}

function buildFromCSV(text){
  const rows=parseCSV(text);if(!rows.length)return[];
  const hdr=rows[0].map(h=>h.trim());
  const idx=name=>hdr.findIndex(h=>h.toLowerCase().startsWith(name.toLowerCase()));
  const iData=idx('data'),iPe=idx('pescheria'),iPesce=idx('pesce'),iForn=idx('fornitore'),iCat=idx('categoria'),
        iQa=idx('qta. acquistata'),iPa=idx('prezzo acquisto'),iPv=idx('prezzo vendita'),
        iRim=idx('rimanenza'),iGet=idx('gettato'),iScT=idx('scarto totale'),
        iSp=idx('spese'),iIl=idx('incasso (lordo)'),iIn=idx('incasso (netto)'),
        iMpct=idx('margine lordo (%)'),iQv=idx('qta. venduta'),iRoi=idx('roi pesce');
  const out=[];

  // ── DEDUPLICAZIONE ──────────────────────────────────────────────────────────
  // Chiave primaria (9 campi concordati):
  //   Data · Pescheria · Pesce (normalizzato) · Fornitore · Categoria ·
  //   Qta.Acquistata · PrezzoAcquisto · PrezzoVendita · Rimanenza
  // Righe con la stessa chiave sono duplicati da scartare (la prima occorrenza
  // viene mantenuta). Questo rimuove blocchi giornalieri inseriti due volte
  // nel file sorgente senza toccare righe legittime con valori diversi.
  const seenPK=new Set();

  for(let r=1;r<rows.length;r++){
    const row=rows[r];if(!row||!row[iData])continue;
    const d=parseDate(row[iData]);if(!d)continue;
    const pe=(row[iPe]||'').trim();
    const pscRaw=(row[iPesce]||'').trim();
    if(!pe||!pscRaw)continue;
    const psc=FISH_NORM(pscRaw);
    const forn=(row[iForn]||'').trim()||'N/D';
    const cat=(row[iCat]||'').trim()||'Altro';

    const pk=[
      d.toISOString().slice(0,10),  // Data
      pe,                            // Pescheria
      psc,                           // Pesce (normalizzato)
      forn,                          // Fornitore
      cat,                           // Categoria
      (row[iQa]||'').trim(),         // Qta. Acquistata
      (row[iPa]||'').trim(),         // Prezzo Acquisto
      (row[iPv]||'').trim(),         // Prezzo Vendita
      (row[iRim]||'').trim(),        // Rimanenza
    ].join('|');

    if(seenPK.has(pk))continue;
    seenPK.add(pk);
    // ────────────────────────────────────────────────────────────────────────

    // Formule Excel:
    //   Spese = Qa × Pa
    //   Incasso lordo = Qv × Pv
    //   Incasso netto = Incasso lordo − Spese
    //   Margine % = Incasso netto / Incasso lordo × 100
    //   ROI % = (Pv − Pa) / Pv × 100
    //   Qv = Qa − Scarto − Rimanenza − Gettato
    const qa=parseNum(row[iQa]),pa=parseNum(row[iPa]),pv=parseNum(row[iPv]);
    const rim=parseNum(row[iRim]),gt=parseNum(row[iGet]),sc=parseNum(row[iScT]);
    const sp=parseNum(row[iSp]);
    const il=parseNum(row[iIl]);
    const inn=parseNum(row[iIn]);
    const mp=parseNum(row[iMpct]);
    const qv=parseNum(row[iQv]);
    const roi=parseNum(row[iRoi]);
    const snv=+(rim*pa).toFixed(2);
    const m=d.getMonth()+1,y=d.getFullYear(),q=Math.ceil(m/3),wk=isoWeek(d);
    const ds=y*10000+m*100+d.getDate();
    out.push({date:d,ds,pe,psc,pscRaw,forn,cat,qa,pa,pv,rim,gt,sc,sp,il,inn,mp,roi,qv,snv,m,y,q,wk});
  }
  return out.sort((a,b)=>a.date-b.date);
}

// ============================================================
// FILTER DROPDOWNS — multi-select
// ============================================================
const $anno=document.getElementById('fAnno'),$mese=document.getElementById('fMese'),
      $sett=document.getElementById('fSett'),$pesch=document.getElementById('fPesch'),
      $forn=document.getElementById('fForn'),$giorno=document.getElementById('fGiorno');

(function applyMultiSelectStyles(){
  [{el:$anno,w:'100px'},{el:$mese,w:'120px'},{el:$sett,w:'110px'},{el:$pesch,w:'120px'},{el:$forn,w:'110px'}].forEach(({el,w})=>{
    el.setAttribute('multiple','multiple');
    el.setAttribute('size','4');
    el.style.cssText='min-width:'+w+';max-width:180px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#1a1a1a;font-size:11px;padding:2px 4px;outline:none;cursor:pointer;';
  });
  // Giorno settimana: multi-select
  $giorno.setAttribute('multiple','multiple');
  $giorno.setAttribute('size','4');
  $giorno.style.cssText='min-width:110px;max-width:140px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#1a1a1a;font-size:11px;padding:2px 4px;outline:none;cursor:pointer;';
  const giorni=[['tutti','Tutti'],['1','Lunedì'],['2','Martedì'],['3','Mercoledì'],['4','Giovedì'],['5','Venerdì'],['6','Sabato'],['0','Domenica']];
  $giorno.innerHTML=giorni.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('');
  const hint=document.createElement('div');
  hint.style.cssText='font-size:9px;color:#9ca3af;margin-top:2px;width:100%;';
  hint.textContent='Ctrl+click per pi\u00f9 selezioni';
  document.querySelector('.ctrl').appendChild(hint);
})();

function getMultiVals(sel){
  const vals=[...sel.selectedOptions].map(o=>o.value);
  if(!vals.length||vals.every(v=>v==='tutti'))return null;
  return vals.filter(v=>v!=='tutti');
}
function populateFilters(){
  const pes=[...new Set(RAW.map(r=>r.pe))].sort();
  $pesch.innerHTML='<option value="tutti" selected>Tutte</option>'+pes.map(p=>'<option value="'+p+'">'+p+'</option>').join('');
  const forns=[...new Set(RAW.map(r=>r.forn))].sort();
  $forn.innerHTML='<option value="tutti" selected>Tutti</option>'+forns.map(f=>'<option value="'+f+'">'+f+'</option>').join('');
  const years=[...new Set(RAW.map(r=>r.y))].sort((a,b)=>a-b);
  $anno.innerHTML='<option value="tutti" selected>Tutti</option>'+years.map(y=>'<option value="'+y+'">'+y+'</option>').join('');
  updateMeseOpts();updateSettOpts();
}
function updateMeseOpts(){
  const ayVals=getMultiVals($anno);
  let src=RAW;if(ayVals)src=src.filter(r=>ayVals.includes(String(r.y)));
  const ms=[...new Set(src.map(r=>r.m+'-'+r.y))].map(v=>{const[m,y]=v.split('-').map(Number);return{m,y};}).sort((a,b)=>a.y-b.y||a.m-b.m);
  const prevVals=getMultiVals($mese)||[];
  $mese.innerHTML='<option value="tutti">Tutti</option>'+ms.map(o=>'<option value="'+o.m+'-'+o.y+'">'+MN3[o.m]+' '+o.y+'</option>').join('');
  [...$mese.options].forEach(opt=>{if(prevVals.includes(opt.value))opt.selected=true;});
  if(![...$mese.selectedOptions].length)$mese.options[0].selected=true;
}
function updateSettOpts(){
  const ayVals=getMultiVals($anno),mfVals=getMultiVals($mese);
  let src=RAW;
  if(ayVals)src=src.filter(r=>ayVals.includes(String(r.y)));
  if(mfVals)src=src.filter(r=>mfVals.includes(r.m+'-'+r.y));
  const ws=[...new Set(src.map(r=>r.wk+'-'+r.y))].map(v=>{const[w,y]=v.split('-').map(Number);return{w,y};}).sort((a,b)=>a.y-b.y||a.w-b.w);
  const prevVals=getMultiVals($sett)||[];
  $sett.innerHTML='<option value="tutti">Tutte</option>'+ws.map(o=>'<option value="'+o.w+'-'+o.y+'">S'+String(o.w).padStart(2,'0')+'-'+o.y+'</option>').join('');
  [...$sett.options].forEach(opt=>{if(prevVals.includes(opt.value))opt.selected=true;});
  if(![...$sett.selectedOptions].length)$sett.options[0].selected=true;
}
$anno.addEventListener('change',()=>{updateMeseOpts();updateSettOpts();crossFilter=null;render();});
$mese.addEventListener('change',()=>{updateSettOpts();crossFilter=null;render();});
$sett.addEventListener('change',()=>{crossFilter=null;render();});
$pesch.addEventListener('change',()=>{crossFilter=null;render();});
$forn.addEventListener('change',()=>{crossFilter=null;render();});
$giorno.addEventListener('change',()=>{crossFilter=null;render();});

// ============================================================
// DATA ACCESS
// ============================================================
function getData(){
  let d=RAW;
  const pVals=getMultiVals($pesch);if(pVals)d=d.filter(r=>pVals.includes(r.pe));
  const fVals=getMultiVals($forn);if(fVals)d=d.filter(r=>fVals.includes(r.forn));
  const aVals=getMultiVals($anno);if(aVals)d=d.filter(r=>aVals.includes(String(r.y)));
  const mVals=getMultiVals($mese);if(mVals)d=d.filter(r=>mVals.includes(r.m+'-'+r.y));
  const sVals=getMultiVals($sett);if(sVals)d=d.filter(r=>sVals.includes(r.wk+'-'+r.y));
  const gVals=[...$giorno.selectedOptions].map(o=>o.value).filter(v=>v!=='tutti');
  if(gVals.length)d=d.filter(r=>gVals.includes(String(r.date.getDay())));
  return d;
}
function getFiltered(data){
  if(!crossFilter)return data;
  if(crossFilter.type==='cat')return data.filter(r=>r.cat===crossFilter.value);
  if(crossFilter.type==='fish')return data.filter(r=>r.psc===crossFilter.value);
  if(crossFilter.type==='supplier')return data.filter(r=>r.forn===crossFilter.value);
  if(crossFilter.type==='pe')return data.filter(r=>r.pe===crossFilter.value);
  if(crossFilter.type==='trend'){
    const k=crossFilter.value;
    if(PER==='giorno')return data.filter(r=>r.ds===+k);
    if(PER==='settimana')return data.filter(r=>r.y*100+r.wk===+k);
    if(PER==='mese')return data.filter(r=>r.y*100+r.m===+k);
    if(PER==='trimestre')return data.filter(r=>r.y*10+r.q===+k);
    if(PER==='anno')return data.filter(r=>r.y===+k);
  }
  return data;
}

// ============================================================
// AGGREGATION
// ============================================================
function agg(data){
  if(!data.length)return null;
  let il=0,inn=0,sp=0,qv=0,sc=0,rim=0,snv=0;
  data.forEach(r=>{il+=r.il;inn+=r.inn;sp+=r.sp;qv+=r.qv;sc+=r.sc;rim+=r.rim;snv+=r.snv;});
  const mp=il>0?inn/il*100:0;
  const bf={};
  data.forEach(r=>{
    if(!bf[r.psc])bf[r.psc]={n:r.psc,cat:r.cat,il:0,inn:0,sp:0,qv:0,sc:0,rim:0,
      _qa_pa:0,_qa_pv:0,_qa_tot:0}; // per medie ponderate
    const b=bf[r.psc];
    b.il+=r.il;b.inn+=r.inn;b.sp+=r.sp;b.qv+=r.qv;b.sc+=r.sc;b.rim+=r.rim;
    b._qa_pa+=r.qa*r.pa;  // somma qa*pa per media ponderata
    b._qa_pv+=r.qa*r.pv;  // somma qa*pv per media ponderata
    b._qa_tot+=r.qa;       // somma qa totale
  });
  const fa=Object.values(bf).map(f=>({
    ...f,
    mp:f.il>0?f.inn/f.il*100:0,
    pa_w:f._qa_tot>0?f._qa_pa/f._qa_tot:0,  // prezzo acquisto medio ponderato
    pv_w:f._qa_tot>0?f._qa_pv/f._qa_tot:0,  // prezzo vendita medio ponderato
  })).sort((a,b)=>b.mp-a.mp);
  return{il,inn,sp,qv,sc,rim,snv,mp,fish:fa};
}

// ============================================================
// FORMATTING
// ============================================================
function fmt(n,dec,pre){
  if(dec===undefined)dec=0;if(!pre)pre='';
  if(n===undefined||n===null)return '-';
  const neg=n<0;
  return pre+(neg?'-':'')+Math.abs(n).toLocaleString('it-IT',{minimumFractionDigits:dec,maximumFractionDigits:dec});
}
function fmtDate(d){return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();}
function mpColor(mp){return mp>=35?'#10b981':mp>=15?'#f59e0b':'#ef4444';}
function catBdg(cat){return CBDG[cat]||'b-ot';}
function delta(cur,prev){if(!prev||prev===0)return{pct:null,cls:'wnt'};const p=(cur-prev)/Math.abs(prev)*100;return{pct:p,cls:p>0?'wup':p<0?'wdn':'wnt'};}
function fmtDelta(d){if(d.pct===null)return'<span class="wnt">N/D</span>';const s=d.pct>0?'+':'';return'<span class="'+d.cls+'">'+s+d.pct.toFixed(1)+'%</span>';}

// ============================================================
// RENDER: KPIs
// ============================================================
function renderKPIs(a){
  const el=document.getElementById('kg');
  if(!a){el.innerHTML='<div style="padding:16px;color:#9ca3af;">Nessun dato</div>';return;}
  const cs=[
    {l:'Incasso netto',v:fmt(a.inn,0,'\u20ac '),s:'Lordo: '+fmt(a.il,0,'\u20ac ')},
    {l:'Margine lordo',v:a.mp.toFixed(1)+'%',s:fmt(a.inn,0,'\u20ac ')+' utile'},
    {l:'Kg venduti',v:fmt(a.qv,1)+'kg',s:'Prodotto collocato'},
    {l:'Scarto totale',v:fmt(a.sc,1)+'kg',s:'Perdita tecnica fissa'},
    {l:'Rimanenza',v:fmt(a.rim,1)+'kg',s:fmt(a.snv,0,'\u20ac ')+' immobilizzati'},
    {l:'Costo acquisti',v:fmt(a.sp,0,'\u20ac '),s:'Spese totali periodo'},
  ];
  el.innerHTML=cs.map(c=>'<div class="kc"><div class="kl">'+c.l+'</div><div class="kv">'+c.v+'</div><div class="ks">'+c.s+'</div></div>').join('');
}

// ============================================================
// RENDER: Highlights — top 3 / bottom 3 + best periods
// ============================================================
function renderHighlights(a,data){
  const el=document.getElementById('hrow');
  if(!a||!a.fish.length||!data.length){el.innerHTML='';return;}

  function fishCard(f,rank,cls,col){
    const marg=f.mp.toFixed(1);
    return'<div style="padding:8px 10px;border-bottom:1px solid #f3f4f6;">'+
      '<span style="font-size:9px;font-weight:700;color:'+col+';">#'+rank+'</span> '+
      '<span style="font-weight:600;font-size:12px;">'+f.n+'</span> '+
      '<span class="bdg '+catBdg(f.cat)+'" style="margin-left:3px;">'+f.cat+'</span>'+
      '<div style="font-size:10px;color:#6b7280;margin-top:2px;">'+
        'Marg. <b style="color:'+mpColor(f.mp)+'">'+marg+'%</b> &middot; '+
        'Netto <b>'+fmt(f.inn,0,'\u20ac ')+'</b> &middot; '+
        fmt(f.qv,1)+'kg'+
      '</div></div>';
  }

  function periodCard(lbl,col,name,inn,il,qv,extra){
    const mp=il>0?(inn/il*100).toFixed(1):'0.0';
    return'<div class="hc neutral" style="border-left-color:'+col+';">'+
      '<div class="hc-lbl" style="color:'+col+'">'+lbl+'</div>'+
      '<div class="hc-val">'+name+'</div>'+
      (extra?'<div class="hc-det" style="color:#9ca3af;font-size:9px;">'+extra+'</div>':'')+
      '<div class="hc-det">Netto <b>'+fmt(inn,0,'\u20ac ')+'</b> &middot; Lordo '+fmt(il,0,'\u20ac ')+'</div>'+
      '<div class="hc-det">Vol. <b>'+qv.toFixed(1)+'kg</b> &middot; Marg. <b>'+mp+'%</b></div>'+
    '</div>';
  }

  // Top 3 / Bottom 3
  const sorted=[...a.fish].sort((a,b)=>b.mp-a.mp);
  const top3=sorted.slice(0,3);
  const bot3=[...sorted].reverse().slice(0,3);

  let topHtml='<div class="hc best" style="padding:0;overflow:hidden;">'+
    '<div style="padding:10px 12px 6px;"><div class="hc-lbl" style="color:#10b981;">TOP 3 PESCI</div></div>'+
    top3.map((f,i)=>fishCard(f,i+1,'best','#10b981')).join('')+'</div>';
  let botHtml='<div class="hc worst" style="padding:0;overflow:hidden;">'+
    '<div style="padding:10px 12px 6px;"><div class="hc-lbl" style="color:#ef4444;">BOTTOM 3 PESCI</div></div>'+
    bot3.map((f,i)=>fishCard(f,i+1,'worst','#ef4444')).join('')+'</div>';

  // Best day
  const byDay={};data.forEach(r=>{const k=fmtDate(r.date);if(!byDay[k])byDay[k]={l:k,inn:0,il:0,qv:0};byDay[k].inn+=r.inn;byDay[k].il+=r.il;byDay[k].qv+=r.qv;});
  const bd=Object.values(byDay).sort((a,b)=>b.inn-a.inn)[0];

  // Best week — include date range
  const byWk={};
  data.forEach(r=>{
    const k=r.wk+'-'+r.y;
    if(!byWk[k]){
      const rng=weekRange(r.wk,r.y);
      byWk[k]={l:'S'+String(r.wk).padStart(2,'0')+'-'+r.y,inn:0,il:0,qv:0,
        range:fmtDateShort(rng.start)+' \u2013 '+fmtDateShort(rng.end)};
    }
    byWk[k].inn+=r.inn;byWk[k].il+=r.il;byWk[k].qv+=r.qv;
  });
  const bw=Object.values(byWk).sort((a,b)=>b.inn-a.inn)[0];

  // Best month
  const byMon={};data.forEach(r=>{const k=r.m+'-'+r.y;if(!byMon[k])byMon[k]={l:MN[r.m]+' '+r.y,inn:0,il:0,qv:0};byMon[k].inn+=r.inn;byMon[k].il+=r.il;byMon[k].qv+=r.qv;});
  const bm=Object.values(byMon).sort((a,b)=>b.inn-a.inn)[0];

  // Best quarter
  const byQ={};data.forEach(r=>{const k=r.q+'-'+r.y;if(!byQ[k])byQ[k]={l:'Q'+r.q+' '+r.y,inn:0,il:0,qv:0};byQ[k].inn+=r.inn;byQ[k].il+=r.il;byQ[k].qv+=r.qv;});
  const bq=Object.values(byQ).sort((a,b)=>b.inn-a.inn)[0];

  // Best year
  const byYr={};data.forEach(r=>{const k=String(r.y);if(!byYr[k])byYr[k]={l:String(r.y),inn:0,il:0,qv:0};byYr[k].inn+=r.inn;byYr[k].il+=r.il;byYr[k].qv+=r.qv;});
  const by=Object.values(byYr).sort((a,b)=>b.inn-a.inn)[0];

  let html=topHtml+botHtml;
  if(bd)html+=periodCard('MIGLIOR GIORNO','#3b82f6',bd.l,bd.inn,bd.il,bd.qv,null);
  if(bw)html+=periodCard('MIGLIOR SETTIMANA','#6366f1',bw.l,bw.inn,bw.il,bw.qv,bw.range);
  if(bm)html+=periodCard('MIGLIOR MESE','#3b82f6',bm.l,bm.inn,bm.il,bm.qv,null);
  if(bq)html+=periodCard('MIGLIOR TRIMESTRE','#3b82f6',bq.l,bq.inn,bq.il,bq.qv,null);
  if(by)html+=periodCard('MIGLIOR ANNO','#3b82f6',by.l,by.inn,by.il,by.qv,null);

  el.style.cssText='display:grid;grid-template-columns:1fr 1fr repeat(5,1fr);gap:7px;margin-bottom:8px;';
  el.innerHTML=html;
}

// ============================================================
// RENDER: WoW / MoM / YoY — solo periodi PASSATI (escludi corrente)
// ============================================================
function getCurrentPeriodKey(type){
  const now=new Date();
  const y=now.getFullYear(),m=now.getMonth()+1,wk=isoWeek(now);
  if(type==='week')return wk*10000+y; // same encoding as byW key
  if(type==='month')return y*100+m;
  if(type==='year')return y;
  return null;
}
function renderWoW(data){
  const el=document.getElementById('wowRow');
  if(!data.length){el.innerHTML='';return;}
  const pVals=getMultiVals($pesch);
  const allData=pVals?RAW.filter(r=>pVals.includes(r.pe)):RAW;
  const awW={},awM={},awY={};
  allData.forEach(r=>{
    const wk=r.wk+'-'+r.y;
    if(!awW[wk]){
      const rng=weekRange(r.wk,r.y);
      awW[wk]={k:r.y*10000+r.wk,
        label:'S'+String(r.wk).padStart(2,'0')+'-'+r.y,
        dateRange:fmtDateShort(rng.start)+' \u2013 '+fmtDateShort(rng.end),
        inn:0,il:0,sp:0,qv:0};
    }
    awW[wk].inn+=r.inn;awW[wk].il+=r.il;awW[wk].sp+=r.sp;awW[wk].qv+=r.qv;
    const mk=r.m+'-'+r.y;
    if(!awM[mk])awM[mk]={k:r.y*100+r.m,label:MN3[r.m]+' '+r.y,dateRange:MN[r.m]+' '+r.y,inn:0,il:0,sp:0,qv:0};
    awM[mk].inn+=r.inn;awM[mk].il+=r.il;awM[mk].sp+=r.sp;awM[mk].qv+=r.qv;
    const yk=String(r.y);
    if(!awY[yk])awY[yk]={k:r.y,label:String(r.y),dateRange:String(r.y),inn:0,il:0,sp:0,qv:0};
    awY[yk].inn+=r.inn;awY[yk].il+=r.il;awY[yk].sp+=r.sp;awY[yk].qv+=r.qv;
  });

  function comp(obj,label,curKey){
    let arr=Object.values(obj).sort((a,b)=>a.k-b.k).filter(x=>x.k!==curKey);
    if(arr.length<2)return'<div class="wow-card"><div class="wow-title">'+label+'</div><div style="font-size:11px;color:#9ca3af;">Dati insufficienti (periodi completi)</div></div>';
    const cur=arr[arr.length-1],prev=arr[arr.length-2];
    const dInn=delta(cur.inn,prev.inn),dIl=delta(cur.il,prev.il),dSp=delta(cur.sp,prev.sp),dQv=delta(cur.qv,prev.qv);
    const mpCur=cur.il>0?cur.inn/cur.il*100:0,mpPrev=prev.il>0?prev.inn/prev.il*100:0;
    const dMp=delta(mpCur,mpPrev);
    return'<div class="wow-card">'+
      '<div class="wow-title">'+label+'</div>'+
      '<div style="font-size:9px;color:#9ca3af;margin-bottom:2px;">'+
        '<b style="color:#374151;">'+cur.label+'</b> <span style="color:#d1d5db;">|</span> '+cur.dateRange+
      '</div>'+
      '<div style="font-size:9px;color:#9ca3af;margin-bottom:6px;">'+
        'vs <b style="color:#374151;">'+prev.label+'</b> <span style="color:#d1d5db;">|</span> '+prev.dateRange+
      '</div>'+
      '<div class="wow-grid">'+
        '<div class="wow-item"><span class="wlbl">Incasso netto</span><span class="wval">'+fmtDelta(dInn)+'</span><span style="font-size:9px;color:#9ca3af;">\u20ac'+fmt(cur.inn,0)+'</span></div>'+
        '<div class="wow-item"><span class="wlbl">Incasso lordo</span><span class="wval">'+fmtDelta(dIl)+'</span><span style="font-size:9px;color:#9ca3af;">\u20ac'+fmt(cur.il,0)+'</span></div>'+
        '<div class="wow-item"><span class="wlbl">Volume (kg)</span><span class="wval">'+fmtDelta(dQv)+'</span><span style="font-size:9px;color:#9ca3af;">'+cur.qv.toFixed(1)+'kg</span></div>'+
        '<div class="wow-item"><span class="wlbl">Margine %</span><span class="wval">'+fmtDelta(dMp)+'</span><span style="font-size:9px;color:#9ca3af;">'+mpCur.toFixed(1)+'%</span></div>'+
        '<div class="wow-item"><span class="wlbl">Spese</span><span class="wval">'+fmtDelta(dSp)+'</span></div>'+
        '<div class="wow-item"><span class="wlbl">Periodo prec.</span><span class="wval" style="font-size:11px;color:#6b7280;">\u20ac'+fmt(prev.inn,0)+'</span></div>'+
      '</div></div>';
  }

  const now=new Date();
  const curWkKey=isoWeek(now)*10000+now.getFullYear();
  const curMKey=now.getFullYear()*100+(now.getMonth()+1);
  const curYKey=now.getFullYear();
  el.innerHTML=comp(awW,'WoW (Settimana su Settimana)',curWkKey)+comp(awM,'MoM (Mese su Mese)',curMKey)+comp(awY,'YoY (Anno su Anno)',curYKey);
}

// ============================================================
// CHART LABEL PLUGINS
// ============================================================
const barTopLabelPlugin={
  id:'barTopLabel',
  afterDatasetsDraw(chart){
    const ctx=chart.ctx;
    const meta=chart.getDatasetMeta(0);
    if(!meta||meta.hidden)return;
    const ds=chart.data.datasets[0];
    ctx.save();ctx.font='bold 9px sans-serif';ctx.fillStyle='#374151';ctx.textAlign='center';ctx.textBaseline='bottom';
    meta.data.forEach((bar,i)=>{
      const val=ds.data[i];if(val==null||val===0)return;
      const label=Math.abs(val)>=1000?'\u20ac'+(val/1000).toFixed(1)+'k':'\u20ac'+Math.round(val);
      ctx.fillText(label,bar.x,bar.y-2);
    });
    ctx.restore();
  }
};
function makeFishLabelPlugin(fishArr){
  return{id:'fishLabel',afterDatasetsDraw(chart){
    const ctx=chart.ctx;const meta=chart.getDatasetMeta(0);if(!meta||meta.hidden)return;
    ctx.save();ctx.font='bold 9px sans-serif';ctx.textBaseline='middle';
    meta.data.forEach((bar,i)=>{
      const f=fishArr[i];if(!f)return;
      const val=f.inn;
      const label=Math.abs(val)>=1000?'\u20ac'+(val/1000).toFixed(1)+'k':'\u20ac'+Math.round(val);
      const x=val>=0?bar.x+4:bar.x-4;
      ctx.fillStyle=val>=0?'#374151':'#ef4444';ctx.textAlign=val>=0?'left':'right';
      ctx.fillText(label,x,bar.y);
    });
    ctx.restore();
  }};
}
const suppLabelPlugin={
  id:'suppLabel',
  afterDatasetsDraw(chart){
    const ctx=chart.ctx;const meta=chart.getDatasetMeta(0);if(!meta||meta.hidden)return;
    const ds=chart.data.datasets[0];
    ctx.save();ctx.font='bold 9px sans-serif';ctx.fillStyle='#374151';ctx.textAlign='center';ctx.textBaseline='bottom';
    meta.data.forEach((bar,i)=>{
      const val=ds.data[i];if(!val)return;
      const label=val>=1000?'\u20ac'+(val/1000).toFixed(1)+'k':'\u20ac'+Math.round(val);
      ctx.fillText(label,bar.x,bar.y-2);
    });
    ctx.restore();
  }
};

// ============================================================
// RENDER: Trend chart — lordo + netto + margine% (asse Y2)
// ============================================================
let TC=null,CC=null,FC=null,SC=null,SB=null,SP=null;

const DN_IT=['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];

function renderTrend(data){
  const G={};
  data.forEach(r=>{
    let k,l;
    if(PER==='giorno'){
      k=r.ds;
      const dn=DN_IT[r.date.getDay()];
      l=dn+' '+String(r.date.getDate()).padStart(2,'0')+'/'+String(r.m).padStart(2,'0')+'/'+r.y;
    }
    else if(PER==='settimana'){k=r.y*100+r.wk;l='S'+String(r.wk).padStart(2,'0')+'-'+r.y;}
    else if(PER==='mese'){k=r.y*100+r.m;l=MN3[r.m]+' '+r.y;}
    else if(PER==='trimestre'){k=r.y*10+r.q;l='Q'+r.q+' '+r.y;}
    else{k=r.y;l=String(r.y);}
    if(!G[k])G[k]={l,il:0,inn:0,date:r.date};G[k].il+=r.il;G[k].inn+=r.inn;
  });
  const ent=Object.entries(G).sort((a,b)=>+a[0]-+b[0]);
  const tl={giorno:'giornaliero',settimana:'settimanale',mese:'mensile',trimestre:'trimestrale',anno:'annuale'};
  document.getElementById('ttl').innerHTML='<span style="display:flex;align-items:center;gap:10px;"><span>Trend '+(tl[PER]||'')+'</span>'+
    '<span style="font-size:10px;display:flex;gap:8px;font-weight:400;color:#6b7280;">'+
    '<span style="display:flex;align-items:center;gap:3px;"><span style="width:10px;height:10px;border-radius:2px;background:#bfdbfe;display:inline-block;"></span>Lordo</span>'+
    '<span style="display:flex;align-items:center;gap:3px;"><span style="width:14px;height:2px;background:#10b981;display:inline-block;"></span>Netto</span>'+
    '<span style="display:flex;align-items:center;gap:3px;"><span style="width:14px;height:2px;border-top:2px dashed #f59e0b;display:inline-block;"></span>Marg.%</span>'+
    '</span></span>';
  if(TC)TC.destroy();
  TC=new Chart(document.getElementById('tc'),{
    type:'bar',plugins:[barTopLabelPlugin],
    data:{labels:ent.map(e=>e[1].l),datasets:[
      {label:'Incasso lordo',data:ent.map(e=>Math.round(e[1].il)),backgroundColor:'#bfdbfe',borderColor:'#3b82f6',borderWidth:1,borderRadius:4,order:2,yAxisID:'y'},
      {label:'Incasso netto',data:ent.map(e=>Math.round(e[1].inn)),type:'line',borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.06)',borderWidth:2,pointRadius:3,pointBackgroundColor:'#10b981',fill:true,tension:.3,order:1,yAxisID:'y'},
      {label:'Margine %',data:ent.map(e=>e[1].il>0?+(e[1].inn/e[1].il*100).toFixed(1):0),type:'line',borderColor:'#f59e0b',backgroundColor:'transparent',borderWidth:2,borderDash:[4,3],pointRadius:3,pointBackgroundColor:'#f59e0b',fill:false,tension:.3,order:0,yAxisID:'y2'}
    ]},
    options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:18}},
      onClick(evt,els){
        if(!els.length){crossFilter=null;render();return;}
        const idx=els[0].index;
        const entry=ent[idx];
        if(!entry)return;
        const key=entry[0];
        const val=entry[1];
        // Cross-filter per periodo cliccato
        if(crossFilter&&crossFilter.type==='trend'&&crossFilter.value===key){
          crossFilter=null;
        } else {
          crossFilter={type:'trend',value:key,label:val.l,date:val.date};
        }
        render();
      },
      plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false,callbacks:{
        label:ctx=>{if(ctx.datasetIndex===2)return'Margine %: '+ctx.parsed.y.toFixed(1)+'%';return ctx.dataset.label+': \u20ac'+ctx.parsed.y.toLocaleString('it-IT');}
      }}},
      scales:{
        x:{grid:{display:false},ticks:{font:{size:9},color:'#9ca3af',maxRotation:55}},
        y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},color:'#9ca3af',callback:v=>v>=1000?'\u20ac'+(v/1000).toFixed(0)+'k':'\u20ac'+v},position:'left'},
        y2:{grid:{display:false},ticks:{font:{size:9},color:'#f59e0b',callback:v=>v+'%'},position:'right',min:0,max:100}
      }
    }
  });
}

// ============================================================
// RENDER: Category donut
// ============================================================
function renderCats(data){
  const g={};data.forEach(r=>{if(!g[r.cat])g[r.cat]=0;g[r.cat]+=r.il;});
  const ent=Object.entries(g).sort((a,b)=>b[1]-a[1]);
  const tot=ent.reduce((s,e)=>s+e[1],0);
  if(CC)CC.destroy();
  CC=new Chart(document.getElementById('cc'),{
    type:'doughnut',
    data:{labels:ent.map(e=>e[0]),datasets:[{data:ent.map(e=>Math.round(e[1])),backgroundColor:ent.map(e=>CATC[e[0]]||'#9ca3af'),borderWidth:2,borderColor:'#fff',hoverOffset:6}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'60%',
      onClick(evt,els){
        if(!els.length){crossFilter=null;render();return;}
        const cat=ent[els[0].index][0];
        if(crossFilter&&crossFilter.type==='cat'&&crossFilter.value===cat)crossFilter=null;
        else crossFilter={type:'cat',value:cat};render();
      },
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'\u20ac'+ctx.parsed.toLocaleString('it-IT')+' ('+(tot>0?Math.round(ctx.parsed/tot*100):0)+'%)'}}}
    }
  });
  document.getElementById('cleg').innerHTML=ent.map(e=>'<span style="display:flex;align-items:center;gap:3px;"><span class="ldot" style="background:'+(CATC[e[0]]||'#9ca3af')+'"></span>'+e[0]+' '+(tot>0?Math.round(e[1]/tot*100):0)+'%</span>').join('');
}

// ============================================================
// RENDER: Fish bar — tutti i pesci, scrollabile, label valori
// ============================================================
function renderFishBar(a){
  const wrap=document.getElementById('fcw');
  if(!a||!a.fish.length){if(FC)FC.destroy();wrap.style.height='60px';wrap.style.overflowY='';return;}
  // Ordina per margine % decrescente
  const fish=[...a.fish].sort((a,b)=>b.mp-a.mp);
  const barH=28;
  const totalH=fish.length*barH+60;
  const maxH=420;
  wrap.style.height=Math.min(totalH,maxH)+'px';
  wrap.style.overflowY=totalH>maxH?'auto':'hidden';
  const canvas=document.getElementById('fc');
  canvas.style.height=totalH+'px';
  if(FC)FC.destroy();

  // Stacked 100%: segmento netto (verde) + segmento costi (grigio)
  // Ogni barra = 100% dell'incasso lordo
  // Segmento netto = margine% del lordo
  // Segmento costi = (100 - margine%) del lordo
  const netPct  = fish.map(f=>f.il>0?+(f.inn/f.il*100).toFixed(2):0);
  const costPct = fish.map(f=>f.il>0?+(100-f.inn/f.il*100).toFixed(2):100);

  // Plugin: label margine% centrata nel segmento netto + lordo/netto a destra
  const fishLabelPlugin={id:'fishLabel',afterDatasetsDraw(chart){
    const ctx=chart.ctx;
    const metaNet=chart.getDatasetMeta(0);
    if(!metaNet||metaNet.hidden)return;
    ctx.save();
    ctx.textBaseline='middle';
    metaNet.data.forEach((bar,i)=>{
      const f=fish[i];if(!f)return;
      const barW=bar.x-chart.scales.x.getPixelForValue(0);
      // Margine% dentro la barra netta (solo se abbastanza larga)
      if(Math.abs(barW)>28){
        ctx.font='bold 9px sans-serif';
        ctx.fillStyle='#fff';
        ctx.textAlign='center';
        ctx.fillText(f.mp.toFixed(1)+'%', bar.x-Math.abs(barW)/2, bar.y);
      }
      // Lordo + Netto a destra di tutta la barra (100%)
      const xEnd=chart.scales.x.getPixelForValue(100)+4;
      ctx.font='9px sans-serif';
      ctx.fillStyle='#374151';
      ctx.textAlign='left';
      const ilLabel=f.il>=1000?'\u20ac'+(f.il/1000).toFixed(1)+'k':'\u20ac'+Math.round(f.il);
      const innLabel=f.inn>=0?'+\u20ac'+(Math.abs(f.inn)>=1000?(Math.abs(f.inn)/1000).toFixed(1)+'k':Math.round(Math.abs(f.inn))):'-\u20ac'+(Math.abs(f.inn)>=1000?(Math.abs(f.inn)/1000).toFixed(1)+'k':Math.round(Math.abs(f.inn)));
      ctx.fillText(ilLabel+' / '+innLabel, xEnd, bar.y);
    });
    ctx.restore();
  }};

  FC=new Chart(canvas,{
    type:'bar',
    plugins:[fishLabelPlugin],
    data:{
      labels:fish.map(f=>f.n),
      datasets:[
        {
          label:'Margine netto %',
          data:netPct,
          backgroundColor:fish.map(f=>{
            if(crossFilter&&crossFilter.type==='fish'&&crossFilter.value===f.n)return'rgba(16,185,129,.85)';
            return f.mp>=35?'rgba(16,185,129,.7)':f.mp>=15?'rgba(245,158,11,.7)':'rgba(239,68,68,.7)';
          }),
          borderWidth:0,borderRadius:0
        },
        {
          label:'Costi %',
          data:costPct,
          backgroundColor:fish.map(f=>{
            if(crossFilter&&crossFilter.type==='fish'&&crossFilter.value===f.n)return'rgba(209,213,219,.6)';
            return'rgba(209,213,219,.35)';
          }),
          borderWidth:0,borderRadius:0
        }
      ]
    },
    options:{
      indexAxis:'y',responsive:false,maintainAspectRatio:false,
      layout:{padding:{right:130}},
      onClick(evt,els){
        if(!els.length){crossFilter=null;render();return;}
        const fn=fish[els[0].index].n;
        if(crossFilter&&crossFilter.type==='fish'&&crossFilter.value===fn)crossFilter=null;
        else crossFilter={type:'fish',value:fn};render();
      },
      plugins:{
        legend:{display:false},
        tooltip:{
          mode:'index',intersect:false,
          callbacks:{
            title:ctx=>fish[ctx[0].dataIndex].n,
            label:ctx=>{
              const f=fish[ctx.dataIndex];
              if(!f)return'';
              if(ctx.datasetIndex===0)return'Margine: '+f.mp.toFixed(1)+'% (\u20ac'+Math.round(f.inn).toLocaleString('it-IT')+' netto)';
              const costi=f.sp||0;
              return'Costi: '+(100-f.mp).toFixed(1)+'% (\u20ac'+Math.round(costi).toLocaleString('it-IT')+' acquisti)';
            },
            afterBody:ctx=>{
              if(!ctx||!ctx[0])return[];
              const f=fish[ctx[0].dataIndex];
              if(!f)return[];
              return['\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
                'Lordo: \u20ac'+Math.round(f.il).toLocaleString('it-IT'),
                'Netto: \u20ac'+Math.round(f.inn).toLocaleString('it-IT'),
                'Kg venduti: '+f.qv.toFixed(1)+'kg'];
            }
          }
        }
      },
      scales:{
        x:{
          stacked:true,min:0,max:100,
          grid:{color:'rgba(0,0,0,.04)'},
          ticks:{font:{size:9},color:'#9ca3af',callback:v=>v+'%'}
        },
        y:{stacked:true,grid:{display:false},ticks:{font:{size:10},color:'#374151'}}
      }
    }
  });
}

// ============================================================
// RENDER: Scatter — Revenue Map
// ============================================================
function renderScatter(a){
  if(!a||!a.fish.length){if(SC)SC.destroy();return;}
  const pts=a.fish.map(f=>({x:f.qv,y:f.mp,r:Math.max(4,Math.min(25,Math.sqrt(Math.abs(f.il))/3)),label:f.n,il:f.il,inn:f.inn,cat:f.cat}));
  if(SC)SC.destroy();
  SC=new Chart(document.getElementById('scatter'),{
    type:'bubble',
    data:{datasets:[{label:'Pesci',data:pts,backgroundColor:pts.map(p=>(CATC[p.cat]||'#9ca3af')+'66'),borderColor:pts.map(p=>CATC[p.cat]||'#9ca3af'),borderWidth:1}]},
    options:{responsive:true,maintainAspectRatio:false,
      onClick(evt,els){
        if(!els.length){crossFilter=null;render();return;}
        const fn=pts[els[0].index].label;
        if(crossFilter&&crossFilter.type==='fish'&&crossFilter.value===fn)crossFilter=null;
        else crossFilter={type:'fish',value:fn};render();
      },
      plugins:{legend:{display:false},tooltip:{callbacks:{
        title:ctx=>ctx[0].raw.label,
        label:ctx=>['Margine: '+ctx.raw.y.toFixed(1)+'%','Kg venduti: '+ctx.raw.x.toFixed(1),'Incasso lordo: \u20ac'+Math.round(ctx.raw.il).toLocaleString('it-IT'),'Margine netto: \u20ac'+Math.round(ctx.raw.inn).toLocaleString('it-IT')]
      }}},
      scales:{
        x:{title:{display:true,text:'Kg venduti',font:{size:10},color:'#9ca3af'},grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},color:'#9ca3af'}},
        y:{title:{display:true,text:'Margine %',font:{size:10},color:'#9ca3af'},grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},color:'#9ca3af',callback:v=>v+'%'}}
      }
    }
  });
}

// ============================================================
// RENDER: Supplier charts — scrollabile
// ============================================================
function renderSuppliers(data){
  const g={};data.forEach(r=>{if(!g[r.forn])g[r.forn]=0;g[r.forn]+=r.sp;});
  const ent=Object.entries(g).sort((a,b)=>b[1]-a[1]);
  const tot=ent.reduce((s,e)=>s+e[1],0);
  if(SB)SB.destroy();
  SB=new Chart(document.getElementById('suppBar'),{
    type:'bar',plugins:[suppLabelPlugin],
    data:{labels:ent.map(e=>e[0]),datasets:[{label:'Spesa \u20ac',data:ent.map(e=>Math.round(e[1])),
      backgroundColor:ent.map((e,i)=>(crossFilter&&crossFilter.type==='supplier'&&crossFilter.value===e[0])?SUPC[i%SUPC.length]:SUPC[i%SUPC.length]+'44'),
      borderColor:ent.map((e,i)=>SUPC[i%SUPC.length]),borderWidth:1,borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:18}},
      onClick(evt,els){
        if(!els.length){crossFilter=null;render();return;}
        const sup=ent[els[0].index][0];
        if(crossFilter&&crossFilter.type==='supplier'&&crossFilter.value===sup)crossFilter=null;
        else crossFilter={type:'supplier',value:sup};render();
      },
      plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false,callbacks:{label:ctx=>ctx.dataset.label+': \u20ac'+ctx.parsed.y.toLocaleString('it-IT')+' ('+(tot>0?Math.round(ctx.parsed.y/tot*100):0)+'%)'}}},
      scales:{x:{grid:{display:false},ticks:{font:{size:10},color:'#9ca3af'}},y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},color:'#9ca3af',callback:v=>v>=1000?'\u20ac'+(v/1000).toFixed(0)+'k':'\u20ac'+v}}}
    }
  });
  if(SP)SP.destroy();
  SP=new Chart(document.getElementById('suppPie'),{
    type:'doughnut',
    data:{labels:ent.map(e=>e[0]),datasets:[{data:ent.map(e=>Math.round(e[1])),backgroundColor:ent.map((e,i)=>SUPC[i%SUPC.length]),borderWidth:2,borderColor:'#fff',hoverOffset:5}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'58%',
      onClick(evt,els){
        if(!els.length){crossFilter=null;render();return;}
        const sup=ent[els[0].index][0];
        if(crossFilter&&crossFilter.type==='supplier'&&crossFilter.value===sup)crossFilter=null;
        else crossFilter={type:'supplier',value:sup};render();
      },
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'\u20ac'+ctx.parsed.toLocaleString('it-IT')+' ('+(tot>0?Math.round(ctx.parsed/tot*100):0)+'%)'}}}
    }
  });
  document.getElementById('suppLeg').innerHTML=ent.map((e,i)=>'<span style="display:flex;align-items:center;gap:3px;"><span class="ldot" style="background:'+SUPC[i%SUPC.length]+'"></span>'+e[0]+' '+(tot>0?Math.round(e[1]/tot*100):0)+'%</span>').join('');
}

// ============================================================
// RENDER: Aggregated fish table (sortable + cross-filter)
// ============================================================
function renderTable(a){
  const el=document.getElementById('tbl');
  if(!a||!a.fish.length){el.innerHTML='<tr><td colspan="9" style="padding:14px;color:#9ca3af;">Nessun dato</td></tr>';return;}
  const cols=[
    {key:'n',label:'Pesce',fmt:v=>v,num:false},
    {key:'cat',label:'Categoria',fmt:v=>'<span class="bdg '+catBdg(v)+'">'+v+'</span>',num:false},
    {key:'il',label:'Incasso \u20ac',fmt:v=>fmt(v,0,'\u20ac '),num:true},
    {key:'inn',label:'Margine \u20ac',fmt:v=>'<span style="color:'+(v>=0?'#10b981':'#ef4444')+';font-weight:600;">'+fmt(v,0,'\u20ac ')+'</span>',num:true},
    {key:'mp',label:'Margine %',fmt:v=>'<span style="color:'+mpColor(v)+';font-weight:600;">'+v.toFixed(1)+'%</span>',num:true},
    {key:'pa_w',label:'Pa medio \u20ac/kg',fmt:v=>fmt(v,2,'\u20ac '),num:true},
    {key:'pv_w',label:'Pv medio \u20ac/kg',fmt:v=>fmt(v,2,'\u20ac '),num:true},
    {key:'qv',label:'Kg venduti',fmt:v=>v.toFixed(1),num:true},
    {key:'sc',label:'Scarto kg',fmt:v=>v.toFixed(1),num:true},
    {key:'rim',label:'Rimanenza kg',fmt:v=>v.toFixed(1),num:true},
  ];
  let fish=[...a.fish];
  if(tableSortCol!==null){
    const c=cols[tableSortCol];
    fish.sort((a,b)=>{
      let va=a[c.key],vb=b[c.key];
      if(!c.num){va=String(va).toLowerCase();vb=String(vb).toLowerCase();return tableSortAsc?va.localeCompare(vb):vb.localeCompare(va);}
      return tableSortAsc?va-vb:vb-va;
    });
  }
  const thead='<thead><tr>'+cols.map((c,i)=>{
    const sorted=tableSortCol===i;
    const arrow=sorted?(tableSortAsc?'\u25B2':'\u25BC'):'\u25B4';
    return'<th class="'+(sorted?'sorted':'')+'" data-ci="'+i+'">'+c.label+' <span class="arrow">'+arrow+'</span></th>';
  }).join('')+'</tr></thead>';
  const tbody='<tbody>'+fish.map(r=>{
    const hl=crossFilter&&crossFilter.type==='fish'&&crossFilter.value===r.n;
    return'<tr class="'+(hl?'row-hl':'')+'" data-fish="'+r.n+'">'+cols.map(c=>'<td>'+c.fmt(r[c.key],r)+'</td>').join('')+'</tr>';
  }).join('')+'</tbody>';
  el.innerHTML=thead+tbody;
  el.querySelectorAll('th').forEach(th=>{
    th.addEventListener('click',()=>{
      const ci=+th.dataset.ci;
      if(tableSortCol===ci)tableSortAsc=!tableSortAsc;else{tableSortCol=ci;tableSortAsc=true;}
      renderTable(a);
    });
  });
  el.querySelectorAll('tbody tr').forEach(tr=>{
    tr.style.cursor='pointer';
    tr.addEventListener('click',()=>{
      const fn=tr.dataset.fish;
      if(crossFilter&&crossFilter.type==='fish'&&crossFilter.value===fn)crossFilter=null;
      else crossFilter={type:'fish',value:fn};render();
    });
  });
}

// ============================================================
// RENDER: Raw data table (sortable, all visible rows)
// ============================================================
function renderRawTable(data){
  const el=document.getElementById('rawTbl');
  if(!el)return;
  if(!data.length){el.innerHTML='<tr><td colspan="12" style="padding:14px;color:#9ca3af;">Nessun dato</td></tr>';return;}
  const cols=[
    {key:'date',label:'Data',fmt:r=>fmtDate(r.date),sortVal:r=>r.ds,num:true},
    {key:'pe',label:'Pescheria',fmt:r=>r.pe,sortVal:r=>r.pe,num:false},
    {key:'psc',label:'Pesce',fmt:r=>r.psc,sortVal:r=>r.psc,num:false},
    {key:'forn',label:'Fornitore',fmt:r=>r.forn,sortVal:r=>r.forn,num:false},
    {key:'cat',label:'Categoria',fmt:r=>'<span class="bdg '+catBdg(r.cat)+'">'+r.cat+'</span>',sortVal:r=>r.cat,num:false},
    {key:'qa',label:'Kg acq.',fmt:r=>r.qa.toFixed(1),sortVal:r=>r.qa,num:true},
    {key:'qv',label:'Kg vend.',fmt:r=>r.qv.toFixed(1),sortVal:r=>r.qv,num:true},
    {key:'sp',label:'Spese',fmt:r=>fmt(r.sp,2,'\u20ac '),sortVal:r=>r.sp,num:true},
    {key:'il',label:'Inc. lordo',fmt:r=>fmt(r.il,2,'\u20ac '),sortVal:r=>r.il,num:true},
    {key:'inn',label:'Inc. netto',fmt:r=>'<span style="color:'+(r.inn>=0?'#10b981':'#ef4444')+';font-weight:500;">'+fmt(r.inn,2,'\u20ac ')+'</span>',sortVal:r=>r.inn,num:true},
    {key:'mp',label:'Marg.%',fmt:r=>'<span style="color:'+mpColor(r.mp)+';font-weight:500;">'+r.mp.toFixed(1)+'%</span>',sortVal:r=>r.mp,num:true},
    {key:'rim',label:'Rim. kg',fmt:r=>r.rim.toFixed(1),sortVal:r=>r.rim,num:true},
  ];
  let rows=[...data];
  if(rawSortCol!==null){
    const c=cols[rawSortCol];
    rows.sort((a,b)=>{
      const va=c.sortVal(a),vb=c.sortVal(b);
      if(!c.num)return rawSortAsc?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va));
      return rawSortAsc?va-vb:vb-va;
    });
  }
  const thead='<thead><tr>'+cols.map((c,i)=>{
    const sorted=rawSortCol===i;
    const arrow=sorted?(rawSortAsc?'\u25B2':'\u25BC'):'\u25B4';
    return'<th class="'+(sorted?'sorted':'')+'" data-rci="'+i+'">'+c.label+' <span class="arrow">'+arrow+'</span></th>';
  }).join('')+'</tr></thead>';
  const tbody='<tbody>'+rows.map(r=>'<tr>'+cols.map(c=>'<td>'+c.fmt(r)+'</td>').join('')+'</tr>').join('')+'</tbody>';
  el.innerHTML=thead+tbody;
  el.querySelectorAll('th').forEach(th=>{
    th.addEventListener('click',()=>{
      const ci=+th.dataset.rci;
      if(rawSortCol===ci)rawSortAsc=!rawSortAsc;else{rawSortCol=ci;rawSortAsc=true;}
      renderRawTable(data);
    });
  });
  // Update count
  const cnt=document.getElementById('rawCount');
  if(cnt)cnt.textContent=rows.length+' righe';
}

// ============================================================
// COLLAPSIBLE SECTIONS
// ============================================================
function toggleSection(bodyId,arrowId){
  const body=document.getElementById(bodyId);
  const arrow=document.getElementById(arrowId);
  if(!body||!arrow)return;
  const isOpen=body.classList.contains('open');
  body.classList.toggle('open',!isOpen);
  arrow.classList.toggle('open',!isOpen);
  arrow.textContent=isOpen?'▶':'▼';
  // Se si apre la sezione actual e ci sono dati, ridisegna i grafici
  // (Chart.js non disegna correttamente su canvas nascosti)
  if(!isOpen&&bodyId==='actualBody'&&RAW2.length)renderActual();
  if(!isOpen&&bodyId==='prepostBody')renderPrePost();
}

// ============================================================
// DATASET 2 — Actual (cassa reale)
// ============================================================
let RAW2=[];
let ACT1=null,ACT2=null,ACT3=null,ACT4=null,ACT5=null;

// Fornitori pesce reali (non benzina/altro)
const FORNITORI_PESCE=['Meridional','Pinuccio','Brezza','Franco','Ottavio'];

function parseNum2(s){
  if(!s||!s.trim())return 0;
  let v=String(s).trim().replace(/€/g,'').replace(/\u20ac/g,'').replace(/\s/g,'').replace(/\./g,'').replace(/,/g,'.');
  const n=parseFloat(v);return isFinite(n)?n:0;
}


function buildFromCSV2(text){
  const rows=parseCSV(text);
  if(!rows.length)return[];
  const hdr=rows[0].map(h=>h.trim());
  const idx=name=>hdr.findIndex(h=>h.toLowerCase().includes(name.toLowerCase()));
  const iData=idx('data'),iTipo=idx('tipo'),iDetA=idx('dettaglio spesa a'),
        iDetB=idx('dettaglio spesa b'),iCifra=idx('cifra'),iMese=idx('mese'),iAnno=idx('anno');
  const out=[];
  const seen=new Set();
  for(let r=1;r<rows.length;r++){
    const row=rows[r];if(!row||!row[iData])continue;
    const d=parseDate(row[iData]);if(!d)continue;
    const tipo=(row[iTipo]||'').trim();
    const detA=(row[iDetA]||'').trim();
    const detB=(row[iDetB]||'').trim();
    const cifraRaw=(row[iCifra]||'').trim();
    const pk=[d.toISOString().slice(0,10),tipo,detA,detB,cifraRaw].join('|');
    if(seen.has(pk))continue;
    seen.add(pk);
    const cifra=parseNum2(cifraRaw);
    const m=d.getMonth()+1,y=d.getFullYear(),wk=isoWeek(d),q=Math.ceil((d.getMonth()+1)/3);
    const ds=y*10000+m*100+d.getDate();
    // Pescheria: dalle Entrate (DetB = "Pescheria Grassano" / "Brigante" / ecc.)
    let pe='';
    if(tipo==='Entrata'){
      pe=detB.replace(/^pescheria\s*/i,'').trim();
    }
    // Categoria spesa
    let categoria='';
    if(tipo==='Entrata') categoria='entrata';
    else if(FORNITORI_PESCE.includes(detB)) categoria='fornitore_pesce';
    else if(detB==='Benzina') categoria='benzina';
    else categoria='altro';
    out.push({date:d,ds,tipo,detA,detB,cifra,m,y,q,wk,pe,categoria});
  }
  return out.sort((a,b)=>a.date-b.date);
}

function aggActualByPeriod(data2){
  const G={};
  data2.forEach(r=>{
    let k,l;
    if(PER==='giorno'){k=r.ds;const dn=DN_IT[r.date.getDay()];l=dn+' '+String(r.date.getDate()).padStart(2,'0')+'/'+String(r.m).padStart(2,'0')+'/'+r.y;}
    else if(PER==='settimana'){k=r.y*100+r.wk;l='S'+String(r.wk).padStart(2,'0')+'-'+r.y;}
    else if(PER==='mese'){k=r.y*100+r.m;l=MN3[r.m]+' '+r.y;}
    else if(PER==='trimestre'){k=r.y*10+r.q;l='Q'+r.q+' '+r.y;}
    else{k=r.y;l=String(r.y);}
    if(!G[k])G[k]={l,k,entrata:0,forn_pesce:0,benzina:0,altro:0,_byForn:{}};
    if(r.categoria==='entrata')G[k].entrata+=r.cifra;
    else if(r.categoria==='fornitore_pesce'){G[k].forn_pesce+=Math.abs(r.cifra);G[k]._byForn[r.detB]=(G[k]._byForn[r.detB]||0)+Math.abs(r.cifra);}
    else if(r.categoria==='benzina')G[k].benzina+=Math.abs(r.cifra);
    else G[k].altro+=Math.abs(r.cifra);
  });
  return Object.values(G).sort((a,b)=>+a.k-+b.k).map(v=>({
    ...v,
    netto_full:v.entrata-v.forn_pesce-v.benzina-v.altro,
    netto_forn:v.entrata-v.forn_pesce,
    mp_full:v.entrata>0?(v.entrata-v.forn_pesce-v.benzina-v.altro)/v.entrata*100:0,
    mp_forn:v.entrata>0?(v.entrata-v.forn_pesce)/v.entrata*100:0,
  }));
}

function aggFishByPeriod(data1){
  const G={};
  // Lista fornitori unici in DS1 (escludi Rimanenza che ha sp=0)
  const forns=[...new Set(data1.map(r=>r.forn).filter(f=>f&&f!=='Rimanenza'&&f!=='N/D'))].sort();
  data1.forEach(r=>{
    let k,l;
    if(PER==='giorno'){k=r.ds;const dn=DN_IT[r.date.getDay()];l=dn+' '+String(r.date.getDate()).padStart(2,'0')+'/'+String(r.m).padStart(2,'0')+'/'+r.y;}
    else if(PER==='settimana'){k=r.y*100+r.wk;l='S'+String(r.wk).padStart(2,'0')+'-'+r.y;}
    else if(PER==='mese'){k=r.y*100+r.m;l=MN3[r.m]+' '+r.y;}
    else if(PER==='trimestre'){k=r.y*10+r.q;l='Q'+r.q+' '+r.y;}
    else{k=r.y;l=String(r.y);}
    if(!G[k]){G[k]={l,k,il:0,inn:0,sp:0,byForn:{}};forns.forEach(f=>{G[k].byForn[f]=0;});}
    G[k].il+=r.il;G[k].inn+=r.inn;G[k].sp+=r.sp;
    if(r.forn&&r.forn!=='Rimanenza'&&r.forn!=='N/D')G[k].byForn[r.forn]=(G[k].byForn[r.forn]||0)+r.sp;
  });
  const result=Object.values(G).sort((a,b)=>+a.k-+b.k).map(v=>({...v,mp_fish:v.il>0?v.inn/v.il*100:0}));
  result._forns=forns; // lista fornitori per il grafico
  return result;
}

function getActualFiltered(){
  let d=RAW2;
  const tVals=getMultiVals(document.getElementById('fTipo'));
  if(tVals)d=d.filter(r=>tVals.includes(r.tipo));
  const aVals2=getMultiVals(document.getElementById('fDetA2'));
  if(aVals2)d=d.filter(r=>aVals2.includes(r.detA));
  const bVals=getMultiVals(document.getElementById('fDetB2'));
  if(bVals)d=d.filter(r=>bVals.includes(r.detB));
  const aVals=getMultiVals($anno);if(aVals)d=d.filter(r=>aVals.includes(String(r.y)));
  const mVals=getMultiVals($mese);if(mVals)d=d.filter(r=>mVals.includes(r.m+'-'+r.y));
  const pVals=getMultiVals($pesch);
  if(pVals)d=d.filter(r=>r.tipo!=='Entrata'||pVals.includes(r.pe));
  const gVals=[...(document.getElementById('fGiorno')?.selectedOptions||[])].map(o=>o.value).filter(v=>v!=='tutti');
  if(gVals.length)d=d.filter(r=>gVals.includes(String(r.date.getDay())));
  return d;
}

function populateActualFilters(){
  const tipi=[...new Set(RAW2.map(r=>r.tipo))].sort();
  const detAs=[...new Set(RAW2.map(r=>r.detA))].sort();
  const detBs=[...new Set(RAW2.map(r=>r.detB))].sort();
  [['fTipo',tipi],['fDetA2',detAs],['fDetB2',detBs]].forEach(([id,vals])=>{
    const el=document.getElementById(id);if(!el)return;
    el.setAttribute('multiple','multiple');el.setAttribute('size','4');
    el.style.cssText='min-width:110px;max-width:160px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#1a1a1a;font-size:11px;padding:2px 4px;outline:none;cursor:pointer;';
    el.innerHTML='<option value="tutti">Tutti</option>'+vals.map(v=>'<option value="'+v+'">'+v+'</option>').join('');
    el.addEventListener('change',()=>renderActual());
  });
}

function renderActual(){
  if(!RAW2.length)return;
  const section=document.getElementById('actualSection');
  if(section)section.style.display='';
  const data2=getActualFiltered();
  const data1=getData();
  const actPeriods=aggActualByPeriod(data2);
  const fishPeriods=aggFishByPeriod(data1);
  const allKeys=[...new Set([...actPeriods.map(p=>String(p.k)),...fishPeriods.map(p=>String(p.k))])].sort((a,b)=>+a-+b);
  const actMap=Object.fromEntries(actPeriods.map(p=>[String(p.k),p]));
  const fishMap=Object.fromEntries(fishPeriods.map(p=>[String(p.k),p]));
  const labels=allKeys.map(k=>(actMap[k]||fishMap[k]).l);
  // Totali
  const totFish={il:fishPeriods.reduce((s,p)=>s+p.il,0),inn:fishPeriods.reduce((s,p)=>s+p.inn,0),sp:fishPeriods.reduce((s,p)=>s+p.sp,0)};
  const totAct={entrata:actPeriods.reduce((s,p)=>s+p.entrata,0),forn:actPeriods.reduce((s,p)=>s+p.forn_pesce,0),benz:actPeriods.reduce((s,p)=>s+p.benzina,0),altro:actPeriods.reduce((s,p)=>s+p.altro,0)};
  totAct.netto_full=totAct.entrata-totAct.forn-totAct.benz-totAct.altro;
  totAct.netto_forn=totAct.entrata-totAct.forn;
  const mpFish=totFish.il>0?totFish.inn/totFish.il*100:0;
  const mpActFull=totAct.entrata>0?totAct.netto_full/totAct.entrata*100:0;
  // KPI
  const kpiEl=document.getElementById('actualKpi');
  if(kpiEl){
    const dL=totAct.entrata-totFish.il,dF=totAct.forn-totFish.sp,dN=totAct.netto_full-totFish.inn;
    const col=v=>(v>=0?'<span style="color:#10b981">+':'<span style="color:#ef4444">')+fmt(v,0,'\u20ac ')+'</span>';
    const kpis=[
      {l:'Lordo Fish Record',v:fmt(totFish.il,0,'\u20ac '),s:'\u03a3 Qv\u00d7Pv'},
      {l:'Lordo Actual (cassa)',v:fmt(totAct.entrata,0,'\u20ac '),s:'\u0394 vs fish: '+col(dL)},
      {l:'Spese Fish (Qa\u00d7Pa)',v:fmt(totFish.sp,0,'\u20ac '),s:'Solo pesce'},
      {l:'Fornitori Actual',v:fmt(totAct.forn,0,'\u20ac '),s:'\u0394 vs fish: '+col(dF)},
      {l:'Benzina',v:fmt(totAct.benz,0,'\u20ac '),s:'Non in fish record'},
      {l:'Altro',v:fmt(totAct.altro,0,'\u20ac '),s:'Non in fish record'},
      {l:'Netto Fish',v:fmt(totFish.inn,0,'\u20ac '),s:'Marg. '+mpFish.toFixed(1)+'%'},
      {l:'Netto Actual (tutto)',v:fmt(totAct.netto_full,0,'\u20ac '),s:'Marg. '+mpActFull.toFixed(1)+'% \u0394 '+col(dN)},
    ];
    kpiEl.style.gridTemplateColumns='repeat(4,1fr)';
    kpiEl.innerHTML=kpis.map(c=>'<div class="kc"><div class="kl">'+c.l+'</div><div class="kv" style="font-size:14px;">'+c.v+'</div><div class="ks">'+c.s+'</div></div>').join('');
  }
  const bOpts=()=>({responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10}}},tooltip:{mode:'index',intersect:false,callbacks:{label:ctx=>ctx.dataset.label+': \u20ac'+ctx.parsed.y.toLocaleString('it-IT')}}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:55}},y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},callback:v=>v>=1000?'\u20ac'+(v/1000).toFixed(0)+'k':'\u20ac'+v}}}});
  if(ACT1)ACT1.destroy();
  const c1=document.getElementById('actRevChart');
  if(c1)ACT1=new Chart(c1,{type:'bar',
    data:{labels,datasets:[
      {label:'Lordo Fish Record',data:allKeys.map(k=>Math.round(fishMap[k]?.il||0)),backgroundColor:'rgba(59,130,246,.5)',borderColor:'#3b82f6',borderWidth:1,borderRadius:3,order:2},
      {label:'Lordo Actual',data:allKeys.map(k=>Math.round(actMap[k]?.entrata||0)),backgroundColor:'rgba(16,185,129,.5)',borderColor:'#10b981',borderWidth:1,borderRadius:3,order:2},
      {
        label:'\u0394 Lordo (Actual \u2212 Fish)',
        data:allKeys.map(k=>{
          const il=fishMap[k]?.il??null,en=actMap[k]?.entrata??null;
          return il!==null&&en!==null?Math.round(en-il):null;
        }),
        type:'line',
        borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,.08)',
        borderWidth:2,pointRadius:4,pointBackgroundColor:allKeys.map(k=>{
          const il=fishMap[k]?.il??null,en=actMap[k]?.entrata??null;
          if(il===null||en===null)return'#9ca3af';
          return en-il>=0?'#10b981':'#ef4444';
        }),
        pointBorderColor:'transparent',fill:true,tension:.3,order:1,
        segment:{borderColor:ctx=>{
          const v=ctx.p1.parsed.y;return v>=0?'#10b981':'#ef4444';
        }}
      }
    ]},
    options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:8}},
      plugins:{legend:{position:'top',labels:{font:{size:10}}},
        tooltip:{mode:'index',intersect:false,callbacks:{
          label:ctx=>{
            if(ctx.datasetIndex===2){
              const v=ctx.parsed.y;
              return'\u0394 Lordo: '+(v>=0?'+':'')+'\u20ac'+v.toLocaleString('it-IT')+' ('+(v>=0?'actual > fish':'actual < fish')+')';
            }
            return ctx.dataset.label+': \u20ac'+ctx.parsed.y.toLocaleString('it-IT');
          }
        }}},
      scales:{
        x:{grid:{display:false},ticks:{font:{size:9},maxRotation:55}},
        y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},callback:v=>v>=1000?'\u20ac'+(v/1000).toFixed(0)+'k':'\u20ac'+v}}
      }
    }
  });
  if(ACT2)ACT2.destroy();
  const c2=document.getElementById('actFornChart');
  if(c2){
    // Ordine fisso fornitori (stesso in DS1 e DS2)
    const FORN_ORDER=['Meridional','Pinuccio','Brezza','Franco','Ottavio'];
    const fornColors={'Meridional':'#3b82f6','Pinuccio':'#10b981','Brezza':'#f59e0b','Franco':'#a855f7','Ottavio':'#06b6d4'};
    // Totali per il tooltip afterBody
    const totFish1=FORN_ORDER.reduce((s,f)=>s+fishPeriods.reduce((ss,p)=>ss+(p.byForn?.[f]||0),0),0);
    const totAct1=actPeriods.reduce((s,p)=>s+p.forn_pesce,0);
    const totBenz=actPeriods.reduce((s,p)=>s+p.benzina,0);
    const totAltro=actPeriods.reduce((s,p)=>s+p.altro,0);
    const ds1Datasets=FORN_ORDER.map(f=>({
      label:'Fish: '+f,
      data:allKeys.map(k=>Math.round(fishMap[k]?.byForn?.[f]||0)),
      backgroundColor:(fornColors[f]||'#9ca3af')+'66',
      borderColor:fornColors[f]||'#9ca3af',
      borderWidth:1,borderRadius:0,stack:'fish'
    }));
    const ds2Forn=FORN_ORDER.map(f=>({
      label:'Actual: '+f,
      data:allKeys.map(k=>Math.round(actMap[k]?._byForn?.[f]||0)),
      backgroundColor:(fornColors[f]||'#9ca3af')+'99',
      borderColor:fornColors[f]||'#9ca3af',
      borderWidth:1,borderRadius:0,stack:'actual'
    }));
    const ds2Extra=[
      {label:'Actual: Benzina',data:allKeys.map(k=>Math.round(actMap[k]?.benzina||0)),backgroundColor:'rgba(239,68,68,.35)',borderColor:'#ef4444',borderWidth:1,borderRadius:0,stack:'actual'},
      {label:'Actual: Altro',data:allKeys.map(k=>Math.round(actMap[k]?.altro||0)),backgroundColor:'rgba(156,163,175,.35)',borderColor:'#9ca3af',borderWidth:1,borderRadius:0,stack:'actual'}
    ];
    ACT2=new Chart(c2,{type:'bar',data:{labels,datasets:[...ds1Datasets,...ds2Forn,...ds2Extra]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'top',labels:{font:{size:9},boxWidth:10}},
          tooltip:{mode:'index',intersect:false,callbacks:{
            label:ctx=>ctx.dataset.label+': \u20ac'+ctx.parsed.y.toLocaleString('it-IT'),
            afterBody:()=>[
              '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
              'Totale Fish (filtri): \u20ac'+Math.round(totFish1).toLocaleString('it-IT'),
              'Totale Actual fornitori: \u20ac'+Math.round(totAct1).toLocaleString('it-IT'),
              'Totale Benzina: \u20ac'+Math.round(totBenz).toLocaleString('it-IT'),
              'Totale Altro: \u20ac'+Math.round(totAltro).toLocaleString('it-IT'),
              '\u0394 Fish vs Actual: \u20ac'+(totAct1-totFish1>=0?'+':'')+Math.round(totAct1-totFish1).toLocaleString('it-IT'),
            ]
          }}},
        scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:55}},
          y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},callback:v=>v>=1000?'\u20ac'+(v/1000).toFixed(0)+'k':'\u20ac'+v}}}
      }});
  }
  if(ACT3)ACT3.destroy();
  const c3=document.getElementById('actNettoChart');
  if(c3)ACT3=new Chart(c3,{type:'bar',data:{labels,datasets:[
    {label:'Netto Fish (Pesce)',data:allKeys.map(k=>Math.round(fishMap[k]?.inn||0)),backgroundColor:'rgba(59,130,246,.5)',borderColor:'#3b82f6',borderWidth:1,borderRadius:3,order:2},
    {label:'Netto Actual (solo forn.)',data:allKeys.map(k=>Math.round(actMap[k]?.netto_forn||0)),backgroundColor:'rgba(16,185,129,.5)',borderColor:'#10b981',borderWidth:1,borderRadius:3,order:2},
    {label:'Netto Actual (tutto)',data:allKeys.map(k=>Math.round(actMap[k]?.netto_full||0)),type:'line',borderColor:'#b45309',backgroundColor:'rgba(180,83,9,.06)',borderWidth:2,pointRadius:3,pointBackgroundColor:'#b45309',fill:true,tension:.3,order:1}
  ]},options:bOpts()});
  if(ACT4)ACT4.destroy();
  const c4=document.getElementById('actMargChart');
  if(c4){ACT4=new Chart(c4,{type:'bar',data:{labels,datasets:[
    {label:'Marg% Fish (Pesce)',data:allKeys.map(k=>+(fishMap[k]?.mp_fish||0).toFixed(1)),backgroundColor:'rgba(59,130,246,.5)',borderColor:'#3b82f6',borderWidth:1,borderRadius:3,order:2},
    {label:'Marg% Actual (solo forn.)',data:allKeys.map(k=>+(actMap[k]?.mp_forn||0).toFixed(1)),backgroundColor:'rgba(16,185,129,.5)',borderColor:'#10b981',borderWidth:1,borderRadius:3,order:2},
    {label:'Marg% Actual (tutto)',data:allKeys.map(k=>+(actMap[k]?.mp_full||0).toFixed(1)),type:'line',borderColor:'#b45309',backgroundColor:'transparent',borderWidth:2,pointRadius:3,pointBackgroundColor:'#b45309',fill:false,tension:.3,order:1}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10}}},tooltip:{mode:'index',intersect:false,callbacks:{label:ctx=>ctx.dataset.label+': '+ctx.parsed.y.toFixed(1)+'%'}}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxRotation:55}},y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},callback:v=>v+'%'},min:0,max:80}}}});}
  if(ACT5)ACT5.destroy();
  const c5=document.getElementById('actSpeseChart');
  if(c5)ACT5=new Chart(c5,{type:'bar',data:{labels,datasets:[
    {label:'Benzina',data:allKeys.map(k=>Math.round(actMap[k]?.benzina||0)),backgroundColor:'rgba(239,68,68,.4)',borderColor:'#ef4444',borderWidth:1,borderRadius:3,stack:'s'},
    {label:'Altro',data:allKeys.map(k=>Math.round(actMap[k]?.altro||0)),backgroundColor:'rgba(156,163,175,.4)',borderColor:'#9ca3af',borderWidth:1,borderRadius:3,stack:'s'}
  ]},options:bOpts()});
  // Tabella
  const tbl=document.getElementById('actTable');
  if(tbl){
    // Helper: delta assoluto + % colorato
    const dAbs=v=>v===null?'-':(v>=0?'<span style="color:#10b981">+'+fmt(v,0,'\u20ac ')+'</span>':'<span style="color:#ef4444">'+fmt(v,0,'\u20ac ')+'</span>');
    const dPct=(cur,ref)=>{if(cur===null||ref===null||ref===0)return'';const p=(cur-ref)/Math.abs(ref)*100;return' <span style="font-size:9px;color:'+(p>=0?'#10b981':'#ef4444')+'">'+(p>=0?'+':'')+p.toFixed(1)+'%</span>';};
    const dCell=(cur,ref)=>cur===null&&ref===null?'-':dAbs(cur===null||ref===null?null:cur-ref)+dPct(cur,ref);
    // Delta invertito: verde se actual < fish (sconto = risparmio)
    const dCellInv=(cur,ref)=>{
      if(cur===null&&ref===null)return'-';
      const diff=cur===null||ref===null?null:cur-ref;
      const pct=diff!==null&&ref?diff/Math.abs(ref)*100:null;
      const color=diff===null?'#9ca3af':diff<=0?'#10b981':'#ef4444'; // invertito!
      const sign=diff!==null&&diff>=0?'+':'';
      return diff===null?'-':'<span style="color:'+color+'">'+sign+fmt(diff,0,'\u20ac ')+'</span>'+(pct!==null?' <span style="font-size:9px;color:'+color+'">'+sign+pct.toFixed(1)+'%</span>':'');
    };

    // Definizione colonne con tooltip
    const cols=[
      {h:'Periodo'},
      {h:'Incasso lordo (Pesce)'},
      {h:'Incasso lordo (Actual)'},
      {h:'\u0394 Incasso lordo'},
      {h:'Spesa pesce (Pesce)'},
      {h:'Spesa pesce (Actual)'},
      {h:'\u0394 Spesa fornitori'},
      {h:'Netto Fish (Pesce)'},
      {h:'Netto Fish (Actual)'},
      {h:'\u0394 Netto (forn.)'},
      {h:'Benzina'},
      {h:'Altro'},
      {h:'Netto Actual (tutto)'},
      {h:'\u0394 Netto (con extra)'},
      {h:'Marg% (Pesce)'},
      {h:'Marg% (Actual)'},
    ];

    const thStyle='padding:7px 9px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;white-space:nowrap;font-size:10px;cursor:default;position:sticky;top:0;background:#fff;z-index:1;';
    const thead='<thead><tr>'+cols.map(c=>'<th style="'+thStyle+'">'+c.h+'</th>').join('')+'</tr></thead>';

    // Commento contestuale per le celle delta
    function deltaComment(diff,type){
      if(diff===null)return'';
      if(type==='lordo'){
        if(diff>0)return'<div style="font-size:9px;color:#10b981;margin-top:1px;">\uD83D\uDCC8 Hai incassato pi\u00f9 del previsto!</div>';
        if(diff<0)return'<div style="font-size:9px;color:#ef4444;margin-top:1px;">\uD83D\uDCC9 Hai incassato meno del previsto</div>';
        return'';
      }
      if(type==='spesa'){
        if(diff<0)return'<div style="font-size:9px;color:#10b981;margin-top:1px;">\uD83D\uDCB0 Sconto fornitori, bravo!</div>';
        if(diff>100)return'<div style="font-size:9px;color:#ef4444;margin-top:1px;">\u26A0\uFE0F Hai pagato molto di pi\u00f9. Verifica se mancano entry nel file</div>';
        if(diff>0)return'<div style="font-size:9px;color:#f59e0b;margin-top:1px;">\uD83D\uDD0D Hai pagato un po\' di pi\u00f9 del previsto</div>';
        return'';
      }
      if(type==='netto'){
        if(diff>0)return'<div style="font-size:9px;color:#10b981;margin-top:1px;">\uD83C\uDFC6 Margini rispettati, ottimo!</div>';
        if(diff<-100)return'<div style="font-size:9px;color:#ef4444;margin-top:1px;">\uD83D\uDEA8 Margine reale molto sotto la stima. Verifica prezzi di vendita</div>';
        if(diff<0)return'<div style="font-size:9px;color:#f59e0b;margin-top:1px;">\uD83D\uDCC9 Margine leggermente sotto la stima</div>';
        return'';
      }
      return'';
    }

    const tbody='<tbody>'+allKeys.map(k=>{
      const f=fishMap[k],a=actMap[k];
      const onlyOne=!(f&&a);
      const lbl=(a||f).l;
      const il_f=f?.il??null, il_a=a?.entrata??null;
      const sp_f=f?.sp??null, sp_a=a?.forn_pesce??null;
      const nn_f=f?.inn??null, nn_a=a?.netto_forn??null;
      const benz=a?.benzina??null, altro=a?.altro??null;
      const netto_full=a?.netto_full??null;
      const mp_f=f?.mp_fish??null, mp_a=a?.mp_full??null;
      const fmtV=v=>v!==null?fmt(v,0,'\u20ac '):'-';
      const fmtPct=v=>v!==null?'<span style="color:'+mpColor(v)+'">'+v.toFixed(1)+'%</span>':'-';
      // Delta lordo (positivo = bene)
      const dLordo=il_f!==null&&il_a!==null?il_a-il_f:null;
      // Delta spesa (negativo = bene = sconto)
      const dSpesa=sp_f!==null&&sp_a!==null?sp_a-sp_f:null;
      // Delta netto (positivo = bene)
      const dNetto=nn_f!==null&&nn_a!==null?nn_a-nn_f:null;
      const dNettoExtra=nn_f!==null&&netto_full!==null?netto_full-nn_f:null;
      // Celle delta con commento
      const cellDelta=(diff,type,inv)=>{
        if(diff===null)return'-';
        const isGood=inv?(diff<=0):(diff>=0);
        const color=isGood?'#10b981':'#ef4444';
        const sign=diff>=0?'+':'';
        const pct=inv?(sp_f&&sp_f!==0?diff/Math.abs(sp_f)*100:null):(il_f&&il_f!==0?diff/Math.abs(il_f||nn_f||1)*100:null);
        const ref=type==='spesa'?sp_f:(type==='lordo'?il_f:nn_f);
        const pctVal=ref&&ref!==0?diff/Math.abs(ref)*100:null;
        return'<span style="color:'+color+';font-weight:600;">'+sign+fmt(diff,0,'\u20ac ')+'</span>'+
          (pctVal!==null?' <span style="font-size:9px;color:'+color+';">'+(pctVal>=0?'+':'')+pctVal.toFixed(1)+'%</span>':'')+
          deltaComment(diff,type);
      };
      return'<tr style="'+(onlyOne?'background:#fef9c3;':'')+'">'+ 
        '<td style="font-weight:600;">'+lbl+(onlyOne?' <span style="font-size:9px;color:#f59e0b;">(solo '+(f?'fish':'actual')+')</span>':'')+'</td>'+
        '<td>'+fmtV(il_f)+'</td>'+
        '<td>'+fmtV(il_a)+'</td>'+
        '<td>'+cellDelta(dLordo,'lordo',false)+'</td>'+
        '<td>'+fmtV(sp_f)+'</td>'+
        '<td>'+fmtV(sp_a)+'</td>'+
        '<td>'+cellDelta(dSpesa,'spesa',true)+'</td>'+
        '<td>'+fmtV(nn_f)+'</td>'+
        '<td>'+fmtV(nn_a)+'</td>'+
        '<td>'+cellDelta(dNetto,'netto',false)+'</td>'+
        '<td>'+(benz!==null&&benz>0?fmtV(benz):'-')+'</td>'+
        '<td>'+(altro!==null&&altro>0?fmtV(altro):'-')+'</td>'+
        '<td>'+fmtV(netto_full)+'</td>'+
        '<td>'+cellDelta(dNettoExtra,'netto',false)+'</td>'+
        '<td>'+fmtPct(mp_f)+'</td>'+
        '<td>'+fmtPct(mp_a)+'</td>'+
      '</tr>';
    }).join('')+'</tbody>';

    tbl.innerHTML=thead+tbody;
  }
}

// Caricamento Dataset 2
document.getElementById('csvIn2').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=ev=>{
    try{
      RAW2=buildFromCSV2(ev.target.result);
      if(!RAW2.length){document.getElementById('loadMsg2').textContent='Dataset Actual: nessuna riga valida.';return;}
      document.getElementById('loadMsg2').innerHTML='<span style="color:#166534;background:#f0fdf4;padding:2px 8px;border-radius:4px;">Dataset Actual caricato: '+RAW2.length+' righe</span>';
      populateActualFilters();
      renderActual();
    }catch(err){document.getElementById('loadMsg2').textContent='Errore Dataset Actual: '+err.message;}
  };
  rd.readAsText(f,'UTF-8');
});

// ============================================================
// RENDER: Pre/Post 10/02/2026 analysis
// ============================================================
let PP1=null,PP2=null,PP3=null,PP4=null,PP5=null;
const CUTOFF_PP=new Date(2026,1,10); // 10 Feb 2026
const DN_FULL=['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const DN_SHORT=['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const PE_COLORS={Grassano:'#3b82f6',Grottole:'#10b981',Brigante:'#f59e0b'};

function aggPrePost(rows){
  // Aggrega per pe+dn+slot, dividendo per GIORNATE (non per righe CSV)
  // Prima accumula per giornata, poi fa la media delle giornate
  // {pe: {dn: {pre: {days:{date:{il,inn,qv}}, totIl, totInn, totQv}, post: {...}}}}
  const res={};
  rows.forEach(r=>{
    const pe=r.pe;
    const dn=r.date.getDay();
    const isPre=r.date<CUTOFF_PP;
    const dayKey=r.date.toISOString().slice(0,10);
    if(!res[pe])res[pe]={};
    if(!res[pe][dn])res[pe][dn]={
      pre:{days:{},il:0,inn:0,qv:0},
      post:{days:{},il:0,inn:0,qv:0}
    };
    const slot=isPre?res[pe][dn].pre:res[pe][dn].post;
    if(!slot.days[dayKey])slot.days[dayKey]={il:0,inn:0,qv:0};
    slot.days[dayKey].il+=r.il;
    slot.days[dayKey].inn+=r.inn;
    slot.days[dayKey].qv+=r.qv;
    slot.il+=r.il;slot.inn+=r.inn;slot.qv+=r.qv;
  });
  // Aggiungi cnt = numero di giornate distinte
  Object.values(res).forEach(peObj=>{
    Object.values(peObj).forEach(dnObj=>{
      ['pre','post'].forEach(s=>{
        dnObj[s].cnt=Object.keys(dnObj[s].days).length;
      });
    });
  });
  return res;
}

function renderPrePost(){
  // Usa i dati filtrati dai dropdown (pescheria, fornitore, anno, mese, settimana, giorno)
  // ma NON dal cross-filter, così la sezione mostra sempre il contesto completo
  const allData=getData();
  const pp=aggPrePost(allData);
  const peList=Object.keys(pp).sort();
  const dnList=[1,2,3,4,5,6,0]; // Lun→Dom

  // ── Grafico 1 & 2: Revenue media per riga per giorno (pre / post) ──
  function makeRevChart(canvasId,slot,title){
    const ch=document.getElementById(canvasId);
    if(!ch)return null;
    const datasets=peList.map(pe=>({
      label:pe,
      data:dnList.map(dn=>{
        const v=pp[pe]&&pp[pe][dn]&&pp[pe][dn][slot];
        return v&&v.cnt>0?+(v.il/v.cnt).toFixed(0):null;
      }),
      backgroundColor:PE_COLORS[pe]||'#9ca3af',
      borderColor:PE_COLORS[pe]||'#9ca3af',
      borderWidth:1,borderRadius:3,
    }));
    return new Chart(ch,{type:'bar',data:{labels:dnList.map(d=>DN_SHORT[d]),datasets},
      options:{responsive:true,maintainAspectRatio:false,
        onClick(evt,els){
          if(!els.length){crossFilter=null;render();return;}
          const pe=peList[els[0].datasetIndex];
          if(crossFilter&&crossFilter.type==='pe'&&crossFilter.value===pe)crossFilter=null;
          else crossFilter={type:'pe',value:pe};
          render();
        },
        plugins:{legend:{position:'top',labels:{font:{size:10}}},
          tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': \u20ac'+ctx.parsed.y.toLocaleString('it-IT')}}},
        scales:{x:{grid:{display:false},ticks:{font:{size:10}}},
          y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},callback:v=>'\u20ac'+v}}}}});
  }
  if(PP1)PP1.destroy();if(PP2)PP2.destroy();
  PP1=makeRevChart('ppRevPre','pre');
  PP2=makeRevChart('ppRevPost','post');

  // ── Grafico 3 & 4: Margine % per giorno pre vs post per pescheria ──
  function makeMargChart(canvasId,pe){
    const ch=document.getElementById(canvasId);if(!ch)return null;
    const preData=dnList.map(dn=>{const v=pp[pe]&&pp[pe][dn]&&pp[pe][dn].pre;return v&&v.il>0?+(v.inn/v.il*100).toFixed(1):null;});
    const postData=dnList.map(dn=>{const v=pp[pe]&&pp[pe][dn]&&pp[pe][dn].post;return v&&v.il>0?+(v.inn/v.il*100).toFixed(1):null;});
    return new Chart(ch,{type:'bar',
      data:{labels:dnList.map(d=>DN_SHORT[d]),datasets:[
        {label:'Pre 10/02',data:preData,backgroundColor:'rgba(99,102,241,.5)',borderColor:'#6366f1',borderWidth:1,borderRadius:3},
        {label:'Post 10/02',data:postData,backgroundColor:'rgba(16,185,129,.5)',borderColor:'#10b981',borderWidth:1,borderRadius:3}
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        onClick(evt,els){
          if(!els.length){crossFilter=null;render();return;}
          if(crossFilter&&crossFilter.type==='pe'&&crossFilter.value===pe)crossFilter=null;
          else crossFilter={type:'pe',value:pe};
          render();
        },
        plugins:{legend:{position:'top',labels:{font:{size:10}}},
          tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+ctx.parsed.y.toFixed(1)+'%'}}},
        scales:{x:{grid:{display:false},ticks:{font:{size:10}}},
          y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},callback:v=>v+'%'},min:0,max:60}}}});
  }
  if(PP3)PP3.destroy();if(PP4)PP4.destroy();
  PP3=makeMargChart('ppMargGrassano','Grassano');
  PP4=makeMargChart('ppMargGrottole','Grottole');

  // ── Grafico 5: Scatter volume vs margine pre/post ──
  const scatterPts=[];
  peList.forEach(pe=>{
    dnList.forEach(dn=>{
      ['pre','post'].forEach(slot=>{
        const v=pp[pe]&&pp[pe][dn]&&pp[pe][dn][slot];
        if(!v||v.cnt===0)return;
        scatterPts.push({
          x:+(v.qv/v.cnt).toFixed(2),
          y:v.il>0?+(v.inn/v.il*100).toFixed(1):0,
          pe,dn,slot,
          label:pe+' '+DN_SHORT[dn]+' ('+slot+')',
          il:v.il,inn:v.inn,cnt:v.cnt
        });
      });
    });
  });
  // Raggruppa per pe+slot per dataset separati (pre=cerchio, post=triangolo)
  const scDatasets=[];
  peList.forEach(pe=>{
    ['pre','post'].forEach(slot=>{
      const pts=scatterPts.filter(p=>p.pe===pe&&p.slot===slot);
      if(!pts.length)return;
      scDatasets.push({
        label:pe+' '+(slot==='pre'?'Pre':'Post'),
        data:pts.map(p=>({x:p.x,y:p.y,label:p.label,il:p.il,inn:p.inn,cnt:p.cnt,dn:p.dn})),
        backgroundColor:(PE_COLORS[pe]||'#9ca3af')+(slot==='pre'?'99':'dd'),
        borderColor:PE_COLORS[pe]||'#9ca3af',
        borderWidth:slot==='pre'?1:2,
        pointStyle:slot==='pre'?'circle':'triangle',
        pointRadius:slot==='pre'?7:9,
      });
    });
  });
  const ppSc=document.getElementById('ppScatter');
  if(PP5)PP5.destroy();
  if(ppSc)PP5=new Chart(ppSc,{type:'scatter',data:{datasets:scDatasets},
    options:{responsive:true,maintainAspectRatio:false,
      onClick(evt,els){
        if(!els.length){crossFilter=null;render();return;}
        const pt=scatterPts.filter(p=>p.pe)[els[0].datasetIndex];
        const pe=scDatasets[els[0].datasetIndex].label.split(' ')[0];
        if(crossFilter&&crossFilter.type==='pe'&&crossFilter.value===pe)crossFilter=null;
        else crossFilter={type:'pe',value:pe};
        render();
      },
      plugins:{legend:{position:'top',labels:{font:{size:10},usePointStyle:true}},
        tooltip:{callbacks:{
          title:ctx=>ctx[0].raw.label,
          label:ctx=>[
            'Kg/giornata: '+ctx.raw.x.toFixed(1),
            'Margine: '+ctx.raw.y.toFixed(1)+'%',
            'Lordo medio: \u20ac'+(ctx.raw.il/ctx.raw.cnt).toFixed(0),
            'Netto medio: \u20ac'+(ctx.raw.inn/ctx.raw.cnt).toFixed(0),
            'Giornate: '+ctx.raw.cnt
          ]
        }}},
      scales:{
        x:{title:{display:true,text:'Kg venduti per riga',font:{size:10}},grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9}}},
        y:{title:{display:true,text:'Margine %',font:{size:10}},grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:9},callback:v=>v+'%'}}
      }}});

  // ── Tabella riepilogo ──
  const tbl=document.getElementById('ppTable');
  if(!tbl)return;
  const rows2=[];
  peList.forEach(pe=>{
    dnList.forEach(dn=>{
      const pre=pp[pe]&&pp[pe][dn]&&pp[pe][dn].pre;
      const post=pp[pe]&&pp[pe][dn]&&pp[pe][dn].post;
      if((!pre||pre.cnt===0)&&(!post||post.cnt===0))return;
      const mpPre=pre&&pre.il>0?pre.inn/pre.il*100:null;
      const mpPost=post&&post.il>0?post.inn/post.il*100:null;
      const dMp=mpPre!==null&&mpPost!==null?mpPost-mpPre:null;
      const dVol=pre&&post&&pre.cnt>0&&post.cnt>0?(post.qv/post.cnt)-(pre.qv/pre.cnt):null;
      rows2.push({pe,dn,pre,post,mpPre,mpPost,dMp,dVol});
    });
  });
  const mpDelta=v=>v===null?'-':(v>=0?'<span style="color:#10b981">+'+v.toFixed(1)+'%</span>':'<span style="color:#ef4444">'+v.toFixed(1)+'%</span>');
  const volDelta=v=>v===null?'-':(v>=0?'<span style="color:#10b981">+'+v.toFixed(1)+'kg</span>':'<span style="color:#ef4444">'+v.toFixed(1)+'kg</span>');
  tbl.innerHTML='<thead><tr>'+
    '<th>Pescheria</th><th>Giorno</th>'+
    '<th>Giornate Pre</th><th>Lordo/giornata Pre</th><th>Marg% Pre</th><th>Kg/giornata Pre</th>'+
    '<th>Giornate Post</th><th>Lordo/giornata Post</th><th>Marg% Post</th><th>Kg/giornata Post</th>'+
    '<th>Δ Marg%</th><th>Δ Kg/giornata</th>'+
    '</tr></thead><tbody>'+
    rows2.map(r=>'<tr>'+
      '<td style="font-weight:600;">'+r.pe+'</td>'+
      '<td>'+DN_FULL[r.dn]+'</td>'+
      '<td>'+(r.pre&&r.pre.cnt||'-')+'</td>'+
      '<td>'+(r.pre&&r.pre.cnt?'\u20ac'+(r.pre.il/r.pre.cnt).toFixed(0):'-')+'</td>'+
      '<td style="color:'+mpColor(r.mpPre||0)+';">'+(r.mpPre!==null?r.mpPre.toFixed(1)+'%':'-')+'</td>'+
      '<td>'+(r.pre&&r.pre.cnt?(r.pre.qv/r.pre.cnt).toFixed(1)+'kg':'-')+'</td>'+
      '<td>'+(r.post&&r.post.cnt||'-')+'</td>'+
      '<td>'+(r.post&&r.post.cnt?'\u20ac'+(r.post.il/r.post.cnt).toFixed(0):'-')+'</td>'+
      '<td style="color:'+mpColor(r.mpPost||0)+';">'+(r.mpPost!==null?r.mpPost.toFixed(1)+'%':'-')+'</td>'+
      '<td>'+(r.post&&r.post.cnt?(r.post.qv/r.post.cnt).toFixed(1)+'kg':'-')+'</td>'+
      '<td>'+mpDelta(r.dMp)+'</td>'+
      '<td>'+volDelta(r.dVol)+'</td>'+
    '</tr>').join('')+
    '</tbody>';
}

// ============================================================
// RENDER: main
// ============================================================
function render(){
  const allData=getData();
  const data=getFiltered(allData);
  const a=agg(data);
  renderKPIs(a);
  renderHighlights(a,data);
  renderWoW(allData);
  renderTrend(data);
  renderCats(data);
  renderFishBar(a);
  renderScatter(a);
  renderSuppliers(data);
  renderTable(a);
  renderRawTable(data);
  renderPrePost();
  if(RAW2.length)renderActual();
  const msg=document.getElementById('loadMsg');
  if(crossFilter){
    const labels={cat:'Categoria',fish:'Pesce',supplier:'Fornitore',trend:'Periodo',pe:'Pescheria'};
    const val=crossFilter.type==='trend'?crossFilter.label:crossFilter.value;
    msg.innerHTML='<span style="background:#fef3c7;padding:2px 8px;border-radius:4px;color:#92400e;font-weight:500;">Filtro attivo: '+labels[crossFilter.type]+' = '+val+' <span style="cursor:pointer;margin-left:6px;" id="clearCF">\u2715 rimuovi</span></span>';
    document.getElementById('clearCF').addEventListener('click',()=>{crossFilter=null;render();});
  } else if(RAW.length){msg.textContent='';}
}

// ============================================================
// GRANULARITY PILLS
// ============================================================
document.getElementById('pbg').addEventListener('click',e=>{
  const b=e.target.closest('[data-p]');if(!b)return;
  PER=b.dataset.p;
  document.querySelectorAll('.pill').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');render();
});

// ============================================================
// CSV LOADING
// ============================================================
function updateSubtitle(){
  if(!RAW.length)return;
  const ds=RAW.map(r=>r.date).sort((a,b)=>a-b);
  const from=ds[0],to=ds[ds.length-1];
  const f=d=>MN[d.getMonth()+1]+' '+d.getFullYear();
  document.getElementById('subtitle').textContent='KPI di vendita \u00b7 '+f(from)+' \u2013 '+f(to)+' \u00b7 '+RAW.length+' righe';
}
function loadData(text){
  try{
    RAW=buildFromCSV(text);
    if(!RAW.length){document.getElementById('loadMsg').textContent='CSV caricato ma nessuna riga valida.';return;}
    document.getElementById('loadMsg').textContent='';
    populateFilters();updateSubtitle();
    PER='mese';document.querySelectorAll('.pill').forEach(x=>x.classList.toggle('on',x.dataset.p==='mese'));
    crossFilter=null;tableSortCol=null;rawSortCol=null;
    render();
  }catch(err){document.getElementById('loadMsg').textContent='Errore CSV: '+err.message;}
}
document.getElementById('csvIn').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();rd.onload=ev=>loadData(ev.target.result);rd.readAsText(f,'UTF-8');
});
(function autoLoad(){
  const fname='Pescheria - Abasci\u00e0 Excel - Lavoro - Dataset Pesce.csv';
  document.getElementById('loadMsg').textContent='Caricamento CSV in corso...';
  fetch(encodeURIComponent(fname))
    .then(r=>{if(!r.ok)throw new Error(r.status);return r.text();})
    .then(loadData)
    .catch(()=>{
      document.getElementById('loadMsg').innerHTML='Caricamento automatico non disponibile \u2014 usa <b>\uD83D\uDCC2 Carica CSV</b> per selezionare il file.';
    });
  // Autoload Dataset 2
  const fname2='Pescheria - Abasci\u00e0 Excel - Lavoro - Entrate_Uscite.csv';
  fetch(encodeURIComponent(fname2))
    .then(r=>{if(!r.ok)throw new Error(r.status);return r.text();})
    .then(text=>{
      RAW2=buildFromCSV2(text);
      if(!RAW2.length)return;
      document.getElementById('loadMsg2').innerHTML='<span style="color:#166534;background:#f0fdf4;padding:2px 8px;border-radius:4px;">Dataset Actual caricato: '+RAW2.length+' righe</span>';
      const sec=document.getElementById('actualSection');
      if(sec)sec.style.display='';
      populateActualFilters();
    })
    .catch(()=>{}); // silenzioso se non trovato, si usa il bottone manuale
})();
