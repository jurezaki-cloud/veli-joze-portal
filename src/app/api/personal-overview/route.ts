import {requireMember} from '@/lib/auth-guard';
import {getDatabase} from '@/lib/database';
import {privateJson} from '@/lib/community-security';
import {isPastAnnouncement} from '@/lib/announcement-status';
export async function GET(req:Request){const a=await requireMember(req);if(a.response)return a.response;try{const db=getDatabase(),id=a.user!.id;const [m,n,e]=await Promise.all([
 db.query<{count:number}>("select count(*)::int count from direct_messages where recipient_id=$1 and read_at is null and hidden_at is null",[id]),
 db.query<{id:string;title:string;type:string}>("select id,title,type from announcements where archived_at is null order by published_at desc limit 100"),
 db.query("select e.id,e.title,e.event_date::text as event_date,e.event_time,e.location,exists(select 1 from event_rsvps r where r.event_id=e.id and r.member_id=$1) going from events e where archived_at is null and (event_date+event_time) at time zone 'Europe/Zagreb'>now() order by event_date,event_time limit 1",[id])
 ]);return privateJson({ok:true,unread:m.rows[0]?.count||0,announcements:n.rows.filter(x=>!isPastAnnouncement(x)).slice(0,3),event:e.rows[0]||null})}catch{return privateJson({ok:false,message:'Osebnega pregleda trenutno ni mogoče naložiti.'},503)}}
