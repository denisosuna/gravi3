import { useEffect, useRef, useState } from 'react';
import { HTTP_STATUS } from '@/shared/constants/http';
import { API_ROUTES } from '@/shared/constants/routes';
import { tutorResponseSchema, type TutorAction } from '@/features/tutor/model/tutor-actions';
import {
  TUTOR_LIMITS,
  type TutorContext,
  type TutorMessage,
} from '@/features/tutor/model/tutor-contract';

interface DisplayedMessage extends TutorMessage {
  // Stable React key: the list is trimmed from the front, so indexes shift.
  id: number;
  actions?: TutorAction[];
}

type TutorErrorKey = 'rateLimit' | 'unavailable' | 'error';

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

function keepLatest(messages: DisplayedMessage[]): DisplayedMessage[] {
  return messages.slice(-TUTOR_LIMITS.displayedMessages);
}

// Retrying the last unanswered question must not duplicate it in the transcript.
function withoutRetriedQuestion(messages: DisplayedMessage[], text: string): DisplayedMessage[] {
  const previous = messages.at(-1);
  return previous?.role === 'user' && previous.content === text ? messages.slice(0, -1) : messages;
}

function toHistory(messages: DisplayedMessage[]): TutorMessage[] {
  return messages
    .slice(-TUTOR_LIMITS.historyMessages)
    .map(({ role, content }) => ({ role, content: content.slice(0, TUTOR_LIMITS.messageLength) }));
}

async function requestReply(payload: object, signal: AbortSignal) {
  const response = await fetch(API_ROUTES.tutor, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) throw new TutorRequestError(errorKey(response.status));
  const body = tutorResponseSchema.safeParse(await response.json());
  if (!body.success || !body.data.reply.trim()) throw new TutorRequestError('error');
  return body.data;
}

export function useTutor(locale: string, context: TutorContext) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<DisplayedMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<TutorErrorKey | null>(null);
  const active = useRef<AbortController | null>(null);
  const nextId = useRef(0);
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
    setMessages(
      keepLatest([...priorMessages, { id: nextId.current++, role: 'user', content: text }]),
    );
    try {
      const payload = { locale, message: text, history: toHistory(priorMessages), context };
      const { reply, actions } = await requestReply(payload, abort.signal);
      setMessages((current) =>
        keepLatest([
          ...current,
          { id: nextId.current++, role: 'assistant', content: reply, actions },
        ]),
      );
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
