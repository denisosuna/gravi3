'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/constants/routes';
import { useSessionMemory } from '@/shared/ui/providers';
import {
  CALIBRATION_QUESTIONS,
  scoreCalibration,
  type Answers,
  type Level,
} from '../model/calibration';
import { LEVEL_SESSION } from '../model/level-session';
import { QuestionView } from './question-view';
import { ResultView } from './result-view';
import styles from './calibration.module.css';

const TOTAL = CALIBRATION_QUESTIONS.length;

// Five short questions, four of them about a 3D scene that stops before revealing the answer.
export function CalibrationFlow() {
  const t = useTranslations('calibration');
  const memory = useSessionMemory();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [playKey, setPlayKey] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const finished = index >= TOTAL;
  const result = scoreCalibration(answers);

  function chooseLevel(next: Level) {
    memory.set(LEVEL_SESSION, { level: next });
    setLevel(next);
  }

  function advance() {
    if (index + 1 >= TOTAL) chooseLevel(result.level);
    setIndex(index + 1);
    setPlayKey(playKey + 1);
  }

  function restart() {
    setAnswers({});
    setIndex(0);
    setPlayKey(playKey + 1);
  }

  if (finished)
    return (
      <ResultView
        result={result}
        level={level ?? result.level}
        onLevel={chooseLevel}
        onRepeat={restart}
      />
    );

  const question = CALIBRATION_QUESTIONS[index]!;
  const answer = answers[question.id];
  return (
    <div className={styles.flow}>
      <div className={styles.progressRow}>
        <span>{t('progress', { step: index + 1, total: TOTAL })}</span>
        <div
          className={styles.progress}
          role="progressbar"
          aria-label={t('progressLabel')}
          aria-valuemin={0}
          aria-valuemax={TOTAL}
          aria-valuenow={index + 1}
        >
          <span style={{ width: `${((index + 1) / TOTAL) * 100}%` }} />
        </div>
        <Link href={ROUTES.learn} className={styles.skip}>
          {t('skip')}
        </Link>
      </div>
      <QuestionView
        question={question}
        answer={answer}
        playKey={playKey}
        onAnswer={(option) => setAnswers({ ...answers, [question.id]: option })}
        onReplay={() => setPlayKey(playKey + 1)}
      />
      <div className={styles.actions}>
        {index > 0 ? (
          <button type="button" className="button" onClick={() => setIndex(index - 1)}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t('back')}
          </button>
        ) : null}
        <button type="button" className="button primary" disabled={!answer} onClick={advance}>
          {index + 1 >= TOTAL ? t('finish') : t('next')}
        </button>
      </div>
    </div>
  );
}
