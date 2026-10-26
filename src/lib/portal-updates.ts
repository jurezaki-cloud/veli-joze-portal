export type PortalUpdate="portal-notifications-change"|"portal-visit-reviewed";
const key="veli-joze-portal-update";
const allowed=new Set<PortalUpdate>(["portal-notifications-change","portal-visit-reviewed"]);
// Only an invalidation signal is shared. Each tab fetches its own authorized data.
export function publishPortalUpdate(type:PortalUpdate="portal-notifications-change"){
 if(typeof window==="undefined")return;
 window.dispatchEvent(new Event(type));
 try{window.localStorage.setItem(key,JSON.stringify({version:1,type,nonce:crypto.randomUUID()}))}catch{/* Local refresh still works when storage is unavailable. */}
}
export function connectPortalUpdates(){
 if(typeof window==="undefined")return ()=>{};
 const receive=(event:StorageEvent)=>{
  if(event.key!==key||!event.newValue||event.newValue.length>300)return;
  try{const data=JSON.parse(event.newValue);if(data&&data.version===1&&allowed.has(data.type)&&typeof data.nonce==="string")window.dispatchEvent(new Event(data.type))}catch{/* Ignore unrelated or malformed signals. */}
 };
 window.addEventListener("storage",receive);
 return()=>window.removeEventListener("storage",receive);
}
