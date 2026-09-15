(function(){
  const pairs=[
    {hi:'featuresHi',en:'featuresEn',feature:true},
    {hi:'descriptionHi',en:'descriptionEn',feature:false}
  ];
  const timers={};
  const state={};
  const $=id=>document.getElementById(id);

  function clean(v){return String(v??'').trim()}
  function sourceLang(id){return id.endsWith('Hi')?'hi':'en'}
  function isHindiText(text){return /[\u0900-\u097F]/.test(String(text||''))}
  function splitLines(text){return String(text||'').split(/\r?\n/)}

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

  async function translateFeatureBlock(text,source,target){
    const lines=splitLines(text);
    const output=[];
    for(const line of lines){
      const value=clean(line);
      if(!value){output.push('');continue}
      const translated=await requestTranslation(value,source,target);
      output.push(translated||value);
    }
    return output.join('\n');
  }

  function pairFor(sourceId,targetId){
    return sourceId+'>'+targetId;
  }

  function getState(sourceId,targetId){
    const key=pairFor(sourceId,targetId);
    return state[key]||(state[key]={lastSource:'',lastTarget:'',targetDirty:false,request:0});
  }

  async function sync(sourceId,targetId,force){
    const source=$(sourceId),target=$(targetId);
    if(!source||!target)return;
    const text=clean(source.value);
    if(!text)return;

    const s=getState(sourceId,targetId);
    if(!force && s.targetDirty && clean(target.value))return;

    const requestId=++s.request;
    const feature=pairs.some(p=>p.feature&&p.hi===sourceId);
    const translated=feature
      ? await translateFeatureBlock(source.value,sourceLang(sourceId),sourceLang(targetId))
      : await requestTranslation(source.value,sourceLang(sourceId),sourceLang(targetId));

    if(!translated||requestId!==s.request||clean(source.value)!==text)return;

    target.value=translated;
    s.lastSource=text;
    s.lastTarget=translated;
    s.targetDirty=false;
    target.dataset.autoTranslated='true';

    if(feature){
      window.veFeatureSet?.(targetId,translated,-1);
    }else{
      target.dispatchEvent(new Event('input',{bubbles:true}));
      target.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function schedule(sourceId,targetId){
    const key=pairFor(sourceId,targetId);
    clearTimeout(timers[key]);
    timers[key]=setTimeout(()=>sync(sourceId,targetId,false),900);
  }

  function forceTranslate(sourceId,targetId){
    const s=getState(sourceId,targetId);
    s.targetDirty=false;
    s.request++;
    sync(sourceId,targetId,true);
  }

  function addButton(label,handler){
    const button=document.createElement('button');
    button.type='button';
    button.className='mini-btn auto-translate-btn';
    button.textContent=label;
    button.addEventListener('click',event=>{event.preventDefault();handler()});
    return button;
  }

  function setupDescriptionPair(pair){
    const hi=$(pair.hi),en=$(pair.en);
    if(!hi||!en)return;
    if(!hi.dataset.translationBound){
      hi.dataset.translationBound='1';
      en.dataset.translationBound='1';

      hi.closest('label')?.insertBefore(addButton('↔ Auto English',()=>forceTranslate(pair.hi,pair.en)),hi);
      en.closest('label')?.insertBefore(addButton('↔ Auto Hindi',()=>forceTranslate(pair.en,pair.hi)),en);

      hi.addEventListener('input',()=>{
        const s=getState(pair.hi,pair.en);
        s.targetDirty=false;
        delete state[pairFor(pair.hi,pair.en)].lastTarget;
        schedule(pair.hi,pair.en);
      });
      en.addEventListener('input',()=>{
        const s=getState(pair.en,pair.hi);
        s.targetDirty=false;
        const reverse=getState(pair.en,pair.hi);
        reverse.targetDirty=false;
        schedule(pair.en,pair.hi);
      });

      // A target field should only become protected when the user actually edits it.
      // Programmatic input events generated after an auto-translation are ignored.
      const protectManual=(id,targetId)=>{
        $(id).addEventListener('input',event=>{
          if($(id).dataset.autoTranslated==='true'){
            delete $(id).dataset.autoTranslated;
            return;
          }
          const reverse=getState(id,targetId);
          reverse.targetDirty=true;
          clearTimeout(timers[pairFor(targetId,id)]);
        });
      };
      protectManual(hi,pair.en);
      protectManual(en,pair.hi);
    }
  }

  function featureEditorInput(event){
    const input=event.target.closest('.ve-feature-input');
    if(!input)return;
    const editor=input.closest('.ve-feature-editor');
    if(!editor)return;
    const sourceId=editor.id.replace(/Editor$/,'');
    const targetId=sourceId==='featuresHi'?'featuresEn':'featuresHi';
    const reverse=getState(sourceId,targetId);
    reverse.targetDirty=false;
    const targetState=getState(targetId,sourceId);
    targetState.targetDirty=true;
    clearTimeout(timers[pairFor(targetId,sourceId)]);
    schedule(sourceId,targetId);
  }

  function init(){
    pairs.filter(p=>!p.feature).forEach(setupDescriptionPair);
    document.addEventListener('input',featureEditorInput);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
