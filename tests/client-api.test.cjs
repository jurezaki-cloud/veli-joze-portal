/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test entry point. */
const assert=require('node:assert/strict');
const {readApiResponse,api,jsonOptions}=require('../src/lib/client-api.ts');
(async()=>{
 const response=(body,status=200,type='application/json')=>new Response(body,{status,headers:{'content-type':type}});
 assert.deepEqual(await readApiResponse(response('{"ok":true,"data":[]}')),{ok:true,data:[]});
 for(const [body,status,type] of [['Internal Server Error',500,'text/html'],['{',200,'application/json'],['null',200,'application/json'],['[]',200,'application/json'],['42',200,'application/json']]){
  await assert.rejects(readApiResponse(response(body,status,type)),/Storitev trenutno ni dosegljiva/);
 }
 await assert.rejects(readApiResponse(response('{"ok":false,"message":"Prijavi se."}',401)),/Prijavi se/);
 await assert.rejects(readApiResponse(response('{"ok":false}',200)),/Storitev trenutno ni dosegljiva/);
 const original=global.fetch;
 try{
  global.fetch=async()=>{throw new TypeError('offline')};
  await assert.rejects(api('/api/home'),/Povezava je prekinjena/);
  global.fetch=async(url,opts)=>{assert.equal(opts.cache,'no-store');assert.equal(opts.signal,signal);return response('{"ok":true}');};
  const signal=new AbortController().signal;await api('/api/home',{signal});
  global.fetch=async()=>{throw new DOMException('Aborted','AbortError')};
  await assert.rejects(api('/api/home'),e=>e.name==='AbortError');
 }finally{global.fetch=original;}
 assert.deepEqual(jsonOptions({name:'Jože'},'PATCH'),{method:'PATCH',headers:{'Content-Type':'application/json'},body:'{"name":"Jože"}'});
 console.log('PASS API: valid JSON, invalid payloads, HTML 500, server errors, offline, cancellation, cache and JSON options');
})().catch(e=>{console.error(e);process.exitCode=1});
