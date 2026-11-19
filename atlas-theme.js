(() => {
  const control=document.getElementById("themeSwitch");
  const initial="light";
  const apply=value=>{
    const theme=value==="light"?"light":"dark";
    document.documentElement.dataset.theme=theme;control.value=theme;
    try { localStorage.setItem("bird-atlas-theme",theme); } catch {}
  };
  control.addEventListener("change",()=>apply(control.value));
  apply(initial);
})();
