import { getConfig } from '@/server/config';
import { generateTutorReply } from '@/server/groq';
import { logger } from '@/server/logger';
import { RateLimiter } from '@/server/rate-limiter';
import { handleTutor } from '@/server/tutor-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const limiter = new RateLimiter(getConfig());

export function GET() {
  const config = getConfig();
  return Response.json(
    { enabled: config.enabled && Boolean(config.apiKey) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export function POST(request: Request) {
  const config = getConfig();
  return handleTutor(request, {
    config,
    limiter,
    logger,
    complete: (input, signal) => generateTutorReply(input, config, signal),
  });
}
