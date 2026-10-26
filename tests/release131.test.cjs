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


(async()=>{
const pg=new PGlite();database={query:async(sql,params=[])=>pg.query(sql,params)};
for(const file of ['schema','gallery','community','chat','profile','accounts','messaging','privacy','v41','v42','v46','v110','v130','v190'])await pg.exec(fs.readFileSync(base+'/db/'+file+'.sql','utf8'));
const own='11111111-1111-4111-8111-111111111111',peer='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333',key='44444444-4444-4444-8444-444444444444';
for(const id of [own,peer,other])await pg.query("insert into members(id,email,display_name,nickname,parcel_private,role,approved) values($1,$2,'Test','Sosed','PRIVATE','member',true)",[id,id+'@example.test']);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBTkAAAAASUVORK5CYII=','base64');
const upload=(kind,value,requestKey=key,bytes=png)=>{const f=new FormData();f.set(kind==='chat'?'room':'peer',value);f.set('photo',new File([bytes],'test.png',{type:'image/png'}));f.set('clientRequestId',requestKey);return new Request('https://www.veli-joze.eu/api/'+kind+'/photo',{method:'POST',headers:{Origin:'https://www.veli-joze.eu'},body:f})};
identity={id:own,role:'member',approved:true};
for(const [kind,target,table,hidden] of [['chat','general','chat_messages','deleted_at'],['messages',peer,'direct_messages','hidden_at']]){
 const route=load('src/app/api/'+kind+'/photo/route.ts');
 const responses=await Promise.all([route.POST(upload(kind,target)),route.POST(upload(kind,target))]);assert.deepEqual(responses.map(x=>x.status).sort(),[200,201]);
 const ids=await Promise.all(responses.map(async r=>(await r.json()).data.id));assert.equal(ids[0],ids[1]);assert.equal((await pg.query('select count(*)::int n from '+table)).rows[0].n,1);
 assert.equal((await route.POST(upload(kind,target))).status,200);
 assert.equal((await route.POST(upload(kind,kind==='chat'?'social':other))).status,409);
 assert.equal((await route.POST(upload(kind,target,key,Buffer.concat([png,Buffer.from('changed')])))).status,409);
 assert.equal((await route.POST(upload(kind,target,'bad'))).status,400);
 await pg.query('update '+table+' set '+hidden+'=now()');assert.equal((await route.POST(upload(kind,target))).status,409);
 console.log('PASS photo '+kind+': concurrent/lost-response retries, target/content conflicts, invalid keys and moderation');
}
await pg.exec('delete from direct_messages; delete from chat_messages');
const chat=load('src/app/api/chat/route.ts'),dm=load('src/app/api/messages/route.ts');
for(let i=1;i<=150;i++){
 const id='50000000-0000-4000-8000-'+String(i).padStart(12,'0');const time='2026-10-09T00:00:00.'+String(i).padStart(6,'0')+'Z';
 await pg.query("insert into chat_messages(id,author_id,room,body,created_at) values($1,$2,'help',$3,$4)",[id,own,'Message '+i,time]);
 await pg.query('insert into direct_messages(id,sender_id,recipient_id,body,created_at) values($1,$2,$3,$4,$5)',[id,own,peer,'Message '+i,time]);
}
const get=url=>new Request('https://www.veli-joze.eu'+url);
for(const [route,url] of [[chat,'/api/chat?room=help'],[dm,'/api/messages?peer='+peer]]){
 const first=await route.GET(get(url));assert.equal(first.status,200);assert.equal(first.headers.get('cache-control'),'private, no-store');const a=await first.json();assert.equal(a.data.length,100);assert.equal(a.hasMore,true);
 const second=await route.GET(get(url+'&before='+encodeURIComponent(a.nextCursor)));const b=await second.json();assert.equal(b.data.length,50);assert.equal(b.hasMore,false);assert.equal(b.nextCursor,null);
 const all=[...b.data,...a.data];assert.equal(new Set(all.map(x=>x.id)).size,150);assert.deepEqual(all.map(x=>x.body),Array.from({length:150},(_,i)=>'Message '+(i+1)));
 assert.equal((await route.GET(get(url+'&before=bad'))).status,400);
 console.log('PASS history: 150 records within one millisecond, no gaps/duplicates, chronological pages and bad cursor');
}
identity={id:other,role:'member',approved:true};const third=await dm.GET(get('/api/messages?peer='+peer));assert.equal((await third.json()).data.length,0);
identity=null;assert.equal((await chat.GET(get('/api/chat?room=help'))).status,401);assert.equal((await dm.GET(get('/api/messages?peer='+peer))).status,401);console.log('PASS guest and unrelated member history isolation');
identity={id:own,role:'member',approved:true};await pg.query('insert into direct_message_blocks(blocker_id,blocked_id) values($1,$2)',[peer,own]);assert.equal((await load('src/app/api/messages/photo/route.ts').POST(upload('messages',peer,'66666666-6666-4666-8666-666666666666'))).status,403);
console.log('PASS blocked recipient cannot receive a new photo');
const dates=load('src/lib/camp-date.ts');assert.match(dates.formatCampDate('2027-04-23'),/2027/);assert.equal(dates.formatCampDate('bad'),'Datum ni na voljo');
const history=load('src/lib/message-history.ts');const old=[{id:'a',createdAt:'2026-01-01T00:00:00.000000Z'},{id:'b',createdAt:'2026-01-01T00:00:00.000001Z'},{id:'c',createdAt:'2026-01-01T00:00:00.000002Z'}];assert.deepEqual(history.mergeMessageHistory(old,[{id:'c',createdAt:old[2].createdAt,body:'Updated'}],true).map(x=>x.id),['a','b','c']);assert.equal(history.mergeMessageHistory(old,[{id:'c',createdAt:old[2].createdAt,body:'Updated'}],true)[2].body,'Updated');assert.deepEqual(history.mergeMessageHistory(old,[],true),[]);
console.log('PASS event year and retained loaded history after latest-page refresh');
await pg.close();
})().catch(e=>{console.error(e);process.exitCode=1});
