import type {Member,ChatMessage,Report,ChatRoom} from "./domain";
import type {PublicMember} from "./public-member";
import {getDatabase} from "./database";
export interface PortalRepository{
 getMember(id:string):Promise<Member|null>; getMemberByEmail(email:string):Promise<Member|null>;
 createMember(input:Omit<Member,"id"|"createdAt">):Promise<Member>; listPublicMembers():Promise<PublicMember[]>;
 listMessages(room:ChatMessage["room"],limit?:number):Promise<ChatMessage[]>; createMessage(input:Omit<ChatMessage,"id"|"createdAt">):Promise<ChatMessage>;
 createReport(input:Omit<Report,"id"|"createdAt"|"status">):Promise<Report>;
}
export class BackendNotConfiguredError extends Error{constructor(){super("Production backend is not configured.")}}
type MemberRow={id:string;email:string;display_name:string;nickname:string|null;zone:string|null;parcel_private:string;role:Member["role"];approved:boolean;show_zone:boolean;notifications:boolean;created_at:Date|string};
const member=(r:MemberRow):Member=>({id:r.id,email:r.email,displayName:r.display_name,nickname:r.nickname||undefined,zone:r.zone||"",parcelPrivate:r.parcel_private,role:r.role,approved:r.approved,showZone:r.show_zone,notifications:r.notifications,createdAt:new Date(r.created_at).toISOString()});
export class PostgresPortalRepository implements PortalRepository{
 private db=getDatabase();
 async getMember(id:string){const r=await this.db.query<MemberRow>("select * from members where id=$1 limit 1",[id]);return r.rows[0]?member(r.rows[0]):null}
 async getMemberByEmail(email:string){const r=await this.db.query<MemberRow>("select * from members where lower(email)=lower($1) limit 1",[email]);return r.rows[0]?member(r.rows[0]):null}
 async createMember(input:Omit<Member,"id"|"createdAt">){const r=await this.db.query<MemberRow>("insert into members(email,display_name,nickname,zone,parcel_private,role,approved,show_zone,notifications) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",[input.email,input.displayName,input.nickname||input.displayName,input.zone||null,input.parcelPrivate,input.role,input.approved,input.showZone,input.notifications]);return member(r.rows[0])}
 async listPublicMembers(){const r=await this.db.query<{id:string;display_name:string;nickname:string|null;zone:string|null;show_zone:boolean}>("select id,display_name,nickname,zone,show_zone from members where approved=true order by display_name");return r.rows.map(x=>({id:x.id,displayName:x.display_name,...(x.nickname?{nickname:x.nickname}:{}),...(x.show_zone&&x.zone?{zone:x.zone}:{})}))}
 async listMessages(room:ChatRoom,limit=50){const safe=Math.min(Math.max(limit,1),100);const r=await this.db.query<{id:string;room:ChatRoom;author_id:string;body:string;created_at:Date|string;deleted_at:Date|string|null}>("select id,room,author_id,body,created_at,deleted_at from chat_messages where room=$1 and deleted_at is null order by created_at desc limit $2",[room,safe]);return r.rows.map(x=>({id:x.id,room:x.room,authorId:x.author_id,body:x.body,createdAt:new Date(x.created_at).toISOString(),...(x.deleted_at?{deletedAt:new Date(x.deleted_at).toISOString()}:{})})).reverse()}
 async createMessage(input:Omit<ChatMessage,"id"|"createdAt">){const r=await this.db.query<{id:string;room:ChatRoom;author_id:string;body:string;created_at:Date|string}>("insert into chat_messages(room,author_id,body) values($1,$2,$3) returning id,room,author_id,body,created_at",[input.room,input.authorId,input.body]);const x=r.rows[0];return {id:x.id,room:x.room,authorId:x.author_id,body:x.body,createdAt:new Date(x.created_at).toISOString()}}
 async createReport(input:Omit<Report,"id"|"createdAt"|"status">){const r=await this.db.query<{id:string;author_id:string;category:string;location:string;description:string;status:Report["status"];created_at:Date|string}>("insert into reports(author_id,category,location,description) values($1,$2,$3,$4) returning *",[input.authorId,input.category,input.location,input.description]);const x=r.rows[0];return {id:x.id,authorId:x.author_id,category:x.category,location:x.location,description:x.description,status:x.status,createdAt:new Date(x.created_at).toISOString()}}
}
export function getPortalRepository(){return new PostgresPortalRepository()}
