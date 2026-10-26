'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUp, Minus, Plus, Sparkles, ArrowUpRight } from 'lucide-react';
import type { TutorContext } from '@/data/tutor-contract';
import { Link } from '@/i18n/routing';
import { useTutor } from './use-tutor';

export function TutorPanel({ context }: { context: TutorContext }) {
  const t = useTranslations('tutor');
  const common = useTranslations('common');
  const locale = useLocale();
  const id = useId();
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(true);
  const { enabled, messages, pending, error, send, cancel } = useTutor(locale, context);
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
          aria-label={t('title')}
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
        <button
          className="suggestion-button"
          disabled={!enabled || pending}
          onClick={() => submit(t(context.kind === 'orbit' ? 'suggestionOrbit' : 'suggestion'))}
        >
          {t(context.kind === 'orbit' ? 'suggestionOrbit' : 'suggestion')}
        </button>
        <div className="tutor-conversation" role="log" aria-label={t('reply')} aria-live="polite">
          {messages.map((message, index) => (
            <div key={index} className={`tutor-message ${message.role}`}>
              <span>{t(message.role === 'user' ? 'you' : 'title')}</span>
              <p>{message.content}</p>
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
            maxLength={1000}
            rows={3}
            placeholder={t('placeholder')}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="tutor-form-footer">
            <small>{input.length}/1000</small>
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
          <Link href="/learn" className="tutor-try">
            {t('try')}
            <ArrowUpRight size={14} />
          </Link>
        ) : null}
        <p className="tutor-disclaimer">{t('disclaimer')}</p>
      </div>
    </section>
  );
}
