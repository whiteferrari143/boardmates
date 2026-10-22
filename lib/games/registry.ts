import type { GameDefinition } from './types';
import {spyfall} from './spyfall';
import {deception} from './deception';
import {crystalMarket} from './market';
export const gameRegistry: Record<string, GameDefinition> = {
  'crystal-market': crystalMarket,
  deception,
  spyfall,
};
export const gameCatalog = Object.values(gameRegistry).map(({id,name,description,minPlayers,maxPlayers,status,screen,color,icon,category,private:isPrivate})=>({id,name,description,minPlayers,maxPlayers,status,screen,color,icon,category,private:!!isPrivate}));
export type GameMetadata = typeof gameCatalog[number];
