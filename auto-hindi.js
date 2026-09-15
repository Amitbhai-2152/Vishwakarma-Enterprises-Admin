(function(){
  const $=id=>document.getElementById(id);
  const en=$('nameEn'),hi=$('nameHi'),btn=$('autoHindiBtn');
  if(!en||!hi)return;
  let lastTranslated='';
  let timer;

  async function translate(text){
    const clean=String(text||'').trim();
    if(!clean)return '';
    try{
      const r=await fetch('/.netlify/functions/translate?source=en&target=hi&text='+encodeURIComponent(clean),{cache:'no-store'});
      if(!r.ok)return '';
      const data=await r.json();
      return data?.success?String(data.translated||'').trim():'';
    }catch{return ''}
  }

  async function autoHindi(force=false){
    const text=en.value.trim();
    if(!text)return;
    if(!force&&hi.value.trim()&&hi.value.trim()!==lastTranslated)return;
    const translated=await translate(text);
    if(!translated){
      window.toast?.('Auto Hindi translation failed. Please check the internet connection.');
      return;
    }
    if(en.value.trim()===text&&(force||!hi.value.trim()||hi.value.trim()===lastTranslated)){
      hi.value=translated;
      lastTranslated=translated;
      hi.dispatchEvent(new Event('input',{bubbles:true}));
      hi.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(()=>autoHindi(false),700)}
  en.addEventListener('input',schedule);
  en.addEventListener('blur',()=>autoHindi(false));
  hi.addEventListener('input',()=>{if(hi.value.trim()!==lastTranslated)lastTranslated=''});
  btn?.addEventListener('click',e=>{e.preventDefault();autoHindi(true)});
})();
