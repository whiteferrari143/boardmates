import {session,verifyOrigin,resultError,AppError} from '@/lib/session/server';
import {unlockPrivate} from '@/lib/games/access';
export async function POST(req:Request){try{
 verifyOrigin(req);const player=await session(req),body=await req.json() as {code?:unknown};
 await unlockPrivate(player.id,body?.code);
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(e instanceof SyntaxError)return resultError(new AppError('ข้อมูลไม่ถูกต้อง'));return resultError(e);}}
