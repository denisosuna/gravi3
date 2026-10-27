import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { TutorContext } from '@/data/tutor-contract';

const questionsSchema = z.array(z.string().min(1));
const questionSchema = z.string().min(1);

export function TutorSuggestions({
  context,
  disabled,
  onAsk,
}: {
  context: TutorContext;
  disabled: boolean;
  onAsk: (question: string) => void;
}) {
  const t = useTranslations('tutor');
  const questions = questionsSchema.parse(t.raw(`suggestions.${context.kind}`));
  const contextualQuestion =
    context.kind === 'orbit'
      ? questionSchema.parse(t.raw(`suggestions.orbitContext.${context.slug}`))
      : null;
  const visibleQuestions = contextualQuestion
    ? [...questions.slice(0, -1), contextualQuestion]
    : questions;
  return (
    <ul className="tutor-suggestions" aria-label={t('suggestionsLabel')}>
      {visibleQuestions.map((question) => (
        <li key={question}>
          <button className="suggestion-button" disabled={disabled} onClick={() => onAsk(question)}>
            {question}
          </button>
        </li>
      ))}
    </ul>
  );
}
