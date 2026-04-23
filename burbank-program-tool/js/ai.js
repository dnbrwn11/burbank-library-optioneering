/* ════════════════════════════════════
   AI FUNCTIONS
════════════════════════════════════ */
async function submitAI(){
  const input=document.getElementById('ai-input').value.trim();
  if(!input){alert('Please describe the change.');return}
  const btn=document.getElementById('ai-btn'),lbl=document.getElementById('ai-lbl');
  const errEl=document.getElementById('ai-err');
  errEl.classList.remove('show');document.getElementById('prev-box').classList.remove('show');
  btn.disabled=true;lbl.innerHTML='<span class="spinner"></span>Thinking…';
  const curProg=program.map(s=>({id:s.id,category:s.category,name:s.name,qty:s.qty,unitSF:s.unitSF,unitCostMid:s.unitCostMid,costType:s.costType,notes:s.notes}));
  try{
    const res=await fetch('/api/suggest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentProgram:curProg,request:input})});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'API error');
    if(!data.changes?.length)throw new Error('No changes returned.');
    preview=data;applyPreviewHL(data.changes);renderTable();
    document.getElementById('prev-title').textContent=`Preview: ${data.changes.length} change(s)`;
    document.getElementById('prev-summary').textContent=data.summary||'';
    document.getElementById('prev-box').classList.add('show');
  }catch(err){errEl.textContent=err.message;errEl.classList.add('show')}
  finally{btn.disabled=false;lbl.textContent='Suggest Changes'}
}
function applyPreviewHL(changes){
  program.forEach(s=>{delete s._preview;delete s._temp});
  changes.forEach(ch=>{
    if(ch.op==='delete'){const s=program.find(x=>x.id===ch.targetId);if(s)s._preview='del'}
    else if(ch.op==='modify'){const s=program.find(x=>x.id===ch.targetId);if(s)s._preview='mod'}
    else if(ch.op==='add'&&ch.space){
      const ct=ch.space.category==='Parking & Circulation'?'perstall':ch.space.category==='Site Work'?'lumpsum':'persf';
      const tmp=Object.assign({},ch.space,{_preview:'add',_temp:true,costType:ct});
      if(!tmp.id)tmp.id=uid();program.push(tmp);
    }
  });
}
function acceptPreview(){
  if(!preview)return;
  preview.changes.forEach(ch=>{
    if(ch.op==='delete'){const s=program.find(x=>x.id===ch.targetId);if(s)logChange('del',s.name,'AI: '+(ch.rationale||''));program=program.filter(x=>x.id!==ch.targetId)}
    else if(ch.op==='modify'&&ch.space){
      const idx=program.findIndex(x=>x.id===ch.targetId);
      if(idx!==-1){logChange('mod',program[idx].name,'AI: '+(ch.rationale||''));program[idx]=Object.assign({},program[idx],ch.space);delete program[idx]._preview;delete program[idx]._temp}
    }else if(ch.op==='add'&&ch.space){
      const exists=program.find(x=>x._temp&&x.id===ch.space.id);
      if(exists){delete exists._preview;delete exists._temp;logChange('add',exists.name,'AI: '+(ch.rationale||''))}
    }
  });
  program=program.filter(s=>!s._temp);program.forEach(s=>{delete s._preview;delete s._temp});
  preview=null;document.getElementById('prev-box').classList.remove('show');saveState();renderAll();
}
function rejectPreview(){
  program=program.filter(s=>!s._temp);program.forEach(s=>delete s._preview);
  preview=null;document.getElementById('prev-box').classList.remove('show');renderTable();
}
async function submitGenerate(){
  const btn=document.getElementById('gen-btn'),lbl=document.getElementById('gen-lbl');
  btn.disabled=true;lbl.innerHTML='<span class="spinner"></span>Generating…';
  try{
    const res=await fetch('/api/generate-program',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({buildingType:document.getElementById('gen-type').value,totalSF:document.getElementById('gen-sf').value,budget:document.getElementById('gen-budget').value,description:document.getElementById('gen-desc').value})});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'API error');
    if(!data.program?.spaces?.length)throw new Error('No program returned.');
    program=data.program.spaces.map(s=>{
      const ct=s.category==='Parking & Circulation'?'perstall':s.category==='Site Work'?'lumpsum':'persf';
      return{...s,costType:ct};
    });
    currentScenario='AI Generated — '+document.getElementById('gen-type').value;
    logChange('sys','','Generated: '+program.length+' spaces');saveState();closeModal('gen-modal');renderAll();
  }catch(err){alert('Error: '+err.message)}
  finally{btn.disabled=false;lbl.textContent='Generate Program'}
}
async function generateNarrative(){
  const btn=document.getElementById('narr-btn');btn.disabled=true;btn.textContent='Generating…';
  document.getElementById('narr-content').innerHTML='<span class="spinner"></span> Generating…';
  openModal('narr-modal');
  try{
    const res=await fetch('/api/narrative',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({program,scenarioName:currentScenario})});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'API error');
    narrativeText=data.narrative||'';
    document.getElementById('narr-content').innerHTML=md2html(narrativeText);
  }catch(err){document.getElementById('narr-content').innerHTML=`<span style="color:var(--err-txt)">Error: ${escHtml(err.message)}</span>`}
  finally{btn.disabled=false;btn.textContent='📄 Stakeholder Narrative'}
}
function md2html(text){
  let h=escHtml(text);
  h=h.replace(/^## (.+)$/gm,'<h2>$1</h2>');
  h=h.replace(/^### (.+)$/gm,'<strong>$1</strong>');
  h=h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  h=h.replace(/^[*-] (.+)$/gm,'<li>$1</li>');
  h=h.replace(/(<li>[^]*?<\/li>)/g,'<ul>$1</ul>');
  h=h.replace(/\n\n/g,'<br><br>');
  return'<div class="narr-box">'+h+'</div>';
}
function copyNarrative(){navigator.clipboard.writeText(narrativeText).then(()=>alert('Copied to clipboard.'))}

