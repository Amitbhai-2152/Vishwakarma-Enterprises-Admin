(()=>{
  const $=id=>document.getElementById(id);
  const previewState={};
  let dirty=false;
  let originalSnapshot='';
  let previewDialog=null;

  const getVariants=()=>Array.isArray(window.currentVariants)?window.currentVariants:(typeof currentVariants!=='undefined'?currentVariants:[]);
  const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?`₹${n.toLocaleString('en-IN',{maximumFractionDigits:2})}`:'—'};
  const parseLinesLocal=v=>String(v||'').split(/\r?\n/).map(x=>x.replace(/^\s*[-•▪◦‣]\s*/,'').trim()).filter(Boolean);

  function formSnapshot(){
    const ids=['productId','brand','nameHi','nameEn','category','sizes','mrp','descriptionHi','descriptionEn','featuresHi','featuresEn','featured'];
    const values={};
    ids.forEach(id=>{const e=$(id);values[id]=e?.type==='checkbox'?!!e.checked:String(e?.value||'')});
    values.variants=getVariants().map(v=>({name:String(v?.name||'').trim(),mrp:Number(v?.mrp)||0}));
    return JSON.stringify(values);
  }
  function setClean(){originalSnapshot=formSnapshot();dirty=false;updateDirtyUi()}
  function updateDirtyUi(){const title=$('dialogTitle');if(title&&$('productDialog')?.open){const base=title.dataset.baseTitle||title.textContent.replace(/^•\s*/,'');title.dataset.baseTitle=base;title.textContent=dirty?'• '+base:base} }
  function markDirty(){dirty=formSnapshot()!==originalSnapshot;updateDirtyUi()}

  function ensurePreview(){
    if(previewDialog)return previewDialog;
    previewDialog=document.createElement('dialog');
    previewDialog.id='productPreviewDialog';
    previewDialog.className='product-preview-dialog';
    previewDialog.innerHTML='<div class="preview-head"><div><span class="eyebrow">LIVE PREVIEW</span><h2>Public Product Preview</h2></div><button type="button" class="icon-btn" id="closePreview">×</button></div><div id="previewBody" class="preview-body"></div>';
    document.body.appendChild(previewDialog);
    previewDialog.querySelector('#closePreview').addEventListener('click',()=>previewDialog.close());
    previewDialog.addEventListener('click',e=>{if(e.target===previewDialog)previewDialog.close()});
    return previewDialog;
  }

  function collectPreview(){
    const variants=getVariants().filter(v=>String(v?.name||'').trim()).map(v=>({name:String(v.name).trim(),mrp:Number(v.mrp)||0}));
    const hi=$('featuresHi')?.value||'',en=$('featuresEn')?.value||'';
    const features=(en?parseLinesLocal(en):parseLinesLocal(hi));
    const image=$('imagePreview')?.hidden?'' : $('imagePreview')?.src||'';
    return {
      id:$('productId')?.value.trim()||'—',
      brand:$('brand')?.value.trim()||'Vishwakarma Enterprises',
      category:$('category')?.value||'other',
      nameEn:$('nameEn')?.value.trim()||'Product name',
      nameHi:$('nameHi')?.value.trim()||'उत्पाद का नाम',
      descriptionEn:$('descriptionEn')?.value.trim()||'No English description added yet.',
      descriptionHi:$('descriptionHi')?.value.trim()||'हिंदी विवरण अभी उपलब्ध नहीं है।',
      features,variants,mrp:variants[0]?.mrp||Number($('mrp')?.value)||0,image
    };
  }
  function renderPreview(){
    const p=collectPreview(),box=ensurePreview(),body=box.querySelector('#previewBody');
    body.innerHTML=`<article class="public-preview-card"><div class="public-preview-gallery">${p.image?`<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.nameEn)}">`:'<div class="public-preview-image-placeholder">No product image selected</div>'}</div><section class="public-preview-info"><span class="preview-brand">${escapeHtml(p.brand)}</span><span class="preview-id">${escapeHtml(p.id)}</span><h1>${escapeHtml(p.nameEn)}</h1><p class="preview-hi-name">${escapeHtml(p.nameHi)}</p>${p.mrp?`<div class="preview-mrp"><span>MRP per piece</span><strong>${money(p.mrp)}</strong></div>`:''}<p class="preview-description">${escapeHtml(p.descriptionEn)}</p>${p.variants.length?`<div class="preview-section"><h3>Sizes / Variants</h3><div class="preview-variants">${p.variants.map(v=>`<span>${escapeHtml(v.name)} · ${money(v.mrp)}</span>`).join('')}</div></div>`:''}${p.features.length?`<div class="preview-section"><h3>Key Features</h3><ul>${p.features.map(v=>`<li>${escapeHtml(v)}</li>`).join('')}</ul></div>`:''}<button type="button" class="primary-btn" disabled>Enquire on WhatsApp</button></section></article>`;
    box.showModal();
  }

  function validateCatalogue(items){
    const list=Array.isArray(items)?items:[];
    const errors=[],ids=new Set();
    list.forEach((p,i)=>{
      const where=`Product ${p?.id||`#${i+1}`}`;
      const id=String(p?.id||'').trim();
      if(!id)errors.push(`${where}: missing Product ID`);else if(ids.has(id))errors.push(`${where}: duplicate Product ID ${id}`);else ids.add(id);
      if(!String(p?.name?.en||'').trim())errors.push(`${where}: missing English name`);
      if(!String(p?.name?.hi||'').trim())errors.push(`${where}: missing Hindi name`);
      if(!String(p?.category||'').trim())errors.push(`${where}: missing category`);
      const variants=Array.isArray(p?.sizes)?p.sizes:[];
      if(!variants.length)errors.push(`${where}: add at least one size/variant`);
      const names=new Set();
      variants.forEach(v=>{const name=String(typeof v==='object'?v?.name||v?.size||'':v||'').trim(),mrp=Number(typeof v==='object'?v?.mrp:p?.mrp);if(!name)errors.push(`${where}: empty size/variant`);else if(names.has(name.toLowerCase()))errors.push(`${where}: duplicate size/variant ${name}`);else names.add(name.toLowerCase());if(!Number.isFinite(mrp)||mrp<0)errors.push(`${where}: invalid MRP for ${name||'variant'}`)});
      if(!p?.image)errors.push(`${where}: missing product image`);
      const hiFeatures=Array.isArray(p?.features?.hi)?p.features.hi:[],enFeatures=Array.isArray(p?.features?.en)?p.features.en:[];
      if(hiFeatures.some(x=>!String(x||'').trim()))errors.push(`${where}: empty Hindi feature`);
      if(enFeatures.some(x=>!String(x||'').trim()))errors.push(`${where}: empty English feature`);
    });
    return errors;
  }

  function showValidation(errors){
    const message=errors.length?`Publish blocked. Fix ${errors.length} issue${errors.length===1?'':'s'} first:\n\n• ${errors.slice(0,12).join('\n• ')}${errors.length>12?`\n• …and ${errors.length-12} more`:''}`:'Catalogue is ready to publish.';
    if(typeof toast==='function')toast(message);else alert(message);
  }

  function cloneCurrent(){
    if(typeof products==='undefined'||typeof openEditor!=='function')return;
    const source=editingId?products.find(p=>p.id===editingId):null;
    if(!source){toast?.('Open a product first to duplicate it.');return}
    const copy=JSON.parse(JSON.stringify(source));
    copy.id='';
    copy.name={hi:copy.name?.hi||'',en:copy.name?.en?`${copy.name.en} Copy`:''};
    openEditor(copy);
    const id=$('productId');if(id){id.value=typeof nextProductId==='function'?nextProductId():'';id.readOnly=true}
    dirty=true;updateDirtyUi();toast?.('Product duplicated. Update the name and details, then save it as a new product.');
  }

  function ensureStatusControl(){
    const featured=$('featured');if(!featured||$('productStatus'))return;
    const label=document.createElement('label');label.className='check full';label.innerHTML='<span>Product status</span><select id="productStatus"><option value="active">Active — visible on catalogue</option><option value="hidden">Hidden — keep in admin, hide from catalogue</option></select>';
    featured.closest('label')?.insertAdjacentElement('afterend',label);
  }
  function applyStatusToDraft(){
    const select=$('productStatus');if(!select||typeof products==='undefined'||typeof editingId==='undefined'||!editingId)return;
    const p=products.find(x=>x.id===editingId);if(p)p.status=select.value;
  }
  function filterHiddenAfterRender(){
    document.querySelectorAll('[data-edit]').forEach(btn=>{
      const id=btn.dataset.edit,p=typeof products!=='undefined'?products.find(x=>x.id===id):null;
      if(!p||p.status!=='hidden')return;
      const card=btn.closest('.product-item');if(!card)return;
      const meta=card.querySelector('.product-meta');
      if(meta&&!meta.querySelector('.hidden-badge'))meta.insertAdjacentHTML('beforeend','<span class="badge hidden-badge">Hidden</span>');
    });
  }

  function patchRender(){
    if(window.__vePhaseBRenderPatched||typeof render!=='function')return;
    const original=render;
    window.__vePhaseBRenderPatched=true;
    window.render=render=function(){original();filterHiddenAfterRender()};
  }
  function patchEditor(){
    if(window.__vePhaseBEditorPatched||typeof openEditor!=='function')return;
    const original=openEditor;window.__vePhaseBEditorPatched=true;
    window.openEditor=openEditor=function(p=null){
      original(p);
      ensureStatusControl();
      const select=$('productStatus');select.value=p?.status==='hidden'?'hidden':'active';
      setTimeout(()=>setClean(),0);
    };
  }
  function patchSubmit(){
    const form=$('productForm');if(!form||form.dataset.phaseBSubmit)return;
    form.dataset.phaseBSubmit='1';
    form.addEventListener('input',markDirty);
    form.addEventListener('change',()=>{markDirty();applyStatusToDraft()});
    form.addEventListener('click',e=>{if(e.target.closest('#productStatus'))e.stopPropagation()});
  }
  function patchNewButtons(){
    const pageHead=$('newProductBtn');if(pageHead&&!pageHead.dataset.cloneReady){
      const clone=document.createElement('button');clone.type='button';clone.className='ghost-btn';clone.id='duplicateProductBtn';clone.textContent='⧉ Duplicate Product';clone.title='Open a product first, then duplicate it';pageHead.insertAdjacentElement('afterend',clone);clone.addEventListener('click',cloneCurrent);pageHead.dataset.cloneReady='1';
    }
    const editorPreview=document.createElement('button');
    const foot=$('saveBtn')?.closest('.dialog-foot');
    if(foot&&!$('previewProductBtn')){editorPreview.type='button';editorPreview.className='ghost-btn';editorPreview.id='previewProductBtn';editorPreview.textContent='Preview';foot.insertBefore(editorPreview,$('saveBtn'));editorPreview.addEventListener('click',renderPreview)}
  }

  function patchPublish(){
    if(window.__vePhaseBPublishPatched||typeof publish!=='function')return;
    const original=publish;window.__vePhaseBPublishPatched=true;
    window.publish=publish=async function(){
      const errors=validateCatalogue(typeof products!=='undefined'?products:[]);
      if(errors.length){showValidation(errors);return}
      return original();
    };
  }

  function patchCloseProtection(){
    const dialog=$('productDialog');if(!dialog||dialog.dataset.phaseBClose)return;
    dialog.dataset.phaseBClose='1';
    const allowClose=()=>{dirty=false};
    dialog.addEventListener('cancel',e=>{if(!dirty)return;if(!confirm('You have unsaved changes. Close without saving?'))e.preventDefault();else allowClose()});
    const closeButtons=[$('closeDialog'),$('cancelBtn')].filter(Boolean);closeButtons.forEach(btn=>btn.addEventListener('click',e=>{if(!dirty){allowClose();return}if(!confirm('You have unsaved changes. Close without saving?')){e.preventDefault();e.stopImmediatePropagation()}else allowClose()},{capture:true}));
  }

  const style=document.createElement('style');style.textContent='.product-preview-dialog{width:min(960px,94vw);max-width:960px;border:0;border-radius:18px;padding:0;box-shadow:0 24px 80px rgba(15,23,42,.25)}.preview-head{display:flex;justify-content:space-between;align-items:flex-start;padding:20px 22px;border-bottom:1px solid #e8edf3;background:#fff}.preview-head h2{margin:3px 0 0}.preview-body{padding:22px;background:#f6f8fb}.public-preview-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;background:#fff;border-radius:18px;padding:22px}.public-preview-gallery img,.public-preview-image-placeholder{width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px;background:#eef2f6;display:grid;place-items:center;color:#667085}.public-preview-info{padding:8px}.preview-brand,.preview-id{display:inline-block;color:#667085;font-size:12px;margin-right:10px}.public-preview-info h1{font-size:32px;margin:10px 0 4px}.preview-hi-name{margin:0 0 14px;color:#667085}.preview-mrp{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid #e4e8ee;border-radius:12px;margin-bottom:16px}.preview-mrp strong{font-size:20px}.preview-description{line-height:1.7}.preview-section{margin:20px 0}.preview-section h3{margin-bottom:9px}.preview-variants{display:flex;flex-wrap:wrap;gap:8px}.preview-variants span{padding:8px 10px;border:1px solid #e1e5eb;border-radius:999px;font-size:13px}.preview-section ul{padding-left:20px;line-height:1.8}.hidden-badge{background:#f2f4f7;color:#344054}.product-status-control{display:flex}.dialog-foot{gap:8px}@media(max-width:700px){.public-preview-card{grid-template-columns:1fr}.public-preview-info h1{font-size:25px}}';document.head.appendChild(style);

  function init(){
    ensureStatusControl();patchRender();patchEditor();patchSubmit();patchNewButtons();patchPublish();patchCloseProtection();
    const observer=new MutationObserver(()=>{ensureStatusControl();patchEditor();patchSubmit();patchNewButtons();patchCloseProtection()});observer.observe(document.body,{subtree:true,childList:true});
    window.addEventListener('beforeunload',e=>{if(!dirty)return;e.preventDefault();e.returnValue=''});
    document.addEventListener('click',e=>{const card=e.target.closest('[data-edit]');if(card){const id=card.dataset.edit;const p=typeof products!=='undefined'?products.find(x=>x.id===id):null;setTimeout(()=>{const select=$('productStatus');if(select)select.value=p?.status==='hidden'?'hidden':'active'},0)}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
