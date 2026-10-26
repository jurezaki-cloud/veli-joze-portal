/** Per-account, per-conversation text drafts in this tab only. Never stores photos. */
const memory=new Map<string,string>();
function key(owner:string,conversation:string){return owner&&conversation?`veli-joze-draft-v1:${owner}:${conversation}`:"";}
export function readMessageDraft(owner:string,conversation:string,maxLength:number):string{
 const name=key(owner,conversation);if(!name)return "";
 try{const value=sessionStorage.getItem(name);if(value!==null){if(value.length<=maxLength)return value;sessionStorage.removeItem(name);return "";}}catch{}
 return (memory.get(name)||"").slice(0,maxLength);
}
export function saveMessageDraft(owner:string,conversation:string,value:string,maxLength:number){
 const name=key(owner,conversation);if(!name)return;
 const text=value.slice(0,maxLength);
 if(text)memory.set(name,text);else memory.delete(name);
 try{if(text)sessionStorage.setItem(name,text);else sessionStorage.removeItem(name);}catch{}
}

export function clearSentMessageDraft(owner:string,conversation:string,sentText:string,maxLength:number){
 if(readMessageDraft(owner,conversation,maxLength)===sentText)saveMessageDraft(owner,conversation,"",maxLength);
}

const pending=new Map<string,{body:string;id:string}>();
const validRequestId=(id:unknown)=>typeof id==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export function clearLocalMessageData(broadcast=false){
 memory.clear();pending.clear();
 try{for(let i=sessionStorage.length-1;i>=0;i--){const name=sessionStorage.key(i);if(name?.startsWith("veli-joze-draft-v1:")||name==="veli-joze-draft-owner-v1")sessionStorage.removeItem(name)}}catch{}
 if(typeof window!=="undefined"){
  window.dispatchEvent(new Event("veli-joze-drafts-cleared"));
  if(broadcast)try{window.localStorage.setItem("veli-joze-drafts-clear",crypto.randomUUID())}catch{}
 }
}
export function getMessageRequestKey(owner:string,conversation:string,body:string){
 const name=key(owner,conversation)+":request";
 let previous=pending.get(name);
 try{const raw=sessionStorage.getItem(name);if(raw&&raw.length<13000){const stored=JSON.parse(raw);if(stored.body===body&&validRequestId(stored.id))previous=stored;}}catch{}
 if(previous?.body===body&&validRequestId(previous.id))return previous.id;
 const entry={body,id:crypto.randomUUID()};pending.set(name,entry);
 try{sessionStorage.setItem(name,JSON.stringify(entry));}catch{}
 return entry.id;
}
export function clearMessageRequestKey(owner:string,conversation:string,id:string){
 const name=key(owner,conversation)+":request";
 if(pending.get(name)?.id===id)pending.delete(name);
 try{const stored=JSON.parse(sessionStorage.getItem(name)||"null");if(stored?.id===id)sessionStorage.removeItem(name);}catch{}
}

/** Called only after the server has confirmed the current identity. */
export function claimMessageDraftOwner(owner:string){
 if(!owner)return;
 try{const previous=sessionStorage.getItem("veli-joze-draft-owner-v1");if(previous&&previous!==owner)clearLocalMessageData();sessionStorage.setItem("veli-joze-draft-owner-v1",owner)}catch{}
}
