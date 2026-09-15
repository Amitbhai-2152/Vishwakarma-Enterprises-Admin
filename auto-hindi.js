(function(){
  const $=id=>document.getElementById(id);
  const en=$('nameEn'),hi=$('nameHi'),btn=$('autoHindiBtn');
  if(!en||!hi)return;
  let lastTranslated='';
  let timer;

  async function request(url,parse){
    try{
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),9000);
      const r=await fetch(url,{cache:'no-store',signal:controller.signal});
      clearTimeout(timeout);
      if(!r.ok)return '';
      const data=await r.json();
      return parse(data)||'';
    }catch{return ''}
  }

  async function translate(text){
    const clean=String(text||'').trim();
    if(!clean)return '';

    const google='https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q='+encodeURIComponent(clean);
    const g=await request(google,data=>Array.isArray(data?.[0])?data[0].map(x=>x?.[0]||'').join('').trim():'');
    if(g)return g;

    const mm='https://api.mymemory.translated.net/get?q='+encodeURIComponent(clean)+'&langpair=en|hi';
    return request(mm,data=>String(data?.responseData?.translatedText||'').trim());
  }

  async function autoHindi(force=false){
    const text=en.value.trim();
    if(!text)return;
    if(!force&&hi.value.trim()&&hi.value.trim()!==lastTranslated)return;

    const translated=await translate(text);
    if(!translated){
      window.toast?.('Auto Hindi translation failed. Check internet connection and try again.');
      return;
    }

    if(en.value.trim()===text&&(force||!hi.value.trim()||hi.value.trim()===lastTranslated)){
      hi.value=translated;
      lastTranslated=translated;
      hi.dispatchEvent(new Event('input',{bubbles:true}));
      hi.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>autoHindi(false),650);
  }

  en.addEventListener('input',schedule);
  en.addEventListener('blur',()=>autoHindi(false));
  hi.addEventListener('input',()=>{
    if(hi.value.trim()!==lastTranslated)lastTranslated='';
  });
  btn?.addEventListener('click',()=>autoHindi(true));
})();
