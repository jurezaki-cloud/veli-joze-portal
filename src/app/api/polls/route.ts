import {randomUUID} from "node:crypto";
import {requireMember,requireRole} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {privateJson,validId} from "@/lib/community-security";
import {readJson,requireSameOrigin} from "@/lib/api-security";
import {rateLimit} from "@/lib/rate-limit";
export async function GET(req:Request){const a=await requireMember(req);if(a.response)return a.response;try{
 const closed=new URL(req.url).searchParams.get("closed")==="1";
 const r=await getDatabase().query(`select p.id,p.question,p.created_at,p.closed_at,(select v.option_id from community_poll_votes v where v.poll_id=p.id and v.member_id=$1) voted_option,(select count(*)::int from community_poll_votes v where v.poll_id=p.id) total, (select jsonb_agg(jsonb_build_object('id',o.value->>'id','label',o.value->>'label','votes',(select count(*)::int from community_poll_votes v where v.poll_id=p.id and v.option_id::text=o.value->>'id')) order by o.ordinality) from jsonb_array_elements(p.options) with ordinality as o(value,ordinality)) options from community_polls p where p.closed_at is ${closed?"not null":"null"} order by p.created_at desc limit 30`,[a.user!.id]);
 return privateJson({ok:true,data:r.rows,canManage:["admin","moderator"].includes(a.user!.role)});
 }catch{return privateJson({ok:false,message:"Anket trenutno ni mogoče naložiti."},503)}}
export async function POST(req:Request){const origin=requireSameOrigin(req);if(origin)return origin;const a=await requireRole(req,["admin","moderator"]);if(a.response)return a.response;
 const p=await readJson(req);if(!p.ok)return p.response;
 const question=typeof p.body.question==="string"?p.body.question.trim():"",choices=p.body.options;
 if(question.length<4||question.length>160||!Array.isArray(choices)||choices.length<2||choices.length>6||choices.some((x:unknown)=>typeof x!=="string"||x.trim().length<1||x.trim().length>100))return privateJson({ok:false,message:"Dodaj vprašanje (4–160 znakov) in 2 do 6 odgovorov (do 100 znakov)."},400);
 const labels:string[]=choices.map((x:string)=>x.trim());if(new Set(labels.map(x=>x.toLocaleLowerCase("sl-SI"))).size!==labels.length)return privateJson({ok:false,message:"Odgovori se ne smejo ponavljati."},400);
 try{const limited=await rateLimit(req,`poll-create-${a.user!.id}`,10,3600000);if(limited)return limited;const r=await getDatabase().query<{id:string}>("insert into community_polls(id,author_id,question,options) values($1,$2,$3,$4::jsonb) returning id",[randomUUID(),a.user!.id,question,JSON.stringify(labels.map(label=>({id:randomUUID(),label})))]);return privateJson({ok:true,message:"Anketa je objavljena.",id:r.rows[0].id},201)}catch{return privateJson({ok:false,message:"Ankete trenutno ni mogoče shraniti."},503)}}
export async function PATCH(req:Request){const origin=requireSameOrigin(req);if(origin)return origin;const a=await requireMember(req);if(a.response)return a.response;const p=await readJson(req);if(!p.ok)return p.response;
 if(!validId(p.body.id))return privateJson({ok:false,message:"Neveljavna anketa."},400);
 try{const limited=await rateLimit(req,`poll-action-${a.user!.id}`,30,60000);if(limited)return limited;
 if(p.body.action==="close"){
  if(!["admin","moderator"].includes(a.user!.role))return privateJson({ok:false,message:"Anketo lahko zaključi moderator."},403);
  const r=await getDatabase().query("update community_polls set closed_at=now() where id=$1 and closed_at is null returning id",[p.body.id]);return r.rows.length?privateJson({ok:true,message:"Anketa je zaključena. Rezultati ostanejo shranjeni."}):privateJson({ok:false,message:"Anketa je že zaključena ali ne obstaja."},409);
 }
 if(p.body.action!=="vote"||!validId(p.body.option))return privateJson({ok:false,message:"Izberi veljaven odgovor."},400);
 const r=await getDatabase().query(`with eligible as (select id,options from community_polls where id=$1 and closed_at is null for update), voted as (insert into community_poll_votes(poll_id,member_id,option_id) select id,$2::uuid,$3::uuid from eligible where exists(select 1 from jsonb_array_elements(options) o where o->>'id'=$3::text) on conflict(poll_id,member_id) do update set option_id=excluded.option_id returning poll_id) select poll_id from voted`,[p.body.id,a.user!.id,p.body.option]);
 return r.rows.length?privateJson({ok:true,message:"Tvoj glas je shranjen."}):privateJson({ok:false,message:"Anketa je zaključena ali izbrani odgovor ne pripada tej anketi."},409);
 }catch{return privateJson({ok:false,message:"Spremembe trenutno ni mogoče shraniti. Osveži anketo pred ponovnim poskusom."},503)}}
