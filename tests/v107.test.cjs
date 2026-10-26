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
 if(name.startsWith('.')){const rel=path.relative(base,path.resolve(path.dirname(file),name)).split(path.sep).join('/')+'.ts';if(rel==='src/lib/database.ts')return {getDatabase:()=>database};if(rel.replace(/\\\\/g,'/')==='src/lib/auth-adapter.ts')return {getAuthAdapter:()=>({getIdentity:async()=>identity})};return load(rel);}
 return require(require.resolve(name,{paths:[base]}));};new Function('require','module','exports',src)(requireLocal,mod,mod.exports);return mod.exports;}


(async()=>{const pg=new PGlite();database={query:(sql,params=[])=>pg.query(sql,params)};
for(const file of ['schema.sql','community.sql','messaging.sql','v41.sql'])await pg.exec(fs.readFileSync(base+'/db/'+file,'utf8'));
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222',third='33333333-3333-4333-8333-333333333333';
for(const id of [alice,bob,third])await pg.query("insert into members(id,email,display_name,nickname,parcel_private,approved,role) values($1,$2,'Member','Member','PRIVATE',true,'member')",[id,id+'@test.invalid']);
const chat=load('src/app/api/chat/photo/route.ts'),dm=load('src/app/api/messages/photo/route.ts'),overview=load('src/app/api/personal-overview/route.ts'),rsvp=load('src/app/api/event-rsvps/route.ts');
const request=(url,opts={})=>new Request('https://www.veli-joze.eu'+url,opts);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBTkAAAAASUVORK5CYII=','base64');
const upload=(url,target,value,bytes=png)=>{const f=new FormData();f.set(target,value);f.set('photo',new File([bytes],'test.png',{type:'image/png'}));return request(url,{method:'POST',body:f})};
assert.equal((await chat.GET(request('/api/chat/photo?id='+alice))).status,401);
identity={id:alice,approved:true,role:'member'};
assert.equal((await chat.POST(upload('/api/chat/photo','room','bad'))).status,400);
assert.equal((await chat.POST(upload('/api/chat/photo','room','general',Buffer.from('fake')))).status,400);
let res=await chat.POST(upload('/api/chat/photo','room','general'));assert.equal(res.status,201);const cid=(await res.json()).data.id;
res=await chat.GET(request('/api/chat/photo?id='+cid));assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),'image/png');
await pg.query('update chat_messages set deleted_at=now() where id=$1',[cid]);assert.equal((await chat.GET(request('/api/chat/photo?id='+cid))).status,404);
res=await dm.POST(upload('/api/messages/photo','peer',bob));assert.equal(res.status,201);const mid=(await res.json()).data.id;
identity={id:third,approved:true,role:'member'};assert.equal((await dm.GET(request('/api/messages/photo?id='+mid))).status,404);
identity={id:bob,approved:true,role:'member'};assert.equal((await dm.GET(request('/api/messages/photo?id='+mid))).status,200);
await pg.query('insert into direct_message_blocks(blocker_id,blocked_id) values($1,$2)',[bob,alice]);
identity={id:alice,approved:true,role:'member'};assert.equal((await dm.POST(upload('/api/messages/photo','peer',bob))).status,403);
await pg.query('update direct_messages set hidden_at=now() where id=$1',[mid]);assert.equal((await dm.GET(request('/api/messages/photo?id='+mid))).status,404);
const event='44444444-4444-4444-8444-444444444444';await pg.query("insert into events(id,title,event_date,event_time,location,description,author_id) values($1,'Future event',current_date+2,'20:00','Camp','Test event',$2)",[event,alice]);
const post=going=>request('/api/event-rsvps',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:event,going})});
assert.equal((await rsvp.POST(post(true))).status,200);let data=await (await overview.GET(request('/api/personal-overview'))).json();assert.equal(data.event.going,true);
assert.equal((await rsvp.POST(post(false))).status,200);data=await (await overview.GET(request('/api/personal-overview'))).json();assert.equal(data.event.going,false);
identity={id:bob,approved:true,role:'member'};assert.equal(data.unread,0);
await pg.query('delete from direct_message_blocks');const normal=load('src/app/api/messages/route.ts');await normal.POST(request('/api/messages',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({peer:alice,body:'Hello'})}));
identity={id:alice,approved:true,role:'member'};data=await (await overview.GET(request('/api/personal-overview'))).json();assert.equal(data.unread,1);
const db=database;database={query:async()=>{throw Error('offline')}};assert.equal((await dm.POST(upload('/api/messages/photo','peer',bob))).status,503);database=db;
await pg.close();console.log('1.0.7 integration checks passed: photo permissions, deletion, blocking, invalid files, events, unread overview, database errors');
})().catch(e=>{console.error(e);process.exit(1)});
