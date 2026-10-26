import { useTranslations } from 'next-intl';
import type { TutorContextKind } from '@/data/tutor-actions';

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
  const questions = t.raw(`suggestions.${kind}`) as string[];
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
