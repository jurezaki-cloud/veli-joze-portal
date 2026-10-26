/* eslint-disable @typescript-eslint/no-require-imports -- Isolated local browser storage and retry tests. */
const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const values=new Map(),events=[],broadcasts=[];
global.sessionStorage={get length(){return values.size},key:i=>[...values.keys()][i],getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
global.window={dispatchEvent:e=>events.push(e.type),localStorage:{setItem:(k,v)=>broadcasts.push([k,v])}};
function load(file,drafts){const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',code)(name=>name==='./message-drafts'?drafts:require(name),mod,mod.exports);return mod.exports;}
(async()=>{
let d=load('src/lib/message-drafts.ts');const photo=load('src/lib/photo-request.ts',d),a=new File(['photo'],'a.png'),b=new File(['other'],'a.png');
const first=await photo.getPhotoRequestKey('alice','chat:general',a);assert.equal(await photo.getPhotoRequestKey('alice','chat:general',a),first);assert.notEqual(await photo.getPhotoRequestKey('alice','chat:general',b),first);
assert.ok(![...values.values()].some(x=>x.includes('a.png')||x.includes('other')));const reload=load('src/lib/photo-request.ts',load('src/lib/message-drafts.ts'));assert.equal(await reload.getPhotoRequestKey('alice','chat:general',b),await photo.getPhotoRequestKey('alice','chat:general',b));
photo.clearPhotoRequestKey('alice','chat:general',await photo.getPhotoRequestKey('alice','chat:general',b));assert.notEqual(await photo.getPhotoRequestKey('alice','chat:general',b),first);
d.saveMessageDraft('alice','dm:bob','Private',2000);d.getMessageRequestKey('alice','dm:bob','Private');values.set('other-app','Keep');d.clearLocalMessageData(true);assert.equal(values.size,1);assert.equal(values.get('other-app'),'Keep');assert.equal(d.readMessageDraft('alice','dm:bob',2000),'');assert.deepEqual(events,['veli-joze-drafts-cleared']);assert.equal(broadcasts[0][0],'veli-joze-drafts-clear');assert.ok(!broadcasts[0][1].includes('Private'));
d.claimMessageDraftOwner('alice');d.saveMessageDraft('alice','dm:bob','Old account',2000);d.claimMessageDraftOwner('bob');assert.equal(d.readMessageDraft('alice','dm:bob',2000),'');assert.equal(values.get('veli-joze-draft-owner-v1'),'bob');
global.sessionStorage={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')},removeItem:()=>{throw Error('blocked')}};d.saveMessageDraft('alice','dm:bob','Memory',2000);d.clearLocalMessageData();assert.equal(d.readMessageDraft('alice','dm:bob',2000),'');
console.log('PASS photo retry digest survives reload; changed bytes use new key; storage cleanup preserves other applications, broadcasts no text and clears memory fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
