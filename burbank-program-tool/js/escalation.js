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
const ESC_SEASON_LABELS={
  'Q1 2027':'Winter 2027','Q2 2027':'Spring 2027','Q3 2027':'Summer 2027',
  'Q4 2027':'Fall 2027','Q1 2028':'Winter 2028','Q2 2028':'Spring 2028'
};
function updateEscalation(){
  const startQ=document.getElementById('esc-start')?.value||'Q3 2027';
  const rate=parseFloat(document.getElementById('esc-rate')?.value||5)/100;
  const startMonths=ESC_OFFSETS[startQ]||15;
  const midpointMonths=startMonths+12;
  const factor=Math.pow(1+rate,midpointMonths/12);
  const escPct=(factor-1)*100;
  const escDollar=CONTINGENCY_BASE*(factor-1);
  // Update escalation state and persist
  escalationLump=escDollar;
  localStorage.setItem('pcl_esc_lump',escalationLump);
  // Update panel
  setText('esc-months',midpointMonths+' months');
  const subEl=document.getElementById('esc-months-sub');
  if(subEl)subEl.textContent='('+startMonths+' mo to start + 12 mo to midpoint)';
  setText('esc-factor',factor.toFixed(3)+'×');
  setText('esc-pct',escPct.toFixed(2)+'%');
  setText('esc-dollar',fmt$(escDollar));
  // Update budget bar Construction Start label
  setText('bb-start-val',ESC_SEASON_LABELS[startQ]||startQ);
  // Refresh budget bar
  updateBudget();
}

