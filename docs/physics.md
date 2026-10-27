# Numerical model and acceptance criteria

The gallery uses planar Newtonian point masses with `G = 1` and three unit masses. Positions are followed by velocities in each twelve-component state. No gravitational softening is applied. Close encounters below the numeric safety threshold fail explicitly.

The learning laboratory uses SI units and `G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻²`. Visual body radii are illustrative. Equal and opposite forces do not imply equal acceleration when masses differ.

## Integrator

An explicit Dormand–Prince 5(4) pair estimates local error using the embedded fourth-order solution. Each component is scaled by `tolerance * (1 + max(abs(previous), abs(next)))`. Steps are bounded and an iteration budget prevents an indefinite run. This adaptive method is not symplectic; accuracy is assessed over one period and playback loops a validated period instead of integrating indefinitely.

## Lagrange's analytic solution

Lagrange (1772) found that three bodies at the vertices of a rotating equilateral triangle form an exact solution. The equilateral circular Lagrange solution provides an analytic reference. For radius one and equal unit masses, side length is `sqrt(3)`, centripetal acceleration is `1/sqrt(3)`, angular speed is `3^(-1/4)`, and period is `2π / omega`. Initial velocities are a quarter-turn of positions multiplied by omega.

## Acceptance thresholds

These thresholds are fixed before final catalog generation. Values are in normalized units, not a universal accuracy guarantee:

| Quantity                                                             | Maximum accepted error |
| -------------------------------------------------------------------- | ---------------------- |
| Labeled position/velocity return, each component                     | `1e-6`                 |
| Relative energy drift over the sampled integration                   | `1e-8`                 |
| Absolute linear/angular momentum and center-of-mass drift            | `1e-8`                 |
| Endpoint convergence between local tolerances `1e-11` and `1e-12`    | `1e-7`                 |
| Cubic Hermite position interpolation against finer reference samples | `1e-5`                 |

Zero conserved quantities are assessed with absolute errors, not division by zero. Reported checks are numerical evidence at finite samples. They do not prove mathematical periodicity or stability. Full-period position and velocity return retains body labels; no endpoint blending hides a failed return.

## Playback

Adaptive samples retain both time and velocity. Cubic Hermite interpolation reconstructs positions between neighboring samples. A binary search finds the interval, and the renderer writes into a reused output buffer. Camera projection, playback speed and display radii do not change the physical solution.

## Catalog provenance and generated results

Conditions and periods come from [Li and Liao’s primary numerical movie catalog](https://numericaltank.sjtu.edu.cn/three-body/three-body-movies.htm). Family/name correspondence is given in [their supplementary Table S1](https://arxiv.org/html/1705.00527v4); original names appear in [Šuvakov and Dmitrašinović, Table I](https://arxiv.org/html/1303.0181v1). The figure eight is also described by [Montgomery, with Simó’s conditions in a different orientation/scale](https://people.ucsc.edu/~rmont/NbdyB.html). We do not mix those normalizations.

All five numerical seeds use positions `(-1,0), (1,0), (0,0)` and velocities `(vx,vy), (vx,vy), (-2vx,-2vy)`. `src/data/orbits.ts` records the exact ten-decimal catalog values and periods. Yin-Yang I uses the representation corresponding to original II.C.2b; alternate II.C.2a is related by scale and phase, not an extra gallery solution. Lagrange is derived analytically above; with equal masses it is periodic but linearly unstable, so a live integration drifts away from it after a few turns. No third-party code, illustrations or animation files are copied. Numeric scientific facts are attributed to their authors; no software license is claimed for their website.

Run `pnpm orbits:generate` to integrate and regenerate trajectories, SVG previews and [the machine-readable report](orbit-validation.json). Run `pnpm orbits:validate` to independently check committed data against a finer integration. Generation is offline and deterministic for the pinned runtime. CI validates committed data and does not regenerate them during a web build.

Adaptive integration samples are compressed by splitting Hermite intervals until position error against retained integration nodes is at most `1e-6` and each span is at most `T/128`. The final, serialized trajectories are then tested against an independent `1e-13` integration, including samples between saved nodes. This empirical interpolation test has acceptance limit `1e-5`. No reduction in scientific state precision is applied. SVG previews sample those validated trajectories.

Initial measured resource budget: each trajectory must remain below 150 KiB gzip, only one is loaded for a detail, and previews use static SVG. Current files range from about 19–115 KB gzip. The report records exact sizes, sample counts, return, conservation, convergence and interpolation errors per solution. Frame-rate and device measurements are separate UI checks.

These are periodic solutions, not claims of universal dynamical stability. Three-dimensional camera movement does not turn these planar solutions into spatial orbits.
