/* eslint-disable @typescript-eslint/no-require-imports -- Isolated calendar date regression checks. */
const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const mod={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync('src/lib/camp-calendar.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod,mod.exports);
const {campDateKey,monthGrid}=mod.exports;
assert.equal(campDateKey('2026-10-15'),'2026-10-15');
assert.equal(campDateKey('2026-10-14T22:00:00.000Z'),'2026-10-15');
assert.equal(campDateKey('2026-12-31T23:30:00Z'),'2027-01-01');
assert.equal(campDateKey('2026-03-28T23:30:00Z'),'2026-03-29');
assert.equal(campDateKey('invalid'),'');
assert.deepEqual(monthGrid(2026,9),{year:2026,month:9,lead:3,days:31});
assert.deepEqual(monthGrid(2024,1),{year:2024,month:1,lead:3,days:29});
assert.deepEqual(monthGrid(2026,12),{year:2027,month:0,lead:4,days:31});
assert.deepEqual(monthGrid(2026,-1),{year:2025,month:11,lead:0,days:31});
console.log('9 calendar checks passed: time zones, DST, weekdays, leap year and month navigation');
