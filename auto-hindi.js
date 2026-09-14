(function(){
  const $=id=>document.getElementById(id);
  const en=$('nameEn'),hi=$('nameHi'),btn=$('autoHindiBtn');
  if(!en||!hi)return;
  let lastAuto='';
  let timer;
  const common={
    'pvc':'पीवीसी','pipe':'पाइप','pipes':'पाइप','fitting':'फिटिंग','fittings':'फिटिंग्स','elbow':'एल्बो','tee':'टी','socket':'सॉकेट','coupler':'कपलर','union':'यूनियन','valve':'वाल्व','tap':'टैप','faucet':'नल','tank':'टंकी','water':'वाटर','pump':'पंप','motor':'मोटर','bathroom':'बाथरूम','sanitary':'सैनिटरी','basin':'बेसिन','toilet':'टॉयलेट','seat':'सीट','shower':'शॉवर','hose':'होज','clamp':'क्लैम्प','connector':'कनेक्टर','adapter':'एडेप्टर','nipple':'निप्पल','thread':'थ्रेड','washer':'वॉशर','bolt':'बोल्ट','nut':'नट','screw':'स्क्रू','drill':'ड्रिल','tool':'टूल','tools':'टूल्स','switch':'स्विच','wire':'वायर','cable':'केबल','motor':'मोटर','sprinkler':'स्प्रिंकलर','irrigation':'सिंचाई','adhesive':'चिपकने वाला','sealant':'सीलेंट','premium':'प्रीमियम','heavy':'हेवी','duty':'ड्यूटी','brass':'पीतल','steel':'स्टील','plastic':'प्लास्टिक','metal':'मेटल','strong':'मजबूत','durable':'टिकाऊ','long':'लंबा','lasting':'चलने वाला','waterproof':'वॉटरप्रूफ','pressure':'प्रेशर','inch':'इंच','size':'आकार','set':'सेट','kit':'किट','double':'डबल','single':'सिंगल','longlife':'लॉन्गलाइफ','connector':'कनेक्टर'
  };
  const phrase={
    'water tank':'पानी की टंकी','water pump':'पानी का पंप','submersible pump':'सबमर्सिबल पंप','pvc pipe':'पीवीसी पाइप','pvc pipes':'पीवीसी पाइप','pipe fitting':'पाइप फिटिंग','pipe fittings':'पाइप फिटिंग्स','bathroom tap':'बाथरूम नल','kitchen tap':'किचन नल','hand shower':'हैंड शॉवर','waste pipe':'वेस्ट पाइप','water tap':'पानी का नल','motor pump':'मोटर पंप','pressure pump':'प्रेशर पंप','electric pump':'इलेक्ट्रिक पंप','brass valve':'पीतल का वाल्व','steel clamp':'स्टील क्लैम्प'
  };
  function fallback(text){
    const clean=text.trim().replace(/\s+/g,' '), low=clean.toLowerCase();
    if(phrase[low])return phrase[low];
    return clean.split(' ').map(w=>common[w.toLowerCase()]||w).join(' ');
  }
  async function autoHindi(){
    const text=en.value.trim();
    if(!text)return;
    const old=hi.value.trim();
    if(old && old!==lastAuto)return;
    hi.value=fallback(text);
    lastAuto=hi.value.trim();
    try{
      const url='https://inputtools.google.com/request?text='+encodeURIComponent(text)+'&itc=hi-t-i0-und&num=1';
      const r=await fetch(url,{cache:'no-store'});
      const data=await r.json();
      const candidate=data?.[1]?.[0]?.[1]?.[0];
      if(candidate && en.value.trim()===text && (!hi.value.trim()||hi.value.trim()===lastAuto)){
        hi.value=candidate;
        lastAuto=candidate;
      }
    }catch{}
  }
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(autoHindi,350);
  }
  en.addEventListener('input',schedule);
  en.addEventListener('blur',autoHindi);
  hi.addEventListener('input',()=>{ if(hi.value.trim()!==lastAuto) lastAuto=''; });
  btn?.addEventListener('click',autoHindi);
})();