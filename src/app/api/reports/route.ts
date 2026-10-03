import {rateLimit} from "@/lib/rate-limit";
import {requireMember} from "@/lib/auth-guard";
import {NextResponse} from "next/server";
import {backendStatus} from "@/lib/backend-status";
import {cleanText,readJson,requireSameOrigin} from "@/lib/api-security";
import {getPortalRepository} from "@/lib/repository";
export async function POST(req:Request){
 const limited=rateLimit(req,"reports",10,60000);if(limited)return limited;
 const originError=requireSameOrigin(req);if(originError)return originError;
 const auth=await requireMember(req);if(auth.response)return auth.response;
 const p=await readJson(req);if(!p.ok)return p.response;
 const category=cleanText(p.body.category,50),location=cleanText(p.body.location,120),description=cleanText(p.body.description,1500);
 if(!category||!location||description.length<10)return NextResponse.json({ok:false,message:"Dopolni vrsto, lokacijo in opis težave."},{status:400});
 if(!backendStatus().configured)return NextResponse.json({ok:false,message:"Prijava bo shranjena, ko bo priklopljen produkcijski sistem."},{status:503});
 try{const report=await getPortalRepository().createReport({authorId:auth.user!.id,category,location,description});return NextResponse.json({ok:true,message:"Prijava je shranjena v sistem skupnosti.",data:report},{status:201})}
 catch{return NextResponse.json({ok:false,message:"Prijave trenutno ni mogoče shraniti."},{status:503})}
}