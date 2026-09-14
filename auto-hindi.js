(function(){
  const $=id=>document.getElementById(id);
  const en=$('nameEn'),hi=$('nameHi'),btn=$('autoHindiBtn');
  if(!en||!hi)return;
  let lastTranslated='';let timer;
  async function translate(text,source,target){
    const clean=String(text||'').trim();if(!clean)return '';
    try{const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl='+encodeURIComponent(source)+'&tl='+encodeURIComponent(target)+'&dt=t&q='+encodeURIComponent(clean);const r=await fetch(url,{cache:'no-store'});if(!r.ok)return '';const data=await r.json();return Array.isArray(data?.[0])?data[0].map(x=>x?.[0]||'').join('').trim():''}catch{return ''}
  }
  async function autoHindi(force=false){
    const text=en.value.trim();if(!text)return;
    if(!force&&hi.value.trim()&&hi.value.trim()!==lastTranslated)return;
    const translated=await translate(text,'en','hi');
    if(translated&&en.value.trim()===text&&(force||!hi.value.trim()||hi.value.trim()===lastTranslated)){hi.value=translated;lastTranslated=translated;hi.dispatchEvent(new Event('input',{bubbles:true}))}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>autoHindi(false),650)}
  en.addEventListener('input',schedule);en.addEventListener('blur',()=>autoHindi(false));
  hi.addEventListener('input',()=>{if(hi.value.trim()!==lastTranslated)lastTranslated=''});
  btn?.addEventListener('click',()=>autoHindi(true));
})();
