import { useLocale, useTranslations } from 'next-intl';
import { FlaskConical } from 'lucide-react';
import { UNITS } from '@/data/experiment';
import type { TutorAction } from '@/data/tutor-actions';

function useActionLabel() {
  const t = useTranslations('tutor.actions');
  const simulator = useTranslations('simulator.preset');
  const orbits = useTranslations('orbits');
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: 'percent' });
  return (action: TutorAction): string => {
    switch (action.type) {
      case 'setExperiment': {
        const changes = [
          action.mass1 !== undefined && `m₁ = ${number.format(action.mass1)} ${UNITS.mass}`,
          action.mass2 !== undefined && `m₂ = ${number.format(action.mass2)} ${UNITS.mass}`,
          action.distance !== undefined &&
            `r = ${number.format(action.distance)} ${UNITS.distance}`,
        ];
        return t('setExperiment', { changes: changes.filter(Boolean).join(', ') });
      }
      case 'loadPreset':
        return t('loadPreset', { preset: simulator(`${action.preset}.name`) });
      case 'perturb':
        return t('perturb');
      case 'openOrbit':
        return t('openOrbit', { name: orbits(`${action.slug}.name`) });
      case 'seekOrbit':
        return t('seekOrbit', { moment: percent.format(action.fraction) });
      case 'setOrbitSpeed':
        return t('setOrbitSpeed', { speed: number.format(action.speed) });
    }
  };
}

export function TutorActionButtons({
  actions,
  onRun,
}: {
  actions: readonly TutorAction[];
  onRun: (action: TutorAction) => void;
}) {
  const t = useTranslations('tutor');
  const label = useActionLabel();
  if (actions.length === 0) return null;
  return (
    <ul className="tutor-actions" aria-label={t('actionsLabel')}>
      {actions.map((action) => (
        <li key={JSON.stringify(action)}>
          <button className="button primary tutor-action" onClick={() => onRun(action)}>
            <FlaskConical size={14} aria-hidden="true" />
            {label(action)}
          </button>
        </li>
      ))}
    </ul>
  );
}
