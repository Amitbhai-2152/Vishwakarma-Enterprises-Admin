(()=>{
  const pairs=[
    {id:'featuresHi',title:'Key Features — Hindi',hint:'एक feature के लिए एक bullet रखें'},
    {id:'featuresEn',title:'Key Features — English',hint:'Add one feature per bullet'}
  ];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parse=value=>String(value||'').split(/\r?\n/).map(x=>x.trim().replace(/^[-•▪◦‣]\s*/,'' )).filter(Boolean);
  const taFor=id=>document.getElementById(id);
  const readItems=id=>parse(taFor(id)?.value);
  const writeItems=(id,items)=>{const ta=taFor(id);if(!ta)return;ta.value=items.map(x=>String(x||'').trim()).filter(Boolean).join('\n');ta.dispatchEvent(new Event('input',{bubbles:true}));ta.dispatchEvent(new Event('change',{bubbles:true}));};
  function render(id,focusIndex=-1){
    const ta=taFor(id),box=document.getElementById(id+'Editor');
    if(!ta||!box)return;
    const items=readItems(id);
    const list=box.querySelector('.ve-feature-list');
    list.innerHTML=items.length?items.map((item,i)=>`<div class="ve-feature-row"><span class="ve-feature-bullet" aria-hidden="true">•</span><input class="ve-feature-input" data-index="${i}" type="text" value="${esc(item)}" placeholder="${id==='featuresHi'?'मुख्य विशेषता लिखें...':'Enter a key feature...'}"><button type="button" class="ve-feature-remove" data-index="${i}" aria-label="Remove feature">×</button></div>`).join(''):'<div class="ve-feature-empty">No bullet points yet. Click <strong>＋ Add feature</strong> to start.</div>';
    if(focusIndex>=0){const input=list.querySelector(`.ve-feature-input[data-index="${focusIndex}"]`);if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length)}}
  }
  function build(pair){
    const ta=taFor(pair.id);if(!ta||document.getElementById(pair.id+'Editor'))return;
    const label=ta.closest('label');if(!label)return;
    ta.style.display='none';
    const box=document.createElement('div');box.id=pair.id+'Editor';box.className='ve-feature-editor';
    box.innerHTML=`<div class="ve-feature-head"><div class="ve-feature-heading"><span class="ve-feature-icon" aria-hidden="true">☷</span><div><strong>${pair.title}</strong><small>${pair.hint}</small></div></div><button type="button" class="mini-btn ve-feature-add">＋ Add feature</button></div><div class="ve-feature-list"></div>`;
    ta.insertAdjacentElement('afterend',box);
    box.addEventListener('click',e=>{
      const add=e.target.closest('.ve-feature-add');
      if(add){
        e.preventDefault();
        const next=readItems(pair.id);next.push('');
        writeItems(pair.id,next);
        render(pair.id,next.length-1);
        return;
      }
      const remove=e.target.closest('.ve-feature-remove');
      if(remove){
        e.preventDefault();
        const i=Number(remove.dataset.index);const next=readItems(pair.id);if(Number.isInteger(i))next.splice(i,1);
        writeItems(pair.id,next);render(pair.id);return;
      }
    });
    box.addEventListener('input',e=>{
      const input=e.target.closest('.ve-feature-input');if(!input)return;
      const i=Number(input.dataset.index);const next=readItems(pair.id);if(Number.isInteger(i)){next[i]=input.value;writeItems(pair.id,next)}
    });
    box.addEventListener('keydown',e=>{
      const input=e.target.closest('.ve-feature-input');if(!input||e.key!=='Enter')return;
      e.preventDefault();
      const i=Number(input.dataset.index);const next=readItems(pair.id);if(!Number.isInteger(i))return;
      next[i]=input.value;next.splice(i+1,0,'');writeItems(pair.id,next);render(pair.id,i+1);
    });
    box.addEventListener('paste',e=>{
      const input=e.target.closest('.ve-feature-input');if(!input)return;
      const text=e.clipboardData?.getData('text')||'';if(!text.includes('\n'))return;
      e.preventDefault();
      const i=Number(input.dataset.index),pasted=parse(text),next=readItems(pair.id);next.splice(i,1,...(pasted.length?pasted:['']));
      writeItems(pair.id,next);render(pair.id,i);
    });
    ta.addEventListener('change',()=>render(pair.id));
    render(pair.id);
  }
  function init(){pairs.forEach(build);}
  const style=document.createElement('style');style.textContent=`
    .ve-feature-editor{border:1px solid #dfe5ec;background:#fbfcfe;border-radius:14px;padding:12px;display:grid;gap:10px}
    .ve-feature-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .ve-feature-heading{display:flex;align-items:center;gap:9px;min-width:0}
    .ve-feature-heading strong{display:block;color:#263142;font-size:13px;line-height:1.35}
    .ve-feature-heading small{display:block;color:#7b8492;font-size:11px;font-weight:500;margin-top:3px;line-height:1.4}
    .ve-feature-icon{width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border:1px solid #d7dee7;border-radius:8px;background:#f8fafc;color:#344054;font-size:17px;font-weight:800;box-shadow:0 2px 5px rgba(20,30,45,.05);flex:none}
    .ve-feature-list{display:grid;gap:8px}
    .ve-feature-row{display:grid;grid-template-columns:28px minmax(0,1fr) 38px;gap:8px;align-items:center}
    .ve-feature-bullet{width:28px;height:42px;display:inline-flex;align-items:center;justify-content:center;border:1px solid #d7dee7;border-radius:10px;background:#fff;color:#263142;font-size:22px;line-height:1;font-weight:800}
    .ve-feature-input{width:100%;box-sizing:border-box;border:1px solid #dce3eb;background:#fff;border-radius:11px;padding:11px 12px;font:14px Poppins,'Noto Sans Devanagari',sans-serif;outline:0;min-width:0}
    .ve-feature-input:focus{border-color:#c62828;box-shadow:0 0 0 3px rgba(198,40,40,.08)}
    .ve-feature-remove{width:38px;height:42px;border:1px solid #dce3eb;background:#fff;color:#667085;border-radius:10px;font-size:20px;cursor:pointer}
    .ve-feature-remove:hover{background:#fff3f3;color:#b42318}
    .ve-feature-add{padding:9px 12px;font-size:12px}
    .ve-feature-empty{padding:12px;border:1px dashed #cfd7e1;border-radius:10px;background:#fff;color:#7b8492;font-size:12px;line-height:1.5}
    @media(max-width:700px){.ve-feature-head{align-items:flex-start;flex-direction:column}.ve-feature-add{width:100%}.ve-feature-row{grid-template-columns:26px minmax(0,1fr) 36px}.ve-feature-bullet{width:26px}}
  `;document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
