(function(){
  const $=id=>document.getElementById(id);
  const timers={};
  const state={};
  const pairs=[['featuresHi','featuresEn'],['descriptionHi','descriptionEn']];
  async function translateText(text,source,target){
    const clean=String(text||'').trim();if(!clean)return '';
    try{
      const r=await fetch('/.netlify/functions/translate?source='+encodeURIComponent(source)+'&target='+encodeURIComponent(target)+'&text='+encodeURIComponent(clean),{cache:'no-store'});
      if(!r.ok)return '';
      const data=await r.json();
      return data?.success?String(data.translated||'').trim():'';
    }catch{return ''}
  }
  async function translateLines(text,source,target){
    const lines=String(text||'').split(/\r?\n/),out=[];
    for(const line of lines){const clean=line.trim();if(!clean){out.push('');continue}out.push(await translateText(clean,source,target)||clean)}
    return out.join('\n');
  }
  function pairKey(sourceId,targetId){return sourceId+'>'+targetId}
  function notifyTarget(targetId){
    const target=$(targetId);if(!target)return;
    target.dispatchEvent(new Event('input',{bubbles:true}));
    if(targetId==='featuresHi'||targetId==='featuresEn')target.dispatchEvent(new CustomEvent('ve-feature-change',{bubbles:true,detail:{id:targetId,source:'translator'}}));
    target.dispatchEvent(new Event('change',{bubbles:true}));
  }
  async function sync(sourceId,targetId,force=false){
    const source=$(sourceId),target=$(targetId);if(!source||!target)return;
    const text=source.value.trim();if(!text)return;
    const key=pairKey(sourceId,targetId),s=state[key]||{},currentTarget=target.value.trim();
    if(!force&&currentTarget&&currentTarget!==s.lastTarget)return;
    const translated=await translateLines(text,sourceId.endsWith('Hi')?'hi':'en',targetId.endsWith('Hi')?'hi':'en');
    if(!translated||source.value.trim()!==text)return;
    const latestTarget=target.value.trim();if(!force&&latestTarget&&latestTarget!==s.lastTarget)return;
    target.value=translated;state[key]={lastSource:text,lastTarget:translated};target.dataset.autoTranslated='true';notifyTarget(targetId);
  }
  function schedule(sourceId,targetId){clearTimeout(timers[pairKey(sourceId,targetId)]);timers[pairKey(sourceId,targetId)]=setTimeout(()=>sync(sourceId,targetId,false),900)}
  function makeButton(text,handler){const b=document.createElement('button');b.type='button';b.className='mini-btn auto-translate-btn';b.textContent=text;b.addEventListener('click',e=>{e.preventDefault();handler()});return b}
  function addControls(hiId,enId){
    const hi=$(hiId),en=$(enId);if(!hi||!en)return;
    const marker='translatorReady6';if(hi.dataset[marker]||en.dataset[marker])return;hi.dataset[marker]=en.dataset[marker]='1';
    const hiLabel=hi.closest('label'),enLabel=en.closest('label');
    if(hiLabel)hiLabel.insertBefore(makeButton('↔ Auto English',()=>sync(hiId,enId,true)),hi);
    if(enLabel)enLabel.insertBefore(makeButton('↔ Auto Hindi',()=>sync(enId,hiId,true)),en);
    hi.addEventListener('input',()=>{delete state[pairKey(hiId,enId)];schedule(hiId,enId)});
    en.addEventListener('input',()=>{delete state[pairKey(enId,hiId)];schedule(enId,hiId)});
    hi.addEventListener('ve-feature-change',()=>{delete state[pairKey(hiId,enId)];schedule(hiId,enId)});
    en.addEventListener('ve-feature-change',()=>{delete state[pairKey(enId,hiId)];schedule(enId,hiId)});
  }
  function init(){pairs.forEach(([hi,en])=>addControls(hi,en))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();