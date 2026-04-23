/* ════════════════════════════════════
   CONSTANTS
════════════════════════════════════ */
const CAT_ORDER=['Public Spaces','Children & Teen','Special Facilities','Staff & Operations','Parking & Circulation','Support Spaces','Site Work'];
const CAT_COLORS={
  'Public Spaces':'#006330','Children & Teen':'#3D8B37',
  'Special Facilities':'#FFDF1B','Staff & Operations':'#006330',
  'Parking & Circulation':'#6D6D6D','Support Spaces':'#3D8B37','Site Work':'#6D6D6D'
};
const TARGET_GMP=163113199,TARGET_GSF=97500;
const PCL_BASELINE_PSF=1267;
const CONTINGENCY_RATE=0.1715; // PCL Cost Model BE26-52-0187
const GCOHP_RATE=0.28;
const PCL_CONTINGENCY=18656732; // locked — BE26-52-0187
const PCL_GCOHP=35681012;       // locked — BE26-52-0187
const ESC_OFFSETS={'Q1 2027':9,'Q2 2027':12,'Q3 2027':15,'Q4 2027':18,'Q1 2028':21,'Q2 2028':24};
const BENCHMARKS={
  'Adult Reading Room':[8000,16000],'Digital Media Lab':[1500,3500],'Makerspace':[2000,4500],
  'Podcast/Recording Studios':[200,500],'Café':[1500,3000],'Rooftop Terrace':[2000,6000],
  "Children's Library":[6000,12000],'Teen Zone':[1800,4500],'Performing Arts Theater':[6000,12000],
  'Community Meeting Room Large':[1200,2500],'Community Meeting Room Small':[400,900],
  'City Offices':[10000,20000],'Staff Workroom':[1800,3000],'Collections/Stacks':[4000,9000],
  'Restrooms':[2000,4000],'Mechanical/Electrical':[2500,4500],'Vertical Circulation/Lobbies':[3000,6000]
};

/* ════════════════════════════════════
   BASELINE DATA
════════════════════════════════════ */
const BASELINE=[
  // PUBLIC SPACES
  {id:'s1',category:'Public Spaces',name:'Adult Reading Room',qty:1,unitSF:8000,unitCostMid:1100,costType:'persf',notes:'Main stacks + reading area'},
  {id:'s2',category:'Public Spaces',name:'Digital Media Lab',qty:1,unitSF:1800,unitCostMid:1150,costType:'persf',notes:'Computers, editing bays'},
  {id:'s3',category:'Public Spaces',name:'Makerspace',qty:1,unitSF:2500,unitCostMid:1100,costType:'persf',notes:'Fab tools, 3D printing'},
  {id:'s4',category:'Public Spaces',name:'Podcast/Recording Studios',qty:3,unitSF:200,unitCostMid:1050,costType:'persf',notes:'Soundproofed'},
  {id:'s5',category:'Public Spaces',name:'Café',qty:1,unitSF:1500,unitCostMid:950,costType:'persf',notes:'Public-facing F&B'},
  {id:'s6',category:'Public Spaces',name:'Rooftop Terrace',qty:1,unitSF:3000,unitCostMid:480,costType:'persf',notes:'Outdoor amenity'},
  // CHILDREN & TEEN
  {id:'s7',category:'Children & Teen',name:"Children's Library",qty:1,unitSF:6500,unitCostMid:1100,costType:'persf',notes:'0–12 programming area'},
  {id:'s8',category:'Children & Teen',name:'Teen Zone',qty:1,unitSF:2500,unitCostMid:1080,costType:'persf',notes:'13–18 YA + digital'},
  // SPECIAL FACILITIES
  {id:'s9',category:'Special Facilities',name:'Performing Arts Theater',qty:1,unitSF:5500,unitCostMid:1150,costType:'persf',notes:'300-seat proscenium'},
  {id:'s10',category:'Special Facilities',name:'Community Meeting Room Large',qty:2,unitSF:1200,unitCostMid:1080,costType:'persf',notes:'Divisible, AV ready'},
  {id:'s11',category:'Special Facilities',name:'Community Meeting Room Small',qty:4,unitSF:400,unitCostMid:1050,costType:'persf',notes:'8–12 person'},
  // STAFF & OPERATIONS
  {id:'s12',category:'Staff & Operations',name:'City Offices',qty:1,unitSF:10000,unitCostMid:950,costType:'persf',notes:'Co-located city services'},
  {id:'s13',category:'Staff & Operations',name:'Staff Workroom',qty:1,unitSF:1800,unitCostMid:920,costType:'persf',notes:'Processing + staff support'},
  {id:'s14',category:'Staff & Operations',name:'Collections/Stacks',qty:1,unitSF:5000,unitCostMid:850,costType:'persf',notes:'Compact shelving ready'},
  // PARKING & CIRCULATION
  {id:'s15',category:'Parking & Circulation',name:'Parking Structure — 310 Stalls',qty:310,unitSF:300,unitCostMid:50000,costType:'perstall',notes:'PCL Cost Model Apr 2026 — $50,000/stall'},
  // SUPPORT SPACES
  {id:'s16',category:'Support Spaces',name:'Restrooms',qty:1,unitSF:2200,unitCostMid:1000,costType:'persf',notes:'Public + ADA'},
  {id:'s17',category:'Support Spaces',name:'Mechanical/Electrical',qty:1,unitSF:3800,unitCostMid:580,costType:'persf',notes:'MEP rooms'},
  {id:'s18',category:'Support Spaces',name:'Vertical Circulation/Lobbies',qty:1,unitSF:4000,unitCostMid:880,costType:'persf',notes:'Stairs, elevators, entry'},
  {id:'s23',category:'Support Spaces',name:'Building Systems & Structure',qty:1,unitSF:0,unitCostMid:18553200,costType:'lumpsum',notes:'Structure, envelope, MEP, conveying — per PCL Cost Model BE26-52-0187 Div 03-26'},
  // SITE WORK
  {id:'s19',category:'Site Work',name:'Existing Conditions/Demo',qty:1,unitSF:0,unitCostMid:1264375,costType:'lumpsum',notes:'PCL Cost Model Apr 2026'},
  {id:'s20',category:'Site Work',name:'Earthwork',qty:1,unitSF:0,unitCostMid:1252994,costType:'lumpsum',notes:'PCL Cost Model Apr 2026'},
  {id:'s21',category:'Site Work',name:'Exterior Improvements/Plaza',qty:1,unitSF:0,unitCostMid:8827500,costType:'lumpsum',notes:'PCL Cost Model Apr 2026'},
  {id:'s22',category:'Site Work',name:'Utilities',qty:1,unitSF:0,unitCostMid:2485386,costType:'lumpsum',notes:'PCL Cost Model Apr 2026'}
];
const INITIAL_ADJ={
  's7-s16':'must','s16-s7':'must','s8-s2':'must','s2-s8':'must',
  's5-s6':'must','s6-s5':'must','s9-s10':'should','s10-s9':'should',
  's13-s14':'must','s14-s13':'must','s15-s18':'should','s18-s15':'should',
  's7-s9':'separate','s9-s7':'separate'
};
const BUILDING_SYSTEMS=[
  {id:'bs1',div:'03+05',name:'Structure',gsf:97500,psf:162.51,total:15844725,pct:19.94,note:'Concrete frame, steel, structural steel',
   subs:[{id:'bs1a',div:'03',name:'Div 03 Concrete',gsf:97500,psf:99.21,total:9672975},{id:'bs1b',div:'05',name:'Div 05 Metals',gsf:97500,psf:63.30,total:6171750}]},
  {id:'bs2',div:'07+08',name:'Envelope',gsf:97500,psf:114.43,total:11156925,pct:14.04,note:'Curtain wall, glazing, roofing, waterproofing',
   subs:[{id:'bs2a',div:'07',name:'Div 07 Thermal & Moisture',gsf:97500,psf:34.00,total:3315000},{id:'bs2b',div:'08',name:'Div 08 Openings/Curtain Wall',gsf:97500,psf:80.43,total:7841925}]},
  {id:'bs3',div:'09',name:'Finishes',gsf:97500,psf:123.71,total:12061725,pct:15.18,note:'Flooring, ceilings, painting, tile — all spaces',
   subs:[{id:'bs3a',div:'09',name:'Div 09 Finishes',gsf:97500,psf:123.71,total:12061725}]},
  {id:'bs4',div:'12',name:'Furnishings',gsf:97500,psf:71.88,total:7008300,pct:8.82,note:'FF&E — furniture, fixtures, equipment',
   subs:[{id:'bs4a',div:'12',name:'Div 12 Furnishings',gsf:97500,psf:71.88,total:7008300}]},
  {id:'bs5',div:'21+22+23+26',name:'MEP & Fire Protection',gsf:97500,psf:267.25,total:26056875,pct:32.80,note:'Full MEP — plumbing, HVAC, electrical, FP',
   subs:[{id:'bs5a',div:'21',name:'Div 21 Fire Suppression',gsf:97500,psf:9.00,total:877500},{id:'bs5b',div:'22',name:'Div 22 Plumbing',gsf:97500,psf:36.60,total:3568500},{id:'bs5c',div:'23',name:'Div 23 HVAC',gsf:97500,psf:72.18,total:7037550},{id:'bs5d',div:'26',name:'Div 26 Electrical & Low Voltage',gsf:97500,psf:149.47,total:14573325}]},
  {id:'bs6',div:'10+11',name:'Specialties & Equipment',gsf:97500,psf:18.97,total:1849575,pct:2.33,note:'Specialties, library-specific equipment',
   subs:[{id:'bs6a',div:'10',name:'Div 10 Specialties',gsf:97500,psf:10.06,total:980850},{id:'bs6b',div:'11',name:'Div 11 Equipment',gsf:97500,psf:8.91,total:868725}]},
  {id:'bs7',div:'14',name:'Conveying Systems',gsf:97500,psf:36.10,total:3520000,pct:4.43,note:'Elevators, escalators, lifts',
   subs:[{id:'bs7a',div:'14',name:'Div 14 Conveying',gsf:97500,psf:36.10,total:3520000}]},
  {id:'bs8',div:'04+06',name:'Masonry & Wood/Composites',gsf:97500,psf:19.97,total:1947075,pct:2.45,note:'Masonry, millwork, wood framing',
   subs:[{id:'bs8a',div:'04',name:'Div 04 Masonry',gsf:97500,psf:3.92,total:382200},{id:'bs8b',div:'06',name:'Div 06 Wood & Composites',gsf:97500,psf:16.05,total:1564875}]}
];
const PRE_LINE_ITEMS={
  's4':[
    {id:'li4a',name:'Acoustic Booth Construction',qty:3,unitType:'/EA',unitCost:85000,notes:'prefab acoustic pods'},
    {id:'li4b',name:'AV/Recording Equipment',qty:1,unitType:'/LS',unitCost:145000,notes:'mixing boards, mics, monitors, patch bays'},
    {id:'li4c',name:'Acoustic Treatment & Finishes',qty:600,unitType:'/SF',unitCost:180,notes:'wall panels, ceiling clouds, flooring'},
    {id:'li4d',name:'Dedicated MEP (HVAC + electrical)',qty:1,unitType:'/LS',unitCost:80000,notes:'silent HVAC, dedicated circuits, grounding'},
    {id:'li4e',name:'IT & Network Infrastructure',qty:1,unitType:'/LS',unitCost:42000,notes:'fiber, patch panels, streaming capability'}
  ],
  's5':[
    {id:'li5a',name:'Commercial Kitchen Equipment',qty:1,unitType:'/LS',unitCost:285000,notes:'allowance — confirm if tenant supplied'},
    {id:'li5b',name:'FRP Wall Panels',qty:800,unitType:'/SF',unitCost:18,notes:'food-safe fiberglass reinforced panels'},
    {id:'li5c',name:'Grease Trap & Plumbing (Div 22)',qty:1,unitType:'/LS',unitCost:95000,notes:'grease interceptor, floor drains, HW'},
    {id:'li5d',name:'Exhaust Hood & Kitchen MEP (Div 23)',qty:1,unitType:'/LS',unitCost:165000,notes:'Type 1 hood, makeup air, exhaust fans'},
    {id:'li5e',name:'Finishes — Floor, Wall, Ceiling',qty:1500,unitType:'/SF',unitCost:145,notes:'quarry tile floor, painted CMU, ACT ceiling'},
    {id:'li5f',name:'Millwork & Service Counter',qty:1,unitType:'/LS',unitCost:185000,notes:'service counter, display shelving, cabinetry'},
    {id:'li5g',name:'Electrical & Lighting (Div 26)',qty:1500,unitType:'/SF',unitCost:125,notes:'food service lighting, dedicated circuits'},
    {id:'li5h',name:'Signage & Graphics',qty:1,unitType:'/LS',unitCost:35000,notes:'wayfinding, menu boards, exterior signage'},
    {id:'li5i',name:'Furniture & Seating',qty:1,unitType:'/LS',unitCost:155600,notes:'tables, chairs, outdoor seating allowance'},
    {id:'li5j',name:'Miscellaneous & Coordination',qty:1,unitType:'/LS',unitCost:85000,notes:'café-specific coordination, contingency'}
  ],
  's9':[
    {id:'li9a',name:'Theatrical Structural Systems',qty:5500,unitType:'/SF',unitCost:185,notes:'fly tower structure, rigging loft, catwalks'},
    {id:'li9b',name:'Seating & Risers',qty:1,unitType:'/LS',unitCost:485000,notes:'350 seats, retractable riser system'},
    {id:'li9c',name:'AV & Theatrical Lighting',qty:1,unitType:'/LS',unitCost:1894000,notes:'lighting grid, dimmer racks, projectors, screens'},
    {id:'li9d',name:'Sound System',qty:1,unitType:'/LS',unitCost:425000,notes:'line array, mixing console, stage monitors'},
    {id:'li9e',name:'Stage & Backstage Finishes',qty:5500,unitType:'/SF',unitCost:165,notes:'sprung wood floor, acoustic wall panels'},
    {id:'li9f',name:'Theatrical MEP',qty:5500,unitType:'/SF',unitCost:145,notes:'dedicated HVAC, high-amperage electrical'},
    {id:'li9g',name:'Stage Rigging & Soft Goods',qty:1,unitType:'/LS',unitCost:285000,notes:'motorized fly system, grand drape, legs'},
    {id:'li9h',name:'Backstage Support',qty:1,unitType:'/LS',unitCost:295000,notes:'4 dressing rooms, green room, prop storage'},
    {id:'li9i',name:'Orchestra Pit',qty:1,unitType:'/LS',unitCost:195000,notes:'hydraulic lift pit — confirm with architect'},
    {id:'li9j',name:'Theater Systems Coordination',qty:1,unitType:'/LS',unitCost:23500,notes:'specialty consultant coordination allowance'}
  ]
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
let contingencyLump=18656732; // default = PCL Cost Model BE26-52-0187 lump
let gcLump=35681012;

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
  Object.entries(PRE_LINE_ITEMS).forEach(([sid,items])=>{if(!lineItems[sid])lineItems[sid]=JSON.parse(JSON.stringify(items))});
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
  const savedCL=localStorage.getItem('pcl_cont_lump');
  if(savedCL)contingencyLump=parseFloat(savedCL)||18656732;
  const savedGC=localStorage.getItem('pcl_gc_lump');
  if(savedGC)gcLump=parseFloat(savedGC)||35681012;
  /* Restore target budget input */
  const tbInp=document.getElementById('bb-target-inp');
  if(tbInp)tbInp.value='$'+Math.round(targetBudget).toLocaleString('en-US');
  if(localStorage.getItem('pcl_target_edited')==='1'){const sub=document.getElementById('bb-target-sub');if(sub)sub.style.display='none';}
  /* Restore GC lump input — % and contingency inputs are updated by updateBudget() */
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
}
function cloneBase(){return JSON.parse(JSON.stringify(BASELINE))}
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
