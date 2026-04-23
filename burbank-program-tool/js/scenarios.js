/* ════════════════════════════════════
   SCENARIOS
════════════════════════════════════ */
function saveScenario(){
  const n=(prompt('Name this scenario:','Scenario '+(Object.keys(scenarios).length+1))||'').trim();
  if(!n)return;
  scenarios[n]={program:JSON.parse(JSON.stringify(program)),ts:new Date().toISOString(),baseline:false};
  currentScenario=n;saveSc();saveState();logChange('sys','','Saved: '+n);renderAll();
}
function loadScenario(n){
  if(!scenarios[n])return;
  program=JSON.parse(JSON.stringify(scenarios[n].program));
  currentScenario=n;saveState();logChange('sys','','Loaded: '+n);renderAll();
}
function branchScenario(n){
  if(!scenarios[n])return;
  program=JSON.parse(JSON.stringify(scenarios[n].program));
  currentScenario=n+' (branch)';saveState();logChange('sys','','Branched from: '+n);renderAll();
}
function deleteScenario(n){
  if(n==='Baseline — Full Program'){alert('Cannot delete baseline.');return}
  if(!confirm(`Delete "${n}"?`))return;
  delete scenarios[n];if(currentScenario===n)currentScenario='Baseline — Full Program';
  saveSc();saveState();renderScenarios();
}
function resetBaseline(){
  if(!confirm('Reset to baseline? Unsaved changes will be lost.'))return;
  program=cloneBase();
  lineItems={};
  program.forEach(s=>{
    if((s.costType||'persf')==='persf'){
      const totalSF=(s.qty||1)*(s.unitSF||0);
      lineItems[s.id]=buildDivLineItems(s.id,s.name,totalSF);
    }
  });
  escalationLump=PCL_ESCALATION;
  contingencyLump=PCL_CONTINGENCY;
  localStorage.setItem('pcl_esc_lump',escalationLump);
  localStorage.setItem('pcl_cont_lump',contingencyLump);
  currentScenario='Baseline — Full Program';
  saveState();logChange('sys','','Reset to baseline');renderAll();
}
function renderScenarios(){
  const list=document.getElementById('sc-list'),cmpBody=document.getElementById('cmp-tbody');
  if(!list||!cmpBody)return;
  list.innerHTML='';cmpBody.innerHTML='';
  const baseSnap=scenarios['Baseline — Full Program'];
  const baseStats=baseSnap?compStats(baseSnap.program):null;
  Object.entries(scenarios).forEach(([n,sc])=>{
    const stats=compStats(sc.program);
    const card=document.createElement('div');
    card.className='sc-card'+(n===currentScenario?' active':'')+(sc.baseline?' baseline':'');
    card.innerHTML=`<div class="sc-name">${escHtml(n)}</div><div class="sc-stats">${fmtSF(stats.nsf)} net · ${fmt$(stats.costMid)} mid</div><div class="sc-actions"><button class="btn btn-sm" onclick="loadScenario('${escHtml(n)}')">Load</button><button class="btn-ghost btn-sm" onclick="branchScenario('${escHtml(n)}')">Branch</button>${!sc.baseline?`<button class="btn-ghost btn-sm" onclick="deleteScenario('${escHtml(n)}')">Delete</button>`:''}</div>`;
    list.appendChild(card);
    const delta=baseStats?stats.costMid-baseStats.costMid:0;
    const dGMP=stats.costMid-TARGET_GMP;
    const eff=parseInt(document.getElementById('g-eff')?.value||68)/100;
    const gsf=eff>0?stats.nsf/eff:stats.nsf;
    const psf=gsf>0?stats.costMid/gsf:0;
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${escHtml(n)}${sc.baseline?' ★':''}</td><td class="num">${fmtSF(stats.nsf)}</td><td class="num">${fmtSF(Math.round(gsf))}</td><td class="num">${fmt$(stats.costMid)}</td><td class="num">${fmt$(psf)}/GSF</td><td class="num ${delta>0?'delta-p':delta<0?'delta-n':''}">${delta===0?'—':(delta>0?'+':'')+fmt$(delta)}</td><td class="num ${dGMP>0?'delta-p':'delta-n'}">${(dGMP>0?'+':'')+fmt$(dGMP)}</td>`;
    cmpBody.appendChild(tr);
  });
}
function compStats(prog){
  let nsf=0,costMid=0,parkingSF=0;
  prog.forEach(s=>{
    const ct=s.costType||'persf';
    if(ct==='lumpsum'){costMid+=s.unitCostMid||0}
    else if(ct==='perstall'){const tsf=(s.qty||1)*(s.unitSF||0);parkingSF+=tsf;costMid+=(s.qty||1)*(s.unitCostMid||0)}
    else{const tsf=(s.qty||1)*(s.unitSF||0);nsf+=tsf;costMid+=tsf*(s.unitCostMid||0)}
  });
  costMid+=LIBRARY_BSYS_TOTAL;
  return{nsf,costMid,parkingSF};
}

