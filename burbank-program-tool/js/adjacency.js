/* ════════════════════════════════════
   ADJACENCY MATRIX
════════════════════════════════════ */
function renderAdj(){
  const spaces=program.filter(s=>s.costType!=='lumpsum');
  const wrap=document.getElementById('adj-wrap');if(!wrap)return;
  const li=document.getElementById('adj-lock-icon');
  if(li)li.textContent=adjEditMode?'🔓':'🔒';
  const eb=document.getElementById('adj-edit-btn');
  if(eb){eb.textContent=adjEditMode?'LOCK MATRIX':'EDIT MATRIX';eb.className='adj-edit-btn'+(adjEditMode?' locked':'')}
  const ml=document.getElementById('adj-mode-label');
  if(ml)ml.style.display=adjEditMode?'none':'inline';
  const hint=document.getElementById('adj-legend-hint');
  if(hint)hint.textContent=adjEditMode?'Click cell to cycle':'Read Only — click Edit to modify';
  const tbl=document.createElement('table');
  tbl.className='adj-tbl'+(adjEditMode?'':' adj-readonly');
  const thead=document.createElement('thead');const hr=document.createElement('tr');
  hr.innerHTML='<th></th>';
  spaces.forEach(s=>{const th=document.createElement('th');th.className='rot';th.innerHTML=`<div>${escHtml(s.name)}</div>`;hr.appendChild(th)});
  thead.appendChild(hr);tbl.appendChild(thead);
  const tbody=document.createElement('tbody');
  spaces.forEach((rs,ri)=>{
    const tr=document.createElement('tr');const th=document.createElement('th');th.textContent=rs.name;tr.appendChild(th);
    spaces.forEach((cs,ci)=>{
      const td=document.createElement('td');
      if(ri===ci){td.className='adj-diag'}else{
        const key=rs.id+'-'+cs.id,state=adjMatrix[key]||'none';
        td.className='adj-cell adj-'+(state==='separate'?'sep':state==='must'?'must':state==='should'?'should':'none');
        td.title={must:'Must Be Adjacent',should:'Should Be Adjacent',separate:'Should Be Separated',none:'No Requirement'}[state]||'';
        td.addEventListener('click',()=>{if(!adjEditMode)return;cycleAdj(rs.id,cs.id);renderAdj()});
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);wrap.innerHTML='';wrap.appendChild(tbl);
}
function cycleAdj(a,b){
  const states=['none','must','should','separate'],key=a+'-'+b,keyR=b+'-'+a;
  const next=states[(states.indexOf(adjMatrix[key]||'none')+1)%states.length];
  adjMatrix[key]=next;adjMatrix[keyR]=next;
  localStorage.setItem('pcl_adj_matrix',JSON.stringify(adjMatrix));
}
function exportAdj(){
  const spaces=program.filter(s=>s.costType!=='lumpsum'),lines=['Adjacency Matrix — Burbank Central Library',''];
  spaces.forEach(a=>spaces.forEach(b=>{
    if(a.id>=b.id)return;
    const state=adjMatrix[a.id+'-'+b.id]||'none';
    if(state!=='none')lines.push(`${a.name} ↔ ${b.name}: ${state.toUpperCase()}`);
  }));
  download(lines.join('\n'),'adjacency.txt','text/plain');
}
function toggleAdjEdit(){
  adjEditMode=!adjEditMode;
  localStorage.setItem('pcl_adj_edit',adjEditMode?'1':'0');
  renderAdj();
}
function exportRelationships(){
  const spaces=program.filter(s=>s.costType!=='lumpsum');
  const must=[],should=[],sep=[];
  spaces.forEach(a=>spaces.forEach(b=>{
    if(a.id>=b.id)return;
    const state=adjMatrix[a.id+'-'+b.id]||'none';
    const line=`  ${a.name} ↔ ${b.name}`;
    if(state==='must')must.push(line);
    else if(state==='should')should.push(line);
    else if(state==='separate')sep.push(line);
  }));
  let text='';
  if(must.length)text+='MUST BE ADJACENT:\n'+must.join('\n')+'\n\n';
  if(should.length)text+='SHOULD BE ADJACENT:\n'+should.join('\n')+'\n\n';
  if(sep.length)text+='SHOULD BE SEPARATED:\n'+sep.join('\n')+'\n\n';
  if(!text.trim())text='No relationships defined.';
  navigator.clipboard.writeText(text.trim()).then(()=>{
    const fb=document.getElementById('adj-export-feedback');
    if(fb){fb.style.display='block';setTimeout(()=>{fb.style.display='none'},2000)}
  }).catch(()=>download(text.trim(),'relationships.txt','text/plain'));
}

