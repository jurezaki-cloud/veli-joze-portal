/* eslint-disable @typescript-eslint/no-require-imports -- Isolated notification component lifecycle regression. */
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/app/moja-obvestila/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const real=require('../src/lib/client-api.ts');
const item={key:'notice:1',title:'Obvestilo',category:'announcements',href:'/obvestila',created_at:'2026-10-08',read:false};
function setup(fetch,preferences=async()=>({data:{enabled:true}})){
 const state=['member',false,[item],null,'','',false,false,'all'];let index=0,load;
 const react={useState:()=>{const i=index++;return [state[i],v=>{state[i]=typeof v==='function'?v(state[i]):v}]},useRef:()=>({current:null}),useCallback:fn=>(load=fn),useEffect:()=>{}};
 const mod={exports:{}};const local=name=>name==='react'?react:name==='@/lib/client-api'?{...real,api:preferences}:name==='react/jsx-runtime'?require(name):()=>null;
 new Function('require','module','exports','fetch','window',code)(local,mod,mod.exports,fetch,{dispatchEvent:()=>{}});mod.exports.default();return {state,load};
}
(async()=>{
 const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
 const outage=setup(async()=>new Response('Internal Error',{status:500}));await outage.load();assert.equal(outage.state[0],'member');assert.deepEqual(outage.state[2],[item]);assert.match(outage.state[4],/Storitev/);
 const denied=setup(async()=>json({},401));await denied.load();assert.equal(denied.state[0],'guest');assert.deepEqual(denied.state[2],[]);assert.equal(denied.state[3],null);
 const pending=setup(async()=>json({},403));await pending.load();assert.equal(pending.state[0],'pending');assert.deepEqual(pending.state[2],[]);
 const success=setup(async()=>json({data:[]}));await success.load();assert.deepEqual(success.state[2],[]);assert.equal(success.state[4],'');
 const prefs=setup(async()=>json({data:[]}),async()=>{throw Error('Preferences unavailable')});await prefs.load();assert.equal(prefs.state[0],'member');assert.deepEqual(prefs.state[2],[item]);
 let requests=[];const stale=setup((url,opts)=>new Promise(resolve=>requests.push({resolve,signal:opts.signal})));const first=stale.load(),second=stale.load();assert.equal(requests[0].signal.aborted,true);requests[1].resolve(json({data:[]}));await second;requests[0].resolve(json({data:[item]}));await first;assert.deepEqual(stale.state[2],[]);
 console.log('PASS notifications: outage retention, expired/pending access clears data, successful refresh, preference outage, stale response ignored');
})().catch(e=>{console.error(e);process.exitCode=1});
