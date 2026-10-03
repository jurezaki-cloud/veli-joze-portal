import {NextResponse} from "next/server"; import {backendStatus} from "@/lib/backend-status";
export async function GET(){return NextResponse.json(backendStatus());}
