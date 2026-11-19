(() => {
  "use strict";
  const modes=["original","reconstruction","mask"],assetIndex=[1,2,3];
  const I=window.AtlasI18n,t=I.t,palette=b=>window.AtlasView.palette(b);
  const text=(zh,en)=>I.language()==="en"?en:zh;
  let host,bird,callback,observer,view=0,selected=null,preview=null,revision=0,cache=new Map(),ui={};
  const kinds=["pie","wings","mosaic"];
  const chartLabel=kind=>kind==="pie"?t("colourPie"):kind==="wings"?t("fiveWings"):kind==="mosaic"?t("areaMosaic"):t("colourTiles");
  function el(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;}
  function button(cls,value,click){const n=el("button",cls,value);n.type="button";n.addEventListener("click",click);return n;}
  function mount(container,initialBird,onCompareChange){
    host=typeof container==="string"?document.querySelector(container):container;
    if(!host)throw new Error("Specimen requires a container.");
    observer?.disconnect();if(ui.plate)window.removeEventListener("resize",schedulePaint);
    revision++;view=0;bird=null;callback=typeof onCompareChange==="function"?onCompareChange:null;
    host.innerHTML=[
      '<div class="sp-empty" hidden></div><section class="sp-content sp-redesigned">',
      '<header class="sp-identity"><div class="sp-header"><h2></h2><span class="sp-number"></span></div><p class="sp-latin" lang="la"></p><div class="sp-taxon"><span></span><span></span></div></header>',
      '<div class="sp-media"><figure class="sp-photo"><div class="sp-plate"><canvas role="img"></canvas><span class="sp-status" aria-live="polite" hidden></span></div></figure>',
      '<div class="sp-views" role="group"></div><section class="sp-intro"><h3></h3><p></p></section><dl class="sp-population"></dl><section class="sp-family" hidden><h3></h3><p></p></section></div>',
      '<div class="sp-notes"><section class="sp-palette-panel"><div class="sp-section-head"><h3></h3><span></span></div>',
      '<div class="sp-chart-stage"><div class="sp-glyphs"></div>',
      '<div class="sp-chart-readout" aria-live="polite" aria-atomic="true"></div></div>',
      '<div class="sp-swatches" role="group"></div></section>',
      '<div class="sp-ecology"></div><div class="sp-actions"><button type="button" class="sp-pin"><i class="sp-compare-mark" aria-hidden="true"></i><span></span><b aria-hidden="true">↗</b></button></div></div>',
      '<div class="sp-provenance"></div></section>'
    ].join("");
    const q=s=>host.querySelector(s);
    ui={name:q("h2"),number:q(".sp-number"),latin:q(".sp-latin"),taxon:q(".sp-taxon"),frame:q(".sp-photo"),plate:q(".sp-plate"),canvas:q("canvas"),status:q(".sp-status"),glyphs:q(".sp-glyphs"),views:q(".sp-views"),swatches:q(".sp-swatches"),pin:q(".sp-pin"),ecology:q(".sp-ecology"),intro:q(".sp-intro p"),introTitle:q(".sp-intro h3"),population:q(".sp-population"),empty:q(".sp-empty"),content:q(".sp-content"),colorHint:q(".sp-section-head span"),provenance:q(".sp-provenance"),readout:q(".sp-chart-readout")};
    modes.forEach((name,i)=>ui.views.append(button("",t(name),()=>{view=i;selected=null;preview=null;paintControls();schedulePaint();})));
    ui.pin.onclick=()=>{if(callback&&bird)callback(bird);};
    if(typeof ResizeObserver==="function"){observer=new ResizeObserver(schedulePaint);observer.observe(ui.plate);}else window.addEventListener("resize",schedulePaint);
    show(initialBird);return window.Specimen;
  }
  function chooseColour(index){selected=index===null?null:(selected===index?null:index);preview=null;paintControls();schedulePaint();}
  function previewColour(index){preview=index;paintControls();}
  function show(nextBird){
    if(!host)throw new Error("Call Specimen.mount first.");
    revision++;bird=nextBird||null;selected=null;preview=null;cache=new Map();ui.empty.hidden=!!bird;ui.content.hidden=!bird;if(!bird)return;
    ui.name.textContent=I.birdName(bird);ui.number.textContent="№ "+String(bird.id).padStart(3,"0");
    ui.latin.textContent=I.language()==="en"?bird.name:bird.sci;ui.latin.lang=I.language()==="en"?"zh-CN":"la";
    ui.taxon.children[0].textContent=I.taxon(bird.ord)+" / "+I.taxon(bird.fam);ui.taxon.children[1].textContent=t(bird.level==="一级"?"classI":"classII");
    ui.swatches.replaceChildren();
    palette(bird).forEach(({hex,index})=>{
      const chip=button("sp-chip","",()=>chooseColour(index));chip.dataset.colorIndex=index;
      const ink=el("i","sp-ink");ink.style.background=hex;
      const share=window.AtlasPie.shares(bird)?.[index],percent=share===undefined?"—":(share*100).toFixed(1)+"%";
      chip.append(ink,el("span","sp-hex",hex),el("span","sp-share",percent));
      chip.title=t("colourShare",{hex,share:percent});chip.setAttribute("aria-label",t("locateColour",{hex})+" · "+percent);
      chip.addEventListener("pointerenter",()=>previewColour(index));chip.addEventListener("pointerleave",()=>previewColour(null));chip.addEventListener("focus",()=>previewColour(index));chip.addEventListener("blur",()=>previewColour(null));
      chip.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();chooseColour(null);}});
      ui.swatches.append(chip);
    });
    const bio=window.BIRD_INTROS?.[bird.id];ui.intro.textContent=bio?.[I.language()]||t("introPending");ui.introTitle.textContent=t("introduction");
    renderPopulation();
    const family=host.querySelector(".sp-family"),familyIntro=window.AtlasVisuals?.familyIntro?.(bird.fam);
    family.hidden=!familyIntro;
    if(familyIntro){family.querySelector("h3").textContent=text("所属科 · ","Family · ")+I.taxon(bird.fam);family.querySelector("p").textContent=familyIntro;}
    translateLabels();renderChart();ui.provenance.replaceChildren(window.AtlasEcology.renderSources(bird,{inline:true}));
    ui.pin.querySelector("span").textContent=text("与另一鸟种对照","Compare with another bird");
    ui.ecology.replaceChildren(window.AtlasEcology.render(bird,{full:true,concise:true}));paintControls();
    ui.canvas.getContext("2d").clearRect(0,0,ui.canvas.width,ui.canvas.height);schedulePaint();
  }
  function renderPopulation(){
    const record=window.ATLAS_POPULATION?.byId?.[bird.id];
    const english={"未知（官方）":"Unknown (official)","未提供（官方）":"Not provided (official)","待核对":"Pending verification","减少":"Decreasing","增加":"Increasing","稳定":"Stable","未知":"Unknown"};
    const categories={LC:"Least Concern",NT:"Near Threatened",VU:"Vulnerable",EN:"Endangered",CR:"Critically Endangered",DD:"Data Deficient"};
    const fields=[
      ["mature",text("全球成熟个体数量（只）","Global mature individuals")],
      ["trend",text("全球种群趋势","Global population trend")],
      ["iucn",text("IUCN全球等级","Global IUCN status")]
    ];
    ui.population.replaceChildren();
    fields.forEach(([key,label])=>{
      const cell=el("div","sp-population-item sp-population-"+key),raw=record?.[key];
      let value=raw||text("暂无数据","Not available");
      if(I.language()==="en"&&raw){
        const code=key==="iucn"?raw.match(/\b(LC|NT|VU|EN|CR|DD)\b/)?.[0]:null;
        value=code?code+" · "+categories[code]:(english[raw]||raw);
      }
      cell.append(el("dt","",label),el("dd","",value));ui.population.append(cell);
    });
  }
  function renderChart(){
    ui.glyphs.replaceChildren();
    kinds.forEach(kind=>{
      const figure=el("figure","sp-chart sp-chart-"+kind);
      const svg=kind==="pie"?window.AtlasPie.draw(bird,palette(bird),{interactive:true,onHighlight:previewColour,onSelect:chooseColour}):window.AtlasShapes.draw(bird,kind,palette(bird));
      if(kind!=="pie"){
        svg.removeAttribute("aria-hidden");svg.setAttribute("role","group");svg.setAttribute("aria-label",chartLabel(kind));
        svg.querySelectorAll("[data-color-index]").forEach(shape=>{
          const index=Number(shape.dataset.colorIndex);
          shape.setAttribute("tabindex","0");shape.setAttribute("role","button");
          shape.setAttribute("aria-label",bird.colors[index]+" · "+((window.AtlasPie.shares(bird)?.[index]||0)*100).toFixed(1)+"%");
          shape.addEventListener("pointerenter",()=>previewColour(index));shape.addEventListener("pointerleave",()=>previewColour(null));
          shape.addEventListener("focus",()=>previewColour(index));shape.addEventListener("blur",()=>previewColour(null));
          shape.addEventListener("click",()=>chooseColour(index));
          shape.addEventListener("keydown",event=>{if(["Enter"," "].includes(event.key)){event.preventDefault();event.stopPropagation();chooseColour(index);}if(event.key==="Escape"){event.preventDefault();event.stopPropagation();chooseColour(null);}});
        });
      }
      figure.append(svg,el("figcaption","",chartLabel(kind)));ui.glyphs.append(figure);
    });
  }
  function paintControls(){
    const active=preview??selected;
    [...ui.views.children].forEach((b,i)=>b.setAttribute("aria-pressed",String(selected===null&&view===i)));
    [...ui.swatches.children].forEach(b=>{b.setAttribute("aria-pressed",String(selected===Number(b.dataset.colorIndex)));b.classList.toggle("isActive",active===Number(b.dataset.colorIndex));b.classList.toggle("isDimmed",active!==null&&active!==Number(b.dataset.colorIndex));});
    ui.colorHint.textContent=selected===null?text("悬浮看比例 · 点击定位","Hover for share · click to locate"):text("再次点击恢复照片","Click again to restore photo");
    ui.glyphs.querySelectorAll("[data-color-index]").forEach(shape=>shape.style.opacity=active===null||Number(shape.dataset.colorIndex)===active?"1":".16");
    ui.readout.replaceChildren();
    if(active!==null){const ink=el("i");ink.style.background=bird.colors[active];const code=el("span","sp-readout-hex",bird.colors[active]);const share=el("strong","",((window.AtlasPie.shares(bird)?.[active]||0)*100).toFixed(1)+"%");ui.readout.append(ink,code,share);}
    else ui.readout.append(el("span","sp-readout-hint",text("五种颜色，共同组成这张照片的配色。","Five colours make up this photo’s palette.")));
  }
  function status(message) {
    ui.status.hidden = !message;
    ui.status.textContent = message || "";
  }
  function image(url) {
    if (!url) return Promise.reject(new Error("Missing image"));
    if (!cache.has(url)) {
      cache.set(url, new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image unavailable"));
        img.src = url;
      }));
    }
    return cache.get(url);
  }
  const hexChannels = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  function luminance(rgb) {
    const v = rgb.map(c => c/255).map(c => c<=.04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
    return .2126*v[0]+.7152*v[1]+.0722*v[2];
  }
  async function locate(b, i, pool) {
    const key = "overlay:"+i;
    if (pool.has(key)) return pool.get(key);
    // The label PNG is embedded as a data URI so the analysis canvas is readable on file://.
    const img = await image(b.labels);
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext("2d", {willReadFrequently:true});
    ctx.drawImage(img,0,0);
    const pixels = ctx.getImageData(0,0,c.width,c.height);
    const rank = b.ranks[i], tone = hexChannels(b.colors[i]);
    const gray = luminance(tone) < .13 ? 145 : 53;
    for (let p=0; p<pixels.data.length; p+=4) {
      const cls = pixels.data[p];
      if (!cls) { pixels.data[p+3] = 0; continue; }
      if (cls === rank) {
        pixels.data[p] = tone[0]; pixels.data[p+1] = tone[1]; pixels.data[p+2] = tone[2];
      } else {
        pixels.data[p] = gray; pixels.data[p+1] = gray; pixels.data[p+2] = gray;
      }
    }
    ctx.putImageData(pixels,0,0);
    pool.set(key,c);
    return c;
  }
  function schedulePaint() {
    if (!bird || !ui.plate) return;
    const tick = ++revision;
    const b = bird, s = selected, m = view;
    const atColor = s !== null;
    const hex = atColor ? b.colors[s] : null;
    ui.frame.style.background = atColor ? (luminance(hexChannels(hex)) < .13 ? "#bdbfb7" : "#202420") : "";
    status(atColor ? t("colourPosition",{hex}) : "");
    ui.canvas.setAttribute("aria-label", I.birdName(b) + " · " + (atColor ? t("pixelPosition",{hex}) : t(modes[m])));
    const resource = atColor ? locate(b,s,cache) : image(b.assets[assetIndex[m]]);
    resource.then(img => {
      if (tick !== revision) return;
      const {width,height} = ui.plate.getBoundingClientRect();
      if (!width || !height) return;
      const ratio = Math.min(2.5,window.devicePixelRatio || 1);
      ui.canvas.width = Math.max(1,Math.round(width*ratio));
      ui.canvas.height = Math.max(1,Math.round(height*ratio));
      const ctx=ui.canvas.getContext("2d");
      ctx.scale(ratio,ratio);
      const iw=img.naturalWidth || img.width, ih=img.naturalHeight || img.height;
      const crop = atColor || m!==0;
      const [left,top,w,h] = crop ? (b.bbox || [0,0,1,1]) : [0,0,1,1];
      const scale = Math.min(width/(iw*w),height/(ih*h)) * (crop ? .89 : 1);
      const x=width/2-(left+w/2)*iw*scale, y=height/2-(top+h/2)*ih*scale;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img,x,y,iw*scale,ih*scale);
    }).catch(() => {
      if (tick !== revision) return;
      ui.canvas.getContext("2d").clearRect(0,0,ui.canvas.width,ui.canvas.height);
      status(t(atColor ? "labelError" : "imageError"));
    });
  }
  function translateLabels(){
    ui.empty.textContent=t("specimenEmpty");ui.content.setAttribute("aria-label",t("detail"));ui.views.setAttribute("aria-label",t("views"));ui.swatches.setAttribute("aria-label",t("swatchesLabel"));
    host.querySelector(".sp-section-head h3").textContent=text("照片配色","Photo palette");
    [...ui.views.children].forEach((b,i)=>b.textContent=t(modes[i]));
  }
  function refresh(){if(!host||!bird)return;const keep=selected;show(bird);selected=keep;paintControls();schedulePaint();}
  function reset(){view=0;selected=null;preview=null;cache=new Map();if(host)show(null);}
  window.Specimen={mount,show,refresh,reset};
})();
