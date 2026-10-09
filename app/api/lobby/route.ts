import {gameCatalog} from '@/lib/games/registry';
export async function GET() {return Response.json({games:gameCatalog},{headers:{'Cache-Control':'no-store'}});}
