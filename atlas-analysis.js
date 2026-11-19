/* Shared, deterministic statistics for the atlas and its workbook export. */
(() => {
  "use strict";
  const birds=window.ATLAS.birds, ecology=window.ATLAS_ECOLOGY;
  const CATEGORIES=[
    {key:"red",name:"红橙",zh:"红橙",en:"Red & orange",color:"#BD6246"},
    {key:"yellow",name:"黄褐",zh:"黄褐",en:"Yellow & brown",color:"#B59A42"},
    {key:"green",name:"绿",zh:"绿",en:"Green",color:"#6C8B52"},
    {key:"cyan",name:"青",zh:"青",en:"Cyan",color:"#5B9FA2"},
    {key:"blue",name:"蓝",zh:"蓝",en:"Blue",color:"#557EB0"},
    {key:"purple",name:"紫",zh:"紫",en:"Purple",color:"#8E6D9C"},
    {key:"neutral",name:"近中性",zh:"近中性",en:"Near-neutral",color:"#858783"}
  ];
  const LIGHT_BINS=[
    {key:"dark",name:"暗部",zh:"暗部",en:"Dark",color:"#3E4548"},
    {key:"mid",name:"中间调",zh:"中间调",en:"Midtone",color:"#929791"},
    {key:"light",name:"亮部",zh:"亮部",en:"Light",color:"#DBDED5"}
  ];
  const habitatEnglish=[
    "Woodland, open forest, forest edges, bamboo and the shrub or understory layers within forests.",
    "Documented grassland, steppe and meadow habitats, including wet meadows. Open terrain alone is not enough for this label.",
    "Rivers, lakes, ponds, marshes, reedbeds, rice paddies, fishponds and intertidal wetlands.",
    "Documented alpine, plateau or treeline environments, including alpine meadow, scree, shrubland and plateau wetlands.",
    "Marine waters, coasts, estuaries, tidal flats and island breeding sites that the bird actually uses.",
    "Other documented environments, such as shrubland, dry farmland, settlements, desert, rocky ground, caves or tundra."
  ];
  const HABITATS=ecology.habitats.map((key,i)=>({
    key,name:key,zh:key,en:ecology.categoryLabels[key]?.en || key,
    description:{zh:ecology.methodology.find(x=>x.label===key)?.text || "",en:habitatEnglish[i]}
  }));
  const methodology={
    scope:{zh:"统计对象为本图谱纳入的 394 个鸟种条目。颜色分析来自各条目的参考照片，不表示野外种群的真实羽色比例或随时间变化的趋势。",en:"Statistics describe the 394 entries in this atlas. Colour analysis uses each entry's reference photograph; it is not a measure of wild-population plumage proportions or change over time."},
    colour:{zh:"先按每张照片分割前景中的五色像素占比汇总，再对组内有有效配色的鸟种等权平均。每个鸟种权重相同，不按照片像素数或鸟类个体数量加权。",en:"Five-colour shares are first aggregated within each photograph's segmented foreground, then averaged equally across birds with valid palettes. Each bird has equal weight, regardless of image resolution or population size."},
    hueRules:{zh:"项目颜色分组使用 sRGB 转 HSV：饱和度 S<0.15 或明度 V<0.15 归近中性；其余按色相分为红橙 [0°,30°) 与 [330°,360°)、黄褐 [30°,90°)、绿 [90°,150°)、青 [150°,210°)、蓝 [210°,270°)、紫 [270°,330°)。分组用于显示，不是鸟类学分类。",en:"Project colour groups use sRGB-to-HSV. S<0.15 or V<0.15 is near-neutral; otherwise hue is red/orange [0°,30°) or [330°,360°), yellow/brown [30°,90°), green [90°,150°), cyan [150°,210°), blue [210°,270°), or purple [270°,330°). These are display categories, not biological classes."},
    light:{zh:"明度与彩度使用与图谱排序相同的 CIELAB（D65）换算。各鸟按颜色像素占比加权，再在组内等权平均。暗部 L*<100/3，中间调 100/3≤L*<200/3，亮部 L*≥200/3。",en:"Lightness and chroma use the same CIELAB (D65) conversion as the atlas sorting. Each bird is weighted by its colour pixel shares, then birds are averaged equally. Dark: L*<100/3; midtone: 100/3≤L*<200/3; light: L*≥200/3."},
    ecology:{zh:"生境按提供表格的六类项目标签统计，同一鸟种可属于多类。每类比例的分母为当前组去重鸟种数；不同生境的比例不可相加解释为 100%。生境标签依据资料，非照片背景。",en:"Habitats follow the six project labels in the supplied workbook. A bird may belong to several habitats. Each percentage uses the group's distinct bird count as denominator; habitat percentages do not sum to 100%. Labels come from sources, not photograph backgrounds."},
    provinces:{zh:"省级地区含省、自治区、直辖市及港澳台。统计的是表格已列示记录的去重鸟种数，可能含历史、迷鸟、引入或待核限定，不是全国完整分布或物种丰富度排名。同一鸟种可记于多地。",en:"Province-level regions include provinces, autonomous regions, municipalities, Hong Kong, Macao and Taiwan. Counts are distinct atlas birds listed in the workbook, potentially with historical, vagrant, introduced or unresolved qualifications. They are not complete distribution or national species-richness rankings. A bird may be recorded in several regions."},
    missing:{zh:"省份未明确的条目不补填地区，并单列缺失数量；颜色占比无效的条目不参与颜色均值，另列有效数量。",en:"Unspecified province records are not filled in and are counted separately. Invalid colour shares are excluded from colour means and the valid count is reported."}
  };
  const colourCache=new Map(), birdCache=new WeakMap(), summaryCache=new Map(), groupCache=new Map();
  function paletteCategory(hex){
    if(colourCache.has(hex))return colourCache.get(hex);
    const rgb=[1,3,5].map(i=>parseInt(String(hex).slice(i,i+2),16)/255);
    if(!/^#[0-9a-f]{6}$/i.test(hex)||rgb.some(n=>!Number.isFinite(n)))return null;
    const [r,g,b]=rgb,max=Math.max(...rgb),min=Math.min(...rgb),delta=max-min,s=max?delta/max:0;
    let hue=0;
    if(delta){if(max===r)hue=60*(((g-b)/delta)%6);else if(max===g)hue=60*((b-r)/delta+2);else hue=60*((r-g)/delta+4);}
    hue=(hue+360)%360;
    const key=s<.15||max<.15?"neutral":hue<30||hue>=330?"red":hue<90?"yellow":hue<150?"green":hue<210?"cyan":hue<270?"blue":"purple";
    colourCache.set(hex,key);return key;
  }
  function metrics(bird){
    if(birdCache.has(bird))return birdCache.get(bird);
    const colors=bird.colors || [], raw=bird.proportions || [];
    const total=raw.reduce((sum,x)=>sum+x,0);
    const valid=colors.length===5&&raw.length===5&&raw.every(n=>Number.isFinite(n)&&n>=0)&&total>0&&colors.every(c=>paletteCategory(c)!==null);
    const colorShares=CATEGORIES.map(c=>({...c,count:0,share:0})),lightBins=LIGHT_BINS.map(c=>({...c,count:0,share:0}));
    let light=null,chroma=null;
    if(valid){
      light=0;chroma=0;
      colors.forEach((hex,i)=>{
        const share=raw[i]/total,lab=window.AtlasSort.colour(hex),L=Math.max(0,Math.min(100,lab.light));
        colorShares.find(c=>c.key===paletteCategory(hex)).share+=share;
        lightBins[L<100/3?0:L<200/3?1:2].share+=share;
        light+=L*share;chroma+=lab.chroma*share;
      });
      colorShares.forEach(x=>x.count=Number(x.share>0));lightBins.forEach(x=>x.count=Number(x.share>0));
    }
    const result={valid,light,chroma,colorShares,lightBins};birdCache.set(bird,result);return result;
  }
  const distinct=list=>[...new Map((list||[]).filter(b=>b&&b.id!==undefined).map(b=>[String(b.id),b])).values()];
  const rank=(a,b)=>b.count-a.count||a.key.localeCompare(b.key,"zh-CN");
  function taggedCounts(list,keys,field,labels){
    return keys.map(key=>({key,name:key,zh:labels?.[key]?.zh||key,en:labels?.[key]?.en||key,count:list.filter(b=>(ecology.byId[b.id]?.[field]||[]).includes(key)).length}))
      .map(x=>({...x,share:list.length?x.count/list.length:0})).sort(rank);
  }
  function summarize(input){
    const list=distinct(input),cacheKey=list.map(b=>b.id).sort((a,b)=>a-b).join(",");
    if(summaryCache.has(cacheKey))return summaryCache.get(cacheKey);
    const species=list.length,orderKeys=[...new Set(list.map(b=>b.ord))],familyKeys=[...new Set(list.map(b=>b.fam))];
    const levelCounts={"一级":list.filter(b=>b.level==="一级").length,"二级":list.filter(b=>b.level==="二级").length};
    const habitatCounts=taggedCounts(list,ecology.habitats,"habitats",ecology.categoryLabels);
    const provinceCounts=taggedCounts(list,ecology.provinces,"provinces",ecology.provinceLabels);
    const orderCounts=orderKeys.map(key=>({key,name:key,count:list.filter(b=>b.ord===key).length})).map(x=>({...x,share:species?x.count/species:0})).sort(rank);
    const familyCounts=familyKeys.map(key=>({key,name:key,count:list.filter(b=>b.fam===key).length})).map(x=>({...x,share:species?x.count/species:0})).sort(rank);
    const valid=list.map(metrics).filter(x=>x.valid),validColours=valid.length;
    const colorShares=CATEGORIES.map((c,i)=>({...c,count:valid.reduce((s,m)=>s+m.colorShares[i].count,0),share:validColours?valid.reduce((s,m)=>s+m.colorShares[i].share,0)/validColours:0}));
    const lightBins=LIGHT_BINS.map((c,i)=>({...c,count:valid.reduce((s,m)=>s+m.lightBins[i].count,0),share:validColours?valid.reduce((s,m)=>s+m.lightBins[i].share,0)/validColours:0}));
    const withProvince=list.filter(b=>ecology.byId[b.id]?.provinces?.length).length;
    const result={species,orders:orderKeys.length,families:familyKeys.length,habitats:habitatCounts.filter(x=>x.count).length,provinces:provinceCounts.filter(x=>x.count).length,
      levelCounts,orderCounts,familyCounts,habitatCounts,provinceCounts,colorShares,lightBins,validColours,
      light:validColours?valid.reduce((s,m)=>s+m.light,0)/validColours:null,chroma:validColours?valid.reduce((s,m)=>s+m.chroma,0)/validColours:null,
      withProvince,withoutProvince:species-withProvince,
      topColours:colorShares.slice().sort((a,b)=>b.share-a.share).filter(c=>c.share>0).slice(0,3),
      topHabitats:habitatCounts.filter(x=>x.count).slice(0,3),topProvinces:provinceCounts.filter(x=>x.count).slice(0,3)};
    summaryCache.set(cacheKey,result);return result;
  }
  function describe(type,key,list,summary){
    const examples=list.slice(0,3),zhExamples=examples.map(b=>b.name).join("、"),enExamples=examples.map(b=>b.sci).join(", ");
    const s=summary;
    if(type==="all")return {zh:"本图谱依据 2021 年国家重点保护野生动物名录整理鸟种，以目、科、保护等级、生境和省级记录串联参考照片与配色。当前包含 "+s.species+" 种、"+s.orders+" 目、"+s.families+" 科。",en:"The atlas organises birds from the 2021 national protected-wildlife list through orders, families, protection levels, habitats and province records, linking reference photographs to palettes. It currently contains "+s.species+" birds across "+s.orders+" orders and "+s.families+" families."};
    if(type==="orders")return {zh:"目是科之上的分类层级。本图谱中的"+key+"纳入 "+s.families+" 科、"+s.species+" 种，包括"+zhExamples+"等。下方展示这些条目照片的配色与生态记录。",en:"An order groups related families. This order is represented here by "+s.species+" birds in "+s.families+" families, including "+enExamples+". The panels describe the reference-photo palettes and ecology records of these entries."};
    if(type==="families")return {zh:"科位于目之下，并包含鸟种条目。"+key+"在本图谱中归于"+list[0]?.ord+"，纳入 "+s.species+" 种，包括"+zhExamples+"等。",en:"A family sits within an order and contains species entries. This family contributes "+s.species+" birds to the atlas, including "+enExamples+"."};
    if(type==="habitats")return {zh:(HABITATS.find(h=>h.key===key)?.description.zh||"")+" 本图谱有 "+s.species+" 种鸟带有此标签，分属 "+s.orders+" 目、"+s.families+" 科。",en:(HABITATS.find(h=>h.key===key)?.description.en||"")+" This label occurs on "+s.species+" atlas birds across "+s.orders+" orders and "+s.families+" families."};
    if(type==="provinces")return {zh: key+"的省级记录涉及本图谱 "+s.species+" 种鸟，分属 "+s.orders+" 目、"+s.families+" 科。这里汇总已列示记录及其参考照片配色。",en:"The workbook lists "+s.species+" atlas birds for "+(ecology.provinceLabels[key]?.en||key)+", spanning "+s.orders+" orders and "+s.families+" families. This view summarises those entries and their reference-photo palettes."};
    return {zh:"本图谱纳入国家"+key+"保护鸟类 "+s.species+" 种，涉及 "+s.orders+" 目、"+s.families+" 科。",en:"This protection level contains "+s.species+" atlas birds across "+s.orders+" orders and "+s.families+" families."};
  }
  function groups(type){
    if(type==="catalog")type="all";
    if(groupCache.has(type))return groupCache.get(type);
    let entries;
    if(type==="all")entries=[["all",birds]];
    else if(type==="orders"||type==="families"){
      const field=type==="orders"?"ord":"fam";
      entries=[...new Set(birds.map(b=>b[field]))].map(key=>[key,birds.filter(b=>b[field]===key)]).sort((a,b)=>b[1].length-a[1].length||a[1][0].id-b[1][0].id);
    }else if(type==="levels")entries=["一级","二级"].map(key=>[key,birds.filter(b=>b.level===key)]);
    else if(type==="habitats"||type==="provinces")entries=ecology[type].map(key=>[key,birds.filter(b=>(ecology.byId[b.id]?.[type]||[]).includes(key))]);
    else return [];
    const result=entries.map(([key,list])=>{
      const summary=summarize(list),name=type==="all"?"全部鸟类":type==="levels"?"国家"+key+"保护":key;
      return {key,name,type,parent:type==="families"?list[0]?.ord||"":"",birds:list,summary,description:describe(type,key,list,summary)};
    });
    groupCache.set(type,result);return result;
  }
  window.AtlasAnalysis={CATEGORIES,LIGHT_BINS,HABITATS,methodology,paletteCategory,metrics,summarize,groups};
})();
