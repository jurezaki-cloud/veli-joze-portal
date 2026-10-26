import {createHash,randomUUID} from "node:crypto";
/** Namespaced deterministic IDs let the existing primary key arbitrate concurrent retries. */
export function messageRequestId(owner:string,kind:"chat"|"direct"|"chat-photo"|"direct-photo",value:unknown){
 if(value===undefined)return randomUUID();
 if(typeof value!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))return null;
 const bytes=createHash("sha256").update(`veli-joze-message-v1:${kind}:${owner}:${value.toLowerCase()}`).digest().subarray(0,16);
 bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;
 const hex=bytes.toString("hex");return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
