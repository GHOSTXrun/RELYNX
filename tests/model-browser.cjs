/* Browser regression: run local preview and Chrome remote debugging.
 * RELYNX_PREVIEW_URL defaults to http://127.0.0.1:4175.
 * CHROME_DEBUG_URL defaults to http://127.0.0.1:9223.
 * Optional RELYNX_SCREENSHOT_DIR saves captures.
 */
const fs=require('fs'),path=require('path');(async()=>{
const endpoint=process.env.CHROME_DEBUG_URL||'http://127.0.0.1:9223',url=process.env.RELYNX_PREVIEW_URL||'http://127.0.0.1:4175';
const tabs=await(await fetch(endpoint+'/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const p=new Map(),errors=[];
ws.onmessage=e=>{const d=JSON.parse(e.data);if(d.id){p.get(d.id)?.(d);p.delete(d.id);}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text);};
const call=(method,params={})=>new Promise((r,j)=>{const n=++id;p.set(n,d=>d.error?j(d.error):r(d.result));ws.send(JSON.stringify({id:n,method,params}));});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const wait=ms=>new Promise(r=>setTimeout(r,ms)),ok=(v,msg)=>{if(!v)throw Error(msg);console.log('PASS',msg)};
await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
const baselineExpression='JSON.stringify([".sidebar",".topbar",".hero-copy",".sol-metrics","#market",".sol-intro"].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),c=getComputedStyle(e);return {selector:s,text:e.textContent,color:c.color,background:c.backgroundColor,font:c.fontFamily,width:r.width,height:r.height,top:r.top}}))';
for(const width of [1440,1024,390,320]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});await call('Network.setBlockedURLs',{urls:['*model.js','*model.css']});await call('Page.navigate',{url});await wait(1600);const baseline=await ev(baselineExpression);
 await call('Network.setBlockedURLs',{urls:[]});await call('Page.navigate',{url});await wait(1600);ok(await ev('!!document.querySelector("relynx-model canvas")'),'model mounted '+width);
 const actual=await ev(baselineExpression);ok(actual===baseline,'original layout, content and styles preserved '+width);
 ok(await ev('document.documentElement.scrollWidth<=innerWidth'),'no horizontal overflow '+width);ok(await ev('getComputedStyle(document.querySelector(".sol-hero-art>img")).display==="none"'),'static illustration replaced '+width);
 if(process.env.RELYNX_SCREENSHOT_DIR){fs.mkdirSync(process.env.RELYNX_SCREENSHOT_DIR,{recursive:true});const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(process.env.RELYNX_SCREENSHOT_DIR,width+'.png'),Buffer.from(shot.data,'base64'));}
 if(width===1440){
  await ev('document.querySelectorAll("[data-node]")[2].click()');ok(await ev('document.querySelector("relynx-model").state.selected===2&&document.querySelectorAll("[data-node]")[2].getAttribute("aria-pressed")==="true"'),'selection and accessible state');
  await ev('document.querySelector("[data-action=plus]").click()');ok(await ev('document.querySelector("relynx-model").state.zoom>1'),'zoom');
  await ev('document.querySelector("[data-action=left]").click()');ok(await ev('document.querySelector("relynx-model").state.yaw<-.58'),'rotate buttons');
  await ev('document.querySelector("[data-action=play]").click()');const yaw=await ev('document.querySelector("relynx-model").state.yaw');await wait(250);ok(await ev('document.querySelector("relynx-model").state.yaw')!==yaw,'auto rotation advances camera');await ev('document.querySelector("[data-action=play]").click()');ok(await ev('!document.querySelector("relynx-model").state.playing'),'pause rotation');
  const r=await ev('(()=>{const r=document.querySelector("relynx-model canvas").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()'),before=await ev('document.querySelector("relynx-model").state.yaw');
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x:r.x,y:r.y,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:r.x+35,y:r.y,buttons:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:r.x+35,y:r.y,button:'left',clickCount:1});ok(await ev('document.querySelector("relynx-model").state.yaw')!==before,'drag orbit');
  await ev('document.querySelector("[data-action=reset]").click()');ok(await ev('(()=>{const s=document.querySelector("relynx-model").state;return s.selected===0&&s.zoom===1&&s.yaw===-.58})()'),'reset');
 }
 if(width===390){await ev('document.querySelector(".wallet-button").click()');ok(await ev('document.querySelectorAll(".wallet-choices button").length===2'),'original wallet dialog');await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});ok(await ev('!document.querySelector("[role=dialog]")'),'Escape dismisses dialog');await ev('document.querySelector("#market .subtle-button").click()');ok(await ev('!!document.querySelector(".sol-form")'),'original draft form');await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});}
}
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await ev('document.querySelector("[data-action=play]").click()');ok(await ev('!document.querySelector("relynx-model").state.playing'),'reduced motion prevents auto rotation');
const fallback=await ev('(()=>{const model=document.querySelector("relynx-model"),art=model.parentElement;model.remove();art.classList.remove("has-relynx-model");const original=HTMLCanvasElement.prototype.getContext;try{HTMLCanvasElement.prototype.getContext=()=>null;const test=document.createElement("relynx-model");art.append(test);const supported=!!test.ctx;test.remove();return !supported&&getComputedStyle(art.querySelector("img")).display!=="none";}finally{HTMLCanvasElement.prototype.getContext=original}})()');ok(fallback,'original image remains usable without Canvas');
ok(errors.length===0,'no uncaught browser exceptions '+errors.join(';'));ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
