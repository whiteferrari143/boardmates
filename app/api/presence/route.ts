import {database} from '@/db/raw';
import {session,verifyOrigin,resultError} from '@/lib/session/server';
import type {OnlinePlayer,PresenceView} from '@/lib/presence/types';
// Client polls every 5s (15s while the tab is hidden); a player counts as online for 30s after the last heartbeat.
const PRESENCE_MS=30000, PRESENCE_LIMIT=100;
// Heartbeat and read in one request. Identity comes only from the server session; the body is ignored.
export async function POST(req:Request){try{
 verifyOrigin(req);const player=await session(req),db=database(),now=Date.now();
 await db.prepare('UPDATE sessions SET last_seen = ? WHERE player_id = ? AND last_seen < ?').bind(now,player.id,now-2000).run();
 const rows=await db.prepare('SELECT s.player_id AS id, s.name AS name, EXISTS (SELECT 1 FROM seats WHERE seats.player_id = s.player_id AND seats.lease_until > ?) AS inRoom FROM sessions s WHERE s.last_seen > ? AND s.expires > ? ORDER BY s.name COLLATE NOCASE, s.player_id LIMIT ?').bind(now,now-PRESENCE_MS,now,PRESENCE_LIMIT).all<{id:string;name:string;inRoom:number}>();
 const count=await db.prepare('SELECT COUNT(*) AS total FROM sessions WHERE last_seen > ? AND expires > ?').bind(now-PRESENCE_MS,now).first<{total:number}>();
 const players:OnlinePlayer[]=rows.results.map(r=>({id:r.id,name:r.name,inRoom:!!r.inRoom}));
 const body:PresenceView={players,total:Math.max(count?.total??0,players.length)};
 return Response.json(body,{headers:{'Cache-Control':'no-store'}});
}catch(e){return resultError(e);}}
