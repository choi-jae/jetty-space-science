import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// The user-provided mesh identifiers are the contract; add new options here AND
// the mirrored server allow-list when introducing further avatar packs.
export const DEFAULT_LOOK = Object.freeze({"hair":"none","face":"Face_Default","outfit":"none","bottom":"none","gear":"none","badge":"none","gloves":"none","hand":"none","backpack":"none","hairColor":"#79503E","outfitColor":"#E8EEF6","bottomColor":"#2F496F","gearColor":"#D3B66F"});
export const LOOK_OPTIONS = Object.freeze({"hair":["none","Hair_M01","Hair_M02","Hair_M03","Hair_M04","Hair_G_BOBPERM","Hair_G_BRAID","Hair_G_BUNS","Hair_G_HALFUP","Hair_G_LONGPERM","Hair_G_PONY","Hair_G_TWIN","Hair_G_UPDO"],"face":["Face_Default","Face_Smile","Face_Focus","Face_Curious","Face_Surprise","Face_Wink","Face_Sleepy"],"outfit":["none","Outfit_LabCoat","Outfit_Gown","Outfit_JacketB","Outfit_UniformA","Outfit_Explorer","Outfit_Casual","Outfit_Apron"],"bottom":["none","Bottom_Pants"],"gear":["none","Gear_Goggles","Gear_Glasses"],"badge":["none","Gear_NameTag","Gear_Badge"],"gloves":["none","Gear_Gloves"],"hand":["none","Gear_Beaker","Gear_Magnifier"],"backpack":["none","Gear_Backpack"],"hairColor":["#79503E","#30292B","#C89B54","#A45E55","#D98DB1","#8694C5","#E3D2A9"],"outfitColor":["#E8EEF6","#8EBED7","#F2BECC","#9BD3B0","#D2B5EE","#F2C47D","#4D6384"],"bottomColor":["#2F496F","#638EAC","#9A7DC3","#C48B95","#4D5963","#F5D8C9"],"gearColor":["#D3B66F","#6685A8","#82BDAE","#B28BD0","#D38C9D","#69777E"]});
export const LOOK_LABELS = Object.freeze({"none":"착용 안 함","Hair_M01":"남성형 헤어 1","Hair_M02":"남성형 헤어 2","Hair_M03":"남성형 헤어 3","Hair_M04":"남성형 헤어 4","Hair_G_BOBPERM":"여성형 보브펌","Hair_G_BRAID":"여성형 땋은머리","Hair_G_BUNS":"여성형 번 헤어","Hair_G_HALFUP":"여성형 반묶음","Hair_G_LONGPERM":"여성형 롱펌","Hair_G_PONY":"여성형 포니테일","Hair_G_TWIN":"여성형 트윈테일","Hair_G_UPDO":"여성형 올림머리","Face_Default":"기본 표정","Face_Smile":"웃는 표정","Face_Focus":"집중","Face_Curious":"호기심","Face_Surprise":"놀람","Face_Wink":"윙크","Face_Sleepy":"졸림","Outfit_LabCoat":"실험복","Outfit_Gown":"가운","Outfit_JacketB":"재킷","Outfit_UniformA":"교복 스타일","Outfit_Explorer":"탐험복","Outfit_Casual":"캐주얼","Outfit_Apron":"앞치마","Bottom_Pants":"긴바지","Gear_Goggles":"안전 고글","Gear_Glasses":"안경","Gear_NameTag":"이름표","Gear_Badge":"배지","Gear_Gloves":"장갑","Gear_Beaker":"비커","Gear_Magnifier":"돋보기","Gear_Backpack":"배낭"});
const OUTFIT_PARTS = {"Outfit_LabCoat":["Outfit_LabCoat","Outfit_LabCoat_Sleeve_L","Outfit_LabCoat_Sleeve_R"],"Outfit_Gown":["Outfit_Gown","Outfit_Gown_Sleeve_L","Outfit_Gown_Sleeve_R"],"Outfit_JacketB":["Outfit_JacketB","Outfit_JacketB_Sleeve_L","Outfit_JacketB_Sleeve_R"],"Outfit_UniformA":["Outfit_UniformA"],"Outfit_Explorer":["Outfit_Explorer"],"Outfit_Casual":["Outfit_Casual","Outfit_Casual_Sleeve_L","Outfit_Casual_Sleeve_R"],"Outfit_Apron":["Outfit_Apron"]};
export function cleanLook(data={}){
 const value=data && typeof data==='object' && !Array.isArray(data) ? data : {};
 return Object.fromEntries(Object.entries(LOOK_OPTIONS).map(([key,values])=>
  [key, values.includes(value[key])?value[key]:DEFAULT_LOOK[key]]));
}
export function sameLook(a,b){return Object.keys(LOOK_OPTIONS).every(k=>a?.[k]===b?.[k]);}
const MODELS = {
 base:'/models/avatar/jetty_base.glb', hair:'/models/avatar/pack_hair.glb',
 femaleHair_BOBPERM:'/models/avatar/female_hair/hair_g_bobperm.glb',
 femaleHair_BRAID:'/models/avatar/female_hair/hair_g_braid.glb',
 femaleHair_BUNS:'/models/avatar/female_hair/hair_g_buns.glb',
 femaleHair_HALFUP:'/models/avatar/female_hair/hair_g_halfup.glb',
 femaleHair_LONGPERM:'/models/avatar/female_hair/hair_g_longperm.glb',
 femaleHair_PONY:'/models/avatar/female_hair/hair_g_pony.glb',
 femaleHair_TWIN:'/models/avatar/female_hair/hair_g_twin.glb',
 femaleHair_UPDO:'/models/avatar/female_hair/hair_g_updo.glb',
 face:'/models/avatar/pack_face.glb', gear:'/models/avatar/pack_gear.glb',
 outfit:'/models/avatar/pack_outfits.glb',bottom:'/models/avatar/pack_bottoms.glb',
};
let sharedAssets=null;
export function loadAvatarAssets(onProgress=()=>{}){
 if(sharedAssets)return sharedAssets;
 const loader=new GLTFLoader();let ready=0;
 sharedAssets=Promise.all(Object.entries(MODELS).map(([key,url])=>
  new Promise((resolve,reject)=>loader.load(url,gltf=>{
   onProgress(++ready,Object.keys(MODELS).length,key);resolve([key,gltf]);
  },undefined,e=>reject(new Error(`${url}: ${e?.message??e}`))))
 )).then(entries=>{
  const assets=Object.fromEntries(entries);
  const femaleHairMap={
   Hair_G_BOBPERM:['femaleHair_BOBPERM','Hair_G_BOBPERM'],
   Hair_G_BRAID:['femaleHair_BRAID','Hair_G_BRAID'],
   Hair_G_BUNS:['femaleHair_BUNS','Hair_G_BUNS'],
   Hair_G_HALFUP:['femaleHair_HALFUP','Hair_G_HALFUP'],
   Hair_G_LONGPERM:['femaleHair_LONGPERM','Hair_G_LONGPERM'],
   Hair_G_PONY:['femaleHair_PONY','Hair_G_PONY'],
   Hair_G_TWIN:['femaleHair_TWIN','Hair_G_TWIN'],
   Hair_G_UPDO:['femaleHair_UPDO','Hair_G_UPDO'],
  };
  const lists={
   hair:['Hair_M01','Hair_M02','Hair_M03','Hair_M04'],
   face:LOOK_OPTIONS.face,
   gear:['Gear_Goggles','Gear_Glasses','Gear_NameTag','Gear_Badge','Gear_Gloves_L','Gear_Gloves_R','Gear_Beaker','Gear_Magnifier','Gear_Backpack'],
   outfit:Object.values(OUTFIT_PARTS).flat(),
   bottom:['Bottom_Pants','Bottom_Pants_Leg_L','Bottom_Pants_Leg_R'],
  };
  for(const [part,names] of Object.entries(lists))for(const name of names)
   if(!assets[part].scene.getObjectByName(name))throw new Error(`파츠 누락: ${part}/${name}`);
  for(const [hairId,[part,nodeName]] of Object.entries(femaleHairMap))
   if(!assets[part].scene.getObjectByName(nodeName))throw new Error(`파츠 누락: ${part}/${nodeName}`);
  for(const name of ['Head','Body','Arm_L','Arm_R','Leg_L','Leg_R','Base_Shorts'])
   if(!assets.base.scene.getObjectByName(name))throw new Error(`기본 모델 노드 누락: ${name}`);
  for(const name of ['Idle','Walk','Wave'])
   if(!assets.base.animations.some(a=>a.name===name))throw new Error(`기본 애니메이션 누락: ${name}`);
  return assets;
 }).catch(e=>{sharedAssets=null;throw e;});
 return sharedAssets;
}
const FEMALE_HAIR_PART_MAP={
 'Hair_G_BOBPERM':['femaleHair_BOBPERM','Hair_G_BOBPERM'],
 'Hair_G_BRAID':['femaleHair_BRAID','Hair_G_BRAID'],
 'Hair_G_BUNS':['femaleHair_BUNS','Hair_G_BUNS'],
 'Hair_G_HALFUP':['femaleHair_HALFUP','Hair_G_HALFUP'],
 'Hair_G_LONGPERM':['femaleHair_LONGPERM','Hair_G_LONGPERM'],
 'Hair_G_PONY':['femaleHair_PONY','Hair_G_PONY'],
 'Hair_G_TWIN':['femaleHair_TWIN','Hair_G_TWIN'],
 'Hair_G_UPDO':['femaleHair_UPDO','Hair_G_UPDO'],
};

function clonePart(asset,name,parent){
 const template=asset.scene.getObjectByName(name);
 if(!template)throw new Error(`3D 파츠 누락: ${name}`);
 const item=template.clone(true);
 // The new packs were exported with transforms relative to the animated part
 // coordinate convention.  Attach to its animated parent (not the world root).
 parent.add(item);
 item.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=false;}});
 return item;
}
export function buildAvatarModel(assets,initialLook=DEFAULT_LOOK){
 const model=assets.base.scene.clone(true);
 const joints=Object.fromEntries(['Head','Body','Arm_L','Arm_R','Leg_L','Leg_R','Base_Sleeve_L','Base_Sleeve_R','Base_Shorts']
  .map(n=>[n,model.getObjectByName(n)]));
 const all={};const groups={};
 // Per-avatar material isolation is essential for multi-user color independence.
 model.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(v=>v.clone()):o.material.clone();}});
 const add=(category,id,pack,nodeName=id,parent='Head')=>{
  const mapped = category==='hair' ? FEMALE_HAIR_PART_MAP[id] : null;
  const sourcePack = mapped ? mapped[0] : pack;
  const sourceNode = mapped ? mapped[1] : nodeName;
  const obj=clonePart(assets[sourcePack],sourceNode,joints[parent]);
  obj.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(v=>v.clone()):o.material.clone();}});
  all[id]=obj;(groups[category]??={})[id]=obj;
 };
 for(const id of LOOK_OPTIONS.hair.filter(x=>x!=='none'))add('hair',id,'hair',id,'Head');
 for(const id of LOOK_OPTIONS.face)add('face',id,'face',id,'Head');
 for(const id of ['Gear_Goggles','Gear_Glasses'])add('gear',id,'gear',id,'Head');
 for(const id of ['Gear_NameTag','Gear_Badge'])add('badge',id,'gear',id,'Body');
 for(const id of ['Gear_Gloves_L','Gear_Gloves_R'])add('gloves',id,'gear',id,id.endsWith('_L')?'Arm_L':'Arm_R');
 for(const id of ['Gear_Beaker','Gear_Magnifier'])add('hand',id,'gear',id,'Arm_R');
 add('backpack','Gear_Backpack','gear','Gear_Backpack','Body');
 for(const [outfit,names] of Object.entries(OUTFIT_PARTS))for(const name of names)
  add('outfit',name,'outfit',name,name.endsWith('_Sleeve_L')?'Arm_L':name.endsWith('_Sleeve_R')?'Arm_R':'Body');
 add('bottom','Bottom_Pants','bottom','Bottom_Pants','Body');
 add('bottom','Bottom_Pants_Leg_L','bottom','Bottom_Pants_Leg_L','Leg_L');
 add('bottom','Bottom_Pants_Leg_R','bottom','Bottom_Pants_Leg_R','Leg_R');
 model.traverse(o=>{if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];o.castShadow=!mats.some(m=>m?.transparent);o.receiveShadow=false;}});
 let current=null;
 const baseMaterials=new Map();
 model.traverse(o=>{if(o.isMesh)for(const mat of (Array.isArray(o.material)?o.material:[o.material])){
  if(!baseMaterials.has(mat))baseMaterials.set(mat,mat.color?.clone());
 }});
 // Capture each part's isolated materials for non-destructive palette changes.
 const partMatOriginal=new Map();
 for(const part of Object.values(all))part.traverse(o=>{if(o.isMesh)for(const mat of (Array.isArray(o.material)?o.material:[o.material])){
  if(!partMatOriginal.has(mat))partMatOriginal.set(mat,mat.color?.clone());
 }});
 const baseMeshNames=new Set(['Head','Arm_L','Arm_R']);
 function recolor(look){
  const applyTo=(obj,color)=>{if(!obj)return;const tint=new THREE.Color(color);obj.traverse(n=>{
   if(!n.isMesh)return;
   for(const mat of (Array.isArray(n.material)?n.material:[n.material])){
    if(!mat?.color)return;
    mat.color.copy(tint);
   }
  });};
  // Restore materials before applying each current palette (no cumulative darkening).
  for(const [mat,color] of [...baseMaterials,...partMatOriginal])if(color)mat.color.copy(color);
  for(const name of LOOK_OPTIONS.hair.filter(x=>x!=='none'))applyTo(all[name],look.hairColor);
  if(look.outfit!=='none')for(const id of OUTFIT_PARTS[look.outfit]??[])applyTo(all[id],look.outfitColor);
  if(look.bottom==='Bottom_Pants')for(const id of ['Bottom_Pants','Bottom_Pants_Leg_L','Bottom_Pants_Leg_R'])applyTo(all[id],look.bottomColor);
  for(const id of ['Gear_Goggles','Gear_Glasses','Gear_NameTag','Gear_Badge','Gear_Gloves_L','Gear_Gloves_R','Gear_Beaker','Gear_Magnifier','Gear_Backpack']){
   // Apply only to the currently visible accessory; selected category already checked below.
   const category=id.startsWith('Gear_Gloves')?'gloves':id==='Gear_Backpack'?'backpack':
    ['Gear_NameTag','Gear_Badge'].includes(id)?'badge':
    ['Gear_Goggles','Gear_Glasses'].includes(id)?'gear':'hand';
   if(look[category]===id||(category==='gloves'&&look.gloves==='Gear_Gloves'))applyTo(all[id],look.gearColor);
  }
  if(look.outfit==='none'){for(const name of ['Body','Base_Sleeve_L','Base_Sleeve_R']){
   const node=joints[name];if(node)node.traverse(n=>{if(n.isMesh)for(const mat of (Array.isArray(n.material)?n.material:[n.material])){
    if(mat?.name==='Tshirt'||mat?.name==='Tshirt_Rib')mat.color.set(look.outfitColor);
   }});
  }}
  if(look.bottom==='none')applyTo(joints.Base_Shorts,look.bottomColor);
 }
 function setLook(value){
  const look=cleanLook(value);
  // Single-choice accessories, with grouped meshes switched together.
  for(const id of LOOK_OPTIONS.hair.filter(x=>x!=='none'))all[id].visible=(look.hair===id);
  for(const id of LOOK_OPTIONS.face)all[id].visible=(look.face===id);
  for(const id of ['Gear_Goggles','Gear_Glasses'])all[id].visible=(look.gear===id);
  for(const id of ['Gear_NameTag','Gear_Badge'])all[id].visible=(look.badge===id);
  for(const id of ['Gear_Gloves_L','Gear_Gloves_R'])all[id].visible=(look.gloves==='Gear_Gloves');
  for(const id of ['Gear_Beaker','Gear_Magnifier'])all[id].visible=(look.hand===id);
  all.Gear_Backpack.visible=look.backpack==='Gear_Backpack';
  for(const [outfit,names] of Object.entries(OUTFIT_PARTS))for(const id of names)all[id].visible=(look.outfit===outfit);
  for(const id of ['Bottom_Pants','Bottom_Pants_Leg_L','Bottom_Pants_Leg_R'])all[id].visible=look.bottom==='Bottom_Pants';
  // Hide the stock sleeves only when the selected top provides sleeves;
  // keep original sleeves for sleeveless outerwear (uniform/apron etc.).
  const hasSleeves=(OUTFIT_PARTS[look.outfit]||[]).some(n=>n.endsWith('_Sleeve_L'));
  for(const n of ['Base_Sleeve_L','Base_Sleeve_R'])if(joints[n])joints[n].visible=!hasSleeves;
  // Hide original shorts when bottom replacement is selected; base legs remain
  // animated underneath the trousers.
  joints.Base_Shorts.visible=look.bottom==='none';
  recolor(look);
  current=look;
 }
 setLook(initialLook);
 return {model,setLook,getLook:()=>({...current})};
}
