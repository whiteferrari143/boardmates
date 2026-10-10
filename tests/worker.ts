import * as session from '../app/api/session/route';
import * as room from '../app/api/room/route';
import * as lobby from '../app/api/lobby/route';
import * as logout from '../app/api/logout/route';
import * as chat from '../app/api/chat/route';
import * as presence from '../app/api/presence/route';
import * as profile from '../app/api/profile/route';
import {gameRegistry} from '../lib/games/registry';
import {defineGame} from '../lib/games/types';
// Test-only module: never part of the deployed application routes.
gameRegistry['private-view-test']=defineGame<{hands:Record<string,string>;turn:string},{type:'finish'}, {hand:string;finished:boolean}>({
 ...gameRegistry['room-test'],id:'private-view-test',
 createInitialState:ctx=>({hands:Object.fromEntries(ctx.playerIds.map((id,i)=>[id,`SECRET-${i}`])),turn:ctx.hostId}),
 validateAction:(state,action,actor)=>!!action&&typeof action==='object'&&'type' in action&&action.type==='finish'&&state.turn===actor,
 updateState:state=>({...state,turn:''}),isFinished:state=>state.turn==='',
 getPlayerView:(state,actor)=>({hand:state.hands[actor],finished:state.turn===''}),
});
const worker = {fetch(req:Request) {const path=new URL(req.url).pathname;if(path==='/api/chat')return req.method==='POST'?chat.POST(req):chat.GET(req);if(path==='/api/session')return req.method==='POST'?session.POST(req):session.GET(req);if(path==='/api/room')return room.POST(req);if(path==='/api/logout')return logout.POST(req);if(path==='/api/presence')return presence.POST(req);if(path==='/api/profile')return profile.POST(req);return lobby.GET();}};
export default worker;
