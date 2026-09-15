exports.handler = async function(event){
  const headers={
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'GET,OPTIONS'
  };

  if(event.httpMethod==='OPTIONS')return{statusCode:204,headers,body:''};

  try{
    const params=event.queryStringParameters||{};
    const text=String(params.text||'').trim();
    const source=String(params.source||'en').trim().toLowerCase();
    const target=String(params.target||'hi').trim().toLowerCase();

    if(!text)return{statusCode:400,headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({success:false,error:'Text is required.'})};

    const url='https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+encodeURIComponent(source+'|'+target);
    const response=await fetch(url,{headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('Translation service returned '+response.status+'.');
    const data=await response.json();
    const translated=String(data?.responseData?.translatedText||'').trim();
    if(!translated)throw new Error('Translation service returned no translation.');

    return{statusCode:200,headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({success:true,translated})};
  }catch(error){
    return{statusCode:502,headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({success:false,error:error?.message||'Translation failed.'})};
  }
};
