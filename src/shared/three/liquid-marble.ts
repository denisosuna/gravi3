import { Color, MeshPhysicalMaterial } from 'three';

export interface LiquidColors {
  deep: string;
  base: string;
  light: string;
  vein: string;
}

// One palette per body. The base keeps the Okabe-Ito hue of each body so they stay distinguishable.
export const LIQUID_BODIES: readonly [LiquidColors, LiquidColors, LiquidColors] = [
  { deep: '#140d48', base: '#3d8bff', light: '#bff0ff', vein: '#7a4dff' },
  { deep: '#3a0f1f', base: '#ff9a3d', light: '#ffe7b3', vein: '#e2479a' },
  { deep: '#04241f', base: '#1fc59b', light: '#c4ffe9', vein: '#2a7fe0' },
];

// Swirl size and speed of the marble, and how far the surface ripples, relative to the radius.
const MARBLE_SCALE = 1.6;
const SWIRL_SPEED = 0.12;
const RIPPLE_SPEED = 0.35;
const RIPPLE_AMPLITUDE = 0.06;
const EMISSIVE_SHARE = 0.22;

// Value noise and a four-octave sum: cheap, smooth, and enough for a slow liquid swirl.
const NOISE_GLSL = /* glsl */ `
uniform float uTime;
uniform float uRadius;
varying vec3 vMarble;
float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fbm3(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise3(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}
`;

// One clock for every liquid body on the page, in seconds, so bodies in different canvases stay in step.
export const liquidTime = { value: 0 };

// Materials are built for a unit sphere and bodies are scaled, so one material per colour serves every
// size and every canvas. They are never disposed: rebuilding one would recompile its heavy shader.
const UNIT_RADIUS = 1;
const materials = new Map<LiquidColors, MeshPhysicalMaterial>();

export function liquidMaterial(colors: LiquidColors): MeshPhysicalMaterial {
  const cached = materials.get(colors);
  if (cached) return cached;
  const material = createLiquidMaterial(colors);
  materials.set(colors, material);
  return material;
}

// A glossy physical material whose colour is a flowing marble and whose surface ripples slightly.
// The ripple is cosmetic: positions in the scene still come from the physics.
function createLiquidMaterial(colors: LiquidColors): MeshPhysicalMaterial {
  const uniforms = {
    uTime: liquidTime,
    uRadius: { value: UNIT_RADIUS },
    uRipple: { value: UNIT_RADIUS * RIPPLE_AMPLITUDE },
    uDeep: { value: new Color(colors.deep) },
    uBase: { value: new Color(colors.base) },
    uLight: { value: new Color(colors.light) },
    uVein: { value: new Color(colors.vein) },
  };
  const material = new MeshPhysicalMaterial({
    roughness: 0.16,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 0.35,
    emissive: new Color(colors.base).multiplyScalar(EMISSIVE_SHARE),
  });
  material.customProgramCacheKey = () => 'liquid-marble';
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `uniform float uRipple;\n${NOISE_GLSL}\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vMarble = position / uRadius;
      float ripple = noise3(vMarble * 2.2 + vec3(uTime * ${RIPPLE_SPEED.toFixed(2)}));
      transformed += normal * (ripple - 0.5) * uRipple;`,
    );
    shader.fragmentShader =
      `uniform vec3 uDeep;\nuniform vec3 uBase;\nuniform vec3 uLight;\nuniform vec3 uVein;\n${NOISE_GLSL}\n${shader.fragmentShader}`.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 p = vMarble * ${MARBLE_SCALE.toFixed(2)};
        float warp = fbm3(p + vec3(0.0, uTime * ${SWIRL_SPEED.toFixed(2)}, 0.0));
        float m = fbm3(p * 1.7 + vec3(warp * 2.4) + vec3(uTime * ${(SWIRL_SPEED * 0.7).toFixed(3)}));
        vec3 marble = mix(uDeep, uBase, smoothstep(0.28, 0.55, m));
        marble = mix(marble, uLight, smoothstep(0.6, 0.82, m));
        marble = mix(marble, uVein, (smoothstep(0.44, 0.48, m) - smoothstep(0.5, 0.56, m)) * 0.6);
        diffuseColor.rgb = marble;`,
      );
  };
  return material;
}
