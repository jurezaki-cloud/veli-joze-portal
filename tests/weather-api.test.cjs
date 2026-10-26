/* eslint-disable @typescript-eslint/no-require-imports -- Mocked upstream tests without external requests. */
const assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs');
function load(file){const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;new Function('require','module','exports',code)(name=>name==='@/lib/public-weather'?load('src/lib/public-weather.ts'):name==='./weather-freshness'?load('src/lib/weather-freshness.ts'):require(name),mod,mod.exports);return mod.exports;}
const mod={exports:load('src/app/api/weather/route.ts')};
(async()=>{const old=global.fetch;try{
 const air={utc_offset_seconds:0,current:{time:new Date().toISOString(),temperature_2m:22}};
 const sea={utc_offset_seconds:0,current:{time:'2000-01-01T00:00',sea_surface_temperature:23.2}};
 global.fetch=async url=>Response.json(url.includes('marine-api')?sea:air);
 let r=await mod.exports.GET(),j=await r.json();assert.equal(r.status,200);assert.equal(j.freshness.air,'fresh');assert.equal(j.freshness.marine,'stale');assert.equal(j.marineUpdatedAt,sea.current.time);assert.equal(r.headers.get('cache-control'),'no-store');
 global.fetch=async url=>{if(url.includes('marine-api'))throw Error('offline');return Response.json(air)};
 j=await (await mod.exports.GET()).json();assert.equal(j.marine,null);assert.equal(j.freshness.marine,'unknown');assert.equal(j.current.temperature_2m,22);
 global.fetch=async()=>new Response('Internal Server Error',{status:500});r=await mod.exports.GET();assert.equal(r.status,503);assert.equal((await r.json()).ok,false);
 console.log('PASS weather API: independent air/sea timestamps, stale sea flagged, sea outage preserves air, upstream failure returns JSON');
 }finally{global.fetch=old}})().catch(e=>{console.error(e);process.exitCode=1});
