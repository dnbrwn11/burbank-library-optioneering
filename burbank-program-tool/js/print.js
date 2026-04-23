/* ════════════════════════════════════
   PRINT SUMMARY
════════════════════════════════════ */
function printSummary(){
  updatePrintSummary();
  const pw=document.getElementById('page-wrapper');
  const vd=document.getElementById('viz-drawer');
  const vt=document.getElementById('viz-tab');
  const ps=document.getElementById('print-summary');
  pw.style.display='none';
  vd.style.display='none';
  vt.style.display='none';
  ps.style.display='block';
  const restore=()=>{
    pw.style.display='';vd.style.display='';vt.style.display='';ps.style.display='none';
    window.removeEventListener('afterprint',restore);
  };
  window.addEventListener('afterprint',restore);
  window.print();
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
    {label:'Contingency (14.64%)',value:'$18,656,732'},
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
  const contDollar=contingencyLump;
  const contPctDisp=dc>0?(contingencyLump/dc*100).toFixed(2):'0.00';
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

