'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Experiment } from '@/data/experiment';

export function ForceDiagram({ experiment }: { experiment: Experiment }) {
  const t = useTranslations('learn');
  const locale = useLocale();
  const id = useId();
  const left = 320 - experiment.distance * 10;
  const right = 320 + experiment.distance * 10;
  const radius1 = 12 + experiment.mass1 / 160;
  const radius2 = 12 + experiment.mass2 / 160;
  const format = new Intl.NumberFormat(locale);
  return (
    <figure className="force-diagram">
      <svg viewBox="0 0 640 265" role="img" aria-label={t('equal')}>
        <defs>
          <radialGradient id={`${id}-blue`} cx="30%" cy="25%">
            <stop stopColor="#bae3ff" />
            <stop offset="1" stopColor="#347bda" />
          </radialGradient>
          <radialGradient id={`${id}-amber`} cx="30%" cy="25%">
            <stop stopColor="#ffdfad" />
            <stop offset="1" stopColor="#c27a20" />
          </radialGradient>
          <marker
            id={`${id}-arrow`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8" fill="currentColor" />
          </marker>
        </defs>
        <line x1="60" y1="131" x2="580" y2="131" stroke="var(--line)" strokeDasharray="3 7" />
        <circle cx={left} cy="130" r={radius1 + 14} fill="var(--blue)" opacity=".045" />
        <circle cx={right} cy="130" r={radius2 + 14} fill="var(--amber)" opacity=".045" />
        <circle cx={left} cy="130" r={radius1} fill={`url(#${id}-blue)`} />
        <circle cx={right} cy="130" r={radius2} fill={`url(#${id}-amber)`} />
        <g color="var(--muted)">
          <line
            x1={left}
            y1="87"
            x2={left + experiment.distance * 6}
            y2="87"
            stroke="currentColor"
            strokeWidth="2"
            markerEnd={`url(#${id}-arrow)`}
          />
          <line
            x1={right}
            y1="87"
            x2={right - experiment.distance * 6}
            y2="87"
            stroke="currentColor"
            strokeWidth="2"
            markerEnd={`url(#${id}-arrow)`}
          />
        </g>
        <text x={left} y="56" textAnchor="middle" fill="var(--text)" fontSize="12">
          m₁ · {format.format(experiment.mass1)} kg
        </text>
        <text x={right} y="56" textAnchor="middle" fill="var(--text)" fontSize="12">
          m₂ · {format.format(experiment.mass2)} kg
        </text>
        <line x1={left} y1="192" x2={right} y2="192" stroke="var(--muted)" />
        <line x1={left} y1="187" x2={left} y2="197" stroke="var(--muted)" />
        <line x1={right} y1="187" x2={right} y2="197" stroke="var(--muted)" />
        <text x="320" y="220" textAnchor="middle" fill="var(--muted)" fontSize="12">
          r = {format.format(experiment.distance)} m
        </text>
      </svg>
      <figcaption>{t('scale')}</figcaption>
    </figure>
  );
}
