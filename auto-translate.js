(function(){
  const $=id=>document.getElementById(id);
  const pairs=[
    ['featuresHi','featuresEn','features'],
    ['specificationsHi','specificationsEn','specifications']
  ];
  const timers={};
  const autoState={};
  async function translateText(text,source,target){
    const clean=String(text||'').trim();if(!clean)return '';
    try{
      const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl='+encodeURIComponent(source)+'&tl='+encodeURIComponent(target)+'&dt=t&q='+encodeURIComponent(clean);
      const r=await fetch(url,{cache:'no-store'});if(!r.ok)return '';
      const data=await r.json();return Array.isArray(data?.[0])?data[0].map(x=>x?.[0]||'').join('').trim():'';
    }catch{return ''}
  }
  async function translateLines(value,source,target,mode){
    const lines=String(value||'').split(/\r?\n/);
    const out=[];
    for(const line of lines){
      const clean=line.trim();
      if(!clean){out.push('');continue}
      if(mode==='spec'){
        const i=clean.indexOf(':');
        if(i>0){const k=await translateText(clean.slice(0,i).trim(),source,target);const v=await translateText(clean.slice(i+1).trim(),source,target);out.push(`${k||clean.slice(0,i).trim()}: ${v||clean.slice(i+1).trim()}`)}
        else out.push(await translateText(clean,source,target)||clean);
      }else out.push(await translateText(clean,source,target)||clean);
    }
    return out.join('\n');
  }
  function pairKey(a,b){return a+'>'+b}
  async function sync(sourceId,targetId,mode,force=false){
    const source=$(sourceId),target=$(targetId);if(!source||!target)return;
    const text=source.value.trim();if(!text)return;
    const key=pairKey(sourceId,targetId),state=autoState[key]||{};
    if(!force&&target.value.trim()&&target.value.trim()!==state.lastTarget)return;
    const translated=await translateLines(text,sourceId.endsWith('Hi')?'hi':'en',targetId.endsWith('Hi')?'hi':'en',mode);
    if(translated&&source.value.trim()===text&&(force||!target.value.trim()||target.value.trim()===state.lastTarget)){
      target.value=translated;autoState[key]={lastSource:text,lastTarget:translated};target.dispatchEvent(new Event('input',{bubbles:true,detail:{auto:true}}));
    }
  }
  function schedule(sourceId,targetId,mode){clearTimeout(timers[sourceId]);timers[sourceId]=setTimeout(()=>sync(sourceId,targetId,mode,false),900)}
  function addControls(hiId,enId,mode){
    const hi=$(hiId),en=$(enId);if(!hi||!en)return;
    const key=mode+'-translator-controls';
    const labels=[hi.closest('label'),en.closest('label')].filter(Boolean);
    if(labels.some(x=>x.dataset[key]))return;
    labels.forEach(x=>x.dataset[key]='1');
    const make=(text,handler)=>{const b=document.createElement('button');b.type='button';b.className='mini-btn auto-translate-btn';b.textContent=text;b.addEventListener('click',handler);return b};
    const hiHeader=hi.closest('label')?.querySelector('.enhanced-editor-head');
    const enHeader=en.closest('label')?.querySelector('.enhanced-editor-head');
    if(hiHeader)hiHeader.appendChild(make('↔ Auto English',()=>sync(hiId,enId,mode,true)));
    else hi.closest('label')?.insertBefore(make('↔ Auto English',()=>sync(hiId,enId,mode,true)),hi);
    if(enHeader)enHeader.appendChild(make('↔ Auto Hindi',()=>sync(enId,hiId,mode,true)));
    else en.closest('label')?.insertBefore(make('↔ Auto Hindi',()=>sync(enId,hiId,mode,true)),en);
    hi.addEventListener('input',e=>{if(e.detail?.auto)return;autoState[pairKey(hiId,enId)]={lastSource:'',lastTarget:''};schedule(hiId,enId,mode)});
    en.addEventListener('input',e=>{if(e.detail?.auto)return;autoState[pairKey(enId,hiId)]={lastSource:'',lastTarget:''};schedule(enId,hiId,mode)});
  }
  function init(){pairs.forEach(([hi,en,mode])=>addControls(hi,en,mode));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  document.addEventListener('click',e=>{if(e.target.closest('#newProductBtn,[data-edit]'))setTimeout(init,150)});
})();
