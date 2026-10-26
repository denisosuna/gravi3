export type ScenePalette = {
  bodies: readonly [string, string, string];
  gridCenter: string;
  grid: string;
  pathOpacity: number;
};

const DARK: ScenePalette = {
  bodies: ['#6abaff', '#ffbf67', '#c58bff'],
  gridCenter: '#263e5a',
  grid: '#16283e',
  pathOpacity: 0.18,
};

const LIGHT: ScenePalette = {
  bodies: ['#286bdb', '#b36c09', '#8b42df'],
  gridCenter: '#bbd0ed',
  grid: '#dae5f5',
  pathOpacity: 0.35,
};

export function scenePalette(dark: boolean): ScenePalette {
  return dark ? DARK : LIGHT;
}
