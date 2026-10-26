/* eslint-disable @typescript-eslint/no-require-imports -- Real SQL and server-rendering regression tests. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'..'),mods=new Map();let database;
function load(file){const full=path.join(root,file);if(mods.has(full))return mods.get(full);const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(name=>{
 if(name==='./database'||name==='@/lib/database')return {getDatabase:()=>database};
 if(name==='@/lib/public-content')return load('src/lib/public-content.ts');
 if(name==='@/lib/seo')return load('src/lib/seo.ts');
 if(name==='@/lib/camp-date')return load('src/lib/camp-date.ts');
 if(name==='@/lib/client-api')return {};
 if(name==='next/navigation')return {notFound:()=>{throw Error('NOT_FOUND')}};
 if(name==='next/link')return ({children,href})=>React.createElement('a',{href},children);
 if(name==='next/image')return ({unoptimized,priority,...props})=>React.createElement('img',props);
 if(name.includes('Section'))return ({title,children})=>React.createElement('main',null,React.createElement('h1',null,title),children);
 if(name.includes('EventParticipation'))return {__esModule:true,default:()=>null,EventParticipationProvider:({children})=>children};
 if(name.includes('Icon'))return ()=>null;
 if(name==='react')return {...React,cache:fn=>fn};
 return require(name);
},mod,mod.exports);mods.set(full,mod.exports);return mod.exports;}
(async()=>{
 const pg=new PGlite();database={query:(sql,params)=>pg.query(sql,params)};
 await pg.exec(fs.readFileSync(root+'/db/schema.sql','utf8'));await pg.exec(fs.readFileSync(root+'/db/v110.sql','utf8'));
 const ids={future:'11111111-1111-4111-8111-111111111111',past:'22222222-2222-4222-8222-222222222222',archived:'33333333-3333-4333-8333-333333333333',notice:'44444444-4444-4444-8444-444444444444',hiddenNotice:'55555555-5555-4555-8555-555555555555',photo:'66666666-6666-4666-8666-666666666666',pending:'77777777-7777-4777-8777-777777777777',member:'88888888-8888-4888-8888-888888888888'};
 await pg.query("insert into members(id,email,display_name,nickname,parcel_private) values($1,'fixture@example.test','Fixture','Fixture','private')",[ids.member]);
 for(const [id,title,status] of [[ids.photo,'Approved sunset','approved'],[ids.pending,'HIDDEN PHOTO','pending']])await pg.query("insert into gallery_photos(id,author_id,title,image,width,height,status) values($1,$2,$3,$4,640,480,$5)",[id,ids.member,title,new Uint8Array([1,2,3]),status]);
 for(const [id,title,days,archived] of [[ids.future,'Public gathering',2,null],[ids.past,'PAST SECRET',-2,null],[ids.archived,'ARCHIVED SECRET',2,new Date()]])await pg.query("insert into events(id,title,event_date,event_time,location,description,archived_at,cover_photo_id) values($1,$2,current_date+$3::integer,'12:00','Kamp Veli Jože','Public event description',$4,$5)",[id,title,days,archived,ids.pending]);
 await pg.query("insert into announcements(id,title,type,content) values($1,'Public notice','Info','Public notice description')",[ids.notice]);await pg.query("insert into announcements(id,title,type,content,archived_at) values($1,'HIDDEN NOTICE','Info','Hidden notice description',now())",[ids.hiddenNotice]);
 const content=load('src/lib/public-content.ts'),photos=await content.publicGalleryPhotos();assert.equal(photos.length,1);assert.equal(photos[0].id,ids.photo);assert.equal(typeof photos[0].created_at,'string');assert(!('author_id' in photos[0]));assert(!('image' in photos[0]));
 assert.equal((await content.publicEvent(ids.future)).cover_photo_id,null);assert.equal(await content.publicEvent(ids.past),null);assert.equal(await content.publicEvent(ids.archived),null);assert.equal(await content.publicEvent('bad-id'),null);assert.equal(await content.publicAnnouncement(ids.hiddenNotice),null);
 const sitemap=await load('src/app/sitemap.ts').default();assert.equal(sitemap.length,17);assert(sitemap.some(x=>x.url.endsWith('/dogodki/'+ids.future)));assert(sitemap.some(x=>x.url.endsWith('/obvestila/'+ids.notice)));assert(!sitemap.some(x=>/SECRET|profil|sporocila/.test(x.url)));
 for(const [file,id,text] of [['src/app/dogodki/[id]/page.tsx',ids.future,'Public event description'],['src/app/obvestila/[id]/page.tsx',ids.notice,'Public notice description']]){const page=load(file),props={params:Promise.resolve({id})};const meta=await page.generateMetadata(props);assert(meta.alternates.canonical.endsWith(id));const html=renderToStaticMarkup(await page.default(props));assert(html.includes(text));assert(html.includes('BreadcrumbList'));assert(!html.includes('HIDDEN'));assert.equal((html.match(/<h1>/g)||[]).length,1);}
 await assert.rejects(load('src/app/dogodki/[id]/page.tsx').default({params:Promise.resolve({id:ids.archived})}),/NOT_FOUND/);
 const gallery=renderToStaticMarkup(React.createElement(load('src/app/galerija/GalleryClient.tsx').default,{initialItems:photos}));assert(gallery.includes('Approved sunset'));assert(gallery.includes('/api/gallery/'+ids.photo));assert(!gallery.includes('HIDDEN PHOTO'));assert(!gallery.includes('Nalagam fotografije'));
 const weather={source:'Open-Meteo',timezone:'Europe/Zagreb',updatedAt:'2026-10-09T12:00',marineUpdatedAt:'2026-10-09T12:00',freshness:{air:'fresh',marine:'fresh'},current:{temperature_2m:19.5},marine:{sea_surface_temperature:22.9}};
 const weatherHtml=renderToStaticMarkup(React.createElement(load('src/app/vreme/WeatherClient.tsx').default,{initialData:weather}));assert(weatherHtml.includes('19.5 °C'));assert(weatherHtml.includes('22.9 °C'));assert(weatherHtml.includes('2026-10-09 12:00'));
 const homePhotos=renderToStaticMarkup(React.createElement(load('src/app/HomeGallery.tsx').default,{initialItems:photos}));assert(homePhotos.includes('Approved sunset'));
 const db=database;database={query:()=>Promise.reject(Error('database unavailable'))};await assert.rejects(load('src/app/sitemap.ts').default(),/database unavailable/);database=db;
 console.log('PASS real SQL excludes private/past/archive, public sitemap details, 404, and weather/gallery HTML without JavaScript');await pg.close();
})().catch(e=>{console.error(e);process.exitCode=1});
