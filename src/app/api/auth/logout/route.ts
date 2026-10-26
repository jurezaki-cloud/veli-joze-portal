import {NextResponse} from "next/server";
import {sessionCookie} from "@/lib/auth-adapter";

export async function POST(req:Request){
 const origin=process.env.NODE_ENV==="production"?"https://www.veli-joze.eu":new URL(req.url).origin;
 const response=NextResponse.redirect(new URL("/prijava",origin),303);
 response.cookies.set(sessionCookie,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",maxAge:0,path:"/"});
 return response;
}
