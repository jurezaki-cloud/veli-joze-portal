import {readdirSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const files=readdirSync(new URL("../tests/",import.meta.url)).filter(f=>f.endsWith(".test.cjs")).sort();
let failed=0;
for(const file of files){
 console.log(`\nTEST ${file}`);
 const args=["client-api.test.cjs","portal-refresh.test.cjs","notification-refresh.test.cjs","portal-updates.test.cjs","weather-api.test.cjs","weather-freshness.test.cjs"].includes(file)?["--experimental-strip-types",`tests/${file}`]:[`tests/${file}`];
 const result=spawnSync(process.execPath,args,{cwd:root,stdio:"inherit"});
 if(result.error||result.status!==0){failed++;console.error(`FAILED ${file}${result.error?": "+result.error.message:""}`);}
}
console.log(`\nSuites: ${files.length-failed} passed, ${failed} failed, ${files.length} total`);
process.exitCode=failed?1:0;
