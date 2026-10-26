import {NextResponse} from "next/server";
import {requireRole} from "@/lib/auth-guard";
import {getPortalRepository} from "@/lib/repository";
export {PATCH} from "../member-settings/route";
export async function GET(req:Request){const auth=await requireRole(req,["admin","moderator"]);if(auth.response)return auth.response;try{return NextResponse.json({ok:true,data:await getPortalRepository().listMembersForAdmin()},{headers:{"cache-control":"private, no-store"}})}catch{return NextResponse.json({ok:false,message:"Članov trenutno ni mogoče naložiti."},{status:503})}}
