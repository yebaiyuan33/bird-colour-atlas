/* Full records for each bird in the comparison view. */
(() => {
  "use strict";
  const I = window.AtlasI18n;
  const t = key => I.t(key);
  const el = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  function linkedText(content) {
    const body = el("p", "comparisonSourceText");
    let cursor = 0;
    for (const match of String(content).matchAll(/https?:\/\/[^\s<>"']+/gu)) {
      body.append(document.createTextNode(content.slice(cursor, match.index)));
      const a = el("a", "", match[0]);
      a.href = match[0];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      body.append(a);
      cursor = match.index + match[0].length;
    }
    body.append(document.createTextNode(content.slice(cursor)));
    return body;
  }
  function imageViews(figure, bird) {
    const image = figure.querySelector("img");
    if (!image) return;
    figure.querySelector("figcaption")?.remove();
    const views = el("div", "comparisonImageViews");
    views.setAttribute("role", "group");
    views.setAttribute("aria-label", t("views") + ": " + I.birdName(bird));
    const status = el("p", "comparisonImageStatus");
    status.hidden = true;
    status.setAttribute("role", "status");
    figure.append(status);
    image.decoding = "async";
    const choices = [["original", 1], ["reconstruction", 2], ["mask", 3]];
    const setView = (key, assetIndex) => {
      for (const button of views.children) button.setAttribute("aria-pressed", String(button.dataset.view === key));
      status.hidden = true;
      image.hidden = false;
      image.alt = I.birdName(bird) + " — " + t(key);
      image.onerror = () => {
        image.hidden = true;
        status.textContent = t("imageError");
        status.hidden = false;
      };
      image.onload = () => { status.hidden = true; };
      image.src = bird.assets[assetIndex];
    };
    choices.forEach(([key, index]) => {
      const button = el("button", "", t(key));
      button.type = "button";
      button.dataset.view = key;
      button.disabled = !bird.assets?.[index];
      button.addEventListener("click", () => setView(key, index));
      views.append(button);
    });
    figure.after(views);
    setView("original", 1);
  }
  function colourChart(section,bird){
    const panel=section.querySelector(".comparisonPalette"),visual=section.querySelector(".comparisonVisual"),codes=section.querySelector(".comparisonHex");
    if(!panel||!visual||!codes||!window.AtlasPie)return;
    panel.classList.add("comparisonPiePalette");
    const en=I.language()==="en",tabs=el("div","comparisonChartTabs"),readout=el("p","comparisonChartReadout");
    tabs.setAttribute("role","group");tabs.setAttribute("aria-label",en?"Colour visualisation":"色彩图形");
    readout.setAttribute("aria-live","polite");
    const oldContent=el("div","comparisonSecondaryVisual");while(visual.firstChild)oldContent.append(visual.firstChild);
    let selected=null,preview=null;
    const paint=()=>{
      const index=preview??selected;window.AtlasPie.highlight(svg,index);
      codes.querySelectorAll("[data-color-index]").forEach(row=>{const i=Number(row.dataset.colorIndex);row.classList.toggle("isDimmed",index!==null&&i!==index);row.classList.toggle("isActive",i===index);row.setAttribute("aria-pressed",String(i===selected));});
      readout.textContent=index===null?(en?"Hover a colour to see its share":"悬浮颜色，查看占比"):bird.colors[index]+" · "+((window.AtlasPie.shares(bird)?.[index]||0)*100).toFixed(1)+"%";
    };
    const choose=index=>{selected=index===null?null:(selected===index?null:index);preview=null;paint();};
    const svg=window.AtlasPie.draw(bird,window.AtlasView.palette(bird),{interactive:true,onHighlight:index=>{preview=index;paint();},onSelect:choose});
    svg.classList.add("comparisonMainPie");visual.append(svg,readout,oldContent);
    for(const [key,title] of [["pie",t("colourPie")],["graphic",en?"Graphic view":"图形视图"]]){
      const b=el("button","",title);b.type="button";b.dataset.view=key;b.setAttribute("aria-pressed",String(key==="pie"));
      b.onclick=()=>{const isPie=key==="pie";svg.hidden=!isPie;readout.hidden=!isPie;oldContent.hidden=isPie;[...tabs.children].forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.view===key)));};tabs.append(b);
    }
    oldContent.hidden=true;panel.querySelector(".comparisonPaletteHeading")?.after(tabs);
    const detail=el("button","comparisonOpenDetail",en?"View bird details ↗":"查看鸟种详情 ↗");detail.type="button";
    detail.onclick=()=>oldContent.querySelector(".tile")?.click();panel.append(detail);
    codes.querySelectorAll("[data-color-index]").forEach(row=>{
      const index=Number(row.dataset.colorIndex);row.tabIndex=0;row.setAttribute("role","button");row.setAttribute("aria-label",bird.colors[index]+" · "+((window.AtlasPie.shares(bird)?.[index]||0)*100).toFixed(1)+"%");
      row.addEventListener("pointerenter",()=>{preview=index;paint();});row.addEventListener("pointerleave",()=>{preview=null;paint();});row.addEventListener("focus",()=>{preview=index;paint();});row.addEventListener("blur",()=>{preview=null;paint();});row.addEventListener("click",()=>choose(index));
      row.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();choose(index);}if(event.key==="Escape"){event.stopPropagation();choose(null);}});
    });paint();
  }
  function enrich(section, bird) {
    if (!section || !bird || section.dataset.recordEnriched === "true") return;
    section.dataset.recordEnriched = "true";
    section.dataset.birdId = bird.id;
    const heading = section.querySelector(".orderHeading");
    const identity = el("div", "comparisonIdentityMeta");
    identity.append(el("span", "comparisonBirdId", "№ " + String(bird.id).padStart(3, "0")));
    identity.append(el("span", "comparisonOrder", I.taxon(bird.ord)));
    const latin = section.querySelector(".comparisonLatin");
    if (latin) latin.after(identity);
    else heading?.after(identity);
    const photo = section.querySelector(".comparisonPhoto");
    if (photo) imageViews(photo, bird);
    colourChart(section,bird);
    const details = el("div", "comparisonRecord");
    const ecology = window.AtlasEcology?.render(bird, { compact: true });
    if (ecology) {
      ecology.classList.add("comparisonEcology");
      details.append(ecology);
    }
    const introduction = el("section", "comparisonIntroduction");
    introduction.append(el("h3", "", t("introduction")));
    const bio = window.BIRD_INTROS?.[bird.id]?.[I.language()];
    introduction.append(el("p", "", bio || t("introPending")));
    details.append(introduction);
    const provenance=window.AtlasEcology?.renderSources(bird,{compact:true});
    if(provenance){provenance.classList.add("comparisonProvenance");details.append(provenance);}
    section.append(details);
  }
  window.AtlasComparisonDetails = { enrich };
})();
