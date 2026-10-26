/* eslint-disable @typescript-eslint/no-require-imports -- Isolated loader exercises route code with real SQL and signed sessions. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..'),ts=require('typescript'),{PGlite}=require('@electric-sql/pglite');
let database,jose,mailReady=true,mailFail=false;const sent=[],delivered=[],modules=new Map();
function load(file){file=path.resolve(base,file);if(modules.has(file))return modules.get(file).exports;const mod={exports:{}};modules.set(file,mod);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const local=name=>{if(name==='jose')return jose;if(name==='@/lib/database'||(name.startsWith('.')&&path.resolve(path.dirname(file),name)==base+'/src/lib/database'))return {getDatabase:()=>database};if(name==='@/lib/rate-limit')return {rateLimit:async()=>null};if(name==='@/lib/account-email'||(name.startsWith('.')&&path.resolve(path.dirname(file),name)===base+'/src/lib/account-email'))return {emailReady:()=>mailReady,sendPortalEmail:async(email,subject,body)=>{if(mailFail)throw Error("mail failure");delivered.push({email,subject,body})},sendAccountEmail:async(email,purpose,token)=>{if(mailFail)throw Error('mail');sent.push({email,purpose,token})}};if(name.startsWith('@/'))return load('src/'+name.slice(2)+'.ts');if(name.startsWith('.'))return load(path.relative(base,path.resolve(path.dirname(file),name))+'.ts');return require(require.resolve(name,{paths:[base]}))};new Function('require','module','exports',code)(local,mod,mod.exports);return mod.exports;}

let checks=0;const pass=name=>{checks++;console.log('PASS',name)};
(async()=>{
 jose=await import('jose');process.env.AUTH_SECRET='message-alert-test-secret-with-more-than-32-chars';
 const pg=new PGlite();database={query:(sql,args=[])=>pg.query(sql,args)};
 for(const schema of ['schema','community','gallery','messaging'])await pg.exec(fs.readFileSync(base+'/db/'+schema+'.sql','utf8'));
 const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
 for(const id of ids)await pg.query("insert into members(id,email,display_name,nickname,parcel_private,approved) values($1,$2,'A name','Sender','Secret parcel',true)",[id,id+'@example.test']);
 const auth=load('src/lib/auth-adapter.ts'),api=load('src/app/api/messages/summary/route.ts'),dm=load('src/app/api/messages/route.ts');
 const tokens={};for(const id of ids)tokens[id]=await auth.createSessionToken({id,email:id+'@example.test',role:'member',approved:true});
 const req=(path,member,method='GET',body)=>new Request('https://www.veli-joze.eu'+path,{method,headers:{'content-type':'application/json',...(member?{cookie:'vj_session='+tokens[member]}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const summary=async id=>{const r=await api.GET(req('/api/messages/summary',id));assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);return r.json()};
 assert.equal((await api.GET(req('/api/messages/summary'))).status,401);assert.equal((await summary(ids[0])).unread,0);pass('anonymous summary denied; approved recipient starts empty');
 const sent=await dm.POST(req('/api/messages',ids[0],'POST',{peer:ids[1],body:'SECRET MESSAGE BODY'}));assert.equal(sent.status,201);const message=(await sent.json()).data;
 const received=await summary(ids[1]);assert.equal(received.ownId,ids[1]);assert.equal(received.unread,1);assert.equal(received.latest[0].id,message.id);assert.equal(received.latest[0].sender_id,ids[0]);assert.equal(received.latest[0].sender_name,'Sender');const text=JSON.stringify(received);for(const hidden of ['SECRET MESSAGE BODY','Secret parcel','@example.test'])assert.ok(!text.includes(hidden));pass('summary has sender and unread count without body, email or parcel');
 assert.equal((await summary(ids[0])).unread,0);assert.equal((await summary(ids[2])).unread,0);assert.equal((await (await api.GET(req('/api/messages/summary?member='+ids[1],ids[2]))).json()).unread,0);pass('sender and unrelated member cannot see recipient alerts or impersonate via query');
 assert.equal((await dm.PATCH(req('/api/messages',ids[1],'PATCH',{action:'read',peer:ids[0],ids:[message.id]}))).status,200);assert.equal((await summary(ids[1])).unread,0);pass('reading conversation clears summary immediately');
 for(let i=0;i<25;i++)await pg.query('insert into direct_messages(id,sender_id,recipient_id,body) values($1,$2,$3,$4)',[crypto.randomUUID(),ids[0],ids[1],'body '+i]);
 const many=await summary(ids[1]);assert.equal(many.unread,25);assert.equal(many.latest.length,20);await pg.query('update direct_messages set hidden_at=now() where id=$1',[many.latest[0].id]);assert.equal((await summary(ids[1])).unread,24);pass('count includes all unread, samples bounded, hidden messages excluded');
 await pg.query('update members set approved=false where id=$1',[ids[1]]);assert.equal((await api.GET(req('/api/messages/summary',ids[1]))).status,403);await pg.query('update members set approved=true,blocked_permanent=true where id=$1',[ids[1]]);assert.equal((await api.GET(req('/api/messages/summary',ids[1]))).status,401);pass('pending and blocked memberships have no message-summary access');
 const {MessageAlertTracker}=load('src/lib/message-alerts.ts'),tracker=new MessageAlertTracker();
 const m=(id,sender='alice')=>({id,sender_id:sender,sender_name:'Tanja',created_at:'2026-10-06T12:00:00Z'}),s=(latest,owner='bob')=>({ownId:owner,unread:latest.length,latest});
 assert.equal(tracker.consume(s([])),null);const first=tracker.consume(s([m('1')]));assert.match(first.title,/Tanja/);assert.equal(first.href,'/sporocila?peer=alice');assert.equal(tracker.consume(s([m('1')])),null);pass('new message alerts once and links to sender');
 tracker.consume(s([]));assert.ok(tracker.consume(s([m('2')])));assert.equal(tracker.consume(s([m('2')])),null);pass('new ID alerts even if unread total stays the same');
 assert.equal(tracker.consume(s([m('3')]),'alice'),null);assert.equal(tracker.consume(s([m('3')])),null);assert.ok(tracker.consume(s([m('4','third'),m('3')]),'alice'));pass('active conversation suppressed while different sender still alerts');
 tracker.reset();assert.match(tracker.consume(s([m('5'),m('6')])).title,/2 neprebranih/);assert.equal(tracker.consume(s([m('5'),m('6')])),null);assert.ok(tracker.consume(s([m('5')],'another-account')));pass('initial unread reminder aggregates and account switch resets deduplication');
 console.log(checks+' message alert checks passed');await pg.close();
})().catch(e=>{console.error(e);process.exitCode=1});
