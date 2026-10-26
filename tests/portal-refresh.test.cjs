/* eslint-disable @typescript-eslint/no-require-imports -- Isolated component request lifecycle regression. */
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/app/moj-portal/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const api=require('../src/lib/client-api.ts');
const old={totals:{events:0,favorites:0,listings:0,posts:0,followed:0},events:[],favorites:[],listings:[],posts:[],followed:[],unread:0};
function setup(fetch){
 let index=0,load;const states=[old,false,'',false,'all'];
 const react={useState:()=>{const i=index++;return [states[i],v=>{states[i]=v}]},useRef:()=>({current:null}),useCallback:fn=>(load=fn),useEffect:()=>{}};
 const mod={exports:{}};
 const local=name=>name==='react'?react:name==='@/lib/client-api'?api:name==='react/jsx-runtime'?require(name):()=>null;
 new Function('require','module','exports','fetch',code)(local,mod,mod.exports,fetch);mod.exports.default();return {states,load};
}
(async()=>{
 let finish;const s=setup(()=>new Promise(resolve=>{finish=resolve}));const pending=s.load();assert.deepEqual(s.states[0],old);assert.equal(s.states[1],true);
 finish(new Response('Internal Server Error',{status:500}));await pending;assert.deepEqual(s.states[0],old);assert.match(s.states[2],/Storitev/);assert.equal(s.states[1],false);
 const denied=setup(async()=>new Response('{"ok":false,"message":"Prijavi se"}',{status:401,headers:{'content-type':'application/json'}}));await denied.load();assert.equal(denied.states[0],null);assert.equal(denied.states[3],true);
 const success=setup(async()=>new Response('{"ok":true,"unread":2}',{headers:{'content-type':'application/json'}}));await success.load();assert.deepEqual(success.states[0],{ok:true,unread:2});assert.equal(success.states[2],'');
 let requests=[];const stale=setup((url,opts)=>new Promise(resolve=>requests.push({resolve,signal:opts.signal})));const first=stale.load(),second=stale.load();assert.equal(requests[0].signal.aborted,true);requests[1].resolve(new Response('{"ok":true,"unread":3}',{headers:{'content-type':'application/json'}}));await second;requests[0].resolve(new Response('{"ok":true,"unread":99}',{headers:{'content-type':'application/json'}}));await first;assert.equal(stale.states[0].unread,3);
 console.log('PASS portal refresh: retains content on loading and outage, clears on expired login, replaces on success, ignores stale responses');
})().catch(e=>{console.error(e);process.exitCode=1});
