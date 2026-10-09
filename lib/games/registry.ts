import type { GameDefinition } from './types';
import {spyfall} from './spyfall';
import {deception} from './deception';
export const gameRegistry: Record<string, GameDefinition> = {
  'room-test': {
    id:'room-test', name:'ทดสอบห้อง', description:'รวมตัว กดพร้อม แล้วลองเริ่มห้องกับเพื่อน เพื่อทดสอบการเชื่อมต่อ', minPlayers:2, maxPlayers:8, status:'available', screen:'room-test', color:'lime', icon:'FlaskConical', category:'ทดสอบระบบ',
    createInitialState: (ctx) => ({ startedAt:Date.now(), players:ctx.playerIds }),
    validateAction: () => false, updateState: (state) => state, isFinished: () => false,
    getPlayerView: (state) => state,
  },
  deception,
  spyfall,
};
export const gameCatalog = Object.values(gameRegistry).map(({id,name,description,minPlayers,maxPlayers,status,screen,color,icon,category})=>({id,name,description,minPlayers,maxPlayers,status,screen,color,icon,category}));
export type GameMetadata = typeof gameCatalog[number];
