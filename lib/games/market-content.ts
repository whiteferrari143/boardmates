// Content for "ตลาดคริสตัล" (Crystal Market). Original card list and artwork-free definitions.
// Crystals are counted as [yellow, green, blue, pink]; values 1/2/3/4.
export type Crystals=[number,number,number,number];
export const CRYSTAL_NAMES=['เหลือง','เขียว','ฟ้า','ชมพู'] as const;
export const CRYSTAL_VALUE=[1,2,3,4] as const;
export const CAPACITY=10;
export function parseCrystals(s:string):Crystals{const c:Crystals=[0,0,0,0];for(const ch of s){const i='ygbp'.indexOf(ch);if(i<0)throw new Error(`bad crystal ${ch}`);c[i]++;}return c;}
export interface Merchant{id:string;kind:'gain'|'trade'|'up';pay:Crystals;gain:Crystals;up:number}
const none=():Crystals=>[0,0,0,0];
function merchant(id:string,spec:string):Merchant{
 const [k,body]=spec.split(':');
 if(k==='G')return {id,kind:'gain',pay:none(),gain:parseCrystals(body),up:0};
 if(k==='T'){const [pay,gain]=body.split('>');return {id,kind:'trade',pay:parseCrystals(pay),gain:parseCrystals(gain),up:0};}
 return {id,kind:'up',pay:none(),gain:none(),up:Number(body)};
}
const merchantSpecs=[
 'G:yyy','G:yyyy','G:yyg','G:gg','G:yyyg','G:ygg','G:b','G:yb','G:gb',
 'T:yy>gy','T:yyy>gg','T:yy>b','T:yyyy>bg','T:gy>bg','T:gg>bg','T:ggy>bb','T:bg>pb','T:gb>pg','T:b>p','T:bb>pp','T:ggg>pb','T:g>yyy','T:b>gyy','T:g>b',
 'U:2','U:2','U:2','U:3','U:3','U:4',
];
export const merchants:Merchant[]=merchantSpecs.map((s,i)=>merchant(`m${String(i+1).padStart(2,'0')}`,s));
export const startCards:Merchant[]=[merchant('s-gain','G:yy'),merchant('s-up','U:2')];
export const merchantById:Record<string,Merchant>=Object.fromEntries([...merchants,...startCards].map(m=>[m.id,m]));
export interface GolemDef{id:string;req:Crystals;points:number}
const golemSpecs=[
 'yyggg','yyyygg','gggg','ggbb','bbyy','yyyyyy','ggggy','gggbb','yybbb','yyyyyb','ggbbb','bbbb','gggggg','yggbb','yyybbb','gggbbp',
 'bbbpp','ggpp','yyppp','ggggbb','bbbbp','ggbpp','bbpp','pppb','yyyyggp','ggbbpp','gbbbp','pppp','bbbbbb','ggggpp','bpppy','ppppp',
];
export const golems:GolemDef[]=golemSpecs.map((spec,i)=>{const req=parseCrystals(spec),sum=req.reduce((t,n,k)=>t+n*CRYSTAL_VALUE[k],0),colors=req.filter(n=>n>0).length;return {id:`g${String(i+1).padStart(2,'0')}`,req,points:sum+colors};});
export const golemById:Record<string,GolemDef>=Object.fromEntries(golems.map(g=>[g.id,g]));
