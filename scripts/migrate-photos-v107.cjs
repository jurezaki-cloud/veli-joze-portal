/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS executable entry point. */
const {Pool}=require('pg');
module.exports=async function migratePhotos(){
 if(!process.env.DATABASE_URL)return;
 const pool=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000,statement_timeout:5000,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:true}});
 try{await pool.query('alter table chat_messages add column if not exists image bytea check(octet_length(image)<=5242880); alter table direct_messages add column if not exists image bytea check(octet_length(image)<=5242880)');await pool.query('alter table events add column if not exists cover_photo_id uuid');await pool.query(require('fs').readFileSync(require('path').join(__dirname,'../db/v46.sql'),'utf8'));await pool.query(require('fs').readFileSync(require('path').join(__dirname,'../db/v130.sql'),'utf8'));await pool.query(require('fs').readFileSync(require('path').join(__dirname,'../db/v190.sql'),'utf8'));console.log('[VJ190] Portal schema ready')}
 catch(error){console.error('[VJ107] Photo schema unavailable:',error.message)}finally{await pool.end()}
};
