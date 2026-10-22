import {env} from 'cloudflare:workers';
import {database} from '@/db/raw';
import {AppError,digest} from '@/lib/session/server';

const WINDOW_MS=300000,MAX_TRIES=5;

/** True when this player's session has unlocked private games with the group code. */
export async function privateUnlocked(playerId:string):Promise<boolean>{
 const row=await database().prepare('SELECT private_ok FROM sessions WHERE player_id = ? AND expires > ?').bind(playerId,Date.now()).first<{private_ok:number}>();
 return row?.private_ok===1;
}
function sameDigest(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
/** Checks the group code against the server secret. Every attempt is counted before it is compared. */
export async function unlockPrivate(playerId:string,code:unknown):Promise<void>{
 if(typeof code!=='string'||!code.trim()||code.length>128)throw new AppError('กรุณาใส่รหัสกลุ่ม');
 const db=database(),now=Date.now();
 const row=await db.prepare('UPDATE sessions SET private_fail = CASE WHEN ? - private_fail_at >= ? THEN 1 ELSE private_fail + 1 END, private_fail_at = ? WHERE player_id = ? AND expires > ? RETURNING private_fail').bind(now,WINDOW_MS,now,playerId,now).first<{private_fail:number}>();
 if(!row)throw new AppError('เซสชันหมดอายุ กรุณาเข้าเล่นอีกครั้ง',401);
 if(row.private_fail>MAX_TRIES)throw new AppError('ใส่รหัสผิดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่',429);
 const secret=env.PRIVATE_GAME_CODE;
 if(!secret||!sameDigest(await digest(code.trim()),await digest(secret)))throw new AppError('รหัสกลุ่มไม่ถูกต้อง',403);
 await db.prepare('UPDATE sessions SET private_ok = 1, private_fail = 0 WHERE player_id = ?').bind(playerId).run();
}
