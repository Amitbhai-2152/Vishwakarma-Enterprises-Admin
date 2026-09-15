(()=>{
  const $=id=>document.getElementById(id);
  const selected=new Set();
  let renderOriginal=null;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const visibleProductIds=()=>Array.from(document.querySelectorAll('[data-edit]')).map(b=>b.dataset.edit).filter(Boolean);
  const currentProducts=()=>typeof products!=='undefined'&&Array.isArray(products)?products:[];

  function cleanSelection(){
    const ids=new Set(currentProducts().map(p=>String(p.id)));
    [...selected].forEach(id=>{if(!ids.has(id))selected.delete(id)});
  }

  function csvCell(value){
    const s=String(value??'');
    return /[\",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
  }

  function csvExport(){
    cleanSelection();
    const list=selected.size?currentProducts().filter(p=>selected.has(String(p.id))):currentProducts();
    if(!list.length){toast?.('No products available to export.');return}
    const headers=['id','brand','category','name_en','name_hi','description_en','description_hi','featured','status','variants'];
    const rows=[headers,...list.map(p=>[p.id,p.brand,p.category,p.name?.en||'',p.name?.hi||'',p.description?.en||'',p.description?.hi||'',p.featured?'yes':'no',p.status==='hidden'?'hidden':'active',Array.isArray(p.sizes)?p.sizes.map(v=>typeof v==='object'?`${v.name||''}=${v.mrp??''}`:String(v)).join(' | '):''])];
    const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`vishwakarma-products-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast?.(`Exported ${list.length} product${list.length===1?'':'s'}.`);
  }

  function saveBulk(){
    if(typeof saveDraft==='function')saveDraft();
    if(typeof render==='function')render();
  }

  function bulkUpdate(mutator,message){
    cleanSelection();
    if(!selected.size){toast?.('Select at least one product first.');return}
    const ids=new Set(selected);
    currentProducts().forEach(p=>{if(ids.has(String(p.id)))mutator(p)});
    saveBulk();
    toast?.(message||'Bulk update saved to the draft.');
  }

  function bulkDelete(){
    cleanSelection();
    if(!selected.size){toast?.('Select at least one product first.');return}
    const list=currentProducts().filter(p=>selected.has(String(p.id)));
    const label=list.length===1?list[0].id:`${list.length} products`;
    if(!confirm(`Delete ${label} from the current catalogue draft?`))return;
    products=currentProducts().filter(p=>!selected.has(String(p.id)));
    selected.clear();
    saveBulk();
    toast?.(`Deleted ${list.length} product${list.length===1?'':'s'} from the draft. Publish to make it live.`);
  }

  function decorateCards(){
    cleanSelection();
    document.querySelectorAll('[data-edit]').forEach(btn=>{
      const card=btn.closest('.product-item');
      if(!card)return;
      const id=String(btn.dataset.edit||'');
      if(!id)return;
      let selector=card.querySelector('.phase-c-card-select');
      if(!selector){
        selector=document.createElement('label');
        selector.className='phase-c-card-select';
        selector.innerHTML=`<input type="checkbox" data-select-product="${esc(id)}" aria-label="Select ${esc(id)}"><span>Select</span>`;
        const actions=card.querySelector('.item-actions');
        if(actions)actions.insertBefore(selector,actions.firstChild);else card.appendChild(selector);
        const cb=selector.querySelector('input');
        cb.addEventListener('change',()=>{cb.checked?selected.add(id):selected.delete(id);updateBulkUi()});
      }
      const cb=selector.querySelector('input');
      if(cb)cb.checked=selected.has(id);
    });
    updateBulkUi();
  }

  function updateBulkUi(){
    const count=selected.size;
    const countEl=$('phaseCBulkCount');
    if(countEl)countEl.textContent=`${count} selected`;
    const summary=$('phaseCBulkSummary');
    if(summary)summary.textContent=count?`Bulk actions · ${count} selected`:'Bulk actions';
    const all=$('phaseCSelectVisible');
    const visible=visibleProductIds();
    if(all){
      all.checked=visible.length>0&&visible.every(id=>selected.has(id));
      all.indeterminate=count>0&&!all.checked;
    }
    document.querySelectorAll('[data-bulk-action]').forEach(el=>el.disabled=count===0);
    document.querySelectorAll('[data-select-product]').forEach(cb=>{cb.checked=selected.has(String(cb.dataset.selectProduct||''))});
  }

  function addToolbar(){
    if($('phaseCBulkBar'))return;
    const toolbar=document.querySelector('.toolbar');
    if(!toolbar)return;
    const details=document.createElement('details');
    details.id='phaseCBulkBar';
    details.className='phase-c-bulkbar panel';
    details.innerHTML='<summary id="phaseCBulkSummary">Bulk actions</summary><div class="phase-c-bulk-inner"><div class="phase-c-bulk-top"><label class="check"><input id="phaseCSelectVisible" type="checkbox"> Select visible</label><span id="phaseCBulkCount">0 selected</span><button type="button" class="ghost-btn" id="phaseCExport">Export CSV</button></div><div class="phase-c-bulk-actions"><button type="button" class="ghost-btn" data-bulk-action="popular">Mark Popular</button><button type="button" class="ghost-btn" data-bulk-action="unpopular">Remove Popular</button><button type="button" class="ghost-btn" data-bulk-action="active">Set Active</button><button type="button" class="ghost-btn" data-bulk-action="hidden">Hide</button><button type="button" class="danger-btn" data-bulk-action="delete">Delete Selected</button></div></div>';
    toolbar.insertAdjacentElement('afterend',details);

    $('phaseCSelectVisible').addEventListener('change',e=>{
      visibleProductIds().forEach(id=>e.target.checked?selected.add(id):selected.delete(id));
      decorateCards();
    });
    $('phaseCExport').addEventListener('click',csvExport);
    details.querySelectorAll('[data-bulk-action]').forEach(btn=>btn.addEventListener('click',()=>{
      const action=btn.dataset.bulkAction;
      if(action==='popular')bulkUpdate(p=>{p.featured=true},'Selected products marked Popular.');
      else if(action==='unpopular')bulkUpdate(p=>{p.featured=false},'Popular flag removed from selected products.');
      else if(action==='active')bulkUpdate(p=>{p.status='active'},'Selected products set to Active.');
      else if(action==='hidden')bulkUpdate(p=>{p.status='hidden'},'Selected products hidden from the public catalogue.');
      else if(action==='delete')bulkDelete();
    }));
  }

  function patchRender(){
    if(window.__vePhaseCRenderPatched||typeof render!=='function')return;
    renderOriginal=render;
    window.__vePhaseCRenderPatched=true;
    window.render=render=function(){renderOriginal();decorateCards()};
  }

  function patchFilterEvents(){
    ['searchInput','categoryFilter','popularOnly','refreshBtn'].forEach(id=>{
      const el=$(id);
      if(el&&!el.dataset.phaseC){
        el.dataset.phaseC='1';
        el.addEventListener('input',()=>setTimeout(decorateCards,0));
        el.addEventListener('change',()=>setTimeout(decorateCards,0));
        el.addEventListener('click',()=>setTimeout(decorateCards,0));
      }
    });
  }

  const style=document.createElement('style');
  style.textContent='.phase-c-bulkbar{margin:10px 0 18px;padding:0;overflow:hidden}.phase-c-bulkbar>summary{cursor:pointer;list-style:none;padding:12px 14px;font-weight:700;font-size:13px;color:#344054}.phase-c-bulkbar>summary::-webkit-details-marker{display:none}.phase-c-bulkbar>summary:before{content:"＋";display:inline-block;width:20px;color:#c62828;font-size:15px}.phase-c-bulkbar[open]>summary:before{content:"−"}.phase-c-bulk-inner{border-top:1px solid #edf0f4;padding:10px 12px 12px;display:grid;gap:10px}.phase-c-bulk-top,.phase-c-bulk-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.phase-c-bulk-top{justify-content:flex-start}.phase-c-bulk-top .check{margin:0}.phase-c-bulk-top span{font-size:12px;color:#667085;margin-right:auto}.phase-c-bulk-actions button{min-height:40px}.phase-c-bulk-actions button:disabled{opacity:.45;cursor:not-allowed}.phase-c-card-select{display:inline-flex;align-items:center;gap:6px;margin-right:auto;font-size:12px;font-weight:700;color:#667085;white-space:nowrap}.phase-c-card-select input{accent-color:#c62828;width:16px;height:16px}.item-actions{align-items:center;flex-wrap:wrap}.danger-btn{border:1px solid #f04438;background:#fff;color:#b42318;border-radius:10px;padding:10px 14px;cursor:pointer}.danger-btn:disabled{opacity:.45;cursor:not-allowed}@media(max-width:700px){.phase-c-bulk-top{justify-content:flex-start}.phase-c-bulk-top span{margin-right:0}.phase-c-bulk-actions button{flex:1 1 calc(50% - 8px)}.phase-c-card-select{width:100%;order:-1;padding:2px 0 2px 2px}}';
  document.head.appendChild(style);

  function init(){
    addToolbar();
    patchRender();
    patchFilterEvents();
    decorateCards();
    const observer=new MutationObserver(()=>{addToolbar();patchFilterEvents();decorateCards()});
    observer.observe(document.body,{subtree:true,childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
