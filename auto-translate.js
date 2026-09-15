(function(){
  const $=id=>document.getElementById(id);
  const timers={},busy={};
  const romanHints=new Set(['mai','main','mein','me','mujhe','mera','meri','mere','hum','ham','hai','hain','hu','ho','hoon','hun','tha','thi','the','aap','ap','tum','tu','ye','yah','woh','wo','vo','kya','kaise','kaisa','kyu','kyon','kyun','nahi','nahin','na','se','ko','ke','ki','ka','par','pe','aur','bhi','bahut','bohot','acha','achha','accha','ek','iske','uske','karna','karo','karta','karte','wali','wala','waale','chahiye','raha','rahi','rahe','mujhse','apna','apne','apni','sab','kuch','kaam','naam','ghar','pani','paani','kaha','kab','kyonki']);
  const clean=v=>String(v??'').trim();
  const hasHindi=v=>/[\u0900-\u097F]/.test(String(v||''));
  const detectSource=(text,fallback='en')=>{const v=clean(text);if(hasHindi(v))return 'hi';const words=v.toLowerCase().split(/[^a-z]+/).filter(Boolean);return words.some(w=>romanHints.has(w))?'hi':fallback};
  const targetLang=id=>id.endsWith('Hi')?'hi':'en';
  const key=(a,b)=>a+'>'+b;

  async function requestTranslation(text,target,sourceFallback){
    const value=clean(text);if(!value)return '';
    const source=detectSource(value,sourceFallback);
    try{
      const url='/.netlify/functions/translate?source='+encodeURIComponent(source)+'&target='+encodeURIComponent(target)+'&text='+encodeURIComponent(value);
      const r=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}});
      const data=await r.json().catch(()=>null);
      return r.ok&&data?.success?clean(data.translated):'';
    }catch{return ''}
  }

  function setAuto(el){if(el)el.dataset.autoTranslated='true'}
  function consumeAuto(el){if(el?.dataset.autoTranslated==='true'){delete el.dataset.autoTranslated;return true}return false}

  async function translateDescription(sourceId,targetId,force=false){
    const source=$(sourceId),target=$(targetId);if(!source||!target)return;
    const text=clean(source.value);if(!text)return;
    if(!force&&clean(target.value)&&!target.dataset.autoTranslated)return;
    const id=key(sourceId,targetId),token=(busy[id]||0)+1;busy[id]=token;
    const translated=await requestTranslation(text,targetLang(targetId),sourceId.endsWith('Hi')?'hi':'en');
    if(busy[id]!==token||clean(source.value)!==text||!translated)return;
    target.value=translated;setAuto(target);
  }

  function scheduleDescription(sourceId,targetId){const id=key(sourceId,targetId);clearTimeout(timers[id]);timers[id]=setTimeout(()=>translateDescription(sourceId,targetId),800)}

  function addButton(label,handler){
    const b=document.createElement('button');b.type='button';b.className='mini-btn auto-translate-btn';b.textContent=label;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();handler()});return b;
  }

  function installDescriptionControls(){
    const hi=$('descriptionHi'),en=$('descriptionEn');if(!hi||!en)return;
    if(!hi.dataset.translationReady){
      hi.dataset.translationReady='1';en.dataset.translationReady='1';
      hi.closest('label')?.insertBefore(addButton('↔ Auto English',()=>translateDescription('descriptionHi','descriptionEn',true)),hi);
      en.closest('label')?.insertBefore(addButton('↔ Auto Hindi',()=>translateDescription('descriptionEn','descriptionHi',true)),en);
      hi.addEventListener('input',()=>{if(consumeAuto(hi))return;clearTimeout(timers[key('descriptionEn','descriptionHi')]);scheduleDescription('descriptionHi','descriptionEn')});
      en.addEventListener('input',()=>{if(consumeAuto(en))return;clearTimeout(timers[key('descriptionHi','descriptionEn')]);scheduleDescription('descriptionEn','descriptionHi')});
    }
  }

  async function translateFeatures(sourceId,targetId,force=false){
    const source=$(sourceId),target=$(targetId);if(!source||!target)return;
    const text=clean(source.value);if(!text)return;
    if(!force&&clean(target.value)&&!target.dataset.autoTranslated)return;
    const id=key(sourceId,targetId),token=(busy[id]||0)+1;busy[id]=token;
    const out=[];
    for(const raw of String(source.value).split(/\r?\n/)){
      if(!clean(raw)){out.push('');continue}
      const translated=await requestTranslation(raw,targetLang(targetId),sourceId.endsWith('Hi')?'hi':'en');
      if(busy[id]!==token||clean(source.value)!==text)return;
      out.push(translated||clean(raw));
    }
    const translated=out.join('\n');
    if(busy[id]!==token||clean(source.value)!==text||!translated)return;
    target.value=translated;setAuto(target);window.veFeatureSet?.(targetId,translated,-1);
  }

  function scheduleFeatures(sourceId,targetId){const id=key(sourceId,targetId);clearTimeout(timers[id]);timers[id]=setTimeout(()=>translateFeatures(sourceId,targetId),900)}

  function installFeatureControl(sourceId,targetId){
    const editor=$(sourceId+'Editor');if(!editor)return;
    const head=editor.querySelector('.ve-feature-head');if(!head||head.dataset.translationReady)return;
    head.dataset.translationReady='1';
    const wrap=document.createElement('div');wrap.className='auto-feature-translate';wrap.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-left:auto';
    const b=addButton(targetLang(targetId)==='en'?'↔ Auto English':'↔ Auto Hindi',()=>translateFeatures(sourceId,targetId,true));
    wrap.appendChild(b);
    const add=head.querySelector('.ve-feature-add');if(add)wrap.appendChild(add);
    head.appendChild(wrap);
  }

  function featureInput(e){
    const input=e.target.closest('.ve-feature-input');if(!input)return;
    const editor=input.closest('.ve-feature-editor');if(!editor)return;
    const sourceId=editor.id.replace(/Editor$/,'');
    const targetId=sourceId==='featuresHi'?'featuresEn':'featuresHi';
    scheduleFeatures(sourceId,targetId);
  }

  function install(){
    installDescriptionControls();
    installFeatureControl('featuresHi','featuresEn');
    installFeatureControl('featuresEn','featuresHi');
  }

  function init(){
    install();
    document.addEventListener('input',featureInput);
    const observer=new MutationObserver(install);
    observer.observe(document.body,{subtree:true,childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
