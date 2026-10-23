import * as THREE from './vendor/three.module.min.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const names=['RELYNX core','Wallet access','SPL assets','Onchain records'];
const svg=(p)=>'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
const icons={pause:svg('<path d="M8 5v14M16 5v14"/>'),play:svg('<path d="m8 5 11 7-11 7z"/>'),reset:svg('<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>'),plus:svg('<path d="M5 12h14M12 5v14"/>'),minus:svg('<path d="M5 12h14"/>'),left:svg('<path d="m9 5-6 7 6 7M3 12h18"/>'),right:svg('<path d="m15 5 6 7-6 7M3 12h18"/>')};
class RelynxModel extends HTMLElement{
 async connectedCallback(){if(this.ready)return;this.ready=true;this.abort=new AbortController();this.time=0;this.paused=motion.matches;this.visible=true;this.yaw=.0;this.pitch=0;this.zoom=1.02;this.selected=0;
  this.innerHTML='<div class="relay-engine"><div class="engine-heading"><span><i></i> RELYNX / SOLANA</span><span>EXPLORE CONNECTIONS</span></div><div class="engine-canvas"></div><div class="engine-controls"><div class="engine-nodes" role="group" aria-label="Explore the model">'+names.map((n,i)=>'<button type="button" data-node="'+i+'" aria-label="'+n+'" title="'+n+'" aria-pressed="'+(i===0)+'"><span></span></button>').join('')+'</div><span class="engine-selected" role="status">RELYNX core</span><div class="engine-camera">'+[['left','Rotate left'],['right','Rotate right'],['minus','Zoom out'],['plus','Zoom in'],['reset','Reset view'],['pause','Pause animation']].map(([id,label])=>'<button type="button" data-action="'+id+'" title="'+label+'" aria-label="'+label+'">'+icons[id]+'</button>').join('')+'</div></div></div>';
  try{this.build();}catch(error){this.dataset.render='fallback';this.remove();return;}
  this.dataset.render='webgl';this.parentElement?.classList.add('has-relynx-model');
  const on=(el,name,fn)=>el.addEventListener(name,fn,{signal:this.abort.signal});
  on(this,'click',e=>{const node=e.target.closest('[data-node]');if(node){this.select(+node.dataset.node);return;}const b=e.target.closest('[data-action]');if(b)this.command(b.dataset.action);});
  const canvas=this.renderer.domElement;
  on(canvas,'pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;this.drag={x:e.clientX,y:e.clientY,yaw:this.yaw,pitch:this.pitch,moved:false};canvas.setPointerCapture(e.pointerId);});
  on(canvas,'pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.moved||=Math.abs(dx)+Math.abs(dy)>5;if(this.drag.moved){this.yaw=this.drag.yaw+dx*.006;this.pitch=Math.max(-.45,Math.min(.5,this.drag.pitch+dy*.004));this.draw();}});
  on(canvas,'pointerup',e=>{if(this.drag&&!this.drag.moved)this.pick(e);this.drag=null;});on(canvas,'pointercancel',()=>this.drag=null);
  on(canvas,'webglcontextlost',e=>{e.preventDefault();this.parentElement?.classList.remove('has-relynx-model');this.stop();});
  on(canvas,'webglcontextrestored',()=>{this.parentElement?.classList.add('has-relynx-model');this.draw();this.start();});
  on(document,'visibilitychange',()=>document.hidden?this.stop():this.start());
  on(motion,'change',()=>{if(motion.matches){this.paused=true;this.stop();this.updateMotion();this.draw();}});
  this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(this);this.io=new IntersectionObserver(([e])=>{this.visible=e.isIntersecting;e.isIntersecting?this.start():this.stop();});this.io.observe(this);
  this.resize();this.select(0);this.updateMotion();this.start();
 }
 build(){
  const renderer=this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<600?1.25:1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');this.querySelector('.engine-canvas').append(renderer.domElement);
  const scene=this.scene=new THREE.Scene(),camera=this.camera=new THREE.PerspectiveCamera(32,2,.1,80);camera.position.set(5.8,4.4,7.8);camera.lookAt(0,.9,0);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();this.env=pmrem.fromScene(room,.04);scene.environment=this.env.texture;scene.environmentIntensity=.85;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xb7e7f4,0x080c14,1.5));
  const key=new THREE.DirectionalLight(0xe8f6ff,3.2);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.025;key.shadow.bias=-.0004;key.shadow.radius=3;scene.add(key);
  const rim=new THREE.DirectionalLight(0x9a83ff,2);rim.position.set(4,3,-4);scene.add(rim);const edge=new THREE.PointLight(0x67e5c6,18,10,2);edge.position.set(-2,2,1);scene.add(edge);
  this.world=new THREE.Group();scene.add(this.world);this.geos=new Set();this.mats=new Set();this.textures=new Set();
  const material=p=>{const m=new THREE.MeshPhysicalMaterial(p);this.mats.add(m);return m;};
  const graphite=material({color:0x182532,metalness:.82,roughness:.25,clearcoat:.7,clearcoatRoughness:.15});
  const metal=material({color:0xa6b9c5,metalness:.95,roughness:.24});
  const smoked=material({color:0x285065,metalness:.12,roughness:.12,transmission:.35,thickness:.3,ior:1.45,clearcoat:1});
  const mint=material({color:0x59bea7,metalness:.4,roughness:.18,clearcoat:1,emissive:0x1c6457,emissiveIntensity:.18});
  const violet=material({color:0x9b8abc,metalness:.38,roughness:.2,clearcoat:1,emissive:0x40336b,emissiveIntensity:.1});
  const white=material({color:0xd3dce0,metalness:.65,roughness:.22});
  const dark=material({color:0x071019,metalness:.6,roughness:.34});
  const emissive=material({color:0x8decd2,emissive:0x53d9ba,emissiveIntensity:1.7,roughness:.3});
  const mesh=(geo,mat,parent=this.world)=>{this.geos.add(geo);const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const rounded=(w,h,d,r=.1)=>{const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const g=new THREE.ExtrudeGeometry(s,{depth:d,steps:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:3,curveSegments:12});g.translate(0,0,-d/2);g.computeVertexNormals();return g;};
  const ring=(r,t,mat,parent=this.world)=>{const m=mesh(new THREE.TorusGeometry(r,t,12,128),mat,parent);m.rotation.x=Math.PI/2;return m;};
  // Lathed and bevelled chassis. Soft shadows and polished edges replace flat facets.
  const plinth=mesh(new THREE.CylinderGeometry(2.08,2.18,.16,128),graphite);plinth.position.y=-.12;
  const rimBase=mesh(new THREE.CylinderGeometry(2.1,2.1,.035,128),metal);rimBase.position.y=-.04;
  const surface=mesh(new THREE.CylinderGeometry(2.05,2.05,.04,128),dark);surface.position.y=-.005;
  ring(1.94,.008,mint).position.y=.025;ring(1.77,.005,metal).position.y=.03;
  for(let i=0;i<48;i++){const mark=mesh(new THREE.BoxGeometry(.035,.005,i%4===0?.12:.055),metal);const a=i*Math.PI/24;mark.position.set(Math.sin(a)*1.86,.035,Math.cos(a)*1.86);mark.rotation.y=a;}
  const foot=mesh(new THREE.CylinderGeometry(.68,.78,.14,96),graphite);foot.position.y=.09;ring(.72,.018,metal).position.y=.155;
  this.core=new THREE.Group();this.world.add(this.core);this.core.userData.landmark=0;
  const shape=(flip)=>{const s=new THREE.Shape(),p=[[-1.15,-.23],[.86,-.23],[1.15,.23],[-.86,.23]].map(([x,y])=>new THREE.Vector2(flip?-x:x,y));if(flip)p.reverse();for(let i=0;i<4;i++){const a=p[(i+3)%4],b=p[i],d=p[(i+1)%4],v=a.clone().sub(b).normalize().multiplyScalar(.08).add(b),q=d.clone().sub(b).normalize().multiplyScalar(.08).add(b);if(!i)s.moveTo(v.x,v.y);else s.lineTo(v.x,v.y);s.quadraticCurveTo(b.x,b.y,q.x,q.y);}s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.17,bevelEnabled:true,bevelThickness:.045,bevelSize:.04,bevelSegments:5,curveSegments:16});g.center();g.computeVertexNormals();return g;};
  this.layers=[];
  for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set(0,.64+i*.43,0);this.core.add(g);const shell=mesh(shape(i===1),i===1?violet:metal,g);shell.rotation.x=-Math.PI/2;const top=mesh(shape(i===1),i===1?smoked:mint,g);top.scale.set(.91,.83,.88);top.rotation.x=-Math.PI/2;top.position.y=.095;this.layers.push(g);}
  this.core.rotation.y=-.35;
  this.halo=new THREE.Group();this.world.add(this.halo);this.halo.position.y=1.0;this.halo.rotation.set(.3,0,-.2);
  ring(1.55,.012,metal,this.halo);const arc=new THREE.Mesh(new THREE.TorusGeometry(1.55,.018,10,96,Math.PI*.42),emissive);this.geos.add(arc.geometry);arc.rotation.x=Math.PI/2;this.halo.add(arc);
  this.selectionRing=ring(.62,.009,emissive);this.selectionRing.position.y=.17;this.landmarks=[this.core];
  const positions=[[-2.65,.48,.75],[2.5,.75,-.75],[1.65,.45,2.15]];
  positions.forEach((p,i)=>{const g=new THREE.Group();g.position.set(...p);g.rotation.y=-.35;g.userData.landmark=i+1;this.world.add(g);this.landmarks.push(g);
   const body=mesh(rounded(i===1?.76:.85,i===1?.96:.64,.1,.12),graphite,g);body.rotation.x=-.16;
   const face=mesh(rounded(i===1?.64:.73,i===1?.82:.52,.015,.09),i===0?smoked:i===1?violet:smoked,g);face.position.z=.075;face.rotation.x=-.16;
   const rail=mesh(new THREE.BoxGeometry(.42,.015,.02),i===1?violet:mint,g);rail.position.set(0,-.22,.11);
   const badge=mesh(new THREE.CylinderGeometry(.12,.12,.025,48),i===1?white:mint,g);badge.rotation.x=Math.PI/2;badge.position.set(0,.04,.13);
   if(i===0){const latch=mesh(rounded(.27,.15,.035,.035),metal,g);latch.position.set(.28,0,.13);}
   if(i===1){for(let j=0;j<3;j++){const l=mesh(new THREE.BoxGeometry(.34,.035,.03),white,g);l.position.set(0,.14-j*.13,.13);l.rotation.z=j===1?-.18:.18;}}
   if(i===2){for(let j=0;j<3;j++){const l=mesh(new THREE.BoxGeometry(.24-j*.04,.015,.02),metal,g);l.position.set(-.07,.13-j*.1,.12);}}
   const connector=new THREE.CatmullRomCurve3([new THREE.Vector3(p[0],.05,p[2]),new THREE.Vector3(p[0]*.6,.06,p[2]*.65),new THREE.Vector3(0,.12,0)]);mesh(new THREE.TubeGeometry(connector,48,.007,6,false),i===1?violet:mint);
  });
  // Three luminous markers orbit the relay. They illustrate motion, not transfers.
  this.packets=[];for(let i=0;i<3;i++){const b=mesh(new THREE.SphereGeometry(.04,16,16),emissive);this.packets.push(b);}
  const floor=mesh(new THREE.PlaneGeometry(40,40),new THREE.ShadowMaterial({color:0x000000,opacity:.3}),scene);this.mats.add(floor.material);floor.rotation.x=-Math.PI/2;floor.position.y=-.22;
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();
 }
 resize(){if(!this.renderer)return;const r=this.getBoundingClientRect();if(!r.width||!r.height)return;this.renderer.setSize(r.width,r.height,false);this.camera.aspect=r.width/r.height;this.camera.fov=r.width<420?35:29;this.camera.updateProjectionMatrix();this.draw();}
 select(i){this.selected=i;this.dataset.selected=String(i);this.querySelectorAll('[data-node]').forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));this.querySelector('.engine-selected').textContent=names[i];this.draw();}
 pick(e){const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.landmarks,true)[0];if(hit){let p=hit.object;while(p&&p.userData.landmark===undefined)p=p.parent;if(p)this.select(p.userData.landmark);}}
 updateMotion(){const b=this.querySelector('[data-action=pause]');if(!b)return;const label=this.paused?'Play animation':'Pause animation';b.innerHTML=this.paused?icons.play:icons.pause;b.title=label;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(!this.paused));}
 command(a){if(a==='pause'){if(motion.matches&&!this.paused)return;this.paused=!this.paused;if(motion.matches)this.paused=true;this.updateMotion();this.paused?this.stop():this.start();return;}if(a==='left')this.yaw-=.22;if(a==='right')this.yaw+=.22;if(a==='plus')this.zoom=Math.min(1.25,this.zoom+.1);if(a==='minus')this.zoom=Math.max(.8,this.zoom-.1);if(a==='reset'){this.yaw=0;this.pitch=0;this.zoom=1.02;this.select(0);}this.draw();}
 draw(){if(!this.renderer)return;this.world.rotation.y=this.yaw;this.world.rotation.x=this.pitch;this.world.scale.setScalar(this.zoom);const t=this.time;this.layers?.forEach((g,i)=>{g.position.y=.64+i*.43+Math.sin(t*.8+i*.7)*.035;});this.halo.rotation.y=t*.14;this.core.rotation.y=-.35+t*.08;this.landmarks?.slice(1).forEach((g,i)=>{g.position.y=[.48,.75,.45][i]+Math.sin(t*.65+i*1.8)*.05;});const selected=this.landmarks[this.selected];if(this.selected===0)this.selectionRing.position.set(0,.17,0);else this.selectionRing.position.set(selected.position.x,selected.position.y-.36,selected.position.z);this.selectionRing.scale.setScalar(this.selected===0?1:.7);this.packets?.forEach((p,i)=>{const a=t*.22+i*Math.PI*2/3;p.position.set(Math.sin(a)*1.55,1+Math.sin(a)*.17,Math.cos(a)*1.55);});this.renderer.render(this.scene,this.camera);}
 start(){if(this.frame||this.paused||!this.visible||document.hidden)return;this.last=0;const tick=stamp=>{this.frame=0;if(this.paused||!this.visible||document.hidden)return;if(!this.last)this.last=stamp;if(stamp-this.last>=33){this.time+=Math.min((stamp-this.last)/1000,.06);this.last=stamp;this.draw();}this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);}
 stop(){cancelAnimationFrame(this.frame);this.frame=0;}
 disconnectedCallback(){this.stop();this.abort?.abort();this.ro?.disconnect();this.io?.disconnect();this.parentElement?.classList.remove('has-relynx-model');this.geos?.forEach(x=>x.dispose());this.mats?.forEach(x=>x.dispose());this.env?.dispose();this.renderer?.dispose();this.ready=false;}
}
if(!customElements.get('relynx-model'))customElements.define('relynx-model',RelynxModel);
const mount=()=>{const art=document.querySelector('#overview .sol-hero-art');if(!art)return false;if(!art.querySelector('relynx-model'))art.append(document.createElement('relynx-model'));return true;};
if(!mount()){const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(document.getElementById('root')||document.body,{subtree:true,childList:true});}
