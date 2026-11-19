(() => {
  'use strict';
  const $=id=>document.getElementById(id), A=()=>window.AtlasAnalysis, I=window.AtlasI18n;
  const lang=()=>I.language(), tr=(zh,en)=>lang()==='en'?en:zh;
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const pct=n=>(100*n).toFixed(1)+'%';
  const number=n=>Number.isFinite(n)?n.toFixed(1):'—';
  const words={catalog:['全部鸟类','All birds'],orders:['按目浏览','By order'],families:['按科浏览','By family'],levels:['按保护等级浏览','By protection level'],habitats:['按生存环境浏览','By habitat'],provinces:['按省份浏览','By province']};
  const copy={
    catalog:{zh:'从一张照片的五种颜色出发，观察中国国家重点保护鸟类的色彩差异。这里汇集分类、生存环境与省级记录，连接整体轮廓和每一只鸟。',en:'Start with five colours from a photograph. Explore the colour patterns of China’s nationally protected birds through their taxonomy, habitats and province records.'},
    orders:{zh:'目是科之上的分类层级。先观察各目在本图谱中的鸟种构成与配色，再进入其中的科与鸟种。',en:'An order groups related families. Compare the species and colour profiles represented here, then explore the families and individual birds within each order.'},
    families:{zh:'科位于目与属之间，将分类上相近的鸟类组织在一起。下列数量仅计算本图谱收录的鸟种，不等于该科的全部物种。',en:'A family sits between order and genus. The counts below describe species included in this atlas, rather than every species in each family.'},
    levels:{zh:'国家重点保护野生动物分为一级和二级。保护等级服务于分类分级保护管理；本图谱依照2021年《国家重点保护野生动物名录》组织鸟类条目。',en:'Nationally protected wildlife is divided into Class I and Class II for conservation management. This atlas follows the bird entries in the 2021 National List of Key Protected Wild Animals.'},
    habitats:{zh:'依据参考资料，将鸟类使用的环境归入六种展示类别。一只鸟可以出现在多种环境中；各类别的数量不能相加作为鸟种总数。',en:'Reference descriptions are organised into six habitat categories. A bird may use several habitats, so category counts do not add up to the total number of species.'},
    provinces:{zh:'按资料中明确列出的省级地区组织鸟类记录。记录可能带有历史、迷鸟等限定，并不表示整个地区的完整分布或种群数量。',en:'Browse province-level regions explicitly recorded in the references. Records may include historical or vagrant occurrences; they are not complete range maps or population counts.'}
  };
  let bridge, state={mode:'catalog',order:'',family:'',comparisonMode:'bird',groups:[]}, view='atlas', signature='', customScope='', allowed=new Set(), nav,panel,custom,analysis;
  const kind=mode=>mode==='catalog'?'all':mode;
  const name=g=>g.type==='habitats'?(lang()==='en'?A().HABITATS.find(h=>h.key===g.key)?.en||g.name:g.name):g.type==='provinces'?window.ATLAS_ECOLOGY?.provinceLabels?.[g.key]?.[lang()]||g.name:g.type==='levels'?tr('国家'+g.key+'保护',g.key==='一级'?'Class I protection':'Class II protection'):I.taxon(g.name);
  const label=row=>lang()==='en'?(row.en||I.taxon(row.name)):(row.zh||row.name);
  const btn=(text,fn,cls='exButton')=>{const n=el('button',cls,text);n.type='button';n.onclick=fn;return n;};
  function scopeGroup(){
    if(['habitats','provinces','levels'].includes(state.mode)&&customScope)return A().groups(state.mode).find(g=>g.key===customScope);
    if(state.mode==='families'&&state.family)return A().groups('families').find(g=>g.key===state.family);
    if(state.mode==='families'&&state.order)return A().groups('orders').find(g=>g.key===state.order);
    return null;
  }
  function heading(title,sub){const h=el('header','exSectionHeading');h.append(el('h3','',title));if(sub)h.append(el('p','',sub));return h;}
  function titleText(){return scopeGroup()?name(scopeGroup()):tr(...words[state.mode]);}
  function barStack(rows,cls='exStack'){
    const n=el('div',cls);n.setAttribute('role','img');n.setAttribute('aria-label',rows.map(r=>label(r)+' '+pct(r.share)).join(', '));
    rows.forEach(r=>{if(!r.share)return;const seg=el('span');seg.style.flexGrow=r.share;seg.style.background=r.color||'#738679';seg.title=label(r)+' '+pct(r.share);n.append(seg);});return n;
  }
  function colourPanel(s,compact=false){
    const n=el('section','exColourPanel');if(!compact)n.append(heading(tr('照片中的色彩构成','Colours in the photographs'),tr('按鸟种等权汇总 · 7个展示色系','Equal weight per bird · 7 display colour groups')));
    n.append(barStack(s.colorShares));const legend=el('div','exLegend');s.colorShares.forEach(r=>{const x=el('div','exLegendItem'),dot=el('i');dot.style.background=r.color;x.append(dot,el('span','',label(r)),el('strong','',pct(r.share)));legend.append(x);});n.append(legend);
    if(!compact){const bright=el('div','exBrightness');bright.append(el('span','exMetricLabel',tr('明暗构成','Lightness composition')),barStack(s.lightBins,'exLightStack'));const keys=el('div','exLightKeys');s.lightBins.forEach(r=>keys.append(el('span','',label(r)+' '+pct(r.share))));bright.append(keys);n.append(bright);}
    return n;
  }
  function facts(s,province=false){const n=el('dl','exFacts');[[s.species,tr('鸟种','species')],[s.orders,tr('目','orders')],[s.families,tr('科','families')],[province?s.habitats:s.provinces,province?tr('生境类别','habitat categories'):tr('省级地区有记录','regions with records')]].forEach(([value,key])=>{const wrap=el('div');wrap.append(el('dt','',key),el('dd','',value));n.append(wrap);});return n;}
  function textSummary(s){
    const colours=s.topColours.slice(0,2).map(r=>label(r)+' '+pct(r.share)).join(tr('、',', '));
    const hab=s.topHabitats[0];
    return tr('这组参考照片中，平均占比较高的色系为'+colours+'。'+(hab?'生境记录以'+label(hab)+'最常见，涉及'+hab.count+'种鸟。':''),'In these reference photographs, the largest mean colour shares are '+colours+'. '+(hab?label(hab)+' is the most frequently recorded habitat ('+hab.count+' species).':''));
  }
  function metrics(s){const n=el('div','exMetricPair');[[number(s.light),tr('平均明度 L*','Mean lightness L*')],[number(s.chroma),tr('平均彩度 C*','Mean chroma C*')]].forEach(([v,k])=>{const x=el('div');x.append(el('strong','',v),el('span','',k));n.append(x);});return n;}
  function countBars(rows,total,type){
    const list=el('div','exCountBars');for(const r of rows){const item=el('div','exCountRow');const text=type?btn(label(r),()=>navigate(type,r.key),'exTextLink'):el('span','',label(r));const track=el('div','exCountTrack'),fill=el('span');fill.style.width=(total?r.count/total*100:0)+'%';fill.style.background=r.color||'var(--ex-accent)';track.append(fill);item.append(text,track,el('span','exCountValue',r.count+' · '+pct(total?r.count/total:0)));list.append(item);}return list;
  }
  function protectedPanel(s){const n=el('section','exProtection');n.append(heading(tr('保护等级构成','Protection levels')));const rows=['一级','二级'].map((k,i)=>({key:k,name:k,zh:'国家'+k+'保护',en:'Class '+(i?'II':'I'),count:s.levelCounts[k]||0,share:s.species?(s.levelCounts[k]||0)/s.species:0,color:i?'#a5b4a7':'#4b6155'}));n.append(barStack(rows));const labels=el('div','exLightKeys');rows.forEach(r=>labels.append(el('span','',label(r)+' · '+r.count+' · '+pct(r.share))));n.append(labels);return n;}
  function sourceLink(text,url){const a=el('a','',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
  function methods(){const d=el('details','exMethods'),s=el('summary','',tr('统计口径与资料依据','How these figures are calculated'));d.append(s);d.append(el('p','',tr('每只鸟的五色比例先归一化，再按色系累加，最后对鸟种取等权平均。色系按 HSV 分组；明度和彩度按颜色占比加权计算。颜色统计仅描述本图谱参考照片，不代表该物种的固定羽色或种群数量。','Each bird’s five colour shares are normalised, grouped by HSV colour category, then averaged with equal weight per bird. Lightness and chroma are weighted by colour share. These colour statistics describe this atlas’s reference photographs, not fixed species plumage or population size.')));d.append(el('p','',tr('生境与省份按鸟种去重计数，允许多选；未列出的地区不能解释为没有分布。当前筛选只影响图谱中的高亮，概览采用整个类别的完整收录记录。','Habitat and province counts deduplicate birds within each category; membership may overlap. An unlisted region does not imply absence. Filters highlight the atlas; overview statistics use the full records of the displayed category.')));for(const key of ['hueRules','light'])d.append(el('p','',A().methodology[key][lang()]));return d;}
  function directory(groups,type){
    const section=el('section','exDirectory');section.append(heading(tr('选择一个'+({orders:'目',families:'科',levels:'等级',habitats:'环境',provinces:'省级地区'}[type]||'分类'),'Explore '+({orders:'an order',families:'a family',levels:'a protection level',habitats:'a habitat',provinces:'a region'}[type]||'a group')),tr('点击名称进入该组的概览与图谱','Select a name to open its overview and atlas')));
    const list=el('div','exDirectoryGrid');groups.forEach((g,i)=>{const row=btn('',()=>navigate(type,g.key),'exDirectoryItem');const title=el('div','exDirectoryTitle');title.append(el('span','exIndex',String(i+1).padStart(2,'0')),el('strong','',name(g)),el('span','exSpeciesCount',g.summary.species+tr('种',' species')));row.append(title,barStack(g.summary.colorShares,'exMiniStack'));const desc=g.description?.[lang()];if(type==='habitats'&&desc)row.append(el('p','',desc));else row.append(el('small','',type==='provinces'?g.summary.orders+tr('目',' orders')+' · '+g.summary.families+tr('科',' families'):g.summary.families+tr('科',' families')+' · '+g.summary.provinces+tr('个省级地区有记录',' regions with records')));list.append(row);});section.append(list);return section;
  }
  function overviewDescription(g,s){
    const V=window.AtlasVisuals;
    if(!g)return tr('中国的重点保护鸟类生活在森林、草原、湿地、高山与海岸，也有许多鸟种随季节迁徙。保护鸟类既关乎物种本身，也关乎它们觅食、繁殖和停歇的环境。这里汇集的 '+s.species+' 种鸟，展现了不同类群、生活环境与羽色的多样性。','China’s nationally protected birds inhabit forests, grasslands, wetlands, mountains and coasts. Many migrate with the seasons. Their conservation connects individual species with the places where they feed, breed and rest. The '+s.species+' birds represented here reveal a rich variety of families, habitats and colours.');
    const examples=g.birds.slice(0,3).map(b=>I.birdName(b)).join(tr('、',', '));
    if(g.type==='families')return V.familyIntro(g.key);
    if(g.type==='orders')return tr(g.key+'将亲缘关系相近的科归在一起。这里的 '+s.species+' 种鸟分属 '+s.families+' 科，包括'+examples+'。'+(s.familyCounts[0]?'其中'+s.familyCounts[0].key+'的成员最多，共 '+s.familyCounts[0].count+' 种。':''),I.taxon(g.key)+' brings related families together. The '+s.species+' species shown here belong to '+s.families+' families, including '+examples+'.');
    if(g.type==='habitats')return V.habitatText(g.key)+tr('这里可见 '+s.species+' 种鸟，分属 '+s.orders+' 目、'+s.families+' 科。',' Here, '+s.species+' species represent '+s.orders+' orders and '+s.families+' families.');
    if(g.type==='provinces')return tr(g.key+'的鸟类记录连接着不同的生活环境。这里可见 '+s.species+' 种重点保护鸟类，包括'+examples+'，分属 '+s.orders+' 目、'+s.families+' 科。',name(g)+' brings together records from different habitats. The '+s.species+' protected birds shown here include '+examples+', spanning '+s.orders+' orders and '+s.families+' families.');
    return tr('国家'+g.key+'保护是国家重点保护野生动物名录中的一个保护级别。这里有 '+s.species+' 种鸟，包括'+examples+'，它们的栖息地与生存状况都需要持续关注。',name(g)+' is a category in China’s national protected-wildlife list. The '+s.species+' birds shown here include '+examples+'. Protecting them also means caring for the habitats they depend on.');
  }
  function visualProtection(s){
    const root=el('section','evProtection');root.append(heading(tr('保护等级','Protection levels'),tr('国家对珍贵、濒危的野生动物实行重点保护，分为一级和二级。','China’s national system gives key protection to rare and endangered wildlife through Class I and Class II.')));
    const cards=el('div','evLevelCards');['一级','二级'].forEach((key,i)=>{const count=s.levelCounts[key]||0,b=btn('',()=>navigate('levels',key),'evLevelCard');b.disabled=!count;
      const dial=el('span','evLevelDial');dial.style.setProperty('--portion',String(count/(s.species||1)*100)+'%');dial.append(el('strong','',count));const words=el('span','evLevelCopy');words.append(el('strong','',tr('国家'+key+'保护',i?'Class II protection':'Class I protection')),el('small','',tr(i?'同样受到国家重点保护，保护工作覆盖物种及其生存环境。':'一级保护对物种实行更严格的保护管理。',i?'National protection covers the birds and the places they depend on.':'Class I carries stricter protection requirements.')),el('span','evLevelShare',pct(count/(s.species||1))+tr(' · 查看鸟类 →',' · Explore birds →')));b.append(dial,words);cards.append(b);});root.append(cards);return root;
  }
  function overview(){
    panel.replaceChildren();const V=window.AtlasVisuals,g=scopeGroup();
    if(!g&&state.mode!=='catalog'&&window.AtlasCategoryOverviews){panel.append(window.AtlasCategoryOverviews.render(state.mode,{navigate,openBird:bridge.open}));return;}
    const birds=g?g.birds:window.ATLAS.birds,s=g?g.summary:A().summarize(birds),page=el('div','evPage');
    if(g){const back=el('div','exScopeBack');back.append(btn(tr('← 返回分类图谱','← Back to grouped atlas'),()=>{customScope='';view='atlas';bridge.mode(g.type==='orders'?'orders':state.mode);},'exTextLink'));page.append(back);}
    const intro=el('section','evIntro'),lead=el('div','evLead');lead.append(el('h2','',g?name(g):tr('中国重点保护鸟类','China’s protected birds')),el('p','',overviewDescription(g,s)));
    if(g?.type==='habitats'){const art=V.habitatArt(g.key);art.classList.add('evHeroHabitat');lead.prepend(art);}
    intro.append(lead,V.stats(s));page.append(intro);
    const colour=el('section','evColour');colour.append(heading(tr('鸟色','Bird colours'),tr('沿色环查看各只鸟的原有配色，选择鸟名可查看对应的五色比例。','Explore the original palettes around the ring; choose a bird to see its five colour shares.')));
    const feature=el('div','evColourFeature'),aside=el('div','evColourAside');aside.append(el('p','evColourObservation',tr('从浅色到深色，一只鸟的五种颜色共同构成它在图谱中的样子。组内不同鸟的配色在环上相接，保留各自的差异。','Five colours, from light to dark, form each bird’s palette. Individual palettes meet around the ring, preserving their differences.')),metrics(s),V.colourSummary(s));feature.append(V.paletteRing(birds,{onBird:bridge.open}),aside);colour.append(feature);page.append(colour);
    const habitat=el('section','evHabitatSection');habitat.append(heading(tr('生存环境','Habitats'),tr('一只鸟可以使用多种环境。选择一幅景观，继续认识其中的鸟。','Birds may use several habitats. Select a landscape to discover its birds.')),V.habitatGrid(s,navigate));page.append(habitat);
    const province=el('section','evProvinceSection');province.append(heading(tr(g?.type==='provinces'?'相连的省份记录':'省份记录',g?.type==='provinces'?'Connected province records':'Province records'),tr('圆的面积随记录鸟种数增加。点击省份，可继续浏览当地记录中的鸟类。','Circle area grows with the number of recorded species. Select a region to explore its birds.')),V.provinceGrid(s,navigate));page.append(province);
    if(g?.type!=='levels')page.append(visualProtection(s));
    if(g?.type==='orders'){const section=el('section','evFamilies');section.append(heading(tr('认识这些科','Explore the families'),tr('每一个色环，连接这个科里的鸟。','Each ring connects the birds in one family.')));const grid=el('div','evFamilyGrid');A().groups('families').filter(f=>f.parent===g.key).forEach(f=>grid.append(V.groupCard(f,navigate)));section.append(grid);page.append(section);}
    if(!g){const entry=el('section','exBrowseDirections');entry.append(heading(tr('继续探索','Explore further')));const links=el('div','exPerspectiveLinks');['orders','families','levels','habitats','provinces'].forEach((type,i)=>{const b=btn('',()=>bridge.mode(type),'exPerspective');b.append(el('span','exIndex','0'+(i+1)),el('strong','',tr(...words[type])),el('span','',A().groups(type).length+tr('个分组 →',' groups →')));links.append(b);});entry.append(links);page.append(entry);}
    panel.append(page);
  }
  function glyph(b){const mode=$('displaySwitch').value,pal=window.AtlasView.palette(b);if(mode==='tiles'){const n=el('div','exSwatches');pal.forEach(c=>{const x=el('span');x.style.background=c.hex;n.append(x);});return n;}return mode==='pie'?window.AtlasPie.draw(b,pal):window.AtlasShapes.draw(b,mode,pal);}
  function renderCustom(){
    const previousLeft=custom.querySelector('.exGroupRail')?.scrollLeft||0;
    custom.replaceChildren();const g=scopeGroup(),groups=g?[g]:A().groups(state.mode);
    if(g){const intro=el('div','exCustomIntro');intro.append(btn(tr('← 全部分类','← All groups'),()=>{customScope='';bridge.mode(state.mode);},'exTextLink'));custom.append(intro);}
    const list=el('div',g?'exScopedFlock':'exGroupRail');list.setAttribute('aria-label',tr('分类鸟色图谱','Grouped bird atlas'));
    for(const group of groups){
      const section=el('section','exFlockGroup'),header=el('header');section.dataset.groupKey=group.key;
      section.style.setProperty('--ex-rows',Math.min(group.birds.length,6));
      header.append(btn(name(group),()=>navigate(state.mode,group.key),'exGroupName'),el('span','',group.birds.length+tr('种',' species')));section.append(header);
      const flock=el('div','exFlock'),ordered=group.birds.slice().sort((a,b)=>window.AtlasSort.compare(a,b,$('colorSort').value));
      ordered.forEach(b=>{const button=btn('',()=>bridge.open(b),'exBird');button.dataset.id=b.id;button.setAttribute('aria-label',I.birdName(b)+', '+I.taxon(b.fam));button.title=I.birdName(b);button.append(glyph(b),el('span','',I.birdName(b)));flock.append(button);});section.append(flock);list.append(section);
    }
    if(!g){
      const controls=el('nav','exRailControls'),jump=el('select'),range=el('input'),position=el('span','exRailPosition');
      controls.setAttribute('aria-label',tr('横向浏览分类','Browse groups horizontally'));
      jump.id='exGroupJump';jump.setAttribute('aria-label',tr('跳转到分类','Jump to group'));jump.append(new Option(tr('跳转到分类…','Jump to a group…'),''));
      groups.forEach(group=>jump.append(new Option(name(group)+' · '+group.birds.length,group.key)));
      const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
      jump.onchange=()=>{const target=[...list.children].find(n=>n.dataset.groupKey===jump.value);if(target)list.scrollTo({left:list.scrollLeft+target.getBoundingClientRect().left-list.getBoundingClientRect().left,behavior:motion()});};
      range.type='range';range.id='exGroupRange';range.min=0;range.max=1000;range.value=0;range.setAttribute('aria-label',tr('横向浏览位置','Horizontal browsing position'));
      range.oninput=()=>{list.scrollLeft=Number(range.value)/1000*(list.scrollWidth-list.clientWidth);};
      const previous=btn('‹',()=>list.scrollBy({left:-list.clientWidth*.85,behavior:motion()}),'exRailArrow'),next=btn('›',()=>list.scrollBy({left:list.clientWidth*.85,behavior:motion()}),'exRailArrow');
      previous.setAttribute('aria-label',tr('向前浏览','Scroll back'));next.setAttribute('aria-label',tr('向后浏览','Scroll forward'));
      controls.append(jump,previous,range,next,position);custom.append(controls);
      const sync=()=>{
        const max=Math.max(0,list.scrollWidth-list.clientWidth);range.value=max?Math.round(list.scrollLeft/max*1000):0;range.disabled=!max;
        previous.disabled=list.scrollLeft<2;next.disabled=list.scrollLeft>=max-2;
        const bounds=list.getBoundingClientRect(),visible=[...list.children].map((n,i)=>({i,r:n.getBoundingClientRect()})).filter(x=>x.r.right>bounds.left+3&&x.r.left<bounds.right-3);
        position.textContent=visible.length?(visible[0].i+1)+'–'+(visible.at(-1).i+1)+' / '+groups.length:'';
      };
      list.addEventListener('scroll',sync,{passive:true});
      list.addEventListener('wheel',e=>{if(!e.shiftKey||e.ctrlKey||Math.abs(e.deltaX)>=Math.abs(e.deltaY))return;e.preventDefault();list.scrollLeft+=e.deltaY*(e.deltaMode===1?16:1);},{passive:false});
      requestAnimationFrame(()=>{
        if(!list.isConnected||custom.hidden)return;
        const headings=[...list.children].map(section=>section.querySelector('header'));
        const headerHeight=Math.max(...headings.map(h=>h.getBoundingClientRect().height));
        headings.forEach(h=>h.style.height=headerHeight+'px');
        const headerSpace=headerHeight+Math.max(...headings.map(h=>parseFloat(getComputedStyle(h).marginBottom)||0))+2;
        const rows=Math.max(2,Math.floor((list.clientHeight-headerSpace+12)/88));
        const rowGap=Math.max(12,(list.clientHeight-headerSpace-rows*76)/Math.max(1,rows-1));list.style.setProperty('--ex-row-gap',rowGap+'px');
        [...list.children].forEach((section,i)=>section.style.setProperty('--ex-rows',Math.min(groups[i].birds.length,rows)));
        list.scrollLeft=previousLeft;sync();
      });
    }
    custom.append(list);filter(allowed);
  }
  function filter(ids){allowed=ids;custom?.querySelectorAll('.exBird').forEach(b=>{b.disabled=!ids.has(Number(b.dataset.id));b.classList.toggle('dim',b.disabled);});}
  function navigate(type,key){
    view='atlas';if(['habitats','provinces','levels'].includes(type)){customScope=key;bridge.mode(type,true);}
    else if(type==='orders')bridge.order(key);else if(type==='families')bridge.family(key);
  }
  let moving=false,motionSerial=0,activeAnimations=[];
  function cancelMotion(){
    motionSerial++;activeAnimations.forEach(a=>a.cancel());activeAnimations=[];moving=false;document.body.classList.remove('exMoving');
  }
  function currentSurface(){return view==='overview'?panel:!custom.hidden?custom:document.querySelector('.catalog');}
  function setView(next,animate=false){
    if(next===view)return;
    cancelMotion();
    const vp=document.querySelector('.gridViewport'),rail=custom?.querySelector('.exGroupRail');
    if(view==='atlas')atlasPosition={x:vp.scrollLeft,y:vp.scrollTop,rail:rail?.scrollLeft||0,scopedY:custom?.querySelector('.exScopedFlock')?.scrollTop||0,page:window.scrollY};
    const serial=motionSerial,dir=next==='overview'?1:-1;
    const commit=()=>{view=next;render();window.scrollTo(0,0);bridge.layout();return new Promise(resolve=>requestAnimationFrame(()=>{
      if(view==='atlas'){vp.scrollTo(atlasPosition.x,atlasPosition.y);custom?.querySelector('.exGroupRail')?.scrollTo(atlasPosition.rail,0);custom?.querySelector('.exScopedFlock')?.scrollTo(0,atlasPosition.scopedY||0);window.scrollTo(0,atlasPosition.page);}
      resolve();
    }));};
    if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){commit();return;}
    moving=true;document.body.classList.add('exMoving');
    (async()=>{
      try{
        const outgoing=currentSurface().animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY('+(-dir*32)+'px)'}],{duration:190,easing:'cubic-bezier(.4,0,.8,.4)',fill:'forwards'});
        activeAnimations.push(outgoing);await outgoing.finished;if(serial!==motionSerial)return;
        await commit();outgoing.cancel();if(serial!==motionSerial)return;
        const incoming=currentSurface().animate([{opacity:0,transform:'translateY('+(dir*48)+'px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.18,.7,.25,1)',fill:'both'});
        activeAnimations.push(incoming);await incoming.finished;
      }catch(error){if(error.name!=='AbortError')console.error(error);}
      finally{if(serial===motionSerial){activeAnimations.forEach(a=>a.cancel());activeAnimations=[];moving=false;document.body.classList.remove('exMoving');}}
    })();
  }
  function render(){
    if(!bridge)return;const compare=state.mode==='compare';nav.hidden=compare;panel.hidden=compare||view!=='overview';custom.hidden=compare||view!=='atlas'||!(['habitats','provinces'].includes(state.mode)||(state.mode==='levels'&&customScope));
    const hidden=!compare&&(view==='overview'||!custom.hidden);document.querySelector('.catalog').hidden=hidden;
    document.body.classList.toggle('exOverview',!compare&&view==='overview');document.body.classList.toggle('exCustom',!custom.hidden);document.body.classList.toggle('exCompareGroups',compare&&state.comparisonMode!=='bird');
    $('ecologyFilters').hidden=true;
    if(compare){analysis.hidden=state.comparisonMode==='bird';if(!analysis.hidden)renderComparison();return;}
    analysis.hidden=true;nav.replaceChildren();nav.className='exScrollCue';
    const direction=view==='atlas'?tr('向下滚动 · 查看分析','Scroll down · Explore analysis'):tr('向上滚动 · 返回图谱','Scroll up · Return to atlas');
    const handle=el('span','exScrollLine');nav.append(handle,el('span','exScrollLabel',direction));
    nav.setAttribute('tabindex','0');nav.setAttribute('role','button');nav.setAttribute('aria-label',direction+tr('。也可按回车切换。','. Press Enter to switch.'));
    nav.title=direction;nav.onclick=()=>setView(view==='atlas'?'overview':'atlas',true);
    nav.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();setView(view==='atlas'?'overview':'atlas',true);}};
    nav.hidden=!!state.selecting;

    if(view==='overview')overview();else if(!custom.hidden)renderCustom();
  }
  function matrix(title,rows,groups,getCell,note){
    const section=el('section','exComparisonSection');section.append(heading(title,note));const wrap=el('div','exTableScroll'),table=el('table','exMatrix'),thead=el('thead'),trh=el('tr');trh.append(el('th','',tr('指标','Category')));groups.forEach(g=>trh.append(el('th','',I.taxon(g.name))));thead.append(trh);table.append(thead);const tbody=el('tbody');rows.forEach(r=>{const row=el('tr'),th=el('th','',label(r));th.scope='row';row.append(th);groups.forEach((g,i)=>{const d=getCell(r,g,i),td=el('td');const bar=el('div','exTableBar'),fill=el('span');fill.style.width=(Math.max(0,Math.min(1,d.share))*100)+'%';fill.style.background=d.color||'var(--ex-accent)';bar.append(fill);td.append(el('span','',d.text),bar);row.append(td);});tbody.append(row);});table.append(tbody);wrap.append(table);section.append(wrap);return section;
  }
  function renderComparison(){
    analysis.replaceChildren();const groups=state.groups.map(g=>({...g,summary:A().summarize(g.birds)}));analysis.append(heading(tr('从配色到生存环境','From colour to habitat'),tr('使用同一标尺，比较组内构成与记录分布','A shared scale for group composition and recorded distribution')));
    const cards=el('div','exCompareProfiles');cards.style.setProperty('--ex-count',groups.length);groups.forEach(g=>{const box=el('section');box.append(el('h3','',I.taxon(g.name)),facts(g.summary),colourPanel(g.summary,true),el('p','exProfileText',textSummary(g.summary)));cards.append(box);});analysis.append(cards);
    const sampleRows=[{key:'species',zh:'收录鸟种',en:'Species in atlas'},{key:'orders',zh:'所属目',en:'Orders'},{key:'families',zh:'所属科',en:'Families'},{key:'habitats',zh:'使用的生境类别',en:'Habitat categories'},{key:'provinces',zh:'有记录的省级地区',en:'Regions with records'},{key:'withProvince',zh:'省份记录明确的鸟种',en:'Birds with province records'},{key:'withoutProvince',zh:'省份待明确的鸟种',en:'Birds with unspecified provinces'}];analysis.append(matrix(tr('分类与记录概况','Taxonomy and records'),sampleRows,groups,(r,g)=>({share:g.summary[r.key]/Math.max(...groups.map(g=>g.summary[r.key]),1),text:g.summary[r.key]}),tr('数量以本图谱收录条目为范围；每行以本次对照最大数量为满长','Atlas entries only; each row is scaled to the largest compared count')));
    analysis.append(matrix(tr('色系平均占比','Mean colour-group shares'),A().CATEGORIES,groups,(r,g)=>{const d=g.summary.colorShares.find(x=>x.key===r.key);return {share:d?.share||0,text:pct(d?.share||0),color:r.color};},tr('统一0–100%标尺 · 每种鸟等权','Shared 0–100% scale · equal weight per bird')));
    analysis.append(matrix(tr('明度与彩度','Lightness and chroma'),[{key:'light',zh:'平均明度 L*',en:'Mean lightness L*'},{key:'chroma',zh:'平均彩度 C*',en:'Mean chroma C*'}],groups,(r,g)=>({share:g.summary[r.key]/(r.key==='light'?100:Math.max(100,...groups.map(g=>g.summary.chroma))),text:number(g.summary[r.key])}),tr('由五色按像素占比加权；L*越高越明亮，C*越高越鲜艳','Weighted by the five colour shares; higher L* is lighter, higher C* is more chromatic')));
    analysis.append(matrix(tr('保护等级','Protection levels'),[{key:'一级',zh:'国家一级保护',en:'Class I'},{key:'二级',zh:'国家二级保护',en:'Class II'}],groups,(r,g)=>({share:g.summary.levelCounts[r.key]/g.summary.species,text:g.summary.levelCounts[r.key]+tr('种 · ',' species · ')+pct(g.summary.levelCounts[r.key]/g.summary.species)}),tr('数量与组内比例','Count and within-group share')));
    analysis.append(matrix(tr('生存环境对照','Habitat comparison'),A().HABITATS,groups,(r,g)=>{const d=g.summary.habitatCounts.find(x=>x.key===r.key);return {share:d?.share||0,text:(d?.count||0)+tr('种 · ',' species · ')+pct(d?.share||0)};},tr('组内鸟种占比；一只鸟可属于多个生境','Within-group species share; a bird may use multiple habitats')));
    const provinceRows=A().summarize(window.ATLAS.birds).provinceCounts;analysis.append(matrix(tr('全部省级地区记录','All province-level records'),provinceRows,groups,(r,g)=>{const d=g.summary.provinceCounts.find(x=>x.key===r.key);return {share:d?.share||0,text:(d?.count||0)+tr('种 · ',' species · ')+pct(d?.share||0)};},tr('组内有该地区记录的鸟种数与占比；不表示种群丰度','Species with a record in each region and their group share; not population abundance')));analysis.append(methods());
  }

  let atlasPosition={x:0,y:0,rail:0,scopedY:0,page:0},lastSwitch=-Infinity,lastWheel=0,wheelTotal=0,touchStart=null;
  function scrollable(target,delta){
    for(let n=target instanceof Element?target:null;n&&n!==document.body;n=n.parentElement){
      const style=getComputedStyle(n);
      if(/auto|scroll/.test(style.overflowY)&&n.scrollHeight>n.clientHeight+2&&
        (delta>0?n.scrollTop+n.clientHeight<n.scrollHeight-2:n.scrollTop>2))return n;
    }
    const doc=document.scrollingElement;
    return (delta>0?doc.scrollTop+innerHeight<doc.scrollHeight-3:doc.scrollTop>2)?doc:null;
  }
  function canTurn(target,delta){
    if(moving||state.mode==='compare'||state.selecting||document.querySelector('dialog[open]')||target?.closest?.('input,select,textarea,[contenteditable=true]'))return false;
    if(view==='atlas'&&delta<=0||view==='overview'&&delta>=0)return false;
    return !scrollable(target,delta);
  }
  function turn(delta){lastSwitch=performance.now();wheelTotal=0;setView(delta>0?'overview':'atlas',true);}
  function installGestures(){
    window.addEventListener('wheel',e=>{
      if(moving&&!document.querySelector('dialog[open]')&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();return;}
      if(e.ctrlKey||e.metaKey||e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!canTurn(e.target,e.deltaY))return;
      e.preventDefault();
      const now=performance.now();if(now-lastSwitch<700)return;
      if(now-lastWheel>220)wheelTotal=0;
      lastWheel=now;wheelTotal+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
      if(Math.abs(wheelTotal)>45)turn(e.deltaY);
    },{passive:false});
    window.addEventListener('keydown',e=>{
      if(moving&&['PageDown','PageUp'].includes(e.key)){e.preventDefault();return;}
      if(e.key==='PageDown'&&canTurn(e.target,1)){e.preventDefault();turn(1);}
      if(e.key==='PageUp'&&canTurn(e.target,-1)){e.preventDefault();turn(-1);}
    });
    window.addEventListener('touchstart',e=>{if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY,target:e.target};},{passive:true});
    window.addEventListener('touchend',e=>{
      if(!touchStart||!e.changedTouches.length)return;
      const dx=touchStart.x-e.changedTouches[0].clientX,dy=touchStart.y-e.changedTouches[0].clientY;
      if(Math.abs(dy)>70&&Math.abs(dy)>Math.abs(dx)*1.5&&performance.now()-lastSwitch>700&&canTurn(touchStart.target,dy))turn(dy);
      touchStart=null;
    },{passive:true});
  }
  window.AtlasExplorer={
    init(callbacks){bridge=callbacks;const catalog=document.querySelector('.catalog');nav=el('nav','exNav');nav.id='explorerNav';panel=el('div','exPanel');panel.id='analysisPanel';custom=el('div','exCustomAtlas');custom.id='ecologyAtlas';analysis=el('div','exComparisonAnalysis');analysis.id='groupComparisonAnalysis';catalog.before(nav,$('pinned'),panel,custom);catalog.append(analysis);analysis.hidden=true;installGestures();},
    update(next){const newSignature=[next.mode,next.mode==='families'?next.order:'',next.mode==='families'?next.family:''].join('|');if(signature!==newSignature){cancelMotion();if(next.mode!=='compare'&&state.mode!=='compare')view='atlas';if(next.mode!==state.mode&&!['habitats','provinces','levels'].includes(next.mode))customScope='';signature=newSignature;}if(next.selecting)view='atlas';state=next;render();},
    filter, setView, navigate,
    pool(mode){return ['habitats','provinces','levels'].includes(mode)&&customScope?A().groups(mode).find(g=>g.key===customScope)?.birds||window.ATLAS.birds:window.ATLAS.birds;},
    reset(){cancelMotion();customScope='';signature='';view='atlas';},
    resetScope(){customScope='';},
    selectPartner(){setView('atlas');},
    isHidden(){return document.querySelector('.catalog').hidden;},
    isCustom(){return !custom?.hidden;},
    getState(){return {view,customScope};},
    restore(saved){if(saved){view=saved.view;customScope=saved.customScope;}},
    copy
  };
})();
