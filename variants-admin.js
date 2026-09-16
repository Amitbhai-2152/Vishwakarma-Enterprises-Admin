(()=>{
  const form=()=>document.getElementById('productForm');
  const input=id=>document.getElementById(id);
  const money=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?`₹${n.toLocaleString('en-IN',{maximumFractionDigits:2})}`:'—'};
  const parseOldSizes=p=>Array.isArray(p?.sizes)?p.sizes.map((s)=>typeof s==='object'?{name:String(s.name??s.size??'').trim(),mrp:Number(s.mrp)||0}:{name:String(s).trim(),mrp:Number(p?.mrp)||0}).filter(s=>s.name):[];
  let currentVariants=[];
  let panel=null;

  function ensurePanel(){
    const sizeInput=input('sizes'),mrpInput=input('mrp');
    if(!sizeInput||!mrpInput||panel)return;
    const sizeLabel=sizeInput.closest('label'),mrpLabel=mrpInput.closest('label');
    if(sizeLabel)sizeLabel.style.display='none';
    if(mrpLabel)mrpLabel.style.display='none';
    panel=document.createElement('div');
    panel.className='variant-pricing-panel full';
    panel.innerHTML='<div class="variant-head"><div><strong>Sizes / Variants &amp; MRP</strong><small>Add any size, measurement, pack or variant. Enter MRP separately for each one.</small></div><button type="button" class="mini-btn" id="addVariantBtn">＋ Add size</button></div><div id="variantRows" class="variant-rows"></div><small class="field-hint">Example: 20 mm, 25 mm, 32 mm — each can have its own MRP. Hindi labels keep <strong>MRP</strong> as the abbreviation.</small>';
    const anchor=(mrpLabel||sizeLabel||form().querySelector('.form-grid > label'));
    anchor.insertAdjacentElement('afterend',panel);
    panel.querySelector('#addVariantBtn').addEventListener('click',()=>{currentVariants.push({name:'',mrp:0});renderRows(true)});
    renderRows(false);
  }

  function syncLegacy(){
    const names=currentVariants.map(v=>v.name.trim()).filter(Boolean);
    input('sizes').value=names.join(', ');
    const first=currentVariants.find(v=>v.name.trim());
    input('mrp').value=first?Number(first.mrp)||0:0;
  }

  function renderRows(focusNew=false){
    ensurePanel();
    const rows=panel.querySelector('#variantRows');
    rows.innerHTML=currentVariants.length
      ?currentVariants.map((v,i)=>`<div class="variant-row" data-index="${i}"><input class="variant-name" type="text" placeholder="Size / variant (e.g. 25 mm)"><input class="variant-mrp" type="number" min="0" step="0.01" inputmode="decimal" placeholder="MRP (₹)"><span class="variant-preview">—</span><button type="button" class="icon-btn variant-remove" aria-label="Remove size">×</button></div>`).join('')
      :'<div class="variant-empty">No sizes added yet. Add a size/variant to give it a separate MRP.</div>';
    currentVariants.forEach((v,i)=>{
      const row=rows.children[i];
      if(!row)return;
      row.querySelector('.variant-name').value=v.name;
      row.querySelector('.variant-mrp').value=v.mrp||'';
      row.querySelector('.variant-preview').textContent=money(v.mrp);
    });
    rows.querySelectorAll('.variant-name').forEach((el,i)=>el.addEventListener('input',()=>{
      currentVariants[i].name=el.value;
      syncLegacy();
    }));
    rows.querySelectorAll('.variant-mrp').forEach((el,i)=>el.addEventListener('input',()=>{
      currentVariants[i].mrp=Number(el.value)||0;
      el.parentElement.querySelector('.variant-preview').textContent=money(currentVariants[i].mrp);
      syncLegacy();
    }));
    rows.querySelectorAll('.variant-remove').forEach((el,i)=>el.addEventListener('click',()=>{
      currentVariants.splice(i,1);
      renderRows(false);
      syncLegacy();
    }));
    syncLegacy();
    if(focusNew){
      requestAnimationFrame(()=>{
        const fields=rows.querySelectorAll('.variant-name');
        const field=fields[fields.length-1];
        if(field){field.focus();field.setSelectionRange(field.value.length,field.value.length)}
      });
    }
  }

  function loadVariants(p){
    ensurePanel();
    currentVariants=parseOldSizes(p);
    if(!currentVariants.length&&p?.mrp)currentVariants=[{name:'',mrp:Number(p.mrp)||0}];
    renderRows(false);
  }

  function patchEditor(){
    if(typeof window.__veOriginalOpenEditor==='undefined'&&typeof openEditor==='function'){
      window.__veOriginalOpenEditor=openEditor;
      openEditor=function(p=null){
        window.__veOriginalOpenEditor(p);
        loadVariants(p);
      };
    }
  }

  function onSubmit(e){
    if(e.target!==form())return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const previous=products.find(p=>p.id===editingId);
    const id=input('productId').value.trim();
    const nameHi=input('nameHi').value.trim();
    const nameEn=input('nameEn').value.trim();
    if(!id||!nameHi||!nameEn){toast('Please fill Product ID and both names.');return}
    if(products.some(p=>p.id===id&&p.id!==editingId)){toast('That Product ID already exists.');return}
    const variants=currentVariants.map(v=>({name:String(v.name||'').trim(),mrp:Number(v.mrp)||0})).filter(v=>v.name);
    if(!variants.length){toast('Add at least one size/variant and enter its MRP.');return}
    if(variants.some(v=>v.mrp<0||!Number.isFinite(v.mrp))){toast('Please enter a valid MRP for every size/variant.');return}
    const status=input('productStatus')?.value==='hidden'?'hidden':'active';
    const unit=['piece','meter','kg','litre','box'].includes(input('unit')?.value)?input('unit').value:'piece';
    const product={
      id,
      brand:input('brand').value.trim(),
      category:input('category').value,
      name:{hi:nameHi,en:nameEn},
      description:{hi:input('descriptionHi').value.trim(),en:input('descriptionEn').value.trim()},
      features:{hi:parseLines(input('featuresHi').value),en:parseLines(input('featuresEn').value)},
      sizes:variants,
      mrp:Number(variants[0].mrp)||0,
      unit,
      image:selectedImageData||previous?.image||fallbackImage,
      featured:input('featured').checked,
      status
    };
    products=editingId?products.map(p=>p.id===editingId?product:p):[product,...products];
    saveDraft();
    render();
    input('productDialog').close();
    toast('Draft saved with size-wise MRP. Click Publish to update the public catalogue.');
  }

  const style=document.createElement('style');
  style.textContent='.variant-pricing-panel{grid-column:1/-1;padding:16px;border:1px solid #dfe4ea;border-radius:14px;background:#fafbfc}.variant-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.variant-head strong{display:block}.variant-head small{display:block;color:#667085;margin-top:4px;line-height:1.5}.variant-rows{display:grid;gap:9px}.variant-row{display:grid;grid-template-columns:minmax(0,1fr) 160px 100px 40px;gap:8px;align-items:center}.variant-row input{min-width:0}.variant-preview{font-size:13px;font-weight:700;color:#c62828;white-space:nowrap}.variant-empty{padding:12px;border:1px dashed #cfd6df;border-radius:10px;color:#667085;background:#fff}.variant-remove{height:42px}.variant-pricing-panel .field-hint{display:block;margin-top:10px}@media(max-width:700px){.variant-head{flex-direction:column}.variant-row{grid-template-columns:1fr 1fr 36px}.variant-preview{display:none}}';
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded',()=>{patchEditor();ensurePanel();form()?.addEventListener('submit',onSubmit,true)});
})();
