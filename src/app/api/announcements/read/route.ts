import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-guard";
import { readJson, requireSameOrigin } from "@/lib/api-security";
import { getDatabase } from "@/lib/database";
export async function POST(req:Request){
 const origin=requireSameOrigin(req);if(origin)return origin;
 const user=await getSessionUser(req);if(!user)return NextResponse.json({ok:false},{status:401});
 const parsed=await readJson(req,16384);if(!parsed.ok)return parsed.response;
 const ids=parsed.body.ids;
 if(!Array.isArray(ids)||ids.length>100||ids.some(id=>typeof id!=="string"||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))return NextResponse.json({ok:false},{status:400});
 try{await getDatabase().query("insert into announcement_reads(member_id,announcement_id) select $1,id from announcements where id=any($2::uuid[]) and archived_at is null on conflict(member_id,announcement_id) do nothing",[user.id,ids]);return NextResponse.json({ok:true},{headers:{"cache-control":"no-store"}})}catch{return NextResponse.json({ok:false,message:"Oznake prebranih obvestil ni mogoče shraniti."},{status:503})}
}
