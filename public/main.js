import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {moveWithCollisions, isFree} from './world-collision.js';

const $ = id => document.getElementById(id);
const viewport = $('viewport');
const isTouch = matchMedia('(pointer: coarse)').matches;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdff4ff);
scene.fog = new THREE.FogExp2(0xdff4ff,0.005);
const camera = new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.1,150);
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.35;
viewport.appendChild(renderer.domElement);

const material=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:0.65,metalness:0.12,...opts});
const mat={floor:material(0xf7fbff),wall:material(0xffffff),dark:material(0xe7eff7),metal:material(0x91a7bd,{metalness:.32,roughness:.32}),mint:material(0x60cdb4,{emissive:0x0c7360,emissiveIntensity:.12}),gold:material(0xf7c579),purple:material(0xb8a0ea)};
const mesh=(geo,m,x=0,y=0,z=0,parent=scene)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o};
const box=(w,h,d,m,x=0,y=0,z=0,parent=scene)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
const cylinder=(r1,r2,h,m,x=0,y=0,z=0,parent=scene,segments=24)=>mesh(new THREE.CylinderGeometry(r1,r2,h,segments),m,x,y,z,parent);
const sphere=(r,m,x=0,y=0,z=0,parent=scene)=>mesh(new THREE.SphereGeometry(r,20,14),m,x,y,z,parent);
const strip=(x,z,w,d,m)=>box(w,.025,d,m,x,.045,z);
const group=(x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);return g};
const line=(a,b,color=0xa5eff0)=>{const geom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);const l=new THREE.Line(geom,new THREE.LineBasicMaterial({color}));scene.add(l);return l};
function labelTexture(title,sub='',color='#a4f4e6',width=640,height=160){
 const c=document.createElement('canvas');c.width=width;c.height=height;const cx=c.getContext('2d');
 cx.fillStyle='rgba(255,255,255,.96)';cx.fillRect(0,0,width,height);
 cx.strokeStyle=color;cx.lineWidth=5;cx.strokeRect(3,3,width-6,height-6);
 cx.textAlign='center';cx.fillStyle='#24384e';cx.font='bold 48px "Noto Sans KR",sans-serif';cx.fillText(title,width/2,sub?74:98);
 if(sub){cx.font='26px "Noto Sans KR",sans-serif';cx.fillStyle=color;cx.fillText(sub,width/2,122)}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function board(title,sub,x,y,z,w=5,h=1.25,color='#89ebda'){
 // Use two outward-facing front sides: DoubleSide mirrors glyphs when seen from behind.
 const texture=labelTexture(title,sub,color);
 const geometry=new THREE.PlaneGeometry(w,h);
 const front=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide}));
 const back=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide}));
 front.position.set(x,y,z+0.012);
 back.position.set(x,y,z-0.012);
 back.rotation.y=Math.PI;
 scene.add(front,back);
 return front;
}
// JETTY SPACE v0.2 — bright museum with modular halls and twelve experiment bays.
scene.add(new THREE.HemisphereLight(0xf8ffff,0xa4b9cd,2.45));
const sunLight=new THREE.DirectionalLight(0xffffff,2.15);sunLight.position.set(-12,24,10);sunLight.castShadow=true;
sunLight.shadow.mapSize.set(2048,2048);sunLight.shadow.camera.left=-29;sunLight.shadow.camera.right=29;
sunLight.shadow.camera.top=25;sunLight.shadow.camera.bottom=-25;sunLight.shadow.bias=-.00025;scene.add(sunLight);
const accent={mechanics:0x65ccb4,electromagnetism:0xb9a3ed,waves:0x72c8ec};
const roomFloor={mechanics:material(0xe6faf1),electromagnetism:material(0xf1ecff),waves:material(0xe5f6ff)};
const glass=material(0xd8f5ff,{transparent:true,opacity:.32,metalness:.15,roughness:.1,depthWrite:false});
const trim=material(0xd0dfeb,{metalness:.2,roughness:.4});
const wood=material(0xf1e6d7), blue=material(0x39799f),light=material(0xfff8df,{emissive:0xfff3d6,emissiveIntensity:.18});
const ground=box(49,.3,37,mat.floor,0,-.2,0);ground.receiveShadow=true;
// Solid walls, skylight rails and columns used to keep the camera outside geometry.
const cameraBlockers=[];
function cameraWall(w,h,d,m,x,y,z){const o=box(w,h,d,m,x,y,z);cameraBlockers.push(o);return o;}
// Three galleries: left (-15,-5), right (15,-5), and north (0,-11).
for(const [x,z,w,d,m] of [[-15,-5,16,24,roomFloor.mechanics],[15,-5,16,24,roomFloor.electromagnetism],[0,-11,14,12,roomFloor.waves],[0,8,14,18,material(0xfffcf5)]]){
 const g=box(w,.03,d,m,x,.015,z);g.receiveShadow=true;
}
// Perimeter with open ceiling and a translucent skylight grid.
for(const x of [-24,24])cameraWall(.35,5.9,37,mat.wall,x,2.9,0);
for(const z of [-18,18])cameraWall(48,5.9,.35,mat.wall,0,2.9,z);
for(const x of [-23,-8,8,23])for(const z of [-17,0,17]){
 const column=cameraWall(.36,6.2,.36,trim,x,3.0,z);column.castShadow=true;
 sphere(.22,light,x,6.2,z);
}
// Internal boundaries intentionally leave generous 5m doorways to lobby.
for(const x of [-7,7]){
  cameraWall(.26,4.4,10,mat.wall,x,2.2,-12.9);
  cameraWall(.26,4.4,5,mat.wall,x,2.2,3.0);
  cameraWall(.26,4.4,5,mat.wall,x,2.2,14.5);
  box(.3,.35,5.0,trim,x,4.35,8.1);
}
// Separation between wave gallery and lobby, with a central entrance.
for(const x of [-4.6,4.6])cameraWall(4.8,4.35,.25,mat.wall,x,2.2,-4.65);
cameraWall(5,.32,.3,trim,0,4.35,-4.65);
// Gallery floors are distinct, and all four doorways remain clear.
for(const [x,z,w,d,m] of [[-8.1,8.0,4.1,.17,mat.mint],[8.1,8.0,4.1,.17,mat.purple],[0,-4.4,4.1,.17,blue]])
  box(w,.035,d,m,x,.07,z);
// Skylights are translucent: full daylight without dark enclosed-ceiling effect.
for(const x of [-20,-10,0,10,20])cameraWall(.13,.1,35,trim,x,6.18,0);
for(const z of [-16,-7,2,11,17])cameraWall(47,.1,.14,trim,0,6.18,z);
for(const x of [-15,0,15])for(const z of [-10,3,12]){
 const pane=box(12,.022,6,glass,x,6.12,z);pane.renderOrder=1;cameraBlockers.push(pane);
}
// Arch and signage for the welcome lobby.
board('JETTY SPACE','DISCOVER · PLAY · LEARN',0,4.75,17.73,7.4,1.55,'#6cb5d5');
const lobbyPlatform=cylinder(3.25,3.3,.13,material(0xebf6ff),0,.1,9.4);lobbyPlatform.receiveShadow=true;
const lobbyCircle=mesh(new THREE.TorusGeometry(3.2,.055,7,68),mat.mint,0,.18,9.4);lobbyCircle.rotation.x=Math.PI/2;
cylinder(.56,.65,1.55,wood,0,.85,9.4);sphere(.63,material(0x80d5e8,{emissive:0x297b98,emissiveIntensity:.16}),0,1.9,9.4);
board('WELCOME','MECHANICS  ·  ELECTROMAGNETISM  ·  WAVES',0,3.5,11.1,6.5,1.14,'#6bcbb7');
// A simple repeatable empty exhibit slot. Future modules attach to this anchor.
const experimentSlots={mechanics:[],electromagnetism:[],waves:[]};
function makeSlot(hall,index,x,z,color){
 const base=box(3.35,.4,2.65,mat.wall,x,.27,z);base.castShadow=true;
 box(3.45,.075,2.75,material(color),x,.49,z);
 const pod=box(2.75,.07,2.0,material(0xf1f6fa),x,.57,z);pod.castShadow=true;
 for(const dx of [-1.3,1.3])for(const dz of [-.95,.95])box(.09,.54,.09,trim,x+dx,.28,z+dz);
 cylinder(.36,.42,.28,material(color,{transparent:true,opacity:.65}),x,.78,z);
 board(`LAB ${String(index+1).padStart(2,'0')}`,'실험 추가 예정',x,2.0,z-1.05,2.75,.83,'#6d93ad');
 experimentSlots[hall].push({id:`${hall}-${index+1}`,x,z});
}
const EXHIBITS={
 mechanics:{pos:new THREE.Vector3(-15,0,-5),name:'역학관',category:'MECHANICS HALL · 실험관 01',title:'역학관 — 운동과 에너지',description:'힘과 운동, 운동량과 에너지의 관계를 탐구하는 실험관입니다.\n\n실험대 네 곳을 마련했습니다. 향후 포물선 운동, 충돌, 용수철 단진동, 역학적 에너지 보존 실험을 하나씩 추가합니다.',formula:'운동 · 힘 · 에너지',fact:'v0.2는 공간과 실험 슬롯을 구현한 버전입니다. 조작형 물리 실험은 다음 버전부터 추가합니다.',color:accent.mechanics},
 electromagnetism:{pos:new THREE.Vector3(15,0,-5),name:'전자기관',category:'ELECTROMAGNETISM HALL · 실험관 02',title:'전자기관 — 전기와 자기',description:'전하 사이의 상호작용과 전류가 만드는 자기장, 전자기 유도를 탐구하는 공간입니다.\n\n향후 전기장, 솔레노이드, 전자기 유도, 하전 입자 운동 실험을 추가합니다.',formula:'전기장 · 자기장 · 전자기 유도',fact:'모든 실험대는 향후 개별 실험 모듈을 연결할 수 있는 고정 슬롯입니다.',color:accent.electromagnetism},
 waves:{pos:new THREE.Vector3(0,0,-11),name:'파동관',category:'WAVES HALL · 실험관 03',title:'파동관 — 진동과 파동',description:'파동의 전파와 중첩, 간섭, 정상파를 관찰하고 실험할 수 있도록 준비한 공간입니다.\n\n향후 횡파와 종파, 파동의 간섭, 줄의 정상파, 이중 슬릿 실험을 추가합니다.',formula:'진동 · 중첩 · 간섭',fact:'파동의 속력, 진동수, 파장 등의 변인을 조절하는 실험을 다음 버전에서 구현합니다.',color:accent.waves}
};
// Galleries feature distinct architecture and four unoccupied experimentation stations each.
function hallDecor(hall,x,z,color,title,subtitle){
 const colorMat=material(color,{emissive:color,emissiveIntensity:.1});
 const rim=mesh(new THREE.TorusGeometry(3.05,.09,9,60),colorMat,x,.13,z);rim.rotation.x=Math.PI/2;
 board(title,subtitle,x,4.5,z-5.3,6.4,1.28,'#6f9ab5');
 const glow=new THREE.PointLight(color,11,12,2);glow.position.set(x,4.8,z);scene.add(glow);
 for(const dx of [-5.9,5.9])box(.23,3.1,.23,colorMat,x+dx,1.65,z-4.9);
 const positions=[[-3.6,-2.1],[3.6,-2.1],[-3.6,3.1],[3.6,3.1]];
 positions.forEach(([dx,dz],i)=>makeSlot(hall,i,x+dx,z+dz,color));
}
hallDecor('mechanics',-15,-5,accent.mechanics,'01 · 역학관','MECHANICS · MOTION & ENERGY');
hallDecor('electromagnetism',15,-5,accent.electromagnetism,'02 · 전자기관','ELECTRICITY & MAGNETISM');
hallDecor('waves',0,-11,accent.waves,'03 · 파동관','VIBRATION & WAVES');
// Lightweight animated decorative installations (not quantitative physics experiments).
const ornaments=[];
for(const [x,z,col,kind] of [[-15,-5,accent.mechanics,'mechanics'],[15,-5,accent.electromagnetism,'electromagnetism'],[0,-11,accent.waves,'waves']]){
 const ring=mesh(new THREE.TorusGeometry(1.15,.055,10,70),material(col,{emissive:col,emissiveIntensity:.32}),x,3.15,z);
 if(kind==='mechanics')ring.rotation.y=.6;
 else if(kind==='electromagnetism')ring.rotation.x=.5;
 else ring.rotation.z=.45;
 ornaments.push({ring,kind});
}
// GLB avatar integration: preserve original textures and three built-in animation clips.
// The downloaded GLB is a single male researcher model (female customizations will follow).
const avatars = new Map();
let myId = null, ws = null, joined = false;
const local = {x:0,z:7.2,rot:Math.PI};
const visited = new Set();
let avatarSource = null;
let avatarClips = {};
let assetLoading = true;
const avatarHeight = 1.85;
const avatarStatus = $('avatarStatus');
$('enterBtn').disabled = true;

function avatarLabel(name) {
 const can=document.createElement('canvas');can.width=512;can.height=100;
 const ctx=can.getContext('2d');
 ctx.fillStyle='rgba(4,14,27,.86)';ctx.fillRect(10,3,492,90);
 ctx.strokeStyle='#7cabb6';ctx.strokeRect(10,3,492,90);
 ctx.fillStyle='#f1ffff';ctx.textAlign='center';ctx.font='bold 37px "Noto Sans KR",sans-serif';ctx.fillText(name,256,61);
 const t=new THREE.CanvasTexture(can);t.colorSpace=THREE.SRGBColorSpace;
 return new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthWrite:false,transparent:true}));
}

// We clone the model graph per visitor, so each has an independent AnimationMixer.
// This GLB has no skins; animations target separate named mesh nodes.
function makeAvatar(player,self=false) {
 if(!avatarSource) return null;
 const g=group(player.x,0,player.z);
 const model=avatarSource.clone(true);
 model.rotation.y=Math.PI; // GLB faces local +Z; our movement system faces local -Z.
 model.traverse(o=>{
   if(o.isMesh){
     o.castShadow = !(Array.isArray(o.material) ? o.material.some(m=>m.transparent) : o.material?.transparent);
     o.receiveShadow = false;
   }
 });
 const box0=new THREE.Box3().setFromObject(model);
 const rawHeight=box0.max.y-box0.min.y;
 if(rawHeight>0.001)model.scale.setScalar(avatarHeight/rawHeight);
 model.updateMatrixWorld(true);
 const box1=new THREE.Box3().setFromObject(model);
 const center=box1.getCenter(new THREE.Vector3());
 model.position.set(-center.x,-box1.min.y,-center.z);
 g.add(model);
 const mixer=new THREE.AnimationMixer(model);
 const nameplate=avatarLabel(player.name);
 nameplate.position.set(0,2.28,0);nameplate.scale.set(1.85,.38,1);
 g.add(nameplate);
 g.rotation.y=player.rot??0;
 const avatar={g,model,nameplate,mixer,actions:{},animName:null,action:null,waveUntil:0,motionUntil:0,
   target:new THREE.Vector3(player.x,0,player.z),rotation:player.rot??0,self};
 avatars.set(player.id,avatar);
 setAvatarClip(avatar,'Idle');
 return g;
}
function setAvatarClip(a,name,force=false) {
 const clip=avatarClips[name];
 if(!clip || (a.animName===name && !force))return;
 const old=a.action;
 const action=a.actions[name]??a.mixer.clipAction(clip);
 a.actions[name]=action;
 action.enabled=true;
 action.setEffectiveWeight(1);
 action.setEffectiveTimeScale(1);
 action.reset();
 if(name==='Wave'){
  action.setLoop(THREE.LoopOnce,1);
  action.clampWhenFinished=true;
 } else {
  action.setLoop(THREE.LoopRepeat,Infinity);
  action.clampWhenFinished=false;
 }
 action.fadeIn(.16).play();
 if(old&&old!==action)old.fadeOut(.16);
 a.action=action;
 a.animName=name;
}
function playWave(id,relay=false){
 const a=avatars.get(id);
 if(!a || !avatarClips.Wave || a.waveUntil>elapsed)return;
 a.waveUntil=elapsed+Math.max(.5,avatarClips.Wave.duration);
 setAvatarClip(a,'Wave',true);
 if(relay)send({type:'wave'});
}
function refreshAvatar(p){
 const a=avatars.get(p.id);
 if(!a){makeAvatar(p,p.id===myId);return}
 a.target.set(p.x,0,p.z);
 a.rotation=p.rot;
 a.g.remove(a.nameplate);
 a.nameplate.material.map.dispose();a.nameplate.material.dispose();
 a.nameplate=avatarLabel(p.name);
 a.nameplate.position.set(0,2.28,0);a.nameplate.scale.set(1.85,.38,1);
 a.g.add(a.nameplate);
}
function removeAvatar(id){
 const a=avatars.get(id);if(!a)return;
 a.mixer.stopAllAction();
 a.nameplate.material.map.dispose();a.nameplate.material.dispose();
 scene.remove(a.g); // Shared GLB geometry/materials are intentionally NOT disposed.
 avatars.delete(id);
}
// GLTFLoader module and its utility imports are served from the installed Three.js package.
// If loading fails, entry remains disabled and a visible diagnostic appears.
new GLTFLoader().load('/models/jetty_boy.glb',gltf=>{
 avatarSource=gltf.scene;
 avatarClips=Object.fromEntries(gltf.animations.map(c=>[c.name,c]));
 assetLoading=false;
 avatarStatus.textContent='✓ GLB 로딩 완료 · 대기 / 걷기 / 손 흔들기';
 avatarStatus.classList.add('ready');
 $('enterBtn').disabled=false;
 console.info('[JETTY GLB] loaded',gltf.animations.map(c=>c.name));
},undefined,error=>{
 assetLoading=false;
 avatarStatus.textContent='⚠ 3D 캐릭터를 불러오지 못했어. F12 → Console에서 오류를 확인해 줘.';
 avatarStatus.classList.add('failed');
 console.error('[JETTY GLB] load failed',error);
});
function setOnline(num){$('online').textContent=num}
function setConnection(ok){$('connection').classList.toggle('connected',ok);$('connection').lastChild.textContent=ok?'실시간 연결':'연결 끊김'}
let toastTimer=null;function toast(s){$('toast').textContent=s;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3300)}
function chatMessage(name,message,system=false){
 const wrap=document.createElement('div');wrap.className=system?'system-message':'message';
 if(system)wrap.textContent=message;else{const n=document.createElement('span'),m=document.createElement('span');n.className='name';m.className='body';n.textContent=name+':';m.textContent=message;wrap.append(n,m)}
 $('chatMessages').append(wrap);while($('chatMessages').children.length>45)$('chatMessages').firstChild.remove();$('chatMessages').scrollTop=$('chatMessages').scrollHeight;
}
const address=()=>`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`;
function connect(){
 ws=new WebSocket(address());
 ws.addEventListener('open',()=>{setConnection(true);send({type:'name',name:$('nickname').value});});
 ws.addEventListener('message',ev=>{
  let msg;try{msg=JSON.parse(ev.data)}catch{return}
  if(msg.type==='welcome'){myId=msg.id;for(const a of [...avatars.keys()])removeAvatar(a);for(const p of msg.players){makeAvatar(p,p.id===myId);if(p.id===myId){local.x=p.x;local.z=p.z;local.rot=p.rot}}setOnline(msg.players.length);toast('실시간 전시관에 연결되었습니다.');}
  if(msg.type==='joined'){makeAvatar(msg.player);setOnline(avatars.size);chatMessage('시스템',`${msg.player.name}님이 입장했습니다.`,true)}
  if(msg.type==='updated'){refreshAvatar(msg.player)}
  if(msg.type==='moved'){const a=avatars.get(msg.id);if(a){if(msg.id!==myId && Math.hypot(a.target.x-msg.x,a.target.z-msg.z)>.008)a.motionUntil=elapsed+.22;a.target.set(msg.x,0,msg.z);a.rotation=msg.rot} if(msg.id===myId && (!isFree(local.x,local.z) || Math.hypot(local.x-msg.x,local.z-msg.z)>1.4)){local.x=msg.x;local.z=msg.z}}
  if(msg.type==='teleported'){local.x=msg.x;local.z=msg.z;const self=avatars.get(myId);if(self){self.target.set(msg.x,0,msg.z);self.g.position.set(msg.x,0,msg.z)} }
  if(msg.type==='left'){removeAvatar(msg.id);setOnline(avatars.size)}
  if(msg.type==='chat')chatMessage(msg.name,msg.message)
  if(msg.type==='wave')playWave(msg.id,false)
  if(msg.type==='visited' && msg.id!==myId){const name=EXHIBITS[msg.exhibit]?.name||'전시';chatMessage('시스템',`${msg.name}님이 ${name}을(를) 관람했습니다.`,true)}
  if(msg.type==='error')toast(msg.message);
 });
 ws.addEventListener('close',()=>{setConnection(false);if(joined){chatMessage('시스템','연결이 끊겼습니다. 다시 연결합니다.',true);setTimeout(()=>{if(joined&&ws.readyState===WebSocket.CLOSED)connect()},2500)}});
 ws.addEventListener('error',()=>{});
}
function send(data){if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data))}

// Modal and exhibit interaction.
let activeExhibit=null;let nearest=null;
function openExhibit(id){const data=EXHIBITS[id];if(!data)return;activeExhibit=id;$('infoCategory').textContent=data.category;$('infoTitle').textContent=data.title;$('infoDescription').textContent=data.description;$('infoFormula').textContent=data.formula;$('infoFact').textContent=data.fact;$('exhibitOverlay').classList.remove('hidden')}
function finishExhibit(){if(activeExhibit){visited.add(activeExhibit);send({type:'visit',exhibit:activeExhibit});$('progressLabel').textContent=`${visited.size} / 3`;$('progressBar').style.width=`${visited.size/3*100}%`;toast(visited.size===3?'축하합니다! 모든 과학 전시를 관람했습니다.':'관람 완료! 다음 전시로 이동해 보세요.')}closeExhibit()}
function closeExhibit(){$('exhibitOverlay').classList.add('hidden');activeExhibit=null}
$('closeExhibit').addEventListener('click',closeExhibit);$('finishExhibit').addEventListener('click',finishExhibit);
$('helpBtn').addEventListener('click',()=>$('helpOverlay').classList.remove('hidden'));
$('closeHelp').addEventListener('click',()=>$('helpOverlay').classList.add('hidden'));
$('enterBtn').addEventListener('click',()=>{if(joined)return;joined=true;$('welcomeOverlay').classList.add('hidden');connect();toast('W A S D로 이동하고 실험관에 가까이 가서 E를 눌러보세요.');});
$('nickname').addEventListener('keydown',ev=>{if(ev.key==='Enter')$('enterBtn').click()});
$('chatForm').addEventListener('submit',ev=>{ev.preventDefault();const msg=$('chatInput').value.trim();if(msg){send({type:'chat',message:msg});$('chatInput').value=''}});
$('chatToggle').addEventListener('click',()=>{$('chatPanel').classList.toggle('collapsed');$('chatToggle').textContent=$('chatPanel').classList.contains('collapsed')?'+':'−'});
for(const el of document.querySelectorAll('.exhibit-link'))el.addEventListener('click',()=>{if(!joined){toast('전시관에 먼저 입장해 주세요.');return}const id=el.dataset.exhibit;const p=EXHIBITS[id].pos;send({type:'teleport',hall:id});toast(`${EXHIBITS[id].name}으로 이동합니다.`);});
const canMove=()=>joined&&$('exhibitOverlay').classList.contains('hidden')&&$('helpOverlay').classList.contains('hidden')&&document.activeElement!==$('chatInput')&&document.activeElement!==$('nickname');
window.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','KeyF','ShiftLeft','ShiftRight','KeyE','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&document.activeElement!==$('chatInput'))e.preventDefault();keys.add(e.code);if(e.code==='KeyE'&&canMove()&&nearest)openExhibit(nearest);if(e.code==='KeyF'&&canMove()&&myId)playWave(myId,true);if(e.code==='Escape'){closeExhibit();$('helpOverlay').classList.add('hidden')}});
window.addEventListener('keyup',e=>keys.delete(e.code));const keys=new Set();
$('touchInteract').addEventListener('click',()=>{if(nearest&&canMove())openExhibit(nearest)});
$('touchWave').addEventListener('click',()=>{if(canMove()&&myId)playWave(myId,true)});
let yaw=0.17,pitch=.28,drag=false,lastX=0,lastY=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(!joined)return;drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.004,.08,.56)});
renderer.domElement.addEventListener('pointerup',()=>drag=false);
let joystick={x:0,y:0},joystickPointer=null;
const joy=$('joystick');
function updateStick(e){const b=joy.getBoundingClientRect();const x=(e.clientX-(b.left+b.width/2))/(b.width*.36),y=(e.clientY-(b.top+b.height/2))/(b.height*.36);const len=Math.max(1,Math.hypot(x,y));joystick.x=x/len;joystick.y=y/len;$('stick').style.transform=`translate(${joystick.x*25}px,${joystick.y*25}px)`}
joy.addEventListener('pointerdown',e=>{joystickPointer=e.pointerId;joy.setPointerCapture(e.pointerId);updateStick(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===joystickPointer)updateStick(e)});
function resetStick(){joystickPointer=null;joystick={x:0,y:0};$('stick').style.transform='translate(0,0)'}
joy.addEventListener('pointerup',resetStick);joy.addEventListener('pointercancel',resetStick);
const clock=new THREE.Clock();let elapsed=0,lastPacket=0;
const targetCamera=new THREE.Vector3();
const viewRay=new THREE.Raycaster();
const camDirection=new THREE.Vector3();
let smoothCameraDistance=6.2;
function cameraSafeDistance(focus,desired,maxDistance){
 // Raycast from the avatar toward the camera; pull it in before it reaches a wall or skylight.
 camDirection.copy(desired).sub(focus).normalize();
 viewRay.set(focus,camDirection);
 viewRay.near=0.03;viewRay.far=maxDistance;
 const hits=viewRay.intersectObjects(cameraBlockers,false);
 return hits.length ? Math.max(.65,hits[0].distance-.4) : maxDistance;
}
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
 for(const o of ornaments){o.ring.rotation.y+=dt*(o.kind==='mechanics'?.13:.21);o.ring.position.y=3.15+.13*Math.sin(elapsed*1.2+(o.kind==='waves'?1:0));}
 let selfMoving=false;
 if(canMove()){
  const rawX=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joystick.x;
  const rawY=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joystick.y;
  if(Math.hypot(rawX,rawY)>.08){
   const r=Math.hypot(rawX,rawY),rx=rawX/r,ry=rawY/r;
   const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?8:4.5)*dt;
   const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
   const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
   const direction=right.multiplyScalar(rx).add(forward.multiplyScalar(ry));
   const next=moveWithCollisions(local.x,local.z,direction.x*speed,direction.z*speed);
   selfMoving=Math.hypot(next.x-local.x,next.z-local.z)>0.0005;
   local.x=next.x;local.z=next.z;
   local.rot=Math.atan2(-direction.x,-direction.z);
  }
 }
 if(myId&&avatars.has(myId)){
  const a=avatars.get(myId);a.g.position.set(local.x,0,local.z);a.g.rotation.y=local.rot;
  if(elapsed-lastPacket>.065){send({type:'move',x:local.x,z:local.z,rot:local.rot});lastPacket=elapsed}
 }
 for(const [id,a] of avatars){
  if(id!==myId){
   a.g.position.lerp(a.target,Math.min(1,dt*9));
   a.g.rotation.y+=Math.atan2(Math.sin(a.rotation-a.g.rotation.y),Math.cos(a.rotation-a.g.rotation.y))*Math.min(1,dt*9);
  }
  if(a.waveUntil && elapsed>=a.waveUntil){a.waveUntil=0}
  if(!a.waveUntil){
   const isWalking=id===myId ? selfMoving : (elapsed<a.motionUntil || a.g.position.distanceTo(a.target)>.018);
   setAvatarClip(a,isWalking?'Walk':'Idle');
  }
  a.mixer.update(dt);
 }
 const focus=new THREE.Vector3(local.x,1.5,local.z);
 // Keep the third-person viewpoint below the skylight where possible.
 const distance=isTouch?5.7:6.2;
 targetCamera.set(focus.x+Math.sin(yaw)*Math.cos(pitch)*distance,focus.y+Math.sin(pitch)*distance+0.35,focus.z+Math.cos(yaw)*Math.cos(pitch)*distance);
 const safeDistance=cameraSafeDistance(focus,targetCamera,targetCamera.distanceTo(focus));
 // Zoom in quickly near an obstruction and ease out when the view clears.
 const rate=safeDistance<smoothCameraDistance?22:5;
 smoothCameraDistance=THREE.MathUtils.lerp(smoothCameraDistance,safeDistance,Math.min(1,rate*dt));
 // Clamp immediately as well to ensure the camera never travels through the blocking surface.
 smoothCameraDistance=Math.min(smoothCameraDistance,safeDistance);
 camera.position.copy(focus).addScaledVector(camDirection,smoothCameraDistance);
 camera.lookAt(focus);
 nearest=null;let minDistance=6.5;
 for(const [id,e] of Object.entries(EXHIBITS)){const d=Math.hypot(local.x-e.pos.x,local.z-e.pos.z);if(d<minDistance){minDistance=d;nearest=id}}
 $('interact').classList.toggle('visible',Boolean(nearest&&joined&&canMove()));
 if(nearest)$('interactText').textContent=`${EXHIBITS[nearest].name} 관람하기`;
 for(const el of document.querySelectorAll('.exhibit-link'))el.classList.toggle('active',nearest===el.dataset.exhibit);
 renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2))});
