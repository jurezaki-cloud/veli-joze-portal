import {NextResponse} from "next/server";
import type {Role} from "./domain";
import {getAuthAdapter} from "./auth-adapter";
export async function getSessionUser(req:Request){
 return getAuthAdapter().getIdentity(req);
}
export async function requireMember(req:Request){
 const user=await getSessionUser(req);
 if(!user||!user.approved)return {user:null,response:NextResponse.json({ok:false,message:"Za to dejanje je potrebna prijava odobrenega pavšalista."},{status:401})};
 return {user,response:null};
}
export async function requireRole(req:Request,roles:Role[]){
 const member=await requireMember(req);
 if(member.response)return member;
 if(!roles.includes(member.user!.role))return {user:null,response:NextResponse.json({ok:false,message:"Za to dejanje nimaš dovoljenja."},{status:403})};
 return member;
}
