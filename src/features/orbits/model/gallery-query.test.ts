import { describe, expect, it } from 'vitest';
import { ORBIT_CATALOG, orbits } from '@/physics/orbit-catalog';
import {
  DEFAULT_GALLERY_QUERY,
  galleryHref,
  MAX_COMPARED,
  parseGalleryQuery,
  selectOrbits,
  toggleCompared,
} from './gallery-query';

describe('gallery query', () => {
  it('reads valid parameters and ignores invalid ones instead of failing', () => {
    expect(parseGalleryQuery({ family: 'I.B', sort: 'period', compare: 'goggles,moth-i' })).toEqual(
      { family: 'I.B', sort: 'period', compare: ['goggles', 'moth-i'] },
    );
    expect(parseGalleryQuery({ family: 'X', sort: 'colour', compare: 'mars,lagrange' })).toEqual({
      sort: 'catalog',
      compare: ['lagrange'],
    });
    expect(parseGalleryQuery({})).toEqual(DEFAULT_GALLERY_QUERY);
  });

  it('keeps comparison order, drops duplicates and caps the selection', () => {
    const query = parseGalleryQuery({
      compare: 'moth-i,lagrange,moth-i,goggles,figure-eight',
    });
    expect(query.compare).toEqual(['moth-i', 'lagrange', 'goggles']);
    expect(query.compare).toHaveLength(MAX_COMPARED);
  });

  it('filters by class and sorts by period or discovery year', () => {
    expect(
      selectOrbits({ family: 'I.A', sort: 'catalog', compare: [] }).map((o) => o.slug),
    ).toEqual(['figure-eight', 'butterfly-i']);
    const byPeriod = selectOrbits({ sort: 'period', compare: [] }).map((orbit) => orbit.period);
    expect(byPeriod).toEqual([...byPeriod].sort((a, b) => a - b));
    const byYear = selectOrbits({ sort: 'year', compare: [] }).map(
      (orbit) => ORBIT_CATALOG[orbit.slug].discovery.year,
    );
    expect(byYear[0]).toBe(1772);
    expect(selectOrbits(DEFAULT_GALLERY_QUERY)).toEqual(orbits);
  });

  it('toggles orbits in the comparison and writes compact URLs', () => {
    const added = toggleCompared(DEFAULT_GALLERY_QUERY, 'goggles');
    expect(added.compare).toEqual(['goggles']);
    expect(toggleCompared(added, 'goggles').compare).toEqual([]);
    expect(galleryHref(DEFAULT_GALLERY_QUERY)).toBe('/orbits');
    expect(galleryHref({ family: 'II.C', sort: 'year', compare: ['yin-yang-i', 'lagrange'] })).toBe(
      '/orbits?family=II.C&sort=year&compare=yin-yang-i%2Clagrange',
    );
  });

  it('describes every orbit in the catalogue', () => {
    for (const orbit of orbits) expect(ORBIT_CATALOG[orbit.slug].discovery.year).toBeGreaterThan(0);
  });
});
