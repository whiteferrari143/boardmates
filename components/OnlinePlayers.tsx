'use client';
import {LoaderCircle} from 'lucide-react';
import type {OnlinePlayer} from '@/lib/presence/types';
export default function OnlinePlayers({players,total,selfId}:{players:OnlinePlayer[]|null;total:number;selfId:string}){
 const hidden=players?Math.max(0,total-players.length):0;
 return <section className="online-card" aria-labelledby="online-title">
  <div className="online-head"><div className="online-title"><span className="online-dot" aria-hidden="true"/><h2 id="online-title">ผู้เล่นออนไลน์</h2></div>{players&&<span className="count-tag">{total} คน</span>}</div>
  {!players?<p className="online-empty"><LoaderCircle className="spin" size={18}/>กำลังโหลดรายชื่อ…</p>:<ul className="online-list">{players.map(p=><li className={`online-pill ${p.id===selfId?'self':''}`} key={p.id}><span className="avatar small" aria-hidden="true">{Array.from(p.name)[0]}</span><span className="online-name">{p.name}</span>{p.id===selfId&&<span className="online-me">คุณ</span>}{p.inRoom&&<span className="online-state">อยู่ในห้อง</span>}</li>)}</ul>}
  {hidden>0&&<p className="online-more">และอีก {hidden} คน</p>}
 </section>;
}
