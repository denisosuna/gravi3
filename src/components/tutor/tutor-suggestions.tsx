import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { TutorContextKind } from '@/data/tutor-actions';

const questionsSchema = z.array(z.string().min(1));

export function TutorSuggestions({
  kind,
  disabled,
  onAsk,
}: {
  kind: TutorContextKind;
  disabled: boolean;
  onAsk: (question: string) => void;
}) {
  const t = useTranslations('tutor');
  const questions = questionsSchema.parse(t.raw(`suggestions.${kind}`));
  return (
    <ul className="tutor-suggestions" aria-label={t('suggestionsLabel')}>
      {questions.map((question) => (
        <li key={question}>
          <button className="suggestion-button" disabled={disabled} onClick={() => onAsk(question)}>
            {question}
          </button>
        </li>
      ))}
    </ul>
  );
}
