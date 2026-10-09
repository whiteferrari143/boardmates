import { env } from 'cloudflare:workers';
export function database() { if (!env.DB) throw new Error('ฐานข้อมูลไม่พร้อมใช้งาน กรุณาลองใหม่'); return env.DB; }
