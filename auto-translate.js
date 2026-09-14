(function(){
  const $=id=>document.getElementById(id);
  const timers={};
  const state={};
  const pairs=[
    ['featuresHi','featuresEn','features'],
    ['specificationsHi','specificationsEn','specifications'],
    ['descriptionHi','descriptionEn','description']
  ];

  async function translateText(text,source,target){
    const clean=String(text||'').trim();
    if(!clean)return '';
    try{
      const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl='+encodeURIComponent(source)+'&tl='+encodeURIComponent(target)+'&dt=t&q='+encodeURIComponent(clean);
      const r=await fetch(url,{cache:'no-store'});
      if(!r.ok)return '';
      const data=await r.json();
      return Array.isArray(data?.[0])?data[0].map(x=>x?.[0]||'').join('').trim():'';
    }catch{return ''}
  }

  async function translateLines(text,source,target,mode){
    const lines=String(text||'').split(/\r?\n/);
    const out=[];
    for(const line of lines){
      const clean=line.trim();
      if(!clean){out.push('');continue}
      if(mode==='spec'){
        const i=clean.indexOf(':');
        if(i>0){
          const k=await translateText(clean.slice(0,i).trim(),source,target);
          const v=await translateText(clean.slice(i+1).trim(),source,target);
          out.push(`${k||clean.slice(0,i).trim()}: ${v||clean.slice(i+1).trim()}`);
        }else out.push(await translateText(clean,source,target)||clean);
      }else out.push(await translateText(clean,source,target)||clean);
    }
    return out.join('\n');
  }

  function wrapper(id){return document.querySelector(`.enhanced-editor[data-target="${id}"]`)}
  function editorText(id){
    const box=wrapper(id);
    if(!box)return $(id)?.value?.trim()||'';
    if(id.startsWith('specifications')){
      return [...box.querySelectorAll('.enhanced-row')].map(row=>{
        const k=row.querySelector('.enh-key')?.value.trim()||'';
        const v=row.querySelector('.enh-value')?.value.trim()||'';
        return k?(v?`${k}: ${v}`:k):'';
      }).filter(Boolean).join('\n').trim();
    }
    return [...box.querySelectorAll('.enhanced-feature')].map(x=>x.value.trim()).filter(Boolean).join('\n').trim();
  }

  function syncHidden(id){wrapper(id)?._sync?.();}

  function setEditorText(id,text){
    const box=wrapper(id);
    if(!box){const target=$(id);if(target)target.value=text;return}
    const isSpec=id.startsWith('specifications');
    const lines=String(text||'').split(/\r?\n/).filter(x=>x.trim());
    const list=box.querySelector('.enhanced-list');
    const addButton=box.querySelector('.enhanced-add');
    const removeLast=()=>{
      const rows=list?.querySelectorAll('.enhanced-row')||[];
      if(rows.length>1)rows[rows.length-1].remove();
      else rows[0]?.querySelectorAll('input').forEach(x=>x.value='');
    };
    if(!list)return;
    while(list.querySelectorAll('.enhanced-row').length<Math.max(1,lines.length))addButton?.click();
    while(lines.length&&list.querySelectorAll('.enhanced-row').length>lines.length)removeLast();
    if(!lines.length){
      list.querySelectorAll('.enhanced-row').forEach((row,i)=>{if(i>0)row.remove();row.querySelectorAll('input').forEach(x=>x.value='')});
    }else{
      [...list.querySelectorAll('.enhanced-row')].slice(0,lines.length).forEach((row,i)=>{
        const line=lines[i].trim();
        if(isSpec){
          const p=line.indexOf(':');
          row.querySelector('.enh-key').value=p>0?line.slice(0,p).trim():line;
          row.querySelector('.enh-value').value=p>0?line.slice(p+1).trim():'';
        }else row.querySelector('.enh-feature').value=line;
      });
    }
    syncHidden(id);
  }

  function pairKey(sourceId,targetId){return sourceId+'>'+targetId}

  async function sync(sourceId,targetId,mode,force=false){
    const rawSource=$(sourceId),rawTarget=$(targetId);
    if(!rawSource||!rawTarget)return;
    const source=mode==='description'?(rawSource.value||'').trim():editorText(sourceId);
    if(!source)return;
    const key=pairKey(sourceId,targetId),s=state[key]||{};
    const currentTarget=mode==='description'?(rawTarget.value||'').trim():editorText(targetId);
    if(!force&&currentTarget&&currentTarget!==s.lastTarget)return;
    const translated=await translateLines(source,sourceId.endsWith('Hi')?'hi':'en',targetId.endsWith('Hi')?'hi':'en',mode);
    if(!translated)return;
    const latestSource=mode==='description'?(rawSource.value||'').trim():editorText(sourceId);
    if(latestSource!==source)return;
    const latestTarget=mode==='description'?(rawTarget.value||'').trim():editorText(targetId);
    if(!force&&latestTarget&&latestTarget!==s.lastTarget)return;
    if(mode==='description'){
      rawTarget.value=translated;
      rawTarget.dispatchEvent(new Event('input',{bubbles:true}));
    }else setEditorText(targetId,translated);
    state[key]={lastSource:source,lastTarget:translated};
  }

  function schedule(sourceId,targetId,mode){
    clearTimeout(timers[pairKey(sourceId,targetId)]);
    timers[pairKey(sourceId,targetId)]=setTimeout(()=>sync(sourceId,targetId,mode,false),1000);
  }

  function button(text,handler){
    const b=document.createElement('button');
    b.type='button';b.className='mini-btn auto-translate-btn';b.textContent=text;b.addEventListener('click',handler);return b;
  }

  function addControls(hiId,enId,mode){
    const hi=$(hiId),en=$(enId);if(!hi||!en)return;
    const marker='translatorReady2';
    if(hi.dataset[marker]||en.dataset[marker])return;
    hi.dataset[marker]=en.dataset[marker]='1';
    const hiLabel=hi.closest('label'),enLabel=en.closest('label');
    const hiHeader=hiLabel?.querySelector('.enhanced-editor-head');
    const enHeader=enLabel?.querySelector('.enhanced-editor-head');
    const controls=[
      [hiHeader||hiLabel,'↔ Auto English',()=>sync(hiId,enId,mode,true)],
      [enHeader||enLabel,'↔ Auto Hindi',()=>sync(enId,hiId,mode,true)]
    ];
    controls.forEach(([host,text,handler])=>host?.appendChild(button(text,handler)));

    const bind=(source,target)=>{
      const sourceTarget=source===hi?hiId:enId;
      const targetId=source===hi?enId:hiId;
      source.addEventListener('input',e=>{
        if(e.isTrusted===false)return;
        state[pairKey(sourceTarget,targetId)]={};
        schedule(sourceTarget,targetId,mode);
      });
    };
    bind(hi,en);bind(en,hi);

    if(mode!=='description'){
      document.addEventListener('input',e=>{
        const box=wrapper(hiId),boxEn=wrapper(enId);
        if(!e.target.closest('.enhanced-editor'))return;
        if(e.target.closest(`[data-target="${hiId}"]`)){state[pairKey(hiId,enId)]={};schedule(hiId,enId,mode)}
        else if(e.target.closest(`[data-target="${enId}"]`)){state[pairKey(enId,hiId)]={};schedule(enId,hiId,mode)}
      });
    }
  }

  function init(){pairs.forEach(([hi,en,mode])=>addControls(hi,en,mode));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  document.addEventListener('click',e=>{if(e.target.closest('#newProductBtn,[data-edit]'))setTimeout(init,250)});
})();
