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
for(const f of ['schema.sql','community.sql','v42.sql'])await pg.exec(fs.readFileSync(base+'/db/'+f,'utf8'));
const member='11111111-1111-4111-8111-111111111111',pending='22222222-2222-4222-8222-222222222222';
for(const id of [member,pending])await pg.query("insert into members(id,email,display_name,nickname,parcel_private,approved) values($1,$2,'PRIVATE NAME','PRIVATE NICK','SECRET PARCEL',$3)",[id,id+'@test.invalid',id===member]);
const id=()=>crypto.randomUUID();
for(const archived of [false,true])await pg.query("insert into announcements(id,title,type,content,author_id,archived_at) values($1,$2,'info','Jože in Savudrija na obali',$3,$4)",[id(),archived?'SECRET HIDDEN Jože':'Jože',member,archived?new Date():null]);
for(const hidden of [false,true])await pg.query("insert into events(id,title,event_date,event_time,location,description,author_id) values($1,$2,$3,'21:00','Savudrija','Jože v kampu',$4)",[id(),hidden?'SECRET OLD Jože':'Jože dogodek',hidden?'2000-01-01':'2099-01-01',member]);
for(const [status,author,title] of [['approved',member,'Jože kolo'],['pending',member,'SECRET PENDING Jože'],['rejected',member,'SECRET REJECTED Jože'],['approved',pending,'SECRET UNAPPROVED Jože']])await pg.query("insert into listings(id,author_id,title,category,description,status,price) values($1,$2,$3,'Šport','Kolo je v Savudriji pri morju',$4,'30 €')",[id(),author,title,status]);
for(const [board,kind,status,author,title] of [['help','offer','open',member,'Jože pomoč'],['lost-found','lost','resolved',member,'Jože ključi'],['help','need','archived',member,'SECRET ARCHIVED Jože'],['help','need','open',pending,'SECRET MEMBER Jože']])await pg.query('insert into community_posts(id,author_id,board,kind,title,description,location,status) values($1,$2,$3,$4,$5,$6,$7,$8)',[id(),author,board,kind,title,'Jože v Savudriji prosi za pomoč','Savudrija',status]);
const search=load('src/app/api/search/route.ts'),helper=load('src/lib/portal-search.ts');
const req=(q,extra={})=>new Request('https://www.veli-joze.eu/api/search?'+new URLSearchParams({q,...extra}));
const as=user=>{identity=user?{id:user,approved:user!==pending,role:'member'}:null};
as(null);assert.equal((await search.GET(req('Jože'))).status,401);as(pending);assert.equal((await search.GET(req('Jože'))).status,403);pass('search requires approved membership');
as(member);for(const q of ['', 'a','a'.repeat(81),Array(11).fill('aa').join(' '),'ab\0cd'])assert.equal((await search.GET(req(q))).status,400);for(const extra of [{category:'secret'},{page:'-1'},{page:'1.2'},{page:'50'}])assert.equal((await search.GET(req('Jože',extra))).status,400);pass('input length, word count, controls and pagination validated');
let response=await search.GET(req('Jože'));assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private/);assert.match(response.headers.get('cache-control'),/no-store/);let feed=await response.json();assert.equal(feed.data.length,5);assert.deepEqual(new Set(feed.data.map(x=>x.kind)),new Set(['announcement','event','listing','help','lost-found']));pass('five content kinds searchable with private cache headers');
const raw=JSON.stringify(feed);for(const hidden of ['SECRET','PRIVATE NAME','PRIVATE NICK','@test.invalid','parcel_private','author_id','image'])assert.ok(!raw.includes(hidden));pass('hidden content, personal data and image bytes excluded');
assert.equal(feed.data[0].title,'Jože');pass('exact title ranks ahead of newer partial matches');
const without=await (await search.GET(req('joze'))).json();assert.deepEqual(without.data.map(x=>x.id),feed.data.map(x=>x.id));pass('Slovenian query matches with or without diacritics');
for(const category of ['announcement','event','listing','help','lost-found']){const filtered=await (await search.GET(req('Jože',{category}))).json();assert.equal(filtered.data.length,1);assert.equal(filtered.data[0].kind,category)}pass('category filters return only requested section');
feed=await (await search.GET(req('kolo Savudriji'))).json();assert.equal(feed.data.length,1);assert.equal(feed.data[0].kind,'listing');assert.equal((await (await search.GET(req('Savudriji kolo'))).json()).data.length,1);assert.equal((await (await search.GET(req('kolo neobstaja'))).json()).data.length,0);pass('all words match across title and body regardless of order');
await pg.query("insert into announcements(id,title,type,content,author_id) values($1,'%_ literal','info','Literal characters in notice',$2)",[id(),member]);assert.equal((await (await search.GET(req('%_'))).json()).data.length,1);assert.equal((await (await search.GET(req("' OR true --"))).json()).data.length,0);pass('SQL and wildcard characters treated literally');
for(let n=0;n<25;n++)await pg.query("insert into announcements(id,title,type,content,author_id) values($1,$2,'info','Besedilo objave za strani',$3)",[id(),'Stranprimer '+n,member]);const first=await (await search.GET(req('Stranprimer'))).json(),second=await (await search.GET(req('Stranprimer',{page:'1'}))).json();assert.equal(first.data.length,20);assert.equal(first.hasMore,true);assert.equal(second.data.length,5);assert.equal(second.hasMore,false);assert.equal(new Set([...first.data,...second.data].map(x=>x.id)).size,25);pass('pagination returns all records without overlap');
feed=await (await search.GET(req('  JOŽE   ',{category:'announcement'}))).json();assert.equal(feed.query,'JOŽE');assert.equal(feed.data.length,1);pass('case and extra whitespace normalized');
const body='Predgovor '.repeat(40)+'IZGUBLJENI KLJUČI so pri recepciji.';assert.ok(helper.searchExcerpt(body,'kljuci').includes('KLJUČI'));assert.ok(helper.searchExcerpt(body,'kljuci').startsWith('…'));assert.equal(helper.normalizeSearch('ČŠŽĐ'),'cszd');pass('excerpt focuses on matching text and normalization supports camp names');
const actual=database;database={query:async()=>{throw Error('unavailable')}};assert.equal((await search.GET(req('Jože'))).status,503);database=actual;pass('database failure returns JSON');
await pg.close();console.log(checks+' search checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
