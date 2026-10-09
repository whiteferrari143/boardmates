import {database} from '@/db/raw';
import {session,verifyOrigin,resultError,AppError} from '@/lib/session/server';
import type {ChatMessage} from '@/lib/chat/types';
const columns='id, player_id AS playerId, name, body, created';
const headers={'Cache-Control':'no-store'};
export async function GET(req:Request){try{
 await session(req);
 const rows=await database().prepare(`SELECT ${columns} FROM chat_messages ORDER BY id DESC LIMIT 100`).all<ChatMessage>();
 return Response.json({messages:rows.results.reverse()},{headers});
}catch(e){return resultError(e);}}
export async function POST(req:Request){try{
 verifyOrigin(req);const player=await session(req);
 if(new TextEncoder().encode(await req.clone().text()).length>8192)throw new AppError('ข้อความยาวเกินไป',413);
 const input=await req.json() as {body?:unknown;requestId?:unknown};
 if(!input||typeof input.body!=='string'||typeof input.requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(input.requestId))throw new AppError('ข้อมูลไม่ถูกต้อง');
 const body=input.body.trim();if(!body||Array.from(body).length>500)throw new AppError('กรุณาพิมพ์ข้อความ 1–500 ตัวอักษร');
 const db=database();
 const existing=await db.prepare(`SELECT ${columns} FROM chat_messages WHERE request_id=? AND player_id=?`).bind(input.requestId,player.id).first<ChatMessage>();
 if(existing)return Response.json({message:existing},{headers});
 const now=Date.now();
 await db.prepare(`INSERT INTO chat_messages (request_id,player_id,name,body,created)
 SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM chat_messages WHERE player_id=? AND created>?)
 ON CONFLICT(request_id) DO NOTHING`).bind(input.requestId,player.id,player.name,body,now,player.id,now-2000).run();
 const message=await db.prepare(`SELECT ${columns} FROM chat_messages WHERE request_id=? AND player_id=?`).bind(input.requestId,player.id).first<ChatMessage>();
 if(!message)throw new AppError('ส่งข้อความเร็วเกินไป รอสักครู่แล้วลองใหม่',429);
 return Response.json({message},{headers,status:201});
}catch(e){return resultError(e instanceof SyntaxError?new AppError('ข้อมูลไม่ถูกต้อง'):e);}}
