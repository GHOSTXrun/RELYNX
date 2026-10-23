/* Deterministic browser fixtures stay in tests; production always calls providers.
 * Start Chrome remote debugging and the site preview.
 * CHROME_DEBUG_URL and RELYNX_PREVIEW_URL override localhost:9223 / :4176.
 */
const fs=require('fs'),path=require('path');(async()=>{
const endpoint=process.env.CHROME_DEBUG_URL||'http://127.0.0.1:9223',url=process.env.RELYNX_PREVIEW_URL||'http://127.0.0.1:4176';
const tabs=await(await fetch(endpoint+'/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0,fail=false;const pending=new Map(),errors=[],requests=[];
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,d=>d.error?reject(d.error):resolve(d.result));ws.send(JSON.stringify({id:n,method,params}));});
const now=()=>Math.floor(Date.now()/1000);
const address='11111111111111111111111111111111',mint='EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const response=r=>{const u=new URL(r.url);if(fail)throw Error('fixture outage');
 if(r.method==='OPTIONS')return {};
 if(u.hostname.includes('coinbase')){
  if(u.pathname.endsWith('/stats'))return {last:'150.25',open:'148',high:'152.5',low:'147.2',volume:'3000000'};
  const step=Number(u.searchParams.get('granularity'))||900,start=Math.floor(new Date(u.searchParams.get('start')).getTime()/1000);const n=Math.min(290,Math.floor((now()-start)/step));return Array.from({length:n},(_,i)=>{const t=start+i*step,p=148+i*.015+Math.sin(i/7)*1.4;return [t,p-.2,p+.4,p-.1,p,1000+i*31];}).reverse();
 }
 if(u.hostname.includes('kraken'))return {error:['fixture outage']};
 if(u.hostname.includes('dexscreener'))return [{chainId:'solana',baseToken:{address:mint,name:'USD Coin',symbol:'USDC'},priceUsd:'1',liquidity:{usd:1000000}}];
 const body=JSON.parse(r.postData||'{}'),method=body.method;requests.push(method);
 const token={account:{owner:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',data:{parsed:{info:{mint,tokenAmount:{amount:'100000000',decimals:6}}}}}};
 const data={
 getEpochInfo:{absoluteSlot:365432100,epoch:846,slotIndex:216000,slotsInEpoch:432000,blockHeight:340000000,transactionCount:450000000000},
 getRecentPerformanceSamples:Array.from({length:60},(_,i)=>({slot:365432100-i*150,numTransactions:(2400+(i%7)*47)*60,numNonVoteTransactions:(900+(i%9)*23)*60,numSlots:150,samplePeriodSecs:60})),
 getSupply:{value:{total:600000000*1e9,circulating:520000000*1e9,nonCirculating:80000000*1e9}},getInflationRate:{total:.038,validator:.038,foundation:0,epoch:846},
 getBalance:{value:2000000000},getTokenAccountsByOwner:{value:body.params?.[1]?.programId==='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'?[token]:[]},
 getSignaturesForAddress:[{signature:'TestSignature11111111111111111111111111111111111111111',blockTime:now()-60,err:null,confirmationStatus:'confirmed'}]
 };return {jsonrpc:'2.0',id:body.id,result:data[method]};
};
ws.onmessage=async e=>{const d=JSON.parse(e.data);if(d.id){pending.get(d.id)?.(d);pending.delete(d.id);}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text);
 if(d.method==='Fetch.requestPaused'){const {requestId,request}=d.params;try{let body,status=200;try{body=JSON.stringify(response(request));}catch{status=503;body='{}';}await call('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'*'},{name:'Access-Control-Allow-Headers',value:'content-type'},{name:'Access-Control-Allow-Methods',value:'GET, POST, OPTIONS'}],body:Buffer.from(body).toString('base64')});}catch(e){errors.push(String(e));}}
};
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(v,msg)=>{if(!v)throw Error(msg);console.log('PASS',msg);};
async function until(expression,msg,timeout=18000){const start=Date.now();while(Date.now()-start<timeout){if(await ev(expression)){console.log('PASS',msg);return;}await wait(200);}throw Error(msg+' timed out');}
await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
await call('Fetch.enable',{patterns:['*://api.exchange.coinbase.com/*','*://api.kraken.com/*','*://solana-rpc.publicnode.com/*','*://api.mainnet.solana.com/*','*://api.mainnet-beta.solana.com/*','*://api.dexscreener.com/*','*://api.coingecko.com/*'].map(urlPattern=>({urlPattern,requestStage:'Request'}))});
for(const width of [1440,1024,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<600});await call('Page.navigate',{url});
 await until('document.querySelector("relynx-model")?.dataset.render==="webgl"','physical 3D renderer at '+width);
 await until('document.querySelector("relynx-analytics")?.history?.rows?.length>2&&!!document.querySelector("relynx-analytics")?.network?.samples?.length','provider observations load at '+width);
 ok(await ev('document.documentElement.scrollWidth<=innerWidth'),'no horizontal overflow '+width);
 ok(await ev('document.querySelector(".insight-stats strong").textContent==="$150.25"'),'real service path populates quote '+width);
 ok(await ev('document.querySelector(".network-numbers b").textContent==="2,400"'),'TPS is derived from actual transaction/sample seconds '+width);
 ok(await ev('document.querySelector(".epoch-progress-value").textContent.includes("50.00%")'),'epoch progress '+width);
 if(process.env.RELYNX_SCREENSHOT_DIR){fs.mkdirSync(process.env.RELYNX_SCREENSHOT_DIR,{recursive:true});const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(process.env.RELYNX_SCREENSHOT_DIR,width+'-fixtures.png'),Buffer.from(shot.data,'base64'));}
 if(width===1440){
  const before=await ev('document.querySelector("relynx-model").time');await wait(350);ok(await ev('document.querySelector("relynx-model").time')>before,'animation runs by default');
  await ev('document.querySelector("[data-action=pause]").click()');const time=await ev('document.querySelector("relynx-model").time');await wait(200);ok(await ev('document.querySelector("relynx-model").time')===time,'pause freezes all model motion');
  await ev('document.querySelector("[data-action=left]").click()');ok(await ev('document.querySelector("relynx-model").yaw<0'),'camera orbit controls');
  await ev('document.querySelectorAll("[data-node]")[2].click()');ok(await ev('document.querySelector("relynx-model").selected===2'),'landmark selection');
  await ev('document.querySelector("[data-action=reset]").click()');ok(await ev('document.querySelector("relynx-model").yaw===0&&document.querySelector("relynx-model").selected===0'),'reset');
  await ev('document.querySelector(".insight-ranges button:nth-child(2)").click()');await until('document.querySelector("relynx-analytics").history?.range==="7D"','7 day chart switch');
  await ev('document.querySelector(".insight-ranges button:nth-child(3)").click()');await until('document.querySelector("relynx-analytics").history?.range==="30D"','30 day chart switch');
  await ev('document.querySelector("[data-chart=price]").focus()');await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});ok(await ev('!document.querySelector("[data-chart=price] .insight-tooltip").hidden'),'keyboard chart inspection');
 }
 if(width===390){
  await ev('window.phantom={solana:{connect:async()=>({publicKey:{toString:()=>"'+address+'"}}),disconnect:async()=>{},on(){},removeListener(){}}};document.querySelector(".wallet-button").click()');
  await until('!!document.querySelector(".wallet-choices button")','wallet dialog opens');await ev('document.querySelector(".wallet-choices button").click()');
  await until('document.querySelector(".holdings-coverage").textContent==="2/2 priced"','wallet + DEX token price integration');
  ok(await ev('document.querySelector(".holdings-value>b").textContent==="$400.50"'),'portfolio estimate uses actual balance and quote normalization');
  await ev('document.querySelector("#access .info-actions button").click()');await until('!document.querySelector(".holdings-value")','disconnect clears private allocation');
 }
}
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await until('document.querySelector("relynx-model").paused===true','reduced motion stops animation');
fail=true;await ev('globalThis[Symbol.for("relynx.data.v2")].cache.clear();document.querySelector("[data-refresh]").click()');await until('document.querySelector("relynx-analytics").errors.quote===true','market outage state');
ok(await ev('document.querySelector(".insight-stats strong").textContent==="$150.25"&&document.querySelector(".insight-stats small").textContent.includes("Last successful")'),'outage labels retained observations instead of generating values');
ok(errors.length===0,'no uncaught errors: '+errors.join(';'));ok(requests.includes('getSupply')&&requests.includes('getTokenAccountsByOwner'),'RPC coverage exercised');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
