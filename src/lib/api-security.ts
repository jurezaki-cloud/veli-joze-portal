import {NextResponse} from "next/server";
export async function readJson(req:Request,maxBytes=8192){
 const type=req.headers.get("content-type")||"";
 if(!type.toLowerCase().includes("application/json")) return {ok:false as const,response:NextResponse.json({ok:false,message:"Zahteva mora biti JSON."},{status:415})};
 const length=Number(req.headers.get("content-length")||0);
 if(length>maxBytes) return {ok:false as const,response:NextResponse.json({ok:false,message:"Zahteva je prevelika."},{status:413})};
 try{const body=await req.json();return {ok:true as const,body};}
 catch{return {ok:false as const,response:NextResponse.json({ok:false,message:"Neveljaven JSON."},{status:400})};}
}
export function cleanText(value:unknown,max=500){return String(value??"").trim().slice(0,max);}
export function requireSameOrigin(req:Request){
 const origin=req.headers.get("origin");
 if(!origin)return null;
 try{
  const requestUrl=new URL(req.url);
  const originUrl=new URL(origin);
  if(requestUrl.protocol===originUrl.protocol&&requestUrl.host===originUrl.host)return null;
 }catch{}
 return NextResponse.json({ok:false,message:"Izvor zahteve ni dovoljen."},{status:403});
}
