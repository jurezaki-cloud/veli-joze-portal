/* eslint-disable @typescript-eslint/no-require-imports -- Browser event bridge test. */
const assert=require('node:assert/strict');const {publishPortalUpdate,connectPortalUpdates}=require('../src/lib/portal-updates.ts');
const target=new EventTarget(),writes=[];global.window={addEventListener:target.addEventListener.bind(target),removeEventListener:target.removeEventListener.bind(target),dispatchEvent:target.dispatchEvent.bind(target),localStorage:{setItem:(key,value)=>writes.push({key,value})}};
let changes=0,visits=0;window.addEventListener('portal-notifications-change',()=>changes++);window.addEventListener('portal-visit-reviewed',()=>visits++);
const off=connectPortalUpdates();const incoming=(key,value)=>{const e=new Event('storage');e.key=key;e.newValue=value;target.dispatchEvent(e)};
publishPortalUpdate();assert.equal(changes,1);assert.equal(writes.length,1);assert.deepEqual(Object.keys(JSON.parse(writes[0].value)).sort(),['nonce','type','version']);
incoming(writes[0].key,writes[0].value);assert.equal(changes,2);assert.equal(writes.length,1,'received signal never rebroadcasts');
publishPortalUpdate('portal-visit-reviewed');incoming(writes[1].key,writes[1].value);assert.equal(visits,2);
for(const payload of ['{','null','{}',JSON.stringify({version:1,type:'logout',nonce:'abc'}),JSON.stringify({version:2,type:'portal-notifications-change',nonce:'abc'}),'x'.repeat(301)])incoming(writes[0].key,payload);
incoming('unrelated',writes[0].value);assert.equal(changes,2);off();incoming(writes[0].key,writes[0].value);assert.equal(changes,2);
window.localStorage.setItem=()=>{throw Error('storage disabled')};publishPortalUpdate();assert.equal(changes,3);
delete global.window;assert.doesNotThrow(()=>publishPortalUpdate());assert.doesNotThrow(()=>connectPortalUpdates()());
console.log('PASS cross-tab signals: local/remote delivery, no loop, no private data, validation, cleanup, unavailable storage, SSR');
