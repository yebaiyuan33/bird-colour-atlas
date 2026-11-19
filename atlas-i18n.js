(() => {
  "use strict";
  const copy = {
    habitatView:["按生存环境浏览","By habitat"], provinceView:["按省份浏览","By province"], colourPie:["色彩饼图","Colour pie"],
    compareThisBird:["对照此鸟","Compare this bird"],
    selectPartner:["已选择：{name}","Selected: {name}"],
    selectPartnerHint:["点击另一只鸟，打开两鸟对照。可继续切换分类或搜索。","Choose another bird to open a comparison. You can browse categories or search."],
    selectDifferent:["请选择另一只不同的鸟。","Choose a different bird."],
    browseAllBirds:["浏览全部鸟类","Browse all birds"], cancelSelection:["取消对照","Cancel selection"],
    selectForComparison:["选择此鸟进行对照","Select this bird for comparison"],
    comparisonPalette:["照片配色","Photo palette"], comparisonShares:["颜色占比 · 0–100%","Colour share · 0–100%"], comparisonPhoto:["原始照片","Original photograph"],
    background:["背景","Background"], darkBackground:["深色","Dark"], whiteBackground:["白色","White"], photoSource:["照片来源","Photo source"],
    levelOverview:["全局","Overview"], levelLarge:["放大","Enlarged"], levelDisplay:["等级视图","Protection level view"],
    orderCount:["{n} 目","{n} orders"], scrollOrders:["横向浏览各目","Browse orders horizontally"],
    display:["显示","Display"], colourTiles:["色块","Tiles"], fiveWings:["羽翼色谱","Wing palette"], areaMosaic:["色彩占比图","Colour proportions"],
    tileMapping:["五色取自当前照片的自动分割前景；等宽色块不表示占比。","Five colours from the automatically segmented foreground in this photograph; equal-width tiles do not encode proportions."],
    wingMapping:["羽长显示同一照片自动分割前景的相对占比；各鸟最长羽片等长，跨鸟请比较百分比。羽片面积不表示占比。","Feather lengths show relative shares of the automatically segmented foreground within each photograph. Every bird has the same longest feather; compare percentages across birds. Feather area does not encode share."],
    mosaicMapping:["每块面积等于该颜色在当前照片自动分割前景中的像素占比。","Each rectangle’s area equals its colour’s pixel share in the automatically segmented foreground of this photograph."],
    sharesMissing:["该照片的颜色比例数据缺失，暂不显示比例图形。","Colour proportions are unavailable for this photograph; proportional shapes cannot be shown."],
    photoShares:["比例为本张照片自动分割前景的像素占比，不代表整个鸟种的固定羽色比例。","Percentages refer to pixels in this photograph’s automatically segmented foreground, not fixed proportions for the species."],
    miniPaletteLabel:["五色预览（等宽，不表示比例）","Five-colour preview (equal widths, not proportions)"],
    photoProvenance:["照片来源与处理说明","Photo source & processing notes"],
    sourceRecord:["照片来源（原始记录）","Photo source (original record)"],
    sourceConditions:["使用条件（原始记录）","Use conditions (original record)"],
    sourceModification:["图片更新记录","Photo update record"],
    segmentationNeedsReview:["分割结果需复核","Segmentation needs review"],
    segmentationReview:["分割复核提示","Segmentation review notes"],
    sourcePending:["来源或许可待核实","Source or permission unverified"],
    reviewNeeded:["有复核提示","Review notes"],
    colourShare:["{hex} · 像素占比 {share}","{hex} · pixel share {share}"],
    format:["格式","Format"], introduction:["简介","About this bird"], introPending:["该鸟种的简介正在核实。","The species description is being verified."],
    resetAtlas:["清空所有设置，返回初始界面","Reset all settings and return to the initial view"],
    levelEmpty:["当前范围没有该等级的鸟种","No birds at this level in the current selection"],
    skip:["跳到色格","Skip to palettes"], search:["鸟名、学名或编号","Name, scientific name or ID"], searchLabel:["搜索鸟名、学名或编号","Search birds by name, scientific name or ID"],
    allOrders:["全部目","All orders"], allFamilies:["全部科","All families"], orderFilter:["按目筛选","Filter by order"], familyFilter:["按科筛选","Filter by family"],
    orderView:["按目浏览","Orders"], familyView:["按科浏览","Families"], catalogView:["全部鸟类","All birds"], levelView:["按等级预览","Protection levels"], levelFilter:["保护等级筛选","Filter protection level"], allLevels:["全部等级","All levels"], arrangement:["浏览方式","Browse by"],
    colourOrder:["色彩排序","Colour order"], light:["明 → 暗","Light → dark"], hue:["色相渐变","Hue spectrum"], warm:["暖 → 冷","Warm → cool"], chroma:["低 → 高彩度","Muted → vivid"],
    colourFilter:["筛选代表色","Filter palette colours"], allColours:["全部颜色","All colours"], red:["红橙","Red / orange"], yellow:["黄","Yellow"], green:["绿","Green"], cyan:["青","Cyan"], blue:["蓝","Blue"], purple:["紫","Purple"], neutral:["近中性","Near-neutral"],
    density:["色格大小","Palette size"], large:["大格","Large"], normal:["标准","Standard"], compact:["紧凑","Compact"], compare:["对比","Compare"],
    familyOrdering:["各科排列方式","Family arrangement"], countOrder:["数量排列","By count"], taxonomyOrder:["按目归组","Group by order"],
    locate:["定位匹配","Find matches"], clear:["清除筛选","Clear filters"], empty:["没有匹配的鸟种","No matching birds"], overview:["← 全部鸟目","← All orders"], comparisonModes:["对照类别","Comparison type"],
    compareBird:["鸟种对照","Bird comparison"], compareFamily:["科间对照","Family comparison"], compareOrder:["鸟目对照","Order comparison"],
    chooseBird:["选择鸟种","Choose birds"], chooseFamily:["选择科","Choose families"], chooseOrder:["选择目","Choose orders"],
    comparisonSlot:["第 {n} 个对照对象","Comparison item {n}"], searchOrders:["搜索目名","Search orders"],
    indexOrders:["鸟目索引","Order index"], indexFamilies:["科索引","Family index"], jumpOrder:["跳至鸟目","Jump to order"], jumpFamily:["所有科","All families"],
    scroll:["横向浏览各科","Browse families horizontally"], scrollPosition:["横向浏览位置","Horizontal position"], scrollPrevious:["向前浏览","Scroll back"], scrollNext:["向后浏览","Scroll forward"],
    paletteRegion:["鸟种色格，可滚动浏览","Bird palettes; scroll to explore"], keyboard:["方向键移动，回车打开鸟种详情","Use arrow keys to move and Enter to open bird details"],
    detail:["鸟种详情","Bird details"], return:["← 返回总览","← Back to atlas"], previous:["上一种","Previous bird"], next:["下一种","Next bird"],
    pickerHint:["选择 2–4 个对象。","Choose 2–4 items to compare."], pickerClose:["关闭选择面板","Close selection panel"], pickerSearch:["搜索科名或目名","Search families or orders"], pickerEmpty:["没有匹配的对象","No matches"],
    pickerCount:["已选 {n} / 4","{n} / 4 selected"], pickerApply:["对照所选 {n} 项","Compare {n} items"], pickerStart:["开始对照","Start comparison"], remove:["移除{name}","Remove {name}"],
    species:["{n} 种","{n} species"], familyCount:["{n} 科","{n} families"], scopeCount:["{families} 科 · {birds} 种","{families} families · {birds} species"], matchCount:["{n} / {total} 种","{n} / {total} species"],
    pinned:["已固定{name}，再点一个色格可并排对照。","{name} pinned. Select another bird to compare."],
    specimenEmpty:["选择图谱中的鸟种，查看照片和五种颜色。","Select a bird to see its photograph and five-colour palette."],
    views:["图片视图","Image views"], cutout:["鸟体","Cutout"], original:["原图","Original"], reconstruction:["色彩重建","Colour reconstruction"], mask:["蒙版","Mask"],
    fiveColours:["鸟体五色","Five-colour palette"], colourHint:["点选色块定位","Select a colour to locate it"], colourRestore:["再点选中色块复原","Select again to restore"], swatchesLabel:["照片五色，点击可定位","Five colours; select one to locate its pixels"], locateColour:["在鸟体上定位颜色 {hex}","Locate {hex} on the bird"],
    photoCredit:["摄影 {name}","Photo: {name}"], pinBird:["固定此鸟作对照","Pin bird for comparison"], endComparison:["结束对照","End comparison"], chooseAnother:["已固定{name}，在图谱中选另一只鸟。","{name} pinned. Choose another bird from the atlas."],
    colourPosition:["{hex} 在鸟体上的位置","Location of {hex} on the bird"], pixelPosition:["{hex} 的像素位置","Pixels of {hex}"], labelError:["这张照片的像素定位图暂时无法读取。","The pixel map for this photograph could not be loaded."], imageError:["图像无法读取，请检查本地鸟图目录。","Image unavailable. Check the local image folder."],
    classI:["国家一级保护","Class I state protection"], classII:["国家二级保护","Class II state protection"]
  };
  // Przevalski’s finch label: https://www.worldbirdnames.org/new/classification/family-index-2/
  // Descriptive English labels preserve the project's existing taxonomic grouping.
  const taxa = {
    "鸡形目":"Gamebirds","雁形目":"Waterfowl","鸊鷉目":"Grebes","鸽形目":"Pigeons","沙鸡目":"Sandgrouse","夜鹰目":"Nightjars & swifts","鹃形目":"Cuckoos","鸨形目":"Bustards","鹤形目":"Cranes & rails","鸻形目":"Shorebirds","鹱形目":"Tubenoses","鹳形目":"Storks","鲣鸟目":"Suliform birds","鹈形目":"Pelecaniform birds","鹰形目":"Hawks & allies","鸮形目":"Owls","咬鹃目":"Trogons","犀鸟目":"Hornbills","佛法僧目":"Coraciiform birds","啄木鸟目":"Woodpeckers","隼形目":"Falcons","鹦鹉目":"Parrots","雀形目":"Passerines",
    "雉科":"Pheasants","鸭科":"Ducks & geese","鸊鷉科":"Grebes","鸠鸽科":"Pigeons & doves","沙鸡科":"Sandgrouse","蛙口夜鹰科":"Frogmouths","凤头雨燕科":"Treeswifts","雨燕科":"Swifts","杜鹃科":"Cuckoos","鸨科":"Bustards","秧鸡科":"Rails","鹤科":"Cranes","石鸻科":"Thick-knees","鹮嘴鹬科":"Ibisbill","鸻科":"Plovers","水雉科":"Jacanas","鹬科":"Sandpipers","燕鸻科":"Pratincoles","鸥科":"Gulls & terns","海雀科":"Auks","信天翁科":"Albatrosses","鹳科":"Storks","军舰鸟科":"Frigatebirds","鲣鸟科":"Boobies","鸬鹚科":"Cormorants","鹮科":"Ibises & spoonbills","鹭科":"Herons","鹈鹕科":"Pelicans","鹗科":"Osprey","鹰科":"Hawks & eagles","鸱鸮科":"Typical owls","草鸮科":"Barn owls","咬鹃科":"Trogons","犀鸟科":"Hornbills","蜂虎科":"Bee-eaters","翠鸟科":"Kingfishers","啄木鸟科":"Woodpeckers","隼科":"Falcons","鹦鹉科":"Parrots","八色鸫科":"Pittas","阔嘴鸟科":"Broadbills","黄鹂科":"Orioles","卷尾科":"Drongos","鸦科":"Crows & jays","山雀科":"Tits","百灵科":"Larks","苇莺科":"Reed warblers","鹎科":"Bulbuls","莺鹛科":"Warbler-babblers","绣眼鸟科":"White-eyes","林鹛科":"Tree babblers","幽鹛科":"Ground babblers","噪鹛科":"Laughingthrushes","旋木雀科":"Treecreepers","鳾科":"Nuthatches","椋鸟科":"Starlings","鸫科":"Thrushes","鹟科":"Flycatchers","岩鹨科":"Accentors","朱鹀科":"Przevalski’s finch","燕雀科":"Finches","鹀科":"Buntings"
  };
  // Every launch opens the English wing overview; language can be changed in this session.
  let lang="en";
  function t(key, values={}) {
    const value=copy[key]?.[lang==="en"?1:0] ?? key;
    return value.replace(/\{(\w+)\}/g,(_,name)=>values[name]??"");
  }
  const taxon=name=>lang==="en"?(taxa[name]||name):name;
  const birdName=b=>lang==="en"?b.sci:b.name;
  function apply(){
    document.documentElement.lang=lang==="en"?"en":"zh-CN";
    document.body.classList.toggle("lang-en",lang==="en");
    document.querySelectorAll("[data-i18n]").forEach(e=>e.textContent=t(e.dataset.i18n));
    document.querySelectorAll("[data-i18n-label]").forEach(e=>e.setAttribute("aria-label",t(e.dataset.i18nLabel)));
    document.querySelectorAll("[data-i18n-placeholder]").forEach(e=>e.placeholder=t(e.dataset.i18nPlaceholder));
    document.querySelectorAll("[data-taxon]").forEach(e=>e.textContent=taxon(e.dataset.taxon));
    document.querySelectorAll("[data-species-count]").forEach(e=>e.textContent=t("species",{n:e.dataset.speciesCount}));
    document.getElementById("langZh").setAttribute("aria-pressed",String(lang==="zh"));
    document.getElementById("langEn").setAttribute("aria-pressed",String(lang==="en"));
  }
  function setLanguage(next){
    if(lang===next)return;
    lang=next;
    apply();document.dispatchEvent(new Event("atlaslanguagechange"));
  }
  window.AtlasI18n={t,taxon,birdName,apply,language:()=>lang,setLanguage,taxa};
  document.getElementById("langZh").onclick=()=>setLanguage("zh");
  document.getElementById("langEn").onclick=()=>setLanguage("en");
  apply();
})();
