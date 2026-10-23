/* RELYNX World: dependency-free, projected 3D scene.
 * Adapter mounts beside React's static hero without replacing React-owned nodes.
 * Reads rendered workspace state; actions use the existing wallet/draft controls.
 * This is an illustrative relationship model, never a transaction simulation.
 */
const ICONS={
wallet:'<rect x="4" y="6" width="16" height="14" rx="3"/><path d="M4 9V6a2 2 0 0 1 2-2h11m-1 8h6v5h-6z"/>',
assets:'<path d="m12 3 10 6-10 6L2 9zM2 14l10 6 10-6M2 19l10 6 10-6" transform="translate(0 -2) scale(1 .92)"/>',
records:'<path d="M4 7h16l-4-4m4 14H4l4 4M20 7v1M4 17v-1"/>',
core:'<path d="M7 4h6a5 5 0 0 1 0 10H7zm5 10 6 6M7 14v6"/>',
play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',
reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
minus:'<path d="M5 12h14"/>',plus:'<path d="M5 12h14M12 5v14"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>'
};
const icon=name=>'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[name]+'</svg>';
const CHAPTERS=[
{id:'core',name:'The workspace',kicker:'01 / YOUR POINT OF VIEW',title:'A little world.\nA clearer picture.',copy:'One place to understand your wallet, explore your assets and follow the records that connect them.',action:'Explore assets',target:'market',color:'#7771ab'},
{id:'wallet',name:'Your wallet',kicker:'02 / THE STARTING POINT',title:'Your wallet.\nAlways yours.',copy:'Connect Phantom or Solflare to read your public address and balances. Your keys stay in your wallet.',action:'Connect wallet',color:'#589d91'},
{id:'assets',name:'SOL & assets',kicker:'03 / WHAT YOU HOLD',title:'Every asset.\nOne perspective.',copy:'See native SOL and positive SPL Token and Token-2022 balances, with direct links to each mint.',action:'View wallet assets',target:'market',color:'#8e85b8'},
{id:'records',name:'Onchain records',kicker:'04 / FOLLOW THE RECORD',title:'A signature.\nA story to inspect.',copy:'Explore recent wallet transactions and open their independent records in Solana Explorer.',action:'View recent activity',target:'market',color:'#b49368'}
];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
class RelynxWorld extends HTMLElement{
 connectedCallback(){
  if(this.ready)return;this.ready=true;this.abort=new AbortController();this.state={selected:0,yaw:-.58,pitch:.58,zoom:1,spread:1,playing:false,night:false};this.drag=null;this.visible=true;this.last=0;this.phase=0;
  this.innerHTML=`<section class="world-experience" aria-label="Explore your Solana workspace">
   <div class="world-intro"><div><span class="world-eyebrow">RELYNX / A NEW PERSPECTIVE</span><h2>Your wallet has a world.<br/><em>Step inside.</em></h2></div><p>Explore the connections.<br/>Make your next move with clarity.</p></div>
   <div class="world-theater">
    <div class="world-canvas-wrap"><div class="world-scene-meta"><span><i></i> THE SOLANA WORKSPACE</span><span>INTERACTIVE MODEL</span></div>
     <canvas aria-hidden="true"></canvas>
     <div class="world-compass" aria-hidden="true"><span>N</span><i></i></div>
     <div class="world-scene-hint">Drag to orbit <span>·</span> Select a landmark to explore</div>
     <div class="world-camera"><button data-command="rotate-left" aria-label="Rotate scene left">↶</button><button data-command="rotate-right" aria-label="Rotate scene right">↷</button><span></span><button data-command="zoom-out" aria-label="Zoom out">${icon('minus')}</button><button data-command="zoom-in" aria-label="Zoom in">${icon('plus')}</button><button data-command="reset" aria-label="Reset scene view">${icon('reset')}</button></div>
    </div>
    <aside class="world-inspector"><div class="world-inspector-top"><span>FIELD NOTES</span><span class="world-page">01 — 04</span></div><div class="world-object-icon">${icon('core')}</div><div class="world-caption" aria-live="polite" aria-atomic="true"><span class="world-kicker"></span><h3></h3><p></p></div><div class="world-readout"><span class="world-readout-label"></span><strong></strong><small></small></div><button class="world-main-action"><span></span>${icon('arrow')}</button><div class="world-inspector-foot"><span class="world-chapter-counter">01</span><span>Choose a landmark<br/>or take the guided tour.</span><button data-command="next" aria-label="Next landmark">${icon('arrow')}</button></div></aside>
    <div class="world-tour-bar"><div class="world-landmarks" role="group" aria-label="Scene landmarks">${CHAPTERS.map((ch,i)=>`<button data-select="${i}" aria-pressed="${i===0}"><span class="world-tab-icon">${icon(ch.id)}</span><span><small>0${i+1}</small>${ch.name}</span><i></i></button>`).join('')}</div><button class="world-tour" data-command="tour" aria-pressed="false">${icon('play')}<span>Take a tour</span></button></div>
   </div>
   <div class="world-below"><span><i></i> Illustrative map · Figures come from your workspace</span><div><label>Landmark spacing <input type="range" min="80" max="125" value="100" aria-label="Landmark spacing"/></label><button data-command="light" aria-pressed="false">${icon('sun')}<span>Daylight</span></button></div></div>
  </section>`;
  this.canvas=this.querySelector('canvas');this.ctx=this.canvas.getContext('2d');if(!this.ctx){this.querySelector('.world-canvas-wrap').innerHTML='<div class="world-no-canvas">Explore the wallet, assets and records using the landmark buttons below.</div>';this.canvas=null;}
  const listen=(el,event,fn,options={})=>el.addEventListener(event,fn,{...options,signal:this.abort.signal});
  listen(this,'click',e=>{const select=e.target.closest('[data-select]');if(select){this.stopTour();this.select(+select.dataset.select);return;}const b=e.target.closest('[data-command]');if(b)this.command(b.dataset.command);if(e.target.closest('.world-main-action'))this.act();});
  listen(this.querySelector('input'),'input',e=>{this.state.spread=+e.target.value/100;this.paint();});
  if(this.canvas){
   listen(this.canvas,'pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;this.stopTour();this.drag={x:e.clientX,y:e.clientY,yaw:this.state.yaw,pitch:this.state.pitch,moved:false};this.canvas.setPointerCapture(e.pointerId);});
   listen(this.canvas,'pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>6)this.drag.moved=true;if(this.drag.moved){this.state.yaw=this.drag.yaw+dx*.008;this.state.pitch=Math.max(.32,Math.min(.9,this.drag.pitch+dy*.004));this.paint();}});
   listen(this.canvas,'pointerup',e=>{if(!this.drag)return;if(!this.drag.moved){const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const hit=this.hits?.slice().reverse().find(h=>Math.hypot(x-h.x,y-h.y)<h.r);if(hit)this.select(hit.index);}this.drag=null;});
   listen(this.canvas,'pointercancel',()=>this.drag=null);
  }
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.querySelector('.world-canvas-wrap'));
  this.intersection=new IntersectionObserver(([e])=>{this.visible=e.isIntersecting;if(this.visible)this.paint();});this.intersection.observe(this);
  this.metricsObserver=new MutationObserver(()=>this.updateReadout());for(const el of document.querySelectorAll('.sol-metrics,.sol-assets,.sol-transactions,.topbar-actions'))this.metricsObserver.observe(el,{subtree:true,childList:true,characterData:true});
  listen(document,'visibilitychange',()=>{if(document.hidden)this.stopTour();else this.paint();});
  listen(reduced,'change',()=>{if(reduced.matches)this.stopTour();this.paint();});
  this.select(0);this.resize();
  const tick=t=>{if(!this.isConnected)return;if(this.visible&&!document.hidden&&!reduced.matches&&t-this.last>40){this.phase=t*.00015;this.paint();this.last=t;}this.frame=requestAnimationFrame(tick);};if(this.canvas)this.frame=requestAnimationFrame(tick);
 }
 disconnectedCallback(){this.abort?.abort();this.resizeObserver?.disconnect();this.intersection?.disconnect();this.metricsObserver?.disconnect();this.stopTour();cancelAnimationFrame(this.frame);this.ready=false;}
 select(index){this.state.selected=index;this.dataset.selected=CHAPTERS[index].id;const ch=CHAPTERS[index];this.querySelector('.world-kicker').textContent=ch.kicker;this.querySelector('h3').textContent=ch.title;this.querySelector('.world-caption p').textContent=ch.copy;this.querySelector('.world-object-icon').innerHTML=icon(ch.id);this.querySelector('.world-page').textContent='0'+(index+1)+' — 04';this.querySelector('.world-chapter-counter').textContent='0'+(index+1);this.style.setProperty('--world-selection',ch.color);this.querySelectorAll('[data-select]').forEach((b,i)=>b.setAttribute('aria-pressed',i===index?'true':'false'));this.updateReadout();this.paint();}
 updateReadout(){
  const metrics=[...document.querySelectorAll('.sol-metrics>div b')].map(el=>el.textContent.trim()),status=document.querySelector('.sol-network-status')?.textContent.trim()||'Network status unavailable';
  const tokenSummary=document.querySelector('.sol-assets .frame-title b')?.textContent.trim()||'Unavailable',recordEmpty=document.querySelector('.sol-transactions .sol-empty b')?.textContent.trim(),account=document.querySelector('.topbar .wallet-button')?.textContent.trim()||'Connect wallet';
  const values=[
   ['NETWORK STATUS',status,'A view of the relationships. No transfers are simulated.'],
   ['WALLET BALANCE',metrics[4]||'— SOL',account==='Connect wallet'?'Connect a wallet to load your public data.':account],
   ['TOKEN ACCOUNTS',account==='Connect wallet'?'Not connected':tokenSummary,document.querySelector('.sol-assets .registry-foot')?.textContent.trim()||'SPL Token + Token-2022'],
   ['RECENT SIGNATURES',account==='Connect wallet'?'Not connected':recordEmpty||document.querySelectorAll('.sol-tx').length+' records',document.querySelector('.sol-transactions .sol-empty b')?.textContent.trim()||'Open a record below to inspect it on Explorer.']
  ][this.state.selected];
  this.querySelector('.world-readout-label').textContent=values[0];this.querySelector('.world-readout strong').textContent=values[1];this.querySelector('.world-readout small').textContent=values[2];
  this.querySelector('.world-main-action span').textContent=this.state.selected===1&&account!=='Connect wallet'?'View wallet details':CHAPTERS[this.state.selected].action;
 }
 act(){const i=this.state.selected;if(i===1){const b=document.querySelector('.topbar .wallet-button');if(b?.textContent.trim()==='Connect wallet')b.click();else document.getElementById('access')?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});}else{const el=i===3?document.querySelector('.sol-transactions'):document.getElementById('market');el?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});}}
 command(cmd){const s=this.state;if(cmd==='tour'){if(s.playing)this.stopTour();else{this.stopTour();s.playing=true;this.select(0);this.tourTimer=setInterval(()=>{if(this.state.selected===3)this.stopTour();else this.select(this.state.selected+1);},5000);this.updateTour();}return;}
  if(['next','rotate-left','rotate-right','reset'].includes(cmd))this.stopTour();
  if(cmd==='next')this.select((s.selected+1)%4);
  if(cmd==='rotate-left')s.yaw-=.3;if(cmd==='rotate-right')s.yaw+=.3;
  if(cmd==='zoom-in')s.zoom=Math.min(1.35,s.zoom+.1);if(cmd==='zoom-out')s.zoom=Math.max(.7,s.zoom-.1);
  if(cmd==='reset'){Object.assign(s,{yaw:-.58,pitch:.58,zoom:1,spread:1});this.querySelector('input').value=100;this.select(0);}
  if(cmd==='light'){s.night=!s.night;this.dataset.light=s.night?'dusk':'day';const b=this.querySelector('[data-command="light"]');b.setAttribute('aria-pressed',String(s.night));b.querySelector('span').textContent=s.night?'Dusk':'Daylight';}
  this.dataset.zoom=s.zoom.toFixed(2);this.dataset.yaw=s.yaw.toFixed(2);this.paint();
 }
 stopTour(){clearInterval(this.tourTimer);if(this.state)this.state.playing=false;if(this.ready)this.updateTour();}
 updateTour(){const b=this.querySelector('.world-tour');if(!b)return;b.setAttribute('aria-pressed',String(this.state.playing));b.innerHTML=icon(this.state.playing?'pause':'play')+'<span>'+(this.state.playing?'Pause tour':'Take a tour')+'</span>';}
 resize(){if(!this.canvas)return;const r=this.canvas.parentElement.getBoundingClientRect();this.w=r.width;this.h=r.height;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*dpr);this.canvas.height=Math.round(this.h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.paint();}
 paint(){
  if(!this.ctx||!this.w)return;const c=this.ctx,w=this.w,h=this.h,s=this.state,night=s.night;
  c.clearRect(0,0,w,h);const bg=c.createRadialGradient(w*.53,h*.48,5,w*.5,h*.5,w*.7);bg.addColorStop(0,night?'#353b4b':'#f0efe8');bg.addColorStop(1,night?'#252c3b':'#e8e7df');c.fillStyle=bg;c.fillRect(0,0,w,h);
  const scale=Math.min(w/720,h/540)*s.zoom;
  const project=([x,y,z])=>{const a=x*Math.cos(s.yaw)-z*Math.sin(s.yaw),b=x*Math.sin(s.yaw)+z*Math.cos(s.yaw);return{x:w*.5+a*scale,y:h*.55-(y*Math.cos(s.pitch)-b*Math.sin(s.pitch))*scale,d:y*Math.sin(s.pitch)+b*Math.cos(s.pitch)};};
  const polygon=(pts,fill,stroke)=>{c.beginPath();pts.forEach((p,i)=>{const q=project(p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y)});c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke();}};
  const line=(pts,color,width=1)=>{c.beginPath();pts.forEach((p,i)=>{const q=project(p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y)});c.strokeStyle=color;c.lineWidth=width;c.stroke();};
  for(let n=-5;n<=5;n++){line([[n*62,-21,-310],[n*62,-21,310]],night?'#ffffff08':'#555b6310');line([[-310,-21,n*62],[310,-21,n*62]],night?'#ffffff08':'#555b6310');}
  // Soft ground shadows remain under the geometry while the camera orbits.
  const shadow=(x,z,rx,rz)=>{const pts=Array.from({length:40},(_,i)=>[x+Math.cos(i*Math.PI/20)*rx,-20,z+Math.sin(i*Math.PI/20)*rz]);polygon(pts,night?'#11172630':'#363e4b0b');};
  shadow(0,0,300,220);shadow(0,0,270,192);shadow(0,0,245,170);
  const nodes=[{x:0,z:0},{x:-191*s.spread,z:34*s.spread},{x:136*s.spread,z:-134*s.spread},{x:161*s.spread,z:126*s.spread}];
  // Links indicate conceptual relationships, not real-time chain traffic.
  nodes.slice(1).forEach((n,i)=>{const color=s.selected===i+1?CHAPTERS[i+1].color:night?'#8391a160':'#8b969450';line([[0,-6,0],[n.x*.5,-6,0],[n.x*.5,-6,n.z],[n.x,-6,n.z]],color,s.selected===i+1?2:1);});
  const faces=[];
  const face=(pts,fill,edge)=>faces.push({pts,fill,edge,d:pts.reduce((sum,p)=>sum+project(p).d,0)/pts.length});
  const prism=(x,y,z,rx,rz,height,sides,colors,rotation=0)=>{const bottom=[],top=[];for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2+rotation;bottom.push([x+Math.cos(a)*rx,y,z+Math.sin(a)*rz]);top.push([x+Math.cos(a)*rx,y+height,z+Math.sin(a)*rz]);}for(let i=0;i<sides;i++)face([bottom[i],bottom[(i+1)%sides],top[(i+1)%sides],top[i]],colors[1+(i%2)],colors[3]);face(top,colors[0],colors[3]);};
  const box=(x,y,z,sx,sy,sz,col)=>prism(x,y,z,sx/Math.SQRT2,sz/Math.SQRT2,sy,4,col,Math.PI/4);
  const stone=['#f8f6ef','#d2d4cd','#b8bfb9','#ffffff50'],base=['#454d52','#303b42','#253039','#ffffff12'];
  prism(0,-19,0,276,211,14,6,base,Math.PI/6);
  prism(0,-5,0,270,205,4,6,night?['#697479','#38454d','#2a3943','#ffffff15']:['#d5dbd3','#a6b7b0','#8ea39d','#ffffff55'],Math.PI/6);
  // Core: stepped pedestal and a faceted violet glass spire.
  prism(0,0,0,67,67,11,8,stone,Math.PI/8);prism(0,11,0,53,53,9,8,['#59596d','#3e4054','#2e354a','#c0b8ef50'],Math.PI/8);
  prism(0,20,0,36,36,132,6,['#d7d2ef','#9e95c7','#716d9b','#e2dcff90'],Math.PI/6);
  prism(0,55,0,39,39,3,6,['#ede8ff','#b6aed9','#948bc0','#e2dcff99'],Math.PI/6);
  prism(0,111,0,39,39,3,6,['#ede8ff','#b6aed9','#948bc0','#e2dcff99'],Math.PI/6);
  prism(0,152,0,30,30,9,6,['#f1edff','#c0b6e0','#9b8ec4','#ffffff80'],Math.PI/6);
  const wallet=nodes[1],assets=nodes[2],records=nodes[3];
  prism(wallet.x,0,wallet.z,52,50,10,8,stone,Math.PI/8);
  box(wallet.x,10,wallet.z,77,64,33,['#92c6b3','#629986','#3e7468','#c3eddb88']);
  box(wallet.x,52,wallet.z+19,49,18,7,['#b9e1d1','#8dbca8','#6aa28e','#ddfff180']);
  box(wallet.x,22,wallet.z+23,16,6,5,['#efe6bd','#b5ac7c','#948c66','#ffffd066']);
  prism(assets.x,0,assets.z,56,52,10,8,stone,Math.PI/8);
  [[-16,-8,63],[16,3,86],[-9,20,43]].forEach(([dx,dz,height],i)=>{box(assets.x+dx,10,assets.z+dz,25,height,25,[['#c5bbe6','#9a8dc0','#796c9d','#ede4ff80'],['#e1d9f0','#b4a5d0','#9282b3','#fff7ff80'],['#b6afcd','#8d829f','#6b617e','#e2d7f180']][i]);box(assets.x+dx,height+10,assets.z+dz,25,3,25,['#f6f0ff','#dbd2ee','#b4a7d2','#ffffff80']);});
  prism(records.x,0,records.z,55,51,10,8,stone,Math.PI/8);
  for(let i=0;i<4;i++)box(records.x+i*3-5,10+i*13,records.z-i*3,65,8,42,['#e4ceb0','#c0a57f','#a18a6c','#fff1d680']);
  box(records.x+12,62,records.z-9,20,7,17,['#a1c6b4','#719a86','#4e7d6c','#d2eadb80']);
  faces.sort((a,b)=>a.d-b.d).forEach(f=>polygon(f.pts,f.fill,f.edge));
  // Fine vertical detailing makes scale and material readable.
  for(let y=28;y<145;y+=9)line([[-9,y,32],[9,y,32]],'#eee9ff55',.7);
  this.hits=[];
  nodes.forEach((n,i)=>{
   const p=project([n.x,i===0?185:i===2?128:101,n.z]);const selected=s.selected===i;const object=project([n.x,i===0?90:45,n.z]);this.hits.push({x:object.x,y:object.y,r:Math.max(25,(i===0?48:39)*scale),index:i});
   if(selected){const g=project([n.x,2,n.z]);c.beginPath();c.ellipse(g.x,g.y,60*scale,25*scale,0,0,Math.PI*2);c.strokeStyle=CHAPTERS[i].color+'88';c.lineWidth=1;c.setLineDash([3,4]);c.stroke();c.setLineDash([]);}
   const label=CHAPTERS[i].name,tw=Math.max(86,c.measureText(label).width+30);c.font='500 11px system-ui, sans-serif';const lw=c.measureText(label).width+32;
   c.fillStyle=selected?(night?'#ece9f4':'#ffffffeb'):(night?'#303a4be8':'#f9faf6df');c.strokeStyle=selected?CHAPTERS[i].color+'88':night?'#69768766':'#cad0c780';c.lineWidth=1;c.beginPath();c.roundRect(p.x-lw/2,p.y-15,lw,29,7);c.fill();c.stroke();c.fillStyle=selected?CHAPTERS[i].color:night?'#d0d9e2':'#626e6a';c.textAlign='center';c.textBaseline='middle';c.fillText(label,p.x,p.y);this.hits.push({x:p.x,y:p.y,r:Math.max(35,lw/2),index:i});
  });
  if(!reduced.matches){const n=nodes[s.selected||1],t=(this.phase%1),p=project([n.x*t,5,n.z*t]);c.beginPath();c.arc(p.x,p.y,3*scale,0,Math.PI*2);c.fillStyle=s.selected?CHAPTERS[s.selected].color:'#9a8dc0';c.fill();}
 }
}
if(!customElements.get('relynx-world'))customElements.define('relynx-world',RelynxWorld);
function mount(){const hero=document.querySelector('#overview .hero-card');if(!hero||document.querySelector('relynx-world'))return !!hero;const world=document.createElement('relynx-world');hero.before(world);document.querySelector('.sol-workspace')?.classList.add('world-enabled');return true;}
if(!mount()){const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true});}
