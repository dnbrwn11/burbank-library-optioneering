/* ════════════════════════════════════
   CONSTANTS
════════════════════════════════════ */
const CAT_ORDER=['Building Systems','Public Spaces','Children & Teen','Special Facilities','Staff & Operations','Support Spaces','Parking Structure','Site Work & Landscape'];
const CAT_COLORS={
  'Building Systems':'#4A7B9D',
  'Public Spaces':'#006330','Children & Teen':'#3D8B37',
  'Special Facilities':'#2060CE','Staff & Operations':'#006330',
  'Support Spaces':'#3D8B37','Parking Structure':'#8B3DB8',
  'Site Work & Landscape':'#6D6D6D'
};
const TARGET_GMP=163113199,TARGET_GSF=97500;
const PCL_BASELINE_PSF=1267;
const CONTINGENCY_BASE=94945200;
const PCL_ESCALATION=11061116;
const PCL_CONTINGENCY=7595616;
const PCL_GCOHP=35681012;
const LIBRARY_BSYS_TOTAL=28943369; // Div 03,04,05,07,08-curtain,14 — excluded from program table
const CONTINGENCY_RATE=0.1715; // combined C&E / directCosts — for chart display
const GCOHP_RATE=0.28;
const ESC_OFFSETS={'Q1 2027':9,'Q2 2027':12,'Q3 2027':15,'Q4 2027':18,'Q1 2028':21,'Q2 2028':24};

/* ════════════════════════════════════
   DIVISION RATES & MULTIPLIERS
════════════════════════════════════ */
const DIV_RATES={d06:16.05,d08:20.11,d09:123.71,d10:10.06,d11:8.91,d12:71.88,d21:9.00,d22:36.60,d23:72.18,d26:149.47};
const DIV_NAMES={
  d06:'Div 06  Wood & Millwork',d08:'Div 08  Doors & Hardware',
  d09:'Div 09  Finishes',d10:'Div 10  Specialties',
  d11:'Div 11  Equipment',d12:'Div 12  Furnishings',
  d21:'Div 21  Fire Suppression',d22:'Div 22  Plumbing',
  d23:'Div 23  HVAC',d26:'Div 26  Electrical & Low Voltage'
};
const SPACE_MULTIPLIERS={
  'Adult Reading Room':          {d06:1,d08:1,d09:1,d10:1,d11:1,d12:1,d21:1,d22:1,d23:1,d26:1},
  'Digital Media Lab':           {d06:1,d08:1,d09:1,d10:1,d11:3.0,d12:1.3,d21:1,d22:1,d23:1,d26:1.4},
  'Makerspace':                  {d06:1,d08:1,d09:1,d10:1,d11:2.0,d12:1,d21:1,d22:1.3,d23:1.3,d26:1.4},
  'Podcast/Recording Studios':   {d06:2.0,d08:1,d09:2.5,d10:1,d11:1,d12:1,d21:1,d22:1,d23:1.8,d26:1.6},
  'Café':                        {d06:1,d08:1,d09:1.5,d10:1,d11:8.0,d12:1.5,d21:1,d22:2.0,d23:2.0,d26:1.5},
  'Rooftop Terrace':             {d06:0.3,d08:1,d09:0.4,d10:0.5,d11:0.2,d12:0.3,d21:0.5,d22:0.3,d23:0.3,d26:0.4},
  "Children's Library":          {d06:1,d08:1,d09:1,d10:1,d11:1.3,d12:1.2,d21:1,d22:1,d23:1,d26:1},
  'Teen Zone':                   {d06:1,d08:1,d09:1,d10:1,d11:1.5,d12:1.1,d21:1,d22:1,d23:1,d26:1},
  'Performing Arts Theater':     {d06:1,d08:1,d09:1.5,d10:2.0,d11:4.0,d12:1.2,d21:1.5,d22:1.3,d23:2.0,d26:2.0},
  'Community Meeting Room Large':{d06:1,d08:1,d09:1,d10:1,d11:1,d12:1,d21:1,d22:1,d23:1,d26:1},
  'Community Meeting Room Small':{d06:1,d08:1,d09:1,d10:1,d11:1,d12:1,d21:1,d22:1,d23:1,d26:1},
  'City Offices':                {d06:1,d08:1,d09:0.9,d10:1,d11:1,d12:0.9,d21:1,d22:1,d23:0.9,d26:1},
  'Staff Workroom':              {d06:1,d08:1,d09:0.8,d10:1,d11:0.5,d12:0.7,d21:1,d22:1,d23:1,d26:1},
  'Collections/Stacks':          {d06:1,d08:1,d09:0.6,d10:1,d11:0.3,d12:0.5,d21:1,d22:1,d23:0.8,d26:1},
  'Restrooms':                   {d06:1,d08:1,d09:1.5,d10:1.5,d11:1,d12:1,d21:1,d22:2.5,d23:1,d26:1},
  'Mechanical/Electrical Room':  {d06:0.5,d08:0.5,d09:0.3,d10:0.5,d11:0.5,d12:0.1,d21:0.5,d22:0.5,d23:1.5,d26:1.5},
  'Vertical Circulation/Lobbies':{d06:1,d08:1,d09:1.4,d10:1.3,d11:1,d12:0.8,d21:1,d22:1,d23:1,d26:1.2}
};

function calcDivPsf(mults){
  return Object.entries(DIV_RATES).reduce((s,[d,r])=>s+r*(mults[d]??1),0);
}

/* Compute scaling factor to hit $50,501,831 program spaces target */
const _PROG_DEFS=[
  {n:'Adult Reading Room',q:1,u:8000},{n:'Digital Media Lab',q:1,u:1800},
  {n:'Makerspace',q:1,u:2500},{n:'Podcast/Recording Studios',q:3,u:200},
  {n:'Café',q:1,u:1500},{n:'Rooftop Terrace',q:1,u:3000},
  {n:"Children's Library",q:1,u:6500},{n:'Teen Zone',q:1,u:2500},
  {n:'Performing Arts Theater',q:1,u:5500},
  {n:'Community Meeting Room Large',q:2,u:1200},
  {n:'Community Meeting Room Small',q:4,u:400},
  {n:'City Offices',q:1,u:10000},{n:'Staff Workroom',q:1,u:1800},
  {n:'Collections/Stacks',q:1,u:5000},{n:'Restrooms',q:1,u:2200},
  {n:'Mechanical/Electrical Room',q:1,u:3800},
  {n:'Vertical Circulation/Lobbies',q:1,u:4000}
];
const _rawProgTotal=_PROG_DEFS.reduce((s,d)=>s+d.q*d.u*calcDivPsf(SPACE_MULTIPLIERS[d.n]||{}),0);
const PROGRAM_SCALING_FACTOR=50501831/_rawProgTotal;

function buildDivLineItems(sid,spaceName,totalSF){
  const mults=SPACE_MULTIPLIERS[spaceName]||{};
  return Object.entries(DIV_RATES).map(([d,rate])=>{
    const m=mults[d]??1;
    const scaledRate=parseFloat((rate*m*PROGRAM_SCALING_FACTOR).toFixed(4));
    return {id:sid+'_'+d,name:DIV_NAMES[d],qty:totalSF,unitType:'/SF',
            unitCost:scaledRate,notes:m!==1?m+'× mult':''};
  }).filter(item=>item.unitCost>0.0001);
}

/* ════════════════════════════════════
   BASELINE DATA
════════════════════════════════════ */
const BASELINE=(()=>{
  const spaces=[
    // PUBLIC SPACES
    {id:'s1',category:'Public Spaces',name:'Adult Reading Room',qty:1,unitSF:8000,costType:'persf',notes:'Main stacks + reading area'},
    {id:'s2',category:'Public Spaces',name:'Digital Media Lab',qty:1,unitSF:1800,costType:'persf',notes:'Computers, editing bays'},
    {id:'s3',category:'Public Spaces',name:'Makerspace',qty:1,unitSF:2500,costType:'persf',notes:'Fab tools, 3D printing'},
    {id:'s4',category:'Public Spaces',name:'Podcast/Recording Studios',qty:3,unitSF:200,costType:'persf',notes:'Soundproofed'},
    {id:'s5',category:'Public Spaces',name:'Café',qty:1,unitSF:1500,costType:'persf',notes:'Public-facing F&B'},
    {id:'s6',category:'Public Spaces',name:'Rooftop Terrace',qty:1,unitSF:3000,costType:'persf',notes:'Outdoor amenity'},
    // CHILDREN & TEEN
    {id:'s7',category:'Children & Teen',name:"Children's Library",qty:1,unitSF:6500,costType:'persf',notes:'0–12 programming area'},
    {id:'s8',category:'Children & Teen',name:'Teen Zone',qty:1,unitSF:2500,costType:'persf',notes:'13–18 YA + digital'},
    // SPECIAL FACILITIES
    {id:'s9',category:'Special Facilities',name:'Performing Arts Theater',qty:1,unitSF:5500,costType:'persf',notes:'300-seat proscenium'},
    {id:'s10',category:'Special Facilities',name:'Community Meeting Room Large',qty:2,unitSF:1200,costType:'persf',notes:'Divisible, AV ready'},
    {id:'s11',category:'Special Facilities',name:'Community Meeting Room Small',qty:4,unitSF:400,costType:'persf',notes:'8–12 person'},
    // STAFF & OPERATIONS
    {id:'s12',category:'Staff & Operations',name:'City Offices',qty:1,unitSF:10000,costType:'persf',notes:'Co-located city services'},
    {id:'s13',category:'Staff & Operations',name:'Staff Workroom',qty:1,unitSF:1800,costType:'persf',notes:'Processing + staff support'},
    {id:'s14',category:'Staff & Operations',name:'Collections/Stacks',qty:1,unitSF:5000,costType:'persf',notes:'Compact shelving ready'},
    // SUPPORT SPACES
    {id:'s16',category:'Support Spaces',name:'Restrooms',qty:1,unitSF:2200,costType:'persf',notes:'Public + ADA'},
    {id:'s17',category:'Support Spaces',name:'Mechanical/Electrical Room',qty:1,unitSF:3800,costType:'persf',notes:'MEP rooms'},
    {id:'s18',category:'Support Spaces',name:'Vertical Circulation/Lobbies',qty:1,unitSF:4000,costType:'persf',notes:'Stairs, elevators, entry'},
    // PARKING STRUCTURE
    {id:'s15',category:'Parking Structure',name:'310-Stall Parking Garage',qty:310,unitSF:300,unitCostMid:50000,costType:'perstall',notes:'PCL Cost Model BE26-52-0187 · $50,000/stall · structured concrete'},
    // SITE WORK & LANDSCAPE
    {id:'s19',category:'Site Work & Landscape',name:'Div 02 Existing Conditions',qty:1,unitSF:0,unitCostMid:1264375,costType:'lumpsum',notes:'PCL Cost Model · $421,458/AC × 3 AC'},
    {id:'s20',category:'Site Work & Landscape',name:'Div 31 Earthwork',qty:1,unitSF:0,unitCostMid:1252994,costType:'lumpsum',notes:'PCL Cost Model · $417,665/AC × 3 AC'},
    {id:'s21',category:'Site Work & Landscape',name:'Div 32 Exterior Improvements',qty:1,unitSF:0,unitCostMid:8827500,costType:'lumpsum',notes:'PCL Cost Model · $2,942,500/AC × 3 AC'},
    {id:'s22',category:'Site Work & Landscape',name:'Div 33 Utilities',qty:1,unitSF:0,unitCostMid:2485386,costType:'lumpsum',notes:'PCL Cost Model · $828,462/AC × 3 AC'}
  ];
  spaces.forEach(s=>{
    if(s.costType==='persf'){
      const mults=SPACE_MULTIPLIERS[s.name]||{};
      s.unitCostMid=parseFloat((calcDivPsf(mults)*PROGRAM_SCALING_FACTOR).toFixed(2));
    }
  });
  return spaces;
})();

/* ════════════════════════════════════
   BUILDING SYSTEMS (reference panel)
   Source: PCL Cost Model BE26-52-0187
════════════════════════════════════ */
const BUILDING_SYSTEMS=[
  {id:'bs1',div:'03',name:'Div 03 Concrete Structure',gsf:97500,psf:99.21,total:9672975,pct:31.71,
   note:'Concrete Structure — per PCL Cost Model',
   subs:[{id:'bs1a',div:'03',name:'Concrete Structure',gsf:97500,psf:99.21,total:9672975}]},
  {id:'bs2',div:'04',name:'Div 04 Masonry',gsf:97500,psf:3.92,total:382200,pct:1.25,
   note:'Masonry — per PCL Cost Model',
   subs:[{id:'bs2a',div:'04',name:'Masonry',gsf:97500,psf:3.92,total:382200}]},
  {id:'bs3',div:'05',name:'Div 05 Metals & Structural Steel',gsf:97500,psf:63.30,total:6171750,pct:20.23,
   note:'Metals — per PCL Cost Model',
   subs:[{id:'bs3a',div:'05',name:'Metals',gsf:97500,psf:63.30,total:6171750}]},
  {id:'bs4',div:'06',name:'Div 06 Wood, Plastics & Composites',gsf:97500,psf:16.05,total:1564875,pct:5.13,
   note:'Rough & Finish Carpentry — per PCL Cost Model',
   subs:[
     {id:'bs4a',div:'06',name:'Rough Carpentry',gsf:97500,psf:1.85,total:180375},
     {id:'bs4b',div:'06',name:'Finish Carpentry',gsf:97500,psf:14.20,total:1384500}
   ]},
  {id:'bs5',div:'07',name:'Div 07 Thermal & Moisture Protection',gsf:97500,psf:34.00,total:3315000,pct:10.87,
   note:'Roofing, waterproofing, insulation — per PCL Cost Model',
   subs:[{id:'bs5a',div:'07',name:'Thermal & Moisture Protection',gsf:97500,psf:34.00,total:3315000}]},
  {id:'bs6',div:'08',name:'Div 08 Curtain Wall & Glazing',gsf:97500,psf:60.32,total:5881444,pct:19.28,
   note:'Curtain wall & storefront glazing only (75% of Div 08) — per PCL Cost Model',
   subs:[{id:'bs6a',div:'08',name:'Curtain Wall & Storefront Glazing',gsf:97500,psf:60.32,total:5881444}]},
  {id:'bs7',div:'14',name:'Div 14 Conveying Equipment',gsf:97500,psf:36.10,total:3520000,pct:11.54,
   note:'Elevators and escalators — per PCL Cost Model',
   subs:[
     {id:'bs7a',div:'14',name:'Elevators — 8 Stop',qty:8,unitType:'EA',unitCost:65000,total:520000},
     {id:'bs7b',div:'14',name:'Escalators',qty:4,unitType:'EA',unitCost:750000,total:3000000}
   ]}
];

const BENCHMARKS={
  'Adult Reading Room':[8000,16000],'Digital Media Lab':[1500,3500],'Makerspace':[2000,4500],
  'Podcast/Recording Studios':[200,500],'Café':[1500,3000],'Rooftop Terrace':[2000,6000],
  "Children's Library":[6000,12000],'Teen Zone':[1800,4500],'Performing Arts Theater':[6000,12000],
  'Community Meeting Room Large':[1200,2500],'Community Meeting Room Small':[400,900],
  'City Offices':[10000,20000],'Staff Workroom':[1800,3000],'Collections/Stacks':[4000,9000],
  'Restrooms':[2000,4000],'Mechanical/Electrical Room':[2500,4500],'Vertical Circulation/Lobbies':[3000,6000]
};

const INITIAL_ADJ={
  's7-s16':'must','s16-s7':'must','s8-s2':'must','s2-s8':'must',
  's5-s6':'must','s6-s5':'must','s9-s10':'should','s10-s9':'should',
  's13-s14':'must','s14-s13':'must','s15-s18':'should','s18-s15':'should',
  's7-s9':'separate','s9-s7':'separate'
};

/* ════════════════════════════════════
   STATE
════════════════════════════════════ */
let program=[],changelog=[],scenarios={},adjMatrix={};
let currentScenario='Baseline — Full Program';
let preview=null,dragSrcId=null,narrativeText='';
let drawerOpen=false,divChartDone=false;
let charts={};
let chartUpdateTimeout=null;
let adjEditMode=false;
let lineItems={},expandedSpaces=new Set();
let bsEditMode=false,bsEdits={},bsExpanded=new Set();
let chipHideTimeout=null;
/* Budget stack state */
let targetBudget=155000000;
let escalationLump=PCL_ESCALATION;   // 11.65% × CONTINGENCY_BASE
let contingencyLump=PCL_CONTINGENCY; // 8.00% × CONTINGENCY_BASE
let gcLump=PCL_GCOHP;

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
function init(){
  const saved=localStorage.getItem('pcl_prog');
  if(saved){try{program=JSON.parse(saved)}catch{program=cloneBase()}}else{program=cloneBase()}
  const savedSc=localStorage.getItem('pcl_scenarios');
  if(savedSc){try{scenarios=JSON.parse(savedSc)}catch{scenarios={}}}
  const savedAssm=localStorage.getItem('pcl_assumptions');
  if(savedAssm){const el=document.getElementById('assumptions-text');if(el)el.value=savedAssm}
  const savedAdj=localStorage.getItem('pcl_adj_matrix');
  if(savedAdj){try{adjMatrix=JSON.parse(savedAdj)}catch{adjMatrix=Object.assign({},INITIAL_ADJ)}}
  else{adjMatrix=Object.assign({},INITIAL_ADJ)}
  adjEditMode=localStorage.getItem('pcl_adj_edit')==='1';
  const savedLI=localStorage.getItem('pcl_li');
  if(savedLI){try{lineItems=JSON.parse(savedLI)}catch{}}
  /* Populate division line items for program spaces if not yet stored */
  let liDirty=false;
  program.filter(s=>s.costType==='persf').forEach(s=>{
    if(!lineItems[s.id]){
      const totalSF=(s.qty||1)*(s.unitSF||0);
      lineItems[s.id]=buildDivLineItems(s.id,s.name,totalSF);
      liDirty=true;
    }
  });
  if(liDirty)saveL2();
  const savedExp=localStorage.getItem('pcl_exp');
  if(savedExp){try{expandedSpaces=new Set(JSON.parse(savedExp))}catch{}}
  bsEditMode=localStorage.getItem('pcl_bs_edit')==='1';
  const savedBSE=localStorage.getItem('pcl_bs_edits');
  if(savedBSE){try{bsEdits=JSON.parse(savedBSE)}catch{}}
  const savedBSX=localStorage.getItem('pcl_bsexp');
  if(savedBSX){try{bsExpanded=new Set(JSON.parse(savedBSX))}catch{}}
  currentScenario=localStorage.getItem('pcl_cur_sc')||'Baseline — Full Program';
  const savedTB=localStorage.getItem('pcl_target_budget');
  if(savedTB)targetBudget=parseFloat(savedTB)||155000000;
  const savedEL=localStorage.getItem('pcl_esc_lump');
  if(savedEL)escalationLump=parseFloat(savedEL)||PCL_ESCALATION;
  const savedCL=localStorage.getItem('pcl_cont_lump');
  if(savedCL)contingencyLump=parseFloat(savedCL)||PCL_CONTINGENCY;
  const savedGC=localStorage.getItem('pcl_gc_lump');
  if(savedGC)gcLump=parseFloat(savedGC)||PCL_GCOHP;
  /* Restore target budget input */
  const tbInp=document.getElementById('bb-target-inp');
  if(tbInp)tbInp.value='$'+Math.round(targetBudget).toLocaleString('en-US');
  if(localStorage.getItem('pcl_target_edited')==='1'){const sub=document.getElementById('bb-target-sub');if(sub)sub.style.display='none';}
  const gcInp=document.getElementById('bb-gc-inp');
  if(gcInp)gcInp.value='$'+Math.round(gcLump).toLocaleString('en-US');
  if(!scenarios['Baseline — Full Program']){
    scenarios['Baseline — Full Program']={program:cloneBase(),ts:new Date().toISOString(),baseline:true};
    saveSc();
  }
  if(localStorage.getItem('pcl_drawer')==='1'){drawerOpen=true;openDrawer()}
  if(localStorage.getItem('pcl_banner')!=='1'&&window.innerWidth<=767){
    document.getElementById('mob-banner').style.display='flex';
  }
  setupChips();setupDragDrop();
  logChange('sys','','Baseline loaded — PCL Cost Model BE26-52-0187');
  if(typeof Chart!=='undefined'){
    Chart.defaults.font.family="'Barlow', sans-serif";
    Chart.defaults.font.size=11;
    Chart.defaults.color='#6D6D6D';
  }
  renderAll();
  updateEscalation();
  /* Cost model verification */
  setTimeout(()=>{
    const progTotal=program.filter(s=>s.costType==='persf').reduce((sum,s)=>sum+calcSpaceCost(s),0);
    const parkTotal=program.filter(s=>s.costType==='perstall').reduce((sum,s)=>sum+calcSpaceCost(s),0);
    const siteTotal=program.filter(s=>s.costType==='lumpsum').reduce((sum,s)=>sum+calcSpaceCost(s),0);
    const directTotal=LIBRARY_BSYS_TOTAL+progTotal+parkTotal+siteTotal;
    const totalBudgetCalc=directTotal+escalationLump+contingencyLump+gcLump;
    console.log('Program spaces total:',Math.round(progTotal));
    console.log('Target:',50501831);
    console.log('Delta:',Math.round(progTotal-50501831));
    console.log('=== COST MODEL VERIFICATION ===');
    console.log('Program spaces:',Math.round(progTotal));
    console.log('Parking:',Math.round(parkTotal));
    console.log('Site work:',Math.round(siteTotal));
    console.log('Direct costs:',Math.round(directTotal));
    console.log('Escalation:',Math.round(escalationLump));
    console.log('Contingency:',Math.round(contingencyLump));
    console.log('GC/GR/OHP:',Math.round(gcLump));
    console.log('TOTAL BUDGET:',Math.round(totalBudgetCalc));
    console.log('TARGET:',163113199);
    console.log('DELTA:',Math.round(totalBudgetCalc-163113199));
    console.log('================================');
  },500);
}
function cloneBase(){
  /* Re-run baseline build to get fresh scaled values */
  const base=JSON.parse(JSON.stringify(BASELINE));
  return base;
}
function saveState(){localStorage.setItem('pcl_prog',JSON.stringify(program));localStorage.setItem('pcl_cur_sc',currentScenario)}
function saveSc(){localStorage.setItem('pcl_scenarios',JSON.stringify(scenarios))}
function saveAssumptions(){
  const el=document.getElementById('assumptions-text');
  if(el)localStorage.setItem('pcl_assumptions',el.value);
}

/* ════════════════════════════════════
   HELPERS
════════════════════════════════════ */
function fmt$(n){return '$'+Math.round(n||0).toLocaleString('en-US')}
function fmtSF(n){return Math.round(n||0).toLocaleString('en-US')+' SF'}
function fmtM(n){const m=Math.round((n||0)/1e6);return'$'+m+'M'}
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function uid(){return 'u'+Date.now()+Math.random().toString(36).slice(2,6)}
function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v}

/* ════════════════════════════════════
   RENDER ALL
════════════════════════════════════ */
function renderAll(){
  renderTable();updateBudget();updateGTN();updateEscalation();renderLog();
  renderScenarios();
  if(document.getElementById('tab-adj').classList.contains('active'))renderAdj();
  renderBuildingSystems();
  scheduleChartUpdate();
}

/* ════════════════════════════════════
   CHANGE LOG
════════════════════════════════════ */
function logChange(op,name,detail){
  changelog.push({ts:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),op,name,detail});
  renderLog();
}
function renderLog(){
  const body=document.getElementById('log-body');if(!body)return;
  body.innerHTML='';
  [...changelog].reverse().forEach(e=>{
    const div=document.createElement('div');div.className='log-entry';
    div.innerHTML=`<span class="log-ts">${escHtml(e.ts)}</span><span class="log-op ${e.op}">${e.op.toUpperCase()}</span><span>${escHtml(e.name?e.name+' — ':'')+escHtml(e.detail)}</span>`;
    body.appendChild(div);
  });
}

/* BOOT */
document.addEventListener('DOMContentLoaded',init);
