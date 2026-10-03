import {Pool} from "pg";
export type DbQueryResult<T>={rows:T[]};
export interface DatabaseAdapter{
 query<T=unknown>(sql:string,params?:unknown[]):Promise<DbQueryResult<T>>;
}
class DisabledDatabaseAdapter implements DatabaseAdapter{
 async query<T>():Promise<DbQueryResult<T>>{throw new Error("Production database adapter is not configured.");}
}
class PostgresDatabaseAdapter implements DatabaseAdapter{
 constructor(private pool:Pool){}
 async query<T=unknown>(sql:string,params:unknown[]=[]):Promise<DbQueryResult<T>>{
  const result=await this.pool.query(sql,params);
  return {rows:result.rows as T[]};
 }
}
let pool:Pool|undefined;
function getPool(){
 if(!pool){
  const connectionString=process.env.DATABASE_URL;
  if(!connectionString)throw new Error("DATABASE_URL is not configured.");
  pool=new Pool({connectionString,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:5000,ssl:process.env.DATABASE_SSL==="false"?false:{rejectUnauthorized:true}});
 }
 return pool;
}
export function getDatabase():DatabaseAdapter{
 if(!process.env.DATABASE_URL)return new DisabledDatabaseAdapter();
 return new PostgresDatabaseAdapter(getPool());
}
export async function checkDatabaseConnection(){
 if(!process.env.DATABASE_URL)return false;
 try{await getPool().query("select 1 as ok");return true}catch{return false}
}