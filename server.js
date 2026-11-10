import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import {isFree, moveWithCollisions, TELEPORT_POINTS} from './public/world-collision.js';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = resolve('public');
const MAX_VISITORS = 30;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.glb':'model/gltf-binary', '.ico':'image/x-icon' };

const server = createServer(async (req, res) => {
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
    res.end(JSON.stringify({ ok:true, online:players.size, capacity:MAX_VISITORS }));
    return;
  }
  const route = path === '/' ? '/index.html' : path;
  // Three.js module imports three.core.js from the same vendor directory.
  // Explicitly allow only these two files from node_modules.
  const vendorFiles = {
    '/vendor/three.module.js': 'three.module.js',
    '/vendor/three.core.js': 'three.core.js',
  };
  const approvedVendor = Object.hasOwn(vendorFiles, route);
  const jsmRoot = resolve('node_modules','three','examples','jsm');
  const jsmRoute = route.startsWith('/vendor/jsm/') && route.endsWith('.js');
  const jsmFile = jsmRoute ? resolve(jsmRoot, '.' + route.slice('/vendor/jsm'.length)) : null;
  const file = approvedVendor
    ? resolve('node_modules', 'three', 'build', vendorFiles[route])
    : jsmRoute ? jsmFile : resolve(ROOT, '.' + route);
  if (jsmRoute && (file === jsmRoot || !file.startsWith(jsmRoot + sep))) {res.writeHead(403);res.end('Forbidden');return}
  if (!approvedVendor && !jsmRoute && file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); res.end('Not found');
  }
});

const wss = new WebSocketServer({ server, path:'/ws', maxPayload:2048 });
const players = new Map();
const sockets = new Map();
const COLORS = [0x59e4da,0xfbbf78,0xc4a7ff,0xff91bd,0x8db8ff,0xb0ec83,0xffd66e];
const EXHIBIT_IDS = new Set(['mechanics','electromagnetism','waves']);
const send = (ws, msg) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg)); };
const broadcast = (msg, except = null) => {
  const packet = JSON.stringify(msg);
  for (const ws of sockets.values()) if (ws !== except && ws.readyState === WebSocket.OPEN) ws.send(packet);
};
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, max);

wss.on('connection', ws => {
  if (players.size >= MAX_VISITORS) { send(ws, { type:'error', message:'전시관 정원이 가득 찼습니다.' }); ws.close(1013); return; }
  const id = randomUUID();
  const player = { id, name:`탐험가${Math.floor(Math.random()*900+100)}`, x:0, z:7.2, rot:Math.PI, color:COLORS[players.size % COLORS.length] };
  players.set(id,player); sockets.set(id,ws);
  let lastMove = 0, lastChat = 0, lastInteraction = 0, lastWave = 0;
  send(ws,{ type:'welcome', id, players:[...players.values()], capacity:MAX_VISITORS });
  broadcast({type:'joined',player}, ws);
  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'name') {
      player.name = clean(msg.name, 14) || player.name;
      broadcast({type:'updated',player});
    } else if (msg.type === 'move') {
      const now = Date.now(); if (now - lastMove < 45) return;
      lastMove = now;
      if (![msg.x,msg.z,msg.rot].every(Number.isFinite)) return;
      const nx = clamp(msg.x,-23,23), nz = clamp(msg.z,-17,17);
      // Simple speed bound: avoids instantaneous teleportation.
      const dt = Math.min(0.25, Math.max(0.045, (now - (player.movedAt || now-60))/1000));
      const maxStep = 12 * dt + 0.1;
      const dx = nx-player.x, dz = nz-player.z, d = Math.hypot(dx,dz);
      const f = d > maxStep ? maxStep/d : 1;
      const next=moveWithCollisions(player.x,player.z,dx*f,dz*f);
      player.x=next.x; player.z=next.z;
      player.rot = clamp(msg.rot, -10000, 10000);
      player.movedAt = now;
      broadcast({type:'moved',id,x:player.x,z:player.z,rot:player.rot});
    } else if (msg.type === 'teleport') {
      const p=typeof msg.hall==='string' ? TELEPORT_POINTS[msg.hall] : null;
      if(!p || !isFree(p.x,p.z)) return;
      player.x=p.x;player.z=p.z;player.movedAt=Date.now();
      send(ws,{type:'teleported',x:player.x,z:player.z});
      broadcast({type:'moved',id,x:player.x,z:player.z,rot:player.rot},ws);
    } else if (msg.type === 'wave') {
      const now = Date.now(); if(now-lastWave<1300) return;
      lastWave=now;
      broadcast({type:'wave',id},ws);
    } else if (msg.type === 'chat') {
      const now=Date.now(); if(now-lastChat<800) return;
      const message=clean(msg.message,120); if(!message) return;
      lastChat=now;
      broadcast({type:'chat',id,name:player.name,message});
    } else if (msg.type === 'visit') {
      const now=Date.now(); if(now-lastInteraction<700) return;
      if (!EXHIBIT_IDS.has(msg.exhibit)) return;
      lastInteraction=now;
      broadcast({type:'visited',id,name:player.name,exhibit:msg.exhibit},ws);
    }
  });
  ws.on('close', () => {players.delete(id); sockets.delete(id); broadcast({type:'left',id});});
  ws.on('error', () => {});
});

// Dead TCP/WebSocket sessions are removed so the online count stays accurate.
const heartbeat=setInterval(()=>{
  for(const ws of wss.clients){
    if(ws.isAlive===false){ws.terminate();continue;}
    ws.isAlive=false;ws.ping();
  }
},30000);
wss.on('connection',ws=>{ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true);});
wss.on('close',()=>clearInterval(heartbeat));
server.listen(PORT,HOST,()=>console.log(`🔭 과학 메타버스 실행: http://localhost:${PORT} (같은 네트워크 접속: http://서버IP:${PORT})`));
