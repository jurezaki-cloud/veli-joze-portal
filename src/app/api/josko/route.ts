import {readJson,requireSameOrigin} from "@/lib/api-security";
import {privateJson} from "@/lib/community-security";
import {rateLimit} from "@/lib/rate-limit";
import {askJosko} from "@/lib/josko";
export async function POST(req:Request){const origin=requireSameOrigin(req);if(origin)return origin;try{const limited=await rateLimit(req,"josko",20,60000);if(limited)return limited;const parsed=await readJson(req,4000);if(!parsed.ok)return parsed.response;const q=parsed.body.question;if(typeof q!=="string"||q.trim().length<3||q.length>500)return privateJson({ok:false,message:"Vpiši vprašanje z 3 do 500 znaki."},400);return privateJson({ok:true,data:await askJosko(q.trim())})}catch{return privateJson({ok:false,message:"JOŠKO trenutno ni dosegljiv. Poskusi znova."},503)}}
