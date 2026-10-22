import {defineGame} from './types';
import type {GameContext} from './types';
import {CAPACITY,golemById,golems,merchantById,merchants,parseCrystals,startCards,type Crystals} from './market-content';

type Slot={id:string;bonus:Crystals};
export interface MarketState {
 phase:'play'|'over';players:string[];turn:number;round:number;target:number;ending:boolean;
 caravans:Record<string,Crystals>;hands:Record<string,string[]>;played:Record<string,string[]>;
 market:Slot[];deck:string[];golems:string[];golemDeck:string[];
 taken:Record<string,string[]>;coins:Record<string,{gold:number;silver:number}>;bonusLeft:{gold:number;silver:number};
 last:{by:string;kind:'play'|'buy'|'rest'|'claim';n:number}|null;cancelled:boolean;winner:string|null;
}
type Action={type:string;[key:string]:unknown};
const MARKET_SIZE=6,GOLEM_ROW=5,GOLD=3,SILVER=1;

function randomInt(max:number){const limit=Math.floor(4294967296/max)*max;let n:number;do{n=crypto.getRandomValues(new Uint32Array(1))[0];}while(n>=limit);return n%max;}
function shuffle<T>(items:T[]):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const empty=():Crystals=>[0,0,0,0];
const total=(c:Crystals)=>c[0]+c[1]+c[2]+c[3];
const covers=(have:Crystals,need:Crystals)=>have.every((n,i)=>n>=need[i]);
const sub=(have:Crystals,need:Crystals):Crystals=>have.map((n,i)=>n-need[i]) as Crystals;
const add=(a:Crystals,b:Crystals):Crystals=>a.map((n,i)=>n+b[i]) as Crystals;
/** A caravan holds at most CAPACITY crystals; extras are dropped starting from the cheapest colour. */
function trim(c:Crystals):Crystals{const r=[...c] as Crystals;let over=total(r)-CAPACITY;for(let i=0;i<4&&over>0;i++){const cut=Math.min(r[i],over);r[i]-=cut;over-=cut;}return r;}
const isInt=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;

export function marketScore(s:MarketState,id:string){
 const pts=s.taken[id].reduce((t,g)=>t+golemById[g].points,0),c=s.coins[id],car=s.caravans[id];
 return pts+c.gold*GOLD+c.silver*SILVER+car[1]+car[2]+car[3];
}
function initial(ctx:GameContext):MarketState{
 const players=shuffle(ctx.playerIds),n=players.length;
 const deck=shuffle(merchants.map(m=>m.id)),golemDeck=shuffle(golems.map(g=>g.id));
 const market:Slot[]=deck.splice(0,MARKET_SIZE).map(id=>({id,bonus:empty()}));
 return {phase:'play',players,turn:0,round:1,target:n>=4?5:6,ending:false,
  caravans:Object.fromEntries(players.map((id,i)=>[id,parseCrystals(i===0?'yyy':'yyyy')])),
  hands:Object.fromEntries(players.map(id=>[id,startCards.map(c=>c.id)])),played:Object.fromEntries(players.map(id=>[id,[]])),
  market,deck,golems:golemDeck.splice(0,GOLEM_ROW),golemDeck,
  taken:Object.fromEntries(players.map(id=>[id,[]])),coins:Object.fromEntries(players.map(id=>[id,{gold:0,silver:0}])),
  bonusLeft:{gold:n*2,silver:n*2},last:null,cancelled:false,winner:null};
}
/** Apply a played card to a caravan. Returns the new caravan, or null when the action is not legal. */
function tryPlay(car:Crystals,card:string,a:Action):Crystals|null{
 const def=merchantById[card];if(!def)return null;
 if(def.kind==='gain')return trim(add(car,def.gain));
 if(def.kind==='trade'){
  if(!isInt(a.times,1,10))return null;let c=car;
  for(let i=0;i<a.times;i++){if(!covers(c,def.pay))return null;c=add(sub(c,def.pay),def.gain);}
  return trim(c);
 }
 if(!Array.isArray(a.upgrades)||a.upgrades.length<1||a.upgrades.length>def.up)return null;
 const c=[...car] as Crystals;
 for(const from of a.upgrades){if(!isInt(from,0,2)||c[from]<1)return null;c[from]--;c[from+1]++;}
 return c;
}
function tryBuy(s:MarketState,id:string,a:Action):Crystals|null{
 if(!isInt(a.index,0,s.market.length-1)||!Array.isArray(a.drop)||a.drop.length!==a.index)return null;
 const c=[...s.caravans[id]] as Crystals;
 for(const d of a.drop){if(!isInt(d,0,3)||c[d]<1)return null;c[d]--;}
 return c;
}
function validate(s:MarketState,a:unknown,id:string):boolean{
 if(!a||typeof a!=='object'||s.phase!=='play'||s.players[s.turn]!==id)return false;
 const action=a as Action;
 switch(action.type){
  case 'play':return typeof action.card==='string'&&s.hands[id].includes(action.card)&&tryPlay(s.caravans[id],action.card,action)!==null;
  case 'buy':return tryBuy(s,id,action)!==null;
  case 'rest':return s.played[id].length>0;
  case 'claim':return isInt(action.index,0,s.golems.length-1)&&covers(s.caravans[id],golemById[s.golems[action.index as number]].req);
  default:return false;
 }
}
function endTurn(s:MarketState){
 s.turn=(s.turn+1)%s.players.length;
 if(s.turn===0){
  if(s.ending){finish(s);return;}
  s.round++;
 }
}
function finish(s:MarketState){
 s.phase='over';
 let best='',bestScore=-1;
 s.players.forEach(id=>{const sc=marketScore(s,id);if(sc>=bestScore){best=id;bestScore=sc;}}); // ties go to the later seat
 s.winner=best;
}
function update(s:MarketState,a:Action,id:string):MarketState{
 switch(a.type){
  case 'play':{
   const card=a.card as string;s.caravans[id]=tryPlay(s.caravans[id],card,a)!;
   s.hands[id].splice(s.hands[id].indexOf(card),1);s.played[id].push(card);
   s.last={by:id,kind:'play',n:merchantById[card].kind==='trade'?(a.times as number):1};break;
  }
  case 'buy':{
   const index=a.index as number,drop=a.drop as number[];
   s.caravans[id]=tryBuy(s,id,a)!;
   drop.forEach((color,i)=>{s.market[i].bonus[color]++;});
   const [slot]=s.market.splice(index,1);
   s.hands[id].push(slot.id);s.caravans[id]=trim(add(s.caravans[id],slot.bonus));
   const next=s.deck.shift();if(next)s.market.push({id:next,bonus:empty()});
   s.last={by:id,kind:'buy',n:index};break;
  }
  case 'rest':
   s.hands[id].push(...s.played[id]);s.played[id]=[];s.last={by:id,kind:'rest',n:0};break;
  case 'claim':{
   const index=a.index as number,gid=s.golems[index];
   s.caravans[id]=sub(s.caravans[id],golemById[gid].req);s.taken[id].push(gid);
   if(index===0&&s.bonusLeft.gold>0){s.bonusLeft.gold--;s.coins[id].gold++;}
   else if(index===1&&s.bonusLeft.silver>0){s.bonusLeft.silver--;s.coins[id].silver++;}
   s.golems.splice(index,1);const next=s.golemDeck.shift();if(next)s.golems.push(next);
   if(s.taken[id].length>=s.target)s.ending=true;
   s.last={by:id,kind:'claim',n:index};break;
  }
 }
 // The game also ends when nothing is left to claim, so it can never stall.
 if(!s.golems.length)s.ending=true;
 endTurn(s);
 return s;
}
export function tickMarket(s:MarketState,ctx:GameContext):MarketState{
 if(s.phase==='play'&&s.players.some(id=>!ctx.playerIds.includes(id))){s.phase='over';s.cancelled=true;}
 return s;
}
export function marketView(s:MarketState,id:string){
 return {
  phase:s.phase,players:s.players,turn:s.turn,round:s.round,target:s.target,ending:s.ending,cancelled:s.cancelled,winner:s.winner,
  hand:s.hands[id]??[],handCounts:Object.fromEntries(s.players.map(p=>[p,s.hands[p].length])),
  played:s.played,caravans:s.caravans,market:s.market,golems:s.golems,deckCount:s.deck.length,golemDeckCount:s.golemDeck.length,
  taken:s.taken,coins:s.coins,bonusLeft:s.bonusLeft,scores:Object.fromEntries(s.players.map(p=>[p,marketScore(s,p)])),last:s.last,
 };
}
export type MarketView=ReturnType<typeof marketView>;
export const crystalMarket=defineGame({
 id:'crystal-market',name:'ตลาดคริสตัล',description:'สะสมคริสตัล แลกเปลี่ยน อัปเกรด แล้วส่งมอบให้ครบก่อนใคร',minPlayers:2,maxPlayers:5,
 status:'available',screen:'crystal-market',color:'lime',icon:'Gem',category:'วางแผน · สะสมทรัพยากร',private:true,
 createInitialState:initial,validateAction:validate,updateState:update,isFinished:(s:MarketState)=>s.phase==='over',getPlayerView:marketView,
});
