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

let checks=0;const pass=name=>{checks++;console.log('PASS',name)};
(async()=>{
 const pg=new PGlite();database={query:async(sql,params=[])=>pg.query(sql,params)};
 await pg.exec(fs.readFileSync(base+'/db/schema.sql','utf8'));
 await pg.exec('alter table chat_messages add column if not exists image bytea');
 const member='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
 for(const [id,role] of [[member,'member'],[other,'moderator']])await pg.query("insert into members(id,email,display_name,nickname,parcel_private,role,approved) values($1,$2,'Test','Sosed','PRIVATE',$3,true)",[id,id+'@example.test',role]);
 const route=load('src/app/api/chat/route.ts'),req=(url,opts={})=>new Request('https://www.veli-joze.eu'+url,opts),write=(method,body,origin)=>req('/api/chat',{method,headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
 identity=null;assert.equal((await route.GET(req('/api/chat?room=general'))).status,401);assert.equal((await route.POST(write('POST',{room:'general',body:'Hi'}))).status,401);pass('guests cannot read or send chat');
 identity={id:member,email:'test',role:'member',approved:false};assert.equal((await route.POST(write('POST',{room:'general',body:'Hi'}))).status,403);pass('pending members cannot write');
 identity={id:member,email:'test',role:'member',approved:true};assert.equal((await route.POST(write('POST',{room:'general',body:'Hi'},'https://outside.example'))).status,403);assert.equal((await route.POST(write('POST',{room:'invalid',body:'Hi'}))).status,400);assert.equal((await route.POST(write('POST',{room:'general',body:' '}))).status,400);assert.equal((await route.POST(write('POST',{room:'general',body:'x'.repeat(501)}))).status,400);pass('origin, room and message length validated');
 // Reproduce a legacy table: inserts work, but reads fail without deleted_at.
 await pg.query('alter table chat_messages drop column deleted_at');
 const original=await route.POST(write('POST',{room:'general',body:'Sporočilo pred popravilom'}));assert.equal(original.status,201);const originalId=(await original.json()).data.id;
 assert.equal((await route.GET(req('/api/chat?room=general'))).status,503);pass('legacy missing column reproduces save-with-empty-history error');
 await pg.exec(fs.readFileSync(base+'/db/chat.sql','utf8'));await pg.exec(fs.readFileSync(base+'/db/chat.sql','utf8'));
 const repaired=await route.GET(req('/api/chat?room=general'));assert.equal(repaired.status,200);assert.equal(repaired.headers.get('cache-control'),'private, no-store');assert.equal((await repaired.json()).data[0].id,originalId);pass('repeatable repair restores existing history without removing messages');
 for(const room of ['general','social','help','market','lost-found']){
  const posted=await route.POST(write('POST',{room,body:'Shranjeno sporočilo: '+room}));assert.equal(posted.status,201);const data=(await posted.json()).data;assert.equal(data.room,room);assert.equal(data.author,'Sosed');assert.equal(data.mine,true);assert.ok(!('authorId' in data));
  identity={id:other,email:'other',role:'moderator',approved:true};const read=await (await route.GET(req('/api/chat?room='+room))).json();assert.ok(read.data.some(x=>x.id===data.id&&x.body===data.body&&!x.mine));assert.ok(read.data.every(x=>x.room===room));identity={id:member,email:'test',role:'member',approved:true};
 }pass('all five rooms persist independently and are visible to another member');
 const reopened=await (await route.GET(req('/api/chat?room=general'))).json();assert.equal(reopened.data.length,2);assert.equal(reopened.data[0].id,originalId);assert.ok(!JSON.stringify(reopened).includes('PRIVATE'));pass('fresh request restores history in chronological order without private parcel');
 assert.equal((await route.DELETE(write('DELETE',{id:originalId}))).status,403);identity={id:other,email:'other',role:'moderator',approved:true};assert.equal((await route.DELETE(write('DELETE',{id:originalId}))).status,200);assert.equal((await route.DELETE(write('DELETE',{id:originalId}))).status,404);assert.equal((await pg.query("select * from moderation_actions where target_type='message'")).rows.length,1);assert.ok(!(await (await route.GET(req('/api/chat?room=general'))).json()).data.some(x=>x.id===originalId));pass('moderator soft removal and audit are atomic and idempotent');
 const saved=database;database={query:async()=>{throw new Error('db down')}};assert.equal((await route.GET(req('/api/chat?room=general'))).status,503);assert.equal((await route.POST(write('POST',{room:'general',body:'Ne shrani'}))).status,503);database=saved;pass('database failure is explicit and never reports successful save');
 await pg.close();console.log(checks+' chat checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
