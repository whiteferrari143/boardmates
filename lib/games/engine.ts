import { gameRegistry } from './registry';
import { AppError } from '@/lib/session/server';
import type { RoomState } from '@/lib/rooms/types';
export function context(room:RoomState) { return {playerIds:room.members.map(p=>p.id),hostId:room.hostId}; }
export function gameAction(room:RoomState,action:unknown,actorId:string) {
 const game=gameRegistry[room.gameId];
 if(room.phase!=='playing'||!room.members.some(m=>m.id===actorId)) throw new AppError('คุณไม่มีสิทธิ์เล่นในห้องนี้',403);
 if(!game.validateAction(room.state,action,actorId,context(room))) throw new AppError('การกระทำนี้ไม่ถูกต้อง');
 room.state=game.updateState(room.state,action,actorId,context(room));
 if(game.isFinished(room.state)) room.phase='finished';
}
