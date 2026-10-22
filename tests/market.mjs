import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.resolve('wrangler/package.json'));
const {build}=require('esbuild');
await build({entryPoints:['lib/games/market.ts'],bundle:true,format:'esm',platform:'node',outfile:'.sites-runtime/market-test.mjs'});
await build({entryPoints:['lib/games/market-content.ts'],bundle:true,format:'esm',platform:'node',outfile:'.sites-runtime/market-content-test.mjs'});
const {crystalMarket:g,tickMarket}=await import('../.sites-runtime/market-test.mjs');
const {merchants,golems,merchantById,golemById,CAPACITY}=await import('../.sites-runtime/market-content-test.mjs');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;console.log(`✓ ${m}`);};
const ctxOf=n=>({playerIds:Array.from({length:n},(_,i)=>`p${i}`),hostId:'p0'});
const run=(s,a,id,c)=>{assert.ok(g.validateAction(s,a,id,c),`Action ${a.type} from ${id}`);return g.updateState(s,a,id,c);};
const cardWith=(kind,pred=()=>true)=>merchants.find(m=>m.kind===kind&&pred(m)).id;
const give=(s,id,card)=>{s.hands[id].push(card);return card;};

// content
ok(merchants.length===30&&new Set(merchants.map(m=>m.id)).size===30,'Merchant deck has 30 unique cards');
ok(golems.length===32&&golems.every(x=>x.req.reduce((a,b)=>a+b,0)>=4&&x.req.reduce((a,b)=>a+b,0)<=10&&x.points>0),'32 golem contracts are payable within the caravan limit');
ok(merchants.filter(m=>m.kind==='trade').every(m=>m.pay.some(n=>n>0)&&m.gain.some(n=>n>0)),'Every trade card pays and gains crystals');

// setup
for(const [n,target] of [[2,6],[3,6],[4,5],[5,5]]){
 const c=ctxOf(n),s=g.createInitialState(c);
 ok(s.players.length===n&&new Set(s.players).size===n&&s.target===target&&s.market.length===6&&s.golems.length===5,`${n} players: target ${target} golems, 6 merchant cards, 5 golem contracts`);
}
const c3=ctxOf(3);let s=g.createInitialState(c3);
ok(s.caravans[s.players[0]].join()==='3,0,0,0'&&s.caravans[s.players[1]].join()==='4,0,0,0','First seat starts with 3 yellow, others with 4');
ok(s.players.every(id=>s.hands[id].length===2&&s.played[id].length===0),'Everyone starts with the same two starter cards');
const [a,b,c]=s.players;
ok(!g.validateAction(s,{type:'play',card:'s-gain'},b,c3),'Only the current player may act');
ok(!g.validateAction(s,{type:'rest'},a,c3),'Resting with nothing played is rejected');
ok(!g.validateAction(s,{type:'play',card:'m01'},a,c3)&&!g.validateAction(s,{type:'play',card:'s-gain',x:1,extra:1},'nobody',c3),'Cards not in hand and unknown players are rejected');

// play: gain, turn order, caps
run(s,{type:'play',card:'s-gain'},a,c3);
ok(s.caravans[a].join()==='5,0,0,0'&&s.played[a].join()==='s-gain'&&!s.hands[a].includes('s-gain')&&s.players[s.turn]===b,'Gain card adds crystals, moves to played pile and passes the turn');
s=g.createInitialState(c3);const p0=s.players[0];s.caravans[p0]=[9,0,0,0];
run(s,{type:'play',card:'s-gain'},p0,c3);ok(s.caravans[p0].reduce((x,y)=>x+y,0)===CAPACITY,'Caravan never holds more than 10 crystals');
s=g.createInitialState(c3);s.caravans[s.players[0]]=[3,3,4,0];const bgain=merchants.find(m=>m.kind==='gain'&&m.gain[0]===0&&m.gain[1]===0&&m.gain[2]>0).id;
give(s,s.players[0],bgain);run(s,{type:'play',card:bgain},s.players[0],c3);ok(s.caravans[s.players[0]].reduce((x,y)=>x+y,0)===10&&s.caravans[s.players[0]][0]<3,'Overflow discards the cheapest crystals first');

// trade
s=g.createInitialState(c3);const t=cardWith('trade',m=>m.pay.join()==='2,0,0,0'&&m.gain.join()==='1,1,0,0');give(s,s.players[0],t);s.caravans[s.players[0]]=[4,0,0,0];
ok(!g.validateAction(s,{type:'play',card:t,times:5},s.players[0],c3),'Trade cannot be repeated beyond available crystals');
ok(!g.validateAction(s,{type:'play',card:t},s.players[0],c3)&&!g.validateAction(s,{type:'play',card:t,times:0},s.players[0],c3)&&!g.validateAction(s,{type:'play',card:t,times:1.5},s.players[0],c3),'Trade requires a whole number of times');
run(s,{type:'play',card:t,times:2},s.players[0],c3);ok(s.caravans[s.players[0]].join()==='2,2,0,0','Trade repeated twice pays and gains twice');

// upgrade
s=g.createInitialState(c3);const p=s.players[0];s.caravans[p]=[2,1,0,0];
ok(!g.validateAction(s,{type:'play',card:'s-up',upgrades:[3]},p,c3)&&!g.validateAction(s,{type:'play',card:'s-up',upgrades:[0,0,0]},p,c3)&&!g.validateAction(s,{type:'play',card:'s-up',upgrades:[]},p,c3),'Upgrade rejects pink, too many steps and empty lists');
ok(!g.validateAction(s,{type:'play',card:'s-up',upgrades:[2]},p,c3),'Upgrade needs a crystal of that colour');
run(s,{type:'play',card:'s-up',upgrades:[0,1]},p,c3);ok(s.caravans[p].join()==='1,1,1,0','Upgrade moves each chosen crystal one step up');

// buy
s=g.createInitialState(c3);const q=s.players[0];s.caravans[q]=[5,0,0,0];const second=s.market[2].id,first=s.market[0].id;
ok(!g.validateAction(s,{type:'buy',index:2,drop:[0]},q,c3)&&!g.validateAction(s,{type:'buy',index:2,drop:[0,1]},q,c3)&&!g.validateAction(s,{type:'buy',index:9,drop:[]},q,c3),'Buying needs one crystal for each card before it, from the caravan');
run(s,{type:'buy',index:2,drop:[0,0]},q,c3);
ok(s.hands[q].includes(second)&&s.caravans[q][0]===3&&s.market[0].bonus[0]===1&&s.market[1].bonus[0]===1&&s.market.length===6&&s.market[0].id===first,'Buying places crystals on earlier cards, refills the row and keeps order');
const turnAfter=s.players[s.turn];s.caravans[turnAfter]=[1,0,0,0];
const before=s.market[0].id;run(s,{type:'buy',index:0,drop:[]},turnAfter,c3);ok(s.caravans[turnAfter][0]===2&&s.hands[turnAfter].includes(before),'A later buyer collects the crystals left on the card');

// rest
s=g.createInitialState(c3);const r0=s.players[0],r1=s.players[1];run(s,{type:'play',card:'s-gain'},r0,c3);
ok(!g.validateAction(s,{type:'rest'},r1,c3),'Resting without played cards is rejected');
run(s,{type:'play',card:'s-gain'},r1,c3);run(s,{type:'play',card:'s-gain'},s.players[2],c3);
run(s,{type:'rest'},r0,c3);ok(s.hands[r0].length===2&&s.played[r0].length===0,'Rest returns every played card to hand');

// claim, coins and refill
s=g.createInitialState(c3);const k=s.players[0],gid0=s.golems[0],gid1=s.golems[1],deckBefore=s.golemDeck.length;
s.caravans[k]=[...golemById[gid0].req];
ok(!g.validateAction(s,{type:'claim',index:1},k,c3)||g.validateAction(s,{type:'claim',index:1},k,c3)===golemById[gid1].req.every((n,i)=>s.caravans[k][i]>=n),'Claiming requires every crystal of the contract');
run(s,{type:'claim',index:0},k,c3);
ok(s.caravans[k].join()==='0,0,0,0'&&s.taken[k].join()===gid0&&s.coins[k].gold===1&&s.golems.length===5&&s.golemDeck.length===deckBefore-1&&s.bonusLeft.gold===5,'Claim pays exactly, earns the gold bonus from the first slot and refills the row');
const k2=s.players[1];s.caravans[k2]=[...golemById[s.golems[1]].req];const second1=s.golems[1];run(s,{type:'claim',index:1},k2,c3);
ok(s.coins[k2].silver===1&&s.taken[k2][0]===second1,'Second slot earns the silver bonus');
const k3=s.players[2];s.caravans[k3]=[...golemById[s.golems[3]].req];run(s,{type:'claim',index:3},k3,c3);ok(s.coins[k3].gold===0&&s.coins[k3].silver===0,'Other slots earn no bonus coin');

// scoring: points + coins + non-yellow crystals
s=g.createInitialState(c3);const z=s.players[0];s.taken[z]=[s.golems[0]];s.coins[z]={gold:1,silver:2};s.caravans[z]=[5,1,1,1];
ok(g.getPlayerView(s,z,c3).scores[z]===golemById[s.golems[0]].points+3+2+3,'Score = contract points + 3 per gold + 1 per silver + non-yellow crystals');

// game end: finish the round, then highest score, ties to the later seat
s=g.createInitialState(ctxOf(4));const order=s.players;s.target=1;
s.caravans[order[1]]=[...golemById[s.golems[0]].req];
run(s,{type:'play',card:'s-gain'},order[0],ctxOf(4));
run(s,{type:'claim',index:0},order[1],ctxOf(4));
ok(s.ending&&s.phase==='play','Reaching the golem target starts the final round without ending at once');
run(s,{type:'play',card:'s-gain'},order[2],ctxOf(4));ok(s.phase==='play','Players after the finisher still take their turn');
run(s,{type:'play',card:'s-gain'},order[3],ctxOf(4));
ok(s.phase==='over'&&g.isFinished(s)&&s.winner===order[1],'Game ends after the last seat and the best score wins');
ok(!g.validateAction(s,{type:'play',card:'s-gain'},order[0],ctxOf(4)),'No actions are accepted after the game ends');
s=g.createInitialState(ctxOf(2));s.target=1;const [e0,e1]=s.players;s.caravans[e0]=[0,0,0,0];s.caravans[e1]=[0,0,0,0];s.ending=true;
run(s,{type:'play',card:'s-gain'},e0,ctxOf(2));run(s,{type:'play',card:'s-gain'},e1,ctxOf(2));
ok(s.phase==='over'&&s.winner===e1,'Equal scores go to the later seat');

// privacy
s=g.createInitialState(c3);const view=g.getPlayerView(s,s.players[0],c3),text=JSON.stringify(view);
ok(view.hand.length===2&&Object.values(view.handCounts).every(n=>n===2)&&!('deck' in view)&&!('golemDeck' in view)&&!('hands' in view),'View exposes your hand, other hands only as counts, and no deck order');
ok(!text.includes(s.deck[0])&&!text.includes(s.golemDeck[0]),'Undrawn card ids never appear in a player view');

// leaving cancels
s=g.createInitialState(c3);tickMarket(s,{playerIds:s.players.slice(1),hostId:s.players[1]});
ok(s.phase==='over'&&s.cancelled&&g.isFinished(s),'A player leaving ends the match as cancelled');

// stall check: simulate many random legal games to confirm they always finish
function randomGame(n){const c=ctxOf(n);let st=g.createInitialState(c);let steps=0;
 while(st.phase==='play'&&steps++<8000){const id=st.players[st.turn];const options=[];
  for(const card of st.hands[id]){const def=merchantById[card];if(def.kind==='gain')options.push({type:'play',card});else if(def.kind==='trade'){for(let t=1;t<=3;t++)options.push({type:'play',card,times:t});}else options.push({type:'play',card,upgrades:[0]},{type:'play',card,upgrades:[1]},{type:'play',card,upgrades:[0,0]},{type:'play',card,upgrades:[1,1]});}
  options.push({type:'rest'});st.market.forEach((_,i)=>options.push({type:'buy',index:i,drop:Array(i).fill(0)}));st.golems.forEach((_,i)=>options.push({type:'claim',index:i}));
  const legal=options.filter(o=>g.validateAction(st,o,id,c));assert.ok(legal.length>0,'a legal action always exists');
  const claims=legal.filter(o=>o.type==='claim');const pick=claims.length?claims[0]:legal[Math.floor(Math.random()*legal.length)];st=g.updateState(st,pick,id,c);}
 return st;}
let finished=0;for(let i=0;i<60;i++){const st=randomGame(2+i%4);if(st.phase==='over'){finished++;}}
ok(finished===60,'60 random legal games (2-5 players) always reach an ending with a legal move available every turn');
console.log(`PASS ${checks} Crystal Market rule and privacy checks`);
