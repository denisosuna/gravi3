import { NO_STORE_HEADERS } from '@/constants/http';
import { getConfig } from '@/server/config';
import { createChatCompletion } from '@/server/llm-client';
import { getLogger } from '@/server/logger';
import { RateLimiter } from '@/server/rate-limiter';
import { handleTutor } from '@/server/tutor-handler';
import { buildTutorMessages } from '@/server/tutor-prompt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const config = getConfig();
const limiter = new RateLimiter(config.rateLimit);
const completeChat = config.llm.provider
  ? createChatCompletion(config.llm.provider, config.llm)
  : undefined;

export function GET() {
  return Response.json({ enabled: config.tutorEnabled }, { headers: NO_STORE_HEADERS });
}

export function POST(request: Request) {
  return handleTutor(request, {
    config,
    limiter,
    logger: getLogger(),
    complete: async (input, signal) => {
      if (!completeChat) throw new Error('LLM provider is not configured.');
      return completeChat(buildTutorMessages(input), signal);
    },
  });
}
