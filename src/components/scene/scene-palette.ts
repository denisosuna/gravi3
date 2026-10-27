export type ScenePalette = {
  bodies: readonly [string, string, string];
  gridCenter: string;
  grid: string;
  pathOpacity: number;
  ruler: string;
};

const DARK: ScenePalette = {
  bodies: ['#6abaff', '#ffbf67', '#c58bff'],
  gridCenter: '#263e5a',
  grid: '#16283e',
  pathOpacity: 0.18,
  ruler: '#8da3c7',
};

const LIGHT: ScenePalette = {
  bodies: ['#286bdb', '#b36c09', '#8b42df'],
  gridCenter: '#bbd0ed',
  grid: '#dae5f5',
  pathOpacity: 0.35,
  ruler: '#586886',
};

export function scenePalette(dark: boolean): ScenePalette {
  return dark ? DARK : LIGHT;
}
