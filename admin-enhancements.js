(()=>{
  const byId=id=>document.getElementById(id);
  const parseLines=id=>(byId(id)?.value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const parseSpecs=id=>parseLines(id).map(line=>{const i=line.indexOf(':');return i>0?{key:line.slice(0,i).trim(),value:line.slice(i+1).trim()}:{key:line,value:''}});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function rowEditor({id,title,placeholder,rows,mode='feature'}){
    const wrap=document.createElement('div');wrap.className='enhanced-editor';wrap.dataset.target=id;
    const head=document.createElement('div');head.className='enhanced-editor-head';
    head.innerHTML=`<strong>${title}</strong><button type="button" class="ghost-btn enhanced-add">＋ Add</button>`;wrap.appendChild(head);
    const list=document.createElement('div');list.className='enhanced-list';wrap.appendChild(list);
    const add=(item={key:'',value:''})=>{
      const row=document.createElement('div');row.className='enhanced-row';
      row.innerHTML=mode==='spec'
        ? `<input class="enh-key" maxlength="100" placeholder="Key" value="${esc(item.key)}"><input class="enh-value" maxlength="180" placeholder="Value" value="${esc(item.value)}"><button type="button" class="icon-btn enhanced-remove" aria-label="Remove">×</button>`
        : `<input class="enh-feature" maxlength="180" placeholder="${esc(placeholder)}" value="${esc(item.key||item.value)}"><button type="button" class="icon-btn enhanced-remove" aria-label="Remove">×</button>`;
      list.appendChild(row);
    };
    (rows.length?rows:[{}]).forEach(add);
    head.querySelector('.enhanced-add').onclick=()=>add({});
    list.addEventListener('click',e=>{const b=e.target.closest('.enhanced-remove');if(!b)return;const rowsNow=list.querySelectorAll('.enhanced-row');if(rowsNow.length>1)b.parentElement.remove();else if(mode==='spec'){b.parentElement.querySelectorAll('input').forEach(x=>x.value='')}else b.parentElement.querySelector('input').value=''});
    wrap._sync=()=>{
      const target=byId(id);if(!target)return;
      if(mode==='spec')target.value=[...list.querySelectorAll('.enhanced-row')].map(r=>{const k=r.querySelector('.enh-key')?.value.trim(),v=r.querySelector('.enh-value')?.value.trim();return k?(v?`${k}: ${v}`:k):''}).filter(Boolean).join('\n');
      else target.value=[...list.querySelectorAll('.enh-feature')].map(i=>i.value.trim()).filter(Boolean).join('\n');
    };
    return wrap;
  }
  function enhance(){
    const dialog=byId('productDialog'),form=byId('productForm');if(!dialog||!form)return;
    const fields=[
      {id:'featuresHi',title:'मुख्य विशेषताएँ — Hindi',placeholder:'Feature लिखें',mode:'feature'},
      {id:'featuresEn',title:'Key Features — English',placeholder:'Enter a feature',mode:'feature'},
      {id:'specificationsHi',title:'विशेष विवरण — Hindi',placeholder:'Key',mode:'spec'},
      {id:'specificationsEn',title:'Specifications — English',placeholder:'Key',mode:'spec'}
    ];
    fields.forEach(f=>{
      const target=byId(f.id);if(!target||target.dataset.enhanced)return;
      const label=target.closest('label');if(!label)return;
      const wrap=rowEditor({id:f.id,title:f.title,placeholder:f.placeholder,rows:f.mode==='spec'?parseSpecs(f.id).map(x=>x):parseLines(f.id).map(x=>({key:x})),mode:f.mode});
      label.insertBefore(wrap,target);target.style.display='none';target.dataset.enhanced='1';
    });
    form.addEventListener('submit',()=>document.querySelectorAll('.enhanced-editor').forEach(e=>e._sync?.()),true);
    const refresh=()=>setTimeout(()=>{
      document.querySelectorAll('.enhanced-editor').forEach(e=>{
        const id=e.dataset.target,target=byId(id);if(!target)return;
        const list=e.querySelector('.enhanced-list');
        const values=id.startsWith('specifications')?parseSpecs(id).map(x=>x):parseLines(id).map(x=>({key:x}));
        list.innerHTML='';
        const add=e.querySelector('.enhanced-add');
        const mode=id.startsWith('specifications')?'spec':'feature';
        const placeholder=mode==='spec'?'Key':'Enter a feature';
        const make=item=>{
          const row=document.createElement('div');row.className='enhanced-row';
          row.innerHTML=mode==='spec'?`<input class="enh-key" maxlength="100" placeholder="Key" value="${esc(item.key)}"><input class="enh-value" maxlength="180" placeholder="Value" value="${esc(item.value)}"><button type="button" class="icon-btn enhanced-remove" aria-label="Remove">×</button>`:`<input class="enh-feature" maxlength="180" placeholder="${esc(placeholder)}" value="${esc(item.key||'')}"><button type="button" class="icon-btn enhanced-remove" aria-label="Remove">×</button>`;
          list.appendChild(row);
        };
        (values.length?values:[{}]).forEach(make);
        list.querySelectorAll('.enhanced-remove').forEach(b=>b.onclick=()=>{const rows=list.querySelectorAll('.enhanced-row');if(rows.length>1)b.parentElement.remove();else b.parentElement.querySelectorAll('input').forEach(x=>x.value='')});
      });
    },30);
    document.addEventListener('click',e=>{if(e.target.closest('#newProductBtn,[data-edit]'))refresh()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
