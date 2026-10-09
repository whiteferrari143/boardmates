import {defineGame,type GameContext} from './types';
import {meansCards,evidenceCards,sceneTiles,placeTiles,causeTile,caseCard,caseTile,type CaseRole} from './deception-content';
export type CasePhase='setup'|'briefing'|'crime'|'clues'|'discussion'|'presentation'|'refresh'|'witness'|'result';
type Settings={advanced:boolean;cards:number;discussion:number;scientistId:string};
type Exhibit={means:string[];evidence:string[]};
type Marker={tileId:string;option:number|null;order:number};
type Solution={suspect:string;means:string;evidence:string};
export interface DeceptionState{
 phase:CasePhase;players:string[];settings:Settings;roles:Record<string,CaseRole>;scientist:string;exhibits:Record<string,Exhibit>;
 solution:Solution|null;ready:string[];round:number;tiles:Marker[];sceneDeck:string[];upcoming:string;clueHistory:{round:number;replaced:string;replacement:string;option:number}[];
 badges:Record<string,boolean>;attempts:(Solution&{by:string;correct:boolean})[];presenters:string[];presenterIndex:number;deadline:number;
 winner:'investigators'|'criminals'|'cancelled'|null;reason:string;solvedBy:string;witnessGuess:string;
}
type CaseAction={type:string;[key:string]:unknown};
function random(max:number){const limit=Math.floor(4294967296/max)*max;let n:number;do{n=crypto.getRandomValues(new Uint32Array(1))[0];}while(n>=limit);return n%max;}
function shuffled<T>(items:T[]){const a=[...items];for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function initial(ctx:GameContext):DeceptionState{return {phase:'setup',players:[...ctx.playerIds],settings:{advanced:false,cards:4,discussion:90,scientistId:ctx.hostId},roles:{},scientist:'',exhibits:{},solution:null,ready:[],round:0,tiles:[],sceneDeck:[],upcoming:'',clueHistory:[],badges:{},attempts:[],presenters:[],presenterIndex:0,deadline:0,winner:null,reason:'',solvedBy:'',witnessGuess:''};}
function validSettings(value:unknown,players:string[]):value is Settings{if(!value||typeof value!=='object')return false;const s=value as Settings;return typeof s.advanced==='boolean'&&(!s.advanced||players.length>=6)&&[3,4,5].includes(s.cards)&&[60,90,120,180].includes(s.discussion)&&typeof s.scientistId==='string'&&(s.scientistId===''||players.includes(s.scientistId));}
function deal(s:DeceptionState){const order=shuffled(s.players);s.scientist=s.settings.scientistId||order[0];const suspects=order.filter(id=>id!==s.scientist);s.roles=Object.fromEntries(s.players.map(id=>[id,id===s.scientist?'scientist':'investigator']));s.roles[suspects[0]]='murderer';if(s.settings.advanced){s.roles[suspects[1]]='accomplice';s.roles[suspects[2]]='witness';}const seated=s.players.filter(id=>id!==s.scientist);const m=shuffled(meansCards),e=shuffled(evidenceCards);s.exhibits=Object.fromEntries(seated.map((id,i)=>[id,{means:m.slice(i*s.settings.cards,(i+1)*s.settings.cards).map(c=>c.id),evidence:e.slice(i*s.settings.cards,(i+1)*s.settings.cards).map(c=>c.id)}]));s.badges=Object.fromEntries(seated.map(id=>[id,true]));s.sceneDeck=shuffled(sceneTiles.map(t=>t.id));const start=s.players.indexOf(s.scientist);s.presenters=Array.from({length:s.players.length-1},(_,i)=>s.players[(start+i+1)%s.players.length]);s.phase='briefing';}
function finish(s:DeceptionState,winner:DeceptionState['winner'],reason:string){s.phase='result';s.winner=winner;s.reason=reason;s.deadline=0;}
function discussion(s:DeceptionState,now:number){s.phase='discussion';s.deadline=now+s.settings.discussion*1000;}
function presentation(s:DeceptionState,now:number){s.phase='presentation';s.presenterIndex=0;s.deadline=now+30000;}
function nextPresenter(s:DeceptionState,now:number){if(++s.presenterIndex<s.presenters.length){s.deadline=now+30000;return;}s.deadline=0;if(s.round===3){finish(s,'criminals','unsolved');return;}s.round++;s.upcoming=s.sceneDeck.shift()!;s.phase='refresh';}
export function tickDeception(s:DeceptionState,ctx:GameContext,now=Date.now()){
 if(s.phase!=='result'&&s.players.some(id=>!ctx.playerIds.includes(id))){finish(s,'cancelled','player-left');return s;}
 if(!s.deadline||now<s.deadline)return s;
 if(s.phase==='discussion')presentation(s,now);
 else if(s.phase==='presentation')nextPresenter(s,now);
 else if(s.phase==='witness')finish(s,'investigators','witness-safe');
 return s;
}
function valid(s:DeceptionState,value:unknown,id:string,ctx:GameContext){if(!value||typeof value!=='object'||!s.players.includes(id))return false;const a=value as CaseAction;const target=typeof a.suspect==='string'?a.suspect:'';const exhibit=s.exhibits[target];const scientist=id===s.scientist;switch(a.type){
 case 'configure':return s.phase==='setup'&&id===ctx.hostId&&validSettings(a.settings,s.players);
 case 'deal':return s.phase==='setup'&&id===ctx.hostId;
 case 'ready':return s.phase==='briefing'&&!s.ready.includes(id);
 case 'crime':return s.phase==='crime'&&s.roles[id]==='murderer'&&typeof a.means==='string'&&typeof a.evidence==='string'&&s.exhibits[id].means.includes(a.means)&&s.exhibits[id].evidence.includes(a.evidence);
 case 'location':return s.phase==='clues'&&scientist&&s.tiles.length===0&&placeTiles.some(t=>t.id===a.tileId);
 case 'mark':return s.phase==='clues'&&scientist&&Number.isInteger(a.slot)&&!!s.tiles[a.slot as number]&&s.tiles[a.slot as number].option===null&&Number.isInteger(a.option)&&(a.option as number)>=0&&(a.option as number)<6;
 case 'replace':return s.phase==='refresh'&&scientist&&Number.isInteger(a.slot)&&(a.slot as number)>=2&&(a.slot as number)<6&&Number.isInteger(a.option)&&(a.option as number)>=0&&(a.option as number)<6;
 case 'present':return s.phase==='discussion'&&scientist;
 case 'done':return s.phase==='presentation'&&s.presenters[s.presenterIndex]===id;
 case 'solve':return ['clues','discussion','presentation','refresh'].includes(s.phase)&&!scientist&&!!s.badges[id]&&s.tiles.some(t=>t.option!==null)&&target!==id&&!!exhibit&&typeof a.means==='string'&&typeof a.evidence==='string'&&exhibit.means.includes(a.means)&&exhibit.evidence.includes(a.evidence);
 case 'witness':return s.phase==='witness'&&s.roles[id]==='murderer'&&typeof a.target==='string'&&s.players.includes(a.target)&&!['scientist','murderer','accomplice'].includes(s.roles[a.target]);
 default:return false;
}}
function update(s:DeceptionState,a:CaseAction,id:string){const now=Date.now();switch(a.type){
 case 'configure':s.settings=a.settings as Settings;break;
 case 'deal':deal(s);break;
 case 'ready':s.ready.push(id);if(s.ready.length===s.players.length)s.phase='crime';break;
 case 'crime':s.solution={suspect:id,means:a.means as string,evidence:a.evidence as string};s.round=1;s.phase='clues';break;
 case 'location':s.tiles=[causeTile.id,a.tileId as string,...s.sceneDeck.splice(0,4)].map(tileId=>({tileId,option:null,order:0}));break;
 case 'mark':s.tiles[a.slot as number].option=a.option as number;s.tiles[a.slot as number].order=s.tiles.filter(t=>t.option!==null).length;if(s.tiles.every(t=>t.option!==null))discussion(s,now);break;
 case 'replace':{const old=s.tiles[a.slot as number].tileId;s.tiles[a.slot as number]={tileId:s.upcoming,option:a.option as number,order:6+s.round-1};s.clueHistory.push({round:s.round,replaced:old,replacement:s.upcoming,option:a.option as number});s.upcoming='';discussion(s,now);break;}
 case 'present':presentation(s,now);break;
 case 'done':nextPresenter(s,now);break;
 case 'solve':{const attempted={suspect:a.suspect as string,means:a.means as string,evidence:a.evidence as string};const correct=attempted.suspect===s.solution?.suspect&&attempted.means===s.solution.means&&attempted.evidence===s.solution.evidence;s.badges[id]=false;s.attempts.push({...attempted,by:id,correct});if(correct){s.solvedBy=id;if(s.settings.advanced){s.phase='witness';s.deadline=now+60000;}else finish(s,'investigators','solved');}else if(!Object.values(s.badges).some(Boolean))finish(s,'criminals','no-badges');break;}
 case 'witness':s.witnessGuess=a.target as string;finish(s,s.roles[s.witnessGuess]==='witness'?'criminals':'investigators',s.roles[s.witnessGuess]==='witness'?'witness-found':'witness-safe');break;
}return s;}
export function deceptionView(s:DeceptionState,id:string){const role=s.roles[id]??null;const reveal=s.phase==='result';const knows=role==='scientist'||role==='murderer'||role==='accomplice';const criminal=s.players.find(p=>s.roles[p]==='murderer');const accomplice=s.players.find(p=>s.roles[p]==='accomplice');return {
 phase:s.phase,players:s.players,settings:s.settings,scientist:s.scientist,round:s.round,ready:s.ready,myRole:role,
 exhibits:Object.fromEntries(Object.entries(s.exhibits).map(([p,e])=>[p,{means:e.means.map(c=>caseCard(c)!),evidence:e.evidence.map(c=>caseCard(c)!)}])),
 solution:knows||reveal?s.solution:null,
 knownCriminal:role==='scientist'||role==='murderer'||role==='accomplice'||reveal?criminal??null:null,
 knownAccomplice:role==='scientist'||role==='murderer'||role==='accomplice'||reveal?accomplice??null:null,
 witnessedPair:role==='witness'?s.players.filter(p=>p===criminal||p===accomplice):[],
 locationChoices:role==='scientist'&&s.phase==='clues'&&s.tiles.length===0?placeTiles:[],
 tiles:s.tiles.map(t=>({...caseTile(t.tileId),option:t.option,order:t.order})),
 upcoming:role==='scientist'&&s.phase==='refresh'?caseTile(s.upcoming):null,
 clueHistory:s.clueHistory.map(c=>({round:c.round,replaced:caseTile(c.replaced).title,replacement:caseTile(c.replacement).title,option:caseTile(c.replacement).options[c.option]})),
 badges:s.badges,attempts:s.attempts,presenter:s.phase==='presentation'?s.presenters[s.presenterIndex]:null,presenterIndex:s.presenterIndex,presentationTotal:s.presenters.length,
 serverNow:Date.now(),deadline:s.deadline,winner:s.winner,reason:s.reason,solvedBy:s.solvedBy,arrested:s.phase==='witness'?s.solution?.suspect??null:null,
 witnessGuess:s.witnessGuess,revealed:reveal?s.roles:null,
};}
export type DeceptionView=ReturnType<typeof deceptionView>;
export const deception=defineGame({id:'deception',name:'Deception · สืบคดีลวง',description:'ฆาตกรอยู่ในวง! อ่านคำใบ้จากผู้ชันสูตร แล้วจับคู่วิธีสังหารกับหลักฐานให้ถูก',minPlayers:4,maxPlayers:10,status:'available',screen:'deception',color:'violet',icon:'Fingerprint',category:'สืบสวน · บทบาทลับ',createInitialState:initial,validateAction:valid,updateState:update,isFinished:(s:DeceptionState)=>s.phase==='result',getPlayerView:deceptionView});
