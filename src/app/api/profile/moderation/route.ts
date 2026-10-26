import {NextResponse} from "next/server";
import {getSessionUser} from "@/lib/auth-guard";
import {getDatabase} from "@/lib/database";
export async function GET(req:Request){const user=await getSessionUser(req);if(!user)return NextResponse.json({ok:false},{status:401});try{const r=await getDatabase().query("select id,action,reason,created_at from member_actions where member_id=$1 and action in ('warning','block','unblock','reject') order by created_at desc limit 100",[user.id]);return NextResponse.json({ok:true,data:r.rows},{headers:{"cache-control":"private, no-store"}})}catch{return NextResponse.json({ok:false},{status:503})}}
