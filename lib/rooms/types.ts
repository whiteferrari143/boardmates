import type { GameMetadata } from '@/lib/games/registry';
import type { Player } from '@/lib/session/server';
export interface Member extends Player {ready:boolean; lastSeen:number; joined:number}
export interface RoomState {code:string;gameId:string;hostId:string;phase:'waiting'|'playing'|'finished';members:Member[];state:unknown;created:number}
export interface RoomView {code:string;game:GameMetadata;hostId:string;phase:RoomState['phase'];members:(Member & {connected:boolean})[];gameView:unknown;canStart:boolean;revision:number}
