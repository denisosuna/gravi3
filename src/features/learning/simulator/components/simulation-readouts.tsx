import { useLocale, useTranslations } from 'next-intl';
import type { Readout } from '@/features/learning/model/level-presentation';
import type { SimulatorController } from '../state/simulator-controller';
import { useSimulatorState } from '../state/use-simulator-state';
import { numberFormat } from '@/shared/i18n/number-format';

const FRACTION_DIGITS = 3;
const ROUNDING = 10 ** FRACTION_DIGITS;

// Values like -1e-16 would otherwise print as "-0".
function withoutNegativeZero(value: number): number {
  return Math.round(value * ROUNDING) / ROUNDING + 0;
}

export function SimulationReadouts({
  controller,
  shown,
}: {
  controller: SimulatorController;
  shown: readonly Readout[];
}) {
  const t = useTranslations('simulator');
  const locale = useLocale();
  const time = useSimulatorState(controller, (state) => state.time);
  const diagnostics = useSimulatorState(controller, (state) => state.diagnostics);
  const number = numberFormat(locale, { maximumFractionDigits: FRACTION_DIGITS });
  const significant = numberFormat(locale, { maximumSignificantDigits: 4 });
  const percent = numberFormat(locale, { style: 'percent', maximumSignificantDigits: 2 });
  const [centerX, centerY] = diagnostics.centerOfMass;
  const rows = [
    ['time', number.format(time)],
    ['energy', significant.format(diagnostics.energy)],
    ['drift', percent.format(diagnostics.energyDrift)],
    [
      'center',
      `(${number.format(withoutNegativeZero(centerX))}; ${number.format(withoutNegativeZero(centerY))})`,
    ],
    ['separation', number.format(diagnostics.minimumSeparation)],
  ] as const satisfies readonly (readonly [Readout, string])[];
  if (shown.length === 0) return null;
  return (
    <section className="simulation-readouts" aria-label={t('readouts')}>
      <dl>
        {rows
          .filter(([key]) => shown.includes(key))
          .map(([key, value]) => (
            <div key={key}>
              <dt>{t(key)}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      <details>
        <summary>{t('readHelp')}</summary>
        <p>{t('readHelpText')}</p>
      </details>
    </section>
  );
}
