(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const birds = window.ATLAS.birds;
  const I=window.AtlasI18n, t=I.t, taxon=I.taxon, birdName=I.birdName;
  const species=n=>t("species",{n});
  const colorMode=()=>$("colorSort").value;
  window.AtlasView={palette:bird=>window.AtlasSort.palette(bird,colorMode())};
  const grid = $("grid");
  const viewport = grid.parentElement;
  const detail = $("detailDialog");
  const picker = $("comparisonPicker");
  const tiles = new Map();
  const orders = new Map();
  const pad = id => String(id).padStart(3, "0");
  for (const bird of birds) {
    if (!orders.has(bird.ord)) orders.set(bird.ord, []);
    orders.get(bird.ord).push(bird);
  }
  const largestFirst = [...orders.values()].sort((a,b) => b.length-a.length || a[0].id-b[0].id);
  const narrowLayout = window.matchMedia("(width < 1280px)");
  const indexButtons = new Map();
  const splitOrderAbove = 30;
  let columnSections = [], spans = [], lastCapacity = 0, longestLane = 0;

  let orderBirds = [], lanes = [], columnIndex = new Map(), rowWidth = 0;
  let visualBirds = birds, matches = birds, allowed = new Set();
  let hue = null, focusId = null, origin = null, current = null, mounted = false, pinned = null;
  const groupedView = () => !["catalog","habitats","provinces"].includes(activeMode);
  const familyMap = new Map();
  for (const bird of birds) {
    if (!familyMap.has(bird.fam)) familyMap.set(bird.fam, {name:bird.fam, parent:bird.ord, birds:[]});
    familyMap.get(bird.fam).birds.push(bird);
  }
  let currentGroups = [], activeMode = "catalog", pickerDraft = new Set();
  const comparisonGroups = {
    bird: new Map(birds.map(b => [String(b.id), {name:b.name, parent:b.ord, birds:[b]}])),
    family: familyMap,
    order: new Map(largestFirst.map(list => [list[0].ord, {name:list[0].ord, parent:"", birds:list}]))
  };
  const defaultChoices = () => ({bird:["269","271"], family:["蜂虎科","隼科"], order:["佛法僧目","隼形目"]});
  let comparisonChoices = defaultChoices(), comparisonMode = "bird", browseBeforeComparison = null;
  const chooseLabel = () => t({bird:"chooseBird",family:"chooseFamily",order:"chooseOrder"}[comparisonMode]);
  const comparisonName = group => comparisonMode === "bird" ? birdName(group.birds[0]) : taxon(group.name);
  const selectedKeys = () => comparisonChoices[comparisonMode];
  let focusedFamilies = false, focusCapacity = 0, scopedFamilies = false, scopePlan = null;
  let ribbon = false, ribbonRows = 0, ribbonDrag = null, suppressRibbonClick = false;
  const familyMode = () => activeMode === "families";
  const familyOrder = () => $("familyOrderField").querySelector("input:checked").value;
  const shapesShown = () => ["wings","mosaic","pie"].includes(grid.dataset.display);
  const drawGlyph=(bird,mode,palette)=>mode==="pie"?window.AtlasPie.draw(bird,palette):window.AtlasShapes.draw(bird,mode,palette);
  // Fit square silhouettes to both axes, including the space between neighbours.
  function wingGrid(width, height, count, gap) {
    let best = {columns:1, size:0};
    for (let columns=1; columns<=count; columns++) {
      const rows = Math.ceil(count / columns);
      const size = Math.min((width-(columns-1)*gap)/columns, (height-(rows-1)*gap)/rows);
      if (size > best.size) best = {columns, size};
    }
    return best;
  }
  function ribbonMetrics() {
    if (shapesShown() || activeMode === "orders") {
      const wings = shapesShown();
      const height = wings ? Math.max(40, Math.min(62, viewport.clientWidth / 26)) : 30;
      const gap = wings ? 12 : 8;
      const rows = Math.max(1, Math.min(wings ? 12 : 22, Math.floor((viewport.clientHeight-150+gap)/(height+gap))));
      const width = wings ? height : Math.max(84, Math.min(116, viewport.clientWidth/17));
      return {rows,width,height};
    }
    const rows=Math.max(1,Math.ceil(Math.max(...currentGroups.map(g=>g.birds.length))/2));
    const width=Math.max(48,Math.min(100,(viewport.clientWidth-240)/21));
    const height=Math.max(4,Math.min(26,Math.floor((viewport.clientHeight-145-(rows-1)*4)/rows)));
    return {height,width,rows};
  }
  let levelZoom = false;
  function levelMetrics(){
    if (shapesShown() && !levelZoom) {
      const width = Math.max(48,(viewport.clientWidth-32)/2);
      const height = Math.max(100,viewport.clientHeight-74);
      const fit = wingGrid(width,height, Math.max(1,...currentGroups.map(g=>g.birds.length)),5);
      const lanes = Math.min(fit.columns, Math.max(1, Math.floor((width+5)/29)));
      return {lanes,height:Math.max(24,Math.floor(fit.size))};
    }
    if (levelZoom) {
      const lanes = viewport.clientWidth >= 1150 ? 6 : 5;
      if (shapesShown()) {
        const pane = innerWidth <= 720 ? viewport.clientWidth : (viewport.clientWidth-28)/2;
        return {lanes, height:Math.min(140,Math.floor((pane-25-(lanes-1)*8)/lanes))};
      }
      return {lanes, height:Math.max(36, Math.min(110, Math.floor(viewport.clientWidth / (lanes * 3.2))))};
    }
    const width=Math.max(80,(viewport.clientWidth-28)/2), height=Math.max(160,viewport.clientHeight-70);
    const count=Math.max(1,...currentGroups.map(g=>g.birds.length));
    const lanes=Math.max(1,Math.ceil(count/Math.max(1,Math.floor((height+8)/12))),Math.ceil(Math.sqrt(count*width/height/2)));
    const rows=Math.ceil(count/lanes);
    return {lanes,rows,height:Math.max(4,Math.min(60,Math.floor((height-(rows-1)*8)/rows)))};
  }
  function capacityForFocus() {
    const width=Math.min(viewport.clientWidth,1380), count=activeMode==="compare" && innerWidth<=900 ? Math.min(2,currentGroups.length) : currentGroups.length;
    const maxBirds=Math.max(...currentGroups.map(group=>group.birds.length));
    const unit=shapesShown() ? 82 : 126;
    const cap=Math.max(1,Math.min(shapesShown()?12:6,maxBirds,Math.floor((width-(count-1)*28-count*15)/count/unit)));
    return Math.ceil(maxBirds/Math.ceil(maxBirds/cap));
  }

  function scopeSignature() {
    return [Math.floor(viewport.clientWidth),Math.floor(viewport.clientHeight),innerWidth>=1000].join(":");
  }
  // Allocate equal-sized bird cards, then give each family the lanes it needs.
  // Evaluate row counts so both the family headings and every palette fit.
  function planScope() {
    const width=Math.max(160,viewport.clientWidth-4), fit=innerWidth>=1000;
    const availableHeight=fit?viewport.clientHeight:Infinity;
    const targetWidth=shapesShown()?76:172;
    const targetHeight=shapesShown()?90:60;
    const minimum=shapesShown()?52:80;
    const minWidth=fit?Math.min(minimum,Math.max(64,Math.floor(width/14))):minimum;
    const counts=currentGroups.map(g=>g.birds.length), total=counts.reduce((s,n)=>s+n,0);
    let best=null;
    for(let rows=1;rows<=Math.max(...counts);rows++){
      const laneCounts=counts.map(n=>Math.ceil(n/rows));
      const widths=laneCounts.map(n=>n*minWidth+(n-1)*8);
      if(widths.some(w=>w>width))continue;
      const bands=[];let band=[],used=0;
      widths.forEach((w,i)=>{
        if(band.length && used+20+w>width){bands.push(band);band=[];used=0;}
        used+=w+(band.length?20:0);band.push(i);
      });
      if(band.length)bands.push(band);
      const bandRows=bands.map(b=>Math.max(...b.map(i=>Math.ceil(counts[i]/laneCounts[i]))));
      const allRows=bandRows.reduce((s,n)=>s+n,0);
      const fixed=4+bands.length*64+(bands.length-1)*18+(allRows-bands.length)*8;
      const height=Math.min(targetHeight,(availableHeight-fixed)/allRows);
      if(height<(shapesShown()?45:18))continue;
      let cost=0;
      bands.forEach(b=>{
        const tracks=b.reduce((s,i)=>s+laneCounts[i],0);
        const unit=(width-(b.length-1)*20-(tracks-b.length)*8)/tracks;
        b.forEach(i=>{cost+=counts[i]*(Math.log(unit/targetWidth)**2+2*Math.log(height/targetHeight)**2);});
      });
      cost=cost/total+bands.length*.025;
      if(!best || cost<best.cost)best={bands,lanes:laneCounts,height:Math.floor(height),cost,key:scopeSignature()};
    }
    // Only very short windows need natural page scrolling; never clip cards.
    if(!best){
      const lanes=counts.map(n=>Math.min(n,Math.max(1,Math.floor(width/(targetWidth+8)))));
      best={bands:counts.map((_,i)=>[i]),lanes,height:targetHeight,key:scopeSignature()};
    }
    return best;
  }
  function buildScope() {
    const fragment=document.createDocumentFragment();
    scopePlan.bands.forEach(indices=>{
      const band=document.createElement("div");band.className="orderBand";
      band.style.setProperty("--group-tracks",indices.map(i=>scopePlan.lanes[i]+"fr").join(" "));
      band.append(...indices.map(i=>columnSections[i]));fragment.append(band);
    });
    grid.replaceChildren(fragment);lastCapacity=-2;
  }

  function clearTip() { $("tip").hidden = true; }
  function showTip(bird, x, y) {
    const tip = $("tip");
    tip.textContent = pad(bird.id) + "　" + birdName(bird) + "　" + taxon(bird.fam) + (shapesShown() && !window.AtlasShapes.shares(bird) ? " · "+t("sharesMissing") : "");
    tip.hidden = false;
    tip.style.left = Math.max(3, Math.min(innerWidth-tip.offsetWidth-4, x+10)) + "px";
    tip.style.top = (y>tip.offsetHeight+12 ? y-tip.offsetHeight-8 : Math.min(innerHeight-tip.offsetHeight-2, y+15)) + "px";
  }
  function updateFocus(id) {
    if (focusId !== null) tiles.get(focusId).tabIndex = -1;
    focusId = id;
    if (id !== null) tiles.get(id).tabIndex = 0;
  }
  function reveal(bird, scrollPage = true) {
    const tile = tiles.get(bird.id);
    if (ribbon) {
      const frame=viewport.getBoundingClientRect(), r=tile.getBoundingClientRect();
      const dx=r.left<frame.left+3 ? r.left-frame.left-3 : Math.max(0,r.right-frame.right+3);
      viewport.scrollBy(dx,0);
      return;
    }
    if (!groupedView() || (activeMode === "levels" && levelZoom)) {
      tile.scrollIntoView({block:"nearest", inline:"nearest"});
      return;
    }
    const band = tile.closest(".orderBand");
    const pane = narrowLayout.matches && !focusedFamilies ? band : viewport;
    const frame = pane.getBoundingClientRect();
    const r = tile.getBoundingClientRect();
    const heading = tile.closest(".orderColumn").firstElementChild;
    const top = frame.top + pane.clientTop + heading.offsetHeight + 4;
    const bottom = frame.top + pane.clientTop + pane.clientHeight;
    const dy = r.top < top ? r.top-top : Math.max(0, r.bottom-bottom);
    pane.scrollBy(0, dy);
    if (scrollPage) {
      const shown = tile.getBoundingClientRect();
      if (shown.top < 0) window.scrollBy(0, shown.top - 8);
      else if (shown.bottom > innerHeight) window.scrollBy(0, shown.bottom - innerHeight + 8);
    }
  }
  function focusBird(bird) {
    if (!bird) return;
    const tile = tiles.get(bird.id);
    updateFocus(bird.id);
    tile.focus({preventScroll:true});
    reveal(bird);
    if (tile.matches(":focus-visible")) {
      const r = tile.getBoundingClientRect();
      showTip(bird, r.left, r.top);
    }
  }
  function comparisonChanged(anchor) {
    if (pinned) tiles.get(pinned.id).classList.remove("pinned");
    pinned = anchor;
    if (pinned) tiles.get(pinned.id).classList.add("pinned");
    $("pinned").hidden = !pinned;
    $("comparisonPromptTitle").textContent = pinned ? t("selectPartner",{name:birdName(pinned)}) : "";
    $("comparisonPromptHint").textContent = t("selectPartnerHint");
    $("comparisonAnchor").replaceChildren(...(pinned ? [window.AtlasShapes.draw(pinned,"wings",window.AtlasView.palette(pinned))] : []));
    for (const bird of birds) {
      const tile=tiles.get(bird.id);
      tile.setAttribute("aria-haspopup", pinned ? "false" : "dialog");
      tile.setAttribute("aria-label",pad(bird.id)+" "+birdName(bird)+", "+taxon(bird.ord)+", "+taxon(bird.fam)+", "+t(pinned ? "selectForComparison" : "detail"));
    }
  }
  function beginComparison(bird) {
    if (!bird) return;
    detail.close();
    if (activeMode === "compare") leaveComparison();
    comparisonChanged(bird);
    window.AtlasExplorer.selectPartner();
    requestAnimationFrame(()=>$("cancelComparison").focus({preventScroll:true}));
  }
  $("cancelComparison").onclick=()=>{
    const anchor=pinned;
    comparisonChanged(null);
    if (anchor && allowed.has(anchor.id)) {if(window.AtlasExplorer.isCustom())document.querySelector('.exBird[data-id="'+anchor.id+'"]')?.focus();else focusBird(anchor);}
  };
  $("chooseFromAll").onclick=()=>{
    $("order").value="";families();$("family").value="";
    $("search").value="";$("levelFilter").value="";$("hueFilter").value="";hue=null;
    window.AtlasEcology.reset();
    renderArrangement("catalog");
    window.AtlasExplorer.selectPartner();
    focusBird(matches.find(b=>b.id!==pinned?.id));
  }
  function displayBird(bird) {
    current = bird;
    if (!mounted) {
      window.Specimen.mount($("specimen"), bird, beginComparison);
      mounted = true;
    } else {
      window.Specimen.show(bird);
    }
    const i = matches.indexOf(bird);
    $("previous").disabled = i < 1;
    $("next").disabled = i < 0 || i === matches.length-1;
    detail.scrollTop = 0;
  }
  function openBird(bird) {
    if (!allowed.has(bird.id)) return;
    clearTip();
    if (pinned) {
      if (pinned.id === bird.id) {
        $("comparisonPromptHint").textContent=t("selectDifferent");
        return;
      }
      comparisonChoices.bird=[String(pinned.id),String(bird.id)];
      comparisonMode="bird";
      comparisonChanged(null);
      enterComparison();
      return;
    }
    origin = bird.id;
    updateFocus(bird.id);
    detail.showModal();
    displayBird(bird);
  }
  function step(delta) {
    const bird = matches[matches.indexOf(current)+delta];
    if (bird) displayBird(bird);
  }
  $("closeDetail").onclick = () => detail.close();
  detail.addEventListener("close", () => {
    if (mounted) window.Specimen.show(null);
    current = null;
    clearTip();
    if (!pinned && allowed.has(origin)) {const target=window.AtlasExplorer.isCustom()?document.querySelector('.exBird[data-id="'+origin+'"]'):tiles.get(origin);target?.focus({preventScroll:true});}
  });
  $("previous").onclick = () => step(-1);
  $("next").onclick = () => step(1);
  detail.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      step(e.key === "ArrowLeft" ? -1 : 1);
    }
  });
  for (const dialog of [detail,picker]) dialog.addEventListener("click", e => {
    if (e.target === dialog) dialog.close();
  });


  function acrossColumns(col, row, direction) {
    for (let c=col+direction; c>=0 && c<lanes.length; c+=direction) {
      const group = lanes[c];
      let nearest, distance = Infinity;
      group.forEach((bird, i) => {
        if (allowed.has(bird.id) && Math.abs(i-row) < distance) {
          nearest = bird;
          distance = Math.abs(i-row);
        }
      });
      if (nearest) return nearest;
    }
  }
  function keyboard(e, bird) {
    const key = e.key;
    if (!["Home","End","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(key)) return;
    e.preventDefault();
    if (key === "Home" || key === "End") {
      focusBird(key === "Home" ? matches[0] : matches.at(-1));
      return;
    }
    const dir = key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;
    const vertical = key === "ArrowDown" || key === "ArrowUp";
    if (activeMode === "levels" && levelZoom) {
      const group = orderBirds.find(group => group.includes(bird));
      const step = vertical ? focusCapacity : 1;
      for (let i = group.indexOf(bird) + dir * step; i >= 0 && i < group.length; i += dir * step) {
        if (allowed.has(group[i].id)) return focusBird(group[i]);
      }
      return;
    }
    if (groupedView()) {
      const [c,r] = columnIndex.get(bird.id);
      if (!vertical) return focusBird(acrossColumns(c, r, dir));
      const group = lanes[c];
      for (let j=r+dir; j>=0 && j<group.length; j+=dir) {
        if (allowed.has(group[j].id)) return focusBird(group[j]);
      }
    } else if (vertical) {
      for (let j=visualBirds.indexOf(bird)+dir*rowWidth; j>=0 && j<visualBirds.length; j+=dir*rowWidth) {
        if (allowed.has(visualBirds[j].id)) return focusBird(visualBirds[j]);
      }
    } else {
      focusBird(matches[matches.indexOf(bird)+dir]);
    }
  }
  for (const bird of birds) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.dataset.id = bird.id;
    tile.tabIndex = -1;
    tile.setAttribute("aria-label", pad(bird.id)+" "+birdName(bird)+", "+taxon(bird.ord)+", "+taxon(bird.fam)+", "+t("detail"));
    tile.setAttribute("aria-haspopup","dialog");
    for (const colour of window.AtlasView.palette(bird)) {
      const stripe = document.createElement("i");
      stripe.style.backgroundColor = colour.hex;
      stripe.dataset.colorIndex=colour.index;
      tile.append(stripe);
    }
    const tileName = document.createElement("span");
    tileName.className = "tileName";
    tileName.textContent = birdName(bird);
    tile.append(tileName);
    tile.onclick = () => openBird(bird);
    tile.onpointermove = e => {
      if (e.pointerType !== "touch" && !tile.disabled && !ribbonDrag?.moved) showTip(bird, e.clientX, e.clientY);
    };
    tile.onpointerleave = clearTip;
    tile.onblur = clearTip;
    tile.onfocus = () => {
      if (tile.disabled) return;
      updateFocus(bird.id);
      if (tile.matches(":focus-visible")) {
        const r = tile.getBoundingClientRect();
        showTip(bird, r.left, r.top);
      }
    };
    tile.onkeydown = e => keyboard(e, bird);
    tiles.set(bird.id, tile);
  }

  function buildRibbon() {
    const fragment=document.createDocumentFragment(), clusters=new Map();
    const taxonomy=familyMode() && familyOrder()==="taxonomy";
    currentGroups.forEach((group,i)=>{
      if(!taxonomy){fragment.append(columnSections[i]);return;}
      if(!clusters.has(group.parent)){
        const cluster=document.createElement("section"), heading=document.createElement("h2"), label=document.createElement("button"), body=document.createElement("div");
        cluster.className="orderCluster";cluster.dataset.order=group.parent;
        heading.className="clusterHeading";heading.id="order-cluster-"+i;
        cluster.setAttribute("aria-labelledby",heading.id);
        label.className="clusterLabel";label.type="button";label.textContent=taxon(group.parent);
        label.onclick=()=>enterOrder(group.parent);
        heading.append(label);body.className="clusterFamilies";cluster.append(heading,body);
        clusters.set(group.parent,body);fragment.append(cluster);
      }
      clusters.get(group.parent).append(columnSections[i]);
    });
    grid.replaceChildren(fragment);
    const jump=$("ribbonJump");
    jump.setAttribute("aria-label",t(activeMode==="orders" ? "allOrders" : taxonomy ? "jumpOrder" : "jumpFamily"));
    const names=taxonomy ? [...clusters.keys()] : currentGroups.map(g=>g.name);
    jump.replaceChildren(new Option(t(activeMode==="orders" ? "allOrders" : taxonomy ? "jumpOrder" : "jumpFamily"),""),...names.map(name=>new Option(taxon(name),name)));
  }
  function scrollToRibbonFamily(name, behavior="instant") {
    const target=columnSections.find(s=>s.dataset.family===name);
    if(!target)return;
    const left=viewport.scrollLeft+target.getBoundingClientRect().left-viewport.getBoundingClientRect().left-3;
    viewport.scrollTo({left,behavior});updateRibbonNav();
  }
  function updateRibbonNav() {
    if(!ribbon)return;
    const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth), position=viewport.scrollLeft;
    $("ribbonPrevious").disabled=position<2;
    $("ribbonNext").disabled=position>=max-2;
    $("ribbonRange").disabled=max<1;
    $("ribbonRange").value=max ? Math.round(position/max*1000) : 0;
    const frame=viewport.getBoundingClientRect();
    const shown=columnSections.map((s,i)=>({i,r:s.getBoundingClientRect()})).filter(({r})=>r.right>frame.left+3&&r.left<frame.right-3);
    $("ribbonPosition").textContent=shown.length ? (shown[0].i+1)+"–"+(shown.at(-1).i+1)+" / "+t(activeMode==="orders"?"orderCount":"familyCount",{n:currentGroups.length}) : t(activeMode==="orders"?"orderCount":"familyCount",{n:currentGroups.length});
  }
  const scrollMotion=()=>matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth";
  $("ribbonPrevious").onclick=()=>viewport.scrollBy({left:-viewport.clientWidth*.85,behavior:scrollMotion()});
  $("ribbonNext").onclick=()=>viewport.scrollBy({left:viewport.clientWidth*.85,behavior:scrollMotion()});
  $("ribbonRange").oninput=()=>{viewport.scrollLeft=Number($("ribbonRange").value)/1000*(viewport.scrollWidth-viewport.clientWidth);updateRibbonNav();};
  $("ribbonJump").onchange=()=>{
    const value=$("ribbonJump").value;
    const target=familyMode() && familyOrder()==="taxonomy" ? currentGroups.find(g=>g.parent===value)?.name : value;
    if(target)scrollToRibbonFamily(target,scrollMotion());
  };
  viewport.addEventListener("scroll",updateRibbonNav,{passive:true});
  viewport.addEventListener("wheel",e=>{
    if(!ribbon||e.ctrlKey||!e.shiftKey||Math.abs(e.deltaX)>=Math.abs(e.deltaY))return;
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientWidth:1);
    const next=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,viewport.scrollLeft+delta));
    if(Math.abs(next-viewport.scrollLeft)>0){e.preventDefault();viewport.scrollLeft=next;}
  },{passive:false});
  viewport.addEventListener("pointerdown",e=>{
    if(!ribbon||e.pointerType!=="mouse"||e.button!==0||e.target.closest("button:not(.tile),input,select,a"))return;
    ribbonDrag={id:e.pointerId,x:e.clientX,left:viewport.scrollLeft,moved:false};suppressRibbonClick=false;
  });
  viewport.addEventListener("pointermove",e=>{
    if(!ribbonDrag||ribbonDrag.id!==e.pointerId)return;
    if(!ribbonDrag.moved&&Math.abs(e.clientX-ribbonDrag.x)>7){ribbonDrag.moved=true;viewport.setPointerCapture(e.pointerId);viewport.classList.add("isDragging");}
    if(ribbonDrag.moved){e.preventDefault();clearTip();viewport.scrollLeft=ribbonDrag.left+ribbonDrag.x-e.clientX;}
  });
  function endRibbonDrag(){
    suppressRibbonClick=Boolean(ribbonDrag?.moved);ribbonDrag=null;viewport.classList.remove("isDragging");
    setTimeout(()=>{suppressRibbonClick=false;},0);
  }
  viewport.addEventListener("pointerup",endRibbonDrag);
  viewport.addEventListener("pointercancel",endRibbonDrag);
  viewport.addEventListener("pointerleave",()=>{if(!ribbonDrag?.moved)ribbonDrag=null;});
  viewport.addEventListener("click",e=>{if(suppressRibbonClick){e.preventDefault();e.stopPropagation();}},{capture:true});

  function fitBands() {
    if(scopedFamilies){if(lastCapacity!==-2)buildScope();return;}
    if (ribbon) {
      if (lastCapacity !== -1) { buildRibbon(); lastCapacity=-1; }
      return;
    }
    const total = spans.reduce((sum, span) => sum + span, 0);
    if (!total) return;
    const minimumWidth = familyMode() ? 96 : 56;
    const wrap = narrowLayout.matches || (familyMode() && !focusedFamilies);
    const capacity = focusedFamilies ? total : wrap ? Math.max(...spans, Math.floor(viewport.clientWidth / minimumWidth)) : total;
    if (capacity === lastCapacity) return;
    lastCapacity = capacity;
    const focused = grid.contains(document.activeElement) ? document.activeElement : null;
    const bands = document.createDocumentFragment();
    let start = 0, remaining = total;
    while (start < spans.length) {
      const target = Math.ceil(remaining / Math.ceil(remaining / capacity));
      let end = start + 1, tracks = spans[start];
      while (end < spans.length && tracks + spans[end] <= target) tracks += spans[end++];
      const band = document.createElement("div");
      band.className = "orderBand";
      band.style.setProperty("--band-cols", tracks);
      band.style.setProperty("--group-tracks", spans.slice(start, end).map(span => focusedFamilies ? "1fr" : span > 1 ? "1.65fr" : "1fr").join(" "));
      band.append(...columnSections.slice(start, end));
      bands.append(band);
      remaining -= tracks;
      start = end;
    }
    grid.replaceChildren(bands);
    if (focused) focused.focus({preventScroll:true});
  }
  function layout() {
    if(window.AtlasExplorer?.isHidden())return;
    grid.dataset.density = "normal";
    if (groupedView()) {
      if(activeMode==="levels"){const m=levelMetrics();if(focusCapacity!==m.lanes){renderArrangement(activeMode);return;}fitBands();grid.style.setProperty("--tile-height",m.height+"px");return;}
      if(scopedFamilies){
        if(scopePlan.key!==scopeSignature()){renderArrangement(activeMode);return;}
        fitBands();grid.style.setProperty("--tile-height",scopePlan.height+"px");
        grid.dataset.labelled=String(scopePlan.height>=(shapesShown()?66:42));return;
      }
      if (ribbon) {
        const metrics=ribbonMetrics();
        if(metrics.rows!==ribbonRows){renderArrangement(activeMode,true);return;}
        grid.style.setProperty("--ribbon-card-width",metrics.width+"px");
        grid.style.setProperty("--ribbon-tile-height",metrics.height+"px");
        fitBands();updateRibbonNav();return;
      }
      if (focusedFamilies && capacityForFocus() !== focusCapacity) {
        renderArrangement(activeMode);
        return;
      }
      fitBands();
      grid.style.setProperty("--heading-font", "13px");
      grid.style.setProperty("--tile-height", shapesShown() ? "88px" : "60px");
    } else if (grid.clientWidth) {
      const width=grid.clientWidth, n=visualBirds.length||1;
      const style=getComputedStyle(grid);
      const height=Math.max(1,viewport.clientHeight-parseFloat(style.marginTop)-parseFloat(style.marginBottom)-2);
      rowWidth=Math.max(1,Math.round(Math.sqrt(n*width/Math.max(180,height))));
      if (shapesShown()) {
        const spacing=10, minimum=38;
        const fit=wingGrid(width,height,n,spacing);
        rowWidth=Math.min(fit.columns,Math.max(1,Math.floor((width+spacing)/(minimum+spacing))));
        const rows=Math.ceil(n/rowWidth);
        const widthSize=Math.floor((width-(rowWidth-1)*spacing)/rowWidth);
        const heightSize=Math.floor((height-(rows-1)*spacing)/rows);
        // Fit both axes. On small screens retain readable wings and allow scrolling.
        // Width-only sizing could repeatedly create and remove the scrollbar.
        const size=Math.min(86,widthSize,Math.max(minimum,heightSize));
        grid.style.setProperty("--flock-size", Math.max(1,size)+"px");
      }
      const rows=Math.ceil(n/rowWidth);
      grid.style.setProperty("--cols",rowWidth);grid.style.setProperty("--catalog-rows",rows);
      visualBirds.forEach((bird,i)=>{const tile=tiles.get(bird.id);delete tile.dataset.rowStart;});
    }
  }

  function groupsForView(mode) {
    if(mode==="levels"){
      const pool=birds.filter(b=>(!$("order").value||b.ord===$("order").value)&&(!$("family").value||b.fam===$("family").value));
      return ["一级","二级"].map(level=>({name:t(level==="一级"?"classI":"classII"),birds:pool.filter(b=>b.level===level),parent:"",level}));
    }
    if (mode === "orders") return largestFirst.map(group => ({name:group[0].ord, birds:group, parent:""}));
    if (mode === "compare") return selectedKeys().map(key => comparisonGroups[comparisonMode].get(key));
    const scoped = $("order").value, fam = $("family").value;
    const orderRank = new Map(largestFirst.map((group,i) => [group[0].ord,i]));
    return [...familyMap.values()].filter(group => (!scoped || group.parent===scoped) && (!fam || group.name===fam))
      .sort((a,b) => (familyOrder()==="taxonomy" ? orderRank.get(a.parent)-orderRank.get(b.parent) : 0) || b.birds.length-a.birds.length || a.birds[0].id-b.birds[0].id);
  }
  function enterOrder(name) {
    $("order").value = name;
    $("family").value = "";
    families();
    $("arrangement").value = "families";
    renderArrangement();
  }
  function enterFamily(group) {
    $("order").value = group.parent;
    families();
    $("family").value = group.name;
    $("arrangement").value = "families";
    renderArrangement();
  }
  function overview() {
    $("order").value = "";
    families();
    $("family").value = "";
    $("arrangement").value = "orders";
    renderArrangement();
  }
  function renderIndex() {
    indexButtons.clear();
    $("orderIndex").replaceChildren();
    $("mobileOrders").querySelector("summary").textContent = t(activeMode==="orders" ? "indexOrders" : "indexFamilies")+" ("+currentGroups.length+")";
    currentGroups.forEach((group,col) => {
      const button=document.createElement("button");
      button.type="button"; button.textContent=taxon(group.name);
      button.onclick=()=>{
        const bird=orderBirds[col].find(b=>allowed.has(b.id));
        if (!bird) return;
        $("mobileOrders").open=false;
        tiles.get(bird.id).closest(".orderBand")?.scrollIntoView({block:"start"});
        focusBird(bird);
      };
      indexButtons.set(group.name,button); $("orderIndex").append(button);
    });
  }
  function comparisonSelect(index) {
    const select = document.createElement("select");
    select.className = "comparisonSelect";
    select.setAttribute("aria-label", t("comparisonSlot",{n:index+1}));
    const keys = selectedKeys();
    for (const [key,group] of comparisonGroups[comparisonMode]) {
      const opt = new Option(comparisonName(group),key,false,keys[index]===key);
      opt.disabled = !opt.selected && keys.includes(key);
      select.add(opt);
    }
    select.onchange = () => {
      keys[index] = select.value;
      renderArrangement("compare");
      columnSections[index].querySelector(".comparisonSelect").focus({preventScroll:true});
    };
    return select;
  }
  function appendPortrait(section, bird) {
    const figure=document.createElement("figure"), pic=document.createElement("img");
    figure.className="comparisonPhoto";
    pic.src=bird.assets[1]; pic.alt=birdName(bird);
    figure.append(pic);
    const latin=document.createElement("i");
    latin.className="comparisonLatin"; latin.textContent=I.language()==="en"?bird.name:bird.sci;
    const caption=document.createElement("figcaption");caption.textContent=t("comparisonPhoto");figure.append(caption);
    section.append(latin,figure);
  }
  function paintHexCodes(codes, bird) {
    const shares=window.AtlasShapes.shares(bird);
    codes.replaceChildren(...window.AtlasView.palette(bird).map(({hex,index}) => {
      const row=document.createElement("li"), swatch=document.createElement("span"),
        code=document.createElement("span"), percent=document.createElement("span"),
        track=document.createElement("span"), fill=document.createElement("span");
      row.className="comparisonColour";row.dataset.colorIndex=index;
      swatch.className="comparisonSwatch";swatch.style.backgroundColor=hex;
      swatch.setAttribute("aria-hidden","true");
      code.className="comparisonCode";code.textContent=hex;
      percent.className="comparisonPercent";
      percent.textContent=shares?(shares[index]*100).toFixed(1)+"%":"—";
      track.className="comparisonTrack";track.setAttribute("aria-hidden","true");
      fill.style.width=shares?(shares[index]*100)+"%":"0%";fill.style.backgroundColor=hex;
      track.append(fill);row.append(swatch,code,percent,track);return row;
    }));
  }
  function appendComparisonPalette(section, body, bird) {
    const panel=document.createElement("section"), heading=document.createElement("div"),
      title=document.createElement("h3"), scale=document.createElement("span"),
      visual=document.createElement("figure"), caption=document.createElement("figcaption"),
      codes=document.createElement("ul");
    panel.className="comparisonPalette";heading.className="comparisonPaletteHeading";
    title.textContent=t("comparisonPalette");scale.textContent=t("comparisonShares");
    heading.append(title,scale);
    visual.className="comparisonVisual";
    caption.textContent=t(grid.dataset.display==="wings"?"fiveWings":grid.dataset.display==="mosaic"?"areaMosaic":grid.dataset.display==="pie"?"colourPie":"colourTiles");
    visual.append(body,caption);
    codes.className="comparisonHex";codes.dataset.id=bird.id;
    codes.setAttribute("aria-label",t("comparisonShares"));paintHexCodes(codes,bird);
    panel.append(heading,visual,codes);section.append(panel);
  }
  function setDisplay(mode) {
    grid.dataset.display=["tiles","wings","mosaic","pie"].includes(mode)?mode:"wings";
    $("displaySwitch").value=grid.dataset.display;
  }
  $("displaySwitch").onchange=()=>{
    setDisplay($("displaySwitch").value);
    renderArrangement(activeMode,true);
  };
  function renderArrangement(mode = $("arrangement").value, preservePosition = false) {
    const anchor = preservePosition && ribbon ? columnSections.find(s=>s.getBoundingClientRect().right>viewport.getBoundingClientRect().left+3)?.dataset.family : null;
    activeMode = mode;
    setDisplay(grid.dataset.display || "wings");
    if(mode!=="compare")browseBeforeComparison=null;
    $("arrangement").parentElement.hidden = mode === "compare";
    if (mode !== "compare") $("arrangement").value = mode;
    const grouped = groupedView(), compare = activeMode==="compare";
    currentGroups = grouped ? groupsForView(activeMode) : [];
    scopedFamilies=familyMode() && Boolean($("order").value || $("family").value);
    focusedFamilies = compare || scopedFamilies || mode==="levels";
    ribbon = mode==="orders" || (familyMode() && !focusedFamilies);
    grid.dataset.density="normal";
    grid.className = grouped ? "columnsGrid" : "catalogGrid";
    grid.classList.toggle("familyGrid",familyMode());
    grid.classList.toggle("focusGrid",focusedFamilies);
    grid.classList.toggle("scopeGrid",scopedFamilies);
    grid.classList.toggle("levelGrid",mode==="levels");
    grid.classList.toggle("ribbonGrid",ribbon);
    grid.classList.toggle("orderRibbon",mode==="orders");
    grid.classList.toggle("comparisonGrid",compare);
    grid.classList.toggle("birdComparison",compare && comparisonMode==="bird");
    grid.style.setProperty("--compare-count",compare?currentGroups.length:1);
    grid.dataset.familyOrder=familyMode() ? familyOrder() : "count";
    viewport.classList.toggle("ribbonViewport",ribbon);
    $("familyOrderField").hidden=!ribbon || !familyMode();
    $("ribbonNav").setAttribute("aria-label",t(mode==="orders" ? "scrollOrders" : "scroll"));
    $("familyOrderField").parentElement.hidden=!ribbon;
    $("ribbonNav").hidden=!ribbon;
    $("sortField").hidden = false;
    $("levelFilter").hidden=mode==="levels";
    if(mode==="levels")$("levelFilter").value="";
    $("mobileOrders").hidden = !grouped || currentGroups.length<=4 || ribbon || scopedFamilies;
    $("order").disabled = compare; $("family").disabled = compare;
    $("order").hidden = mode !== "catalog"; $("family").hidden = mode !== "catalog";
    $("levelViews").hidden = mode !== "levels";
    grid.classList.toggle("zoomLevels", mode === "levels" && levelZoom);
    for (const button of $("levelViews").children) {
      button.setAttribute("aria-pressed", String((button.dataset.zoom === "large") === levelZoom));
    }

    const scoped = familyMode() && Boolean($("order").value || $("family").value);
    $("contextLine").hidden = !(scoped || compare);
    $("contextTitle").textContent = compare ? t("compare") : taxon($("family").value || $("order").value);
    $("comparisonModes").hidden = !compare;
    for (const tab of $("comparisonModes").children) tab.setAttribute("aria-pressed",String(tab.dataset.compare===comparisonMode));
    $("contextCount").hidden = compare;
    $("backOverview").textContent = t(compare ? "return" : "overview");
    $("editComparison").textContent = chooseLabel()+" ("+selectedKeys().length+"/4)";
    $("contextCount").textContent = grouped ? t("scopeCount",{families:currentGroups.length,birds:currentGroups.reduce((n,g)=>n+g.birds.length,0)}) : "";
    $("editComparison").hidden = !compare;
    $("openComparison").hidden = compare;
    window.AtlasEcology.setMode(mode);
    clearTip(); rowWidth=0; lastCapacity=0;
    for(const bird of birds){
      const tile=tiles.get(bird.id), palette=window.AtlasView.palette(bird);
      if(shapesShown()) {
        const key=grid.dataset.display+":"+colorMode();
        if(tile.dataset.shapeKey!==key){
          tile.querySelector(".wingGlyph")?.remove();
          const glyph=drawGlyph(bird,grid.dataset.display,palette);
          tile.dataset.missingShares=String(glyph.dataset.unavailable==="true");
          tile.append(glyph);
          tile.dataset.shapeKey=key;
        }
      }
      tile.querySelectorAll("i").forEach((stripe,i)=>{stripe.style.backgroundColor=palette[i].hex;stripe.dataset.colorIndex=palette[i].index;});
      tile.querySelector(".tileName").textContent=birdName(bird);
      tile.setAttribute("aria-label",pad(bird.id)+" "+birdName(bird)+", "+taxon(bird.ord)+", "+taxon(bird.fam)+", "+t("detail"));
    }
    if (grouped) {
      const mode = colorMode();
      orderBirds = currentGroups.map(group=>group.birds.slice().sort((a,b)=>window.AtlasSort.compare(a,b,mode)));
      scopePlan = scopedFamilies ? planScope() : null;
      focusCapacity = activeMode==="levels" ? levelMetrics().lanes : focusedFamilies && !scopedFamilies ? capacityForFocus() : 0;
      ribbonRows = ribbon ? ribbonMetrics().rows : 0;
      spans = orderBirds.map((group,i) => scopedFamilies ? scopePlan.lanes[i] : ribbon ? Math.ceil(group.length/ribbonRows) : focusedFamilies ? 1 : group.length>splitOrderAbove ? 2 : 1);
      columnIndex = new Map(); lanes=[]; longestLane=0;
      columnSections = orderBirds.map((group,col) => {
        const info=currentGroups[col], section=document.createElement("section");
        section.className="orderColumn";
        section.dataset.family=info.name;
        const laneCount=activeMode==="levels" ? focusCapacity : scopedFamilies ? scopePlan.lanes[col] : focusedFamilies ? Math.min(focusCapacity,group.length) : spans[col];
        section.classList.toggle("multiLane",activeMode==="orders" && laneCount>1);
        const rows=ribbon ? Math.min(group.length,ribbonRows) : Math.max(1,Math.ceil(group.length/laneCount));
        section.style.setProperty("--lanes", focusedFamilies && !scopedFamilies ? focusCapacity : laneCount);
        section.style.setProperty("--rows", rows); longestLane=Math.max(longestLane,rows);
        const heading=document.createElement("h2");
        heading.className="orderHeading"; heading.id="group-heading-"+col;
        section.setAttribute("aria-labelledby",heading.id);
        const count=document.createElement("small");
        if(compare){
          heading.append(comparisonSelect(col));
          const b=group[0];
          count.textContent=comparisonMode==="bird" ? taxon(b.fam)+" · "+t(b.level==="一级"?"classI":"classII") : species(group.length);
        }else{
          const name=document.createElement("button");
          name.className="groupName"; name.type="button"; name.textContent=taxon(info.name);
          name.title=taxon(info.name);
          name.onclick=()=>{if(activeMode==="levels")return;activeMode==="orders" ? enterOrder(info.name) : enterFamily(info);};
          if(activeMode==="levels")name.disabled=true;
          count.textContent=species(group.length);
          heading.append(name);
        }
        heading.append(count);
        if(info.parent && !(compare && comparisonMode==="bird") && (!$("order").value || compare) && !(ribbon && familyOrder()==="taxonomy")){
          const parent=document.createElement("button");
          parent.className="parentOrder";parent.type="button";parent.textContent=taxon(info.parent);
          parent.onclick=()=>enterOrder(info.parent);heading.append(parent);
        }
        const body=document.createElement("div");body.className="orderTiles";
        section.append(heading);
        if(compare && comparisonMode==="bird")appendPortrait(section,group[0]);
        if (activeMode === "levels" && levelZoom) {
          body.setAttribute("role","region");
          body.setAttribute("aria-labelledby",heading.id);
          body.tabIndex=0;
        }
        if(compare && comparisonMode==="bird")appendComparisonPalette(section,body,group[0]);
        else section.append(body);
        if(activeMode==="levels"&&!group.length){const empty=document.createElement("p");empty.className="levelEmpty";empty.textContent=t("levelEmpty");body.append(empty);}
        for(let start=0;start<group.length;start+=rows){
          const lane=group.slice(start,start+rows),laneIndex=lanes.length;lanes.push(lane);
          lane.forEach((bird,row)=>{
            const tile=tiles.get(bird.id);delete tile.dataset.rowStart;
            columnIndex.set(bird.id,[laneIndex,row]);body.append(tile);
          });
        }
        if(compare && comparisonMode==="bird")window.AtlasComparisonDetails.enrich(section,group[0]);
        return section;
      });
      visualBirds=orderBirds.flat(); renderIndex();
    } else {
      focusedFamilies=false; visualBirds=window.AtlasExplorer.pool(activeMode).slice().sort((a,b)=>window.AtlasSort.compare(a,b,colorMode()));
      grid.replaceChildren(...visualBirds.map(b=>tiles.get(b.id)));
    }
    viewport.scrollTop=0;viewport.scrollLeft=0;
    if(grouped)fitBands();
    window.AtlasExplorer.update({mode:activeMode,order:$("order").value,family:$("family").value,comparisonMode,groups:currentGroups,selecting:!!pinned});
    layout();apply();
    viewport.parentElement.style.height=compare&&comparisonMode!=="bird"?Math.min(innerWidth<=650?360:460,Math.max(220,grid.scrollHeight+8))+"px":"";
    if(anchor)scrollToRibbonFamily(anchor);
    if(pinned)comparisonChanged(pinned);
  }
  new ResizeObserver(layout).observe(viewport);
  narrowLayout.addEventListener("change", layout);
  viewport.addEventListener("scroll", clearTip, {capture:true, passive:true});
  for (const button of $("levelViews").children) button.onclick = () => {
    levelZoom = button.dataset.zoom === "large";
    renderArrangement("levels");
  };
  $("arrangement").onchange = () => {
    window.AtlasExplorer.resetScope();
    $("order").value=""; families(); $("family").value="";
    renderArrangement();
  };
  $("sortField").onchange = () => renderArrangement(activeMode,true);
  $("familyOrderField").onchange = () => renderArrangement(activeMode);

  for (const order of orders.keys()) $("order").add(new Option(taxon(order),order));
  function families() {
    const select = $("family"), before = select.value;
    const pool = orders.get($("order").value) || birds;
    const names = new Set(pool.map(b => b.fam));
    select.replaceChildren(new Option(t("allFamilies"),""), ...[...names].map(f => new Option(taxon(f),f)));
    if (names.has(before)) select.value = before;
  }
  $("levelFilter").onchange=()=>apply();
  $("hueFilter").onchange=()=>{hue=$("hueFilter").value===""?null:Number($("hueFilter").value);apply();};
  function apply() {
    const q = $("search").value.trim().toLowerCase(), ord = activeMode==="compare" ? "" : $("order").value, fam = activeMode==="compare" ? "" : $("family").value;
    matches = visualBirds.filter(b =>
      (!$("levelFilter").value || b.level===$("levelFilter").value) && (!ord || b.ord===ord) && (!fam || b.fam===fam) && (hue===null || b.bins.includes(hue)) &&
      (!q || [pad(b.id),b.name,b.sci,b.ord,b.fam,I.taxa[b.ord],I.taxa[b.fam]].join(" ").toLowerCase().includes(q)) &&
      (activeMode !== "catalog" || window.AtlasEcology.matches(b))
    );
    allowed = new Set(matches.map(b => b.id));
    const activeOrders = new Set(matches.map(b => activeMode==="orders" ? b.ord : b.fam));
    for (const [ord,button] of indexButtons) button.disabled = !activeOrders.has(ord);
    clearTip();
    for (const bird of birds) {
      const tile = tiles.get(bird.id);
      tile.disabled = !allowed.has(bird.id);
      tile.classList.toggle("dim", tile.disabled);
    }
    updateFocus(allowed.has(focusId) ? focusId : (matches[0]?.id ?? null));
    const filtered = Boolean($("levelFilter").value || q || hue!==null || (activeMode==="catalog" && window.AtlasEcology.active()) || (activeMode==="catalog" && (ord||fam)));
    $("matchCount").textContent = t("matchCount",{n:matches.length,total:visualBirds.length});
    $("matchTools").hidden = !filtered;
    $("clear").hidden = !filtered;
    $("locate").hidden = !filtered || !matches.length;
    $("empty").hidden = matches.length>0;
    window.AtlasExplorer.filter(allowed);
  }
  function reset() {
    window.AtlasEcology.reset();
    $("search").value = "";
    $("levelFilter").value="";
    hue = null; $("hueFilter").value="";
    if(activeMode==="catalog"){ $("order").value="";families();$("family").value=""; }
    apply();
  }
  function filterAndReveal() {
    window.AtlasExplorer.setView("atlas");
    apply();
    if (groupedView() && matches.length && ($("order").value || $("family").value || matches.length===1)) reveal(matches[0], false);
  }
  $("locate").onclick = () => {window.AtlasExplorer.setView("atlas");if(window.AtlasExplorer.isCustom())document.querySelector(".exBird:not(:disabled)")?.focus();else focusBird(matches[0]);};
  $("search").oninput = filterAndReveal;
  $("order").onchange = () => { $("family").value=""; families(); window.AtlasExplorer.setView("atlas"); apply(); };
  $("family").onchange = () => {window.AtlasExplorer.setView("atlas");apply();};
  $("clear").onclick = reset;
  $("clearEmpty").onclick = reset;

  function enterComparison() {
    comparisonChanged(null);
    if(activeMode!=="compare") browseBeforeComparison = {
      mode:activeMode, search:$("search").value, level:$("levelFilter").value, hue:$("hueFilter").value,
      order:$("order").value, family:$("family").value, ecology:window.AtlasEcology.getState(),
      left:viewport.scrollLeft, top:viewport.scrollTop, explorer:window.AtlasExplorer.getState()
    };
    $("search").value=""; $("levelFilter").value=""; $("hueFilter").value=""; hue=null;
    renderArrangement("compare");
    $("comparisonModes").querySelector('[aria-pressed="true"]').focus({preventScroll:true});
  }
  function leaveComparison() {
    const prior = browseBeforeComparison;
    if(!prior){ renderArrangement("catalog"); return; }
    $("order").value=prior.order;families();$("family").value=prior.family;
    window.AtlasEcology.setState(prior.ecology);
    $("search").value=prior.search; $("levelFilter").value=prior.level; $("hueFilter").value=prior.hue;
    hue=prior.hue==="" ? null : Number(prior.hue);
    window.AtlasExplorer.restore(prior.explorer);
    renderArrangement(prior.mode);
    viewport.scrollTo(prior.left,prior.top);
    $("openComparison").focus({preventScroll:true});
  }
  $("backOverview").onclick=()=>activeMode==="compare"?leaveComparison():overview();
  $("openComparison").onclick=enterComparison;
  for(const tab of $("comparisonModes").children) tab.onclick=()=>{
    comparisonMode=tab.dataset.compare;
    renderArrangement("compare");
  };
  $("editComparison").onclick=openPicker;
  $("closePicker").onclick=()=>picker.close();
  function buildPicker() {
    const list=$("pickerList"), sections=new Map();
    list.replaceChildren();
    for(const [key,group] of comparisonGroups[comparisonMode]){
      const parent=group.parent;
      if(!sections.has(parent)){
        const section=document.createElement("fieldset"), legend=document.createElement("legend");
        legend.textContent=parent?taxon(parent):t("allOrders");section.append(legend);list.append(section);
        sections.set(parent,section);
      }
      const label=document.createElement("label"),checkbox=document.createElement("input"),name=document.createElement("span"),n=document.createElement("small");
      const b=group.birds[0], individual=comparisonMode==="bird";
      checkbox.type="checkbox";checkbox.value=key;name.textContent=comparisonName(group);
      n.textContent=individual?pad(b.id):species(group.birds.length);
      label.dataset.search=[group.name, parent, taxon(group.name),taxon(parent),individual ? [b.sci,b.fam,taxon(b.fam),pad(b.id)].join(" ") : ""].join(" ").toLowerCase();
      checkbox.onchange=()=>{
        if(checkbox.checked && pickerDraft.size<4)pickerDraft.add(key);
        else pickerDraft.delete(key);
        updatePicker();
      };
      label.append(checkbox,name,n);sections.get(parent).append(label);
    }
    $("pickerTitle").textContent=chooseLabel();
    const hint=t({bird:"search",family:"pickerSearch",order:"searchOrders"}[comparisonMode]);
    $("pickerSearch").placeholder=hint;$("pickerSearch").setAttribute("aria-label",hint);
  }
  function openPicker() {
    pickerDraft=new Set(selectedKeys());
    $("pickerSearch").value="";
    buildPicker();updatePicker();filterPicker();picker.showModal();
    $("pickerSearch").focus();
  }
  function updatePicker() {
    for(const checkbox of $("pickerList").querySelectorAll("input")){
      checkbox.checked=pickerDraft.has(checkbox.value);
      checkbox.disabled=pickerDraft.size>=4 && !checkbox.checked;
    }
    $("pickerChosen").replaceChildren();
    for(const key of pickerDraft){
      const label=comparisonName(comparisonGroups[comparisonMode].get(key));
      const chip=document.createElement("button");chip.type="button";
      chip.textContent=label+" ×";chip.setAttribute("aria-label",t("remove",{name:label}));
      chip.onclick=()=>{pickerDraft.delete(key);updatePicker()};
      $("pickerChosen").append(chip);
    }
    $("pickerCount").textContent=t("pickerCount",{n:pickerDraft.size});
    $("applyComparison").disabled=pickerDraft.size<2;
    $("applyComparison").textContent=pickerDraft.size>=2 ? t("pickerApply",{n:pickerDraft.size}) : t("pickerStart");
  }
  function filterPicker() {
    const q=$("pickerSearch").value.trim().toLowerCase();
    let visible=0;
    for(const group of $("pickerList").children){
      let inGroup=0;
      for(const label of group.querySelectorAll("label")){
        label.hidden=q && !label.dataset.search.includes(q);
        if(!label.hidden)inGroup++;
      }
      group.hidden=!inGroup; visible+=inGroup;
    }
    $("pickerEmpty").hidden=visible>0;
  }
  $("pickerSearch").oninput=filterPicker;
  $("comparisonForm").onsubmit=e=>{
    e.preventDefault(); if(pickerDraft.size<2||pickerDraft.size>4)return;
    comparisonChoices[comparisonMode]=[...pickerDraft];
    picker.close();renderArrangement("compare");
  };
  document.addEventListener("keydown", e => {
    if(e.key==="Escape" && pinned && !detail.open && !picker.open){e.preventDefault();$("cancelComparison").click();}
    if (e.key==="/" && !detail.open && !picker.open && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) {
      e.preventDefault();
      $("search").focus();
    }
  });
  window.addEventListener("scroll", clearTip, {passive:true});
  window.addEventListener("blur", clearTip);
  function translatePage(){
    for(const option of $("order").options)option.textContent=option.value?taxon(option.value):t("allOrders");
    families();
    $("atlasStats").textContent=I.language()==="en"?"394 species / 23 orders / 62 families":"394 种 / 23 目 / 62 科";
    renderArrangement(activeMode,true);
    if(pinned)comparisonChanged(pinned);
    if(picker.open){buildPicker();updatePicker();filterPicker();}
    window.Specimen.refresh?.();
  }
  document.addEventListener("atlaslanguagechange",translatePage);

  $("homeTitle").onclick=()=>{
    window.AtlasExplorer.reset();
    setDisplay("wings");
    levelZoom = false;
    if(detail.open)detail.close();if(picker.open)picker.close();
    comparisonChanged(null);window.Specimen.reset();current=null;origin=null;
    comparisonChoices=defaultChoices();comparisonMode="bird";browseBeforeComparison=null;pickerDraft=new Set();hue=null;
    $("search").value="";$("pickerSearch").value="";
    $("order").value="";families();$("family").value="";
    $("levelFilter").value="";$("hueFilter").value="";
    $("colorSort").value="light";
    $("themeSwitch").value="light";$("themeSwitch").dispatchEvent(new Event("change"));
    window.AtlasEcology.reset();
    $("ecologyFilters").querySelector("details").open=false;
    $("familyOrderField").querySelector("input[value=taxonomy]").checked=true;
    $("mobileOrders").open=false;$("arrangement").value="catalog";activeMode="catalog";
    I.setLanguage("en");renderArrangement("catalog");
    viewport.scrollTo(0,0);window.scrollTo(0,0);clearTip();
  };
  window.AtlasExplorer.init({
    mode:(mode,keepScope=false)=>{if(!keepScope)window.AtlasExplorer.resetScope();$("order").value="";families();$("family").value="";renderArrangement(mode);window.scrollTo(0,0);},
    order:enterOrder, family:key=>enterFamily(familyMap.get(key)), open:openBird, layout:()=>renderArrangement(activeMode,true)
  });
  window.AtlasEcology.init($("ecologyFilters"),()=>{apply();layout();});
  setDisplay("wings");
  families();translatePage();
})();
