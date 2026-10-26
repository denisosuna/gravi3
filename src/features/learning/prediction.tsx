import { useTranslations } from 'next-intl';
import { Lightbulb } from 'lucide-react';
import { CORRECT_PREDICTION, PREDICTIONS, type PredictionAnswer } from '@/data/experiment';

export function Prediction({
  answer,
  onAnswer,
}: {
  answer: PredictionAnswer | null;
  onAnswer: (answer: PredictionAnswer) => void;
}) {
  const t = useTranslations('learn');
  const isCorrect = answer === CORRECT_PREDICTION;
  return (
    <section className="prediction-panel">
      <div className="eyebrow">{t('step2')}</div>
      <h2>
        <Lightbulb size={18} />
        {t('predictionTitle')}
      </h2>
      <p>{t('predictionQuestion')}</p>
      <div className="prediction-options">
        {PREDICTIONS.map((value) => (
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
      <p className={`prediction-feedback ${isCorrect ? 'correct' : ''}`} role="status">
        {answer ? t(isCorrect ? 'correct' : 'incorrect') : t('predictionHint')}
      </p>
    </section>
  );
}
