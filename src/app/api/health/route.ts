import { getConfig } from '@/server/config';

export const dynamic = 'force-dynamic';
export function GET() {
  const config = getConfig();
  return Response.json(
    { status: 'ok', tutorEnabled: config.enabled && Boolean(config.apiKey) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
