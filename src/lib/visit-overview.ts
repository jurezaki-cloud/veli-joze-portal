import {getDatabase} from "./database";
import {isPastAnnouncement} from "./announcement-status";
export type VisitWindow={since:string;asOf:string;firstVisit:boolean};
export async function visitWindow(memberId:string):Promise<VisitWindow>{
 const r=await getDatabase().query<{last_seen_at:Date|string|null}>("select last_seen_at from member_visits where member_id=$1",[memberId]);
 const seen=r.rows[0]?.last_seen_at;
 return {since:new Date(seen||Date.now()-30*864e5).toISOString(),asOf:new Date().toISOString(),firstVisit:!seen};
}
export async function visitOverview(id:string,window:VisitWindow){
 const db=getDatabase(),params=[id,window.since,window.asOf];
 const [counts,notices]=await Promise.all([
 db.query<{label:string;count:number;href:string}>(`select 'Pomoč med sosedi' label,count(*)::int count,'/pomoc-sosedov' href from community_posts p join members m on m.id=p.author_id where p.board='help' and p.status!='archived' and m.approved=true and p.created_at>$2::timestamptz and p.created_at<=$3::timestamptz
 union all select 'Izgubljeno / najdeno',count(*)::int,'/izgubljeno-najdeno' from community_posts p join members m on m.id=p.author_id where p.board='lost-found' and p.status!='archived' and m.approved=true and p.created_at>$2 and p.created_at<=$3
 union all select 'Odgovori',count(*)::int,'/moj-portal' from community_replies r join community_posts p on p.id=r.post_id join members m on m.id=p.author_id join members rm on rm.id=r.author_id where p.status!='archived' and m.approved=true and rm.approved=true and r.author_id<>$1 and (p.author_id=$1 or exists(select 1 from community_follows f where f.member_id=$1 and f.post_id=p.id)) and r.created_at>$2 and r.created_at<=$3
 union all select 'Dogodki',count(*)::int,'/dogodki' from events where created_at>$2 and created_at<=$3 and archived_at is null and (event_date+event_time) at time zone 'Europe/Zagreb'>now()
 union all select 'Oglasi',count(*)::int,'/oglasi' from listings l join members m on m.id=l.author_id where l.created_at>$2 and l.created_at<=$3 and l.status='approved' and m.approved=true
 union all select 'Sporočila',count(*)::int,'/sporocila' from direct_messages where recipient_id=$1 and created_at>$2 and created_at<=$3 and hidden_at is null`,params),
 db.query<{title:string;type:string}>("select title,type from announcements where archived_at is null and published_at>$1::timestamptz and published_at<=$2::timestamptz",[window.since,window.asOf])
 ]);
 return {ok:true,...window,data:[{label:"Obvestila",count:notices.rows.filter(x=>!isPastAnnouncement(x)).length,href:"/obvestila"},...counts.rows]};
}
