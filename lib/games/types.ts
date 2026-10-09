export interface GameContext { playerIds: string[]; hostId: string }
export interface GameDefinition<S = unknown, A = unknown, V = unknown> {
  id: string; name: string; description: string; minPlayers: number; maxPlayers: number;
  status: 'available' | 'coming-soon'; screen: string; color: string; icon: string; category: string;
  createInitialState(context: GameContext): S;
  validateAction(state: S, action: unknown, actorId: string, context: GameContext): boolean;
  updateState(state: S, action: A, actorId: string, context: GameContext): S;
  isFinished(state: S): boolean;
  getPlayerView(state: S, playerId: string, context: GameContext): V;
}

// Adapt a typed game to the registry boundary; actions are checked before updateState.
export function defineGame<S,A,V>(game:GameDefinition<S,A,V>):GameDefinition {
 return {...game,
  createInitialState:ctx=>game.createInitialState(ctx),
  validateAction:(state,action,actor,ctx)=>game.validateAction(state as S,action,actor,ctx),
  updateState:(state,action,actor,ctx)=>game.updateState(state as S,action as A,actor,ctx),
  isFinished:state=>game.isFinished(state as S),
  getPlayerView:(state,actor,ctx)=>game.getPlayerView(state as S,actor,ctx),
 };
}
