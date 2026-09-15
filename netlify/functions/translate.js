exports.handler = async function(event){
  const headers={
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'GET,OPTIONS'
  };
  if(event.httpMethod==='OPTIONS')return{statusCode:204,headers,body:''};
  const json=(status,payload)=>({statusCode:status,headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(payload)});

  async function getJson(url){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    try{
      const r=await fetch(url,{headers:{Accept:'application/json'},signal:controller.signal});
      if(!r.ok)return null;
      return await r.json().catch(()=>null);
    }catch{return null}finally{clearTimeout(timer)}
  }

  async function googleTranslate(text,source,target){
    const d=await getJson('https://translate.googleapis.com/translate_a/single?client=gtx&sl='+encodeURIComponent(source)+'&tl='+encodeURIComponent(target)+'&dt=t&q='+encodeURIComponent(text));
    return Array.isArray(d?.[0])?d[0].map(x=>x?.[0]||'').join('').trim():'';
  }

  async function myMemory(text,source,target){
    const d=await getJson('https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+encodeURIComponent(source+'|'+target));
    return String(d?.responseData?.translatedText||'').trim();
  }

  async function romanHindiCandidates(text){
    const d=await getJson('https://inputtools.google.com/request?text='+encodeURIComponent(text)+'&itc=hi-t-i0-und&num=12&cp=0&cs=1&ie=utf-8&oe=utf-8');
    const values=d?.[1]?.[0]?.[1];
    return Array.isArray(values)?values.map(x=>String(x||'').trim()).filter(Boolean):[];
  }

  function looksLikeRomanHindi(text){
    if(/[\u0900-\u097F]/.test(text))return false;
    const words=String(text).toLowerCase().split(/[^a-z]+/).filter(Boolean);
    const hints=new Set([
      'mai','main','mein','me','mujhe','mujh','mera','meri','mere','hum','ham','hai','hain','hu','ho','hoon','hun',
      'tha','thi','the','aap','ap','tum','tu','ye','yah','woh','wo','vo','kya','kaise','kaisa','kyu','kyon','kyun',
      'nahi','nahin','na','se','ko','ke','ki','ka','par','pe','aur','bhi','bahut','bohot','acha','achha','accha',
      'ek','iske','uske','karna','karo','karta','karte','wali','wala','waale','chahiye','raha','rahi','rahe',
      'hii','mujhse','apna','apne','apni','sab','kuch','kaam','naam','ghar','pani','paani','kaha','kab','kyonki'
    ]);
    return words.reduce((n,w)=>n+(hints.has(w)?1:0),0)>=1;
  }

  function hasHindi(text){return /[\u0900-\u097F]/.test(String(text||''));}

  async function translateRoman(text,target){
    // Ask Google to translate the Romanized sentence directly first.
    // For Hinglish this generally preserves the intended meaning better than
    // translating individual words.
    const direct=await googleTranslate(text,'auto',target);
    if(direct && (target==='en' || hasHindi(direct)))return direct;

    // Fallback through Google Input Tools -> Devanagari -> Google translation.
    const candidates=await romanHindiCandidates(text);
    if(target==='hi')return candidates[0]||direct||'';
    for(const candidate of candidates){
      const translated=await googleTranslate(candidate,'hi','en');
      if(translated)return translated;
    }
    return direct||'';
  }

  async function translate(text,source,target){
    if(looksLikeRomanHindi(text))return translateRoman(text,target);

    // Use Google first for natural sentence-level English <-> Hindi output.
    const google=await googleTranslate(text,source,target);
    if(google)return google;
    return myMemory(text,source,target);
  }

  try{
    const params=event.queryStringParameters||{};
    const text=String(params.text||'').trim();
    const source=String(params.source||'en').trim().toLowerCase();
    const target=String(params.target||'hi').trim().toLowerCase();
    if(!text)return json(400,{success:false,error:'Text is required.'});
    if(!['en','hi'].includes(source)||!['en','hi'].includes(target))return json(400,{success:false,error:'Only en and hi are supported.'});
    if(source===target&&!looksLikeRomanHindi(text))return json(200,{success:true,translated:text});

    const translated=await translate(text,source,target);
    if(!translated)return json(502,{success:false,error:'Translation service returned no translation.'});
    return json(200,{success:true,translated});
  }catch(error){
    return json(502,{success:false,error:error?.message||'Translation failed.'});
  }
};
