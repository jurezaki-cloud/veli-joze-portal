import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(){return NextResponse.json({ok:true,service:"veli-joze-portal",version:"1.14.1",release:"coastal"},{headers:{"cache-control":"no-store"}});}
