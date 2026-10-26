import {NextResponse} from "next/server";
export async function readJson(req:Request,maxBytes=8192){
 const type=req.headers.get("content-type")||"";
 if(!type.toLowerCase().includes("application/json")) return {ok:false as const,response:NextResponse.json({ok:false,message:"Zahteva mora biti JSON."},{status:415})};
 const length=Number(req.headers.get("content-length")||0);
 if(length>maxBytes) return {ok:false as const,response:NextResponse.json({ok:false,message:"Zahteva je prevelika."},{status:413})};
 try{const raw=await req.text();if(new TextEncoder().encode(raw).length>maxBytes)return {ok:false as const,response:NextResponse.json({ok:false,message:"Zahteva je prevelika."},{status:413})};const body=JSON.parse(raw);if(!body||typeof body!=="object"||Array.isArray(body))return {ok:false as const,response:NextResponse.json({ok:false,message:"Zahteva mora biti objekt JSON."},{status:400})};return {ok:true as const,body};}
 catch{return {ok:false as const,response:NextResponse.json({ok:false,message:"Neveljaven JSON."},{status:400})};}
}
export function cleanText(value:unknown,max=500){return String(value??"").trim().slice(0,max);}
export function requireSameOrigin(req:Request){
 const origin=req.headers.get("origin");
 if(!origin)return null;
 try{
  const originUrl=new URL(origin);
  const publicOrigin=process.env.PUBLIC_ORIGIN||process.env.NEXT_PUBLIC_APP_URL||"";
  if(publicOrigin){
   const expected=new URL(publicOrigin);
   if(originUrl.protocol===expected.protocol&&originUrl.host===expected.host)return null;
  }
  const forwardedHost=(req.headers.get("x-forwarded-host")||req.headers.get("host")||"").split(",")[0].trim();
  const forwardedProto=(req.headers.get("x-forwarded-proto")||originUrl.protocol.replace(":","")).split(",")[0].trim();
  if(forwardedHost&&originUrl.host===forwardedHost&&originUrl.protocol===forwardedProto+":")return null;
  const requestUrl=new URL(req.url);
  if(requestUrl.protocol===originUrl.protocol&&requestUrl.host===originUrl.host)return null;
 }catch{}
 return NextResponse.json({ok:false,message:"Izvor zahteve ni dovoljen."},{status:403});
}
