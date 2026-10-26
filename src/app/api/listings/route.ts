import {randomUUID} from "node:crypto";
import {requireMember} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {cleanText,readJson,requireSameOrigin} from "@/lib/api-security";
import {privateJson,validId} from "@/lib/community-security";
import {rateLimit} from "@/lib/rate-limit";
import {prepareGalleryImage} from "@/lib/gallery-image";
const categories=new Set(["Oprema","Šport","Iščem","Podarim","Drugo"]);
const MAX_BODY=30*1024*1024+65536;
class InputError extends Error{}
async function input(req:Request){
 if(!req.headers.get("content-type")?.startsWith("multipart/form-data"))throw new InputError("Uporabi obrazec za oglas.");
 const reader=req.body?.getReader();if(!reader)throw new InputError("Obrazec je prazen.");
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>MAX_BODY){await reader.cancel();throw new InputError("Skupna velikost fotografij je največ 30 MB.")}chunks.push(part.value)}
 const f=await new Response(Buffer.concat(chunks),{headers:{"Content-Type":req.headers.get("content-type")!}}).formData();
 const title=cleanText(f.get("title"),120),description=cleanText(f.get("description"),1500),category=cleanText(f.get("category"),40),price=cleanText(f.get("price"),60);
 if(title.length<4||description.length<10||!categories.has(category))throw new InputError("Dopolni naslov, kategorijo in opis.");
 const uploads=[f.get("photo"),...f.getAll("photos")].filter((x):x is File=>x instanceof File&&x.size>0);
 if(uploads.length>6)throw new InputError("Izberi največ 6 fotografij.");
 const images:Buffer[]=[];for(const file of uploads){try{images.push((await prepareGalleryImage(new Uint8Array(await file.arrayBuffer()))).image)}catch{throw new InputError("Fotografije morajo biti veljavne JPG, PNG ali WebP do 5 MB na fotografijo.")}}
 return {id:String(f.get("id")||""),title,description,category,price,images};
}
function appendPhotos(images:Buffer[],params:unknown[],source:string,afterDelete=false){
 if(!images.length)return "";
 const rows=images.map((image,i)=>{params.push(randomUUID(),image);const n=params.length;return `select $${n-1}::uuid,id,$${n}::bytea,'image/webp',${i} from ${source}${afterDelete?" where (select count(*) from removed)>=0":""}`});
 return `, added_photos as (insert into listing_photos(id,listing_id,image,mime_type,sort_order) ${rows.join(" union all ")} returning id)`;
}
export async function GET(req:Request){const a=await requireMember(req);if(a.response)return a.response;try{
 const params=new URL(req.url).searchParams,mine=params.get("mine")==="1",favorites=params.get("favorites")==="1",id=params.get("id");if(id!==null&&!validId(id))return privateJson({ok:false,message:"Neveljaven oglas."},400);
 const r=await getDatabase().query(`select l.id,l.author_id,l.title,l.category,l.price,l.description,l.created_at,l.sale_status,l.status as moderation_status,(l.image is not null) has_photo,m.nickname,m.display_name,(l.author_id=$1) is_mine,exists(select 1 from listing_favorites f where f.listing_id=l.id and f.member_id=$1) favorite,(select count(*)::int from listing_photos lp where lp.listing_id=l.id) photo_count,coalesce((select array_agg(lp.id order by lp.sort_order,lp.created_at) from listing_photos lp where lp.listing_id=l.id),'{}'::uuid[]) photo_ids from listings l join members m on m.id=l.author_id where ${mine?"l.author_id=$1":favorites?"l.status='approved' and m.approved=true and exists(select 1 from listing_favorites f where f.member_id=$1 and f.listing_id=l.id)":"l.status='approved'"} and ($2::uuid is null or l.id=$2) order by l.created_at desc limit 100`,[a.user!.id,id]);return privateJson({ok:true,data:r.rows});
 }catch{return privateJson({ok:false,message:"Oglasov trenutno ni mogoče naložiti."},503)}}
export async function POST(req:Request){const o=requireSameOrigin(req);if(o)return o;const a=await requireMember(req);if(a.response)return a.response;try{
 const limited=await rateLimit(req,`listings-${a.user!.id}`,10,60000);if(limited)return limited;
 const f=await input(req),params:unknown[]=[randomUUID(),a.user!.id,f.title,f.category,f.price||null,f.description,f.images[0]||null];
 const photos=appendPhotos(f.images.slice(1),params,"created");
 await getDatabase().query(`with created as (insert into listings(id,author_id,title,category,price,description,status,image) values($1,$2,$3,$4,$5,$6,'pending',$7) returning id)${photos} select id from created`,params);
 return privateJson({ok:true,message:"Oglas in fotografije so poslani v moderatorski pregled."},201);
 }catch(e){return privateJson({ok:false,message:e instanceof InputError?e.message:"Oglasa trenutno ni mogoče shraniti. Poskusi pozneje."},e instanceof InputError?400:503)}}
export async function PATCH(req:Request){const o=requireSameOrigin(req);if(o)return o;const a=await requireMember(req);if(a.response)return a.response;try{
 const limited=await rateLimit(req,`listing-edit-${a.user!.id}`,30,60000);if(limited)return limited;
 if(req.headers.get("content-type")?.includes("multipart/form-data")){
  const f=await input(req);if(!validId(f.id))return privateJson({ok:false,message:"Neveljaven oglas."},400);
  const params:unknown[]=[f.id,a.user!.id,f.title,f.category,f.price||null,f.description,f.images.length>0,f.images[0]||null];
  const photos=appendPhotos(f.images.slice(1),params,"changed",true);
  const r=await getDatabase().query(`with changed as (update listings set title=$3,category=$4,price=$5,description=$6,status='pending',image=case when $7::boolean then $8::bytea else image end where id=$1 and author_id=$2 returning id), removed as (delete from listing_photos where listing_id in(select id from changed) and $7::boolean returning id)${photos} select id from changed`,params);
  if(!r.rows.length)return privateJson({ok:false,message:"Urejaš lahko samo svoj oglas."},403);
  return privateJson({ok:true,message:"Spremembe so shranjene. Oglas čaka na ponovno odobritev moderatorja."});
 }
 const p=await readJson(req);if(!p.ok)return p.response;if(!validId(p.body.id))return privateJson({ok:false,message:"Neveljaven oglas."},400);
 if(p.body.action==="favorite"){
  const r=await getDatabase().query(`with visible as(select id from listings where id=$2 and status='approved'), removed as(delete from listing_favorites where member_id=$1 and listing_id in(select id from visible) returning 1), added as(insert into listing_favorites(member_id,listing_id) select $1,id from visible where not exists(select 1 from removed) returning 1) select id from visible`,[a.user!.id,p.body.id]);
  return r.rows.length?privateJson({ok:true,message:"Priljubljeni oglasi so posodobljeni."}):privateJson({ok:false,message:"Oglas ni na voljo."},404);
 }
 if(p.body.action==="status"&&["active","reserved","sold"].includes(p.body.status)){
  const r=await getDatabase().query("update listings set sale_status=$1 where id=$2 and author_id=$3 returning id",[p.body.status,p.body.id,a.user!.id]);
  return r.rows.length?privateJson({ok:true,message:"Stanje oglasa je shranjeno."}):privateJson({ok:false,message:"Urejaš lahko samo svoj oglas."},403);
 }
 return privateJson({ok:false,message:"Neveljavna sprememba."},400);
 }catch(e){return privateJson({ok:false,message:e instanceof InputError?e.message:"Spremembe trenutno ni mogoče shraniti."},e instanceof InputError?400:503)}}
