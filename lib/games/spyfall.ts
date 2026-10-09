import {defineGame} from './types';
import type {GameContext} from './types';
import {spyLocations,spyPacks,type LocationPack} from './spyfall-content';
export type Phase='setup'|'reveal'|'discuss'|'vote'|'guess'|'result';
type Secret={spy:boolean;role:string};
type Settings={packs:LocationPack[];spies:number;minutes:number;rounds:number;scenario:boolean};
export interface SpyState {
 phase:Phase;players:string[];round:number;settings:Settings;scores:Record<string,number>;
 secrets:Record<string,Secret>;location:string;scenario:string;history:string[];seen:string[];
 asker:string;previous:string;target:string;deadline:number;remaining:number;accusedBy:string[];
 firstAccusers:Record<string,string>;vote:null|{target:string;by:string;ballots:Record<string,boolean>;final:boolean;index:number};
 guesses:Record<string,string>;guessOrder:string[];reason:string;winner:'spies'|'locals'|'cancelled'|null;awards:Record<string,number>;
}
type Action={type:string;[key:string]:unknown};
const pick=<T,>(a:T[]):T=>a[randomInt(a.length)];
function randomInt(max:number){const limit=Math.floor(4294967296/max)*max;let n:number;do{n=crypto.getRandomValues(new Uint32Array(1))[0];}while(n>=limit);return n%max;}
function shuffle<T>(items:T[]):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function initial(ctx:GameContext):SpyState{return {phase:'setup',players:[...ctx.playerIds],round:0,settings:{packs:['thai','world','adventure'],spies:ctx.playerIds.length>=9?2:1,minutes:ctx.playerIds.length>=11?10:ctx.playerIds.length>=9?9:ctx.playerIds.length>=7?8:ctx.playerIds.length>=5?7:6,rounds:5,scenario:true},scores:Object.fromEntries(ctx.playerIds.map(id=>[id,0])),secrets:{},location:'',scenario:'',history:[],seen:[],asker:'',previous:'',target:'',deadline:0,remaining:0,accusedBy:[],firstAccusers:{},vote:null,guesses:{},guessOrder:[],reason:'',winner:null,awards:{}};}
function settingsValid(v:unknown,n:number):v is Settings {if(!v||typeof v!=='object')return false;const s=v as Settings;return Array.isArray(s.packs)&&s.packs.length>0&&s.packs.length<=3&&new Set(s.packs).size===s.packs.length&&s.packs.every(p=>Object.hasOwn(spyPacks,p))&&[1,2].includes(s.spies)&&(n>6||s.spies===1)&&(n<12||s.spies===2)&&Number.isInteger(s.minutes)&&s.minutes>=6&&s.minutes<=15&&Number.isInteger(s.rounds)&&s.rounds>=1&&s.rounds<=10&&typeof s.scenario==='boolean';}
function begin(s:SpyState){const pool=spyLocations.filter(l=>s.settings.packs.includes(l.pack));let unused=pool.filter(l=>!s.history.includes(l.id));if(!unused.length){s.history=[];unused=pool;}const l=pick(unused);s.history.push(l.id);s.location=l.id;s.scenario=s.settings.scenario?pick(l.scenarios):'';const ids=shuffle(s.players),roles=shuffle(l.roles);s.secrets=Object.fromEntries(ids.map((id,i)=>[id,{spy:i<s.settings.spies,role:i<s.settings.spies?'สายลับ':roles[i-s.settings.spies]}]));s.round++;s.phase='reveal';s.seen=[];s.asker=s.players[(s.round-1)%s.players.length];s.previous='';s.target='';s.deadline=0;s.remaining=s.settings.minutes*60000;s.accusedBy=[];s.firstAccusers={};s.vote=null;s.guesses={};s.guessOrder=[];s.reason='';s.winner=null;s.awards={};}
function finish(s:SpyState,winner:'spies'|'locals',reason:string,convicted?:string){s.phase='result';s.winner=winner;s.reason=reason;s.deadline=0;s.awards={};for(const id of s.players){let points=0;const spy=s.secrets[id].spy;if(winner==='spies'&&spy){points=2;if(reason==='wrong-accusation')points+=2;if(reason==='correct-guess'&&s.guesses[id]===s.location)points+=2;}if(winner==='locals'&&(!spy||(!!convicted&&id!==convicted)))points=1;if(winner==='locals'&&convicted&&s.firstAccusers[convicted]===id)points+=1;s.awards[id]=points;s.scores[id]+=points;}}
function startVote(s:SpyState,target:string,by:string,final:boolean,index:number,now:number){s.phase='vote';s.vote={target,by,ballots:{},final,index};s.deadline=now+30000;}
function settleVote(s:SpyState,now:number){const v=s.vote!;const yes=Object.values(v.ballots).filter(Boolean).length;if(yes>=s.players.length-s.settings.spies){finish(s,s.secrets[v.target].spy?'locals':'spies',s.secrets[v.target].spy?'caught':'wrong-accusation',s.secrets[v.target].spy?v.target:undefined);return;}if(v.final){if(v.index+1>=s.players.length){finish(s,'spies','escaped');return;}const start=(s.round-1)%s.players.length;startVote(s,s.players[(start+v.index+1)%s.players.length],'',true,v.index+1,now);}else{s.phase='discuss';s.vote=null;s.deadline=now+s.remaining;}}
function settleGuesses(s:SpyState){finish(s,Object.values(s.guesses).includes(s.location)?'spies':'locals',Object.values(s.guesses).includes(s.location)?'correct-guess':'wrong-guess');}
export function tickSpyfall(s:SpyState,ctx:GameContext,now=Date.now()):SpyState {
 if(s.phase!=='result'&&s.players.some(id=>!ctx.playerIds.includes(id))){s.phase='result';s.winner='cancelled';s.reason='player-left';s.deadline=0;return s;}
 if(!s.deadline||now<s.deadline)return s;
 if(s.phase==='discuss'){s.remaining=0;startVote(s,s.players[(s.round-1)%s.players.length],'',true,0,now);}
 else if(s.phase==='vote')settleVote(s,now);
 else if(s.phase==='guess'){const pending=s.guessOrder.find(id=>!Object.hasOwn(s.guesses,id));if(pending)s.guesses[pending]='';if(Object.keys(s.guesses).length===s.guessOrder.length)settleGuesses(s);else s.deadline=now+45000;}
 return s;
}
function validate(s:SpyState,a:unknown,id:string,ctx:GameContext){if(!a||typeof a!=='object'||!s.players.includes(id))return false;const action=a as Action;const target=typeof action.target==='string'?action.target:'';switch(action.type){
 case 'configure':return s.phase==='setup'&&id===ctx.hostId&&settingsValid(action.settings,s.players.length);
 case 'begin':return s.phase==='setup'&&id===ctx.hostId;
 case 'seen':return s.phase==='reveal'&&!s.seen.includes(id);
 case 'ask':return s.phase==='discuss'&&id===s.asker&&!s.target&&s.players.includes(target)&&target!==id&&target!==s.previous;
 case 'answered':return s.phase==='discuss'&&id===s.target;
 case 'accuse':return s.phase==='discuss'&&!s.accusedBy.includes(id)&&target!==id&&s.players.includes(target);
 case 'vote':return s.phase==='vote'&&s.vote?.target!==id&&!Object.hasOwn(s.vote!.ballots,id)&&typeof action.yes==='boolean';
 case 'guess-start':return s.phase==='discuss'&&s.secrets[id].spy;
 case 'guess':return s.phase==='guess'&&s.guessOrder.find(p=>!Object.hasOwn(s.guesses,p))===id&&spyLocations.some(l=>l.id===action.location&&s.settings.packs.includes(l.pack));
 case 'next':return s.phase==='result'&&s.winner!=='cancelled'&&s.round<s.settings.rounds&&id===ctx.hostId;
 default:return false;
}}
function update(s:SpyState,a:Action,id:string){const now=Date.now();switch(a.type){
 case 'configure':s.settings=a.settings as Settings;break;
 case 'begin':begin(s);break;
 case 'seen':s.seen.push(id);if(s.seen.length===s.players.length){s.phase='discuss';s.deadline=now+s.remaining;}break;
 case 'ask':s.target=a.target as string;break;
 case 'answered':s.previous=s.asker;s.asker=id;s.target='';break;
 case 'accuse':s.remaining=Math.max(0,s.deadline-now);s.accusedBy.push(id);s.firstAccusers[a.target as string]??=id;startVote(s,a.target as string,id,false,0,now);break;
 case 'vote':s.vote!.ballots[id]=a.yes as boolean;if(Object.keys(s.vote!.ballots).length===s.players.length-1)settleVote(s,now);break;
 case 'guess-start':s.phase='guess';s.guessOrder=[id,...s.players.filter(p=>p!==id&&s.secrets[p].spy)];s.deadline=now+45000;break;
 case 'guess':s.guesses[id]=a.location as string;if(Object.keys(s.guesses).length===s.guessOrder.length)settleGuesses(s);else s.deadline=now+45000;break;
 case 'next':begin(s);break;
}return s;}
export function spyView(s:SpyState,id:string){const revealed=s.phase==='result',loc=spyLocations.find(l=>l.id===s.location),secret=s.secrets[id];return {
 phase:s.phase,round:s.round,settings:s.settings,players:s.players,scores:s.scores,serverNow:Date.now(),deadline:s.deadline,remaining:s.remaining,
 myRole:secret??null,location:revealed||secret&&!secret.spy?loc?.name??null:null,scenario:revealed||secret&&!secret.spy?s.scenario:null,
 locations:spyLocations.filter(l=>s.settings.packs.includes(l.pack)).map(({id,name,pack})=>({id,name,pack})),
 seen:s.seen,asker:s.asker,previous:s.previous,target:s.target,canAccuse:!s.accusedBy.includes(id),
 vote:s.vote?{target:s.vote.target,by:s.vote.by,final:s.vote.final,index:s.vote.index,voted:Object.keys(s.vote.ballots),myVote:s.vote.ballots[id]??null,required:s.players.length-s.settings.spies}:null,
 guessTurn:s.phase==='guess'?s.guessOrder.find(p=>!Object.hasOwn(s.guesses,p))??null:null,
 publicGuesses:s.phase==='guess'?Object.entries(s.guesses).map(([player,location])=>({player,location:spyLocations.find(l=>l.id===location)?.name??'หมดเวลาทาย'})):[],
 revealed:revealed?s.secrets:null,reason:s.reason,winner:s.winner,awards:s.awards,
};}
export type SpyView=ReturnType<typeof spyView>;
export const spyfall=defineGame({id:'spyfall',name:'Spyfall · จับสายลับ',description:'ทุกคนรู้ว่าอยู่ที่ไหน ยกเว้นสายลับ ถามให้เนียน จับพิรุธให้ทัน',minPlayers:3,maxPlayers:12,status:'available',screen:'spyfall',color:'orange',icon:'ScanEye',category:'ปาร์ตี้ · จับพิรุธ',createInitialState:initial,validateAction:validate,updateState:update,isFinished:(s:SpyState)=>s.phase==='result'&&(s.round>=s.settings.rounds||s.winner==='cancelled'),getPlayerView:spyView});
