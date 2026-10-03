import {NextResponse} from "next/server";
import {getDatabase} from "./database";
type Bucket={count:number;resetAt:number};const buckets=new Map<string,Bucket>();
function denied(seconds:number){return NextResponse.json({ok:false,message:"Preveč zahtev. Poskusi ponovno čez nekaj trenutkov."},{status:429,headers:{"Retry-After":String(Math.max(1,seconds))}})}
export async function rateLimit(req:Request,scope:string,limit=20,windowMs=60_000){
 const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();const key=`${scope}:${forwarded||"local"}`;const now=Date.now();
 if(process.env.RATE_LIMIT_PROVIDER==="postgres"&&process.env.DATABASE_URL){
  const reset=new Date(now+windowMs);
  const q=await getDatabase().query<{count:number;reset_at:Date|string}>(`insert into rate_limits(key,count,reset_at) values($1,1,$2)
   on conflict(key) do update set count=case when rate_limits.reset_at<=now() then 1 else rate_limits.count+1 end,
   reset_at=case when rate_limits.reset_at<=now() then excluded.reset_at else rate_limits.reset_at end returning count,reset_at`,[key,reset]);
  const row=q.rows[0];if(row.count>limit)return denied(Math.ceil((new Date(row.reset_at).getTime()-now)/1000));return null;
 }
 const current=buckets.get(key);if(!current||current.resetAt<=now){buckets.set(key,{count:1,resetAt:now+windowMs});return null;}current.count++;if(current.count<=limit)return null;return denied(Math.ceil((current.resetAt-now)/1000));
}