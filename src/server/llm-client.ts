import 'server-only';
import OpenAI from 'openai';
import type { LlmConfig, LlmProvider } from './config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type ChatCompletion = (messages: ChatMessage[], signal: AbortSignal) => Promise<string>;

const COMPLETED_FINISH_REASON = 'stop';

class IncompleteCompletionError extends Error {
  constructor() {
    super('The provider returned an empty or truncated completion.');
  }
}

// Works with any provider exposing the OpenAI Chat Completions API (OpenAI, Groq, OpenRouter...).
export function createChatCompletion(provider: LlmProvider, config: LlmConfig): ChatCompletion {
  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl,
    maxRetries: 0,
    timeout: config.timeoutMs,
  });
  return async (messages, signal) => {
    const result = await client.chat.completions.create(
      {
        model: provider.model,
        messages,
        max_completion_tokens: config.maxCompletionTokens,
        ...(config.reasoningEffort ? { reasoning_effort: config.reasoningEffort } : {}),
        ...(config.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
        stream: false,
      },
      { signal },
    );
    const [choice] = result.choices;
    const content = choice?.message.content?.trim();
    if (!content || choice?.finish_reason !== COMPLETED_FINISH_REASON)
      throw new IncompleteCompletionError();
    return content;
  };
}
