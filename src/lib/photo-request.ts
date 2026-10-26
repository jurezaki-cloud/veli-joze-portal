import {getMessageRequestKey,clearMessageRequestKey} from "./message-drafts";
/** The photo bytes stay in the file input; storage contains only a digest and retry key. */
export async function getPhotoRequestKey(owner:string,conversation:string,file:File){
 if(!owner)throw new Error("Za pošiljanje fotografije se prijavi.");
 const hash=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
 const fingerprint=Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,"0")).join("");
 return getMessageRequestKey(owner,"photo:"+conversation,fingerprint);
}
export function clearPhotoRequestKey(owner:string,conversation:string,id:string){
 clearMessageRequestKey(owner,"photo:"+conversation,id);
}
