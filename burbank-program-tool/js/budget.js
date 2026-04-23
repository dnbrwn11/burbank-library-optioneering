/* ════════════════════════════════════
   CALCULATIONS
════════════════════════════════════ */
function calcSpaceCost(s){
  const ct=s.costType||'persf';
  const items=lineItems[s.id];
  if(ct==='persf'&&items&&items.length>0){
    return items.reduce((sum,c)=>sum+(c.unitType==='/LS'?(c.unitCost||0):(c.qty||0)*(c.unitCost||0)),0);
  }
  if(ct==='lumpsum')return s.unitCostMid||0;
  if(ct==='perstall')return(s.qty||1)*(s.unitCostMid||0);
  return(s.qty||1)*(s.unitSF||0)*(s.unitCostMid||0);
}
function calcTotals(){
  let nsf=0,mid=0,parkingSF=0,libCost=0;
  program.forEach(s=>{
    const ct=s.costType||'persf';
    const cost=calcSpaceCost(s);
    if(ct==='lumpsum'){mid+=cost}
    else if(ct==='perstall'){const tsf=(s.qty||1)*(s.unitSF||0);parkingSF+=tsf;mid+=cost}
    else{const tsf=(s.qty||1)*(s.unitSF||0);nsf+=tsf;mid+=cost;libCost+=cost}
  });
  return{nsf,costMid:mid,parkingSF,libCost};
}
function getSpread(){return parseInt(document.getElementById('spread-slider').value||15)/100}
function getEscalationFactor(){
  const startQ=document.getElementById('esc-start')?.value||'Q3 2027';
  const rate=parseFloat(document.getElementById('esc-rate')?.value||5)/100;
  const startMonths=ESC_OFFSETS[startQ]||15;
  const midpointMonths=startMonths+12; // 24-month build, escalate to midpoint
  return Math.pow(1+rate,midpointMonths/12);
}

/* ════════════════════════════════════
   BUDGET BAR
════════════════════════════════════ */
function updateBudget(){
  const{costMid,nsf,parkingSF,libCost}=calcTotals();
  /* 4-layer cost stack — Direct Costs = ALL program rows (library + parking + site work) */
  const directCosts=costMid;
  const contingencyDollar=contingencyLump; // stored as lump; % is derived display
  const programmedTotal=directCosts+contingencyDollar+gcLump;
  const variance=programmedTotal-targetBudget;
  const pct=targetBudget>0?programmedTotal/targetBudget*100:0;
  const gcPctOfDirect=directCosts>0?(gcLump/directCosts*100).toFixed(1):'0.0';
  const contPctOfDirect=directCosts>0?(contingencyLump/directCosts*100).toFixed(2):'0.00';
  /* Row 1 cells */
  setText('bb-direct',fmt$(directCosts));
  setText('bb-programmed',fmt$(programmedTotal));
  /* Variance */
  const varEl=document.getElementById('bb-variance');
  const dirEl=document.getElementById('bb-over-under');
  if(varEl){varEl.textContent=fmt$(Math.abs(variance));varEl.style.color=variance>0?'#FFDF1B':'#FFFFFF'}
  if(dirEl){dirEl.textContent=variance>0?'OVER':'UNDER';dirEl.style.color=variance>0?'#FFDF1B':'#FFFFFF'}
  setText('bb-variance-pct',((variance/targetBudget)*100).toFixed(1)+'%');
  /* Row 2 — update both contingency inputs (only when not focused) */
  const cpInp=document.getElementById('bb-cont-pct');
  if(cpInp&&document.activeElement!==cpInp)cpInp.value=contPctOfDirect+'%';
  const cdInp=document.getElementById('bb-cont-dollar-inp');
  if(cdInp&&document.activeElement!==cdInp)cdInp.value='$'+Math.round(contingencyLump).toLocaleString('en-US');
  setText('bb-gc-pct','('+gcPctOfDirect+'%)');
  /* Progress bar */
  const fillPct=Math.min(pct,110);
  const fill=document.getElementById('bb-fill');
  if(fill){
    fill.style.width=fillPct+'%';
    fill.style.background=pct>100?'rgba(255,100,100,0.8)':'#FFDF1B';
  }
}
function onTargetBudgetFocus(inp){inp.value=Math.round(targetBudget).toString()}
function onTargetBudgetBlur(inp){
  const raw=inp.value.replace(/[^0-9.]/g,'');
  const val=parseFloat(raw)||155000000;
  targetBudget=val;
  localStorage.setItem('pcl_target_budget',targetBudget);
  inp.value='$'+Math.round(targetBudget).toLocaleString('en-US');
  const sub=document.getElementById('bb-target-sub');
  if(sub){sub.style.display='none';localStorage.setItem('pcl_target_edited','1')}
  updateBudget();
}
/* Contingency hybrid: edit % → recalculates lump; edit $ → recalculates % */
function onContPctFocus(inp){
  /* show raw number for editing */
  const dc=calcTotals().costMid;
  inp.value=dc>0?(contingencyLump/dc*100).toFixed(2):'0.00';
}
function onContPctBlur(inp){
  const pct=parseFloat(inp.value)||0;
  const dc=calcTotals().costMid;
  contingencyLump=dc*(pct/100);
  localStorage.setItem('pcl_cont_lump',contingencyLump);
  updateBudget();
}
function onContDollarFocus(inp){inp.value=Math.round(contingencyLump).toString()}
function onContDollarBlur(inp){
  const raw=inp.value.replace(/[^0-9.]/g,'');
  contingencyLump=parseFloat(raw)||0;
  localStorage.setItem('pcl_cont_lump',contingencyLump);
  updateBudget();
}
function onGcLumpFocus(inp){inp.value=Math.round(gcLump).toString()}
function onGcLumpBlur(inp){
  const raw=inp.value.replace(/[^0-9.]/g,'');
  const val=parseFloat(raw)||0;
  gcLump=val;
  localStorage.setItem('pcl_gc_lump',gcLump);
  inp.value='$'+Math.round(gcLump).toLocaleString('en-US');
  updateBudget();
}
function onGcLumpInput(inp){
  /* live update while typing raw digits */
  const raw=inp.value.replace(/[^0-9.]/g,'');
  const val=parseFloat(raw)||0;
  if(!isNaN(val)&&raw.length>0){gcLump=val;localStorage.setItem('pcl_gc_lump',gcLump);updateBudget()}
}
function onSpreadChange(){
  const v=document.getElementById('spread-slider').value;
  document.getElementById('spread-label').textContent=`Showing ±${v}% spread`;
  updateBudget();
}

