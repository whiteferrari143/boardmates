import { database } from '@/db/raw';
export class AppError extends Error { constructor(message:string, public status=400) { super(message); } }
export interface Player { id:string; name:string }
export async function digest(token:string) { const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)); return Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,'0')).join(''); }
export async function session(req:Request):Promise<Player> {
 const token=req.headers.get('cookie')?.match(/(?:^|;\s*)bm_session=([a-zA-Z0-9-]+)/)?.[1];
 if(!token) throw new AppError('กรุณาใส่ชื่อเพื่อเข้าเล่น',401);
 const row=await database().prepare('SELECT player_id, name FROM sessions WHERE token = ? AND expires > ?').bind(await digest(token),Date.now()).first<{player_id:string;name:string}>();
 if(!row) throw new AppError('เซสชันหมดอายุ กรุณาเข้าเล่นอีกครั้ง',401);
 return {id:row.player_id,name:row.name};
}
export function validateName(value:unknown):string {
 if(typeof value!=='string')throw new AppError('กรุณากรอกชื่อผู้เล่น');
 const name=value.trim().normalize('NFC'),length=Array.from(name).length;
 if(!length)throw new AppError('กรุณากรอกชื่อผู้เล่น');if(length<2||length>24)throw new AppError('ชื่อผู้เล่นต้องมีความยาว 2–24 ตัวอักษร');if(/[\p{Cc}\p{Cf}<>]/u.test(name))throw new AppError('ชื่อมีอักขระที่ไม่รองรับ');
 return name;
}
export function verifyOrigin(req:Request) {
 const origin=req.headers.get('origin');
 if(origin && origin!==new URL(req.url).origin) throw new AppError('ไม่อนุญาตคำขอจากเว็บไซต์อื่น',403);
}
export function resultError(error:unknown) { if(error instanceof AppError) return Response.json({error:error.message},{status:error.status}); console.error(error);return Response.json({error:'ระบบไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่'},{status:503}); }
export function cookie(req:Request,value:string,maxAge:number) { return `bm_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(req.url).protocol==='https:'?'; Secure':''}`; }
