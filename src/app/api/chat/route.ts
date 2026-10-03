import {rateLimit} from "@/lib/rate-limit";
import {requireMember} from "@/lib/auth-guard";
import {NextResponse} from "next/server";
import {backendStatus} from "@/lib/backend-status";
import {cleanText,readJson,requireSameOrigin} from "@/lib/api-security";
import {getPortalRepository} from "@/lib/repository";
import type {ChatRoom} from "@/lib/domain";
const rooms=new Set<ChatRoom>(["general","social","help","market","lost-found"]);
export async function POST(req:Request){
 const limited=await rateLimit(req,"chat",30,60000);if(limited)return limited;
 const originError=requireSameOrigin(req);if(originError)return originError;
 const auth=await requireMember(req);if(auth.response)return auth.response;
 const parsed=await readJson(req,4096);if(!parsed.ok)return parsed.response;
 const room=cleanText(parsed.body.room,32) as ChatRoom,body=cleanText(parsed.body.body,501);
 if(!rooms.has(room)||!body)return NextResponse.json({ok:false,message:"Sporočilo ali soba nista veljavna."},{status:400});
 if(body.length>500)return NextResponse.json({ok:false,message:"Sporočilo je predolgo."},{status:400});
 if(!backendStatus().configured)return NextResponse.json({ok:false,message:"Klepet bo aktiven po priklopu varnega produkcijskega sistema."},{status:503});
 try{const message=await getPortalRepository().createMessage({room,authorId:auth.user!.id,body});return NextResponse.json({ok:true,message:"Sporočilo je objavljeno.",data:message},{status:201})}
 catch{return NextResponse.json({ok:false,message:"Sporočila trenutno ni mogoče shraniti."},{status:503})}
}