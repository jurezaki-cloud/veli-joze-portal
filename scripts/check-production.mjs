const checks={
 DATABASE_URL:Boolean(process.env.DATABASE_URL),
 AUTH_PROVIDER:Boolean(process.env.AUTH_PROVIDER),
 AUTH_SECRET:Boolean(process.env.AUTH_SECRET&&process.env.AUTH_SECRET.length>=32),
 RATE_LIMIT_PROVIDER:Boolean(process.env.RATE_LIMIT_PROVIDER),
 GOOGLE_OAUTH:Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET)
};
console.log("Veli Jože production configuration");
for(const [k,v] of Object.entries(checks))console.log(`${v?"PASS":"WAIT"}  ${k}`);
const required=checks.DATABASE_URL&&checks.AUTH_PROVIDER&&checks.AUTH_SECRET&&checks.RATE_LIMIT_PROVIDER;
console.log(required?"READY: core production configuration present; run end-to-end verification before launch.":"WAIT: required production configuration is incomplete.");
process.exit(required?0:2);
