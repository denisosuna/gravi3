import { useLocale, useTranslations } from 'next-intl';
import { MASS_RANGE, VELOCITY_RANGE } from '@/data/simulator-presets';
import { BODY_INDICES, bodyVelocity } from '@/physics/types';
import type { BodyEdit, SimulatorController } from './simulator-controller';
import { useSimulatorState } from './use-simulator-state';

interface SliderScale {
  min: number;
  max: number;
  step: number;
  toSlider: (value: number) => number;
  fromSlider: (position: number) => number;
}

// Masses span four orders of magnitude (a moon to a star), so their slider is logarithmic.
const MASS_SCALE: SliderScale = {
  min: Math.log10(MASS_RANGE.min),
  max: Math.log10(MASS_RANGE.max),
  step: 0.01,
  toSlider: Math.log10,
  fromSlider: (position) => Number((10 ** position).toPrecision(3)),
};

const VELOCITY_SCALE: SliderScale = {
  ...VELOCITY_RANGE,
  toSlider: (value) => value,
  fromSlider: (position) => position,
};

export function BodyEditor({ controller }: { controller: SimulatorController }) {
  const t = useTranslations('simulator');
  const number = new Intl.NumberFormat(useLocale(), { maximumSignificantDigits: 4 });
  const setup = useSimulatorState(controller, (state) => state.setup);

  function field(body: number, key: keyof BodyEdit, value: number, scale: SliderScale) {
    return (
      <label key={key}>
        <span>
          {t(key)} <output>{number.format(value)}</output>
        </span>
        <input
          type="range"
          min={scale.min}
          max={scale.max}
          step={scale.step}
          value={scale.toSlider(value)}
          aria-valuetext={number.format(value)}
          onChange={(event) =>
            controller.editBody(body, { [key]: scale.fromSlider(Number(event.target.value)) })
          }
        />
      </label>
    );
  }

  return (
    <details className="body-editor">
      <summary>{t('editor')}</summary>
      <p>{t('editorHint')}</p>
      <div className="body-editor-grid">
        {BODY_INDICES.map((body) => {
          const [vx, vy] = bodyVelocity(setup.initialState, body);
          return (
            <fieldset key={body} className={`body-fieldset body-${body + 1}`}>
              <legend>{t('body', { number: body + 1 })}</legend>
              {field(body, 'mass', setup.masses[body]!, MASS_SCALE)}
              {field(body, 'vx', vx, VELOCITY_SCALE)}
              {field(body, 'vy', vy, VELOCITY_SCALE)}
            </fieldset>
          );
        })}
      </div>
    </details>
  );
}
