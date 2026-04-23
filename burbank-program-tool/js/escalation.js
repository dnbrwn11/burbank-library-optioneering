/* ════════════════════════════════════
   GROSS-TO-NET
════════════════════════════════════ */
function updateGTN(){
  const{nsf,parkingSF}=calcTotals();
  const eff=parseInt(document.getElementById('g-eff').value)/100;
  const libGross=eff>0?Math.round(nsf/eff):0;
  const totalGross=libGross+parkingSF;
  const target=parseInt(document.getElementById('g-target').value)||TARGET_GSF;
  const varSF=libGross-target; // compare library gross vs target
  setText('g-nsf',nsf.toLocaleString()+' SF');
  setText('g-lib-gsf',libGross.toLocaleString()+' SF');
  setText('g-park-sf',parkingSF.toLocaleString()+' SF');
  setText('g-gsf',totalGross.toLocaleString()+' SF');
  const ve=document.getElementById('g-var');
  if(ve){ve.textContent=(varSF>=0?'+':'')+varSF.toLocaleString()+' SF';const a=Math.abs(varSF);ve.className='var-badge '+(a<=2000?'ok':a<=5000?'warn':'bad')}
  const we=document.getElementById('g-warn');
  if(we)Math.abs(varSF)>5000?we.classList.add('show'):we.classList.remove('show');
  updateBudget(); // refresh cost/gsf
}
function onEffChange(v){setText('g-eff-val',v+'%');updateGTN()}

/* ════════════════════════════════════
   ESCALATION CALCULATOR
════════════════════════════════════ */
function updateEscalation(){
  const startQ=document.getElementById('esc-start')?.value||'Q3 2027';
  const rate=parseFloat(document.getElementById('esc-rate')?.value||5)/100;
  const startMonths=ESC_OFFSETS[startQ]||15;
  const midpointMonths=startMonths+12;
  const factor=Math.pow(1+rate,midpointMonths/12);
  const{costMid}=calcTotals();
  const escDirect=costMid*factor;
  const escTotal=TARGET_GMP*factor;
  const delta=escTotal-TARGET_GMP;
  setText('esc-months',midpointMonths+' mo');
  setText('esc-factor',factor.toFixed(3)+'×');
  setText('esc-direct',fmt$(escDirect));
  setText('esc-total',fmt$(escTotal));
  setText('esc-delta','+'+ fmt$(delta));
  if(document.getElementById('show-escalated')?.checked)updateBudget();
}

