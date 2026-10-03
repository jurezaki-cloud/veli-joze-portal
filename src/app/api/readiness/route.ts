import {NextResponse} from "next/server";
import {checkDatabaseConnection} from "@/lib/database";
export const dynamic="force-dynamic";
export async function GET(){
 const databaseConfigured=Boolean(process.env.DATABASE_URL);
 const database=databaseConfigured?await checkDatabaseConnection():false;
 const checks={
  database,
  databaseConfigured,
  authProvider:Boolean(process.env.AUTH_PROVIDER),
  authSecret:Boolean(process.env.AUTH_SECRET&&process.env.AUTH_SECRET.length>=32),
  sharedRateLimit:Boolean(process.env.RATE_LIMIT_PROVIDER),
  googleOAuth:Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET)
 };
 const required=checks.database&&checks.authProvider&&checks.authSecret&&checks.sharedRateLimit;
 return NextResponse.json({ready:required,checks,note:required?"Osnovni produkcijski sistemi so dosegljivi in konfigurirani. Pred objavo je potreben še end-to-end test.":"Produkcijski priklop še ni dokončan."},{headers:{"cache-control":"no-store"}});
}