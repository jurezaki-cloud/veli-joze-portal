import { requireMember } from "@/lib/auth-guard";
import { getDatabase } from "@/lib/database";
import { privateJson,validId } from "@/lib/community-security";
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const a=await requireMember(req);if(a.response)return a.response;const {id}=await params;if(!validId(id))return new Response(null,{status:404});
 try{const r=await getDatabase().query<{image:Buffer}>("select u.image from report_updates u join reports r on r.id=u.report_id where u.id=$1 and u.image is not null and (r.author_id=$2 or $3::boolean)",[id,a.user!.id,["moderator","admin"].includes(a.user!.role)]);if(!r.rows[0])return new Response(null,{status:404});return new Response(new Uint8Array(r.rows[0].image),{headers:{"Content-Type":"image/webp","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}})}catch{return privateJson({ok:false},503)}
}
