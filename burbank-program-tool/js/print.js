/* ════════════════════════════════════
   PRINT SUMMARY — HELPERS
════════════════════════════════════ */
function getCurrentDirectCosts(){const{costMid}=calcTotals();return Math.round(costMid)}
function getCurrentEscalation(){return Math.round(escalationLump)}
function getCurrentContingency(){return Math.round(contingencyLump)}
function getCurrentGCOHP(){return Math.round(gcLump)}
function getTargetBudget(){return Math.round(targetBudget)}
function getAssumptionsText(){
  const el=document.getElementById('assumptions-text');
  const txt=el?el.value:'• PCL Cost Model BE26-52-0187 · Apr 23 2026\n• For planning purposes only';
  return escHtml(txt);
}
function getProgramSummaryRows(){
  const catStats={};
  CAT_ORDER.forEach(c=>{catStats[c]={count:0,sf:0,cost:0}});
  program.forEach(s=>{
    if(!catStats[s.category])return;
    const ct=s.costType||'persf';
    const cost=calcSpaceCost(s);
    catStats[s.category].count++;
    if(ct!=='lumpsum')catStats[s.category].sf+=(s.qty||1)*(s.unitSF||0);
    catStats[s.category].cost+=cost;
  });
  catStats['Building Systems']={count:BUILDING_SYSTEMS.length,sf:0,cost:LIBRARY_BSYS_TOTAL};
  return CAT_ORDER.filter(c=>catStats[c]&&catStats[c].cost>0).map(c=>{
    const d=catStats[c];
    const sfDisp=d.sf>0?d.sf.toLocaleString()+' SF':'—';
    return`<tr><td>${escHtml(c)}</td><td>${d.count}</td><td>${sfDisp}</td><td>$${Math.round(d.cost).toLocaleString()}</td></tr>`;
  }).join('');
}

/* ════════════════════════════════════
   PRINT SUMMARY
════════════════════════════════════ */
function printSummary(){
  const directCosts=getCurrentDirectCosts();
  const escalation=getCurrentEscalation();
  const contingency=getCurrentContingency();
  const gcohp=getCurrentGCOHP();
  const programmedTotal=directCosts+escalation+contingency+gcohp;
  const tb=getTargetBudget();
  const variance=programmedTotal-tb;
  const costPerGSF=Math.round(programmedTotal/97500);
  const varClass=variance>0?'print-row-over':'print-row-under';
  const varLabel=variance>0?'OVER':'UNDER';
  const dateStr=new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const content=`
    <div class="print-header">
      <div class="print-logo">PCL CONSTRUCTION</div>
      <div class="print-title">BURBANK CENTRAL LIBRARY &amp; CIVIC CENTER</div>
      <div class="print-subtitle">Progressive Design-Build Cost Model</div>
      <div class="print-date">${dateStr}</div>
    </div>
    <hr class="print-rule">
    <div class="print-section">
      <h2>Project Cost Summary</h2>
      <table class="print-table">
        <tr class="print-row-header"><td>COST COMPONENT</td><td>AMOUNT</td><td>NOTES</td></tr>
        <tr><td>Direct Costs</td><td>$${directCosts.toLocaleString()}</td><td>Space + Parking + Site Work</td></tr>
        <tr><td>Escalation (11.65%)</td><td>$${escalation.toLocaleString()}</td><td>Applied to $94,945,200 base</td></tr>
        <tr><td>Contingency (8.00%)</td><td>$${contingency.toLocaleString()}</td><td>Applied to $94,945,200 base</td></tr>
        <tr><td>GC / GR / OHP / Design / CA</td><td>$${gcohp.toLocaleString()}</td><td>28% of direct costs</td></tr>
        <tr class="print-row-total"><td>PROGRAMMED TOTAL</td><td>$${programmedTotal.toLocaleString()}</td><td></td></tr>
        <tr class="print-row-target"><td>TARGET BUDGET</td><td>$${tb.toLocaleString()}</td><td>Client approved budget</td></tr>
        <tr class="${varClass}"><td>VARIANCE</td><td>$${Math.abs(variance).toLocaleString()} ${varLabel}</td><td>${((variance/tb)*100).toFixed(1)}%</td></tr>
      </table>
    </div>
    <div class="print-section">
      <h2>Key Metrics</h2>
      <table class="print-table">
        <tr><td>Library Gross SF</td><td>97,500 GSF</td></tr>
        <tr><td>Parking</td><td>310 stalls / 93,000 SF</td></tr>
        <tr><td>Cost per GSF</td><td>$${costPerGSF.toLocaleString()}/GSF</td></tr>
        <tr><td>Construction Start</td><td>Summer 2027</td></tr>
        <tr><td>Estimate Basis</td><td>PCL Cost Model BE26-52-0187 · Apr 23 2026</td></tr>
      </table>
    </div>
    <div class="print-section">
      <h2>Program Summary by Category</h2>
      <table class="print-table">
        <tr class="print-row-header"><td>CATEGORY</td><td>SPACES</td><td>TOTAL SF</td><td>TOTAL COST</td></tr>
        ${getProgramSummaryRows()}
      </table>
    </div>
    <div class="print-section">
      <h2>Assumptions &amp; Basis of Estimate</h2>
      <div class="print-assumptions">${getAssumptionsText()}</div>
    </div>
    <div class="print-footer">PCL Construction · Proprietary and Confidential · For internal pursuit use only · Not for distribution</div>
  `;
  const container=document.getElementById('print-summary-container');
  if(container)container.innerHTML=content;
  document.body.classList.add('print-summary-mode');
  const restore=()=>{
    document.body.classList.remove('print-summary-mode');
    window.removeEventListener('afterprint',restore);
  };
  window.addEventListener('afterprint',restore);
  setTimeout(()=>window.print(),250);
}
function updatePrintSummary(){
  const{costMid,nsf,parkingSF}=calcTotals();
  const spread=getSpread();
  const escFactor=getEscalationFactor();
  const escPct=((escFactor-1)*100).toFixed(1)+'%';
  const eff=parseInt(document.getElementById('g-eff')?.value||68)/100;
  const libGross=eff>0?Math.round(nsf/eff):0;
  // Date
  const el=document.getElementById('ps-date');
  if(el)el.textContent=new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  // Summary grid
  const gridData=[
    {label:'Total Budget',value:fmt$(TARGET_GMP)},
    {label:'Library Building',value:'$79,445,200 ($814.82/GSF)'},
    {label:'Parking Structure',value:'$15,500,000 ($50K/stall)'},
    {label:'Site Work',value:'$13,830,255'},
    {label:'Escalation + Contingency ('+((escalationLump+contingencyLump)/CONTINGENCY_BASE*100).toFixed(2)+'%)',value:fmt$(escalationLump+contingencyLump)},
    {label:'GC/GR/OHP (28%)',value:'$35,681,012'},
    {label:'Construction Start',value:'Summer 2027'},
    {label:'Library GSF',value:(libGross||97500).toLocaleString()+' SF'},
    {label:'Parking GSF',value:parkingSF.toLocaleString()+' SF (310 stalls)'}
  ];
  const grid=document.getElementById('ps-summary-grid');
  if(grid){
    grid.innerHTML=gridData.map(d=>`<div class="ps-grid-item"><div class="ps-grid-label">${escHtml(d.label)}</div><div class="ps-grid-value">${escHtml(d.value)}</div></div>`).join('');
  }
  // Full cost stack table
  const{costMid:dc}=calcTotals();
  const contDollar=escalationLump+contingencyLump;
  const contPctDisp=CONTINGENCY_BASE>0?((contDollar/CONTINGENCY_BASE)*100).toFixed(2):'0.00';
  const progTotal=dc+contDollar+gcLump;
  const stackVariance=progTotal-targetBudget;
  const stackTbody=document.getElementById('ps-stack-tbody');
  if(stackTbody){
    const rows=[
      ['Direct Costs (Spaces + Parking + Site Work)',fmt$(dc),'Live program total'],
      ['+ Contingency & Escalation ('+contPctDisp+'%)',fmt$(contDollar),'Lump sum'],
      ['+ GC / GR / OHP / Design / CA',fmt$(gcLump),'Lump sum'],
      ['= PROGRAMMED TOTAL',fmt$(progTotal),''],
      ['TARGET BUDGET',fmt$(targetBudget),'Client approved'],
      ['VARIANCE '+(stackVariance>0?'(OVER TARGET)':'(UNDER TARGET)'),
        (stackVariance>0?'+':'')+fmt$(stackVariance),
        ((stackVariance/targetBudget)*100).toFixed(1)+'%']
    ];
    stackTbody.innerHTML=rows.map((r,i)=>`<tr style="${i===3||i===5?'font-weight:700;border-top:2px solid #006330':''}"><td>${escHtml(r[0])}</td><td class="num">${escHtml(r[1])}</td><td class="num" style="color:#6D6D6D">${escHtml(r[2])}</td></tr>`).join('');
  }
  // Cost by category table
  const catCosts={};CAT_ORDER.forEach(c=>catCosts[c]={sf:0,cost:0,cnt:0,rates:[]});
  program.forEach(s=>{
    const ct=s.costType||'persf';
    let sf=0,cost=0;
    if(ct==='lumpsum'){cost=s.unitCostMid||0}
    else if(ct==='perstall'){sf=(s.qty||1)*(s.unitSF||0);cost=(s.qty||1)*(s.unitCostMid||0)}
    else{sf=(s.qty||1)*(s.unitSF||0);cost=sf*(s.unitCostMid||0);if(s.unitCostMid)catCosts[s.category].rates.push(s.unitCostMid)}
    if(catCosts[s.category]){catCosts[s.category].sf+=sf;catCosts[s.category].cost+=cost;catCosts[s.category].cnt++}
  });
  const ctbody=document.getElementById('ps-cost-tbody');
  if(ctbody){
    ctbody.innerHTML=CAT_ORDER.filter(c=>catCosts[c].cost>0).map(c=>{
      const d=catCosts[c];
      const avgPsf=d.rates.length>0?Math.round(d.rates.reduce((a,b)=>a+b,0)/d.rates.length):0;
      return`<tr><td>${escHtml(c)}</td><td class="num">${d.sf>0?d.sf.toLocaleString()+' SF':'—'}</td><td class="num">${avgPsf>0?'$'+avgPsf+'/SF':'Lump Sum'}</td><td class="num">${fmt$(d.cost)}</td></tr>`;
    }).join('');
    // Totals row
    const totalSF=CAT_ORDER.reduce((a,c)=>a+(catCosts[c].sf||0),0);
    const totalCost=CAT_ORDER.reduce((a,c)=>a+(catCosts[c].cost||0),0);
    ctbody.innerHTML+=`<tr style="font-weight:700;border-top:2px solid #006330"><td>TOTAL PROGRAMMED</td><td class="num">${totalSF.toLocaleString()} SF</td><td class="num">—</td><td class="num">${fmt$(totalCost)}</td></tr>`;
  }
  // Assumptions
  const aEl=document.getElementById('assumptions-text');
  const aOut=document.getElementById('ps-assumptions');
  if(aEl&&aOut){
    const txt=aEl.value;
    aOut.textContent=txt+'\n• Escalation: '+escPct+' above base costs ('+document.getElementById('esc-start')?.value+' start at '+document.getElementById('esc-rate')?.value+'%/yr)';
  }
}

