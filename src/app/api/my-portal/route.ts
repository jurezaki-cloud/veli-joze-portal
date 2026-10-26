import {requireMember} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {privateJson} from "@/lib/community-security";
import {visitWindow} from "@/lib/visit-overview";
import type {PortalEvent,PortalListing,PortalPost} from "@/lib/my-portal-types";
export async function GET(req:Request){
 const auth=await requireMember(req);if(auth.response)return auth.response;
 try{const id=auth.user!.id,db=getDatabase(),window=await visitWindow(id);
 const postsSelect=`select p.id,p.title,p.board,p.status,(select count(*)::int from community_replies r join members rm on rm.id=r.author_id where r.post_id=p.id and rm.approved=true) reply_count,(select count(*)::int from community_replies r join members rm on rm.id=r.author_id where r.post_id=p.id and rm.approved=true and r.author_id!=$1 and r.created_at>$2::timestamptz and r.created_at<=$3::timestamptz) new_replies,count(*) over()::int total from community_posts p`;
 const activity="greatest(p.updated_at,coalesce((select max(r.created_at) from community_replies r join members rm on rm.id=r.author_id where r.post_id=p.id and rm.approved=true),p.updated_at))";
 const [events,favorites,listings,posts,followed,messages]=await Promise.all([
 db.query<PortalEvent>(`select e.id,e.title,e.event_date::text as event_date,e.event_time,e.location,count(*) over()::int total from events e join event_rsvps r on r.event_id=e.id where r.member_id=$1 and e.archived_at is null and (e.event_date+e.event_time) at time zone 'Europe/Zagreb'>now() order by e.event_date,e.event_time,e.id limit 20`,[id]),
 db.query<PortalListing>(`select l.id,l.title,l.price,l.category,l.sale_status,l.status,count(*) over()::int total from listings l join listing_favorites f on f.listing_id=l.id join members m on m.id=l.author_id where f.member_id=$1 and l.status='approved' and m.approved=true order by f.created_at desc,l.id limit 20`,[id]),
 db.query<PortalListing>("select id,title,price,category,sale_status,status,count(*) over()::int total from listings where author_id=$1 order by created_at desc,id limit 20",[id]),
 db.query<PortalPost>(`${postsSelect} where p.author_id=$1 and p.status!='archived' order by ${activity} desc,p.id limit 20`,[id,window.since,window.asOf]),
 db.query<PortalPost>(`${postsSelect} join community_follows f on f.post_id=p.id join members m on m.id=p.author_id where f.member_id=$1 and p.status!='archived' and m.approved=true order by greatest(f.created_at,${activity}) desc,p.id limit 20`,[id,window.since,window.asOf]),
 db.query<{unread:number}>("select count(*)::int unread from direct_messages where recipient_id=$1 and read_at is null and hidden_at is null",[id])
 ]);
 return privateJson({ok:true,unread:messages.rows[0]?.unread||0,events:events.rows,favorites:favorites.rows,listings:listings.rows,posts:posts.rows,followed:followed.rows,totals:{events:events.rows[0]?.total||0,favorites:favorites.rows[0]?.total||0,listings:listings.rows[0]?.total||0,posts:posts.rows[0]?.total||0,followed:followed.rows[0]?.total||0}});
 }catch{return privateJson({ok:false,message:"Tvojega portala trenutno ni mogoče naložiti. Poskusi znova."},503)}
}
