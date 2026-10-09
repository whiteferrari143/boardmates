import { database } from '@/db/raw';
import { session,cookie,digest,verifyOrigin,resultError,AppError } from '@/lib/session/server';
import { currentRoom } from '@/lib/rooms/server';
export async function GET(req:Request) {try {const player=await session(req);return Response.json({player,roomCode:await currentRoom(player.id)},{headers:{'Cache-Control':'no-store'}});}catch(e){return resultError(e);} }
export async function POST(req:Request) {try {
 verifyOrigin(req);
 try {const player=await session(req);return Response.json({player,roomCode:await currentRoom(player.id)});}catch(e){if(!(e instanceof AppError&&e.status===401))throw e;}
 const body=await req.json() as {name?:unknown};if(!body||typeof body.name!=='string')throw new AppError('กรุณากรอกชื่อผู้เล่น');
 const name=body.name.trim().normalize('NFC'),length=Array.from(name).length;
 if(!length)throw new AppError('กรุณากรอกชื่อผู้เล่น');if(length<2||length>24)throw new AppError('ชื่อผู้เล่นต้องมีความยาว 2–24 ตัวอักษร');if(/[\p{Cc}\p{Cf}<>]/u.test(name))throw new AppError('ชื่อมีอักขระที่ไม่รองรับ');
 const token=crypto.randomUUID()+crypto.randomUUID(),id=crypto.randomUUID();
 await database().prepare('INSERT INTO sessions (token,player_id,name,expires) VALUES (?,?,?,?)').bind(await digest(token),id,name,Date.now()+7*86400000).run();
 return Response.json({player:{id,name},roomCode:null},{headers:{'Set-Cookie':cookie(req,token,7*86400)}});
 }catch(e){if(e instanceof SyntaxError)return resultError(new AppError('ข้อมูลไม่ถูกต้อง'));return resultError(e);} }
