# เผยแพร่ Boardmates บน Cloudflare

เว็บรันบน Cloudflare Workers + ฐานข้อมูล D1 ใช้บัญชีฟรีได้ ตั้งค่าครั้งเดียว แล้วทุกครั้งที่ merge เข้า `main` Cloudflare จะ build และเผยแพร่ให้อัตโนมัติ

> ข้อมูลผู้เล่น ห้อง และแชตจากเว็บเดิมไม่ถูกย้ายมา เว็บใหม่เริ่มจากฐานข้อมูลเปล่า และลิงก์เว็บจะเป็นที่อยู่ใหม่

## ตั้งค่าครั้งแรก

1. **สร้างฐานข้อมูล D1** ใน Cloudflare Dashboard ไปที่ Storage & Databases → D1 → Create database ตั้งชื่อ `boardmates` แล้วคัดลอก **Database ID**
2. **ใส่ Database ID** ในไฟล์ `wrangler.jsonc` แทนค่า `REPLACE_WITH_YOUR_D1_DATABASE_ID` แล้ว commit เข้า `main` (ID นี้ไม่ใช่ความลับ)
3. **เชื่อม GitHub** ที่ Workers & Pages → Create → Import a repository เลือก `whiteferrari143/boardmates`
   - ชื่อ Worker ต้องเป็น `boardmates` (ตรงกับ `name` ใน `wrangler.jsonc`)
   - Build command: `pnpm build`
   - Deploy command: `pnpm run deploy` (รัน migration กับ D1 จริงก่อน แล้วจึงเผยแพร่)
   - Production branch: `main`
4. สั่ง build ครั้งแรก แล้วเปิดลิงก์ `https://boardmates.<ชื่อบัญชี>.workers.dev`

## Migration ฐานข้อมูล

`pnpm run deploy` รัน `pnpm db:remote` ให้ทุกครั้ง migration ที่เคยรันแล้วจะไม่ถูกรันซ้ำ ถ้าขั้นตอนนี้ล้มเหลวเพราะ token ของ build ไม่มีสิทธิ์แก้ D1 ให้รันเองจากเครื่อง:

```sh
pnpm install --frozen-lockfile
pnpm exec wrangler login
pnpm db:remote
```

แล้วสั่ง build ใหม่ ถ้าแก้ schema ให้ `pnpm db:generate` เพิ่ม migration ใหม่เสมอ ห้ามแก้ไฟล์เดิมใน `drizzle/`

## ตรวจหลังเผยแพร่

- เข้าเล่นด้วยชื่อใหม่ได้ และรีเฟรชแล้วยังอยู่ในระบบ
- ล็อบบี้แสดงการ์ด "ผู้เล่นออนไลน์" และเปลี่ยนชื่อจากเมนูโปรไฟล์ได้
- เปิดสองเบราว์เซอร์ สร้างห้อง เข้าห้อง กดพร้อม และส่งแชตข้ามกันได้

## ทดสอบ build แบบ production บนเครื่อง

```sh
pnpm build
pnpm exec wrangler d1 migrations apply DB --local --config wrangler.jsonc --persist-to .wrangler/state
pnpm exec wrangler dev --config dist/server/wrangler.json --local --persist-to .wrangler/state
```

## ข้อควรรู้

- `pnpm dev` และ `pnpm db:local` ยังใช้ฐานข้อมูลจำลองในเครื่องเหมือนเดิม ไม่แตะฐานข้อมูลจริง
- แต่ละคำขอเขียนฐานข้อมูล (heartbeat ห้อง และผู้เล่นออนไลน์) แผนฟรีมีโควตาคำขอรายวัน ถ้ามีผู้เล่นจำนวนมากอาจเต็มโควตา ควรดูการใช้งานใน Dashboard
- ถ้าต้องการโดเมนของตัวเอง เพิ่มได้ที่ Workers & Pages → boardmates → Settings → Domains & Routes
