import {NextResponse} from "next/server";
import {getSessionUser} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
import {readJson,requireSameOrigin} from "@/lib/api-security";
import {rateLimit} from "@/lib/rate-limit";
const json=(b:unknown,status=200)=>NextResponse.json(b,{status,headers:{"cache-control":"private, no-store"}});
export async function GET(req:Request){const user=await getSessionUser(req);if(!user)return json({ok:false},401);try{const r=await getDatabase().query("select email_membership,email_moderation,email_announcements,rules_accepted_at,rules_version from members where id=$1",[user.id]);return json({ok:true,data:r.rows[0]})}catch{return json({ok:false,message:"Nastavitev ni mogoče naložiti."},503)}}
export async function PATCH(req:Request){const origin=requireSameOrigin(req);if(origin)return origin;const user=await getSessionUser(req);if(!user)return json({ok:false},401);try{const limited=await rateLimit(req,`mail-prefs-${user.id}`,15,60000);if(limited)return limited;const p=await readJson(req);if(!p.ok)return p.response;const keys=["email_membership","email_moderation","email_announcements"];if(keys.some(k=>typeof p.body[k]!=="boolean"))return json({ok:false,message:"Izberi vrste e-pošte."},400);await getDatabase().query("update members set email_membership=$2,email_moderation=$3,email_announcements=$4 where id=$1",[user.id,...keys.map(k=>p.body[k])]);return json({ok:true,message:"Nastavitve e-pošte so shranjene."})}catch{return json({ok:false,message:"Nastavitev ni mogoče shraniti."},503)}}
