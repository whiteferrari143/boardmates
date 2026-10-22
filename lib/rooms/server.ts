import { database } from '@/db/raw';
import { AppError, type Player } from '@/lib/session/server';
import { gameRegistry,gameCatalog } from '@/lib/games/registry';
import { context,gameAction } from '@/lib/games/engine';
import type { RoomState,RoomView } from './types';
import {tickSpyfall,type SpyState} from '@/lib/games/spyfall';
import {tickDeception,type DeceptionState} from '@/lib/games/deception';
import {tickMarket,type MarketState} from '@/lib/games/market';
import {privateUnlocked} from '@/lib/games/access';
function advance(room:RoomState){if(room.phase!=='playing')return;if(room.gameId==='spyfall')tickSpyfall(room.state as SpyState,context(room));if(room.gameId==='deception')tickDeception(room.state as DeceptionState,context(room));if(room.gameId==='crystal-market')tickMarket(room.state as MarketState,context(room));if(gameRegistry[room.gameId].isFinished(room.state))room.phase='finished';}
export const ONLINE_MS=15000, RESERVATION_MS=120000;
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function normalizeCode(value:unknown) { if(typeof value!=='string') throw new AppError('กรุณากรอกรหัสห้อง');const code=value.trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) throw new AppError('รหัสห้องต้องเป็นตัวอักษรหรือตัวเลข 6 ตัว');return code; }
export async function currentRoom(playerId:string) {
 const row=await database().prepare('SELECT room_code FROM seats WHERE player_id = ? AND lease_until > ?').bind(playerId,Date.now()).first<{room_code:string}>();return row?.room_code??null;
}
async function claimSeat(playerId:string,code:string) {
 const now=Date.now();const res=await database().prepare('INSERT INTO seats (player_id,room_code,lease_until) VALUES (?,?,?) ON CONFLICT(player_id) DO UPDATE SET room_code = excluded.room_code, lease_until = excluded.lease_until WHERE seats.lease_until <= ? OR seats.room_code = excluded.room_code').bind(playerId,code,now+RESERVATION_MS,now).run();
 if(!res.meta.changes)throw new AppError('กรุณาออกจากห้องเดิมก่อนเข้าห้องใหม่',409);
}
async function releaseSeat(playerId:string,code:string) {await database().prepare('DELETE FROM seats WHERE player_id = ? AND room_code = ?').bind(playerId,code).run();}
async function releaseFailedClaim(playerId:string,code:string) {
 const row=await database().prepare("SELECT code FROM rooms WHERE code = ? AND EXISTS (SELECT 1 FROM json_each(rooms.data, '$.members') WHERE json_extract(value, '$.id') = ?)").bind(code,playerId).first();
 if(!row)await releaseSeat(playerId,code);
}
function clean(room:RoomState,now:number) {
 room.members=room.members.filter(m=>now-m.lastSeen<RESERVATION_MS);
 room.members.forEach(m=>{if(now-m.lastSeen>ONLINE_MS) m.ready=false;});
 if(!room.members.some(m=>m.id===room.hostId)) room.hostId=room.members[0]?.id??'';
}
export function view(room:RoomState,playerId:string,revision:number):RoomView {
 const game=gameRegistry[room.gameId], now=Date.now();
 return {code:room.code,hostId:room.hostId,phase:room.phase,game:gameCatalog.find(g=>g.id===game.id)!,members:room.members.map(m=>({...m,connected:now-m.lastSeen<=ONLINE_MS})),gameView:room.phase==='waiting'?null:game.getPlayerView(room.state,playerId,context(room)),canStart:room.phase==='waiting'&&room.members.length>=game.minPlayers&&room.members.every(m=>m.ready&&now-m.lastSeen<=ONLINE_MS),revision};
}
export async function mutate(code:string,player:Player,fn:(room:RoomState)=>void):Promise<RoomView|null> {
 const db=database();
 for(let attempt=0;attempt<8;attempt++) {
  const row=await db.prepare('SELECT data, version FROM rooms WHERE code = ?').bind(code).first<{data:string;version:number}>();
  if(!row) throw new AppError('ไม่พบห้องนี้ ตรวจสอบรหัสกับเพื่อนอีกครั้ง',404);
  const room=JSON.parse(row.data) as RoomState; clean(room,Date.now());advance(room);
  if(!room.members.length){const r=await db.prepare('DELETE FROM rooms WHERE code = ? AND version = ?').bind(code,row.version).run();if(r.meta.changes)throw new AppError('ห้องนี้ปิดแล้ว กรุณาสร้างห้องใหม่',404);continue;}fn(room);advance(room);
  if(!room.members.length) {const r=await db.prepare('DELETE FROM rooms WHERE code = ? AND version = ?').bind(code,row.version).run();if(r.meta.changes)return null;continue;}
  const r=await db.prepare('UPDATE rooms SET data = ?, version = version + 1, updated = ? WHERE code = ? AND version = ?').bind(JSON.stringify(room),Date.now(),code,row.version).run();
  if(r.meta.changes) return room.members.some(m=>m.id===player.id)?view(room,player.id,row.version+1):null;
 }
 throw new AppError('ห้องกำลังอัปเดต กรุณาลองอีกครั้ง',409);
}
export async function createRoom(player:Player,gameId:string) {
 const game=gameRegistry[gameId];if(!game||game.status!=='available')throw new AppError('เกมนี้ยังไม่เปิดให้เล่น');
 if(game.private&&!(await privateUnlocked(player.id)))throw new AppError('เกมนี้เปิดให้เฉพาะกลุ่มที่มีรหัส',403);
 if(await currentRoom(player.id))throw new AppError('คุณอยู่ในห้องแล้ว กรุณาออกจากห้องก่อน',409);
 for(let i=0;i<8;i++){
 const bytes=crypto.getRandomValues(new Uint8Array(6));const code=Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
 await claimSeat(player.id,code);
 const now=Date.now(),room:RoomState={code,gameId,hostId:player.id,phase:'waiting',members:[{...player,ready:false,lastSeen:now,joined:now}],state:null,created:now};
 try{const res=await database().prepare('INSERT OR IGNORE INTO rooms (code,data,version,updated) VALUES (?,?,0,?)').bind(code,JSON.stringify(room),now).run();
 if(res.meta.changes)return view(room,player.id,0);
 await releaseSeat(player.id,code);
 }catch(e){await releaseFailedClaim(player.id,code);throw e;}
 }throw new AppError('สร้างรหัสห้องไม่สำเร็จ กรุณาลองใหม่',503);
}
export async function roomCommand(code:string,player:Player,action:string,payload:Record<string,unknown>={}) {
 const canJoinPrivate=action==='join'?await privateUnlocked(player.id):true;
 if(action==='join')await claimSeat(player.id,code);
 try{const result=await mutate(code,player,room=>{
 let member=room.members.find(m=>m.id===player.id);
 if(action==='join'&&!member) {
  if(gameRegistry[room.gameId].private&&!canJoinPrivate)throw new AppError('เกมนี้เปิดให้เฉพาะกลุ่มที่มีรหัส',403);
  if(room.phase!=='waiting')throw new AppError('ห้องนี้เริ่มเล่นแล้ว รอรอบถัดไป');
  if(room.members.length>=gameRegistry[room.gameId].maxPlayers)throw new AppError('ห้องเต็มแล้ว ลองเข้าห้องอื่น');
  const now=Date.now();member={...player,ready:false,lastSeen:now,joined:now};room.members.push(member);
 }
 if(!member)throw new AppError('คุณไม่ได้อยู่ในห้องนี้ หรือที่นั่งหมดอายุแล้ว',403);
 member.lastSeen=Date.now();member.name=player.name;
 if(action==='ready') {
  if(room.phase!=='waiting')throw new AppError('เปลี่ยนความพร้อมได้เฉพาะก่อนเริ่มเกม');
  if(typeof payload.ready!=='boolean')throw new AppError('สถานะพร้อมไม่ถูกต้อง');member.ready=payload.ready;
 }else if(action==='start') {
  if(room.hostId!==player.id)throw new AppError('เฉพาะเจ้าของห้องเท่านั้นที่เริ่มได้',403);
  if(!view(room,player.id,0).canStart)throw new AppError('ต้องมีผู้เล่นครบขั้นต่ำ และทุกคนออนไลน์พร้อมเล่น');
  room.phase='playing';room.state=gameRegistry[room.gameId].createInitialState(context(room));
 }else if(action==='leave') {
  room.members=room.members.filter(m=>m.id!==player.id);
  if(room.hostId===player.id)room.hostId=room.members[0]?.id??'';
 }else if(action==='reset') {
  if(room.hostId!==player.id)throw new AppError('เฉพาะเจ้าของห้องเท่านั้นที่กลับห้องรอได้',403);
  room.phase='waiting';room.state=null;room.members.forEach(m=>{m.ready=false;});
 }else if(action==='game-action') {gameAction(room,payload.gameAction,player.id);}
 else if(!['join','heartbeat'].includes(action))throw new AppError('คำสั่งไม่ถูกต้อง');
 });
 if(action==='leave')await releaseSeat(player.id,code);
 else await database().prepare("UPDATE seats SET lease_until = ? WHERE player_id = ? AND room_code = ? AND EXISTS (SELECT 1 FROM rooms, json_each(rooms.data, '$.members') WHERE rooms.code = ? AND json_extract(value, '$.id') = ?)").bind(Date.now()+RESERVATION_MS,player.id,code,code,player.id).run();
 return result;
 }catch(e){if(action==='join')await releaseFailedClaim(player.id,code);throw e;}
}
