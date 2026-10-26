import {notifyMember} from "@/lib/email-outbox";
import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {requireRole} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {readJson,requireSameOrigin} from "@/lib/api-security";
import {rateLimit} from "@/lib/rate-limit";
import {validZone} from "@/lib/zones";
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"cache-control":"private, no-store"}});
const uuid=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export async function GET(req:Request){const auth=await requireRole(req,["admin","moderator"]);if(auth.response)return auth.response;
 try{const db=getDatabase(),id=new URL(req.url).searchParams.get("id");if(id&&!uuid(id))return json({ok:false,message:"Neveljaven član."},400);
 const r=await db.query<Record<string,unknown>>(`select m.id,m.email,m.display_name,m.nickname,m.first_name,m.last_name,m.profile_nickname,m.display_mode,m.custom_name,m.bio,m.zone,m.legacy_zone,m.parcel_private,m.show_zone,m.notifications,m.role,m.approved,m.avatar_updated_at,m.blocked_until,m.blocked_permanent,m.block_reason,m.created_at,m.rules_accepted_at,m.rules_version,(c.member_id is not null) as has_password,c.email_verified_at from members m left join member_credentials c on c.member_id=m.id ${id?"where m.id=$1":""} order by m.created_at desc`,id?[id]:[]);
 if(id&&!r.rows.length)return json({ok:false,message:"Član ne obstaja."},404);
 const history=id?await db.query("select a.id,a.action,a.reason,a.created_at,m.nickname as actor_name from member_actions a left join members m on m.id=a.actor_id where a.member_id=$1 order by a.created_at desc limit 100",[id]):{rows:[]};
 return json({ok:true,data:id?r.rows[0]:r.rows,history:history.rows,actorRole:auth.user!.role,actorId:auth.user!.id});
 }catch{return json({ok:false,message:"Članov trenutno ni mogoče naložiti."},503)}}
export async function PATCH(req:Request){const origin=requireSameOrigin(req);if(origin)return origin;const auth=await requireRole(req,["admin","moderator"]);if(auth.response)return auth.response;
 try{const limited=await rateLimit(req,"member-settings",30,60000);if(limited)return limited;const parsed=await readJson(req);if(!parsed.ok)return parsed.response;const b=parsed.body,id=String(b.id||""),action=String(b.action||"");if(!uuid(id))return json({ok:false,message:"Neveljaven član."},400);
 const db=getDatabase(),r=await db.query<Record<string,unknown>>("select id,role from members where id=$1",[id]),target=r.rows[0];if(!target)return json({ok:false,message:"Član ne obstaja."},404);
 const actor=auth.user!;if(actor.role==="moderator"&&target.role!=="member")return json({ok:false,message:"Nastavitve osebja ureja administrator."},403);
 if(id===actor.id&&["block","reject","role"].includes(action))return json({ok:false,message:"Lastnega dostopa ali vloge tukaj ne moreš odstraniti."},400);
 const reason=typeof b.reason==="string"?b.reason.trim():"";if(reason.length>1000)return json({ok:false,message:"Razlog je predolg."},400);
 let set="",recordReason=reason;const params:unknown[]=[id];
 if(action==="edit"){
  const text=(key:string,max:number)=>{if(typeof b[key]!=="string"||b[key].trim().length>max)throw new Error("validation");return b[key].trim()};
  let first,last,nick,mode,custom,bio,parcel;try{first=text("firstName",60);last=text("lastName",60);nick=text("nickname",60);mode=text("displayMode",20);custom=text("customName",80);bio=text("bio",300);parcel=text("parcel",80)}catch{return json({ok:false,message:"Preveri obliko in dolžino podatkov."},400)}
  if(!first||!nick||!parcel||!["nickname","first_name","first_last","custom"].includes(mode)||(mode==="first_last"&&!last)||(mode==="custom"&&!custom)||(b.zone!==""&&!validZone(b.zone))||typeof b.showZone!=="boolean"||typeof b.notifications!=="boolean")return json({ok:false,message:"Izpolni zahtevane podatke in izberi veljavno cono ter javni prikaz."},400);
  const name=mode==="first_name"?first:mode==="first_last"?`${first} ${last}`:mode==="custom"?custom:nick;
  params.push(first,last,nick,mode,custom,bio,name,b.zone||null,parcel,b.showZone,b.notifications);
  set="first_name=$2,last_name=$3,profile_nickname=$4,display_mode=$5,custom_name=$6,bio=$7,display_name=$8,nickname=$8,zone=$9,parcel_private=$10,show_zone=$11,notifications=$12";recordReason="Posodobljene nastavitve profila.";
 }else if(action==="warning"){
  if(!reason)return json({ok:false,message:"Vnesi besedilo opomina."},400);set="id=id";
 }else if(action==="block"){
  if(!reason||!["1","3","7","30","permanent"].includes(String(b.duration)))return json({ok:false,message:"Izberi trajanje in vnesi razlog blokade."},400);
  params.push(b.duration==="permanent",b.duration==="permanent"?null:new Date(Date.now()+Number(b.duration)*86400000),reason);set="blocked_permanent=$2,blocked_until=$3,block_reason=$4,session_version=session_version+1";recordReason=`${b.duration==="permanent"?"Trajna blokada":`Blokada za ${b.duration} dni`}: ${reason}`;
 }else if(action==="unblock"){if(!reason)return json({ok:false,message:"Vnesi razlog odstranitve blokade."},400);set="blocked_permanent=false,blocked_until=null,block_reason=''";
 }else if(action==="role"){
  if(actor.role!=="admin")return json({ok:false,message:"Vloge spreminja samo administrator."},403);if(!["member","moderator","admin"].includes(b.role))return json({ok:false,message:"Neveljavna vloga."},400);params.push(b.role);set="role=$2";recordReason=`Nova vloga: ${b.role}`;
 }else if(action==="approve"){set="approved=true";recordReason="Članstvo odobreno.";
 }else if(action==="reject"){if(!reason)return json({ok:false,message:"Vnesi razlog zavrnitve članstva."},400);set="approved=false,session_version=session_version+1";
 }else if(action==="photo"){set="avatar=null,avatar_updated_at=now()";recordReason=reason||"Odstranjena profilna fotografija.";
 }else return json({ok:false,message:"Neveljavna akcija."},400);
 const actorIndex=params.push(actor.id),auditIndex=params.push(randomUUID()),actionIndex=params.push(action),reasonIndex=params.push(recordReason);
 const update=await db.query<{id:string}>(`with changed as (update members set ${set} where id=$1 ${actor.role==="moderator"?"and role='member'":""} ${action==="approve"?"and approved=false and not exists(select 1 from member_credentials c where c.member_id=members.id and c.email_verified_at is null)":""} returning id), audit as (insert into member_actions(id,member_id,actor_id,action,reason) select $${auditIndex},id,$${actorIndex},$${actionIndex},$${reasonIndex} from changed) select id from changed`,params);
 if(!update.rows.length)return json({ok:false,message:"Sprememba ni dovoljena ali e-pošta še ni potrjena. Osveži seznam."},409);
 await notifyMember(id,action,String(params[auditIndex-1]));
 return json({ok:true,message:action==="warning"?"Opomin je shranjen in viden članu v njegovem profilu.":"Sprememba je shranjena."});
 }catch{return json({ok:false,message:"Spremembe trenutno ni mogoče shraniti."},503)}}
