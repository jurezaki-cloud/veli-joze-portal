import { randomUUID } from "node:crypto";
import { rateLimit } from "@/lib/rate-limit";
import { requireMember, requireRole } from "@/lib/auth-guard";
import { cleanText, readJson, requireSameOrigin } from "@/lib/api-security";
import { getPortalRepository } from "@/lib/repository";
import { getDatabase } from "@/lib/database";
import { privateJson, readCommunityInput, validId } from "@/lib/community-security";
export async function GET(req:Request){
 const auth=await requireMember(req);if(auth.response)return auth.response;
 const canManage=["moderator","admin"].includes(auth.user!.role);
 try{const r=await getDatabase().query(`select r.id,r.category,r.location,r.description,r.status,r.created_at,m.display_name,
 coalesce((select json_agg(json_build_object('id',u.id,'status',u.status,'body',u.body,'has_photo',u.image is not null,'created_at',u.created_at) order by u.created_at) from report_updates u where u.report_id=r.id),'[]'::json) updates
 from reports r left join members m on m.id=r.author_id where r.author_id=$1 or $2::boolean order by case r.status when 'open' then 0 when 'reviewing' then 1 else 2 end,r.created_at desc limit 100`,[auth.user!.id,canManage]);return privateJson({ok:true,data:r.rows,canManage,handler:"Moderatorji portala (skupnost pavšalistov)"})}catch{return privateJson({ok:false,message:"Prijav trenutno ni mogoče naložiti."},503)}
}
export async function POST(req:Request){
 const oe=requireSameOrigin(req);if(oe)return oe;const auth=await requireMember(req);if(auth.response)return auth.response;
 const p=await readJson(req);if(!p.ok)return p.response;const category=cleanText(p.body.category,50),location=cleanText(p.body.location,120),description=cleanText(p.body.description,1500);
 if(!category||!location||description.length<10)return privateJson({ok:false,message:"Dopolni vrsto, lokacijo in opis težave."},400);
 try{const limited=await rateLimit(req,`reports-${auth.user!.id}`,10,60000);if(limited)return limited;const report=await getPortalRepository().createReport({authorId:auth.user!.id,category,location,description});return privateJson({ok:true,message:"Prijava je shranjena v sistem skupnosti.",data:report},201)}catch{return privateJson({ok:false,message:"Prijave trenutno ni mogoče shraniti."},503)}
}
export async function PATCH(req:Request){
 const oe=requireSameOrigin(req);if(oe)return oe;const auth=await requireRole(req,["moderator","admin"]);if(auth.response)return auth.response;
 try{const limited=await rateLimit(req,`report-update-${auth.user!.id}`,30,60000);if(limited)return limited;
 const p=await readCommunityInput(req);if(p.response)return p.response;const id=p.data!.id,status=cleanText(p.data!.status,20),body=cleanText(p.data!.body,1500)||"Status prijave je posodobljen.";
 if(!validId(id)||!["open","reviewing","closed"].includes(status))return privateJson({ok:false,message:"Neveljaven status."},400);
 const r=await getDatabase().query(`with changed as (update reports set status=$2 where id=$1 returning id,author_id), history as (insert into report_updates(id,report_id,author_id,status,body,image) select $3,id,$4,$2,$5,$6 from changed returning id), audit as (insert into moderation_actions(id,moderator_id,target_type,target_id,action) select $7,$4,'report',id,'status:'||$2 from changed), notify as (insert into portal_notifications(id,member_id,category,title,href) select $8,author_id,'replies','Nov odgovor na tvojo prijavo težave','/tezave' from changed where author_id is not null and author_id!=$4) select id from changed`,[id,status,randomUUID(),auth.user!.id,body,p.image,randomUUID(),randomUUID()]);
 if(!r.rows.length)return privateJson({ok:false,message:"Prijava ne obstaja."},404);
 return privateJson({ok:true,message:"Odgovor in stanje prijave sta shranjena."})}catch{return privateJson({ok:false,message:"Spremembe ni mogoče shraniti."},503)}
}
