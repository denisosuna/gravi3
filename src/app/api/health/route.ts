import { NO_STORE_HEADERS } from '@/constants/http';
import { getConfig } from '@/server/config';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { status: 'ok', tutorEnabled: getConfig().tutorEnabled },
    { headers: NO_STORE_HEADERS },
  );
}
