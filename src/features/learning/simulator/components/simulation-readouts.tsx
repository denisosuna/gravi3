import { useLocale, useTranslations } from 'next-intl';
import type { SimulatorController } from '../state/simulator-controller';
import { useSimulatorState } from '../state/use-simulator-state';

const FRACTION_DIGITS = 3;
const ROUNDING = 10 ** FRACTION_DIGITS;

// Values like -1e-16 would otherwise print as "-0".
function withoutNegativeZero(value: number): number {
  return Math.round(value * ROUNDING) / ROUNDING + 0;
}

export function SimulationReadouts({ controller }: { controller: SimulatorController }) {
  const t = useTranslations('simulator');
  const locale = useLocale();
  const time = useSimulatorState(controller, (state) => state.time);
  const diagnostics = useSimulatorState(controller, (state) => state.diagnostics);
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: FRACTION_DIGITS });
  const significant = new Intl.NumberFormat(locale, { maximumSignificantDigits: 4 });
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumSignificantDigits: 2 });
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
  ] as const;
  return (
    <section className="simulation-readouts" aria-label={t('readouts')}>
      <dl>
        {rows.map(([key, value]) => (
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
