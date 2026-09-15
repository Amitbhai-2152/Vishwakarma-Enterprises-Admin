(()=>{
  // Keep Product ID controlled by the catalogue, not manually editable.
  const PRODUCT_ID_KEY='ve-next-product-number';
  const normalizeNumber=id=>{
    const match=String(id||'').match(/^P(\d+)$/i);
    return match?Number(match[1]):0;
  };
  const nextProductId=()=>{
    const highest=Math.max(0,...(Array.isArray(products)?products:[]).map(p=>normalizeNumber(p?.id)));
    const saved=Math.max(highest+1,Number(localStorage.getItem(PRODUCT_ID_KEY))||0,1);
    localStorage.setItem(PRODUCT_ID_KEY,String(saved+1));
    return `P${String(saved).padStart(3,'0')}`;
  };
  const lockProductId=()=>{
    const input=document.getElementById('productId');
    if(!input)return;
    input.readOnly=true;
    input.tabIndex=-1;
    input.setAttribute('aria-readonly','true');
    input.title='Product ID is generated automatically and cannot be changed.';
  };
  const newButton=document.getElementById('newProductBtn');
  if(newButton)newButton.addEventListener('click',()=>{
    setTimeout(()=>{
      const input=document.getElementById('productId');
      if(input){input.value=nextProductId();lockProductId();}
    },0);
  });
  lockProductId();
})();
