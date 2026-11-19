/* Shared overview graphics. Every palette mark retains its original hex and share. */
(() => {
  'use strict';
  const I=window.AtlasI18n,A=()=>window.AtlasAnalysis;
  const tr=(zh,en)=>I.language()==='en'?en:zh;
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const svg=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
  const pct=n=>(n*100).toFixed(1)+'%';
  const label=r=>I.language()==='en'?(r.en||I.taxon(r.name||r.key)):(r.zh||r.name||r.key);
  function groupName(g){return g.type==='levels'?tr('国家'+g.key+'保护',g.key==='一级'?'Class I protection':'Class II protection'):g.type==='habitats'?label(A().HABITATS.find(h=>h.key===g.key)||g):g.type==='provinces'?window.ATLAS_ECOLOGY.provinceLabels[g.key]?.[I.language()]||g.key:I.taxon(g.name||g.key);}
  function entries(birds){return [...birds].filter(b=>A().metrics(b).valid).sort((a,b)=>window.AtlasSort.compare(a,b,'hue')).map(b=>({bird:b,colours:window.AtlasSort.palette(b,'light').map(c=>({...c,share:b.proportions[c.index]/b.proportions.reduce((s,n)=>s+n,0)}))}));}
  function arc(a,b,outer=94,inner=64){
    const p=(angle,r)=>[110+Math.cos(angle)*r,110+Math.sin(angle)*r];
    const [x1,y1]=p(a,outer),[x2,y2]=p(b,outer),[x3,y3]=p(b,inner),[x4,y4]=p(a,inner),large=b-a>Math.PI?1:0;
    return `M${x1},${y1}A${outer},${outer} 0 ${large} 1 ${x2},${y2}L${x3},${y3}A${inner},${inner} 0 ${large} 0 ${x4},${y4}Z`;
  }
  function paletteStrip(birds,{onBird}={}){
    const data=entries(birds),root=svg('svg',{viewBox:'0 0 1000 32',preserveAspectRatio:'none',class:'avPaletteStrip',role:'img','aria-label':tr('鸟类原有配色','Original bird palettes')});
    data.forEach((entry,i)=>{const g=svg('g',{'data-bird-id':entry.bird.id});let x=i/data.length*1000;entry.colours.forEach(c=>{const r=svg('rect',{x,y:0,width:c.share/data.length*1000+.02,height:32,fill:c.hex});const title=svg('title');title.textContent=I.birdName(entry.bird)+' · '+c.hex+' · '+pct(c.share);r.append(title);g.append(r);x+=c.share/data.length*1000;});if(onBird){g.style.cursor='pointer';g.onclick=()=>onBird(entry.bird);}root.append(g);});return root;
  }
  function paletteRing(birds,{compact=false,onBird}={}){
    const data=entries(birds),root=el('div','avPalette'+(compact?' avCompact':''));
    const ring=svg('svg',{viewBox:'0 0 220 220',class:'avPaletteRing',role:'img','aria-label':tr('由每只鸟的原有五色组成的色环','Colour ring made from each bird’s original five colours')});
    const paths=[];data.forEach((entry,i)=>{const g=svg('g',{'data-bird-id':entry.bird.id});let a=-Math.PI/2+i/data.length*Math.PI*2;entry.colours.forEach(c=>{const b=a+c.share/data.length*Math.PI*2;const p=svg('path',{d:arc(a,b),fill:c.hex});const title=svg('title');title.textContent=I.birdName(entry.bird)+' · '+c.hex+' · '+pct(c.share);p.append(title);g.append(p);a=b;});ring.append(g);paths.push(g);});
    const center=svg('text',{x:110,y:109,'text-anchor':'middle',class:'avRingCount'});center.textContent=birds.length;
    const subtitle=svg('text',{x:110,y:128,'text-anchor':'middle',class:'avRingUnit'});subtitle.textContent=tr('种鸟的配色','bird palettes');ring.append(center,subtitle);root.append(ring);
    if(compact)return root;
    const detail=el('div','avPaletteReadout'),kicker=el('p','avEyebrow',tr('原有五色','ORIGINAL FIVE COLOURS')),select=el('select','avBirdSelect');select.setAttribute('aria-label',tr('查看鸟类配色','Inspect a bird palette'));
    data.forEach((entry,i)=>select.append(new Option(I.birdName(entry.bird),String(i))));
    const swatches=el('div','avSelectedColours'),caption=el('p','avHint',tr('沿色环移动，查看每只鸟的五种颜色。每只鸟在环上占相同的一段。','Move around the ring to explore five colours per bird. Each bird occupies an equal arc.'));
    const open=el('button','avOpenBird',tr('查看这只鸟 ↗','Meet this bird ↗'));open.type='button';open.hidden=!onBird;
    const marker=svg('line',{class:'avRingMarker'});ring.append(marker);
    let selected=0;function show(i){if(!data[i])return;selected=i;select.value=String(i);const angle=-Math.PI/2+(i+.5)/data.length*Math.PI*2;[['x1',110+Math.cos(angle)*96],['y1',110+Math.sin(angle)*96],['x2',110+Math.cos(angle)*104],['y2',110+Math.sin(angle)*104]].forEach(([k,value])=>marker.setAttribute(k,value));const entry=data[i];swatches.replaceChildren();entry.colours.forEach(c=>{const wrap=el('div'),chip=el('i');chip.style.background=c.hex;wrap.append(chip,el('span','',c.hex),el('small','',pct(c.share)));swatches.append(wrap);});paths.forEach((p,j)=>p.classList.toggle('avSelected',i===j));}
    ring.addEventListener('pointerover',e=>{const p=e.target.closest('[data-bird-id]');if(p)show(data.findIndex(d=>String(d.bird.id)===p.dataset.birdId));});
    ring.onclick=e=>{const p=e.target.closest('[data-bird-id]');if(p&&onBird)onBird(data.find(d=>String(d.bird.id)===p.dataset.birdId).bird);};
    select.onchange=()=>show(Number(select.value));open.onclick=()=>onBird?.(data[selected].bird);
    detail.append(kicker,select,swatches,caption,open);root.append(detail);show(0);return root;
  }
  const habitats=[
    ['林木、竹林与灌丛形成层次丰富的空间，为鸟类提供食物、隐蔽处和筑巢地点。','Trees, bamboo and understory create layered spaces for feeding, shelter and nesting.'],
    ['开阔的草原和草甸随季节变化，草籽与昆虫吸引觅食、停歇和繁殖的鸟类。','Open grasslands and meadows offer seeds, insects and seasonal feeding and nesting grounds.'],
    ['河流、湖泊、沼泽与芦苇荡交织，浅水和泥滩让涉禽、水禽各得其所。','Rivers, lakes, marshes and reedbeds connect shallow water and mudflats used by many waterbirds.'],
    ['高山、草甸与高原湿地跨越不同海拔，鸟类在寒冷、开阔的环境中生活。','Alpine slopes, meadows and plateau wetlands form a mosaic of cold, open habitats.'],
    ['海面、海岸与岛屿连接觅食海域和繁殖地点，潮汐不断改变沿岸的食物资源。','Seas, coasts and islands link feeding areas and breeding sites, shaped by changing tides.'],
    ['农田、村落、荒漠、岩地等环境也留下鸟的踪迹，展现不同的生存方式。','Farmland, settlements, deserts and rocky ground support many different ways of life.']
  ];
  const habitatIndex=key=>Math.max(0,A().HABITATS.findIndex(h=>h.key===key));
  const habitatText=key=>tr(...habitats[habitatIndex(key)]);
  function habitatArt(key){
    const root=svg('svg',{viewBox:'0 0 180 100',class:'avHabitatArt','aria-hidden':'true'}),i=habitatIndex(key);
    root.append(svg('circle',{cx:140,cy:23,r:10,class:'avArtSun'}));
    const shapes=[
      ['M12 82Q52 70 95 79T172 74','M28 76V29M16 53L28 28L40 53M19 64L28 44L38 64','M66 77V16M48 51L66 14L84 51M52 65L66 36L80 65','M112 79V38M98 64L112 37L126 64'],
      ['M8 80Q55 63 106 77T174 72','M23 79Q25 61 18 52M23 79Q29 63 36 59','M64 76Q66 49 58 37M64 76Q74 54 79 53','M109 77Q111 61 102 52M109 77Q118 49 124 43','M147 78Q145 62 157 55'],
      ['M8 73Q24 67 40 73T72 73T104 73T136 73T172 73','M18 87Q34 81 50 87T82 87T114 87T146 87','M44 72V24M34 73Q36 48 44 43M56 72Q56 52 48 49','M131 71V34M124 70Q123 53 130 48M141 72Q139 54 131 47'],
      ['M8 80L57 23L100 80M69 80L121 33L174 80','M40 43L56 48L67 37','M103 52L116 55L129 43','M8 89Q80 82 172 88'],
      ['M8 64Q24 52 40 64T72 64T104 64T136 64T172 64','M8 80Q24 68 40 80T72 80T104 80T136 80T172 80','M21 39Q28 32 35 39Q42 32 49 39','M87 47Q94 40 101 47Q108 40 115 47'],
      ['M8 82Q55 70 104 79T174 76','M26 76V48L46 31L66 48V76M39 77V60H52V77','M95 76L116 48L139 77','M145 75V43M134 59L145 43L156 59']
    ][i];
    shapes.forEach(d=>root.append(svg('path',{d,class:'avArtLine'})));return root;
  }
  function habitatGrid(summary,navigate,{compact=false}={}){
    const root=el('div','avHabitats'+(compact?' avCompactHabitats':''));
    A().HABITATS.forEach(h=>{const row=summary.habitatCounts.find(r=>r.key===h.key),count=row?.count||0,b=el('button','avHabitat');b.type='button';b.disabled=!count;b.onclick=()=>navigate('habitats',h.key);b.append(habitatArt(h.key));
      const meter=el('span','avHabitatMeter');meter.style.setProperty('--share',String(count/(summary.species||1)));meter.append(el('strong','',count),el('span','',tr('种','species')));
      b.append(meter,el('span','avHabitatName',label(h)),el('small','',pct(count/(summary.species||1))));b.title=habitatText(h.key);root.append(b);});return root;
  }
  function provinceGrid(summary,navigate,{compact=false}={}){
    const root=el('div','avProvinces'+(compact?' avCompactProvinces':'')),rows=summary.provinceCounts.filter(r=>r.count>0).sort((a,b)=>b.count-a.count),max=Math.max(...rows.map(r=>r.count),1);
    rows.forEach(row=>{const b=el('button','avProvince');b.type='button';b.disabled=!row.count;b.onclick=()=>navigate('provinces',row.key);b.dataset.province=row.key;
      const mark=el('span','avProvinceMark'),circle=el('i');circle.style.width=circle.style.height=(Math.sqrt(row.count/max)*58)+'px';mark.append(circle);b.append(mark,el('span','avProvinceName',label(row)),el('strong','',row.count));b.title=label(row)+' · '+row.count+tr('种鸟 · ',' birds · ')+pct(row.count/(summary.species||1));root.append(b);});return root;
  }
  function colourSummary(summary){const root=el('div','avColourSummary');root.append(el('p','avEyebrow',tr('按色系归纳','COLOUR FAMILIES')));const strip=el('div','avCategoryStrip'),legend=el('div','avCategoryLegend');summary.colorShares.filter(r=>r.share>0).forEach(r=>{const seg=el('span');seg.style.width=(r.share*100)+'%';seg.style.background=r.color;seg.title=label(r)+' '+pct(r.share);strip.append(seg);const text=el('span'),dot=el('i');dot.style.background=r.color;text.append(dot,document.createTextNode(label(r)+' '+pct(r.share)));legend.append(text);});root.append(strip,legend);return root;}
  function stats(summary){const root=el('dl','avStats');[[summary.species,tr('鸟种','species')],[summary.orders,tr('目','orders')],[summary.families,tr('科','families')],[summary.provinces,tr('省级地区记录','regions recorded')]].forEach(([v,k])=>{const d=el('div');d.append(el('dd','',v),el('dt','',k));root.append(d);});return root;}
  function groupCard(group,navigate){const b=el('button','avGroupCard');b.type='button';b.onclick=()=>navigate(group.type,group.key);b.append(paletteRing(group.birds,{compact:true}));const text=el('span','avGroupInfo');text.append(el('strong','',groupName(group)),el('small','',group.summary.species+tr('种 · ',' species · ')+group.summary.provinces+tr('个省级地区',' regions')),el('span','avGroupArrow','↗'));b.append(text);return b;}

  function familyIntro(key){
    const g=A().groups('families').find(g=>g.key===key);if(!g)return '';
    const examples=g.birds.slice(0,3).map(b=>I.birdName(b)).join(tr('、',', ')),top=g.summary.topHabitats[0];
    return tr(key+'属于'+g.parent+'，科内鸟类在分类上较为接近。这里收录'+g.summary.species+'种，包括'+examples+'。'+(top?'在这些成员中，'+top.count+'种有'+label(top)+'生境记录。':''),I.taxon(key)+' belongs to '+I.taxon(g.parent)+', grouping closely related birds. The '+g.summary.species+' species shown here include '+examples+'. '+(top?top.count+' of them have '+label(top).toLowerCase()+' habitat records.':''));
  }
  window.AtlasVisuals={familyIntro,paletteRing,paletteStrip,habitatGrid,provinceGrid,habitatArt,habitatText,groupCard,groupName,stats,colourSummary};
})();
