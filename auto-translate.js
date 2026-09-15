(function(){
  const $=id=>document.getElementById(id);
  const timers={};
  const state={};
  const pairs=[
    ['featuresHi','featuresEn','features'],
    ['specificationsHi','specificationsEn','specifications'],
    ['descriptionHi','descriptionEn','description']
  ];

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

  async function translateText(text,source,target){
    const clean=String(text||'').trim();
    if(!clean)return '';

    const google='https://translate.googleapis.com/translate_a/single?client=gtx&sl='+encodeURIComponent(source)+'&tl='+encodeURIComponent(target)+'&dt=t&q='+encodeURIComponent(clean);
    const g=await request(google,data=>Array.isArray(data?.[0])?data[0].map(x=>x?.[0]||'').join('').trim():'');
    if(g)return g;

    const mm='https://api.mymemory.translated.net/get?q='+encodeURIComponent(clean)+'&langpair='+encodeURIComponent(source+'|'+target);
    return request(mm,data=>String(data?.responseData?.translatedText||'').trim());
  }

  async function translateLines(text,source,target,mode){
    const lines=String(text||'').split(/\r?\n/);
    const out=[];
    for(const line of lines){
      const clean=line.trim();
      if(!clean){out.push('');continue;}
      if(mode==='spec'){
        const i=clean.indexOf(':');
        if(i>0){
          const k=await translateText(clean.slice(0,i).trim(),source,target);
          const v=await translateText(clean.slice(i+1).trim(),source,target);
          out.push(`${k||clean.slice(0,i).trim()}: ${v||clean.slice(i+1).trim()}`);
        }else out.push(await translateText(clean,source,target)||clean);
      }else{
        out.push(await translateText(clean,source,target)||clean);
      }
    }
    return out.join('\n');
  }

  function pairKey(sourceId,targetId){return sourceId+'>'+targetId}

  async function sync(sourceId,targetId,mode,force=false){
    const source=$(sourceId),target=$(targetId);
    if(!source||!target)return;
    const text=source.value.trim();
    if(!text)return;

    const key=pairKey(sourceId,targetId),s=state[key]||{};
    const currentTarget=target.value.trim();
    if(!force&&currentTarget&&currentTarget!==s.lastTarget)return;

    const translated=await translateLines(
      text,
      sourceId.endsWith('Hi')?'hi':'en',
      targetId.endsWith('Hi')?'hi':'en',
      mode
    );
    if(!translated)return;
    if(source.value.trim()!==text)return;

    const latestTarget=target.value.trim();
    if(!force&&latestTarget&&latestTarget!==s.lastTarget)return;

    target.value=translated;
    state[key]={lastSource:text,lastTarget:translated};
    target.dataset.autoTranslated='true';
    target.dispatchEvent(new Event('input',{bubbles:true}));
    target.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function schedule(sourceId,targetId,mode){
    clearTimeout(timers[pairKey(sourceId,targetId)]);
    timers[pairKey(sourceId,targetId)]=setTimeout(()=>sync(sourceId,targetId,mode,false),900);
  }

  function makeButton(text,handler){
    const b=document.createElement('button');
    b.type='button';
    b.className='mini-btn auto-translate-btn';
    b.textContent=text;
    b.addEventListener('click',e=>{e.preventDefault();handler()});
    return b;
  }

  function addControls(hiId,enId,mode){
    const hi=$(hiId),en=$(enId);
    if(!hi||!en)return;
    const marker='translatorReady4';
    if(hi.dataset[marker]||en.dataset[marker])return;
    hi.dataset[marker]=en.dataset[marker]='1';

    const hiLabel=hi.closest('label'),enLabel=en.closest('label');
    if(hiLabel){
      const b=makeButton('↔ Auto English',()=>sync(hiId,enId,mode,true));
      hiLabel.insertBefore(b,hi);
    }
    if(enLabel){
      const b=makeButton('↔ Auto Hindi',()=>sync(enId,hiId,mode,true));
      enLabel.insertBefore(b,en);
    }

    hi.addEventListener('input',()=>{delete state[pairKey(hiId,enId)];schedule(hiId,enId,mode)});
    en.addEventListener('input',()=>{delete state[pairKey(enId,hiId)];schedule(enId,hiId,mode)});
  }

  function init(){pairs.forEach(([hi,en,mode])=>addControls(hi,en,mode));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
