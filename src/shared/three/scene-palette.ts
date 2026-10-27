type ScenePalette = {
  bodies: readonly [string, string, string];
  gridCenter: string;
  grid: string;
  pathOpacity: number;
  ruler: string;
};

const DARK: ScenePalette = {
  bodies: ['#56b4e9', '#e69f00', '#2fbf8f'],
  gridCenter: '#2b3a55',
  grid: '#1b2538',
  pathOpacity: 0.18,
  ruler: '#a7b1c5',
};

const LIGHT: ScenePalette = {
  bodies: ['#0072b2', '#d55e00', '#009e73'],
  gridCenter: '#c3d2e6',
  grid: '#e2e9f3',
  pathOpacity: 0.35,
  ruler: '#4f5a72',
};

export function scenePalette(dark: boolean): ScenePalette {
  return dark ? DARK : LIGHT;
}
