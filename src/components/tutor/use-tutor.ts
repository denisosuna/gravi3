import { useEffect, useRef, useState } from 'react';
import { HTTP_STATUS } from '@/constants/http';
import { API_ROUTES } from '@/constants/routes';
import { TUTOR_LIMITS, type TutorContext, type TutorMessage } from '@/data/tutor-contract';

export type TutorErrorKey = 'rateLimit' | 'unavailable' | 'error';

function errorKey(status: number): TutorErrorKey {
  if (status === HTTP_STATUS.tooManyRequests) return 'rateLimit';
  if (status === HTTP_STATUS.serviceUnavailable) return 'unavailable';
  return 'error';
}

class TutorRequestError extends Error {
  constructor(readonly key: TutorErrorKey) {
    super(`Tutor request failed: ${key}`);
  }
}

function keepLatest(messages: TutorMessage[]): TutorMessage[] {
  return messages.slice(-TUTOR_LIMITS.displayedMessages);
}

// Retrying the last unanswered question must not duplicate it in the transcript.
function withoutRetriedQuestion(messages: TutorMessage[], text: string): TutorMessage[] {
  const previous = messages.at(-1);
  return previous?.role === 'user' && previous.content === text ? messages.slice(0, -1) : messages;
}

function toHistory(messages: TutorMessage[]): TutorMessage[] {
  return messages
    .slice(-TUTOR_LIMITS.historyMessages)
    .map((item) => ({ ...item, content: item.content.slice(0, TUTOR_LIMITS.messageLength) }));
}

async function requestReply(payload: object, signal: AbortSignal): Promise<string> {
  const response = await fetch(API_ROUTES.tutor, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) throw new TutorRequestError(errorKey(response.status));
  const body: { reply?: unknown } = await response.json();
  if (typeof body.reply !== 'string' || !body.reply.trim()) throw new TutorRequestError('error');
  return body.reply;
}

export function useTutor(locale: string, context: TutorContext) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<TutorErrorKey | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch(API_ROUTES.tutor, { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Tutor availability check failed.');
        const body = await response.json();
        setEnabled(body.enabled === true);
      })
      .catch(() => {
        if (!abort.signal.aborted) setEnabled(false);
      });
    return () => {
      abort.abort();
      active.current?.abort();
    };
  }, []);

  async function send(message: string) {
    const text = message.trim();
    if (!text || !enabled || active.current) return;
    const abort = new AbortController();
    active.current = abort;
    setPending(true);
    setError(null);
    const priorMessages = withoutRetriedQuestion(messages, text);
    setMessages(keepLatest([...priorMessages, { role: 'user', content: text }]));
    try {
      const payload = { locale, message: text, history: toHistory(priorMessages), context };
      const reply = await requestReply(payload, abort.signal);
      setMessages((current) => keepLatest([...current, { role: 'assistant', content: reply }]));
    } catch (failure) {
      if (!abort.signal.aborted)
        setError(failure instanceof TutorRequestError ? failure.key : 'error');
    } finally {
      if (active.current === abort) {
        active.current = null;
        setPending(false);
      }
    }
  }
  return { enabled, messages, pending, error, send, cancel: () => active.current?.abort() };
}
