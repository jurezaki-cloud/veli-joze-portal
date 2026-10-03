const required=["AUTH_PROVIDER","DATABASE_URL","AUTH_SECRET","RATE_LIMIT_PROVIDER"];
const missing=required.filter(k=>!process.env[k]);
const errors=[];
if(process.env.AUTH_SECRET&&process.env.AUTH_SECRET.length<32)errors.push("AUTH_SECRET mora imeti najmanj 32 znakov.");
if(process.env.DATABASE_SSL==="false"&&process.env.NODE_ENV==="production")errors.push("DATABASE_SSL=false ni dovoljen za javni production release brez izrecne varnostne odobritve.");
if(process.env.AUTH_PROVIDER==="google"&&(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET))errors.push("Google auth zahteva GOOGLE_CLIENT_ID in GOOGLE_CLIENT_SECRET.");
if(missing.length)errors.push("Manjka: "+missing.join(", "));
if(errors.length){console.error("PRODUCTION PREFLIGHT: BLOCKED");for(const e of errors)console.error("- "+e);process.exit(2)}
console.log("PRODUCTION PREFLIGHT: CONFIG PRESENT");
console.log("Opomba: pred objavo sta še vedno obvezna DB connectivity in end-to-end auth test.");
