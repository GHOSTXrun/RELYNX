/* RELYNX interactive illustration. Scoped enhancement of .sol-hero-art only.
 * All existing React content and source artwork remain intact.
 * Pure projected geometry; no wallet access, RPC requests or simulated transactions.
 */
(()=>{
const LANDMARKS=[{name:'RELYNX',color:'#baabf5'},{name:'Wallet',color:'#8bdbca'},{name:'SPL assets',color:'#b8a2f0'},{name:'Records',color:'#d2b183'}];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const paths={left:'<path d="M9 4 4 9l5 5M4 9h9a7 7 0 0 1 7 7"/>',right:'<path d="m15 4 5 5-5 5m5-5h-9a7 7 0 0 0-7 7"/>',plus:'<path d="M5 12h14M12 5v14"/>',minus:'<path d="M5 12h14"/>',reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>'};
const icon=name=>'<svg aria-hidden="true" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+paths[name]+'</svg>';
class RelynxModel extends HTMLElement{
 connectedCallback(){
  if(this.ready)return;this.ready=true;this.abort=new AbortController();this.state={selected:0,yaw:-.58,pitch:.58,zoom:1,spread:1,playing:false,night:true};this.phase=0;this.last=0;this.visible=true;
  this.innerHTML='<div class="relynx-model-stage"><canvas aria-hidden="true"></canvas><div class="relynx-model-landmarks" role="group" aria-label="Select a model landmark">'+LANDMARKS.map((n,i)=>'<button type="button" data-node="'+i+'" aria-pressed="'+(i===0)+'">'+n.name+'</button>').join('')+'</div><div class="relynx-model-tools"><span class="relynx-model-status" role="status">Interactive illustration</span><div>'+[['left','Rotate model left'],['right','Rotate model right'],['minus','Zoom out'],['plus','Zoom in'],['reset','Reset model'],['play','Auto rotate model']].map(([id,label])=>'<button type="button" data-action="'+id+'" title="'+label+'" aria-label="'+label+'"'+(id==='play'?' aria-pressed="false"':'')+'>'+icon(id)+'</button>').join('')+'</div></div></div>';
  this.canvas=this.querySelector('canvas');try{this.ctx=this.canvas.getContext('2d');}catch{return;}if(!this.ctx)return;
  const on=(el,name,fn)=>el.addEventListener(name,fn,{signal:this.abort.signal});
  on(this,'click',e=>{const node=e.target.closest('[data-node]');if(node){this.select(+node.dataset.node);return;}const b=e.target.closest('[data-action]');if(b)this.command(b.dataset.action);});
  on(this.canvas,'pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;this.stop();this.drag={x:e.clientX,y:e.clientY,yaw:this.state.yaw,pitch:this.state.pitch,moved:false};this.canvas.setPointerCapture(e.pointerId);});
  on(this.canvas,'pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>6)this.drag.moved=true;if(this.drag.moved){this.state.yaw=this.drag.yaw+dx*.008;this.state.pitch=Math.max(.32,Math.min(.85,this.drag.pitch+dy*.004));this.paint();}});
  on(this.canvas,'pointerup',e=>{if(!this.drag)return;if(!this.drag.moved){const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,hit=this.hits?.slice().reverse().find(n=>Math.hypot(x-n.x,y-n.y)<n.r);if(hit)this.select(hit.index);}this.drag=null;});
  on(this.canvas,'pointercancel',()=>this.drag=null);
  on(document,'visibilitychange',()=>{if(document.hidden)this.stop();});
  on(reduced,'change',()=>{if(reduced.matches)this.stop();});
  this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(this);
  this.io=new IntersectionObserver(([e])=>{this.visible=e.isIntersecting;if(!this.visible)this.stop();});this.io.observe(this);
  this.select(0);this.resize();
 }
 disconnectedCallback(){this.abort?.abort();this.ro?.disconnect();this.io?.disconnect();this.stop();this.parentElement?.classList.remove('has-relynx-model');this.ready=false;}
 select(index){this.stop();this.state.selected=index;this.dataset.selected=LANDMARKS[index].name;this.querySelectorAll('[data-node]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));this.querySelector('.relynx-model-status').textContent=LANDMARKS[index].name+' · Illustration';this.paint();}
 stop(){cancelAnimationFrame(this.frame);if(this.state)this.state.playing=false;const b=this.querySelector('[data-action=play]');if(b){b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Auto rotate model');b.title='Auto rotate model';b.innerHTML=icon('play');}}
 command(action){const s=this.state;if(action==='play'){if(s.playing){this.stop();return;}if(reduced.matches){this.querySelector('.relynx-model-status').textContent='Reduced motion · Rotate with buttons';return;}s.playing=true;const b=this.querySelector('[data-action=play]');b.setAttribute('aria-pressed','true');b.setAttribute('aria-label','Pause model rotation');b.title='Pause model rotation';b.innerHTML=icon('pause');const tick=t=>{if(!this.isConnected||!s.playing||!this.visible||document.hidden){this.stop();return;}if(t-this.last>40){s.yaw+=.003;this.phase=t*.00015;this.last=t;this.paint();}this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);return;}
  this.stop();if(action==='left')s.yaw-=.3;if(action==='right')s.yaw+=.3;if(action==='plus')s.zoom=Math.min(1.25,s.zoom+.1);if(action==='minus')s.zoom=Math.max(.75,s.zoom-.1);if(action==='reset'){Object.assign(s,{yaw:-.58,pitch:.58,zoom:1});this.select(0);}this.paint();
 }
 resize(){if(!this.ctx)return;const r=this.getBoundingClientRect();this.w=r.width;this.h=r.height;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*dpr);this.canvas.height=Math.round(this.h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.paint();}
 paint(){
  if(!this.ctx||!this.w)return;const c=this.ctx,w=this.w,h=this.h,s=this.state,night=s.night;
  c.clearRect(0,0,w,h);const bg=c.createRadialGradient(w*.53,h*.48,5,w*.5,h*.5,w*.7);bg.addColorStop(0,'#182633');bg.addColorStop(1,'#0e161e');c.fillStyle=bg;c.fillRect(0,0,w,h);
  const scale=Math.min(w/640,h/310)*.88*s.zoom;
  const project=([x,y,z])=>{const a=x*Math.cos(s.yaw)-z*Math.sin(s.yaw),b=x*Math.sin(s.yaw)+z*Math.cos(s.yaw);return{x:w*.5+a*scale,y:h*.57-(y*Math.cos(s.pitch)-b*Math.sin(s.pitch))*scale,d:y*Math.sin(s.pitch)+b*Math.cos(s.pitch)};};
  const polygon=(pts,fill,stroke)=>{c.beginPath();pts.forEach((p,i)=>{const q=project(p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y)});c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke();}};
  const line=(pts,color,width=1)=>{c.beginPath();pts.forEach((p,i)=>{const q=project(p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y)});c.strokeStyle=color;c.lineWidth=width;c.stroke();};
  for(let n=-5;n<=5;n++){line([[n*62,-21,-310],[n*62,-21,310]],'#607c8e18');line([[-310,-21,n*62],[310,-21,n*62]],'#607c8e18');}
  // Soft ground shadows remain under the geometry while the camera orbits.
  const shadow=(x,z,rx,rz)=>{const pts=Array.from({length:40},(_,i)=>[x+Math.cos(i*Math.PI/20)*rx,-20,z+Math.sin(i*Math.PI/20)*rz]);polygon(pts,'#00000018');};
  shadow(0,0,300,220);shadow(0,0,270,192);shadow(0,0,245,170);
  const nodes=[{x:0,z:0},{x:-191*s.spread,z:34*s.spread},{x:136*s.spread,z:-134*s.spread},{x:161*s.spread,z:126*s.spread}];
  // Links indicate conceptual relationships, not real-time chain traffic.
  nodes.slice(1).forEach((n,i)=>{const color=s.selected===i+1?LANDMARKS[i+1].color:'#5a819165';line([[0,-6,0],[n.x*.5,-6,0],[n.x*.5,-6,n.z],[n.x,-6,n.z]],color,s.selected===i+1?2:1);});
  const faces=[];
  const face=(pts,fill,edge)=>faces.push({pts,fill,edge,d:pts.reduce((sum,p)=>sum+project(p).d,0)/pts.length});
  const prism=(x,y,z,rx,rz,height,sides,colors,rotation=0)=>{const bottom=[],top=[];for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2+rotation;bottom.push([x+Math.cos(a)*rx,y,z+Math.sin(a)*rz]);top.push([x+Math.cos(a)*rx,y+height,z+Math.sin(a)*rz]);}for(let i=0;i<sides;i++)face([bottom[i],bottom[(i+1)%sides],top[(i+1)%sides],top[i]],colors[1+(i%2)],colors[3]);face(top,colors[0],colors[3]);};
  const box=(x,y,z,sx,sy,sz,col)=>prism(x,y,z,sx/Math.SQRT2,sz/Math.SQRT2,sy,4,col,Math.PI/4);
  const stone=['#344b59','#253b49','#1c2e3b','#83c2d140'],base=['#283f4c','#192b38','#101e2b','#81b8d128'];
  prism(0,-19,0,276,211,14,6,base,Math.PI/6);
  prism(0,-5,0,270,205,4,6,['#233c4a','#18313e','#122734','#9dcadd30'],Math.PI/6);
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
   if(selected){const g=project([n.x,2,n.z]);c.beginPath();c.ellipse(g.x,g.y,60*scale,25*scale,0,0,Math.PI*2);c.strokeStyle=LANDMARKS[i].color+'88';c.lineWidth=1;c.setLineDash([3,4]);c.stroke();c.setLineDash([]);}
   if(w<420)return;p.y=Math.max(51,Math.min(h-45,p.y));const label=LANDMARKS[i].name;c.font='500 10px system-ui, sans-serif';const lw=c.measureText(label).width+32;
   c.fillStyle=selected?('#203544f0'):('#132734ed');c.strokeStyle=selected?LANDMARKS[i].color+'88':'#54809770';c.lineWidth=1;c.beginPath();c.roundRect(p.x-lw/2,p.y-15,lw,29,7);c.fill();c.stroke();c.fillStyle=selected?'#e0eaf2':'#9fbdcc';c.textAlign='center';c.textBaseline='middle';c.fillText(label,p.x,p.y);this.hits.push({x:p.x,y:p.y,r:Math.max(35,lw/2),index:i});
  });
  if(s.playing&&!reduced.matches){const n=nodes[s.selected||1],t=(this.phase%1),p=project([n.x*t,5,n.z*t]);c.beginPath();c.arc(p.x,p.y,3*scale,0,Math.PI*2);c.fillStyle=s.selected?LANDMARKS[s.selected].color:'#9a8dc0';c.fill();}
 }
}
if(!customElements.get('relynx-model'))customElements.define('relynx-model',RelynxModel);
const mount=()=>{const art=document.querySelector('#overview .sol-hero-art');if(!art)return false;if(art.querySelector('relynx-model'))return true;const model=document.createElement('relynx-model');art.append(model);if(model.ctx)art.classList.add('has-relynx-model');else model.remove();return true;};
if(!mount()){const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true});}
})();
