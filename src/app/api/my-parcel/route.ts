import { requireMember } from "@/lib/auth-guard";
import { getDatabase } from "@/lib/database";
import { privateJson } from "@/lib/community-security";
export async function GET(req:Request){const a=await requireMember(req);if(a.response)return a.response;try{const db=getDatabase(),id=a.user!.id;const [member,posts,listings,reports,events]=await Promise.all([
 db.query("select nickname,display_name,zone,parcel_private from members where id=$1",[id]),
 db.query("select id,board,title,status,created_at from community_posts where author_id=$1 and status!='archived' order by created_at desc limit 50",[id]),
 db.query("select id,title,status,created_at from listings where author_id=$1 order by created_at desc limit 50",[id]),
 db.query("select id,category,location,description,status,created_at from reports where author_id=$1 order by created_at desc limit 50",[id]),
 db.query("select e.id,e.title,e.event_date,e.event_time,e.location from events e join event_rsvps r on r.event_id=e.id where r.member_id=$1 and e.archived_at is null and (e.event_date+e.event_time) at time zone 'Europe/Zagreb'>now() order by e.event_date,e.event_time limit 50",[id])]);return privateJson({ok:true,data:{member:member.rows[0],posts:posts.rows,listings:listings.rows,reports:reports.rows,events:events.rows}})}catch{return privateJson({ok:false,message:"Osebnega pregleda trenutno ni mogoče naložiti."},503)}}
