import {isPastAnnouncement} from "./announcement-status";
import {getDatabase} from "./database";
export type HomeData={announcements:{id:string;title:string;type:string;published_at:string}[];events:{id:string;title:string;event_date:string;event_time:string;location:string;cover_photo_id:string|null}[];members:number;eventsCount:number;announcementsCount:number;unreadCount:number};
export async function loadHome(memberId?:string):Promise<HomeData|null>{
 try{
  const db=getDatabase();
  const [a,e,c]=await Promise.all([
   db.query<{id:string;title:string;type:string;published_at:Date|string}>("select id,title,type,published_at from announcements where archived_at is null order by published_at desc limit 100"),
   db.query<{id:string;title:string;event_date:Date|string;event_time:string;location:string;cover_photo_id:string|null}>("select id,title,event_date::text as event_date,event_time,location,case when exists(select 1 from gallery_photos g where g.id=events.cover_photo_id and g.status='approved') then cover_photo_id else null end as cover_photo_id from events where archived_at is null and (event_date+event_time) at time zone 'Europe/Zagreb'>now() order by event_date,event_time limit 3"),
   db.query<{members:number;events_count:number;announcements_count:number;unread_count:number}>("select (select count(*)::int from members where approved=true) members, (select count(*)::int from events where archived_at is null and (event_date+event_time) at time zone 'Europe/Zagreb'>now()) events_count, (select count(*)::int from announcements where archived_at is null) announcements_count, (select count(*)::int from announcements a where archived_at is null and $1::uuid is not null and not exists(select 1 from announcement_reads r where r.announcement_id=a.id and r.member_id=$1::uuid)) unread_count",[memberId||null])
  ]);
  return {announcements:a.rows.filter(x=>!isPastAnnouncement(x)).slice(0,3).map(x=>({...x,published_at:new Date(x.published_at).toISOString()})),events:e.rows.map(x=>({...x,event_date:typeof x.event_date==='string'?x.event_date.slice(0,10):[x.event_date.getFullYear(),String(x.event_date.getMonth()+1).padStart(2,'0'),String(x.event_date.getDate()).padStart(2,'0')].join('-')})),members:c.rows[0].members,eventsCount:c.rows[0].events_count,announcementsCount:c.rows[0].announcements_count,unreadCount:c.rows[0].unread_count};
 }catch{return null}
}
