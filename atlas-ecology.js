(() => {
  "use strict";
  const data=window.ATLAS_ECOLOGY || {byId:{},habitats:[],provinces:[]};
  const I=window.AtlasI18n;
  const words={
    title:["生境与分布","Habitat & distribution"], habitat:["生境类别","Habitat category"],
    province:["省级记录","Province records"], allHabitats:["全部生境","All habitats"], allProvinces:["全部省级地区","All province-level regions"],
    clear:["清除生境与地区筛选","Clear habitat and region filters"],
    scope:["生境可有多项；省级记录包含原资料中的历史、迷鸟等限定，非完整分布名录。未列出不代表没有分布。","Birds may use multiple habitats. Province records retain historical, vagrant and other source qualifications; the list is not exhaustive. An unlisted region does not imply absence."],
    recordScope:["按已核资料列示，非完整分布名录。","Records listed in the reviewed sources; not an exhaustive distribution list."],
    noRecord:["省级记录待核实","Province records awaiting review"], missing:["暂无生境与分布资料","Habitat and distribution information is unavailable"],
    description:["具体生境","Habitat description (source text)"], habitatStatus:["生境资料状态","Habitat source status (source text)"],
    evidence:["资料依据","Sources & context"], sourceText:["保留表格中的资料说明。","Notes below retain the source workbook’s original language."],
    mapping:["生境归类依据","Habitat grouping rationale"], scopeTitle:["生境适用范围","Habitat scope"],
    habitatNotes:["生境补充说明","Habitat notes"], provinceNotes:["省级记录说明","Province record notes"],
    habitatSources:["生境来源","Habitat sources"], provinceSources:["省级记录来源","Province record sources"],
    more:["展开其余 {n} 个省级地区","Show {n} more province-level regions"],
    active:["已选 {n} 项","{n} selected"]
  };
  const text=(key,values={})=>Object.entries(values).reduce((s,[k,v])=>s.replaceAll("{"+k+"}",v),words[key][I.language()==="en"?1:0]);
  const label=(kind,key)=>data[kind]?.[key]?.[I.language()] || key;
  const el=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!=null)node.textContent=value;return node;};
  let host=null,change=()=>{},state={habitat:"",province:""},mode="catalog",ui={};
  function getState(){return {...state};}
  function active(){return !!(state.habitat || state.province);}
  function setState(next={}){
    state={habitat:data.habitats.includes(next?.habitat)?next.habitat:"",province:data.provinces.includes(next?.province)?next.province:""};
    update();
  }
  function reset(){setState({});}
  function matches(bird){
    if(mode!=="catalog" || !active())return true;
    const item=data.byId[bird.id];
    return !!item && (!state.habitat || item.habitats.includes(state.habitat)) && (!state.province || item.provinces.includes(state.province));
  }
  function update(){
    if(!host)return;
    ui.title.textContent=text("title");
    ui.habitatLabel.textContent=text("habitat");ui.provinceLabel.textContent=text("province");
    ui.habitat.replaceChildren(new Option(text("allHabitats"),""),...data.habitats.map(key=>new Option(label("categoryLabels",key),key)));
    ui.province.replaceChildren(new Option(text("allProvinces"),""),...data.provinces.map(key=>new Option(label("provinceLabels",key),key)));
    ui.habitat.value=state.habitat;ui.province.value=state.province;
    const selected=[state.habitat?label("categoryLabels",state.habitat):"",state.province?label("provinceLabels",state.province):""].filter(Boolean);
    ui.selected.textContent=selected.join(" / ");ui.selected.hidden=!selected.length;
    ui.count.textContent=text("active",{n:selected.length});ui.count.hidden=!selected.length;
    ui.scope.textContent=text("scope");ui.clear.textContent=text("clear");ui.clear.hidden=!selected.length;
    host.hidden=mode!=="catalog";
  }
  function init(container,onChange){
    host=container;change=typeof onChange==="function"?onChange:()=>{};
    host.className="ecologyFilters";host.replaceChildren();
    const panel=el("details","ecologyFilterPanel"),summary=el("summary","ecologyFilterSummary"),body=el("div","ecologyFilterBody");
    ui={panel,title:el("span","ecologyFilterTitle"),selected:el("span","ecologyFilterSelected"),count:el("span","srOnly"),scope:el("p","ecologyFilterScope"),clear:el("button","ecologyFilterClear")};
    const habitatWrap=el("label","ecologyFilterField"),provinceWrap=el("label","ecologyFilterField");
    ui.habitatLabel=el("span");ui.provinceLabel=el("span");
    ui.habitat=el("select");ui.habitat.id="habitatFilter";
    ui.province=el("select");ui.province.id="provinceFilter";
    habitatWrap.append(ui.habitatLabel,ui.habitat);provinceWrap.append(ui.provinceLabel,ui.province);
    ui.clear.type="button";ui.clear.onclick=()=>{reset();change();};
    ui.habitat.onchange=()=>{state.habitat=ui.habitat.value;update();change();};
    ui.province.onchange=()=>{state.province=ui.province.value;update();change();};
    summary.append(ui.title,ui.selected,ui.count);body.append(habitatWrap,provinceWrap,ui.scope);
    panel.append(summary,body);host.append(panel,ui.clear);
    panel.addEventListener("toggle",()=>change());
    update();
  }
  function setMode(next){mode=next;if(host)host.hidden=next!=="catalog";}
  function linkedText(value){
    const p=el("p","ecologySourceText");let cursor=0;
    for(const match of String(value).matchAll(/https?:\/\/[^\s<>"']+/gu)){
      p.append(document.createTextNode(value.slice(cursor,match.index)));
      const a=el("a","",match[0]);a.href=match[0];a.target="_blank";a.rel="noopener noreferrer";p.append(a);
      cursor=match.index+match[0].length;
    }
    p.append(document.createTextNode(String(value).slice(cursor)));return p;
  }
  function sourceGroup(parent,title,values){
    const list=[...new Set((Array.isArray(values)?values:[values]).filter(Boolean))];
    if(!list.length)return;
    const section=el("section","ecologySourceGroup");section.append(el("h5","",text(title)));
    list.forEach(value=>section.append(linkedText(value)));parent.append(section);
  }
  function recordList(records,concise=false){
    const list=el("ul","ecologyRecords");
    for(const record of records){
      const li=el("li","ecologyRecord"),name=el("span","ecologyRegion",label("provinceLabels",record.name));li.append(name);
      if(record.note&&concise){li.title=record.note;name.setAttribute("aria-label",name.textContent+"："+record.note);}
      if(record.note&&!concise){const note=el("span","ecologyRecordNote",record.note);note.lang="zh-CN";li.append(note);li.classList.add("qualified");}
      list.append(li);
    }
    return list;
  }
  function render(bird,{compact=false,full=false,concise=false}={}){
    const item=data.byId[bird.id],section=el("section","ecologyDetails"+(compact?" compact":""));
    section.dataset.birdId=bird.id;
    section.append(el("h3","ecologyTitle",text("title")));
    if(!item){section.append(el("p","ecologyScope",text("missing")));return section;}
    const habitats=el("div","ecologyHabitatBlock"),tags=el("ul","ecologyHabitats");
    habitats.append(el("h4","",text("habitat")));
    for(const value of item.habitats || [])tags.append(el("li","",label("categoryLabels",value)));
    habitats.append(tags);
    if(item.habitatText){const p=el("p","ecologyDescription",item.habitatText);p.lang="zh-CN";if(I.language()==="en"){const caption=el("span","ecologyOriginalLabel","Source description: ");caption.lang="en";p.prepend(caption);}habitats.append(p);}
    section.append(habitats);
    const provinces=el("div","ecologyProvinceBlock");provinces.append(el("h4","",I.language()==="en"?"Province distribution":"省份分布"));
    const records=item.provinceRecords || (item.provinces || []).map(name=>({name,note:""}));
    if(records.length){
      provinces.append(recordList(full?records:records.slice(0,compact?8:12),concise));
      const first=compact?8:12;
      if(!full&&records.length>first){const more=el("details","ecologyMore");more.append(el("summary","",text("more",{n:records.length-first})),recordList(records.slice(first)));provinces.append(more);}
    }else provinces.append(el("p","ecologyUnknown",text("noRecord")));
    section.append(provinces);
    return section;
  }
  function renderSources(bird,{compact=false,inline=false}={}){
    const item=data.byId[bird.id] || {},section=el("section","birdSources"+(compact?" compact":""));
    section.append(el("h3","birdSourcesTitle",I.language()==="en"?"Sources":"资料来源"));
    if(inline)return inlineSources(bird,item);
    const body=el("div","birdSourcesGrid");
    const groups=[
      [I.t("photoSource"),bird.source],
      [text("habitatSources"),item.habitatSources],
      [I.language()==="en"?"Province sources":"省份来源",item.provinceSources]
    ];
    for(const [title,values] of groups){
      const sources=[...new Set((Array.isArray(values)?values:[values]).filter(value=>typeof value==="string"&&value.trim()))];
      const group=el("section","birdSourceGroup");group.append(el("h4","",title));
      if(sources.length)sources.forEach(value=>group.append(linkedText(value)));
      else group.append(el("p","ecologySourceText",I.language()==="en"?"Not recorded":"暂无来源记录"));
      body.append(group);
    }
    section.append(body);return section;
  }
  function inlineSources(bird,item){
    const section=el("section","birdSources birdSourcesInline");
    section.append(el("h3","birdSourcesTitle",I.language()==="en"?"Sources":"资料来源"));
    const entries=new Map();
    const groups=[[I.t("photoSource"),[bird.source]],[text("habitatSources"),item.habitatSources||[]],[I.language()==="en"?"Province sources":"省份来源",item.provinceSources||[]]];
    for(const [role,values] of groups)for(const value of values.filter(Boolean)){
      const urls=String(value).match(/https?:\/\/[^\s<>"']+/gu)||[];
      const key=urls.join("|")||value;
      if(entries.has(key)){entries.get(key).roles.push(role);continue;}
      entries.set(key,{roles:[role],value,urls});
    }
    const list=el("div","birdSourceList");
    for(const {roles,value,urls} of entries.values()){
      const item=el("span","birdSourceItem");
      item.append(el("span","birdSourceRole",roles.join(" / ")+"："));
      if(urls.length){
        let label=String(value).slice(0,String(value).indexOf(urls[0])).trim()||new URL(urls[0]).hostname;
        const pages=label.match(/；PDF页.+/);if(pages)label=label.slice(0,pages.index);
        const link=el("a","",label);link.href=urls[0];link.target="_blank";link.rel="noopener noreferrer";link.title=value;link.setAttribute("aria-label",value);item.append(link);
        const remainder=String(value).slice(String(value).indexOf(urls[0])+urls[0].length).trim();
        if(remainder&&!/https?:/.test(remainder))item.append(el("span","birdSourceCredit"," · "+remainder.replace(/\s*\n\s*/g," · ")));
        urls.slice(1).forEach((url,i)=>{const a=el("a",""," ["+(i+2)+"]");a.href=url;a.target="_blank";a.rel="noopener noreferrer";item.append(a);});
      }else item.append(el("span","",value));
      list.append(item);
    }
    if(!entries.size)list.append(el("span","",I.language()==="en"?"Not recorded":"暂无来源记录"));
    section.append(list);return section;
  }
  document.addEventListener("atlaslanguagechange",update);
  window.AtlasEcology={init,setMode,matches,active,reset,getState,setState,render,renderSources};
})();
