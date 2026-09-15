(function(){
  const $=id=>document.getElementById(id);
  const timers={};
  const state={};
  const pairs=[['featuresHi','featuresEn'],['descriptionHi','descriptionEn']];
  function sourceFor(id){return id.endsWith('Hi')?'hi':'en'}

  async function translateText(text,source,target){
    const clean=String(text||'').trim();
    if(!clean)return '';
    try{
      const r=await fetch('/.netlify/functions/translate?source='+encodeURIComponent(source)+'&target='+encodeURIComponent(target)+'&text='+encodeURIComponent(clean),{cache:'no-store'});
      if(!r.ok)return '';
      const data=await r.json();
      return data?.success?String(data.translated||'').trim():'';
    }catch{return ''}
  }

  async function translateContent(text,source,target,isFeature){
    // Translate the complete description/feature block at once so sentence
    // context is preserved. Newlines are retained for feature bullets.
    const translated=await translateText(text,source,target);
    if(translated)return translated;

    // Fallback only if whole-block translation fails.
    if(!isFeature)return '';
    const lines=String(text).split(/\r?\n/),out=[];
    for(const line of lines){
      const clean=line.trim();
      if(!clean){out.push('');continue}
      out.push(await translateText(clean,source,target)||clean);
    }
    return out.join('\n');
  }

  function pairKey(sourceId,targetId){return sourceId+'>'+targetId}

  async function sync(sourceId,targetId,force=false){
    const source=$(sourceId),target=$(targetId);if(!source||!target)return;
    const text=source.value.trim();if(!text)return;
    const key=pairKey(sourceId,targetId),s=state[key]||{},currentTarget=target.value.trim();
    if(!force&&currentTarget&&currentTarget!==s.lastTarget)return;

    const isFeature=sourceId==='featuresHi'||sourceId==='featuresEn';
    const translated=await translateContent(text,sourceFor(sourceId),sourceFor(targetId),isFeature);
    if(!translated||source.value.trim()!==text)return;

    const latestTarget=target.value.trim();
    if(!force&&latestTarget&&latestTarget!==s.lastTarget)return;

    target.value=translated;
    state[key]={lastSource:text,lastTarget:translated};
    target.dataset.autoTranslated='true';

    if(targetId==='featuresHi'||targetId==='featuresEn'){
      window.veFeatureSet?.(targetId,translated,-1);
    }else{
      target.dispatchEvent(new Event('input',{bubbles:true}));
      target.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  function schedule(sourceId,targetId){
    clearTimeout(timers[pairKey(sourceId,targetId)]);
    timers[pairKey(sourceId,targetId)]=setTimeout(()=>sync(sourceId,targetId,false),1200);
  }

  function makeButton(text,handler){
    const b=document.createElement('button');
    b.type='button';b.className='mini-btn auto-translate-btn';b.textContent=text;
    b.addEventListener('click',e=>{e.preventDefault();handler()});
    return b;
  }

  function addControls(hiId,enId){
    const hi=$(hiId),en=$(enId);if(!hi||!en)return;
    const marker='translatorReady8';
    if(hi.dataset[marker]||en.dataset[marker])return;
    hi.dataset[marker]=en.dataset[marker]='1';

    const hiLabel=hi.closest('label'),enLabel=en.closest('label');
    if(hiLabel)hiLabel.insertBefore(makeButton('↔ Auto English',()=>sync(hiId,enId,true)),hi);
    if(enLabel)enLabel.insertBefore(makeButton('↔ Auto Hindi',()=>sync(enId,hiId,true)),en);

    const bind=(id)=>{
      const el=$(id);if(!el)return;
      const isFeature=id==='featuresHi'||id==='featuresEn';
      if(!isFeature)el.addEventListener('input',()=>{
        delete state[pairKey(hiId,enId)];
        delete state[pairKey(enId,hiId)];
        schedule(id,id===hiId?enId:hiId);
      });
    };
    bind(hiId);bind(enId);
  }

  function bindFeatureEditors(){
    document.addEventListener('input',e=>{
      const input=e.target.closest('.ve-feature-input');if(!input)return;
      const editor=input.closest('.ve-feature-editor');if(!editor)return;
      const sourceId=editor.id.replace(/Editor$/,'');
      const targetId=sourceId==='featuresHi'?'featuresEn':'featuresHi';
      delete state[pairKey(sourceId,targetId)];
      schedule(sourceId,targetId);
    });
  }

  function init(){pairs.forEach(([hi,en])=>addControls(hi,en));bindFeatureEditors()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
