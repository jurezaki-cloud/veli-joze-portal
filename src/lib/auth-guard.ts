import {NextResponse} from "next/server";
import type {Role} from "./domain";
import {getAuthAdapter} from "./auth-adapter";
export async function getSessionUser(req:Request){
 return getAuthAdapter().getIdentity(req);
}
export async function requireMember(req:Request){
 let user;try{user=await getSessionUser(req)}catch{console.error("[auth] Identity lookup failed");return {user:null,response:NextResponse.json({ok:false,message:"Prijave trenutno ni mogoče preveriti. Poskusi znova čez trenutek."},{status:503,headers:{"cache-control":"no-store"}})}};
 if(user&&!user.approved)return {user:null,response:NextResponse.json({ok:false,message:"Tvoj profil čaka na odobritev moderatorja."},{status:403})};
 if(!user)return {user:null,response:NextResponse.json({ok:false,message:"Za to dejanje je potrebna prijava odobrenega pavšalista."},{status:401})};
 return {user,response:null};
}
export async function requireRole(req:Request,roles:Role[]){
 const member=await requireMember(req);
 if(member.response)return member;
 if(!roles.includes(member.user!.role))return {user:null,response:NextResponse.json({ok:false,message:"Za to dejanje nimaš dovoljenja."},{status:403})};
 return member;
}
