import {getDatabase} from "./database";
export type PublicEvent={id:string;title:string;event_date:string;event_time:string;location:string;description:string;archived_at:string|null;cover_photo_id:string|null};
export type PublicAnnouncement={id:string;title:string;type:string;content:string;published_at:string};
export async function publicEvents():Promise<PublicEvent[]>{const result=await getDatabase().query<PublicEvent>(`select id,title,event_date::text as event_date,event_time::text as event_time,location,description,archived_at,case when exists(select 1 from gallery_photos g where g.id=events.cover_photo_id and g.status='approved') then cover_photo_id else null end as cover_photo_id from events where archived_at is null and (event_date+event_time) at time zone 'Europe/Zagreb'>now() order by event_date,event_time limit 100`);return result.rows;}
export async function publicAnnouncements():Promise<PublicAnnouncement[]>{const result=await getDatabase().query<PublicAnnouncement & {published_at:string|Date}>("select id,title,type,content,published_at from announcements where archived_at is null order by published_at desc limit 100");return result.rows.map(row=>({...row,published_at:new Date(row.published_at).toISOString()}));}

export type PublicPhoto={id:string;title:string;width:number;height:number;created_at:string};
export async function publicGalleryPhotos():Promise<PublicPhoto[]>{
 const result=await getDatabase().query<PublicPhoto & {created_at:string|Date}>("select id,title,width,height,created_at from gallery_photos where status='approved' order by created_at desc limit 100");
 return result.rows.map(row=>({...row,created_at:new Date(row.created_at).toISOString()}));
}
const publicId=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function publicEvent(id:string):Promise<PublicEvent|null>{
 if(!publicId.test(id))return null;
 const result=await getDatabase().query<PublicEvent>(`select id,title,event_date::text as event_date,event_time::text as event_time,location,description,archived_at,case when exists(select 1 from gallery_photos g where g.id=events.cover_photo_id and g.status='approved') then cover_photo_id else null end as cover_photo_id from events where id=$1 and archived_at is null and (event_date+event_time) at time zone 'Europe/Zagreb'>now()`,[id]);
 return result.rows[0]||null;
}
export async function publicAnnouncement(id:string):Promise<PublicAnnouncement|null>{
 if(!publicId.test(id))return null;
 const result=await getDatabase().query<PublicAnnouncement & {published_at:string|Date}>("select id,title,type,content,published_at from announcements where id=$1 and archived_at is null",[id]);
 const row=result.rows[0];return row?{...row,published_at:new Date(row.published_at).toISOString()}:null;
}
