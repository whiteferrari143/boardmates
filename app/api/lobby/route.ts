import {gameCatalog} from '@/lib/games/registry';
import {privateUnlocked} from '@/lib/games/access';
import {session} from '@/lib/session/server';
export async function GET(req:Request) {
 let unlocked=false;
 try{unlocked=await privateUnlocked((await session(req)).id);}catch{/* anonymous visitors only see public games */}
 return Response.json({games:gameCatalog.filter(g=>!g.private||unlocked),unlocked},{headers:{'Cache-Control':'no-store'}});
}
