import {requireRole} from "@/lib/auth-guard";
import {privateJson} from "@/lib/community-security";
import {readJson,requireSameOrigin} from "@/lib/api-security";
import {rateLimit} from "@/lib/rate-limit";
import {pushConfig} from "@/lib/push-notifications";
import {pushDeliveryOverview,retryExhaustedPush} from "@/lib/push-delivery-overview";
export async function GET(req:Request){
 const auth=await requireRole(req,["admin","moderator"]);if(auth.response)return auth.response;
 try{return privateJson({ok:true,configured:pushConfig().ready,data:await pushDeliveryOverview()})}
 catch{return privateJson({ok:false,message:"Pregleda dostav push trenutno ni mogoče naložiti."},503)}
}
export async function POST(req:Request){
 const origin=requireSameOrigin(req);if(origin)return origin;
 const auth=await requireRole(req,["admin","moderator"]);if(auth.response)return auth.response;
 const body=await readJson(req);if(!body.ok)return body.response;
 if(body.body.action!=="retry-exhausted")return privateJson({ok:false,message:"Neveljaven ukrep."},400);
 if(!pushConfig().ready)return privateJson({ok:false,message:"Najprej nastavi push in preveri testno obvestilo na svoji napravi."},503);
 try{
  const limited=await rateLimit(req,`push-retry-${auth.user!.id}`,5,60000);if(limited)return limited;
  const retried=await retryExhaustedPush();
  return privateJson({ok:true,retried,message:`V ponovno obdelavo vrnjene dostave: ${retried}. Delavec pošlje samo obvestila, ki so še neprebrana in upravičena do dostave.`});
 }catch{return privateJson({ok:false,message:"Ponovne obdelave ni mogoče pripraviti."},503)}
}
