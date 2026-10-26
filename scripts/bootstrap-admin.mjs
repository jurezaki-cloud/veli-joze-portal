import pg from "pg";
const email=String(process.argv[2]||"").trim().toLowerCase();
if(!email||!email.includes("@")){console.error("Uporaba: node scripts/bootstrap-admin.mjs email@domena.si");process.exit(2)}
if(!process.env.DATABASE_URL){console.error("DATABASE_URL manjka.");process.exit(2)}
const client=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:String(process.env.DATABASE_SSL||"").toLowerCase()==="true"?{rejectUnauthorized:false}:false});
await client.connect();
try{
 const admins=await client.query("select count(*)::int as count from members where role='admin' and approved=true");
 if(admins.rows[0].count>0){console.error("Bootstrap je zaklenjen: administrator že obstaja.");process.exitCode=3}
 else{
  const r=await client.query("update members set role='admin',approved=true where lower(email)=lower($1) returning id,email,display_name,role,approved",[email]);
  if(r.rows.length!==1){console.error("Registriran uporabnik s tem e-poštnim naslovom ne obstaja.");process.exitCode=4}
  else console.log("Prvi administrator je varno aktiviran:",r.rows[0].email);
 }
}finally{await client.end()}
