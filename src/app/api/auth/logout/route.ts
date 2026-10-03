import {NextResponse} from "next/server";
import {sessionCookie} from "@/lib/auth-adapter";
export async function POST(req:Request){
 const r=NextResponse.redirect(new URL("/prijava",req.url),303);
 r.cookies.set(sessionCookie,"",{httpOnly:true,secure:true,sameSite:"lax",maxAge:0,path:"/"});
 return r;
}
