import { useTranslations } from 'next-intl';
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
    <div className="prediction-panel">
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
    </div>
  );
}
