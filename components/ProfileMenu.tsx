'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {AlertCircle,Check,ChevronDown,LoaderCircle} from 'lucide-react';
import type {Player} from '@/lib/session/server';
export default function ProfileMenu({player,onRenamed}:{player:Player;onRenamed:(player:Player)=>void}){
 const [open,setOpen]=useState(false),[name,setName]=useState(player.name),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const rootRef=useRef<HTMLDivElement>(null),triggerRef=useRef<HTMLButtonElement>(null),inputRef=useRef<HTMLInputElement>(null),saveLock=useRef(false),panelId=useId(),inputId=useId();
 const trimmed=name.trim().normalize('NFC'),length=Array.from(trimmed).length;
 const valid=length>=2&&length<=24&&!/[\p{Cc}\p{Cf}<>]/u.test(trimmed),unchanged=trimmed===player.name;
 function toggle(){if(open){setOpen(false);setError('');return;}setName(player.name);setError('');setOpen(true);}
 useEffect(()=>{if(open)inputRef.current?.select();},[open]);
 useEffect(()=>{if(!open)return;
  const outside=(e:PointerEvent)=>{if(!rootRef.current?.contains(e.target as Node)){setOpen(false);setError('');}};
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);setError('');triggerRef.current?.focus();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 async function submit(e:React.FormEvent){e.preventDefault();if(saveLock.current||!valid||unchanged)return;saveLock.current=true;setSaving(true);setError('');
  try{
   let res:Response;
   try{res=await fetch('/api/profile',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:trimmed})});}
   catch{setError('เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่');return;}
   let data:{player?:Player;error?:string}={};
   try{data=await res.json() as typeof data;}catch{/* handled below */}
   if(!res.ok||!data.player){setError(data.error||'เปลี่ยนชื่อไม่สำเร็จ กรุณาลองใหม่');return;}
   onRenamed(data.player);setOpen(false);triggerRef.current?.focus();
  }finally{saveLock.current=false;setSaving(false);}
 }
 return <div className="profile-menu" ref={rootRef}>
  <button ref={triggerRef} type="button" className="user-chip profile-trigger" aria-haspopup="dialog" aria-expanded={open} aria-controls={open?panelId:undefined} onClick={toggle} title="ตั้งค่าโปรไฟล์"><span className="avatar small">{Array.from(player.name)[0]}</span><span>{player.name}</span><span className="guest">Guest</span><ChevronDown className={`profile-caret ${open?'open':''}`} size={16} aria-hidden="true"/></button>
  {open&&<div className="profile-panel" id={panelId} role="dialog" aria-label="ตั้งค่าโปรไฟล์">
   <span className="mini-label">PROFILE</span><h2>โปรไฟล์ของฉัน</h2>
   <div className="profile-who"><span className="avatar" aria-hidden="true">{Array.from(player.name)[0]}</span><div><strong>{player.name}</strong><span className="profile-sub">เข้าเล่นแบบ Guest</span></div></div>
   <form onSubmit={submit}>
    <label htmlFor={inputId}>ชื่อผู้เล่น</label>
    <input id={inputId} ref={inputRef} value={name} onChange={e=>{setName(e.target.value);setError('');}} maxLength={48} autoComplete="nickname" aria-describedby={`${inputId}-help`}/>
    <div className="input-help" id={`${inputId}-help`}><span>2–24 ตัวอักษร</span><span>{length}/24</span></div>
    {error&&<div className="error" role="alert"><AlertCircle size={18}/>{error}</div>}
    <p className="profile-note">ชื่อใหม่จะแสดงในรายชื่อออนไลน์ ห้องเกม และแชตรวมทันที</p>
    <div className="profile-actions"><button type="button" className="ghost" onClick={()=>{setOpen(false);setError('');triggerRef.current?.focus();}}>ยกเลิก</button><button className="primary" disabled={saving||!valid||unchanged}>{saving?<LoaderCircle className="spin" size={18}/>:<Check size={18}/>}บันทึกชื่อ</button></div>
   </form>
  </div>}
 </div>;
}
