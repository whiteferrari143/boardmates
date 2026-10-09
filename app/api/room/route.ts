import { session,verifyOrigin,resultError,AppError } from '@/lib/session/server';
import { normalizeCode,createRoom,roomCommand } from '@/lib/rooms/server';
export async function POST(req:Request){try{
 verifyOrigin(req);const player=await session(req),body=await req.json() as Record<string,unknown>;if(!body||typeof body.action!=='string')throw new AppError('คำสั่งไม่ถูกต้อง');if(body.action==='create'&&typeof body.gameId!=='string')throw new AppError('กรุณาเลือกเกม');
 const room=body.action==='create'?await createRoom(player,body.gameId as string):await roomCommand(normalizeCode(body.code),player,body.action,body);
 return Response.json({room},{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(e instanceof SyntaxError)return resultError(new AppError('ข้อมูลไม่ถูกต้อง'));return resultError(e);} }
