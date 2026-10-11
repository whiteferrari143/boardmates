# Boardmates — นำโค้ดไปพัฒนาต่อ

ไฟล์ ZIP นี้เป็นโค้ดต้นฉบับของเว็บไซต์เวอร์ชันที่เผยแพร่หลังเพิ่มแชตรวม รวมหน้าล็อบบี้ ห้องเกม Spyfall, Deception, แชตรวม และโครงสร้างฐานข้อมูล ไม่รวมข้อมูลผู้เล่น ข้อความแชต หรือห้องจากเว็บจริง

## ใช้กับ GitHub และ Claude

1. แตก ZIP แล้วใช้โฟลเดอร์ `boardmates` เป็นรากของโปรเจกต์
2. สร้าง repository ใน GitHub แล้วอัปโหลดไฟล์ภายในโฟลเดอร์นี้ รวมไฟล์ที่ขึ้นต้นด้วยจุด เช่น `.gitignore`, `.npmrc` และ `.openai/hosting.json` (อย่าอัปโหลด ZIP เพียงไฟล์เดียวหากต้องการให้ดูและแก้โค้ดใน repository ได้)
3. เปิดโฟลเดอร์นี้ในเครื่องมือพัฒนา เช่น Claude Code หรือให้เครื่องมือ AI ที่รองรับเข้าถึง repository หากใช้ Claude แบบสนทนา ให้แนบไฟล์โค้ดที่เกี่ยวข้องพร้อมคู่มือนี้
4. ให้ AI อ่าน `README.md` และ `AGENTS.md` ก่อนแก้ไข แล้วทดสอบก่อนเผยแพร่

ตัวอย่างคำสั่งที่ใช้คุยกับ AI:

> โปรเจกต์นี้คือ Boardmates เว็บบอร์ดเกมภาษาไทย อ่าน README.md, AGENTS.md และ EXPORT-GUIDE.md ก่อนเริ่ม ช่วยแก้ไข [ระบุสิ่งที่ต้องการ] โดยรักษาระบบ Guest, ห้องเกม, บทบาทลับ และแชตรวมเดิม หลังแก้ให้ตรวจ typecheck, integration tests และ build พร้อมบอกวิธีนำขึ้นโฮสต์

## รันบนเครื่อง

ต้องมี Node.js ตั้งแต่ 22.13 และ pnpm เวอร์ชัน 11.25.0 ตาม `package.json` ใช้เวอร์ชันที่กำหนดและเก็บ lockfile เดิม

```sh
pnpm install --frozen-lockfile
pnpm db:local
pnpm dev
```

เปิด URL ที่โปรแกรมแสดง ปกติ `http://localhost:5173` ฐานข้อมูลที่สร้างในเครื่องเป็นฐานข้อมูลใหม่แยกจากเว็บจริง ไม่ต้องใช้บัญชี Cloudflare สำหรับโหมดจำลองในเครื่อง

ไฟล์ `.sites-runtime/execution-profile.json` ไม่รวมอยู่ใน ZIP ระบบจะเลือกโหมด portable ตามค่าเริ่มต้นของ `scripts/execution-profile.mjs`

ตรวจหลังแก้ไข:

```sh
pnpm typecheck
pnpm test:integration
pnpm build
```

ถ้าแก้โครงสร้างฐานข้อมูล:

```sh
pnpm db:generate
pnpm db:local
```

ตรวจ SQL ที่สร้างใหม่ และเก็บ migration กับ metadata ทั้งหมดไว้ด้วย ห้ามแก้ migration เดิมที่ใช้กับเว็บจริงแล้ว

## อัปโหลดโค้ดและโฮสต์เว็บเป็นคนละขั้นตอน

GitHub ใช้เก็บโค้ดและทำงานร่วมกันได้ แต่ GitHub Pages เพียงอย่างเดียวรันเว็บนี้ครบระบบไม่ได้ เพราะ Guest session, ห้องเกม และแชตรวมต้องมีเซิร์ฟเวอร์และฐานข้อมูล

โครงสร้างปัจจุบันใช้ React + TypeScript + Vinext/Vite และ Cloudflare Worker + D1 ฐานข้อมูลเป็น SQLite ผ่าน D1 และระบบเดิมเผยแพร่ด้วย Sites หากจะนำขึ้น Cloudflare ในบัญชีของคุณเอง ต้องสร้าง D1 ของคุณ ผูก binding ชื่อ `DB`, ตั้งค่า Worker และ static assets แล้วใช้ migrations เดิมทั้งหมดกับฐานข้อมูลใหม่ก่อนเปิดใช้

`wrangler.local.jsonc` และค่า database ID ใน `vite.config.ts` เป็น placeholder สำหรับการพัฒนาในเครื่อง ไม่ใช่ฐานข้อมูล production พร้อมใช้ หากใช้โฮสต์อื่นที่ไม่รองรับ Cloudflare ต้องปรับ `db/raw.ts` และส่วน Worker/build ให้เข้ากับโฮสต์นั้นด้วย การอัปโหลดโค้ดไม่ย้ายฐานข้อมูลจริงให้อัตโนมัติ

การตั้งค่าเผยแพร่ปัจจุบันอยู่ใน `wrangler.jsonc` และ `DEPLOY-CLOUDFLARE.md` (ระบบ Sites เดิมไม่ได้ใช้แล้ว ไฟล์ `.openai/hosting.json` ถูกถอดออกแล้ว)

## สิ่งที่อยู่ในชุดไฟล์

- โค้ดต้นฉบับและรูปประกอบที่ใช้ในเว็บ
- package.json และ pnpm-lock.yaml
- schema และ migrations ทั้งหมด รวมตารางแชต
- integration tests และคู่มือของโปรเจกต์
- LICENSE ของส่วนประกอบที่แนบมากับโปรเจกต์

ไม่รวม node_modules, ไฟล์ build, ประวัติ Git, ฐานข้อมูลจริง/ฐานข้อมูลในเครื่อง, ไฟล์ .env หรือข้อมูลรับรองการเผยแพร่ ติดตั้ง dependencies ใหม่ด้วยคำสั่งด้านบน
