/* eslint-disable @typescript-eslint/no-require-imports -- Node startup script. */
// Idempotent publication explicitly requested by the portal owner on 04-10-2026.
const path = require('node:path');
async function publish(runtime) {
 if (!process.env.DATABASE_URL) { console.error('V17: baza ni nastavljena; objavi še nista dodani.'); return; }
 const {Pool} = require(path.join(runtime, 'node_modules/pg'));
 const pool = new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:true}});
 let client;
 try {
  client=await pool.connect(); await client.query('begin');
  await client.query('insert into announcements(id,title,type,content,author_id) values($1,$2,$3,$4,null) on conflict(id) do nothing',[
   'd0a4e6c2-8591-4bfa-94ea-b937657a4210',
   'Prekinitev oskrbe z vodo v rumeni coni – 04. 10. 2026',
   'Opozorilo',
   'Uprava kampa obvešča, da danes, 04. 10. 2026, v rumeni coni med 10.00 in 14.00 ne bo vode. Hvala za razumevanje.'
  ]);
  await client.query('insert into events(id,title,event_date,event_time,location,description,author_id) values($1,$2,$3,$4,$5,$6,null) on conflict(id) do nothing',[
   '8f051afe-e59f-4e86-b5fa-5f8dff530810',
   'Ribniška noč z DJ Mehanikom', '2026-10-15', '22:00', 'Kamp Veli Jože',
   'Ribniška noč z DJ Mehanikom bo 15. 10. 2026 od 22.00 dalje v kampu Veli Jože.'
  ]);
  await client.query('commit');console.log('V17: obvestilo in dogodek sta dodana (brez podvajanja).');
 } catch { if(client)await client.query('rollback').catch(()=>{});console.error('V17: objavi nista dodani; preverite povezavo in tabele baze.'); }
 finally {if(client)client.release();await pool.end();}
}
module.exports={publish};
