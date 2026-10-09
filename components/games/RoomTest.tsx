import { CircleCheck, RotateCcw, Users } from 'lucide-react';
import type {GameScreenProps} from './types';
export function RoomTest({room,isHost,busy,onReset}:GameScreenProps) {
 return <section className="test-stage"><div className="success-ring"><CircleCheck size={48}/></div><span className="eyebrow">ROOM TEST</span><h2>ทุกคนเข้ามาแล้ว!</h2><p>เริ่มห้องสำเร็จ ผู้เล่นทุกคนเห็นสถานะเดียวกัน</p><div className="stage-players">{room.members.map(m=><div key={m.id}><span className="avatar">{Array.from(m.name)[0]}</span><span>{m.name}</span></div>)}</div><div className="test-note"><Users size={19}/><span>นี่คือหน้าทดสอบระบบห้อง ยังไม่มีกติกาบอร์ดเกม</span></div>{isHost?<button className="primary" disabled={busy} onClick={onReset}><RotateCcw size={18}/>กลับห้องรอ</button>:<p className="muted">รอเจ้าของห้องกลับไปยังห้องรอ</p>}</section>;
}
