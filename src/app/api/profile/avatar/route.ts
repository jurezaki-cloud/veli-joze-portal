import sharp from "sharp";
import {NextResponse} from "next/server";
import {getSessionUser} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {requireSameOrigin} from "@/lib/api-security";
import {rateLimit} from "@/lib/rate-limit";
const MAX=2*1024*1024;
const json=(message:string,status=200)=>NextResponse.json({ok:status===200,message},{status,headers:{"cache-control":"private, no-store"}});
export async function POST(req:Request){const origin=requireSameOrigin(req);if(origin)return origin;const user=await getSessionUser(req);if(!user)return json("Za spremembo fotografije se prijavi.",401);const limited=await rateLimit(req,"avatar",10,60000);if(limited)return limited;if(Number(req.headers.get("content-length")||0)>MAX)return json("Fotografija je lahko velika največ 2 MB.",413);
 const reader=req.body?.getReader();if(!reader)return json("Izberi fotografijo.",400);const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX){await reader.cancel();return json("Fotografija je lahko velika največ 2 MB.",413)}chunks.push(value)}}catch{return json("Prenos fotografije ni uspel.",400)}
 let image:Buffer;try{const input=sharp(Buffer.concat(chunks),{limitInputPixels:40_000_000,animated:false}),meta=await input.metadata();if(!meta.format||!["jpeg","png","webp"].includes(meta.format)||(meta.pages??1)>1)return json("Izberi fotografijo JPG, PNG ali WebP.",415);image=await input.rotate().resize(512,512,{fit:"cover",position:"centre"}).webp({quality:85}).toBuffer()}catch{return json("Fotografije ni mogoče obdelati. Izberi JPG, PNG ali WebP.",415)}
 try{const r=await getDatabase().query("update members set avatar=$1,avatar_updated_at=now() where id=$2 returning id",[image,user.id]);return r.rows.length?json("Profilna fotografija je shranjena."):json("Profil ne obstaja.",404)}catch{return json("Fotografije trenutno ni mogoče shraniti.",503)}}
export async function DELETE(req:Request){const origin=requireSameOrigin(req);if(origin)return origin;const user=await getSessionUser(req);if(!user)return json("Za odstranitev fotografije se prijavi.",401);try{await getDatabase().query("update members set avatar=null,avatar_updated_at=null where id=$1",[user.id]);return json("Profilna fotografija je odstranjena.")}catch{return json("Fotografije ni mogoče odstraniti.",503)}}
