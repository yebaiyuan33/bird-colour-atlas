(() => {
  "use strict";
  const cache=new WeakMap(), colours=new Map(), palettes=new WeakMap();
  const delta=6/29;
  const linear=x=>{const v=x/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  const root=x=>x>delta**3?Math.cbrt(x):x/(3*delta**2)+4/29;
  function colour(hex){
    if(colours.has(hex))return colours.get(hex);
    const n=parseInt(hex.slice(1),16),r=linear(n>>16),g=linear((n>>8)&255),b=linear(n&255);
    const X=root((.412453*r+.357580*g+.180423*b)/.95047),Y=root(.212671*r+.715160*g+.072169*b),Z=root((.019334*r+.119193*g+.950227*b)/1.08883);
    const L=116*Y-16,a=500*(X-Y),bb=200*(Y-Z),C=Math.hypot(a,bb),angle=Math.atan2(bb,a);
    const result={light:L,chroma:C,warm:C<8?0:a*.5+bb*Math.sqrt(3)/2,hue:(angle*180/Math.PI+340)%360,neutral:C<8,a,b:bb};
    colours.set(hex,result);return result;
  }
  function metrics(bird){
    if(cache.has(bird))return cache.get(bird);
    const values=bird.colors.map(colour),n=values.length;
    const light=values.reduce((s,c)=>s+c.light,0)/n,chroma=values.reduce((s,c)=>s+c.chroma,0)/n,warm=values.reduce((s,c)=>s+c.warm,0)/n;
    const chromatic=values.filter(c=>!c.neutral),a=chromatic.reduce((s,c)=>s+c.a,0),b=chromatic.reduce((s,c)=>s+c.b,0);
    const result={light,chroma,warm,hue:(Math.atan2(b,a)*180/Math.PI+340)%360,neutral:chroma<8||!chromatic.length};
    cache.set(bird,result);return result;
  }
  function compareMetrics(x,y,mode){
    if(mode==='hue')return Number(x.neutral)-Number(y.neutral)||(x.neutral?y.light-x.light:x.hue-y.hue)||y.light-x.light;
    if(mode==='warm')return y.warm-x.warm||y.light-x.light;
    if(mode==='chroma')return x.chroma-y.chroma||y.light-x.light;
    return y.light-x.light||x.hue-y.hue;
  }
  function compare(a,b,mode='light'){return compareMetrics(metrics(a),metrics(b),mode)||a.id-b.id;}
  // Retain the original cluster index and rank: only display positions change.
  function palette(bird,mode='light'){
    if(!palettes.has(bird))palettes.set(bird,new Map());
    const byMode=palettes.get(bird);
    if(!byMode.has(mode))byMode.set(mode,bird.colors.map((hex,index)=>({hex,index,rank:bird.ranks[index]})).sort((a,b)=>compareMetrics(colour(a.hex),colour(b.hex),mode)||a.index-b.index));
    return byMode.get(mode);
  }
  window.AtlasSort={metrics,compare,palette,colour};
})();
