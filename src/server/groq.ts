import 'server-only';
import OpenAI from 'openai';
import type { TutorRequest } from '@/data/tutor-contract';
import type { ServerConfig } from './config';
import { tutorSystemPrompt } from './tutor-prompt';

export async function generateTutorReply(
  input: TutorRequest,
  config: ServerConfig,
  signal: AbortSignal,
) {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    maxRetries: 0,
    timeout: config.timeout,
  });
  const result = await client.chat.completions.create(
    {
      model: config.model,
      messages: [
        { role: 'system', content: tutorSystemPrompt(input) },
        ...input.history,
        { role: 'user', content: input.message },
      ],
      max_completion_tokens: config.maxTokens,
      ...(config.model.startsWith('openai/gpt-oss-') ? { reasoning_effort: 'low' as const } : {}),
      stream: false,
    },
    { signal },
  );
  const content = result.choices[0]?.message.content?.trim();
  if (!content || result.choices[0]?.finish_reason !== 'stop')
    throw new Error('Incomplete tutor response.');
  return content.slice(0, 6000);
}
