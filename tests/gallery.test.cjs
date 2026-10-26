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
 if(name.startsWith('.')){const rel=path.relative(base,path.resolve(path.dirname(file),name))+'.ts';if(rel.replace(/\\\\/g,'/')==='src/lib/auth-adapter.ts')return {getAuthAdapter:()=>({getIdentity:async()=>identity})};return load(rel);}
 return require(require.resolve(name,{paths:[base]}));};new Function('require','module','exports',src)(requireLocal,mod,mod.exports);return mod.exports;}
let checks=0;function pass(name){checks++;console.log('PASS',name)}
(async()=>{const pg=new PGlite();database={query:async(sql,params=[])=>pg.query(sql,params)};await pg.exec(fs.readFileSync(base+'/db/schema.sql','utf8'));await pg.exec(fs.readFileSync(base+'/db/v110.sql','utf8'));await pg.exec(fs.readFileSync(base+'/db/gallery.sql','utf8'));pass('schema migration is repeatable');
const member='11111111-1111-4111-8111-111111111111', moderator='22222222-2222-4222-8222-222222222222';
for(const [id,role] of [[member,'member'],[moderator,'moderator']])await pg.query("insert into members(id,email,display_name,nickname,parcel_private,role,approved) values($1,$2,'Test','Test','1',$3,true)",[id,id+'@example.test',role]);
const pub=load('src/app/api/gallery/route.ts'),admin=load('src/app/api/admin/gallery/route.ts'),media=load('src/app/api/gallery/[id]/route.ts');
const req=(url,options={})=>new Request('https://www.veli-joze.eu'+url,options);
assert.equal((await pub.POST(req('/api/gallery',{method:'POST'}))).status,401);pass('guest cannot upload');
identity={id:member,email:'test',role:'member',approved:false};assert.equal((await pub.POST(req('/api/gallery',{method:'POST'}))).status,403);pass('pending member cannot upload');
identity={id:member,email:'test',role:'member',approved:true};assert.equal((await admin.GET(req('/api/admin/gallery'))).status,403);pass('ordinary member cannot review');
assert.equal((await pub.POST(req('/api/gallery',{method:'POST',headers:{Origin:'https://outside.example'}}))).status,403);pass('cross-origin upload denied');
const img=await sharp({create:{width:2400,height:1500,channels:3,background:'#0875a7'}}).withMetadata({exif:{IFD0:{Artist:'PRIVATE DATA'}}}).jpeg().toBuffer();
const prepared=await load('src/lib/gallery-image.ts').prepareGalleryImage(img);const meta=await sharp(prepared.image).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,1920);assert.equal(meta.exif,undefined);pass('image resized and EXIF removed');
await assert.rejects(()=>load('src/lib/gallery-image.ts').prepareGalleryImage(Buffer.from('<svg></svg>')));pass('non-image payload rejected');
await assert.rejects(()=>load('src/lib/gallery-image.ts').prepareGalleryImage(Buffer.alloc(5*1024*1024+1)));pass('oversized file rejected');
function form(consent=true){const f=new FormData();f.set('title','Sončni zahod');f.set('photo',new File([img],'test.jpg',{type:'image/jpeg'}));if(consent)f.set('consent','yes');return f;}
assert.equal((await pub.POST(req('/api/gallery',{method:'POST',body:form(false)}))).status,400);pass('consent required');
assert.equal((await pub.POST(req('/api/gallery',{method:'POST',body:form()}))).status,201);const rows=await pg.query('select id,status from gallery_photos');const id=rows.rows[0].id;assert.equal(rows.rows[0].status,'pending');pass('upload persists as pending');
assert.equal((await (await pub.GET()).json()).data.length,0);identity=null;assert.equal((await media.GET(req('/api/gallery/'+id),{params:Promise.resolve({id})})).status,404);pass('pending photo hidden from public list and direct URL');
identity={id:moderator,email:'test',role:'moderator',approved:true};assert.equal((await media.GET(req('/api/gallery/'+id),{params:Promise.resolve({id})})).status,200);assert.equal((await (await admin.GET(req('/api/admin/gallery'))).json()).data.length,1);pass('moderator can preview pending image');
const decision=()=>req('/api/admin/gallery',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:'approved'})});assert.equal((await admin.PATCH(decision())).status,200);assert.equal((await pg.query("select * from moderation_actions where target_type='photo'")).rows.length,1);pass('approval and audit written atomically');
assert.equal((await admin.PATCH(decision())).status,409);pass('repeated approval cannot create duplicate audit');
identity=null;assert.equal((await (await pub.GET()).json()).data.length,1);const publicImage=await media.GET(req('/api/gallery/'+id),{params:Promise.resolve({id})});assert.equal(publicImage.status,200);assert.equal(publicImage.headers.get('Content-Type'),'image/webp');pass('approved image available to public');
identity={id:member,email:'test',role:'member',approved:true};await pub.POST(req('/api/gallery',{method:'POST',body:form()}));const second=(await pg.query("select id from gallery_photos where status='pending'")).rows[0].id;
identity={id:moderator,email:'test',role:'moderator',approved:true};const denied=req('/api/admin/gallery',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:second,status:'rejected'})});assert.equal((await admin.PATCH(denied)).status,200);identity=null;assert.equal((await media.GET(req('/api/gallery/'+second),{params:Promise.resolve({id:second})})).status,404);pass('rejected image remains private');
await pg.close();console.log(checks+' checks passed');})().catch(e=>{console.error(e);process.exit(1)});
