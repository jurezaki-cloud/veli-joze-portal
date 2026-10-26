import { requireMember } from "@/lib/auth-guard";
import { getDatabase } from "@/lib/database";
import { readJson, requireSameOrigin } from "@/lib/api-security";
import { privateJson, validId } from "@/lib/community-security";
import { rateLimit } from "@/lib/rate-limit";
export async function GET(req: Request) {
 const auth=await requireMember(req);if(auth.response)return auth.response;
 try{const db=getDatabase(),url=new URL(req.url),eventId=url.searchParams.get("event");
  if(eventId!==null){if(!validId(eventId))return privateJson({ok:false,message:"Neveljaven dogodek."},400);
   const event=await db.query("select id from events where id=$1 and archived_at is null and (event_date+event_time) at time zone 'Europe/Zagreb'>now()",[eventId]);if(!event.rows.length)return privateJson({ok:false,message:"Dogodek je že potekel ali ni več na voljo."},404);
   const r=await db.query<{id:string;name:string}>(`select m.id,coalesce(nullif(m.nickname,''),m.display_name) as name from event_rsvps r join members m on m.id=r.member_id where r.event_id=$1 and m.approved=true order by name,m.id`,[eventId]);return privateJson({ok:true,data:r.rows})}

  const r=await db.query<{id:string;going_count:number;going:boolean}>(`select e.id,(select count(*)::int from event_rsvps r join members m on m.id=r.member_id where r.event_id=e.id and m.approved=true) going_count,exists(select 1 from event_rsvps where event_id=e.id and member_id=$1) going from events e where e.archived_at is null and (e.event_date+e.event_time) at time zone 'Europe/Zagreb'>now()`,[auth.user!.id]);return privateJson({ok:true,data:r.rows})
 }catch{return privateJson({ok:false,message:"Prijav na dogodke ni mogoče naložiti."},503)}
}
export async function POST(req:Request){const origin=requireSameOrigin(req);if(origin)return origin;const auth=await requireMember(req);if(auth.response)return auth.response;const p=await readJson(req);if(!p.ok)return p.response;if(!validId(p.body.id)||typeof p.body.going!=="boolean")return privateJson({ok:false,message:"Neveljavna prijava."},400);try{const limited=await rateLimit(req,`rsvp-${auth.user!.id}`,30,60000);if(limited)return limited;if(!p.body.going){await getDatabase().query("delete from event_rsvps where event_id=$1 and member_id=$2",[p.body.id,auth.user!.id]);return privateJson({ok:true,message:"Prijava je preklicana."})}const r=await getDatabase().query(`with eligible as (select id from events where id=$1 and archived_at is null and (event_date+event_time) at time zone 'Europe/Zagreb'>now() for share),added as (insert into event_rsvps(event_id,member_id) select id,$2 from eligible on conflict do nothing) select id from eligible`,[p.body.id,auth.user!.id]);return r.rows.length?privateJson({ok:true,message:"Prijavljen si na dogodek."}):privateJson({ok:false,message:"Dogodek je že potekel ali ni več na voljo."},409)}catch{return privateJson({ok:false,message:"Prijave ni mogoče shraniti."},503)}}
