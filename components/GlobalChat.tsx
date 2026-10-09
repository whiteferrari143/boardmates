'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {MessageCircle,Minus,Send,LoaderCircle} from 'lucide-react';
import {Collapsible,CollapsibleContent,CollapsibleTrigger} from '@/components/ui/collapsible';
import type {Player} from '@/lib/session/server';
import type {ChatMessage} from '@/lib/chat/types';
async function chatRequest(body?:{body:string;requestId:string}){
 const res=await fetch('/api/chat',{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
 const data=await res.json() as {messages:ChatMessage[];message:ChatMessage;error?:string};
 if(!res.ok)throw new Error(data.error||'เชื่อมต่อแชตไม่ได้ กรุณาลองใหม่');return data;
}
export default function GlobalChat({player}:{player:Player}){
 const [open,setOpen]=useState(false),[messages,setMessages]=useState<ChatMessage[]>([]),[draft,setDraft]=useState(''),[unread,setUnread]=useState(0),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[loadError,setLoadError]=useState(''),[sendError,setSendError]=useState('');
 const openRef=useRef(false),initialized=useRef(false),seen=useRef(new Set<number>()),inputRef=useRef<HTMLTextAreaElement>(null),listRef=useRef<HTMLDivElement>(null),triggerRef=useRef<HTMLButtonElement>(null),pending=useRef<{body:string;requestId:string}|null>(null),sendLock=useRef(false);
 const receive=useCallback((incoming:ChatMessage[])=>{
  const fresh=incoming.filter(m=>!seen.current.has(m.id)&&m.playerId!==player.id);
  if(initialized.current&&!openRef.current&&document.visibilityState==='visible')setUnread(n=>n+fresh.length);
  if(initialized.current&&document.visibilityState==='hidden')setUnread(n=>n+fresh.length);
  incoming.forEach(m=>seen.current.add(m.id));initialized.current=true;
  setMessages(current=>{const merged=new Map(current.map(m=>[m.id,m]));incoming.forEach(m=>merged.set(m.id,m));const next=[...merged.values()].sort((a,b)=>a.id-b.id).slice(-100);return next.length===current.length&&next.every((m,i)=>m.id===current[i].id)?current:next;});
 },[player.id]);
 useEffect(()=>{let active=true,busy=false,timer:ReturnType<typeof setTimeout>;const controller=new AbortController();
  async function poll(){if(busy||!active)return;busy=true;try{const res=await fetch('/api/chat',{credentials:'same-origin',cache:'no-store',signal:controller.signal});const data=await res.json() as {messages:ChatMessage[];error?:string};if(!res.ok)throw new Error(data.error||'เชื่อมต่อแชตไม่ได้');if(active){receive(data.messages);setLoadError('');}}catch(e){if(active)setLoadError((e as Error).message);}finally{busy=false;if(active){setLoading(false);clearTimeout(timer);timer=setTimeout(()=>{void poll();},document.hidden?10000:2500);}}}
  const wake=()=>{if(!document.hidden){if(openRef.current)setUnread(0);clearTimeout(timer);void poll();}};void poll();document.addEventListener('visibilitychange',wake);window.addEventListener('online',wake);
  return()=>{active=false;controller.abort();clearTimeout(timer);document.removeEventListener('visibilitychange',wake);window.removeEventListener('online',wake);};
 },[receive]);
 function changeOpen(next:boolean){openRef.current=next;setOpen(next);if(next)setUnread(0);}
 useEffect(()=>{if(open){inputRef.current?.focus();if(listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight;}},[open]);
 useEffect(()=>{if(open&&listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight;},[messages,open]);
 async function send(e:React.FormEvent){e.preventDefault();if(sendLock.current||!draft.trim()||Array.from(draft.trim()).length>500)return;sendLock.current=true;setSending(true);setSendError('');const text=draft.trim();const payload=pending.current?.body===text?pending.current:{body:text,requestId:crypto.randomUUID()};pending.current=payload;
  try{const data=await chatRequest(payload);receive([data.message]);setDraft('');pending.current=null;}catch(e){setSendError((e as Error).message);}finally{sendLock.current=false;setSending(false);inputRef.current?.focus();}
 }
 return <Collapsible className="global-chat" open={open} onOpenChange={changeOpen}>
  <CollapsibleContent className="chat-panel" onKeyDown={e=>{if(e.key==='Escape'){changeOpen(false);triggerRef.current?.focus();}}}>
   <section aria-label="แชตรวมหน้าเว็บ"><header className="chat-heading"><MessageCircle size={22}/><div><h2>แชตรวม</h2><p>คุยกัน ชวนกันเล่น · ทุกคนเห็นข้อความ</p></div><button className="chat-minimize" onClick={()=>{changeOpen(false);triggerRef.current?.focus();}} aria-label="ย่อแชต"><Minus size={20}/></button></header>
   <div ref={listRef} className="chat-messages" role="log" aria-label="ข้อความแชตรวม" aria-live={open?'polite':'off'} aria-relevant="additions">
    {loading&&!messages.length?<div className="chat-empty"><LoaderCircle className="spin" size={22}/>กำลังโหลดข้อความ…</div>:!messages.length&&!loadError?<div className="chat-empty"><MessageCircle size={32}/><strong>ทักเพื่อนคนแรกเลย</strong><p>บอกเกมที่อยากเล่น หรือส่งรหัสห้องชวนเพื่อน</p></div>:messages.map(m=><article className={`chat-message ${m.playerId===player.id?'mine':''}`} key={m.id}><div className="chat-meta"><strong>{m.name}{m.playerId===player.id?' · คุณ':''}</strong><time dateTime={new Date(m.created).toISOString()} title={new Date(m.created).toLocaleString('th-TH')}>{new Date(m.created).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</time></div><p>{m.body}</p></article>)}
   </div>
   {loadError&&<p className="chat-error" role="status">{loadError} · กำลังเชื่อมต่อใหม่</p>}
   <form className="chat-compose" onSubmit={send}><label className="chat-input-label" htmlFor="global-chat-message">ข้อความถึงทุกคน</label><div className="chat-input-row"><textarea id="global-chat-message" ref={inputRef} rows={2} value={draft} disabled={sending} maxLength={1000} placeholder="ชวนเพื่อนเล่นเกม…" onChange={e=>{setDraft(e.target.value);setSendError('');}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send(e);}}}/><button className="chat-send" type="submit" disabled={sending||!draft.trim()||Array.from(draft.trim()).length>500} aria-label="ส่งข้อความ">{sending?<LoaderCircle className="spin" size={20}/>:<Send size={20}/>}</button></div><div className="chat-compose-meta"><span>Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่</span><span>{Array.from(draft.trim()).length}/500</span></div>{sendError&&<p className="chat-error" role="alert">{sendError}</p>}</form>
   </section>
  </CollapsibleContent>
  <CollapsibleTrigger ref={triggerRef} className="chat-tab" aria-label={`แชตรวม${unread?` มี ${unread} ข้อความใหม่`:''}`}><MessageCircle size={22}/><span>แชตรวม</span>{unread>0&&<span className="chat-badge">{unread>99?'99+':unread}</span>}</CollapsibleTrigger>
 </Collapsible>;
}
