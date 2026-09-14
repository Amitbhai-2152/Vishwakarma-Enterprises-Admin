const enc=new TextEncoder();
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':process.env.ALLOWED_ORIGIN||'*','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}});
function b64u(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function b64uText(text){return b64u(enc.encode(text))}
function fromB64u(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function hmac(secret,data){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(data)))}
function same(a,b){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a[i]^b[i];return x===0}
async function makeToken(secret){const payload=JSON.stringify({iat:Date.now(),exp:Date.now()+7*24*60*60*1000});const p=b64uText(payload);return p+'.'+b64u(await hmac(secret,p))}
async function validToken(secret,token){try{const [p,s]=String(token||'').split('.');if(!p||!s)return false;const sig=await hmac(secret,p);if(!same(sig,fromB64u(s)))return false;const payload=JSON.parse(new TextDecoder().decode(fromB64u(p)));return Number(payload.exp)>Date.now()}catch{return false}}

export default async request=>{
  const secret=process.env.ADMIN_PASSWORD;
  if(request.method==='OPTIONS')return json({},204);
  if(request.method!=='POST')return json({ok:false,error:'Method not allowed.'},405);
  if(!secret)return json({ok:false,error:'Admin password is not configured on the server.'},500);
  let body={};try{body=await request.json()}catch{return json({ok:false,error:'Invalid request.'},400)}
  if(body.action==='verify')return json({ok:await validToken(secret,body.token||'')});
  if(body.action==='login'){
    if(typeof body.password!=='string'||body.password.length<1)return json({ok:false,error:'Enter the admin password.'},400);
    if(body.password!==secret)return json({ok:false,error:'Incorrect password.'},401);
    return json({ok:true,token:await makeToken(secret),expiresIn:7*24*60*60});
  }
  return json({ok:false,error:'Unknown action.'},400);
};
