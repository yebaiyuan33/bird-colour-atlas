(() => {
  "use strict";
  const NS="http://www.w3.org/2000/svg";
  function element(tag, attributes={}) {
    const node=document.createElementNS(NS,tag);
    for(const [name,value] of Object.entries(attributes))node.setAttribute(name,String(value));
    return node;
  }
  function shares(bird) {
    const values=bird.proportions;
    if(!Array.isArray(values)||values.length!==5||values.some(p=>!Number.isFinite(p)||p<0))return null;
    const total=values.reduce((sum,p)=>sum+p,0);
    if(Math.abs(total-1)>0.001)return null;
    return values.map(p=>p/total);
  }
  // Ordered binary treemap: split consecutive colours near half their summed share.
  // Rectangles completely tile the unit square, with no gaps or area inflation.
  function mosaic(entries,x=0,y=0,width=100,height=100) {
    if(!entries.length)return [];
    if(entries.length===1)return [{...entries[0],x,y,width,height}];
    const total=entries.reduce((s,c)=>s+c.share,0);
    let sum=0,best=Infinity,split=1;
    for(let i=1;i<entries.length;i++){
      sum+=entries[i-1].share;
      const difference=Math.abs(total/2-sum);
      if(difference<best){best=difference;split=i;}
    }
    const first=entries.slice(0,split),second=entries.slice(split);
    const ratio=first.reduce((s,c)=>s+c.share,0)/total;
    if(width>=height)return [...mosaic(first,x,y,width*ratio,height),...mosaic(second,x+width*ratio,y,width*(1-ratio),height)];
    return [...mosaic(first,x,y,width,height*ratio),...mosaic(second,x,y+height*ratio,width,height*(1-ratio))];
  }
  function draw(bird,kind,palette) {
    const svg=element("svg",{viewBox:kind==="mosaic"?"0 0 100 100":"12 4 130 128","aria-hidden":"true"});
    svg.classList.add("wingGlyph");svg.dataset.kind=kind;
    const proportions=shares(bird);
    if(!proportions){svg.dataset.unavailable="true";return svg;}
    const entries=palette.map(c=>({...c,share:proportions[c.index]}));
    if(kind==="mosaic"){
      svg.setAttribute("shape-rendering","crispEdges");
      for(const rect of mosaic(entries.filter(c=>c.share>0))){
        const shape=element("rect",{x:rect.x,y:rect.y,width:rect.width,height:rect.height,fill:rect.hex});
        shape.dataset.colorIndex=rect.index;shape.dataset.share=rect.share;
        svg.append(shape);
      }
    }else{
      const maximum=Math.max(...proportions);
      entries.forEach((colour,i)=>{
        const length=108*colour.share/maximum;
        // Axis length is linear in within-photo share. Width only shapes the feather.
        const halfWidth=Math.min(8,length*.14);
        const d="M0 0 C"+(length*.23)+" "+(-halfWidth)+" "+(length*.70)+" "+(-halfWidth*1.5)+" "+length+" 0 C"+(length*.7)+" "+halfWidth+" "+(length*.30)+" "+halfWidth+" 0 0Z";
        const shape=element("path",{d,transform:"translate(23 119) rotate("+(-85+81*i/4)+")",fill:colour.hex});
        shape.dataset.colorIndex=colour.index;shape.dataset.share=colour.share;shape.dataset.axisLength=length;
        svg.append(shape);
      });
    }
    return svg;
  }
  window.AtlasShapes={draw,shares,mosaic};
})();
