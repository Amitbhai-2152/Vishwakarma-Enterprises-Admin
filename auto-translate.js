(function(){
  const $=id=>document.getElementById(id);
  const timers={};
  const state={};
  const pairs=[['featuresHi','featuresEn'],['descriptionHi','descriptionEn']];

  function lang(id){return id.endsWith('Hi')?'hi':'en'}
  function clean(v){return String(v||'').replace(/\r\n?/g,'\n').trim()}

  async function translateText(text,source,target){
    const value=clean(text); if(!value)return '';
    try{
      const r=await fetch('/.netlify/functions/translate?source='+encodeURIComponent(source)+'&target='+encodeURIComponent(target)+'&text='+encodeURIComponent(value),{cache:'no-store'});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data?.success)return '';
      return clean(data.translated);
    }catch{return ''}
  }

  async function translateBlock(text,source,target,isFeature){
    const value=clean(text); if(!value)return '';
    if(!isFeature)return translateText(value,source,target);

    // Feature editors are bullet based. Translate each non-empty bullet
    // independently so one API response cannot merge/reorder bullets.
    const sourceLines=value.split('\n').map(x=>x.replace(/^\s*[-•▪◦‣]\s*/,'').trim()).filter(Boolean);
    const out=[];
    for(const line of sourceLines){
      const translated=await translateText(line,source,target);
      if(!translated)return '';
      out.push(translated.replace(/\r?\n/g,' ').trim());
    }
    return out.join('\n');
  }

  function key(a,b){return a+'>'+b}

  async function run(sourceId,targetId,force){
    const source=$(sourceId),target=$(targetId); if(!source||!target)return;
    const text=clean(source.value); if(!text)return;
    const k=key(sourceId,targetId),s=state[k]||{};
    const currentTarget=clean(target.value);
    if(!force&&currentTarget&&currentTarget!==clean(s.lastTarget))return;

    const isFeature=sourceId==='featuresHi'||sourceId==='featuresEn';
    const translated=await translateBlock(text,lang(sourceId),lang(targetId),isFeature);
    if(!translated||clean(source.value)!==text)return;

    const latestTarget=clean(target.value);
    if(!force&&latestTarget&&latestTarget!==clean(s.lastTarget))return;

    if(isFeature&&typeof window.veFeatureSet==='function'){
      window.veFeatureSet(targetId,translated,-1);
    }else{
      target.value=translated;
      target.dispatchEvent(new Event('input',{bubbles:true}));
      target.dispatchEvent(new Event('change',{bubbles:true}));
    }
    state[k]={lastSource:text,lastTarget:translated};
    target.dataset.autoTranslated='true';
  }

  function schedule(sourceId,targetId){
    const k=key(sourceId,targetId);
    clearTimeout(timers[k]);
    timers[k]=setTimeout(()=>run(sourceId,targetId,false),900);
  }

  function button(text,handler){
    const b=document.createElement('button');
    b.type='button';b.className='mini-btn auto-translate-btn';b.textContent=text;
    b.addEventListener('click',e=>{e.preventDefault();handler()});
    return b;
  }

  function addDescriptionControls(hiId,enId){
    const hi=$(hiId),en=$(enId); if(!hi||!en)return;
    if(hi.dataset.translationReady==='1'||en.dataset.translationReady==='1')return;
    hi.dataset.translationReady=en.dataset.translationReady='1';
    hi.closest('label')?.insertBefore(button('↔ Auto English',()=>run(hiId,enId,true)),hi);
    en.closest('label')?.insertBefore(button('↔ Auto Hindi',()=>run(enId,hiId,true)),en);

    hi.addEventListener('input',()=>{delete state[key(hiId,enId)];delete state[key(enId,hiId)];schedule(hiId,enId)});
    en.addEventListener('input',()=>{delete state[key(hiId,enId)];delete state[key(enId,hiId)];schedule(enId,hiId)});
  }

  function featureEditorInput(e){
    const input=e.target.closest('.ve-feature-input'); if(!input)return;
    const editor=input.closest('.ve-feature-editor'); if(!editor)return;
    const sourceId=editor.id.replace(/Editor$/,'');
    if(sourceId!=='featuresHi'&&sourceId!=='featuresEn')return;
    const targetId=sourceId==='featuresHi'?'featuresEn':'featuresHi';
    delete state[key(sourceId,targetId)];
    delete state[key(targetId,sourceId)];
    schedule(sourceId,targetId);
  }

  function init(){
    addDescriptionControls('featuresHi','featuresEn');
    addDescriptionControls('descriptionHi','descriptionEn');
    document.addEventListener('input',featureEditorInput);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
