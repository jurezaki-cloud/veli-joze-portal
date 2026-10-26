import {NextResponse} from "next/server";
import {loadHome} from "@/lib/home-data";
export const dynamic="force-dynamic";
export async function GET(){const data=await loadHome();return NextResponse.json(data?{ok:true,data}:{ok:false,message:"Podatkov naslovnice trenutno ni mogoče naložiti."},{status:data?200:503,headers:{"cache-control":"no-store"}})}
