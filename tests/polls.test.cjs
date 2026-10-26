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
const pg=new PGlite();database={query:async(sql,params=[])=>{try{return await pg.query(sql,params)}catch(e){console.error("TEST SQL:",e.message);throw e}}};for(const f of ['schema.sql','v130.sql'])await pg.exec(fs.readFileSync(base+'/db/'+f,'utf8'));
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222',moderator='33333333-3333-4333-8333-333333333333';
for(const id of [alice,bob,moderator])await pg.query("insert into members(id,email,display_name,nickname,parcel_private,approved,role) values($1,$2,'Test','Test','PRIVATE',true,$3)",[id,id+'@test.invalid',id===moderator?'moderator':'member']);
const polls=load('src/app/api/polls/route.ts'),req=(method,body,path='/api/polls')=>new Request('https://www.veli-joze.eu'+path,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
const as=id=>{identity=id?{id,approved:true,role:id===moderator?'moderator':'member'}:null};
as(null);assert.equal((await polls.GET(req('GET'))).status,401);assert.equal((await polls.POST(req('POST',{question:'Kdaj se dobimo?',options:['Petek','Sobota']}))).status,401);pass('guest cannot see or create polls');
as(alice);assert.equal((await polls.POST(req('POST',{question:'Kdaj se dobimo?',options:['Petek','Sobota']}))).status,403);identity.approved=false;assert.equal((await polls.GET(req('GET'))).status,403);pass('only approved members vote; only moderators create');
as(moderator);for(const options of [['Same','same'],['Only'],Array(7).fill('Choice')])assert.equal((await polls.POST(req('POST',{question:'Kdaj se dobimo?',options}))).status,400);pass('unique choices and limits enforced');
const created=await polls.POST(req('POST',{question:'Kdaj se dobimo?',options:['Petek','Sobota','Nedelja']}));assert.equal(created.status,201);const id=(await created.json()).id;
let feed=await (await polls.GET(req('GET'))).json();assert.equal(feed.data[0].total,0);assert.equal(feed.data[0].options.length,3);const opts=feed.data[0].options;pass('moderator creates poll with zero votes');
const vote=(option,idOverride=id)=>req('PATCH',{action:'vote',id:idOverride,option});
as(alice);assert.equal((await polls.PATCH(vote(opts[0].id))).status,200);assert.equal((await polls.PATCH(vote(opts[0].id))).status,200);assert.equal((await pg.query('select count(*)::int n from community_poll_votes')).rows[0].n,1);pass('repeated vote counts only once');
assert.equal((await polls.PATCH(vote(opts[1].id))).status,200);feed=await (await polls.GET(req('GET'))).json();assert.equal(feed.data[0].total,1);assert.equal(feed.data[0].voted_option,opts[1].id);assert.equal(feed.data[0].options[0].votes,0);assert.equal(feed.data[0].options[1].votes,1);pass('changing vote moves count without adding voter');
as(bob);assert.equal((await polls.PATCH(vote(opts[0].id))).status,200);feed=await (await polls.GET(req('GET'))).json();assert.equal(feed.data[0].total,2);assert.equal(feed.data[0].voted_option,opts[0].id);assert.equal(feed.data[0].options.reduce((s,o)=>s+o.votes,0),2);assert.ok(!JSON.stringify(feed).includes(alice));pass('own choice and anonymous totals only');
assert.equal((await polls.PATCH(vote(alice))).status,409);assert.equal((await polls.PATCH(vote('bad'))).status,400);assert.equal((await polls.PATCH(req('PATCH',{action:'close',id}))).status,403);pass('invalid choices and member closing denied');
const cross=new Request('https://www.veli-joze.eu/api/polls',{method:'PATCH',headers:{Origin:'https://other.invalid','Content-Type':'application/json'},body:JSON.stringify({action:'vote',id,option:opts[2].id})});assert.equal((await polls.PATCH(cross)).status,403);pass('foreign origin denied');
as(moderator);assert.equal((await polls.PATCH(req('PATCH',{action:'close',id}))).status,200);assert.equal((await polls.PATCH(req('PATCH',{action:'close',id}))).status,409);pass('moderator closes poll once');
as(alice);assert.equal((await polls.PATCH(vote(opts[2].id))).status,409);assert.equal((await (await polls.GET(req('GET'))).json()).data.length,0);feed=await (await polls.GET(req('GET',null,'/api/polls?closed=1'))).json();assert.equal(feed.data[0].total,2);assert.equal(feed.data[0].voted_option,opts[1].id);pass('closed poll rejects voting and preserves archived results');
await pg.exec(fs.readFileSync(base+'/db/v130.sql','utf8'));assert.equal((await pg.query('select count(*)::int n from community_poll_votes')).rows[0].n,2);pass('repeat migration preserves votes');
await pg.query('delete from members where id=$1',[moderator]);assert.equal((await pg.query('select author_id from community_polls where id=$1',[id])).rows[0].author_id,null);await pg.query('delete from members where id=$1',[bob]);assert.equal((await pg.query('select count(*)::int n from community_poll_votes')).rows[0].n,1);pass('account deletion removes own votes and preserves poll');
const actual=database;database={query:async()=>{throw Error('unavailable')}};assert.equal((await polls.GET(req('GET'))).status,503);assert.equal((await polls.PATCH(vote(opts[0].id))).status,503);database=actual;pass('database failures return JSON');
await pg.close();console.log(checks+' poll checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
