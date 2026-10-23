/* Live public-provider smoke test. No wallet, credentials or fabricated data. */
import assert from 'node:assert/strict';
const actualFetch=globalThis.fetch,seen=[];
globalThis.fetch=async(url,options={})=>{const r=await actualFetch(url,{...options,headers:{...options.headers,Origin:'https://relynx.fun'}});if(r.ok){const cors=r.headers.get('access-control-allow-origin');seen.push({url:String(url),cors});}return r;};
const {readQuote,readCandles,readNetwork,readSupply}=await import('../src/data-service.js');
const results=await Promise.allSettled([readQuote(),readCandles('24H'),readNetwork(),readSupply()]);
const names=['quote','candles','network','supply'];
for(let i=0;i<results.length;i++){const r=results[i];if(r.status==='rejected')throw Error(names[i]+': '+r.reason);const v=r.value;if(i===0)assert.ok(v.price>0);if(i===1)assert.ok(v.rows.length>2);if(i===2)assert.ok(v.samples.length>2&&v.slot>0);if(i===3)assert.ok(v.total>=v.circulating);console.log(names[i],JSON.stringify(i===0?{source:v.source,price:v.price}:i===1?{source:v.source,points:v.rows.length}:i===2?{source:v.source,slot:v.slot,tps:v.tps}:{total:v.total,circulating:v.circulating}));}
for(const item of seen)assert.ok(item.cors==='*'||item.cors==='https://relynx.fun','Browser CORS unavailable: '+item.url);
const origin=seen.find(x=>x.url.includes('publicnode')||x.url.includes('mainnet-beta'))?.url;
if(origin){const r=await actualFetch(origin,{method:'OPTIONS',headers:{Origin:'https://relynx.fun','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'},signal:AbortSignal.timeout(10000)});assert.ok(r.ok,'RPC preflight failed');const cors=r.headers.get('access-control-allow-origin');assert.ok(cors==='*'||cors==='https://relynx.fun','RPC preflight CORS');}
console.log('Live quotes, historical observations, RPC samples, supply and browser CORS verified.');
