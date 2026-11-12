import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {isFree,moveWithCollisions} from './public/world-collision.js';
const expected={
 "jetty_base.glb":{"nodes": ["Head", "Body", "Arm_L", "Arm_R", "Leg_L", "Leg_R", "Base_Shorts"], "animations": ["Idle", "Walk", "Wave"]},
 "pack_hair.glb":{"nodes": ["Hair_M01", "Hair_M02", "Hair_M03", "Hair_M04"], "animations": []},
 "female_hair/hair_g_bobperm.glb":{"nodes": ["Hair_G_BOBPERM"], "animations": []},
 "female_hair/hair_g_braid.glb":{"nodes": ["Hair_G_BRAID"], "animations": []},
 "female_hair/hair_g_buns.glb":{"nodes": ["Hair_G_BUNS"], "animations": []},
 "female_hair/hair_g_halfup.glb":{"nodes": ["Hair_G_HALFUP"], "animations": []},
 "female_hair/hair_g_longperm.glb":{"nodes": ["Hair_G_LONGPERM"], "animations": []},
 "female_hair/hair_g_pony.glb":{"nodes": ["Hair_G_PONY"], "animations": []},
 "female_hair/hair_g_twin.glb":{"nodes": ["Hair_G_TWIN"], "animations": []},
 "female_hair/hair_g_updo.glb":{"nodes": ["Hair_G_UPDO"], "animations": []},
 "pack_face.glb":{"nodes": ["Face_Default", "Face_Smile", "Face_Focus", "Face_Curious", "Face_Surprise", "Face_Wink", "Face_Sleepy"], "animations": []},
 "pack_gear.glb":{"nodes": ["Gear_Goggles", "Gear_Glasses", "Gear_NameTag", "Gear_Badge", "Gear_Gloves_L", "Gear_Gloves_R", "Gear_Beaker", "Gear_Magnifier", "Gear_Backpack"], "animations": []},
 "pack_outfits.glb":{"nodes": ["Outfit_LabCoat", "Outfit_LabCoat_Sleeve_L", "Outfit_LabCoat_Sleeve_R", "Outfit_Gown", "Outfit_Gown_Sleeve_L", "Outfit_Gown_Sleeve_R", "Outfit_JacketB", "Outfit_JacketB_Sleeve_L", "Outfit_JacketB_Sleeve_R", "Outfit_UniformA", "Outfit_Explorer", "Outfit_Casual", "Outfit_Casual_Sleeve_L", "Outfit_Casual_Sleeve_R", "Outfit_Apron"], "animations": []},
 "pack_bottoms.glb":{"nodes": ["Bottom_Pants", "Bottom_Pants_Leg_L", "Bottom_Pants_Leg_R"], "animations": []},
};
let bytes=0;
for(const [filename, spec] of Object.entries(expected)){
 const data=readFileSync(new URL(`./public/models/avatar/${filename}`,import.meta.url));bytes+=data.length;
 assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);
 assert.equal(data.readUInt32LE(8),data.length,`truncated: ${filename}`);
 const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString('utf8'));
 for(const node of spec.nodes) assert.ok(json.nodes.some(x=>x.name===node),`${filename}: ${node}`);
 for(const clip of spec.animations) assert.ok(json.animations.some(x=>x.name===clip),`${filename}: ${clip}`);
 console.log(`${filename}: ${json.meshes.length} meshes, ${spec.nodes.length} required nodes, ${(data.length/1024).toFixed(0)}KB`);
}
assert.ok(isFree(0,7.2));assert.equal(isFree(-7,-12),false);
assert.ok(moveWithCollisions(-6,-12,-3,0).x>-6.7);
const server=readFileSync(new URL('./server.js',import.meta.url),'utf8');
const client=readFileSync(new URL('./public/avatar-parts.js',import.meta.url),'utf8');
const main=readFileSync(new URL('./public/main.js',import.meta.url),'utf8');
for(const key of ['hair','face','outfit','bottom','gear','badge','gloves','hand','backpack']){
 assert.ok(server.includes(`"${key}":[`),`server look ${key}`);
 assert.ok(client.includes(`"${key}":[`),`client look ${key}`);
 assert.ok(main.includes(`['${key}','`),`customizer UI ${key}`);
}
for(const name of ['Leg_L','Leg_R','Base_Shorts'])assert.ok(client.includes(name));
assert.ok(server.includes("msg.type === 'appearance'"));
const ui=readFileSync(new URL('./public/index.html',import.meta.url),'utf8');
for(const id of ['customizer','avatarPreview','customizeApply','customizeOpen','customizeCancel','customizeOptions'])
 assert.ok(ui.includes(`id="${id}"`),`missing UI ${id}`);
console.log(`PASS v0.9.1: 6 GLBs / ${(bytes/1024/1024).toFixed(2)} MB; animated base; 9 customizable categories; server allow-list; UI & collision checks`);

for (const key of ['hairColor','outfitColor','bottomColor','gearColor']) {
  assert.ok(server.includes(`"${key}":[`),`server palette ${key}`);
  assert.ok(client.includes(`"${key}":[`),`client palette ${key}`);
  assert.ok(main.includes(`${key}:`),`UI palette ${key}`);
}
assert.ok(main.includes("const SPRING_EXHIBIT_ID='spring-mass'"));
assert.ok(client.includes('FEMALE_HAIR_PART_MAP'));
for(const id of ['BOBPERM','BRAID','BUNS','HALFUP','LONGPERM','PONY','TWIN','UPDO']) assert.ok(client.includes(`Hair_G_${id}`));
assert.ok(client.includes("hair:'/models/avatar/pack_hair.glb'"));
console.log('PASS v0.9.5: palettes + updo + mechanics station source checks');

// v0.9.8: clean start, dropped customization options and browser-persistence regression checks.
assert.equal(JSON.parse(client.match(/export const DEFAULT_LOOK = Object\.freeze\((\{[^\n]+\})\)/)[1]).hair,'none');
assert.equal(JSON.parse(server.match(/const DEFAULT_LOOK=Object\.freeze\((\{[^\n]+\})\)/)[1]).hair,'none');
for(const token of ['Bottom_Skirt','Gear_Clipboard','skinColor']){
 assert.ok(!client.includes(token),`removed client option ${token}`);
 assert.ok(!server.includes(token),`removed server option ${token}`);
}
assert.ok(main.includes('let selectedLook = {...DEFAULT_LOOK};'));
assert.ok(!main.includes('localStorage'));
assert.ok(!main.includes('saveStoredLook'));
console.log('PASS v0.9.8: options removed + all-new visitors start with no hair/outfit/gear + no persisted look');

// v0.9.8.1: catch invalid accessory assembly calls that bypass model loading checks.
assert.ok(!client.includes("add('bottom','bottom','Body')"), 'invalid removed skirt replacement call');
const declaredPacks=new Set(['base','hair','face','gear','outfit','bottom',
 'femaleHair_BOBPERM','femaleHair_BRAID','femaleHair_BUNS','femaleHair_HALFUP',
 'femaleHair_LONGPERM','femaleHair_PONY','femaleHair_TWIN','femaleHair_UPDO']);
for(const match of client.matchAll(/\badd\(['"]([^'"]+)['"],['"]([^'"]+)['"],['"]([^'"]+)['"]/g))
 assert.ok(declaredPacks.has(match[3]),`unknown asset pack for part ${match[2]}: ${match[3]}`);
console.log('PASS v0.9.8.1: static avatar assembly pack references valid');
