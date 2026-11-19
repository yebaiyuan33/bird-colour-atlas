/* Exact area encoding of the five colour shares in one photograph. */
(() => {
  "use strict";
  const NS="http://www.w3.org/2000/svg";
  const node=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
  function shares(bird){
    const values=bird?.proportions;
    if(!Array.isArray(values)||values.length!==5||values.some(v=>!Number.isFinite(v)||v<0))return null;
    const total=values.reduce((a,b)=>a+b,0);
    return total>0?values.map(v=>v/total):null;
  }
  function highlight(svg,index){
    if(!svg)return;
    svg.dataset.active=index==null?"":String(index);
    svg.querySelectorAll("[data-color-index]").forEach(shape=>{
      const active=index==null||Number(shape.dataset.colorIndex)===Number(index);
      shape.style.opacity=active?"1":".16";
      shape.classList.toggle("isHighlighted",index!=null&&active);
    });
  }
  function draw(bird,palette,options={}){
    const svg=node("svg",{viewBox:"0 0 200 200"});
    svg.classList.add("wingGlyph","pieGlyph");svg.dataset.kind="pie";
    const values=shares(bird),interactive=!!options.interactive;
    if(interactive){svg.setAttribute("role","group");svg.setAttribute("aria-label",window.AtlasI18n?.language()==="en"?"Photo colour shares":"照片色彩占比");}
    else svg.setAttribute("aria-hidden","true");
    if(!values){svg.dataset.unavailable="true";return svg;}
    const entries=palette||bird.colors.map((hex,index)=>({hex,index}));
    const available=entries.filter(c=>values[c.index]>0);
    let angle=-Math.PI/2;
    available.forEach((colour,position)=>{
      const share=values[colour.index],end=angle+share*2*Math.PI;
      const attrs={fill:colour.hex,"data-color-index":colour.index,"data-share":share};
      let shape;
      if(share>=1-1e-12)shape=node("circle",{...attrs,cx:100,cy:100,r:96});
      else{
        const start=[100+96*Math.cos(angle),100+96*Math.sin(angle)],finish=[100+96*Math.cos(end),100+96*Math.sin(end)];
        shape=node("path",{...attrs,d:"M100 100L"+start.join(" ")+"A96 96 0 "+(share>.5?1:0)+" 1 "+finish.join(" ")+"Z"});
      }
      const label=colour.hex+" · "+(share*100).toFixed(1)+"%";
      const title=node("title");title.textContent=label;shape.append(title);
      if(interactive){
        shape.setAttribute("tabindex","0");shape.setAttribute("role","button");shape.setAttribute("aria-label",label);
        const preview=()=>{highlight(svg,colour.index);options.onHighlight?.(colour.index);};
        shape.addEventListener("pointerenter",preview);shape.addEventListener("focus",preview);
        shape.addEventListener("blur",()=>{highlight(svg,null);options.onHighlight?.(null);});
        shape.addEventListener("click",()=>options.onSelect?.(colour.index));
        shape.addEventListener("keydown",event=>{
          if(event.key==="Enter"||event.key===" "){event.preventDefault();event.stopPropagation();options.onSelect?.(colour.index);}
          if(event.key==="ArrowRight"||event.key==="ArrowLeft"){
            event.preventDefault();event.stopPropagation();
            const pieces=[...svg.querySelectorAll("[data-color-index]")];pieces[(position+(event.key==="ArrowRight"?1:pieces.length-1))%pieces.length]?.focus();
          }
          if(event.key==="Escape"){event.preventDefault();event.stopPropagation();shape.blur();highlight(svg,null);options.onHighlight?.(null);options.onSelect?.(null);}
        });
      }
      svg.append(shape);angle=end;
    });
    if(interactive)svg.addEventListener("pointerleave",()=>{highlight(svg,null);options.onHighlight?.(null);});
    return svg;
  }
  window.AtlasPie={draw,shares,highlight};
})();
