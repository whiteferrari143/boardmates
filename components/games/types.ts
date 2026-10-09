import type {RoomView} from '@/lib/rooms/types';
export interface GameScreenProps {
 room:RoomView; playerId:string; isHost:boolean; busy:boolean;
 onAction:(action:unknown)=>void; onReset:()=>void;
}
