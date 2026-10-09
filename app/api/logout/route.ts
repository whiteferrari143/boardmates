import {database} from '@/db/raw';
import {session,cookie,digest,verifyOrigin,resultError} from '@/lib/session/server';
import {currentRoom,roomCommand} from '@/lib/rooms/server';
export async function POST(req:Request){try{verifyOrigin(req);const player=await session(req),code=await currentRoom(player.id);if(code)await roomCommand(code,player,'leave');const token=req.headers.get('cookie')!.match(/(?:^|;\s*)bm_session=([a-zA-Z0-9-]+)/)![1];await database().prepare('DELETE FROM sessions WHERE token = ?').bind(await digest(token)).run();return Response.json({ok:true},{headers:{'Set-Cookie':cookie(req,'',0)}});}catch(e){return resultError(e);} }
