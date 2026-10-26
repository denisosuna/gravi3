'use client';

import { useEffect, useRef, useState } from 'react';
import type { TutorContext, TutorMessage } from '@/data/tutor-contract';

export function useTutor(locale: string, context: TutorContext) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch('/api/tutor', { signal: abort.signal })
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
    const previous = messages.at(-1);
    const priorMessages =
      previous?.role === 'user' && previous.content === text ? messages.slice(0, -1) : messages;
    const history = priorMessages
      .slice(-6)
      .map((item) => ({ ...item, content: item.content.slice(0, 1000) }));
    setMessages([...priorMessages, { role: 'user' as const, content: text }].slice(-8));
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, message: text, history, context }),
        signal: abort.signal,
      });
      const body = await response.json();
      if (!response.ok) {
        setError(
          response.status === 429 ? 'rateLimit' : response.status === 503 ? 'unavailable' : 'error',
        );
        return;
      }
      if (typeof body.reply !== 'string' || !body.reply.trim()) throw new Error('Empty response.');
      setMessages((current) =>
        [...current, { role: 'assistant' as const, content: body.reply }].slice(-8),
      );
    } catch {
      if (!abort.signal.aborted) setError('error');
    } finally {
      if (active.current === abort) {
        active.current = null;
        setPending(false);
      }
    }
  }
  return { enabled, messages, pending, error, send, cancel: () => active.current?.abort() };
}
