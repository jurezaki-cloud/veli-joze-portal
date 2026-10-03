import {rateLimit} from "@/lib/rate-limit";
import {requireMember} from "@/lib/auth-guard";
import {NextResponse} from "next/server";
import {backendStatus} from "@/lib/backend-status";
import {getDatabase} from "@/lib/database";
import {cleanText,readJson,requireSameOrigin} from "@/lib/api-security";
export async function POST(req:Request){
 const limited=rateLimit(req,"listings",10,60000);if(limited)return limited;
 const originError=requireSameOrigin(req);if(originError)return originError;
 const auth=await requireMember(req);if(auth.response)return auth.response;
 const parsed=await readJson(req);if(!parsed.ok)return parsed.response;
 const title=cleanText(parsed.body.title,120),description=cleanText(parsed.body.description,1500),category=cleanText(parsed.body.category,40),price=cleanText(parsed.body.price,60);
 if(title.length<4||description.length<10||!category)return NextResponse.json({ok:false,message:"Dopolni naslov, kategorijo in opis oglasa."},{status:400});
 if(!backendStatus().configured)return NextResponse.json({ok:false,message:"Objava bo omogočena po priklopu uporabniškega sistema."},{status:503});
 try{
  const r=await getDatabase().query<{id:string,status:string}>("insert into listings(author_id,title,category,price,description,status) values($1,$2,$3,$4,$5,'pending') returning id,status",[auth.user!.id,title,category,price||null,description]);
  return NextResponse.json({ok:true,message:"Oglas je poslan v moderatorski pregled.",data:r.rows[0]},{status:201});
 }catch{return NextResponse.json({ok:false,message:"Oglasa trenutno ni mogoče shraniti."},{status:503})}
}