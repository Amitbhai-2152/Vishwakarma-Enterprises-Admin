(()=>{
  const pairs=[
    {id:'featuresHi',title:'मुख्य विशेषताएँ — Hindi',hint:'एक feature के लिए एक bullet रखें',placeholder:'मुख्य विशेषता लिखें...'},
    {id:'featuresEn',title:'Key Features — English',hint:'Add one feature per bullet',placeholder:'Enter a key feature...'}
  ];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const strip=v=>String(v||'').replace(/^\s*[-•▪◦‣]\s*/,'');
  const read=id=>String(document.getElementById(id)?.value||'').split(/\r?\n/).map(strip).map(x=>x.trim()).filter(Boolean);
  const state={};
  function writeHidden(id){const ta=document.getElementById(id);if(ta)ta.value=(state[id]||[]).filter(Boolean).join('\n')}
  function render(id,focusIndex=-1){
    const box=document.getElementById(id+'Editor');if(!box)return;
    const items=state[id]||[];
    box.querySelector('.ve-feature-list').innerHTML=items.map((item,i)=>`<div class="ve-feature-row"><span class="ve-feature-bullet" aria-hidden="true">•</span><input class="ve-feature-input" data-index="${i}" type="text" value="${esc(item)}" placeholder="${esc(pairs.find(p=>p.id===id)?.placeholder||'')}"><button type="button" class="ve-feature-remove" data-index="${i}" aria-label="Remove feature">×</button></div>`).join('')||`<div class="ve-feature-empty">No bullet points yet. Click <strong>＋ Add feature</strong> to start.</div>`;
    if(focusIndex>=0)requestAnimationFrame(()=>{const el=box.querySelector(`.ve-feature-input[data-index="${focusIndex}"]`);if(el){el.focus({preventScroll:true});el.setSelectionRange(el.value.length,el.value.length)}})
  }
  function setFromTextarea(id,focus=false){state[id]=read(id);if(!state[id].length)state[id]=[''];render(id,focus?state[id].length-1:-1)}
  function setText(id,text,focusIndex=-1){state[id]=String(text||'').split(/\r?\n/).map(strip).map(x=>x.trim()).filter(Boolean);if(!state[id].length)state[id]=[''];writeHidden(id);render(id,focusIndex)}
  function build(pair){
    const ta=document.getElementById(pair.id);if(!ta||document.getElementById(pair.id+'Editor'))return;
    state[pair.id]=read(pair.id);if(!state[pair.id].length)state[pair.id]=[''];
    ta.hidden=true;
    const box=document.createElement('div');box.id=pair.id+'Editor';box.className='ve-feature-editor';
    box.innerHTML=`<div class="ve-feature-head"><div class="ve-feature-heading"><span class="ve-feature-icon" aria-hidden="true">☷</span><div><strong>${pair.title}</strong><small>${pair.hint}</small></div></div><button type="button" class="mini-btn ve-feature-add">＋ Add feature</button></div><div class="ve-feature-list"></div>`;
    ta.insertAdjacentElement('afterend',box);
    box.querySelector('.ve-feature-add').addEventListener('click',e=>{e.preventDefault();state[pair.id].push('');writeHidden(pair.id);render(pair.id,state[pair.id].length-1)});
    box.querySelector('.ve-feature-list').addEventListener('click',e=>{const b=e.target.closest('.ve-feature-remove');if(!b)return;e.preventDefault();const i=Number(b.dataset.index);if(!Number.isInteger(i))return;state[pair.id].splice(i,1);if(!state[pair.id].length)state[pair.id]=[''];writeHidden(pair.id);render(pair.id,Math.min(i,state[pair.id].length-1))});
    box.querySelector('.ve-feature-list').addEventListener('input',e=>{const input=e.target.closest('.ve-feature-input');if(!input)return;const i=Number(input.dataset.index);if(!Number.isInteger(i))return;state[pair.id][i]=input.value;writeHidden(pair.id)});
    box.querySelector('.ve-feature-list').addEventListener('keydown',e=>{const input=e.target.closest('.ve-feature-input');if(!input||e.key!=='Enter')return;e.preventDefault();const i=Number(input.dataset.index);if(!Number.isInteger(i))return;state[pair.id][i]=input.value;state[pair.id].splice(i+1,0,'');writeHidden(pair.id);render(pair.id,i+1)});
    box.querySelector('.ve-feature-list').addEventListener('paste',e=>{const input=e.target.closest('.ve-feature-input');if(!input)return;const text=e.clipboardData?.getData('text')||'';if(!text.includes('\n'))return;e.preventDefault();const i=Number(input.dataset.index);const parts=text.split(/\r?\n/).map(strip).map(x=>x.trim()).filter(Boolean);state[pair.id].splice(i,1,...(parts.length?parts:['']));writeHidden(pair.id);render(pair.id,i)});
    writeHidden(pair.id);render(pair.id,-1)
  }
  function hookEditor(){
    if(typeof window.openEditor!=='function'||window.__veFeatureHooked)return;
    const original=window.openEditor;
    window.openEditor=function(p=null){
      original(p);
      pairs.forEach(x=>setFromTextarea(x.id,false));
      requestAnimationFrame(()=>{
        const d=document.getElementById('productDialog');if(d)d.scrollTop=0;
        const f=document.getElementById('productForm');if(f)f.scrollTop=0;
        window.scrollTo({top:0,left:0,behavior:'auto'});
      });
    };
    window.__veFeatureHooked=true
  }
  window.veFeatureSet=function(id,text,focusIndex=-1){setText(id,text,focusIndex)};
  function init(){pairs.forEach(build);hookEditor()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()
})();