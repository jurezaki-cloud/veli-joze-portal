/* eslint-disable @typescript-eslint/no-require-imports -- Standalone TypeScript helper regression. */
const assert=require('node:assert/strict');const {weatherFreshness}=require('../src/lib/weather-freshness.ts');
const now=Date.parse('2026-10-08T12:00:00Z');
assert.equal(weatherFreshness('2026-10-08T14:00',7200,now),'fresh');
assert.equal(weatherFreshness('2026-10-08T13:00',3600,now),'fresh');
assert.equal(weatherFreshness('2026-10-06T14:00',7200,now),'stale');
assert.equal(weatherFreshness('2026-10-08T09:00:00Z',0,now),'fresh');
assert.equal(weatherFreshness('2026-10-08T08:59:59Z',0,now),'stale');
for(const [time,offset] of [[null,7200],['bad',7200],['2026-10-08T14:00',undefined],['2026-10-08T14:00',Infinity],['2026-10-08T18:00',7200]])assert.equal(weatherFreshness(time,offset,now),'unknown');
console.log('PASS weather freshness: summer/winter offsets, old source, 3-hour boundary, invalid/missing/future time');
