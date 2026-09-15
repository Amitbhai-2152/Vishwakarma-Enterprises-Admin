(function(){
  const pairs=[
    {hi:'featuresHi',en:'featuresEn',feature:true},
    {hi:'descriptionHi',en:'descriptionEn',feature:false}
  ];
  const timers={};
  const requests={};
  const $=id=>document.getElementById(id);

  function clean(v){return String(v??'').trim()}
  function sourceLang(id){return id.endsWith('Hi')?'hi':'en'}
  function splitLines(text){return String(text||'').split(/\r?\n/) }

  async function requestTranslation(text,source,target){
    const value=clean(text);
    if(!value)return '';
    try{
      const url='/.netlify/functions/translate?source='+encodeURIComponent(source)+'&target='+encodeURIComponent(target)+'&text='+encodeURIComponent(value);
      const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}});
      if(!response.ok)return '';
      const data=await response.json().catch(()=>null);
      return data?.success?clean(data.translated):'';
    }catch{return ''}
  }

  async function translateFeatureBlock(text,source,target,requestId){
    const result=[];
    for(const raw of splitLines(text)){
      const line=clean(raw);
      if(!line){result.push('');continue}
      const translated=await requestTranslation(line,source,target);
      if(requests[requestId]?.cancelled)return '';
      result.push(translated||line);
    }
    return result.join('\n');
  }

  function key(sourceId,targetId){return sourceId+'>'+targetId}
  function cancel(sourceId,targetId){
    const k=key(sourceId,targetId);
    if(requests[k])requests[k].cancelled=true;
    clearTimeout(timers[k]);
  }

  async function sync(sourceId,targetId,force=false){
    const source=$(sourceId),target=$(targetId);
    if(!source||!target)return;
    const text=clean(source.value);
    if(!text)return;

    const k=key(sourceId,targetId);
    const requestId={id:Date.now()+Math.random(),cancelled:false};
    requests[k]=requestId;

    const feature=pairs.some(p=>p.feature&&p.hi===sourceId);
    const translated=feature
      ? await translateFeatureBlock(source.value,sourceLang(sourceId),sourceLang(targetId),k)
      : await requestTranslation(source.value,sourceLang(sourceId),sourceLang(targetId));

    if(requests[k]!==requestId||requestId.cancelled)return;
    if(!translated||clean(source.value)!==text)return;

    target.value=translated;
    target.dataset.autoTranslated='true';
    if(feature){
      window.veFeatureSet?.(targetId,translated,-1);
    }else{
      target.dispatchEvent(new Event('input',{bubbles:true}));
      target.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function schedule(sourceId,targetId){
    cancel(sourceId,targetId);
    const k=key(sourceId,targetId);
    timers[k]=setTimeout(()=>sync(sourceId,targetId,false),700);
  }

  function force(sourceId,targetId){
    cancel(sourceId,targetId);
    sync(sourceId,targetId,true);
  }

  function addButton(text,handler){
    const b=document.createElement('button');
    b.type='button';
    b.className='mini-btn auto-translate-btn';
    b.textContent=text;
    b.addEventListener('click',e=>{e.preventDefault();handler()});
    return b;
  }

  function setupDescriptionPair(pair){
    const hi=$(pair.hi),en=$(pair.en);
    if(!hi||!en||hi.dataset.translationReady)return;
    hi.dataset.translationReady='1';
    en.dataset.translationReady='1';

    hi.closest('label')?.insertBefore(addButton('↔ Auto English',()=>force(pair.hi,pair.en)),hi);
    en.closest('label')?.insertBefore(addButton('↔ Auto Hindi',()=>force(pair.en,pair.hi)),en);

    function bind(id,other){
      $(id).addEventListener('input',()=>{
        if($(id).dataset.autoTranslated==='true'){
          delete $(id).dataset.autoTranslated;
          return;
        }
        cancel(other,id);
        schedule(id,other);
      });
    }
    bind(pair.hi,pair.en);
    bind(pair.en,pair.hi);
  }

  function featureInput(event){
    const input=event.target.closest('.ve-feature-input');
    if(!input)return;
    const editor=input.closest('.ve-feature-editor');
    if(!editor)return;
    const sourceId=editor.id.replace(/Editor$/,'');
    const targetId=sourceId==='featuresHi'?'featuresEn':'featuresHi';
    schedule(sourceId,targetId);
  }

  function init(){
    setupDescriptionPair(pairs.find(p=>!p.feature));
    document.addEventListener('input',featureInput);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
