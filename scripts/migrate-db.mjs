import fs from "node:fs";
import path from "node:path";
import pg from "pg";
const url=process.env.DATABASE_URL;
if(!url){console.error("DATABASE_URL ni nastavljen. Migracija ni bila izvedena.");process.exit(2)}
const sql=["schema.sql","gallery.sql","community.sql","chat.sql","profile.sql","accounts.sql","messaging.sql","privacy.sql","v41.sql","v42.sql","v46.sql","v110.sql","v130.sql","v190.sql"].map(file=>fs.readFileSync(path.join(process.cwd(),"db",file),"utf8")).join("\n");
const pool=new pg.Pool({connectionString:url,ssl:process.env.DATABASE_SSL==="false"?false:{rejectUnauthorized:true}});
let client;
try{
 client=await pool.connect();
 await client.query("begin");
 await client.query(sql);
 await client.query("commit");
 console.log("Veli Jože DB schema: OK");
}catch(error){
 if(client) await client.query("rollback").catch(()=>{});
 console.error("Veli Jože DB schema: FAILED");
 console.error(error instanceof Error?error.message:String(error));
 process.exitCode=1;
}finally{if(client)client.release();await pool.end()}
