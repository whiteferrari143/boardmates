import { database } from '@/db/raw';
import { session,cookie,digest,verifyOrigin,resultError,validateName,AppError } from '@/lib/session/server';
import { currentRoom } from '@/lib/rooms/server';
export async function GET(req:Request) {try {const player=await session(req);return Response.json({player,roomCode:await currentRoom(player.id)},{headers:{'Cache-Control':'no-store'}});}catch(e){return resultError(e);} }
export async function POST(req:Request) {try {
 verifyOrigin(req);
 try {const player=await session(req);return Response.json({player,roomCode:await currentRoom(player.id)});}catch(e){if(!(e instanceof AppError&&e.status===401))throw e;}
 const body=await req.json() as {name?:unknown};if(!body)throw new AppError('กรุณากรอกชื่อผู้เล่น');
 const name=validateName(body.name);
 const token=crypto.randomUUID()+crypto.randomUUID(),id=crypto.randomUUID(),now=Date.now();
 await database().prepare('INSERT INTO sessions (token,player_id,name,expires,last_seen) VALUES (?,?,?,?,?)').bind(await digest(token),id,name,now+7*86400000,now).run();
 return Response.json({player:{id,name},roomCode:null},{headers:{'Set-Cookie':cookie(req,token,7*86400)}});
 }catch(e){if(e instanceof SyntaxError)return resultError(new AppError('ข้อมูลไม่ถูกต้อง'));return resultError(e);} }
