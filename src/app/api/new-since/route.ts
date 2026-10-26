import {requireMember} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {privateJson} from "@/lib/community-security";
import {readJson,requireSameOrigin} from "@/lib/api-security";
import {rateLimit} from "@/lib/rate-limit";
import {visitWindow,visitOverview} from "@/lib/visit-overview";
export async function GET(req:Request){const auth=await requireMember(req);if(auth.response)return auth.response;try{return privateJson(await visitOverview(auth.user!.id,await visitWindow(auth.user!.id)))}catch{return privateJson({ok:false,message:"Novosti trenutno niso dosegljive."},503)}}
export async function POST(req:Request){
 const origin=requireSameOrigin(req);if(origin)return origin;const auth=await requireMember(req);if(auth.response)return auth.response;
 const p=await readJson(req,1024);if(!p.ok)return p.response;
 const stamp=p.body.asOf;
 if(typeof stamp!=="string"||stamp.length>32||Number.isNaN(Date.parse(stamp))||new Date(stamp).toISOString()!==stamp||Date.parse(stamp)>Date.now())return privateJson({ok:false,message:"Neveljaven čas pregleda. Osveži pregled in poskusi znova."},400);
 try{const limited=await rateLimit(req,`visit-review-${auth.user!.id}`,30,60000);if(limited)return limited;
 await getDatabase().query("insert into member_visits(member_id,last_seen_at) values($1,$2::timestamptz) on conflict(member_id) do update set last_seen_at=greatest(member_visits.last_seen_at,excluded.last_seen_at)",[auth.user!.id,stamp]);
 return privateJson({ok:true,message:"Pregled novosti je označen kot pregledan."});
 }catch{return privateJson({ok:false,message:"Pregleda ni mogoče označiti. Poskusi znova."},503)}
}
