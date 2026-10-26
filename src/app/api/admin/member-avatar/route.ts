import {randomUUID} from "node:crypto";
import sharp from "sharp";
import {NextResponse} from "next/server";
import {requireRole} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {requireSameOrigin} from "@/lib/api-security";
import {rateLimit} from "@/lib/rate-limit";
const MAX=2*1024*1024;
const json=(message:string,status=200)=>NextResponse.json({ok:status===200,message},{status,headers:{"cache-control":"private, no-store"}});
export async function POST(req:Request){const origin=requireSameOrigin(req);if(origin)return origin;const auth=await requireRole(req,["admin","moderator"]);if(auth.response)return auth.response;const user=auth.user!,id=new URL(req.url).searchParams.get("id")||"";if(!/^[0-9a-f-]{36}$/i.test(id))return json("Neveljaven član.",400);const target=await getDatabase().query<{role:string}>("select role from members where id=$1",[id]);if(!target.rows.length)return json("Član ne obstaja.",404);if(user.role==="moderator"&&target.rows[0].role!=="member")return json("Fotografijo osebja ureja administrator.",403);const limited=await rateLimit(req,"admin-avatar",10,60000);if(limited)return limited;if(Number(req.headers.get("content-length")||0)>MAX)return json("Fotografija je lahko velika največ 2 MB.",413);
 const reader=req.body?.getReader();if(!reader)return json("Izberi fotografijo.",400);const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX){await reader.cancel();return json("Fotografija je lahko velika največ 2 MB.",413)}chunks.push(value)}}catch{return json("Prenos fotografije ni uspel.",400)}
 let image:Buffer;try{const input=sharp(Buffer.concat(chunks),{limitInputPixels:40_000_000,animated:false}),meta=await input.metadata();if(!meta.format||!["jpeg","png","webp"].includes(meta.format)||(meta.pages??1)>1)return json("Izberi fotografijo JPG, PNG ali WebP.",415);image=await input.rotate().resize(512,512,{fit:"cover",position:"centre"}).webp({quality:85}).toBuffer()}catch{return json("Fotografije ni mogoče obdelati. Izberi JPG, PNG ali WebP.",415)}
 try{const r=await getDatabase().query(`with changed as (update members set avatar=$1,avatar_updated_at=now() where id=$2 ${user.role==="moderator"?"and role='member'":""} returning id), audit as (insert into member_actions(id,member_id,actor_id,action,reason) select $3,id,$4,'photo','Posodobljena profilna fotografija.' from changed) select id from changed`,[image,id,randomUUID(),user.id]);return r.rows.length?json("Profilna fotografija je shranjena."):json("Profil ne obstaja.",404)}catch{return json("Fotografije trenutno ni mogoče shraniti.",503)}}
