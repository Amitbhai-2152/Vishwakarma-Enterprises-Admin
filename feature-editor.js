(()=>{
  const pairs=[
    {id:'featuresHi',title:'Key Features — Hindi',hint:'एक feature के लिए एक bullet रखें'},
    {id:'featuresEn',title:'Key Features — English',hint:'Add one feature per bullet'}
  ];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parse=value=>String(value||'').split(/\r?\n/).map(x=>x.trim().replace(/^[-•▪◦‣]\s*/,'' )).filter(Boolean);
  const syncTextarea=(id,items)=>{
    const ta=document.getElementById(id);if(!ta)return;
    ta.value=items.map(x=>x.trim()).filter(Boolean).join('\n');
    ta.dispatchEvent(new Event('input',{bubbles:true}));
  };
  const readItems=id=>parse(document.getElementById(id)?.value);
  function render(id,focusIndex=-1){
    const ta=document.getElementById(id),box=document.getElementById(id+'Editor');
    if(!ta||!box)return;
    const items=readItems(id);
    const rows=items.length?items.map((item,i)=>`<div class="ve-feature-row" data-index="${i}"><span class="ve-feature-bullet" aria-hidden="true">•</span><input class="ve-feature-input" type="text" value="${esc(item)}" placeholder="${id==='featuresHi'?'मुख्य विशेषता लिखें...':'Enter a key feature...'}"><button type="button" class="ve-feature-remove" aria-label="Remove feature">×</button></div>`).join(''):'<div class="ve-feature-empty">No bullet points yet. Click <strong>＋ Add feature</strong> to start.</div>';
    box.querySelector('.ve-feature-list').innerHTML=rows;
    const add=box.querySelector('.ve-feature-add');
    add.onclick=()=>{
      const next=readItems(id);next.push('');syncTextarea(id,next);render(id,next.length-1);
    };
    box.querySelectorAll('.ve-feature-input').forEach((input,i)=>{
      input.addEventListener('input',()=>{const next=readItems(id);next[i]=input.value;syncTextarea(id,next);});
      input.addEventListener('keydown',e=>{
        if(e.key==='Enter'){
          e.preventDefault();
          const next=readItems(id);next[i]=input.value;next.splice(i+1,0,'');syncTextarea(id,next);render(id,i+1);
        }
      });
      input.addEventListener('paste',e=>{
        const text=e.clipboardData?.getData('text')||'';
        if(text.includes('\n')){
          e.preventDefault();
          const pasted=parse(text);const next=readItems(id);next.splice(i,1,...(pasted.length?pasted:['']));syncTextarea(id,next);render(id,i);
        }
      });
    });
    box.querySelectorAll('.ve-feature-remove').forEach((button,i)=>button.onclick=()=>{
      const next=readItems(id);next.splice(i,1);syncTextarea(id,next);render(id);
    });
    if(focusIndex>=0){
      const input=box.querySelectorAll('.ve-feature-input')[focusIndex];if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length)}
    }
  }
  function build(pair){
    const ta=document.getElementById(pair.id);if(!ta||document.getElementById(pair.id+'Editor'))return;
    const label=ta.closest('label');
    if(!label)return;
    ta.style.display='none';
    const box=document.createElement('div');box.id=pair.id+'Editor';box.className='ve-feature-editor';
    box.innerHTML=`<div class="ve-feature-head"><div><span class="ve-feature-icon" aria-hidden="true">☷</span><div><strong>${pair.title}</strong><small>${pair.hint}</small></div></div><button type="button" class="mini-btn ve-feature-add">＋ Add feature</button></div><div class="ve-feature-list"></div>`;
    ta.insertAdjacentElement('afterend',box);
    ta.addEventListener('change',()=>render(pair.id));
    render(pair.id);
  }
  function refreshAll(){pairs.forEach(p=>{if(document.getElementById(p.id+'Editor'))render(p.id);});}
  function patchOpenEditor(){
    if(typeof window.__veFeatureOriginalOpenEditor==='undefined'&&typeof window.openEditor==='function'){
      window.__veFeatureOriginalOpenEditor=window.openEditor;
      window.openEditor=function(p=null){window.__veFeatureOriginalOpenEditor(p);refreshAll()};
    }
  }
  const style=document.createElement('style');style.textContent=`
    .ve-feature-editor{border:1px solid #dfe5ec;background:#fbfcfe;border-radius:14px;padding:12px;display:grid;gap:10px}
    .ve-feature-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .ve-feature-head>div{display:flex;align-items:center;gap:9px;min-width:0}
    .ve-feature-head strong{display:block;color:#263142;font-size:13px;line-height:1.35}
    .ve-feature-head small{display:block;color:#7b8492;font-size:11px;font-weight:500;margin-top:3px;line-height:1.4}
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
  function init(){pairs.forEach(build);patchOpenEditor();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.refreshFeatureEditors=refreshAll;
})();
