import { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import { SceneBoundary } from '@/shared/three/scene-boundary';
import type { CalibrationQuestion } from '../model/calibration';
import { sceneMotion } from '../model/scene-motions';
import { ANSWER_DRAWINGS } from './answer-drawings';
import styles from './calibration.module.css';

const CalibrationScene = dynamic(() => import('./calibration-scene'), { ssr: false });

export function QuestionView({
  question,
  answer,
  playKey,
  onAnswer,
  onReplay,
}: {
  question: CalibrationQuestion;
  answer: string | undefined;
  playKey: number;
  onAnswer: (option: string) => void;
  onReplay: () => void;
}) {
  const t = useTranslations('calibration');
  const heading = useRef<HTMLHeadingElement>(null);
  const motion = useMemo(() => (question.scene ? sceneMotion(question.scene) : null), [question]);
  // Each new question takes the focus, so keyboard and screen reader users start at its title.
  useEffect(() => heading.current?.focus(), [question.id]);
  return (
    <div className={styles.question}>
      {question.scene ? (
        <figure className={styles.scene}>
          <div className={styles.viewport} aria-hidden="true">
            <SceneBoundary fallback={null}>
              {motion ? <CalibrationScene motion={motion} playKey={playKey} /> : null}
            </SceneBoundary>
            {question.scene === 'fall' ? (
              <div key={playKey} className={styles.countdown} aria-hidden="true">
                <span>3</span>
                <span>2</span>
                <span>1</span>
                <span>?</span>
              </div>
            ) : null}
          </div>
          <figcaption>{t(`scenes.${question.scene}`)}</figcaption>
          <button type="button" className="button" onClick={onReplay}>
            <RotateCcw size={16} aria-hidden="true" />
            {t('replay')}
          </button>
        </figure>
      ) : null}
      <fieldset className={styles.panel}>
        <legend className={styles.legend}>
          <h1 ref={heading} tabIndex={-1}>
            {t(`questions.${question.id}.text`)}
          </h1>
        </legend>
        <div className={question.drawings ? styles.drawingOptions : styles.options}>
          {question.options.map((option) => (
            <label
              key={option}
              className={styles.option}
              data-checked={answer === option || undefined}
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={answer === option}
                onChange={() => onAnswer(option)}
              />
              {question.drawings && ANSWER_DRAWINGS[option] ? (
                <span className={styles.drawing}>{ANSWER_DRAWINGS[option]}</span>
              ) : null}
              <span>{t(`questions.${question.id}.options.${option}`)}</span>
            </label>
          ))}
        </div>
        <p className={styles.note}>{t('noGrade')}</p>
      </fieldset>
    </div>
  );
}
