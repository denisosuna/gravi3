import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { UNITS, type Experiment } from '@/features/learning/model/experiment';
import { forceLabLayout } from './force-lab-layout';

// Same logarithmic arrow scale as the 3D laboratory, converted from world units to SVG pixels.
const ARROW_PIXELS_PER_UNIT = 60;

export function ForceDiagram({ experiment, force }: { experiment: Experiment; force: number }) {
  const t = useTranslations('learn');
  const locale = useLocale();
  const id = useId();
  const left = 320 - experiment.distance * 10;
  const right = 320 + experiment.distance * 10;
  const radius1 = 12 + experiment.mass1 / 160;
  const radius2 = 12 + experiment.mass2 / 160;
  const format = new Intl.NumberFormat(locale);
  const arrow = forceLabLayout(experiment, force).arrowLength * ARROW_PIXELS_PER_UNIT;
  return (
    <svg viewBox="0 0 640 265" role="img" aria-label={t('equal')}>
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
      <text x={left} y="56" textAnchor="middle" fill="var(--text)" fontSize="12">
        m₁ · {format.format(experiment.mass1)} {UNITS.mass}
      </text>
      <text x={right} y="56" textAnchor="middle" fill="var(--text)" fontSize="12">
        m₂ · {format.format(experiment.mass2)} {UNITS.mass}
      </text>
      <line x1={left} y1="192" x2={right} y2="192" stroke="var(--muted)" />
      <line x1={left} y1="187" x2={left} y2="197" stroke="var(--muted)" />
      <line x1={right} y1="187" x2={right} y2="197" stroke="var(--muted)" />
      <text x="320" y="220" textAnchor="middle" fill="var(--muted)" fontSize="12">
        r = {format.format(experiment.distance)} {UNITS.distance}
      </text>
    </svg>
  );
}
