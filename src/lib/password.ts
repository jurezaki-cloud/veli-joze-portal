import {randomBytes,scrypt as derive,timingSafeEqual,createHash} from "node:crypto";
const scrypt=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>derive(password,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));
export function validPassword(value:unknown):value is string{return typeof value==="string"&&value.length>=12&&value.length<=128}
export async function hashPassword(password:string){const salt=randomBytes(16).toString("hex");const hash=await scrypt(password,salt);return `scrypt$${salt}$${hash.toString("hex")}`}
export async function verifyPassword(password:string,stored:string){const [kind,salt,hex]=stored.split("$");if(kind!=="scrypt"||!/^[a-f0-9]{32}$/.test(salt||"")||!/^[a-f0-9]{128}$/.test(hex||""))return false;const hash=await scrypt(password,salt);return timingSafeEqual(hash,Buffer.from(hex,"hex"))}
export function tokenHash(token:string){return createHash("sha256").update(token).digest("hex")}
export function validEmail(value:unknown):value is string{return typeof value==="string"&&value.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)&&!/[\r\n]/.test(value)}
