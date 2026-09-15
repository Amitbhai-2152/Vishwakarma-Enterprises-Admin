exports.handler = async function(event){
  const headers={
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'GET,OPTIONS'
  };

  if(event.httpMethod==='OPTIONS')return{statusCode:204,headers,body:''};

  const json=(status,payload)=>({statusCode:status,headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(payload)});

  async function myMemory(text,source,target){
    const url='https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+encodeURIComponent(source+'|'+target);
    const r=await fetch(url,{headers:{Accept:'application/json'}});
    if(!r.ok)return '';
    const d=await r.json().catch(()=>({}));
    return String(d?.responseData?.translatedText||'').trim();
  }

  async function romanHindiToDevanagari(text){
    const url='https://inputtools.google.com/request?text='+encodeURIComponent(text)+'&itc=hi-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8';
    const r=await fetch(url,{headers:{Accept:'application/json'}});
    if(!r.ok)return '';
    const d=await r.json().catch(()=>null);
    const candidates=d?.[1]?.[0]?.[1];
    return Array.isArray(candidates)&&candidates[0]?String(candidates[0]).trim():'';
  }

  function looksLikeHinglish(text){
    if(/[\u0900-\u097F]/.test(text))return false;
    const s=text.toLowerCase();
    const words=s.split(/[^a-z]+/).filter(Boolean);
    const hints=['mai','main','me','mujhe','mujh','mera','meri','mere','hai','hu','ho','hota','hoti','tha','thi','the','aap','tum','ye','yah','woh','vo','kya','kaise','kaisa','kyu','kyon','nahi','nahin','se','ko','ke','ki','ka','par','pe','mein','me','aur','bhi','bahut','acha','achha','accha','ek','iske','uske','karna','karo','karta','karte','wala','wali','waale','chahiye'];
    const score=words.reduce((n,w)=>n+(hints.includes(w)?1:0),0);
    return score>=1;
  }

  async function translate(text,source,target){
    // For English -> Hindi, recognize Roman-Hindi/Hinglish and transliterate it first.
    if(source==='en'&&target==='hi'&&looksLikeHinglish(text)){
      const devanagari=await romanHindiToDevanagari(text);
      if(devanagari)return devanagari;
    }

    // For Hindi -> English, also handle Roman-Hindi pasted into the Hindi field.
    if(source==='hi'&&target==='en'&&looksLikeHinglish(text)){
      const devanagari=await romanHindiToDevanagari(text);
      if(devanagari){
        const translated=await myMemory(devanagari,'hi','en');
        if(translated)return translated;
      }
    }

    // Normal translation path.
    let translated=await myMemory(text,source,target);
    if(translated)return translated;

    // Last-resort Google translation endpoint.
    const google='https://translate.googleapis.com/translate_a/single?client=gtx&sl='+encodeURIComponent(source)+'&tl='+encodeURIComponent(target)+'&dt=t&q='+encodeURIComponent(text);
    const gr=await fetch(google,{headers:{Accept:'application/json'}});
    if(gr.ok){
      const gd=await gr.json().catch(()=>null);
      translated=Array.isArray(gd?.[0])?gd[0].map(x=>x?.[0]||'').join('').trim():'';
    }
    return translated||'';
  }

  try{
    const params=event.queryStringParameters||{};
    const text=String(params.text||'').trim();
    const source=String(params.source||'en').trim().toLowerCase();
    const target=String(params.target||'hi').trim().toLowerCase();

    if(!text)return json(400,{success:false,error:'Text is required.'});
    if(!['en','hi'].includes(source)||!['en','hi'].includes(target))return json(400,{success:false,error:'Only en and hi are supported.'});

    const translated=await translate(text,source,target);
    if(!translated)return json(502,{success:false,error:'Translation service returned no translation.'});
    return json(200,{success:true,translated});
  }catch(error){
    return json(502,{success:false,error:error?.message||'Translation failed.'});
  }
};
