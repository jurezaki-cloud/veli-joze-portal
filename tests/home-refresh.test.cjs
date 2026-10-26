/* eslint-disable @typescript-eslint/no-require-imports -- Isolated effect lifecycle with deterministic timers. */
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const win=new EventTarget(),doc=new EventTarget();doc.visibilityState='visible';let cleanup,refreshes=0,next=0;const timers=new Map();
const code=ts.transpileModule(fs.readFileSync('src/app/HomeRefresh.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};
new Function('require','module','exports','window','document','setTimeout','clearTimeout',code)(name=>name==='react'?{useEffect:fn=>{cleanup=fn();}}:{useRouter:()=>({refresh:()=>refreshes++})},mod,mod.exports,win,doc,fn=>{timers.set(++next,fn);return next;},id=>timers.delete(id));
mod.exports.default();
const emit=type=>win.dispatchEvent(new Event(type));const flush=()=>{const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());};
assert.equal(timers.size,0);emit('portal-notifications-change');emit('portal-visit-reviewed');assert.equal(timers.size,1);flush();assert.equal(refreshes,1);
doc.visibilityState='hidden';emit('portal-notifications-change');assert.equal(timers.size,0);doc.visibilityState='visible';doc.dispatchEvent(new Event('visibilitychange'));flush();assert.equal(refreshes,2);doc.dispatchEvent(new Event('visibilitychange'));assert.equal(timers.size,0);
emit('portal-notifications-change');doc.visibilityState='hidden';flush();assert.equal(refreshes,2);doc.visibilityState='visible';doc.dispatchEvent(new Event('visibilitychange'));flush();assert.equal(refreshes,3);
emit('portal-notifications-change');cleanup();assert.equal(timers.size,0);emit('portal-notifications-change');emit('portal-visit-reviewed');doc.dispatchEvent(new Event('visibilitychange'));assert.equal(timers.size,0);assert.equal(refreshes,3);
console.log('PASS home refresh batches mutation events, defers hidden tabs, preserves pending change, cleans up and never polls');
