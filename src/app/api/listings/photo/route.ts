import {requireMember} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {validId,privateJson} from "@/lib/community-security";
import {photoType} from "@/lib/message-photo";
export async function GET(req:Request){
 const a=await requireMember(req);if(a.response)return a.response;
 const url=new URL(req.url),id=url.searchParams.get("id"),photo=url.searchParams.get("photo");
 if(!validId(id)||(photo&&!validId(photo)))return new Response(null,{status:404});
 try{
  const reviewer=["admin","moderator"].includes(a.user!.role);
  const r=await getDatabase().query<{image:Buffer}>(photo?"select p.image from listing_photos p join listings l on l.id=p.listing_id where l.id=$1 and p.id=$4 and (l.status='approved' or l.author_id=$2 or $3::boolean)":"select image from listings where id=$1 and (status='approved' or author_id=$2 or $3::boolean)",photo?[id,a.user!.id,reviewer,photo]:[id,a.user!.id,reviewer]);
  const image=r.rows[0]?.image,mime=image&&photoType(image);if(!image||!mime)return new Response(null,{status:404});
  return new Response(new Uint8Array(image),{headers:{"Content-Type":mime,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch{return privateJson({ok:false,message:"Fotografija trenutno ni dosegljiva."},503)}
}
