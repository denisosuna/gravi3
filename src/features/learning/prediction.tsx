'use client';

import { useTranslations } from 'next-intl';
import { Lightbulb } from 'lucide-react';
import type { Experiment } from '@/data/experiment';

export function Prediction({
  answer,
  onAnswer,
}: {
  answer: Experiment['prediction'];
  onAnswer: (answer: Experiment['prediction']) => void;
}) {
  const t = useTranslations('learn');
  return (
    <section className="prediction-panel">
      <div className="eyebrow">{t('step2')}</div>
      <h2>
        <Lightbulb size={18} />
        {t('predictionTitle')}
      </h2>
      <p>{t('predictionQuestion')}</p>
      <div className="prediction-options">
        {(['half', 'quarter', 'double'] as const).map((value) => (
          <button
            key={value}
            className="button"
            aria-pressed={answer === value}
            onClick={() => onAnswer(value)}
          >
            {t(value)}
          </button>
        ))}
      </div>
      <p className={`prediction-feedback ${answer === 'quarter' ? 'correct' : ''}`} role="status">
        {answer ? t(answer === 'quarter' ? 'correct' : 'incorrect') : t('predictionHint')}
      </p>
    </section>
  );
}
