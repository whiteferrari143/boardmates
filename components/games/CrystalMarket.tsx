'use client';
import {useMemo,useState} from 'react';
import {ArrowRight,BookOpen,Coins,Crown,Gem,RotateCcw,ShoppingBag,Trophy,Users,X} from 'lucide-react';
import type {GameScreenProps} from './types';
import type {MarketView} from '@/lib/games/market';
import {CAPACITY,CRYSTAL_NAMES,golemById,merchantById,type Crystals,type Merchant} from '@/lib/games/market-content';

const COLORS=[0,1,2,3] as const;
const sum=(c:Crystals)=>c[0]+c[1]+c[2]+c[3];
const covers=(have:Crystals,need:Crystals)=>have.every((n,i)=>n>=need[i]);
function maxTrades(car:Crystals,def:Merchant){let c=car,n=0;while(n<10&&covers(c,def.pay)){c=c.map((x,i)=>x-def.pay[i]+def.gain[i]) as Crystals;n++;}return n;}
function applyUps(car:Crystals,ups:number[]):Crystals|null{const c=[...car] as Crystals;for(const from of ups){if(c[from]<1)return null;c[from]--;c[from+1]++;}return c;}

function GemIcon({color,size=17}:{color:number;size?:number}){
 return <span className={`mk-gem mk-gem-${color}`} role="img" aria-label={`คริสตัล${CRYSTAL_NAMES[color]}`} title={CRYSTAL_NAMES[color]}><Gem size={size} strokeWidth={2}/></span>;
}
function Run({c,size}:{c:Crystals;size?:number}){
 if(!sum(c))return <span className="mk-none">ไม่มี</span>;
 return <span className="mk-run">{COLORS.flatMap(i=>Array.from({length:c[i]},(_,k)=><GemIcon key={`${i}-${k}`} color={i} size={size}/>))}</span>;
}
function CardFace({def}:{def:Merchant}){
 if(def.kind==='gain')return <div className="mk-face"><span className="mk-kind">รับ</span><Run c={def.gain}/></div>;
 if(def.kind==='trade')return <div className="mk-face"><span className="mk-kind">แลก</span><Run c={def.pay}/><ArrowRight size={16} aria-label="เป็น"/><Run c={def.gain}/></div>;
 return <div className="mk-face"><span className="mk-kind">อัปเกรด</span><span>สูงสุด {def.up} ขั้น</span><span className="mk-chain" aria-hidden="true"><GemIcon color={0} size={14}/><ArrowRight size={12}/><GemIcon color={1} size={14}/><ArrowRight size={12}/><GemIcon color={2} size={14}/><ArrowRight size={12}/><GemIcon color={3} size={14}/></span></div>;
}
function Picker({label,have,chosen,limit,onPick,max=3}:{label:string;have:Crystals;chosen:number[];limit:number;onPick:(color:number)=>void;max?:number}){
 return <div className="mk-picker"><span>{label}</span><div className="mk-picker-row">{COLORS.filter(i=>i<=max).map(i=>{const left=have[i]-chosen.filter(c=>c===i).length;return <button type="button" key={i} className="mk-pick" disabled={left<1||chosen.length>=limit} onClick={()=>onPick(i)} aria-label={`เลือกคริสตัล${CRYSTAL_NAMES[i]}`}><GemIcon color={i}/>{CRYSTAL_NAMES[i]} <b>{left}</b></button>;})}</div></div>;
}

/** Re-mounts the board each turn so half-finished selections never carry over. */
export function CrystalMarket(props:GameScreenProps){
 const v=props.room.gameView as MarketView;
 return <Board key={`${v.round}-${v.turn}-${v.phase}`} {...props}/>;
}
function Board({room,playerId,isHost,busy,onAction,onReset}:GameScreenProps){
 const v=room.gameView as MarketView;
 const names=useMemo(()=>Object.fromEntries(room.members.map(m=>[m.id,m.name])),[room.members]);
 const nameOf=(id:string)=>names[id]??'ผู้เล่น';
 const current=v.players[v.turn],myTurn=v.phase==='play'&&current===playerId,mine=v.caravans[playerId]??[0,0,0,0] as Crystals;
 const [card,setCard]=useState<{id:string;times:number;ups:number[]}|null>(null);
 const [buy,setBuy]=useState<{index:number;drop:number[]}|null>(null);
 const [rules,setRules]=useState(false);
 const act=(a:unknown)=>{setCard(null);setBuy(null);onAction(a);};
 const def=card?merchantById[card.id]:null;
 const tradeMax=def&&def.kind==='trade'?maxTrades(mine,def):0;
 const upsResult=def&&def.kind==='up'&&card?applyUps(mine,card.ups):null;
 const last=v.last,lastText=last?`${nameOf(last.by)} ${last.kind==='play'?'เล่นการ์ด':last.kind==='buy'?`ซื้อการ์ดช่องที่ ${last.n+1}`:last.kind==='rest'?'พักและเก็บการ์ดคืนมือ':'ส่งมอบโกเลม'}`:'';
 const ranking=[...v.players].sort((a,b)=>v.scores[b]-v.scores[a]||v.players.indexOf(b)-v.players.indexOf(a));
 return <section className="mk" aria-label="ตลาดคริสตัล">
  <header className="mk-head">
   <div><span className="eyebrow">CRYSTAL MARKET</span><h2>ตลาดคริสตัล</h2></div>
   <div className="mk-meta"><span className="count-tag">รอบที่ {v.round}</span><span className="count-tag">ส่งมอบให้ครบ {v.target} ใบ</span></div>
  </header>
  {v.phase==='play'&&<div className={`mk-turn ${myTurn?'mine':''}`} role="status">
   {myTurn?<><b>ถึงตาคุณ</b><span>เลือกทำ 1 อย่าง: เล่นการ์ด · ซื้อการ์ด · พัก · ส่งมอบโกเลม</span></>:<><b>รอ {nameOf(current)}</b><span>กำลังเลือกการกระทำ</span></>}
   {v.ending&&<em>รอบสุดท้าย! เกมจบเมื่อทุกคนเล่นครบตา</em>}
   {lastText&&<small>ล่าสุด: {lastText}</small>}
  </div>}
  {v.phase==='over'&&<div className="mk-result">
   <Trophy size={40}/><h3>{v.cancelled?'เกมจบลง เพราะมีผู้เล่นออกจากห้อง':`${nameOf(v.winner??'')} ชนะ!`}</h3>
   <ol>{ranking.map((id,i)=><li key={id} className={id===v.winner&&!v.cancelled?'win':''}><span>{i+1}</span><strong>{nameOf(id)}</strong><span>{v.scores[id]} คะแนน</span><small>โกเลม {v.taken[id].length} · เหรียญทอง {v.coins[id].gold} · เหรียญเงิน {v.coins[id].silver}</small></li>)}</ol>
   {isHost?<button className="primary" disabled={busy} onClick={onReset}><RotateCcw size={18}/>กลับห้องรอ</button>:<p className="muted">รอเจ้าของห้องกลับไปยังห้องรอ</p>}
  </div>}
  <details className="mk-rules" open={rules} onToggle={e=>setRules((e.currentTarget as HTMLDetailsElement).open)}><summary><BookOpen size={16}/>กติกาย่อ</summary><ul>
   <li>ตาของคุณทำได้ 1 อย่าง: <b>เล่นการ์ด</b> จากมือ, <b>ซื้อการ์ด</b>จากตลาด, <b>พัก</b>เพื่อเก็บการ์ดที่เล่นแล้วกลับมือ หรือ <b>ส่งมอบโกเลม</b></li>
   <li>คริสตัลมี 4 สี เรียงจากต่ำไปสูง: เหลือง เขียว ฟ้า ชมพู คาราวานเก็บได้สูงสุด {CAPACITY} ก้อน ส่วนที่เกินจะถูกทิ้ง โดยทิ้งสีต่ำก่อน</li>
   <li>ซื้อการ์ดช่องที่ n ต้องวางคริสตัลช่องละ 1 ก้อนบนการ์ดช่องก่อนหน้า ผู้ซื้อการ์ดจะได้คริสตัลที่วางอยู่บนการ์ดใบนั้นไปด้วย</li>
   <li>โกเลมช่องแรกได้เหรียญทอง (+3) ช่องที่สองได้เหรียญเงิน (+1) ตราบที่เหรียญยังไม่หมด</li>
   <li>เมื่อมีคนส่งมอบโกเลมครบ {v.target} ใบ จะเล่นต่อจนครบรอบนั้น แล้วนับคะแนน = แต้มโกเลม + เหรียญ + คริสตัลที่ไม่ใช่สีเหลือง ถ้าเสมอ คนที่เล่นทีหลังชนะ</li>
  </ul></details>
  <div className="mk-players">{v.players.map((id,i)=><article key={id} className={`mk-player ${id===current&&v.phase==='play'?'turn':''} ${id===playerId?'self':''}`}>
   <div className="mk-player-top"><span className={`avatar small avatar-${i%4}`} aria-hidden="true">{Array.from(nameOf(id))[0]}</span><strong>{nameOf(id)}{id===playerId?' (คุณ)':''}</strong>{i===0&&<Crown size={15} aria-label="ผู้เล่นคนแรก"/>}</div>
   <div className="mk-score">{v.scores[id]}<small> คะแนน</small></div>
   <div className="mk-stats"><span>โกเลม {v.taken[id].length}/{v.target}</span><span><Coins size={13}/>{v.coins[id].gold}/{v.coins[id].silver}</span><span>การ์ดในมือ {v.handCounts[id]}</span><span>เล่นแล้ว {v.played[id].length}</span></div>
   <Run c={v.caravans[id]} size={14}/>
  </article>)}</div>
  <div className="mk-block"><div className="mk-block-head"><h3>สัญญาโกเลม</h3><span className="muted">เหรียญเหลือ ทอง {v.bonusLeft.gold} · เงิน {v.bonusLeft.silver} · กองจั่ว {v.golemDeckCount}</span></div>
   <div className="mk-row">{v.golems.map((gid,i)=>{const g=golemById[gid],can=myTurn&&covers(mine,g.req);return <article className="mk-golem" key={gid}>
    {i<2&&<span className={`mk-coin ${i===0?'gold':'silver'}`}>{i===0?'+3 ทอง':'+1 เงิน'}</span>}
    <div className="mk-pts">{g.points}<small> แต้ม</small></div><Run c={g.req}/>
    <button className="primary" disabled={busy||!can} onClick={()=>act({type:'claim',index:i})}>ส่งมอบ</button>
   </article>;})}</div></div>
  <div className="mk-block"><div className="mk-block-head"><h3>ตลาดการ์ดพ่อค้า</h3><span className="muted">กองจั่ว {v.deckCount}</span></div>
   <div className="mk-row">{v.market.map((slot,i)=>{const d=merchantById[slot.id];return <article className="mk-merchant" key={slot.id}>
    <span className="mk-slot">ช่อง {i+1}</span><CardFace def={d}/>
    {sum(slot.bonus)>0&&<div className="mk-bonus"><span>โบนัส</span><Run c={slot.bonus} size={14}/></div>}
    <button className="secondary" disabled={busy||!myTurn||sum(mine)<i} onClick={()=>i===0?act({type:'buy',index:0,drop:[]}):setBuy({index:i,drop:[]})}><ShoppingBag size={16}/>{i===0?'รับฟรี':`ซื้อ (วาง ${i})`}</button>
   </article>;})}</div>
   {buy&&<div className="mk-compose"><Picker label={`เลือกคริสตัล ${buy.index} ก้อนไปวางบนการ์ดช่อง 1–${buy.index} (ตามลำดับ)`} have={mine} chosen={buy.drop} limit={buy.index} max={3} onPick={c=>setBuy({...buy,drop:[...buy.drop,c]})}/>
    <div className="mk-chosen">{buy.drop.map((c,k)=><span key={k}>ช่อง {k+1}: <GemIcon color={c}/></span>)}</div>
    <div className="mk-actions"><button className="primary" disabled={busy||buy.drop.length!==buy.index} onClick={()=>act({type:'buy',index:buy.index,drop:buy.drop})}>ยืนยันซื้อการ์ดช่อง {buy.index+1}</button><button className="ghost" onClick={()=>setBuy(null)}><X size={16}/>ยกเลิก</button></div></div>}
  </div>
  {v.phase==='play'&&<div className="mk-block mk-mine"><div className="mk-block-head"><h3>ของคุณ</h3><span className="muted">คาราวาน {sum(mine)}/{CAPACITY}</span></div>
   <div className="mk-caravan"><Run c={mine} size={20}/></div>
   <h4>การ์ดในมือ ({v.hand.length})</h4>
   <div className="mk-row">{v.hand.map(id=>{const d=merchantById[id];return <article className={`mk-merchant ${card?.id===id?'picked':''}`} key={id}><CardFace def={d}/>
    <button className="secondary" disabled={busy||!myTurn} onClick={()=>d.kind==='gain'?act({type:'play',card:id}):setCard({id,times:1,ups:[]})}>เล่นการ์ด</button></article>;})}
    {!v.hand.length&&<p className="muted">ไม่มีการ์ดในมือ ลองพักเพื่อเก็บการ์ดกลับมา</p>}</div>
   {def&&card&&<div className="mk-compose">
    {def.kind==='trade'&&<><div className="mk-face"><span className="mk-kind">แลก</span><Run c={def.pay}/><ArrowRight size={16}/><Run c={def.gain}/></div>
     {tradeMax<1?<p className="muted">คริสตัลไม่พอสำหรับการแลกนี้</p>:<label className="mk-times">แลกกี่ครั้ง <input type="number" min={1} max={tradeMax} value={Math.min(card.times,tradeMax)} onChange={e=>setCard({...card,times:Math.max(1,Math.min(tradeMax,Math.floor(Number(e.target.value))||1))})}/> <small>(สูงสุด {tradeMax})</small></label>}
     <div className="mk-actions"><button className="primary" disabled={busy||tradeMax<1} onClick={()=>act({type:'play',card:card.id,times:Math.min(card.times,tradeMax)})}>ยืนยันแลก</button><button className="ghost" onClick={()=>setCard(null)}><X size={16}/>ยกเลิก</button></div></>}
    {def.kind==='up'&&<><Picker label={`เลือกคริสตัลที่จะอัปเกรดขึ้นหนึ่งสี (สูงสุด ${def.up} ขั้น)`} have={upsResult??mine} chosen={[]} limit={card.ups.length>=def.up?0:1} max={2} onPick={c=>setCard({...card,ups:[...card.ups,c]})}/>
     <div className="mk-chosen">{card.ups.map((c,k)=><span key={k}><GemIcon color={c}/><ArrowRight size={12}/><GemIcon color={c+1}/></span>)}</div>
     <div className="mk-actions"><button className="primary" disabled={busy||!card.ups.length} onClick={()=>act({type:'play',card:card.id,upgrades:card.ups})}>ยืนยันอัปเกรด</button><button className="ghost" onClick={()=>setCard({...card,ups:card.ups.slice(0,-1)})} disabled={!card.ups.length}>ย้อนล่าสุด</button><button className="ghost" onClick={()=>setCard(null)}><X size={16}/>ยกเลิก</button></div></>}
   </div>}
   <h4>การ์ดที่เล่นแล้ว ({v.played[playerId]?.length??0})</h4>
   <div className="mk-row mk-played">{(v.played[playerId]??[]).map(id=><article className="mk-merchant dim" key={id}><CardFace def={merchantById[id]}/></article>)}</div>
   <div className="mk-actions"><button className="secondary" disabled={busy||!myTurn||!(v.played[playerId]?.length)} onClick={()=>act({type:'rest'})}><RotateCcw size={16}/>พัก เก็บการ์ดที่เล่นแล้วกลับมือ</button><span className="muted"><Users size={14}/> ผู้เล่นอื่นเห็นจำนวนการ์ดในมือคุณ แต่ไม่เห็นว่าเป็นใบอะไร</span></div>
  </div>}
 </section>;
}
