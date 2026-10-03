import fs from "node:fs";
import path from "node:path";
import pg from "pg";
const url=process.env.DATABASE_URL;
if(!url){console.error("DATABASE_URL ni nastavljen. Migracija ni bila izvedena.");process.exit(2)}
const sql=fs.readFileSync(path.join(process.cwd(),"db","schema.sql"),"utf8");
const pool=new pg.Pool({connectionString:url,ssl:process.env.DATABASE_SSL==="false"?false:{rejectUnauthorized:true}});
try{
 await pool.query("begin");
 await pool.query(sql);
 await pool.query("commit");
 console.log("Veli Jože DB schema: OK");
}catch(error){
 await pool.query("rollback").catch(()=>{});
 console.error("Veli Jože DB schema: FAILED");
 console.error(error instanceof Error?error.message:String(error));
 process.exitCode=1;
}finally{await pool.end()}
