import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { UNITS, type Experiment } from '@/features/learning/model/experiment';
import { forceLabLayout } from './force-lab-layout';
import { numberFormat } from '@/shared/i18n/number-format';

// Same logarithmic arrow scale as the 3D laboratory, converted from world units to SVG pixels.
const ARROW_PIXELS_PER_UNIT = 60;
// The SVG is scaled down to about half on phones, so text and bodies are drawn large.
const LABEL_FONT_SIZE = 24;
const RADIUS_BASE = 18;
const RADIUS_PER_KG = 1 / 80;
// Both bodies together fill at most this share of their separation, so they never touch.
const MAX_SEPARATION_FILL = 0.8;

export function ForceDiagram({ experiment, force }: { experiment: Experiment; force: number }) {
  const t = useTranslations('learn');
  const locale = useLocale();
  const id = useId();
  const left = 320 - experiment.distance * 10;
  const right = 320 + experiment.distance * 10;
  const natural1 = RADIUS_BASE + experiment.mass1 * RADIUS_PER_KG;
  const natural2 = RADIUS_BASE + experiment.mass2 * RADIUS_PER_KG;
  const shrink = Math.min(1, (MAX_SEPARATION_FILL * (right - left)) / (natural1 + natural2));
  const radius1 = natural1 * shrink;
  const radius2 = natural2 * shrink;
  const format = numberFormat(locale);
  const arrow = forceLabLayout(experiment, force).arrowLength * ARROW_PIXELS_PER_UNIT;
  return (
    <svg viewBox="0 0 640 250" role="img" aria-label={t('equal')}>
      <defs>
        <marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8" fill="currentColor" />
        </marker>
      </defs>
      <line x1="60" y1="131" x2="580" y2="131" stroke="var(--line)" strokeDasharray="3 7" />
      <circle cx={left} cy="130" r={radius1 + 14} fill="var(--body-1)" opacity=".08" />
      <circle cx={right} cy="130" r={radius2 + 14} fill="var(--body-2)" opacity=".08" />
      <circle cx={left} cy="130" r={radius1} fill="var(--body-1)" />
      <circle cx={right} cy="130" r={radius2} fill="var(--body-2)" />
      <g color="var(--muted)">
        <line
          x1={left}
          y1="87"
          x2={left + arrow}
          y2="87"
          stroke="currentColor"
          strokeWidth="2"
          markerEnd={`url(#${id}-arrow)`}
        />
        <line
          x1={right}
          y1="173"
          x2={right - arrow}
          y2="173"
          stroke="currentColor"
          strokeWidth="2"
          markerEnd={`url(#${id}-arrow)`}
        />
      </g>
      <text x={left} y="30" textAnchor="end" fill="var(--text)" fontSize={LABEL_FONT_SIZE}>
        <tspan x={left}>m₁</tspan>
        <tspan x={left} dy="1.15em">
          {format.format(experiment.mass1)} {UNITS.mass}
        </tspan>
      </text>
      <text x={right} y="30" textAnchor="start" fill="var(--text)" fontSize={LABEL_FONT_SIZE}>
        <tspan x={right}>m₂</tspan>
        <tspan x={right} dy="1.15em">
          {format.format(experiment.mass2)} {UNITS.mass}
        </tspan>
      </text>
      <line x1={left} y1="192" x2={right} y2="192" stroke="var(--muted)" />
      <line x1={left} y1="187" x2={left} y2="197" stroke="var(--muted)" />
      <line x1={right} y1="187" x2={right} y2="197" stroke="var(--muted)" />
      <text x="320" y="238" textAnchor="middle" fill="var(--muted)" fontSize={LABEL_FONT_SIZE}>
        r = {format.format(experiment.distance)} {UNITS.distance}
      </text>
    </svg>
  );
}
