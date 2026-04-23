/* ════════════════════════════════════
   VISUALIZATION DRAWER
════════════════════════════════════ */
function toggleDrawer(){
  drawerOpen=!drawerOpen;
  if(drawerOpen)openDrawer();else closeDrawerFn();
}
function openDrawer(){
  drawerOpen=true;
  document.getElementById('viz-drawer').classList.add('open');
  document.body.classList.add('drawer-open');
  localStorage.setItem('pcl_drawer','1');
  setTimeout(updateCharts,100);
}
function closeDrawerFn(){
  drawerOpen=false;
  document.getElementById('viz-drawer').classList.remove('open');
  document.body.classList.remove('drawer-open');
  localStorage.setItem('pcl_drawer','0');
}
function scheduleChartUpdate(){
  clearTimeout(chartUpdateTimeout);
  chartUpdateTimeout=setTimeout(()=>{if(drawerOpen)updateCharts()},200);
}
function updateCharts(){
  initDonut();initCatBar();initGauge();initPsfBar();
  if(!divChartDone){initDivBar();divChartDone=true;}
}

/* Extended totals for charts */
function getChartTotals(){
  let libCost=0,parkCost=0,siteCost=0;
  program.forEach(s=>{
    const ct=s.costType||'persf';
    const cost=calcSpaceCost(s);
    if(s.category==='Site Work'){siteCost+=cost}
    else if(ct==='perstall'){parkCost+=cost}
    else{libCost+=cost}
  });
  const direct=libCost+parkCost+siteCost;
  const cont=direct*CONTINGENCY_RATE;
  const withCont=direct+cont;
  const gcOhp=withCont*GCOHP_RATE;
  const total=withCont+gcOhp;
  return{libCost,parkCost,siteCost,direct,cont,gcOhp,total};
}

/* Chart 1: Cost Breakdown Donut */
function initDonut(){
  const ctx=document.getElementById('chart-donut');if(!ctx)return;
  if(charts.donut){charts.donut.destroy();charts.donut=null;}
  const{libCost,parkCost,siteCost,cont,gcOhp,total}=getChartTotals();
  const centerTotal=total>0?fmtM(total):'$0';
  charts.donut=new Chart(ctx,{
    type:'doughnut',
    data:{
      labels:['Library Building','Parking Structure','Site Work','Contingency & Escalation','GC/GR/OHP/Design/CA'],
      datasets:[{
        data:[libCost,parkCost,siteCost,cont,gcOhp],
        backgroundColor:['#006330','#6D6D6D','#8BC34A','#FFDF1B','#3D8B37'],
        borderWidth:2,borderColor:'#fff'
      }]
    },
    plugins:[{
      id:'centerText',
      afterDraw(chart){
        const{ctx:c,chartArea}=chart;
        const cx=(chartArea.left+chartArea.right)/2;
        const cy=(chartArea.top+chartArea.bottom)/2;
        c.save();
        c.font='bold 18px Barlow';
        c.fillStyle='#006330';
        c.textAlign='center';
        c.textBaseline='middle';
        c.fillText(centerTotal,cx,cy);
        c.restore();
      }
    }],
    options:{
      cutout:'65%',responsive:true,maintainAspectRatio:true,
      plugins:{legend:{position:'bottom',labels:{font:{family:'Barlow',size:10},boxWidth:12,padding:8}},
        tooltip:{callbacks:{label:function(c){return c.label+': '+fmt$(c.raw)}}}}
    }
  });
}

/* Chart 2: Horizontal Bar by Category */
function initCatBar(){
  const ctx=document.getElementById('chart-cat');if(!ctx)return;
  if(charts.cat){charts.cat.destroy();charts.cat=null;}
  const catCosts={};
  CAT_ORDER.forEach(c=>catCosts[c]=0);
  program.forEach(s=>{
    const ct=s.costType||'persf';
    let cost=0;
    if(ct==='lumpsum')cost=s.unitCostMid||0;
    else if(ct==='perstall')cost=(s.qty||1)*(s.unitCostMid||0);
    else cost=(s.qty||1)*(s.unitSF||0)*(s.unitCostMid||0);
    if(catCosts[s.category]!==undefined)catCosts[s.category]+=cost;
  });
  const labels=CAT_ORDER.filter(c=>catCosts[c]>0);
  const data=labels.map(c=>catCosts[c]);
  const bgColors=labels.map(c=>CAT_COLORS[c]||'#999');
  charts.cat=new Chart(ctx,{
    type:'bar',
    data:{
      labels,
      datasets:[{data,backgroundColor:bgColors,borderWidth:0}]
    },
    options:{
      indexAxis:'y',responsive:true,maintainAspectRatio:true,
      plugins:{legend:{display:false},
        tooltip:{callbacks:{label:c=>fmt$(c.raw)}}},
      scales:{
        x:{ticks:{callback:v=>fmtM(v),font:{family:'Barlow',size:10}},grid:{color:'rgba(0,0,0,0.05)'}},
        y:{ticks:{font:{family:'Barlow',size:10}}}
      }
    }
  });
}

/* Chart 3: Budget Utilization Gauge */
function initGauge(){
  const ctx=document.getElementById('chart-gauge');if(!ctx)return;
  if(charts.gauge){charts.gauge.destroy();charts.gauge=null;}
  const{costMid}=calcTotals();
  const rawPct=TARGET_GMP>0?costMid/TARGET_GMP*100:0;
  const pct=Math.min(rawPct,150);
  const remaining=Math.max(0,100-pct);
  const color=pct<=90?'#006330':pct<=100?'#FFDF1B':'#EF5350';
  charts.gauge=new Chart(ctx,{
    type:'doughnut',
    data:{
      datasets:[{
        data:[pct,remaining,100],
        backgroundColor:[color,'#004d24','transparent'],
        borderWidth:0,
        circumference:180,rotation:270
      }]
    },
    plugins:[{
      id:'gaugeLabel',
      afterDraw(chart){
        const{ctx:c,chartArea}=chart;
        const cx=(chartArea.left+chartArea.right)/2;
        const cy=(chartArea.top+chartArea.bottom)/2+20;
        c.save();
        c.font='bold 26px Barlow';
        c.fillStyle=color;
        c.textAlign='center';
        c.textBaseline='middle';
        c.fillText(Math.round(rawPct)+'%',cx,cy);
        c.font='11px Barlow';
        c.fillStyle='#6D6D6D';
        c.fillText('of '+fmt$(TARGET_GMP).replace(/,\d{3}$/,'M').replace(/^\$(\d+),.*$/,'$$$1M'),cx,cy+22);
        c.restore();
      }
    }],
    options:{
      cutout:'72%',responsive:true,maintainAspectRatio:true,
      plugins:{legend:{display:false},tooltip:{enabled:false}}
    }
  });
}

/* Chart 4: Cost per SF (live) */
function initPsfBar(){
  const ctx=document.getElementById('chart-psf');if(!ctx)return;
  if(charts.psf){charts.psf.destroy();charts.psf=null;}
  const rows=program.filter(s=>s.costType==='persf'&&(s.unitSF||0)>0);
  const labels=rows.map(s=>s.name.length>22?s.name.slice(0,20)+'…':s.name);
  const data=rows.map(s=>s.unitCostMid||0);
  const bgColors=data.map(v=>v>PCL_BASELINE_PSF?'#FFDF1B':'#3D8B37');
  charts.psf=new Chart(ctx,{
    type:'bar',
    data:{
      labels,
      datasets:[
        {label:'$/SF Mid',data,backgroundColor:bgColors,borderWidth:0},
        {label:'PCL Baseline $1,267/SF',data:rows.map(()=>PCL_BASELINE_PSF),type:'line',borderColor:'#006330',borderWidth:2,pointRadius:0,borderDash:[4,4],fill:false,order:0}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{
        legend:{display:true,position:'top',labels:{font:{family:'Barlow',size:10},boxWidth:12}},
        tooltip:{callbacks:{label:c=>fmt$(c.raw)+'/SF'}}
      },
      scales:{
        x:{ticks:{font:{family:'Barlow',size:9},maxRotation:45,minRotation:30},grid:{display:false}},
        y:{ticks:{callback:v=>'$'+v+'/SF',font:{family:'Barlow',size:10}},grid:{color:'rgba(0,0,0,0.05)'}}
      }
    }
  });
}

/* Chart 5: Building Divisions (static) */
function initDivBar(){
  const ctx=document.getElementById('chart-div');if(!ctx)return;
  if(charts.div){charts.div.destroy();charts.div=null;}
  const divData=[
    {label:'Structure (03+05)',v:15844725,c:'#006330'},
    {label:'Enclosure (07+08)',v:11156925,c:'#3D8B37'},
    {label:'Finishes (09)',v:12061725,c:'#4A9B6F'},
    {label:'Furnishings (12)',v:7008300,c:'#8BC34A'},
    {label:'MEP/FP (21-26)',v:26056875,c:'#FFDF1B'},
    {label:'Specialties (10+11)',v:1849575,c:'#6D6D6D'},
    {label:'Conveying (14)',v:3520000,c:'#004d24'},
    {label:'Other (04+06)',v:1947075,c:'#C8C8C8'}
  ];
  charts.div=new Chart(ctx,{
    type:'bar',
    data:{
      labels:['Library Building'],
      datasets:divData.map(d=>({label:d.label,data:[d.v],backgroundColor:d.c,borderWidth:0}))
    },
    options:{
      indexAxis:'y',responsive:true,maintainAspectRatio:true,
      plugins:{legend:{position:'right',labels:{font:{family:'Barlow',size:9},boxWidth:10,padding:6}},
        tooltip:{callbacks:{label:c=>c.dataset.label+': '+fmt$(c.raw)}}},
      scales:{
        x:{stacked:true,ticks:{callback:v=>fmtM(v),font:{family:'Barlow',size:9}},grid:{display:false}},
        y:{stacked:true,display:false}
      }
    }
  });
}

