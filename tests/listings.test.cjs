/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS loader isolates API dependencies for integration tests. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..'), ts=require(base+'/node_modules/typescript'),sharp=require(base+'/node_modules/sharp');
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
for(const f of ['schema.sql','gallery.sql','community.sql','messaging.sql','v41.sql','v42.sql','v46.sql'])await pg.exec(fs.readFileSync(base+'/db/'+f,'utf8'));
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',moderator='33333333-3333-4333-8333-333333333333';
for(const id of [owner,other,moderator])await pg.query("insert into members(id,email,display_name,nickname,parcel_private,approved,role) values($1,$2,'Test','Test','PRIVATE',true,$3)",[id,id+'@test.invalid',id===moderator?'moderator':'member']);
const listings=load('src/app/api/listings/route.ts'),media=load('src/app/api/listings/photo/route.ts'),admin=load('src/app/api/admin/listings/route.ts');
const req=(url,options={})=>new Request('https://www.veli-joze.eu'+url,options);
const as=id=>{identity=id?{id,approved:true,role:id===moderator?'moderator':'member'}:null};
const img=await sharp({create:{width:80,height:60,channels:3,background:'#008888'}}).withMetadata({exif:{IFD0:{Artist:'PRIVATE'}}}).jpeg().toBuffer();
const form=(id,count=0,bytes=img)=>{const f=new FormData();if(id)f.set('id',id);f.set('title','Oprema za kamp');f.set('category','Oprema');f.set('price','50 €');f.set('description','Lepo ohranjena oprema za kamp.');for(let i=0;i<count;i++)f.append('photos',new File([bytes],'photo.jpg',{type:'image/jpeg'}));return f};
const patch=(id,action,status)=>req('/api/listings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action,status})});
as(null);assert.equal((await listings.GET(req('/api/listings'))).status,401);pass('listing feed requires member');
as(owner);assert.equal((await listings.POST(req('/api/listings',{method:'POST',body:form(null,7)}))).status,400);assert.equal((await listings.POST(req('/api/listings',{method:'POST',body:form(null,1,Buffer.from('fake'))}))).status,400);pass('too many photos and fake images rejected');
assert.equal((await listings.POST(req('/api/listings',{method:'POST',headers:{Origin:'https://bad.invalid'},body:form(null,1)}))).status,403);pass('foreign origin denied');
assert.equal((await listings.POST(req('/api/listings',{method:'POST',body:form(null,6)}))).status,201);
const id=(await pg.query('select id from listings')).rows[0].id,photos=(await pg.query('select id,image from listing_photos order by sort_order')).rows;assert.equal(photos.length,5);
const metadata=await sharp(photos[0].image).metadata();assert.equal(metadata.format,'webp');assert.equal(metadata.exif,undefined);pass('six photos saved and normalized without EXIF');
let mine=await (await listings.GET(req('/api/listings?mine=1'))).json();assert.equal(mine.data.length,1);assert.equal(mine.data[0].moderation_status,'pending');assert.equal(mine.data[0].photo_ids.length,5);assert.equal((await (await listings.GET(req('/api/listings'))).json()).data.length,0);pass('own pending listing visible only in my listings');
assert.equal((await media.GET(req('/api/listings/photo?id='+id))).status,200);assert.equal((await media.GET(req('/api/listings/photo?id='+id+'&photo='+photos[0].id))).status,200);pass('owner previews cover and extras');
as(other);assert.equal((await (await listings.GET(req('/api/listings?mine=1'))).json()).data.length,0);assert.equal((await media.GET(req('/api/listings/photo?id='+id))).status,404);assert.equal((await media.GET(req('/api/listings/photo?id='+id+'&photo='+photos[0].id))).status,404);assert.equal((await listings.PATCH(patch(id,'status','sold'))).status,403);assert.equal((await listings.PATCH(req('/api/listings',{method:'PATCH',body:form(id,2)}))).status,403);pass('another member cannot preview or change pending listing');
as(moderator);assert.equal((await media.GET(req('/api/listings/photo?id='+id+'&photo='+photos[0].id))).status,200);assert.equal((await (await admin.GET(req('/api/admin/listings'))).json()).data[0].photo_ids.length,5);assert.equal((await admin.PATCH(req('/api/admin/listings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:'approved'})}))).status,200);pass('moderator sees photos and approves');
as(other);assert.equal((await (await listings.GET(req('/api/listings'))).json()).data.length,1);const photoResponse=await media.GET(req('/api/listings/photo?id='+id));assert.equal(photoResponse.headers.get('Content-Type'),'image/webp');assert.equal(photoResponse.headers.get('Cache-Control'),'private, no-store');pass('approved photos visible to members with correct MIME');
assert.equal((await listings.PATCH(patch(id,'favorite'))).status,200);assert.equal((await (await listings.GET(req('/api/listings'))).json()).data[0].favorite,true);await listings.PATCH(patch(id,'favorite'));assert.equal((await (await listings.GET(req('/api/listings'))).json()).data[0].favorite,false);pass('favorites toggle');
as(owner);for(const status of ['reserved','sold','active']){assert.equal((await listings.PATCH(patch(id,'status',status))).status,200);assert.equal((await pg.query('select sale_status from listings where id=$1',[id])).rows[0].sale_status,status)}pass('owner controls all sale statuses');
assert.equal((await listings.PATCH(req('/api/listings',{method:'PATCH',body:form(id)}))).status,200);assert.equal((await pg.query('select count(*)::int count from listing_photos where listing_id=$1',[id])).rows[0].count,5);assert.equal((await pg.query('select status from listings where id=$1',[id])).rows[0].status,'pending');pass('edit preserves pictures and requires reapproval');
as(other);assert.equal((await media.GET(req('/api/listings/photo?id='+id))).status,404);assert.equal((await listings.PATCH(patch(id,'favorite'))).status,404);pass('pending edited listing hidden again');
as(owner);assert.equal((await listings.PATCH(req('/api/listings',{method:'PATCH',body:form(id,2)}))).status,200);assert.equal((await pg.query('select count(*)::int count from listing_photos where listing_id=$1',[id])).rows[0].count,1);assert.equal((await media.GET(req('/api/listings/photo?id='+id+'&photo='+photos[0].id))).status,404);pass('new photo set replaces previous set');
const countBefore=(await pg.query('select count(*)::int count from listings')).rows[0].count;
await pg.exec("create function reject_listing_photo() returns trigger language plpgsql as $$begin raise exception 'test failure'; end$$; create trigger reject_photo before insert on listing_photos for each row execute function reject_listing_photo()");
assert.equal((await listings.POST(req('/api/listings',{method:'POST',body:form(null,2)}))).status,503);assert.equal((await pg.query('select count(*)::int count from listings')).rows[0].count,countBefore);pass('photo insert failure rolls back listing creation');
const failedEdit=form(id,2);failedEdit.set('title','Neuspesna nova vsebina');assert.equal((await listings.PATCH(req('/api/listings',{method:'PATCH',body:failedEdit}))).status,503);assert.equal((await pg.query('select title from listings where id=$1',[id])).rows[0].title,'Oprema za kamp');assert.equal((await pg.query('select count(*)::int count from listing_photos where listing_id=$1',[id])).rows[0].count,1);pass('photo failure rolls back edits and keeps old pictures');
await pg.exec('drop trigger reject_photo on listing_photos; drop function reject_listing_photo()');
await pg.exec(fs.readFileSync(base+'/db/v46.sql','utf8'));assert.equal((await pg.query('select count(*)::int count from listing_photos where listing_id=$1',[id])).rows[0].count,1);pass('repeat migration preserves photos');
const actual=database;database={query:async()=>{throw Error('test unavailable')}};assert.equal((await media.GET(req('/api/listings/photo?id='+id))).status,503);database=actual;pass('database error returns JSON');
await pg.close();console.log(checks+' listing checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
