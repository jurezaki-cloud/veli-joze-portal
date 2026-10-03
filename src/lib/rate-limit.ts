import {NextResponse} from "next/server";
type Bucket={count:number;resetAt:number};
const buckets=new Map<string,Bucket>();
export function rateLimit(req:Request,scope:string,limit=20,windowMs=60_000){
 // Development fallback only. Production must use a shared/distributed store.
 if(process.env.NODE_ENV==="production"&&!process.env.RATE_LIMIT_PROVIDER)return null;
 const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
 const key=`${scope}:${forwarded||"local"}`;
 const now=Date.now(); const current=buckets.get(key);
 if(!current||current.resetAt<=now){buckets.set(key,{count:1,resetAt:now+windowMs});return null;}
 current.count++;
 if(current.count<=limit)return null;
 return NextResponse.json({ok:false,message:"Preveč zahtev. Poskusi ponovno čez nekaj trenutkov."},{status:429,headers:{"Retry-After":String(Math.ceil((current.resetAt-now)/1000))}});
}
