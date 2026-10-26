/* eslint-disable @typescript-eslint/no-require-imports -- Isolated server render of weather states. */
const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function render(file,states){let i=0;const m={exports:{}};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const local=name=>name==='react'?{...React,useState:()=>[states[i++],()=>{}],useEffect:()=>{}}:name==='next/link'?({children,href})=>React.createElement('a',{href},children):name.includes('Icon')?()=>null:name.includes('Section')?({children})=>React.createElement('main',null,children):name==='@/lib/client-api'?{}:require(name);
 new Function('require','module','exports',source)(local,m,m.exports);return renderToStaticMarkup(React.createElement(m.exports.default));}
const d={source:'Open-Meteo',updatedAt:'2026-10-08T14:00',marineUpdatedAt:'2026-10-06T14:00',current:{temperature_2m:22},marine:{sea_surface_temperature:23.2},freshness:{air:'fresh',marine:'stale'}};
assert.match(render('src/app/WeatherSummary.tsx',[d,false]),/starejši od 3 ur/);
assert.match(render('src/app/WeatherSummary.tsx',[d,true]),/Osveževanje ni uspelo/);
assert.match(render('src/app/vreme/WeatherClient.tsx',[d,'',false]),/Podatek o morju je starejši od 3 ur/);
assert.match(render('src/app/vreme/WeatherClient.tsx',[d,'',false]),/2026-10-06 14:00/);
assert.match(render('src/app/vreme/WeatherClient.tsx',[{...d,marine:null},'',false]),/morju trenutno niso dosegljivi/);
assert.match(render('src/app/vreme/WeatherClient.tsx',[d,'Izpad',false]),/zadnje uspešno/);
console.log('PASS weather UI: stale sea, failed refresh with retained values, separate sea timestamp, missing sea, outage');
