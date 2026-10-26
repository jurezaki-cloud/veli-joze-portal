/* eslint-disable @typescript-eslint/no-require-imports -- Isolated component effect regression test. */
const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const src=ts.transpileModule(fs.readFileSync('src/app/PwaRegister.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function run(installed,pathname){const effects=[],calls=[];let index=0;const state=[null,installed,false,null,'',false];const mod={exports:{}};const req=name=>name==='react'?{createContext:()=>({Provider:'provider'}),useContext:()=>({}),useState:()=>[state[index++],()=>{}],useEffect:fn=>effects.push(fn),useRef:()=>({current:false})}:name==='next/navigation'?{usePathname:()=>pathname}:name==='next/link'?{default:'a'}:require(name);new Function('require','module','exports','window',src)(req,mod,mod.exports,{location:{replace:url=>calls.push(url)}});mod.exports.default({children:null});effects[0]();return calls;}
assert.deepEqual(run(true,'/namestitev'),['/']);console.log('PASS installed shortcut on instructions opens portal');
for(const path of ['/','/klepet','/moja-parcela','/prijava'])assert.deepEqual(run(true,path),[]);console.log('PASS normal app routes never redirect to instructions or home');
assert.deepEqual(run(false,'/namestitev'),[]);console.log('PASS installation instructions remain available in browser');
