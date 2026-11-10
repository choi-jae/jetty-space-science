// JETTY SPACE shared navigation geometry. Keep in sync with the rendered museum.
// Coordinates are X,Z in metres; obstacles use center X/Z and width/depth.
export const PLAYER_RADIUS = 0.38;
export const NAV_BOUNDS = { minX:-23.8, maxX:23.8, minZ:-17.8, maxZ:17.8 };
const colliders = [];
function block(x,z,w,d){colliders.push({x,z,w,d});}
// Building perimeter and structural columns.
for(const x of [-24,24])block(x,0,.35,37);
for(const z of [-18,18])block(0,z,48,.35);
for(const x of [-23,-8,8,23])for(const z of [-17,0,17])block(x,z,.36,.36);
// Room partitions, with intentional gaps for doorways.
for(const x of [-7,7]){
  block(x,-12.9,.26,10);
  block(x,3.0,.26,5);
  block(x,14.5,.26,5);
}
for(const x of [-4.6,4.6])block(x,-4.65,4.8,.25);
// Exhibit stations. Their slightly larger top plates are the collision footprint.
for(const [hx,hz] of [[-15,-5],[15,-5],[0,-11]]){
 for(const [dx,dz] of [[-3.6,-2.1],[3.6,-2.1],[-3.6,3.1],[3.6,3.1]]){
  block(hx+dx,hz+dz,3.45,2.75);
 }
}
// Lobby pedestal and decorative hall pillars.
block(0,9.4,1.25,1.25);
for(const [hx,hz] of [[-15,-5],[15,-5],[0,-11]]){
 for(const dx of [-5.9,5.9])block(hx+dx,hz-4.9,.23,.23);
}
export const COLLIDERS = Object.freeze(colliders);
export function isFree(x,z,r=PLAYER_RADIUS){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 if(x-r<NAV_BOUNDS.minX||x+r>NAV_BOUNDS.maxX||z-r<NAV_BOUNDS.minZ||z+r>NAV_BOUNDS.maxZ)return false;
 for(const b of COLLIDERS){
  const px=Math.max(b.x-b.w/2,Math.min(x,b.x+b.w/2));
  const pz=Math.max(b.z-b.d/2,Math.min(z,b.z+b.d/2));
  if((x-px)**2+(z-pz)**2 < r*r)return false;
 }
 return true;
}
// Small sub-steps prevent crossing thin walls at high frame rates or during sprints.
// Separating axes lets players slide along walls instead of becoming stuck.
export function moveWithCollisions(x,z,dx,dz){
 const distance=Math.hypot(dx,dz);
 if(!Number.isFinite(distance)||distance>50)return {x,z};
 const steps=Math.max(1,Math.ceil(distance/0.12));
 for(let i=0;i<steps;i++){
  const nx=x+dx/steps;
  if(isFree(nx,z))x=nx;
  const nz=z+dz/steps;
  if(isFree(x,nz))z=nz;
 }
 return {x,z};
}
export const TELEPORT_POINTS={
 mechanics:{x:-15,z:0},
 electromagnetism:{x:15,z:0},
 waves:{x:0,z:-6.1}
};
