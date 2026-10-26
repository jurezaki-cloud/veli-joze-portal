import {messageRequestId} from "@/lib/message-request-id";
import {requireMember} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {requireSameOrigin} from "@/lib/api-security";
import {privateJson,validId} from "@/lib/community-security";
import {photoType,readMessagePhoto} from "@/lib/message-photo";
import {rateLimit} from "@/lib/rate-limit";
export async function GET(req:Request){const a=await requireMember(req);if(a.response)return a.response;const id=new URL(req.url).searchParams.get("id");if(!validId(id))return new Response(null,{status:404});try{const r=await getDatabase().query<{image:Buffer}>("select image from chat_messages where id=$1 and deleted_at is null and image is not null",[id]);const bytes=r.rows[0]?.image;const type=bytes&&photoType(bytes);return bytes&&type?new Response(new Uint8Array(bytes),{headers:{"content-type":type,"cache-control":"private, no-store","X-Content-Type-Options":"nosniff"}}):new Response(null,{status:404})}catch{return privateJson({ok:false,message:"Fotografije trenutno ni mogoče naložiti."},503)}}
export async function POST(req:Request){const o=requireSameOrigin(req);if(o)return o;const a=await requireMember(req);if(a.response)return a.response;try{const limited=await rateLimit(req,`photo-chat-${a.user!.id}`,10,60000);if(limited)return limited;const length=Number(req.headers.get("content-length")||0);if(length>6*1024*1024)return privateJson({ok:false,message:"Fotografija je prevelika."},413);const f=await req.formData(),target=String(f.get("room")||"");if(!["general","social","help","market","lost-found"].includes(target))return privateJson({ok:false,message:"Izberi sobo klepeta."},400);
const id=messageRequestId(a.user!.id,"chat-photo",f.has("clientRequestId")?f.get("clientRequestId"):undefined);if(!id)return privateJson({ok:false,message:"Neveljaven ključ pošiljanja fotografije."},400);
let bytes;try{bytes=await readMessagePhoto(f.get("photo"))}catch(e){return privateJson({ok:false,message:e instanceof Error?e.message:"Neveljavna fotografija."},400)}
const r=await getDatabase().query("insert into chat_messages(id,author_id,room,body,image) values($1,$2,$3,'Fotografija',$4) on conflict(id) do nothing returning id",[id,a.user!.id,target,bytes]);if(r.rows.length)return privateJson({ok:true,message:"Fotografija je poslana.",data:r.rows[0]},201);
const previous=await getDatabase().query<{id:string;author_id:string;room:string;image:Buffer;deleted_at:Date|null}>("select id,author_id,room,image,deleted_at from chat_messages where id=$1",[id]);const old=previous.rows[0];
if(!old)return privateJson({ok:false,message:"Fotografije temu članu trenutno ne moreš poslati."},403);
if(old.author_id!==a.user!.id||old.room!==target||old.deleted_at||!old.image||!Buffer.from(old.image).equals(bytes))return privateJson({ok:false,message:"Ključ je že uporabljen za drugo ali odstranjeno fotografijo. Izberi fotografijo znova."},409);
return privateJson({ok:true,message:"Fotografija je že shranjena.",data:{id:old.id}},200)}catch{return privateJson({ok:false,message:"Fotografija ni bila poslana. Izbira ostane v obrazcu; poskusi ponovno."},503)}}
