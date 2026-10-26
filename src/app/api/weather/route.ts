import {NextResponse} from "next/server";
import {publicWeather} from "@/lib/public-weather";
export const dynamic="force-dynamic";
export async function GET(){try{return NextResponse.json(await publicWeather(),{headers:{"cache-control":"no-store"}})}catch{return NextResponse.json({ok:false,message:"Vremenski podatki trenutno niso dosegljivi. Poskusi ponovno."},{status:503,headers:{"cache-control":"no-store"}})}}
