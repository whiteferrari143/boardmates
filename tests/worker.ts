import * as session from '../app/api/session/route';
import * as room from '../app/api/room/route';
import * as lobby from '../app/api/lobby/route';
import * as logout from '../app/api/logout/route';
import * as chat from '../app/api/chat/route';
import * as presence from '../app/api/presence/route';
import * as profile from '../app/api/profile/route';
import * as unlock from '../app/api/unlock/route';
import {gameRegistry,gameCatalog} from '../lib/games/registry';
import {defineGame} from '../lib/games/types';
// Test-only module: never part of the deployed application routes.
// Minimal generic game used by the room-flow tests (the lobby no longer ships a placeholder game).
gameRegistry['room-test']=defineGame<{players:string[]},unknown,{players:string[]}>({
 id:'room-test',name:'ทดสอบห้อง',description:'test',minPlayers:2,maxPlayers:8,status:'available',screen:'room-test',color:'lime',icon:'Gem',category:'test',
 createInitialState:ctx=>({players:ctx.playerIds}),validateAction:()=>false,updateState:s=>s,isFinished:()=>false,getPlayerView:s=>s,
});
// Test-only private game (the shipped games are all public) to exercise the group-code lock.
gameRegistry['private-market-test']={...gameRegistry['crystal-market'],id:'private-market-test',private:true};
gameCatalog.push({...gameCatalog.find(g=>g.id==='crystal-market')!,id:'private-market-test',private:true});
gameRegistry['private-view-test']=defineGame<{hands:Record<string,string>;turn:string},{type:'finish'}, {hand:string;finished:boolean}>({
 ...gameRegistry['room-test'],id:'private-view-test',
 createInitialState:ctx=>({hands:Object.fromEntries(ctx.playerIds.map((id,i)=>[id,`SECRET-${i}`])),turn:ctx.hostId}),
 validateAction:(state,action,actor)=>!!action&&typeof action==='object'&&'type' in action&&action.type==='finish'&&state.turn===actor,
 updateState:state=>({...state,turn:''}),isFinished:state=>state.turn==='',
 getPlayerView:(state,actor)=>({hand:state.hands[actor],finished:state.turn===''}),
});
const worker = {fetch(req:Request) {const path=new URL(req.url).pathname;if(path==='/api/chat')return req.method==='POST'?chat.POST(req):chat.GET(req);if(path==='/api/session')return req.method==='POST'?session.POST(req):session.GET(req);if(path==='/api/room')return room.POST(req);if(path==='/api/logout')return logout.POST(req);if(path==='/api/presence')return presence.POST(req);if(path==='/api/profile')return profile.POST(req);if(path==='/api/unlock')return unlock.POST(req);return lobby.GET(req);}};
export default worker;
