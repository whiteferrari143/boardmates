# Boardmates — ล็อบบี้บอร์ดเกมออนไลน์

เว็บไซต์ภาษาไทยสำหรับเข้าเล่นแบบ Guest สร้างห้อง ชวนเพื่อน กดพร้อม และเล่นด้วยกัน รองรับคอมพิวเตอร์และมือถือ มี Spyfall (3–12 คน), Deception · สืบคดีลวง (4–10 คน) และห้องทดสอบระบบ

## เครื่องมือและโครงสร้าง

React 19 + TypeScript, Vinext/Vite, Cloudflare Worker และ D1 (SQLite ส่วนกลาง) ใช้ Sites สำหรับเผยแพร่ Cookie HttpOnly เก็บเฉพาะ token; ชื่อและ ID/session เก็บบนเซิร์ฟเวอร์ ไม่มี localStorage หรือข้อมูลจำลองเป็นระบบห้อง

| ส่วน | ไฟล์ | หน้าที่ |
|---|---|---|
| Session | `lib/session/server.ts`, `app/api/session/route.ts` | Guest ID, ตรวจชื่อ, cookie, อายุ session 7 วัน |
| Lobby | `app/api/lobby/route.ts`, `app/page.tsx` | รายการเกม, สร้างห้อง, เข้าด้วยรหัส |
| Presence | `app/api/presence/route.ts`, `lib/presence/types.ts`, `components/OnlinePlayers.tsx` | heartbeat และรายชื่อผู้เล่นออนไลน์ในล็อบบี้ |
| Profile | `app/api/profile/route.ts`, `components/ProfileMenu.tsx` | เมนูโปรไฟล์และเปลี่ยนชื่อผู้เล่น |
| Rooms | `lib/rooms/server.ts`, `types.ts`, `app/api/room/route.ts` | สมาชิก, ความพร้อม, โอนเจ้าของ, timeout, ตรวจสิทธิ์ |
| Game registry | `lib/games/registry.ts` | แหล่งข้อมูลเกมเพียงจุดเดียว |
| Game engine | `lib/games/types.ts`, `engine.ts` | interface, ตรวจ action, เปลี่ยน state, จบเกม, private view |
| Game screens | `components/games/screens.tsx`, `RoomTest.tsx` | หน้าจอของแต่ละเกม แยกจากระบบห้อง |
| Database | `db/schema.ts`, `db/raw.ts`, `drizzle/` | sessions, rooms, seats และ migration |
| Verification | `tests/integration.mjs`, `tests/worker.ts` | ทดสอบ Worker API + D1 ด้วย session แยกกัน |

## วิธีรันบนเครื่อง

ต้องมี Node.js >=22.13 และ pnpm เวอร์ชันตาม `packageManager` ใน package.json

```bash
pnpm install --frozen-lockfile
pnpm db:local
pnpm dev
```

บน checkout ใหม่ เปิด URL ที่โปรแกรมแสดง (ปกติ `http://localhost:5173`) ถ้าอยู่ในระบบพัฒนาที่ตั้งค่า managed-linux พอร์ตและคำสั่ง preview จะถูกจัดการโดยสภาพแวดล้อมนั้น

`pnpm db:local` ใช้ D1 จำลองบนเครื่องโดย Wrangler และใช้ migration เดียวกับ production ฐานข้อมูลทดสอบ integration แยกต่างหาก ไม่แตะข้อมูลจริง

ค่าที่จำเป็น:

- `.openai/hosting.json` ต้องมี `d1: "DB"`; `r2` เป็น `null`
- โปรเจกต์นี้มี Site ID อยู่แล้ว ใช้ ID เดิมเมื่อแก้ไขและเผยแพร่
- D1 จริงและ Worker ถูกผูกให้ตอนเผยแพร่ผ่าน Sites ไม่มี API key หรือ secret ที่ต้องใส่เพิ่มสำหรับ Guest
- `wrangler.local.jsonc` มี ID placeholder สำหรับ **local เท่านั้น** ไม่ใช่ ID ฐานข้อมูล production
- ใช้ HTTPS เมื่อเผยแพร่ เพื่อให้ cookie Secure และการคัดลอกลิงก์ทำงาน

```bash
pnpm typecheck
pnpm lint
pnpm test:integration
pnpm build
```

เมื่อแก้ schema ให้รัน `pnpm db:generate` ตรวจ SQL และรัน `pnpm db:local` ก่อนทดสอบ เก็บ migration และ metadata ไว้ใน Git ห้ามแก้ migration ที่ถูกใช้ production แล้ว

## วิธีทดสอบกับเพื่อน

แชตรวม: หลังเข้าเล่น กดแท็บ “แชตรวม” มุมล่างขวาเพื่อคุยกับผู้เล่นทุกคน ทั้งในล็อบบี้และห้องเกม ข้อความเป็นสาธารณะภายในเว็บ แสดง 100 ข้อความล่าสุดและโหลดใหม่ทุก 2.5 วินาที (10 วินาทีเมื่อแท็บเว็บอยู่เบื้องหลัง) ส่งด้วย Enter หรือใช้ Shift+Enter ขึ้นบรรทัดใหม่ จำกัด 500 ตัวอักษรและส่งห่างกันอย่างน้อย 2 วินาที มีจำนวนข้อความใหม่เมื่อย่อแชต ระบบใช้ Guest session เดิม ระบุผู้ส่งจากเซิร์ฟเวอร์ และเก็บข้อความใน D1 โดยเพิ่ม migration ใหม่ ไม่แก้ไข migration เดิม

1. เปิด URL เว็บที่เผยแพร่ในสองเบราว์เซอร์หรือสองเครื่อง ใส่ชื่อ (ชื่อซ้ำกันได้ แต่ ID ต้องต่างกัน)
2. เครื่องแรกสร้างห้อง “ทดสอบห้อง” คัดลอกรหัสหรือลิงก์ให้เครื่องที่สอง
3. เครื่องที่สองเข้าห้อง ตรวจว่ารายชื่อทั้งสองเครื่องตรงกัน
4. ทั้งคู่กดพร้อม เจ้าของกดเริ่ม เกมจะเปิดหน้าทดสอบทั้งสองเครื่อง
5. รีเฟรชหน้า ตรวจว่าชื่อ ID และห้องเดิมยังอยู่
6. เจ้าของกดออก ตรวจว่าสิทธิ์เจ้าของโอนให้คนถัดไป
7. ลองชื่อว่าง รหัสผิด ห้องเต็ม และผู้เล่นใหม่เข้าห้องหลังเริ่ม
8. ปิดแท็บหนึ่งเครื่อง: อีกเครื่องเห็นว่าหลุดหลังไม่มี heartbeat 15 วินาที กลับมาภายใน 2 นาทีใช้ที่นั่งเดิมได้

## พฤติกรรมห้อง

- ห้องทดสอบต้องมี 2–8 คน ทุกคนรวมถึงเจ้าของต้องออนไลน์และพร้อมก่อนเริ่ม
- รหัสห้อง 6 ตัว ใช้อักษรที่อ่านไม่สับสน พร้อมปุ่มคัดลอกรหัสและลิงก์ `/?r=CODE`
- ชื่อ 2–24 Unicode code points ตัดช่องว่างหัวท้าย ตรวจ control characters และข้อความที่ไม่รองรับ ID เป็น UUID แยกจากชื่อ
- Cookie/session อายุ 7 วันแบบคงที่ ออกจากระบบลบ session ฝั่งเซิร์ฟเวอร์และออกห้องทันที
- ออกห้องโดยกดปุ่ม: ลบสมาชิกและโอนเจ้าของให้ผู้เล่นที่เข้าก่อนในคนที่เหลือ ห้องไม่มีคนถูกลบ
- หลุด: หลังไม่มี heartbeat 15 วินาทีแสดงหลุดและยกเลิกพร้อม จองที่นั่งไว้ 2 นาที นับจาก heartbeat ล่าสุด
- กลับมาภายในเวลา: ใช้ cookie เดิม กลับห้องเดิมได้ แม้เริ่มเล่นแล้ว ต้องกดพร้อมใหม่หากเคยถูกตรวจพบว่าหลุด
- เกิน 2 นาที: ที่นั่งหมดอายุและโอนเจ้าของในการอัปเดตห้องครั้งถัดไป ถ้าห้องกำลังเล่นจะเข้ามาใหม่ไม่ได้
- หากทุกคนหายไป ห้องถือว่าหมดอายุและคำขอถัดไปจะปิดห้อง ไม่เปิดให้ใช้รหัสเก่า
- แท็บในเบราว์เซอร์เดียวกันใช้ cookie เดียวกันและถือเป็นผู้เล่นคนเดียว ทดสอบคนละผู้เล่นด้วยคนละเบราว์เซอร์หรือโปรไฟล์
- ห้องระหว่างเริ่มเกมอนุญาตให้สมาชิกเดิมเชื่อมต่อใหม่ สมาชิกใหม่ต้องรอเจ้าของกลับห้องรอ
- ถ้าผู้เล่นออกระหว่างเล่น ไม่คืนเกมโดยอัตโนมัติ เกมอนาคตควรกำหนดวิธีจัดการ playerIds ที่ออกใน validateAction/updateState หรือเจ้าของกลับห้องรอ

## ผู้เล่นออนไลน์และโปรไฟล์

- ผู้เล่นที่เข้าสู่ระบบแล้วส่ง `POST /api/presence` ทุก 5 วินาที (15 วินาทีเมื่อแท็บอยู่เบื้องหลัง) เซิร์ฟเวอร์บันทึกเวลาล่าสุดใน `sessions.last_seen` ตามผู้เล่นใน session cookie เท่านั้น
- ผู้เล่นนับว่าออนไลน์เมื่อมี heartbeat ภายใน 30 วินาที และออกจากรายการทันทีเมื่อออกจากระบบ ล็อบบี้แสดงชื่อ สถานะ “อยู่ในห้อง” และจำนวนทั้งหมด (สูงสุด 100 ชื่อ) โดยไม่เปิดเผยรหัสห้อง
- เมนูโปรไฟล์ที่ชิปชื่อมุมขวาบนใช้ `POST /api/profile` เปลี่ยนชื่อผู้เล่นของ session ปัจจุบันเท่านั้น (กฎชื่อเดียวกับตอนเข้าเล่น คือ 2–24 ตัวอักษร) เปลี่ยนซ้ำได้ทุก 10 วินาที (`sessions.name_changed`)
- ชื่อใหม่ถูกปรับใน `sessions`, ข้อความแชตเดิมของผู้เล่น และห้องที่อยู่ปัจจุบัน หากปรับห้องไม่ทัน heartbeat ของห้องจะซิงก์ชื่อให้เองในคำขอถัดไป
- Migration `0003` เพิ่มคอลัมน์ `last_seen`, `name_changed` และ index ใน `sessions`

## การอัปเดตและความปลอดภัย

ระยะแรกใช้ polling API ทุก 1 วินาที ส่ง heartbeat ในคำขอเดียวกัน ทุกเครื่องอ่าน/เขียน D1 ส่วนกลางจริง ไม่ใช่ WebSocket; การเปลี่ยนสถานะมักเห็นภายในรอบอัปเดตถัดไป บวกเวลาเครือข่าย

การเปลี่ยนห้องใช้ optimistic concurrency (`version` + conditional UPDATE) และ retry ป้องกันการเขียนพร้อมกันทับกัน การจองที่นั่งใช้ primary key ตาม player ID และ conditional UPSERT ป้องกันผู้เล่นเดียวเข้าหลายห้องพร้อมกัน

Guest token สุ่มและ hash SHA-256 ก่อนเก็บบนเซิร์ฟเวอร์ cookie ใช้ HttpOnly/SameSite=Lax/Secure เมื่อ HTTPS API ตรวจ Origin และสิทธิ์เจ้าของ/สมาชิกเสมอ ไม่รับ player ID จาก client

ข้อมูลที่ส่งให้ client มีเพียง metadata, สมาชิก และ `getPlayerView` ไม่มีการส่ง `room.state` ทั้งก้อนไปโดยอัตโนมัติ แต่ละเกมต้องออกแบบ getPlayerView ให้ซ่อนข้อมูลลับเอง ห้ามใช้ state ทั้งก้อนกับเกมไพ่

ขอบเขตนี้สำหรับกลุ่มเพื่อน ยังไม่ได้ทดสอบโหลดจำนวนมาก Polling เขียนฐานข้อมูลทุกวินาทีต่อคน หากขยายจำนวนห้องมากควรเปลี่ยน transport เป็น WebSocket และ Durable Object หรือระบบ pub/sub โดยยังคง registry และ game engine เดิมไว้ ไม่มีแชต ตารางคะแนน การชำระเงิน หรือบัญชีถาวร

## เพิ่มเกมใหม่หนึ่งเกม

ตัวอย่างเกม “ผลัดกันนับ” ด้านล่างเป็น **ตัวอย่างในคู่มือ ยังไม่เพิ่มในรายการเกมจริง** เปลี่ยนจาก 0 เป็น 5 โดยผลัดกันกดเพิ่ม

สร้าง `lib/games/counter.ts`:

```ts
import { defineGame } from './types';
type State = { count:number; turn:number; players:string[] };
type Action = { type:'increment' };
type View = State;
export const counter = defineGame<State,Action,View>({
 id:'counter', name:'ผลัดกันนับ', description:'ผลัดกันนับให้ถึง 5',
 minPlayers:2, maxPlayers:4, status:'available', screen:'counter',
 color:'lime', icon:'FlaskConical', category:'ทดสอบเกม',
 createInitialState:ctx=>({count:0,turn:0,players:ctx.playerIds}),
 validateAction:(state,action,actor)=>
   !!action && typeof action==='object' && 'type' in action &&
   action.type==='increment' && state.count<5 &&
   state.players[state.turn]===actor,
 updateState:state=>({...state,count:state.count+1,
   turn:(state.turn+1)%state.players.length}),
 isFinished:state=>state.count>=5,
 getPlayerView:state=>({...state}), // เกมนี้ไม่มีข้อมูลลับ
});
```

นำเข้า `counter` ใน `lib/games/registry.ts` แล้วเพิ่ม `counter` เป็นรายการใน `gameRegistry` ก่อนสร้าง `gameCatalog` ล็อบบี้และจำนวนคนจะอ่านจาก registry อัตโนมัติ

สร้าง `components/games/Counter.tsx`:

```tsx
import type { GameScreenProps } from './types';
export function Counter({room,playerId,busy,isHost,onAction,onReset}:GameScreenProps) {
 const state=room.gameView as {count:number;turn:number;players:string[]};
 const myTurn=state.players[state.turn]===playerId;
 return <section className="test-stage">
   <h2>นับได้ {state.count} / 5</h2>
   <p>{room.phase==='finished'?'จบรอบแล้ว':myTurn?'ถึงตาคุณ':'รอเพื่อน'}</p>
   <button className="primary" disabled={busy||!myTurn||room.phase!=='playing'}
     onClick={()=>onAction({type:'increment'})}>เพิ่ม 1</button>
   {isHost && <button className="secondary" disabled={busy} onClick={onReset}>กลับห้องรอ</button>}
 </section>;
}
```

นำเข้า `Counter` และเพิ่ม `'counter': Counter` ใน `components/games/screens.tsx` โดยไม่ต้องแก้ session/lobby/rooms API `onAction` ส่ง `{action:'game-action',gameAction:{...}}` ไป server; engine ตรวจ validateAction ก่อน updateState แล้วตรวจ isFinished

สำหรับเกมไพ่ให้เก็บมือทุกคนใน server state และให้ `getPlayerView(state,playerId)` คืนเฉพาะมือของ playerId กับข้อมูลสาธารณะ ตรวจสิทธิ์ตาเล่นและรูปแบบ action ใน validateAction เสมอ

## ผลตรวจสอบและสิ่งที่ยังไม่ได้ตรวจ

- TypeScript และ production build ผ่าน
- ชุด integration ทดสอบ Worker routes และ D1 จริงใน local runtime: Guest, ชื่อซ้ำ/ID แยก, cookie restore, สร้าง/เข้า/ออก/พร้อม/เริ่ม/รีเฟรช, รหัสผิด, ห้องเต็ม, concurrency, host transfer, disconnect/reconnect, logout, Origin check
- fixture เฉพาะ test ตรวจ private view ที่ต่างกันตามผู้เล่น, turn permission, updateState และ isFinished ไม่ถูกนำเข้า production
- ยังไม่ได้ทำ browser end-to-end หรือ visual QA บนสองเบราว์เซอร์ เนื่องจากไม่มี browser QA capability ที่ใช้ได้ในสภาพแวดล้อมนี้ ทดสอบ UI จริงด้วยขั้นตอนด้านบนก่อนเปิดใช้วงกว้าง
- การเผยแพร่สำเร็จยืนยันได้จากระบบโฮสต์ ไม่ใช่ผลทดสอบหลายเครื่องบน production
