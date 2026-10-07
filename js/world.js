import * as THREE from '../vendor/three.module.js';
const D=window.QE3Data,N=window.QE3Nav;
export class FactoryWorld{
 constructor(canvas,labels,state,callbacks){
  this.canvas=canvas;this.labels=labels;this.state=state;this.cb=callbacks;this.mode='factory';this.keys={};this.path=[];this.materials=new Map();this.elapsed=0;
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#c2d1c7');
  this.scene.add(new THREE.HemisphereLight(0xfff5df,0x637c70,2.6));
  this.sun=new THREE.DirectionalLight(0xfff3d3,3.2);this.sun.position.set(-12,35,15);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:100});this.sun.shadow.bias=-.001;this.scene.add(this.sun);
  this.camera=new THREE.OrthographicCamera(-30,30,24,-24,.1,150);this.focus=new THREE.Vector3(0,0,0);
  this.factory=new THREE.Group();this.house=new THREE.Group();this.scene.add(this.factory,this.house);this.house.visible=false;
  this.buildFactory();this.buildHome();
  this.player=this.person('#d48654',true);this.scene.add(this.player);this.player.position.set(state.position.x,0,state.position.z);this.setOutfit(state.outfit==='clean');
  this.marker=new THREE.Mesh(new THREE.RingGeometry(.9,1.1,32),new THREE.MeshBasicMaterial({color:0xe9a13f,side:THREE.DoubleSide,transparent:true,opacity:.8}));this.marker.rotation.x=-Math.PI/2;this.marker.position.y=.03;this.scene.add(this.marker);
  this.routeLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#d78a35',transparent:true,opacity:.65}));this.scene.add(this.routeLine);
  this.ray=new THREE.Raycaster();this.ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);this.hit=new THREE.Vector3();
  this.listen();this.resize();this.setMode(state.night>=0?'home':'factory');this.running=true;this.last=performance.now();this.animate=this.animate.bind(this);requestAnimationFrame(this.animate);
 }
 mat(color){if(!this.materials.has(color))this.materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.9,metalness:.05}));return this.materials.get(color);}
 box(group,x,y,z,w,h,d,color,shadow=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),this.mat(color));m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;group.add(m);return m;}
 cylinder(group,x,y,z,r,h,color){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,8),this.mat(color));m.position.set(x,y,z);m.castShadow=true;group.add(m);return m;}
 floor(group,w,d,color){this.box(group,0,-.35,0,w,.6,d,color,false);const points=[];for(let x=-w/2;x<=w/2;x+=2)points.push(x,0,-d/2,x,0,d/2);for(let z=-d/2;z<=d/2;z+=2)points.push(-w/2,0,z,w/2,0,z);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));group.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#b0c1b6',transparent:true,opacity:.5})));}
 person(color,player=false){
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);g.userData.body=body;
  this.box(body,0,.93,0,.7,.64,.42,color);this.box(body,0,.66,0,.58,.16,.38,'#344f4b');
  this.box(body,0,1.48,0,.5,.5,.48,'#d9b58c');const hair=this.box(body,0,1.73,-.02,.55,.18,.53,'#403c35');g.userData.hair=hair;
  this.box(body,-.12,1.5,.245,.05,.06,.025,'#333c36');this.box(body,.12,1.5,.245,.05,.06,.025,'#333c36');
  this.box(body,.45,.95,0,.2,.54,.26,color);this.box(body,-.45,.95,0,.2,.54,.26,color);
  this.box(body,.43,.65,.02,.18,.14,.23,'#d9b58c');this.box(body,-.43,.65,.02,.18,.14,.23,'#d9b58c');
  this.box(body,.13,1.0,.225,.16,.22,.04,'#eee4c9');this.box(body,.13,1.03,.251,.08,.06,.012,player?'#b66335':'#819da2');
  const left=new THREE.Group(),right=new THREE.Group();left.position.set(-.18,.62,0);right.position.set(.18,.62,0);body.add(left,right);
  for(const leg of [left,right]){this.box(leg,0,-.22,0,.25,.43,.28,'#3b5552');this.box(leg,0,-.47,.05,.28,.16,.4,'#2c3937');}
  g.userData.legs=[left,right];
  if(player){const suit=new THREE.Group();this.box(suit,0,.94,0,.74,.68,.46,'#e1ece6');this.box(suit,-.45,.96,0,.22,.57,.28,'#e1ece6');this.box(suit,.45,.96,0,.22,.57,.28,'#e1ece6');this.box(suit,0,1.72,0,.59,.24,.55,'#eef3ed');this.box(suit,-.27,1.49,0,.07,.46,.55,'#e1ece6');this.box(suit,.27,1.49,0,.07,.46,.55,'#e1ece6');this.box(suit,0,1.36,.25,.45,.19,.055,'#82b9b5');this.box(suit,.13,1.0,.245,.17,.22,.04,'#fff6d8');body.add(suit);g.userData.suit=suit;}
  return g;
 }
 bench(group,x,z,color='#768f86'){this.box(group,x,1.3,z,4,.22,1.6,color);for(const dx of [-1.5,1.5])this.box(group,x+dx,.65,z,.2,1.3,1.4,'#536960');}
 rack(group,x,z){this.box(group,x,1.7,z,1.6,3.4,1.5,'#536b64');this.box(group,x,1.65,z+.78,1.34,2.85,.04,'#233f3a');for(let y=.55;y<3;y+=.48){this.box(group,x,y,z+.82,1.2,.3,.06,'#7c958b');this.box(group,x+.43,y,z+.86,.09,.07,.03,'#b4df90');}this.box(group,x,3.47,z,1.68,.14,1.58,'#a2b6a9');}
 label(id,point){const el=document.createElement('button');el.type='button';el.className='world-label';el.setAttribute('aria-label','前往'+D.stations[id].name);el.innerHTML='<span class="label-pip"></span><span>'+D.stations[id].name+'</span><b>!</b>';el.addEventListener('click',()=>{if(this.cb.canMove())this.navigate(id);});this.labels.appendChild(el);return {id,point:new THREE.Vector3(point.x,point.y,point.z),el};}
 buildFactory(){
  const g=this.factory;this.floor(g,50,34,'#d2d9cf');
  this.box(g,18,-.035,-8,14,.05,17,'#c4e0d7',false);
  this.box(g,-17,-.025,10,17,.04,12,'#d7cebd',false);
  this.box(g,15,-.02,8,17,.035,10,'#d9d7bc',false);
  this.box(g,-.5,-.01,0,1,.025,30,'#eee4a7',false);this.box(g,0,-.005,2.5,48,.025,.25,'#ad965c',false);
  this.box(g,0,1,-17,50,2,.5,'#a8beb2');this.box(g,-25,1,0,.5,2,34,'#a8beb2');
  for(const r of N.factory.slice(10)){this.box(g,r.x,1.5,r.z,r.w,3,r.d,'#c5d8cd');this.box(g,r.x,2.95,r.z,r.w,.12,r.d+.06,'#7aaba0');}
  this.gateBar=this.box(g,11,1,-6,.3,.18,4,'#bd8e55');
  for(const z of [-8,-4]){this.box(g,11,1.35,z,.7,2.7,.7,'#618e85');this.box(g,10.58,1.8,z,.12,.35,.26,'#dfbc6c');}
  this.box(g,9.5,.9,-7,.5,1.8,.5,'#657f75');this.box(g,9.5,1.8,-6.73,.6,.5,.12,'#284e48');
  for(const x of [-20,-17,-14]){this.box(g,x,.4,-13,1.8,.8,1.5,'#b7a578');this.box(g,x,1.15,-13,1.6,.7,1.4,'#cdbd93');this.box(g,x,1.2,-12.27,.5,.3,.04,'#f5eddc');}
  this.bench(g,-18,-3.2);this.box(g,-18,1.75,-3.2,1.5,.8,.18,'#34544c');
  this.box(g,-7,1.5,-13,4.5,3,2.5,'#9bac9c');this.box(g,-7,1.7,-11.7,2.2,1.3,.05,'#344f48');this.box(g,-5.7,2.2,-11.65,.4,.4,.08,'#c2d79c');
  this.box(g,-3.5,.65,-13,1.5,1.3,2,'#e5e9dc');this.box(g,-3.5,1.5,-13,1.5,.1,2,'#81958c');this.box(g,-3.9,2,-13,.2,1,1.8,'#667c70');this.box(g,-3.5,2.5,-13,1,.15,1.8,'#667c70');
  this.bench(g,-6,-3.5,'#928f7b');this.box(g,-6,1.55,-3.5,2.5,.3,.8,'#a2ada1');this.box(g,-8,2,-3.5,.3,1.6,.3,'#c7905d');this.box(g,-7.5,2.8,-3.5,1.3,.25,.3,'#cf945d');
  for(const x of [-17,-7,0]){const z=x===0?5.8:8;this.bench(g,x,z,'#9f967d');this.box(g,x,1.75,z,1.2,.85,.12,'#526d65');this.box(g,x,1.75,z+.08,1,.6,.02,'#acd2bd');this.box(g,x,1.44,z+.35,1,.06,.5,'#76847a');}
  this.bench(g,18,-13,'#8baba2');this.box(g,18,1.6,-13,2.6,.35,.6,'#b7c9c5');
  for(const x of [17.1,17.7,18.3,18.9]){const pipe=this.cylinder(g,x,1.8,-13,.12,.6,'#718f8a');pipe.rotation.z=Math.PI/2;this.cylinder(g,x,1.8,-12.7,.11,.25,'#d4b778');}
  this.box(g,21,1,-13,1.8,2,1.7,'#93b8ad');this.box(g,21,1.25,-12.12,1.4,.8,.06,'#346b65');
  this.rack(g,15,5);this.rack(g,17.4,5);this.rack(g,19.8,5);this.box(g,21.5,.65,5,1.3,1.3,2,'#c9b786');
  this.bench(g,5,11,'#baac86');this.box(g,5,1.7,11,1.1,.55,.9,'#647b71');this.box(g,5,1.7,11.47,.8,.35,.04,'#b9cdba');this.box(g,4,1.44,11,.4,.2,.4,'#e6d7a8');
  this.box(g,22,1.2,16,.5,2.4,.5,'#567769');this.box(g,22,2,15.7,.7,.5,.15,'#b5d294');
  this.stationLabels=[];
  for(const [id,s]of Object.entries(D.stations)){if(id==='home')continue;this.stationLabels.push(this.label(id,{x:s.x,y:3.6,z:s.z-1}));if(!['gate','exit','lunch'].includes(id)){const npc=this.person(s.color);npc.position.set(s.x+1.2,0,s.z-.6);npc.rotation.y=.3;g.add(npc);}}
  for(const x of [-23,23]){this.box(g,x,.35,13,1,.7,1,'#a79776');for(const dx of [-.3,.3])this.box(g,x+dx,1,13,.5,1,.7,'#87a484');}
 }
 buildHome(){const g=this.house;this.floor(g,22,16,'#d2bf9e');this.box(g,0,1.4,-8,22,2.8,.5,'#9eac99');this.box(g,-11,1.4,0,.5,2.8,16,'#b5bda7');this.box(g,5,.65,3,4,1.3,3,'#a89680');this.box(g,5,1.5,4.2,4,1,1,'#a89680');this.box(g,-7,.5,3,3,1,3,'#c2ae85');this.box(g,5,.8,-4,5,1.6,3,'#899b89');this.bench(g,-3,-5,'#b6a17d');this.box(g,-3,1.5,-4.7,1.4,.08,1,'#4b615b');this.box(g,-3,1.95,-5,1.4,.9,.08,'#4b615b');this.box(g,-3,1.95,-4.94,1.2,.7,.02,'#d9ddb3');this.cylinder(g,-1.5,1.5,-5,.15,.25,'#e4d6b8');this.homeLabel=this.label('home',{x:-3,y:3.5,z:-3});}
 setOutfit(clean){this.player.userData.suit.visible=clean;this.player.userData.hair.visible=!clean;this.gateBar.visible=!this.state.gateOpen;}
 setMode(mode){this.mode=mode;this.factory.visible=mode==='factory';this.house.visible=mode==='home';this.sun.intensity=mode==='home'?1.2:3.2;this.scene.background.set(mode==='home'?'#384d49':'#c2d1c7');this.path=[];this.updateLine();this.player.position.set(this.state.position.x,0,this.state.position.z);this.focus.set(0,0,0);this.setOutfit(this.state.outfit==='clean');this.resize();}
 sync(state){this.state=state;const mode=state.night>=0?'home':'factory';if(mode!==this.mode)this.setMode(mode);this.setOutfit(state.outfit==='clean');}
 goal(id){this.goalId=id;const s=D.stations[id];this.marker.position.set(s.x,.04,s.z);this.marker.visible=!this.state.ended;}
 stop(){this.path=[];this.keys={};this.updateLine();}
 navigate(id){const s=D.stations[id];let target=s;
  if(id==='test'&&!this.state.gateOpen){target=D.stations.gate;this.cb.notice('液冷區需要換無塵服。先到閘門按 E 刷卡。');}
  this.path=N.path(this.player.position,target,this.mode,this.state.gateOpen);this.keys={};this.updateLine();if(!this.path.length&&Math.hypot(this.player.position.x-target.x,this.player.position.z-target.z)>2)this.cb.notice('這個位置暫時無法抵達，請先回到閘門。');
 }
 updateLine(){this.routeLine.geometry.dispose();this.routeLine.geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(this.player?.position.x||0,.04,this.player?.position.z||0),...this.path.map(p=>new THREE.Vector3(p.x,.04,p.z))]);this.routeLine.visible=this.path.length>0;}
 listen(){
  window.addEventListener('resize',()=>this.resize());window.addEventListener('blur',()=>{this.keys={};});
  document.addEventListener('keydown',ev=>{if(!this.cb.canMove()||/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName))return;const key=ev.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)){ev.preventDefault();this.keys[key]=true;this.path=[];this.updateLine();}if(key==='e'&&!ev.repeat){ev.preventDefault();this.cb.interact();}});
  document.addEventListener('keyup',ev=>{this.keys[ev.key.toLowerCase()]=false;});
  this.canvas.addEventListener('pointerdown',ev=>{this.down={x:ev.clientX,y:ev.clientY};});
  this.canvas.addEventListener('pointerup',ev=>{if(!this.cb.canMove()||!this.down||Math.hypot(ev.clientX-this.down.x,ev.clientY-this.down.y)>10)return;const r=this.canvas.getBoundingClientRect();const mouse=new THREE.Vector2((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(mouse,this.camera);if(this.ray.ray.intersectPlane(this.ground,this.hit)){this.path=N.path(this.player.position,this.hit,this.mode,this.state.gateOpen);this.updateLine();}});
 }
 touch(key,pressed){this.keys[key]=pressed;if(pressed){this.path=[];this.updateLine();}}
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);const aspect=w/h;const span=w<720?15:this.mode==='home'?16:23,offset=w<720?3:4,vertical=w<720?3:0;this.camera.left=-span*aspect+offset;this.camera.right=span*aspect+offset;this.camera.top=span+vertical;this.camera.bottom=-span+vertical;this.camera.updateProjectionMatrix();}
 nearest(){const list=this.mode==='home'?['home']:Object.keys(D.stations).filter(k=>k!=='home');let best=null;for(const id of list){const s=D.stations[id],d=Math.hypot(s.x-this.player.position.x,s.z-this.player.position.z);if(d<3&&(!best||d<best.d))best={id,d};}return best?.id||null;}
 animate(now){if(!this.running)return;const dt=Math.min((now-this.last)/1000,.05);this.last=now;this.elapsed+=dt;let dx=0,dz=0,moving=false;
  if(this.cb.canMove()){
   const up=this.keys.w||this.keys.arrowup,down=this.keys.s||this.keys.arrowdown,left=this.keys.a||this.keys.arrowleft,right=this.keys.d||this.keys.arrowright;
   if(up||down||left||right){const h=Number(!!right)-Number(!!left),v=Number(!!up)-Number(!!down);dx=(h-v)*.707;dz=(-h-v)*.707;const len=Math.hypot(dx,dz);dx/=len;dz/=len;const speed=this.keys.shift?10:6;dx*=speed*dt;dz*=speed*dt;}
   else if(this.path.length){const p=this.path[0],dist=Math.hypot(p.x-this.player.position.x,p.z-this.player.position.z);if(dist<.15){this.path.shift();if(!this.path.length)this.updateLine();}else{const step=Math.min(dist,12*dt);dx=(p.x-this.player.position.x)/dist*step;dz=(p.z-this.player.position.z)/dist*step;}}
   const p=this.player.position;const canX=!N.blocked(p.x+dx,p.z,this.mode,this.state.gateOpen),canZ=!N.blocked(p.x,p.z+dz,this.mode,this.state.gateOpen);if(canX)p.x+=dx;if(canZ)p.z+=dz;moving=(canX&&dx!==0)||(canZ&&dz!==0);if((dx||dz)&&!moving&&this.path.length){this.path=[];this.updateLine();}
   if(moving)this.player.rotation.y=Math.atan2(dx,dz);
   this.state.position={x:p.x,z:p.z};
   if(this.mode==='factory'&&this.state.outfit==='clean'){if(N.inside(p.x,p.z))this.state.flags.inClean=true;else if(this.state.flags.inClean&&p.x<10.1){this.cb.exitClean();this.setOutfit(false);}}
  }
  const b=this.player.userData.body;b.position.y=moving?Math.sin(this.elapsed*15)*.035:0;const legs=this.player.userData.legs;legs[0].rotation.x=moving?Math.sin(this.elapsed*15)*.4:0;legs[1].rotation.x=moving?-Math.sin(this.elapsed*15)*.4:0;
  const mobile=innerWidth<720;const f=this.cb.isIntro?.() ? 0.25 : this.mode==='home' ? 0 : mobile ? 0.95 : 0.8;const desired=new THREE.Vector3(this.player.position.x*f,0,this.player.position.z*f);this.focus.lerp(desired,1-Math.exp(-dt*3));this.camera.position.copy(this.focus).add(new THREE.Vector3(33,42,36));this.camera.lookAt(this.focus);
  this.marker.scale.setScalar(1+Math.sin(this.elapsed*3)*.06);
  for(const label of [...this.stationLabels,this.homeLabel]){const visible=(label.id==='home')===(this.mode==='home');label.el.hidden=!visible;if(!visible)continue;const p=label.point.clone().project(this.camera);label.el.style.left=`${(p.x+1)/2*innerWidth}px`;label.el.style.top=`${(-p.y+1)/2*innerHeight}px`;label.el.classList.toggle('target',label.id===this.goalId);label.el.style.opacity=p.z>1||p.z< -1?'0':'1';}
  this.cb.tick(this.nearest(),this.player.position,this.mode);this.renderer.render(this.scene,this.camera);requestAnimationFrame(this.animate);
 }
}
