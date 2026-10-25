// Optional unencrypted local transcript. It is NEVER used to construct AI requests.
export const CHAT_KEY='arteria-chat-v1';
export function normalizeHistory(value){
 if(!value||value.version!==1||value.enabled!==true)return {version:1,enabled:false,entries:[]};
 const entries=Array.isArray(value.entries)?value.entries.slice(-20).filter(e=>e&&['user','ai','safety','local'].includes(e.kind)&&typeof e.text==='string'&&e.text.length>0&&e.text.length<=4000&&typeof e.at==='string'&&Number.isFinite(Date.parse(e.at))).map(e=>({kind:e.kind,text:e.text,at:e.at})):[];
 return {version:1,enabled:true,entries};
}
export function readChat(storage){try{const raw=(storage??localStorage).getItem(CHAT_KEY);if(raw?.length>100000)throw Error();return normalizeHistory(JSON.parse(raw||'null'));}catch{return normalizeHistory(null);}}
export function writeChat(value,storage=localStorage){const next=normalizeHistory(value);if(next.enabled)storage.setItem(CHAT_KEY,JSON.stringify(next));else storage.removeItem(CHAT_KEY);return next;}
