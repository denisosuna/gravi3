'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUp, Minus, Plus, Sparkles, ArrowUpRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { TUTOR_LIMITS, type TutorContext } from '@/data/tutor-contract';
import type { TutorAction } from '@/data/tutor-actions';
import { Link, useRouter } from '@/i18n/routing';
import { TutorActionButtons } from './tutor-action-buttons';
import { TutorSuggestions } from './tutor-suggestions';
import { useTutor } from './use-tutor';

// `onAction` applies experiments the tutor proposes; navigation actions are handled here.
export function TutorPanel({
  context,
  onAction,
}: {
  context: TutorContext;
  onAction?: (action: TutorAction) => void;
}) {
  const t = useTranslations('tutor');
  const common = useTranslations('common');
  const locale = useLocale();
  const id = useId();
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(true);
  const { enabled, messages, pending, error, send, cancel } = useTutor(locale, context);
  const router = useRouter();
  const conversation = useRef<HTMLDivElement>(null);
  // Keep the latest reply and its experiment buttons in view.
  useEffect(() => {
    const log = conversation.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);
  function run(action: TutorAction) {
    if (action.type === 'openOrbit') router.push(ROUTES.orbit(action.slug));
    else onAction?.(action);
  }
  function submit(message = input) {
    void send(message);
    setInput('');
  }
  return (
    <section className="tutor-panel" aria-label={t('title')}>
      <div className="panel-heading">
        <Sparkles size={23} />
        <h2>{t('title')}</h2>
        <button
          className="collapse-button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
          aria-label={t(expanded ? 'collapse' : 'expand')}
        >
          {expanded ? <Minus size={16} /> : <Plus size={16} />}
        </button>
      </div>
      <div id={id} hidden={!expanded}>
        <p className="tutor-intro">{t('intro')}</p>
        {enabled === false ? (
          <p className="tutor-notice" role="status">
            {t('disabled')}
            <span>{t('offline')}</span>
          </p>
        ) : null}
        {messages.length === 0 ? (
          <TutorSuggestions kind={context.kind} disabled={!enabled || pending} onAsk={submit} />
        ) : null}
        <div
          ref={conversation}
          className="tutor-conversation"
          role="log"
          aria-label={t('reply')}
          aria-live="polite"
        >
          {messages.map((message) => (
            <div key={message.id} className={`tutor-message ${message.role}`}>
              <span>{t(message.role === 'user' ? 'you' : 'title')}</span>
              <p>{message.content}</p>
              {message.actions ? (
                <TutorActionButtons actions={message.actions} onRun={run} />
              ) : null}
            </div>
          ))}
        </div>
        {pending ? (
          <p role="status" className="tutor-status">
            {t('thinking')}
          </p>
        ) : null}
        {error ? (
          <div>
            <p role="alert" className="tutor-notice">
              {t(error)}
            </p>
            <button
              className="button"
              disabled={pending}
              onClick={() =>
                submit(messages.filter((message) => message.role === 'user').at(-1)?.content ?? '')
              }
            >
              {common('retry')}
            </button>
          </div>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="sr-only" htmlFor={`${id}-question`}>
            {t('question')}
          </label>
          <textarea
            id={`${id}-question`}
            value={input}
            disabled={!enabled || pending}
            maxLength={TUTOR_LIMITS.messageLength}
            rows={3}
            placeholder={t('placeholder')}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="tutor-form-footer">
            <small>
              {input.length}/{TUTOR_LIMITS.messageLength}
            </small>
            {pending ? (
              <button type="button" className="button" onClick={cancel}>
                {t('cancel')}
              </button>
            ) : (
              <button type="submit" className="button primary" disabled={!enabled || !input.trim()}>
                {t('send')}
                <ArrowUp size={14} />
              </button>
            )}
          </div>
        </form>
        {context.kind === 'orbit' ? (
          <Link href={ROUTES.learn} className="tutor-try">
            {t('try')}
            <ArrowUpRight size={14} />
          </Link>
        ) : null}
        <p className="tutor-disclaimer">{t('disclaimer')}</p>
      </div>
    </section>
  );
}
