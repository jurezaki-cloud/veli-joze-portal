import {readMessageCursor,messageCursor} from "@/lib/message-cursor";
import {messageRequestId} from "@/lib/message-request-id";
import {rateLimit} from "@/lib/rate-limit";
import {requireMember,requireRole} from "@/lib/auth-guard";
import {cleanText,readJson,requireSameOrigin} from "@/lib/api-security";
import {privateJson,validId} from "@/lib/community-security";
import {getDatabase} from "@/lib/database";
import {randomUUID} from "node:crypto";
import type {ChatRoom} from "@/lib/domain";
const rooms=new Set<ChatRoom>(["general","social","help","market","lost-found"]);
type Row={id:string;room:string;body:string;created_at:Date|string;display_name:string;nickname:string|null;author_id:string;has_photo:boolean;cursor_time?:string};
const message=(x:Row,userId:string)=>({id:x.id,room:x.room,body:x.body,createdAt:x.cursor_time||new Date(x.created_at).toISOString(),author:x.nickname||x.display_name,mine:x.author_id===userId,hasPhoto:x.has_photo});
export async function GET(req:Request){
 const auth=await requireMember(req);if(auth.response)return auth.response;
 const params=new URL(req.url).searchParams;
 const room=cleanText(params.get("room"),32) as ChatRoom,cursor=readMessageCursor(params.get("before"));
 if(cursor===false)return privateJson({ok:false,message:"Neveljavno nadaljevanje zgodovine."},400);
 if(!rooms.has(room))return privateJson({ok:false,message:"Neveljavna soba."},400);
 try{const r=await getDatabase().query<Row>("select c.id,c.room,c.body,c.created_at,to_char(c.created_at at time zone 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') cursor_time,m.display_name,m.nickname,c.author_id,(c.image is not null) has_photo from chat_messages c join members m on m.id=c.author_id where c.room=$1 and c.deleted_at is null and ($2::timestamptz is null or (c.created_at,c.id)<($2::timestamptz,$3::uuid)) order by c.created_at desc,c.id desc limit 101",[room,cursor?.time||null,cursor?.id||null]);const rows=r.rows.slice(0,100),hasMore=r.rows.length>100,nextCursor=hasMore?messageCursor(rows[rows.length-1]):null;return privateJson({ok:true,ownId:auth.user!.id,canModerate:["moderator","admin"].includes(auth.user!.role),hasMore,nextCursor,data:rows.reverse().map(x=>message(x,auth.user!.id))})}
 catch{return privateJson({ok:false,message:"Sporočil ni mogoče naložiti. Poskusi znova; če napaka ostane, naj skrbnik preveri bazo klepeta."},503)}
}
export async function POST(req:Request){
 const oe=requireSameOrigin(req);if(oe)return oe;const auth=await requireMember(req);if(auth.response)return auth.response;
 const p=await readJson(req,4096);if(!p.ok)return p.response;
 const room=cleanText(p.body.room,32) as ChatRoom,body=cleanText(p.body.body,501);
 if(!rooms.has(room)||!body||body.length>500)return privateJson({ok:false,message:"Izberi veljavno sobo in napiši sporočilo do 500 znakov."},400);
 const id=messageRequestId(auth.user!.id,"chat",p.body.clientRequestId);if(!id)return privateJson({ok:false,message:"Neveljaven ključ pošiljanja."},400);
 try{const limited=await rateLimit(req,`chat-${auth.user!.id}`,30,60000);if(limited)return limited;
  const r=await getDatabase().query<Row>(`with added as (insert into chat_messages(id,room,author_id,body) values($1,$2,$3,$4) on conflict(id) do nothing returning id,room,author_id,body,created_at) select c.*,m.display_name,m.nickname from added c join members m on m.id=c.author_id`,[id,room,auth.user!.id,body]);
  if(!r.rows.length){const previous=await getDatabase().query<Row & {deleted_at:Date|null}>("select c.*,m.display_name,m.nickname,(c.image is not null) has_photo from chat_messages c join members m on m.id=c.author_id where c.id=$1",[id]);const old=previous.rows[0];if(!old||old.author_id!==auth.user!.id||old.room!==room||old.body!==body||old.deleted_at||old.has_photo)return privateJson({ok:false,message:"Ključ je že uporabljen za drugo ali odstranjeno sporočilo. Osveži pogovor."},409);return privateJson({ok:true,message:"Sporočilo je že shranjeno.",data:message(old,auth.user!.id)},200);}
  return privateJson({ok:true,message:"Sporočilo je shranjeno in objavljeno.",data:message(r.rows[0],auth.user!.id)},201)
 }catch{return privateJson({ok:false,message:"Sporočila ni mogoče shraniti. Besedilo ostane v obrazcu; poskusi znova."},503)}
}
export async function DELETE(req:Request){
 const oe=requireSameOrigin(req);if(oe)return oe;const auth=await requireRole(req,["moderator","admin"]);if(auth.response)return auth.response;
 const p=await readJson(req);if(!p.ok)return p.response;
 if(!validId(p.body.id))return privateJson({ok:false,message:"Neveljavno sporočilo."},400);
 try{const limited=await rateLimit(req,`chat-delete-${auth.user!.id}`,30,60000);if(limited)return limited;
  const r=await getDatabase().query(`with removed as (update chat_messages set deleted_at=now() where id=$1 and deleted_at is null returning id),audit as (insert into moderation_actions(id,moderator_id,target_type,target_id,action) select $2,$3,'message',id,'delete' from removed) select id from removed`,[p.body.id,randomUUID(),auth.user!.id]);
  return r.rows.length?privateJson({ok:true,message:"Sporočilo je odstranjeno."}):privateJson({ok:false,message:"Sporočilo ne obstaja."},404)
 }catch{return privateJson({ok:false,message:"Sporočila ni mogoče odstraniti."},503)}
}
