/* ════════════════════════════════════
   RENDER TABLE
════════════════════════════════════ */
function renderTable(){
  const tbody=document.getElementById('prog-tbody');
  tbody.innerHTML='';
  const groups={};CAT_ORDER.forEach(c=>groups[c]=[]);
  program.forEach(s=>{if(groups[s.category])groups[s.category].push(s)});
  CAT_ORDER.forEach(cat=>{
    /* ── BUILDING SYSTEMS: render from constant, not from program[] ── */
    if(cat==='Building Systems'){
      const cc=CAT_COLORS['Building Systems']||'#4A7B9D';
      const ctr=document.createElement('tr');ctr.className='cat-row';
      ctr.innerHTML=`<td colspan="11"><span style="display:inline-block;width:10px;height:10px;background:${cc};border-radius:1px;margin-right:8px;vertical-align:middle"></span>BUILDING SYSTEMS<span style="font-family:'Barlow',sans-serif;font-weight:300;font-size:10px;color:rgba(255,255,255,0.55);margin-left:10px">Whole-building elements · 97,500 GSF basis · PCL Cost Model BE26-52-0187</span></td>`;
      tbody.appendChild(ctr);
      /* Reference note */
      const ntr=document.createElement('tr');
      ntr.innerHTML=`<td colspan="11" style="padding:0"><div style="background:#FFF3CD;color:#856404;padding:8px 16px;font-family:'Barlow',sans-serif;font-weight:300;font-size:11px;line-height:1.6">⚠ REFERENCE ONLY — NOT ADDITIVE TO PROGRAM COSTS. Building Systems costs ($28.9M) represent whole-building structural, envelope, and conveying elements. These are allocated within program space costs above and shown here for reference only. Building Systems + Program Spaces = $79,445,200 library total. Do not add to Direct Costs.</div></td>`;
      tbody.appendChild(ntr);
      /* Locked data rows */
      BUILDING_SYSTEMS.forEach(bs=>{
        const e=bsEdits[bs.id]||{};
        const total=e.total!==undefined?e.total:bs.total;
        const psf=e.psf!==undefined?e.psf:bs.psf;
        const tr=document.createElement('tr');tr.className='data-row';
        tr.innerHTML=`
          <td><span style="display:inline-block;width:16px"></span></td>
          <td style="padding:0;width:4px"><div style="width:4px;min-height:36px;height:100%;background:${cc}"></div></td>
          <td style="font-style:italic;color:#3A5F7A"><span style="font-size:10px;color:${cc};font-family:'Barlow Condensed',sans-serif;font-weight:700;margin-right:6px;letter-spacing:0.04em">Div ${escHtml(bs.div)}</span>${escHtml(bs.name.replace(/^Div \d\d /,''))}</td>
          <td class="num" style="color:#9A9A9A;font-size:11px">97,500</td>
          <td class="num col-hide" style="color:#9A9A9A;font-size:10px">GSF</td>
          <td class="num" style="color:#9A9A9A">97,500 GSF</td>
          <td class="num" style="color:#4A7B9D">$${parseFloat(psf).toFixed(2)}/GSF</td>
          <td class="num" style="font-weight:600;color:#4A7B9D">$${parseInt(total).toLocaleString()}</td>
          <td class="col-hide"></td>
          <td class="col-hide" style="font-size:11px;color:#6D6D6D;font-style:italic">${escHtml(e.note!==undefined?e.note:bs.note)}</td>
          <td style="text-align:center;color:#AAAAAA;font-size:11px">🔒</td>`;
        tbody.appendChild(tr);
      });
      /* BS reference subtotal */
      const bsRefTotal=BUILDING_SYSTEMS.reduce((s,bs)=>s+(bsEdits[bs.id]?.total??bs.total),0);
      const str=document.createElement('tr');str.className='bsys-subtotal-row';
      str.innerHTML=`<td colspan="7" style="text-align:right;padding-right:8px;font-size:10px;color:#4A7B9D;font-weight:700;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.06em">BUILDING SYSTEMS REFERENCE SUBTOTAL</td><td class="num" style="font-weight:700;color:#4A7B9D">$${bsRefTotal.toLocaleString()}</td><td colspan="3"></td>`;
      tbody.appendChild(str);
      renderSuppSection(tbody);
      return;
    }

    /* ── PROGRAM SPACE CATEGORIES ── */
    const rows=groups[cat];if(!rows.length)return;
    const cc=CAT_COLORS[cat]||'#999';
    const ctr=document.createElement('tr');
    ctr.className='cat-row';
    ctr.innerHTML=`<td colspan="11"><span style="display:inline-block;width:10px;height:10px;background:${cc};border-radius:1px;margin-right:8px;vertical-align:middle"></span>${escHtml(cat)}</td>`;
    tbody.appendChild(ctr);
    rows.forEach(s=>{
      const ct=s.costType||'persf';
      const items=lineItems[s.id]||[];
      const hasL2=ct==='persf'&&items.length>0;
      const isExpanded=expandedSpaces.has(s.id);
      let tsf=0,cost=0,qtyDisp='—',usfDisp='—';
      if(ct==='persf'){
        tsf=(s.qty||1)*(s.unitSF||0);
        const rawCost=tsf*(s.unitCostMid||0);
        cost=hasL2?items.reduce((sum,c)=>sum+(c.unitType==='/LS'?(c.unitCost||0):(c.qty||0)*(c.unitCost||0)),0):rawCost;
        qtyDisp=s.qty;usfDisp=(s.unitSF||0).toLocaleString();
      }else if(ct==='perstall'){
        tsf=(s.qty||1)*(s.unitSF||0);cost=(s.qty||1)*(s.unitCostMid||0);
        qtyDisp=s.qty+' stalls';usfDisp=(s.unitSF||0)+' SF/stall';
      }else{
        cost=s.unitCostMid||0;
        qtyDisp='—';usfDisp='—';
      }
      const derivedPsf=hasL2&&tsf>0?cost/tsf:null;
      const psfHtml=hasL2
        ?`<span style="font-style:italic;color:#3D8B37;cursor:help" title="Derived from division breakdown below">${fmt$(derivedPsf)}/SF</span>`
        :(ct==='persf'?fmt$(s.unitCostMid||0)+'/SF':ct==='perstall'?fmt$(s.unitCostMid||0)+'/stall':'Lump Sum');
      const bench=(ct==='persf')?getBench(s.name,s.unitSF||0):'';
      const pvCls=s._preview?' p-'+s._preview:'';
      const qtyA=ct==='persf'?`class="num editable" data-field="qty" data-id="${s.id}"`:`class="num${ct==='lumpsum'?' muted':''}"`;
      const usfA=ct==='persf'?`class="num editable col-hide" data-field="unitSF" data-id="${s.id}"`:`class="num col-hide${ct==='lumpsum'?' muted':''}"`;
      const psfA=hasL2?`class="num"`:ct!=='lumpsum'?`class="num editable" data-field="unitCostMid" data-id="${s.id}"`:`class="num muted"`;
      const chevron=ct==='persf'?`<span class="l2-chevron${isExpanded?' open':''}" onclick="toggleL2('${s.id}',event)">▶</span>`:`<span style="display:inline-block;width:16px"></span>`;
      const rawParentCost=tsf*(s.unitCostMid||0);
      const l2Badge=hasL2?`<span class="l2-badge" onclick="event.stopPropagation()">DIV</span><span class="l2-count" onclick="event.stopPropagation()">(${items.length})</span>`:'';
      const modBadge=hasL2&&Math.abs(cost-rawParentCost)>1?`<span class="l2-mod-badge" onclick="event.stopPropagation()">MOD</span>`:'';
      const tr=document.createElement('tr');
      tr.className='data-row'+pvCls;tr.dataset.id=s.id;tr.dataset.cat=s.category;tr.draggable=true;
      tr.innerHTML=`
        <td><span class="drag-h">⋮⋮</span></td>
        <td style="padding:0;width:4px"><div style="width:4px;min-height:36px;height:100%;background:${cc}"></div></td>
        <td class="editable" data-field="name" data-id="${s.id}">${chevron}${escHtml(s.name)}${l2Badge}${modBadge}</td>
        <td ${qtyA}>${qtyDisp}</td>
        <td ${usfA}>${usfDisp}</td>
        <td class="num${ct==='lumpsum'?' muted':''}">${ct==='lumpsum'?'—':fmtSF(tsf)}</td>
        <td ${psfA}>${psfHtml}</td>
        <td class="num">${fmt$(cost)}</td>
        <td class="col-hide">${bench}</td>
        <td class="editable col-hide" data-field="notes" data-id="${s.id}">${escHtml(s.notes||'')}</td>
        <td><button class="btn-icon" onclick="deleteRow('${s.id}')" title="Delete">✕</button></td>`;
      tr.addEventListener('click',e=>{
        if(e.target.closest('.editable')||e.target.closest('.btn-icon')||e.target.closest('.drag-h')||e.target.closest('.l2-chevron'))return;
        if(window.innerWidth<=767)toggleDetail(s.id);
      });
      tbody.appendChild(tr);
      const dtr=document.createElement('tr');
      dtr.className='detail-row';dtr.id='dr-'+s.id;
      let detailStr=`<strong>Cost Type:</strong> ${ct}`;
      if(hasL2)detailStr+=` &nbsp;<strong>Division Total:</strong> ${fmt$(cost)}`;
      else if(ct==='persf')detailStr+=` &nbsp;<strong>$/SF:</strong> ${fmt$(s.unitCostMid||0)}`;
      if(s.notes)detailStr+=` &nbsp;<strong>Notes:</strong> ${escHtml(s.notes)}`;
      dtr.innerHTML=`<td colspan="11">${detailStr}</td>`;
      tbody.appendChild(dtr);
      if(isExpanded&&ct==='persf')renderL2Rows(tbody,s,items,cc);
    });
    const atr=document.createElement('tr');
    atr.innerHTML=`<td colspan="11"><button class="add-row-btn" onclick="openAddRow('${escHtml(cat)}')">+ Add Space to ${escHtml(cat)}</button></td>`;
    tbody.appendChild(atr);
  });
  setText('row-count',program.filter(s=>s.costType!=='lumpsum').length);
  setText('cur-scenario',currentScenario);
  setupEditCells();
}
function toggleDetail(id){const dr=document.getElementById('dr-'+id);if(dr)dr.classList.toggle('show')}

/* ════════════════════════════════════
   SUPPLEMENTAL BUILDING ELEMENTS
════════════════════════════════════ */
function renderSuppSection(tbody){
  const DIVS=['Div 02','Div 03','Div 04','Div 05','Div 06','Div 07','Div 08','Div 09','Div 10','Div 11','Div 12','Div 14','Div 21','Div 22','Div 23','Div 26','Div 31','Div 32','Other'];
  /* Section header */
  const hdr=document.createElement('tr');
  hdr.innerHTML=`<td colspan="11" style="padding:0"><div style="background:#FFFBF0;border-left:4px solid #E8A020;padding:8px 16px">
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#E8A020">SUPPLEMENTAL BUILDING ELEMENTS</div>
    <div style="font-family:'Barlow',sans-serif;font-weight:300;font-size:10px;color:#856404;margin-top:2px">Add-alternate scope items not in PCL Cost Model baseline · Included in Direct Costs when populated</div>
  </div></td>`;
  tbody.appendChild(hdr);
  /* Element rows */
  supplementalElements.forEach(e=>{
    const cost=calcSuppCost(e);
    const isLS=e.unit==='/LS';
    const qtyDisp=isLS?'Lump Sum':`${e.qty||0} ${e.unit.replace('/','').trim()}`;
    const tr=document.createElement('tr');
    tr.className='data-row';tr.dataset.suppid=e.id;
    tr.style.cssText='border-left:3px solid #E8A020;background:#FFFEF5';
    tr.innerHTML=`
      <td style="text-align:center;color:#E8A020;font-size:13px;padding:0 8px">✏</td>
      <td style="padding:0;width:4px"><div style="width:4px;min-height:44px;height:100%;background:#E8A020"></div></td>
      <td><input type="text" class="supp-inp" value="${escHtml(e.description)}" placeholder="Description..."
        oninput="onSuppDescInput('${e.id}',this.value)"
        style="width:100%;background:transparent;border:none;font-family:'Barlow',sans-serif;font-size:12px;color:var(--text);outline:none;padding:0"></td>
      <td class="num"><input type="number" class="supp-inp" value="${isLS?'':e.qty||''}" placeholder="${isLS?'—':''}"
        ${isLS?'disabled':''}
        oninput="updateSuppField('${e.id}','qty',parseFloat(this.value)||0)"
        style="width:56px;background:transparent;border:none;text-align:right;font-family:'Barlow',sans-serif;font-size:12px;outline:none;${isLS?'color:#9A9A9A':''}" ></td>
      <td class="num col-hide">
        <select class="supp-sel" onchange="updateSuppUnit('${e.id}',this.value)"
          style="background:transparent;border:none;font-family:'Barlow',sans-serif;font-size:11px;color:#666;outline:none;cursor:pointer">
          ${['/SF','/LF','/LS','/EA'].map(u=>`<option value="${u}"${e.unit===u?' selected':''}>${u}</option>`).join('')}
        </select>
      </td>
      <td class="num" style="color:#9A9A9A;font-size:11px">${escHtml(qtyDisp)}</td>
      <td class="num"><input type="number" class="supp-inp" value="${e.unitCost||''}" placeholder="0"
        oninput="updateSuppField('${e.id}','unitCost',parseFloat(this.value)||0)"
        style="width:80px;background:transparent;border:none;text-align:right;font-family:'Barlow',sans-serif;font-size:12px;outline:none"></td>
      <td class="num" style="font-weight:600;color:#E8A020">$${Math.round(cost).toLocaleString()}</td>
      <td class="col-hide">
        <select class="supp-sel" onchange="updateSuppField('${e.id}','div',this.value)"
          style="background:transparent;border:none;font-family:'Barlow',sans-serif;font-size:11px;color:#666;outline:none;cursor:pointer">
          ${DIVS.map(d=>`<option value="${d}"${e.div===d?' selected':''}>${d}</option>`).join('')}
        </select>
      </td>
      <td class="col-hide"></td>
      <td style="text-align:center;padding:0 4px">
        <button onclick="deleteSuppElement('${e.id}')"
          style="background:none;border:none;color:#CCCCCC;font-size:16px;cursor:pointer;padding:4px 8px;line-height:1"
          title="Remove">×</button>
      </td>`;
    tbody.appendChild(tr);
  });
  /* Add button */
  const addTr=document.createElement('tr');
  addTr.innerHTML=`<td colspan="11" style="padding:0">
    <button class="supp-add-btn" onclick="addSuppElement()"
      style="background:none;border:none;font-family:'Barlow',sans-serif;font-weight:600;font-size:11px;color:#E8A020;cursor:pointer;padding:8px 0 8px 16px;letter-spacing:0.05em">
      + ADD BUILDING ELEMENT
    </button>
  </td>`;
  tbody.appendChild(addTr);
  /* Subtotal row */
  const tot=getSuppTotal();
  const subTr=document.createElement('tr');
  subTr.className='supp-subtotal-row';
  subTr.innerHTML=`
    <td colspan="7" style="text-align:right;padding:6px 8px 6px 0;font-size:10px;color:white;font-weight:700;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.06em;background:#E8A020">SUPPLEMENTAL ELEMENTS SUBTOTAL</td>
    <td class="num" style="font-weight:700;color:white;background:#E8A020;padding:6px 16px" id="supp-subtotal-val">$${Math.round(tot).toLocaleString()}</td>
    <td colspan="3" style="background:#E8A020"></td>`;
  tbody.appendChild(subTr);
}

function renderL2Rows(tbody,s,items,catColor){
  const borderColor=catColor+'66';
  items.forEach(child=>{
    const isLS=child.unitType==='/LS';
    const total=isLS?(child.unitCost||0):(child.qty||0)*(child.unitCost||0);
    const hasL3=!!(L3_DATA&&L3_DATA[child.id]);
    const l3Open=l3Expanded.has(child.id);
    const tr=document.createElement('tr');
    tr.className='l2-row';tr.dataset.lid=child.id;tr.dataset.pid=s.id;
    tr.innerHTML=`
      <td style="padding:2px 4px"><span class="l2-drag-h">⋮⋮</span></td>
      <td style="padding:0;width:4px"><div style="width:4px;height:34px;background:${borderColor};border-left:2px solid ${catColor}88"></div></td>
      <td class="l2-indent">
        ${hasL3?`<span class="l3-chevron${l3Open?' open':''}" onclick="toggleL3('${child.id}',event)" title="Show components">▸</span>`:''}
        <input class="l2-input" type="text" data-field="name" data-lid="${child.id}"
          value="${escHtml(child.name||'')}" placeholder="Division description"
          oninput="updateL2Field('${s.id}','${child.id}','name',this.value)">
      </td>
      <td class="num">
        <input class="l2-num-input" type="number" min="0" value="${isLS?'':child.qty||0}"
          ${isLS?'disabled':''}
          oninput="updateL2Field('${s.id}','${child.id}','qty',parseFloat(this.value)||0)">
      </td>
      <td class="num col-hide">
        <select class="l2-sel" onchange="updateL2Type('${s.id}','${child.id}',this.value)">
          ${['/SF','/LS','/EA','/LF'].map(t=>`<option${t===child.unitType?' selected':''}>${t}</option>`).join('')}
        </select>
      </td>
      <td class="num col-hide" style="color:#9A9A9A;font-size:11px;text-align:center">${isLS?'—':'×'}</td>
      <td class="num">
        <input class="l2-cost-input" type="number" min="0" step="0.01" value="${child.unitCost||0}"
          oninput="updateL2Field('${s.id}','${child.id}','unitCost',parseFloat(this.value)||0)">
      </td>
      <td class="num" style="font-weight:700;font-size:12px">${fmt$(total)}</td>
      <td class="col-hide"></td>
      <td class="col-hide" style="min-width:100px">
        <input class="l2-input" type="text" data-field="notes" data-lid="${child.id}"
          value="${escHtml(child.notes||'')}"
          placeholder="multiplier, notes..."
          style="font-style:italic;color:#6D6D6D;font-size:11px"
          oninput="updateL2Field('${s.id}','${child.id}','notes',this.value)"
          onfocus="showNoteChips(this,'${s.id}','${child.id}','notes')"
          onblur="hideNoteChips()">
      </td>
      <td><button class="l2-del-btn" onclick="deleteL2('${s.id}','${child.id}')" title="Remove">✕</button></td>`;
    tbody.appendChild(tr);
    if(hasL3&&l3Open)renderL3Rows(tbody,child,s,catColor);
  });
  const addRow=document.createElement('tr');
  addRow.innerHTML=`<td colspan="11"><button class="l2-add-btn" onclick="addL2Row('${s.id}')">+ ADD DIVISION ITEM</button></td>`;
  tbody.appendChild(addRow);
}
function toggleL2(sid,evt){
  if(evt)evt.stopPropagation();
  if(expandedSpaces.has(sid))expandedSpaces.delete(sid);
  else expandedSpaces.add(sid);
  saveExpanded();renderTable();
}
function addL2Row(sid){
  const s=program.find(x=>x.id===sid);if(!s)return;
  if(!lineItems[sid])lineItems[sid]=[];
  lineItems[sid].push({id:'l'+uid(),name:'',qty:(s.qty||1)*(s.unitSF||0),unitType:'/SF',unitCost:0,notes:''});
  if(!expandedSpaces.has(sid))expandedSpaces.add(sid);
  saveL2();saveExpanded();renderTable();updateBudget();updateGTN();
}
function deleteL2(sid,cid){
  if(!lineItems[sid])return;
  lineItems[sid]=lineItems[sid].filter(c=>c.id!==cid);
  /* Sync parent unitCostMid */
  const sp=program.find(x=>x.id===sid);
  if(sp){const tsf=(sp.qty||1)*(sp.unitSF||0);const newTotal=lineItems[sid].reduce((s,c)=>s+(c.unitType==='/LS'?(c.unitCost||0):(c.qty||0)*(c.unitCost||0)),0);sp.unitCostMid=tsf>0?newTotal/tsf:0;saveState()}
  saveL2();renderTable();updateBudget();updateGTN();scheduleChartUpdate();
}
function updateL2Field(sid,cid,field,value){
  const items=lineItems[sid];if(!items)return;
  const child=items.find(c=>c.id===cid);if(!child)return;
  child[field]=value;saveL2();
  const row=document.querySelector(`tr[data-lid="${cid}"]`);
  if(row){
    const isLS=child.unitType==='/LS';
    const total=isLS?(child.unitCost||0):(child.qty||0)*(child.unitCost||0);
    const cells=row.querySelectorAll('td');
    if(cells[7])cells[7].textContent=fmt$(total);
  }
  const parentRow=document.querySelector(`tr.data-row[data-id="${sid}"]`);
  if(parentRow){
    const newTotal=items.reduce((sum,c)=>sum+(c.unitType==='/LS'?(c.unitCost||0):(c.qty||0)*(c.unitCost||0)),0);
    const sp=program.find(x=>x.id===sid);
    const tsf=sp?(sp.qty||1)*(sp.unitSF||0):1;
    /* Sync unitCostMid for scenario comparisons */
    if(sp){sp.unitCostMid=tsf>0?newTotal/tsf:0;saveState()}
    const pc=parentRow.querySelectorAll('td');
    if(pc[6])pc[6].innerHTML=`<span style="font-style:italic;color:#3D8B37;cursor:help" title="Derived from division breakdown below">${fmt$(tsf>0?newTotal/tsf:0)}/SF</span>`;
    if(pc[7])pc[7].textContent=fmt$(newTotal);
  }
  updateBudget();updateGTN();scheduleChartUpdate();
}
function updateL2Type(sid,cid,type){
  const items=lineItems[sid];if(!items)return;
  const child=items.find(c=>c.id===cid);if(!child)return;
  child.unitType=type;saveL2();renderTable();updateBudget();updateGTN();
}
function saveL2(){localStorage.setItem('pcl_li',JSON.stringify(lineItems))}
function saveExpanded(){localStorage.setItem('pcl_exp',JSON.stringify([...expandedSpaces]))}
function saveL3Exp(){localStorage.setItem('pcl_l3exp',JSON.stringify([...l3Expanded]))}

/* ════════════════════════════════════
   L3 COMPONENT ROWS (informational only)
════════════════════════════════════ */
function toggleL3(l2Id,evt){
  if(evt)evt.stopPropagation();
  if(l3Expanded.has(l2Id))l3Expanded.delete(l2Id);
  else l3Expanded.add(l2Id);
  saveL3Exp();renderTable();
}
function renderL3Note(note){
  if(!note)return'';
  let h=escHtml(note);
  h=h.replace(/\b(Allowance)\b/gi,'<span class="note-tag note-allowance">$1</span>');
  h=h.replace(/\b(TBC)\b/g,'<span class="note-tag note-tbc">$1</span>');
  h=h.replace(/\b(NIC)\b/g,'<span class="note-tag note-nic">$1</span>');
  h=h.replace(/\b(By Owner)\b/gi,'<span class="note-tag note-by-owner">$1</span>');
  h=h.replace(/\b(Excluded)\b/gi,'<span class="note-tag note-excluded">$1</span>');
  return h;
}
function renderL3Rows(tbody,l2Item,parentSpace,catColor){
  const l3List=L3_DATA[l2Item.id]||[];
  const isL2LS=l2Item.unitType==='/LS';
  const l2Total=isL2LS?(l2Item.unitCost||0):(l2Item.qty||0)*(l2Item.unitCost||0);
  let explicitSum=0;
  const borderCol=catColor+'4D';
  l3List.forEach(item=>{
    const isLS=item.unit==='LS';
    const itemTotal=isLS?item.unitCost:(item.qty||0)*(item.unitCost||0);
    explicitSum+=itemTotal;
    const qtyDisp=isLS?'1':item.qty.toLocaleString();
    const uc=item.unitCost;
    const psDisp=isLS?'Lump Sum':'$'+(Number.isInteger(uc)?uc.toLocaleString():uc.toFixed(2))+'/'+item.unit;
    const tr=document.createElement('tr');tr.className='l3-row';
    tr.innerHTML=`
      <td style="padding:0;width:24px"></td>
      <td style="padding:0;width:6px"><div style="width:3px;height:34px;background:${borderCol}"></div></td>
      <td class="l3-indent" style="border-left:1px solid ${borderCol};background:#F8FBF8;font-family:'Barlow',sans-serif;font-weight:400;font-size:11px;color:#6D6D6D">${escHtml(item.name)}</td>
      <td class="num" style="background:#F8FBF8;font-size:11px;color:#6D6D6D">${qtyDisp}</td>
      <td class="num col-hide" style="background:#F8FBF8;font-size:11px;color:#9A9A9A">${item.unit}</td>
      <td class="num col-hide" style="background:#F8FBF8;font-size:11px;color:#9A9A9A;text-align:center">—</td>
      <td class="num" style="background:#F8FBF8;font-family:'Barlow',sans-serif;font-weight:600;font-size:11px;color:#006330">${psDisp}</td>
      <td class="num" style="background:#F8FBF8;font-family:'Barlow',sans-serif;font-weight:600;font-size:11px;color:#1A1A1A">${fmt$(itemTotal)}</td>
      <td class="col-hide" style="background:#F8FBF8"></td>
      <td class="col-hide" style="background:#F8FBF8;font-size:11px;color:#6D6D6D;padding:2px 8px">${renderL3Note(item.notes||'')}</td>
      <td style="background:#F8FBF8"></td>`;
    tbody.appendChild(tr);
  });
  /* Remaining allowance row */
  const remaining=l2Total-explicitSum;
  const isNeg=remaining<-1;
  const remTr=document.createElement('tr');remTr.className='l3-row l3-remainder';
  if(isNeg){
    remTr.innerHTML=`
      <td style="padding:0;width:24px"></td>
      <td style="padding:0;width:6px"><div style="width:3px;height:34px;background:${borderCol}"></div></td>
      <td colspan="8" style="padding:4px 8px 4px 64px;background:#FFF8E1;border-left:1px solid ${borderCol};font-family:'Barlow',sans-serif;font-size:11px;color:#856404;font-weight:600">
        ⚠ L3 items exceed L2 budget — review costs <span style="font-weight:400">(over by ${fmt$(Math.abs(remaining))})</span>
      </td>
      <td style="background:#FFF8E1"></td>`;
  }else{
    remTr.innerHTML=`
      <td style="padding:0;width:24px"></td>
      <td style="padding:0;width:6px"><div style="width:3px;height:34px;background:${borderCol}"></div></td>
      <td class="l3-indent" style="border-left:1px solid ${borderCol};background:#F8FBF8;font-family:'Barlow',sans-serif;font-weight:300;font-size:11px;color:#9A9A9A;font-style:italic">Remaining allowance</td>
      <td class="num" style="background:#F8FBF8;font-size:11px;color:#9A9A9A">1</td>
      <td class="num col-hide" style="background:#F8FBF8;font-size:11px;color:#9A9A9A">LS</td>
      <td class="num col-hide" style="background:#F8FBF8;font-size:11px;color:#9A9A9A;text-align:center">—</td>
      <td class="num" style="background:#F8FBF8;font-size:11px;color:#9A9A9A;font-style:italic">auto-calc</td>
      <td class="num" style="background:#F8FBF8;font-family:'Barlow',sans-serif;font-weight:600;font-size:11px;color:#9A9A9A;font-style:italic">${fmt$(remaining)}</td>
      <td class="col-hide" style="background:#F8FBF8"></td>
      <td class="col-hide" style="background:#F8FBF8;font-size:11px;color:#9A9A9A;font-style:italic;padding:2px 8px"><span class="note-tag note-allowance">Allowance</span></td>
      <td style="background:#F8FBF8"></td>`;
  }
  tbody.appendChild(remTr);
}

/* ════════════════════════════════════
   INLINE EDITING
════════════════════════════════════ */
function setupEditCells(){
  document.querySelectorAll('.prog-tbl td.editable').forEach(td=>{
    td.addEventListener('click',function(){
      if(this.querySelector('input,select'))return;
      makeEditable(this,this.dataset.id,this.dataset.field);
    });
  });
}
function makeEditable(td,id,field){
  const s=program.find(x=>x.id===id);if(!s)return;
  const oldHtml=td.innerHTML;let input;
  input=document.createElement('input');input.className='inl';
  if(['qty','unitSF','unitCostMid'].includes(field)){input.type='number';input.min='0';input.value=s[field]||0}
  else{input.type='text';input.value=s[field]||''}
  td.innerHTML='';td.appendChild(input);input.focus();
  if(input.select&&input.type!=='number')input.select();
  if(field==='notes'){
    input.addEventListener('focus',()=>showNoteChips(input,id,null,'notes'));
    input.addEventListener('blur',hideNoteChips);
  }
  function commit(){
    const oldVal=s[field];let nv;
    if(['qty','unitSF','unitCostMid'].includes(field))nv=parseFloat(input.value)||0;
    else nv=input.value;
    if(String(nv)!==String(oldVal)){
      s[field]=nv;
      /* When qty or unitSF changes, rebuild division line items */
      if(field==='qty'||field==='unitSF'){
        const newTSF=(s.qty||1)*(s.unitSF||0);
        if(lineItems[s.id]){
          lineItems[s.id]=buildDivLineItems(s.id,s.name,newTSF);
          saveL2();
        }
      }
      logChange('mod',s.name,`${field}: ${oldVal} → ${nv}`);saveState()
    }
    renderTable();updateBudget();updateGTN();updateEscalation();scheduleChartUpdate();
  }
  input.addEventListener('blur',commit);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.blur()}if(e.key==='Escape')td.innerHTML=oldHtml});
}

/* ════════════════════════════════════
   DELETE / ADD ROW
════════════════════════════════════ */
function deleteRow(id){
  const s=program.find(x=>x.id===id);if(!s)return;
  if(!confirm(`Delete "${s.name}"?`))return;
  if(lineItems[id]){delete lineItems[id];saveL2()}
  expandedSpaces.delete(id);saveExpanded();
  Object.keys(adjMatrix).forEach(k=>{if(k.startsWith(id+'-')||k.endsWith('-'+id))delete adjMatrix[k]});
  localStorage.setItem('pcl_adj_matrix',JSON.stringify(adjMatrix));
  program=program.filter(x=>x.id!==id);
  logChange('del',s.name,'Space removed');saveState();
  renderTable();updateBudget();updateGTN();scheduleChartUpdate();
}
function openAddRow(cat){
  document.getElementById('add-cat-sel').value=cat;
  ['add-name','add-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('add-qty').value=1;
  document.getElementById('add-usf').value=1000;
  document.getElementById('add-mid').value=768;
  openModal('add-modal');
}
function confirmAddRow(){
  const name=document.getElementById('add-name').value.trim();
  if(!name){alert('Space name is required.');return}
  const cat=document.getElementById('add-cat-sel').value;
  const m=parseFloat(document.getElementById('add-mid').value)||0;
  const costType=cat==='Parking Structure'?'perstall':cat==='Site Work & Landscape'?'lumpsum':'persf';
  const qty=parseInt(document.getElementById('add-qty').value)||1;
  const usf=parseInt(document.getElementById('add-usf').value)||0;
  const ns={
    id:uid(),category:cat,name,
    qty,unitSF:usf,
    unitCostMid:m,costType,
    notes:document.getElementById('add-notes').value
  };
  program.push(ns);
  /* Populate division line items for new persf space */
  if(costType==='persf'&&usf>0){
    const totalSF=qty*usf;
    const mults=SPACE_MULTIPLIERS[name]||{};
    if(Object.keys(mults).length>0){
      lineItems[ns.id]=buildDivLineItems(ns.id,name,totalSF);
    }else{
      lineItems[ns.id]=[{id:ns.id+'_default',name:'Fit-Out (all divisions)',qty:totalSF,unitType:'/SF',unitCost:m,notes:''}];
    }
    ns.unitCostMid=m;
    saveL2();
  }
  logChange('add',name,`${costType} @ ${fmt$(m)}`);
  saveState();closeModal('add-modal');renderTable();updateBudget();updateGTN();scheduleChartUpdate();
}

/* ════════════════════════════════════
   DRAG AND DROP
════════════════════════════════════ */
function setupDragDrop(){
  const tbody=document.getElementById('prog-tbody');
  tbody.addEventListener('dragstart',e=>{const tr=e.target.closest('tr.data-row');if(!tr)return;dragSrcId=tr.dataset.id;tr.classList.add('dragging');e.dataTransfer.effectAllowed='move'});
  tbody.addEventListener('dragend',()=>{document.querySelectorAll('.data-row.dragging,.data-row.drop-tgt').forEach(el=>el.classList.remove('dragging','drop-tgt'));dragSrcId=null});
  tbody.addEventListener('dragover',e=>{e.preventDefault();const tr=e.target.closest('tr.data-row');if(!tr||tr.dataset.id===dragSrcId)return;document.querySelectorAll('.data-row.drop-tgt').forEach(el=>el.classList.remove('drop-tgt'));tr.classList.add('drop-tgt')});
  tbody.addEventListener('drop',e=>{
    e.preventDefault();const tr=e.target.closest('tr.data-row');
    if(!tr||!dragSrcId||tr.dataset.id===dragSrcId)return;
    const fi=program.findIndex(s=>s.id===dragSrcId),ti=program.findIndex(s=>s.id===tr.dataset.id);
    if(fi===-1||ti===-1||program[fi].category!==program[ti].category)return;
    const[item]=program.splice(fi,1);program.splice(ti,0,item);
    logChange('mod',item.name,'Reordered');saveState();renderTable();
  });
}

/* ════════════════════════════════════
   BENCHMARK
════════════════════════════════════ */
function getBench(name,usf){
  const r=BENCHMARKS[name];if(!r||!usf)return'';
  if(usf<r[0])return`<em class="bench-icon b-lo" title="Below typical range (${r[0].toLocaleString()}–${r[1].toLocaleString()} SF)">↓</em>`;
  if(usf>r[1])return`<em class="bench-icon b-hi" title="Above typical range (${r[0].toLocaleString()}–${r[1].toLocaleString()} SF)">↑</em>`;
  return`<em class="bench-icon b-ok" title="Within typical range (${r[0].toLocaleString()}–${r[1].toLocaleString()} SF)">✓</em>`;
}

/* ════════════════════════════════════
   BUILDING SYSTEMS PANEL (detail view)
════════════════════════════════════ */
function toggleBsEdit(){
  bsEditMode=!bsEditMode;
  localStorage.setItem('pcl_bs_edit',bsEditMode?'1':'0');
  renderBuildingSystems();renderTable(); // refresh main table lock indicators
}
function toggleBsRow(id){
  if(bsExpanded.has(id))bsExpanded.delete(id);
  else bsExpanded.add(id);
  localStorage.setItem('pcl_bsexp',JSON.stringify([...bsExpanded]));
  renderBuildingSystems();
}
function updateBsField(id,field,value){
  if(!bsEdits[id])bsEdits[id]={};
  bsEdits[id][field]=value;
  localStorage.setItem('pcl_bs_edits',JSON.stringify(bsEdits));
}
function renderBuildingSystems(){
  const wrap=document.getElementById('bsys-table-wrap');if(!wrap)return;
  const li=document.getElementById('bsys-lock-icon');
  if(li)li.textContent=bsEditMode?'🔓':'🔒';
  const eb=document.getElementById('bsys-edit-btn');
  if(eb){eb.textContent=bsEditMode?'LOCK SYSTEMS':'EDIT SYSTEMS';eb.className='adj-edit-btn'+(bsEditMode?' locked':'')}
  const bsRefTotal=BUILDING_SYSTEMS.reduce((s,bs)=>s+(bsEdits[bs.id]?.total??bs.total),0);
  let html=`<table class="bsys-tbl"><thead><tr>
    <th style="width:24px"></th><th style="width:60px">Div</th><th>System</th>
    <th class="num">GSF</th><th class="num">$/GSF</th><th class="num">Total Cost</th>
    <th class="num">% Subtotal</th><th class="num col-hide">Notes</th><th style="width:24px"></th>
  </tr></thead><tbody>`;
  BUILDING_SYSTEMS.forEach(row=>{
    const e=bsEdits[row.id]||{};
    const total=e.total!==undefined?e.total:row.total;
    const psf=e.psf!==undefined?e.psf:row.psf;
    const note=e.note!==undefined?e.note:row.note;
    const isExp=bsExpanded.has(row.id);
    const psfDisp=bsEditMode?`<input class="bsys-inp" type="number" step="0.01" value="${psf}" oninput="updateBsField('${row.id}','psf',parseFloat(this.value)||0)">`:`<span class="bsys-psf">$${parseFloat(psf).toFixed(2)}/GSF</span>`;
    const totalDisp=bsEditMode?`<input class="bsys-inp" type="number" value="${total}" oninput="updateBsField('${row.id}','total',parseFloat(this.value)||0)">`:`<span class="bsys-total">$${parseInt(total).toLocaleString()}</span>`;
    const noteDisp=bsEditMode?`<input style="width:100%;font-size:11px;font-style:italic;border:none;border-bottom:1px solid #ccc;background:transparent;font-family:'Barlow',sans-serif;color:#6D6D6D;outline:none" type="text" value="${escHtml(note)}" oninput="updateBsField('${row.id}','note',this.value)">`:`<span style="font-size:11px;font-style:italic;color:#6D6D6D">${escHtml(note)}</span>`;
    const pctOfSub=bsRefTotal>0?(total/bsRefTotal*100).toFixed(2):'0.00';
    html+=`<tr>
      <td><span class="bsys-chevron${isExp?' open':''}" onclick="toggleBsRow('${row.id}')">▶</span></td>
      <td><span class="bsys-div">${escHtml(row.div)}</span></td>
      <td>${escHtml(row.name)}</td>
      <td class="num" style="color:#6D6D6D;font-size:11px">${row.gsf.toLocaleString()}</td>
      <td class="num">${psfDisp}</td>
      <td class="num">${totalDisp}</td>
      <td class="num"><span class="bsys-pct">${pctOfSub}%</span></td>
      <td class="col-hide">${noteDisp}</td>
      <td style="text-align:center;font-size:12px;color:#CCCCCC">${bsEditMode?'':'🔒'}</td>
    </tr>`;
    if(isExp){
      row.subs.forEach(sub=>{
        const se=bsEdits[sub.id]||{};
        const stotal=se.total!==undefined?se.total:sub.total;
        let qtyDisp,psfSubDisp,stotalD;
        if(sub.unitType==='EA'){
          const ea=sub.qty||0;const uc=sub.unitCost||0;
          qtyDisp=ea+' EA';psfSubDisp='$'+uc.toLocaleString()+'/EA';
        }else{
          const spsf=se.psf!==undefined?se.psf:sub.psf;
          qtyDisp=(sub.gsf||97500).toLocaleString()+' GSF';
          psfSubDisp=bsEditMode?`<input class="bsys-inp" type="number" step="0.01" value="${spsf}" oninput="updateBsField('${sub.id}','psf',parseFloat(this.value)||0)">`:`<span class="bsys-psf" style="font-size:11px">$${parseFloat(spsf).toFixed(2)}/GSF</span>`;
        }
        stotalD=bsEditMode?`<input class="bsys-inp" type="number" value="${stotal}" oninput="updateBsField('${sub.id}','total',parseFloat(this.value)||0)">`:`$${parseInt(stotal).toLocaleString()}`;
        html+=`<tr class="bsys-sub-row">
          <td></td>
          <td><span style="font-size:10px;color:#4A7B9D;font-weight:700;font-family:'Barlow Condensed',sans-serif">${escHtml(sub.div||'')}</span></td>
          <td>${escHtml(sub.name)}</td>
          <td class="num" style="font-size:10px;color:#9A9A9A">${qtyDisp}</td>
          <td class="num">${psfSubDisp}</td><td class="num">${stotalD}</td>
          <td class="num" style="color:#9A9A9A">—</td>
          <td class="col-hide"></td><td></td>
        </tr>`;
      });
    }
  });
  html+=`<tr class="bsys-subtotal-row">
    <td></td><td colspan="2">BUILDING SYSTEMS REFERENCE SUBTOTAL</td>
    <td class="num">97,500 GSF</td><td class="num">$${(bsRefTotal/97500).toFixed(2)}/GSF</td>
    <td class="num">$${bsRefTotal.toLocaleString()}</td><td class="num">100%</td>
    <td class="col-hide"></td><td></td>
  </tr></tbody></table>`;
  wrap.innerHTML=html;
}

/* ════════════════════════════════════
   EXPORT
════════════════════════════════════ */
function exportCSV(){
  const hdrs=['Category','Space Name','Qty','Unit SF','Total SF','$/SF Mid (or Unit)','Total Cost Mid','Cost Type','Notes'];
  const rows=program.map(s=>{
    const ct=s.costType||'persf';
    let tsf=0,cost=0,psfLabel='';
    if(ct==='lumpsum'){cost=s.unitCostMid||0;psfLabel='Lump Sum'}
    else if(ct==='perstall'){tsf=(s.qty||1)*(s.unitSF||0);cost=(s.qty||1)*(s.unitCostMid||0);psfLabel=(s.unitCostMid||0)+'/stall'}
    else{tsf=(s.qty||1)*(s.unitSF||0);cost=calcSpaceCost(s);psfLabel=(tsf>0?(cost/tsf):0).toFixed(2)+'/SF'}
    return[s.category,s.name,ct==='lumpsum'?'':s.qty,ct==='lumpsum'?'':s.unitSF||0,ct==='lumpsum'?'':tsf,psfLabel,cost,ct,s.notes||''];
  });
  download([hdrs,...rows].map(r=>r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n'),'burbank-program.csv','text/csv');
}
function exportLogCSV(){
  const hdrs=['Time','Operation','Space','Detail'];
  const rows=changelog.map(e=>[e.ts,e.op.toUpperCase(),e.name||'',e.detail||'']);
  download([hdrs,...rows].map(r=>r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n'),'burbank-changelog.csv','text/csv');
}
function download(content,filename,mime){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:mime}));
  a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(a.href);
}

/* ════════════════════════════════════
   UI HELPERS
════════════════════════════════════ */
function openModal(id){document.getElementById(id).classList.add('show')}
function closeModal(id){document.getElementById(id).classList.remove('show')}
function togglePanel(headEl){
  const panel=headEl.closest('.panel');panel.classList.toggle('collapsed');
  const c=headEl.querySelector('.chevron');if(c)c.textContent=panel.classList.contains('collapsed')?'▲':'▼';
}
function toggleRpPanel(bodyId,chevId){
  const body=document.getElementById(bodyId),chev=document.getElementById(chevId);if(!body)return;
  const hidden=body.style.display==='none';body.style.display=hidden?'':'none';
  if(chev)chev.textContent=hidden?'▼':'▲';
}
function switchTab(name,btn){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');document.getElementById('tab-'+name).classList.add('active');
  if(name==='adj')renderAdj();
}
function setupChips(){
  document.querySelectorAll('.chip').forEach(c=>{
    c.addEventListener('click',function(){
      document.getElementById('ai-input').value=this.dataset.ex||'';
      document.getElementById('ai-input').focus();
    });
  });
}
function dismissBanner(){document.getElementById('mob-banner').style.display='none';localStorage.setItem('pcl_banner','1')}

/* ════════════════════════════════════
   NOTES CHIPS
════════════════════════════════════ */
function showNoteChips(input,pid,cid,field){
  clearTimeout(chipHideTimeout);
  let panel=document.getElementById('note-chips-panel');
  if(!panel){panel=document.createElement('div');panel.id='note-chips-panel';panel.className='note-chips-panel';document.body.appendChild(panel)}
  const tags=['Allowance','NIC','By Owner','Excluded','TBC','Div 11','Div 22','Div 23','Div 26'];
  panel.innerHTML=tags.map(t=>`<span class="note-chip" onmousedown="event.preventDefault()" onclick="appendNoteChip('${pid}','${cid||''}','${field}','${t}')">${t}</span>`).join('');
  const rect=input.getBoundingClientRect();
  panel.style.top=(rect.bottom+2)+'px';
  panel.style.left=rect.left+'px';
  panel.style.display='flex';
}
function hideNoteChips(){
  chipHideTimeout=setTimeout(()=>{const p=document.getElementById('note-chips-panel');if(p)p.style.display='none'},150);
}
function appendNoteChip(pid,cid,field,tag){
  if(cid){
    const items=lineItems[pid];if(!items)return;
    const child=items.find(c=>c.id===cid);if(!child)return;
    const inp=document.querySelector(`input[data-field="${field}"][data-lid="${cid}"]`);
    const cur=inp?inp.value:(child[field]||'');
    const nv=cur?cur+', '+tag:tag;
    child[field]=nv;if(inp)inp.value=nv;saveL2();
  }else{
    const s=program.find(x=>x.id===pid);if(!s)return;
    const inp=document.querySelector(`.prog-tbl td[data-field="notes"][data-id="${pid}"] input.inl`);
    const cur=inp?inp.value:(s[field]||'');
    const nv=cur?cur+', '+tag:tag;
    s[field]=nv;if(inp)inp.value=nv;else renderTable();saveState();
  }
}

/* Close modals on backdrop click */
document.querySelectorAll('.modal-bg').forEach(bg=>{bg.addEventListener('click',e=>{if(e.target===bg)bg.classList.remove('show')})});
