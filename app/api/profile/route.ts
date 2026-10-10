import {database} from '@/db/raw';
import {session,verifyOrigin,resultError,validateName,AppError} from '@/lib/session/server';
import {currentRoom,mutate} from '@/lib/rooms/server';
const RENAME_COOLDOWN_MS=10000;
// Rename the signed-in player. The target is always the server session's player; any id in the body is ignored.
export async function POST(req:Request){try{
 verifyOrigin(req);const player=await session(req);
 const body=await req.json() as {name?:unknown};if(!body)throw new AppError('กรุณากรอกชื่อผู้เล่น');
 const name=validateName(body.name);
 if(name===player.name)return Response.json({player},{headers:{'Cache-Control':'no-store'}});
 const db=database(),now=Date.now();
 const res=await db.prepare('UPDATE sessions SET name = ?, name_changed = ? WHERE player_id = ? AND expires > ? AND name_changed <= ?').bind(name,now,player.id,now,now-RENAME_COOLDOWN_MS).run();
 if(!res.meta.changes)throw new AppError('เปลี่ยนชื่อบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',429);
 const next={id:player.id,name};
 // Shared copies of the name: chat history and the current room. Both are best-effort; the room also self-heals on the next heartbeat.
 try{await db.prepare('UPDATE chat_messages SET name = ? WHERE player_id = ?').bind(name,player.id).run();}catch(e){console.error(e);}
 try{const code=await currentRoom(player.id);if(code)await mutate(code,next,room=>{const member=room.members.find(m=>m.id===player.id);if(member)member.name=name;});}catch(e){if(!(e instanceof AppError))console.error(e);}
 return Response.json({player:next},{headers:{'Cache-Control':'no-store'}});
}catch(e){return resultError(e instanceof SyntaxError?new AppError('ข้อมูลไม่ถูกต้อง'):e);}}
