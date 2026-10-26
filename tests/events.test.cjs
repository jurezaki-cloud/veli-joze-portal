/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS loader isolates API dependencies for integration tests. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..'), ts=require(base+'/node_modules/typescript');
const {PGlite}=require('@electric-sql/pglite');
let identity=null;const modules=new Map();let database;
function load(file){file=path.resolve(base,file);if(modules.has(file))return modules.get(file).exports;const mod={exports:{}};modules.set(file,mod);const src=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const requireLocal=name=>{
 if(name==='@/lib/database')return {getDatabase:()=>database};
 if(name==='@/lib/auth-adapter')return {getAuthAdapter:()=>({getIdentity:async()=>identity})};
 if(name==='@/lib/rate-limit')return {rateLimit:async()=>null};
 if(name.startsWith('@/'))return load('src/'+name.slice(2)+'.ts');
 if(name.startsWith('.')){const rel=path.relative(base,path.resolve(path.dirname(file),name))+'.ts';if(rel==='src/lib/database.ts')return {getDatabase:()=>database};if(rel.replace(/\\\\/g,'/')==='src/lib/auth-adapter.ts')return {getAuthAdapter:()=>({getIdentity:async()=>identity})};return load(rel);}
 return require(require.resolve(name,{paths:[base]}));};new Function('require','module','exports',src)(requireLocal,mod,mod.exports);return mod.exports;}
let checks=0;function pass(name){checks++;console.log('PASS',name)}
(async()=>{
const pg=new PGlite();database={query:(sql,params=[])=>pg.query(sql,params)};
for(const file of ['schema.sql','gallery.sql','v110.sql','community.sql','v41.sql'])await pg.exec(fs.readFileSync(base+'/db/'+file,'utf8'));
const member='11111111-1111-4111-8111-111111111111',pending='22222222-2222-4222-8222-222222222222',moderator='33333333-3333-4333-8333-333333333333',event='44444444-4444-4444-8444-444444444444',old='55555555-5555-4555-8555-555555555555',removed='66666666-6666-4666-8666-666666666666';
for(const id of [member,pending,moderator])await pg.query("insert into members(id,email,display_name,nickname,parcel_private,approved,role) values($1,$2,'Hidden fallback','Public nickname','SECRET PARCEL',$3,$4)",[id,id+'@test.invalid',id!==pending,id===moderator?'moderator':'member']);
for(const id of [event,old,removed])await pg.query("insert into events(id,title,event_date,event_time,location,description,author_id) values($1,'Test; dogodek','2099-01-02','21:00','Kamp, Savudrija',E'Opis\\nNaslednja vrstica',$2)",[id,moderator]);
await pg.query("update events set event_date=((now()-interval '1 minute') at time zone 'Europe/Zagreb')::date,event_time=((now()-interval '1 minute') at time zone 'Europe/Zagreb')::time where id=$1",[old]);await pg.query('update events set archived_at=now() where id=$1',[removed]);
const rsvp=load('src/app/api/event-rsvps/route.ts'),events=load('src/app/api/events/route.ts'),calendar=load('src/app/api/events/[id]/calendar/route.ts');
const req=(path,body)=>new Request('https://www.veli-joze.eu'+path,{method:body?'POST':'GET',...(body?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});
const as=id=>{identity=id?{id,approved:id!==pending,role:id===moderator?'moderator':'member'}:null};
const join=(id,going=true)=>rsvp.POST(req('/api/event-rsvps',{id,going}));
as(null);let feed=await (await events.GET(req('/api/events'))).json();assert.deepEqual(feed.data.map(x=>x.id),[event]);assert.equal((await rsvp.GET(req('/api/event-rsvps'))).status,401);assert.equal((await join(event)).status,401);pass('public sees upcoming event; guest cannot access private participation');
as(pending);assert.equal((await rsvp.GET(req('/api/event-rsvps'))).status,403);assert.equal((await join(event)).status,403);pass('pending member cannot join or view participants');
as(member);assert.equal((await join(event)).status,200);assert.equal((await join(event)).status,200);let response=await rsvp.GET(req('/api/event-rsvps'));assert.match(response.headers.get('cache-control'),/no-store/);feed=await response.json();assert.equal(feed.data[0].going_count,1);assert.equal(feed.data[0].going,true);assert.equal(feed.data.length,1);pass('one registration per member and private future-only personal list');
await pg.query('insert into event_rsvps(event_id,member_id) values($1,$2)',[event,pending]);response=await rsvp.GET(req('/api/event-rsvps?event='+event));const people=await response.json();assert.equal(people.data.length,1);assert.equal(people.data[0].name,'Public nickname');for(const hidden of ['SECRET PARCEL','@test.invalid','Hidden fallback'])assert.ok(!JSON.stringify(people).includes(hidden));assert.equal((await (await rsvp.GET(req('/api/event-rsvps'))).json()).data[0].going_count,1);pass('only approved members and chosen public names exposed, count matches');
assert.equal((await rsvp.GET(req('/api/event-rsvps?event=bad'))).status,400);assert.equal((await rsvp.GET(req('/api/event-rsvps?event='))).status,400);assert.equal((await rsvp.GET(req('/api/event-rsvps?event='+member))).status,404);pass('invalid and missing events return explicit errors');
for(const id of [old,removed]){assert.equal((await join(id)).status,409);assert.equal((await rsvp.GET(req('/api/event-rsvps?event='+id))).status,404)}pass('started and removed events reject participation and attendee access');
assert.equal((await events.GET(req('/api/events?archived=1'))).status,403);as(moderator);feed=await (await events.GET(req('/api/events?archived=1'))).json();assert.equal(feed.data.length,2);assert.ok(feed.data.some(x=>x.id===old));pass('moderator archive includes event started today');
as(null);response=await calendar.GET(req('/api/events/'+event+'/calendar'),{params:Promise.resolve({id:event})});assert.equal(response.status,200);const text=(await response.text()).replace(/\r\n[ \t]/g,'');assert.ok(text.includes('DTSTART:20990102T200000Z'));assert.ok(text.includes('TRIGGER:-PT1H'));assert.ok(text.includes('#event-'+event));assert.ok(text.includes('SUMMARY:Test\\; dogodek'));assert.ok(text.includes('LOCATION:Kamp\\, Savudrija'));assert.ok(text.endsWith('\r\n'));pass('public calendar has local timezone, direct event link, escaping and reminder');
response=await calendar.GET(req('/api/events/'+removed+'/calendar'),{params:Promise.resolve({id:removed})});assert.equal(response.status,404);pass('removed event has no downloadable calendar');
as(member);assert.equal((await join(event,false)).status,200);assert.equal((await join(event,false)).status,200);assert.equal((await (await rsvp.GET(req('/api/event-rsvps'))).json()).data[0].going,false);pass('cancellation is repeatable and removes personal event');
const foreign=new Request('https://www.veli-joze.eu/api/event-rsvps',{method:'POST',headers:{Origin:'https://outside.invalid','content-type':'application/json'},body:JSON.stringify({id:event,going:true})});assert.equal((await rsvp.POST(foreign)).status,403);pass('foreign origin denied');
const actual=database;database={query:async()=>{throw Error('unavailable')}};assert.equal((await rsvp.GET(req('/api/event-rsvps'))).status,503);assert.equal((await events.GET(req('/api/events'))).status,503);database=actual;pass('service errors are JSON responses');
await pg.close();console.log(checks+' event checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
