# Numerical model and acceptance criteria

The gallery uses planar Newtonian point masses with `G = 1` and three unit masses. Positions are followed by velocities in each twelve-component state. No gravitational softening is applied. Close encounters below the numeric safety threshold fail explicitly.

The learning laboratory uses SI units and `G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻²`. Visual body radii are illustrative. Equal and opposite forces do not imply equal acceleration when masses differ.

## Integrator

An explicit Dormand–Prince 5(4) pair estimates local error using the embedded fourth-order solution. Each component is scaled by `tolerance * (1 + max(abs(previous), abs(next)))`. Steps are bounded and an iteration budget prevents an indefinite run. This adaptive method is not symplectic; accuracy is assessed over one period and playback loops a validated period instead of integrating indefinitely.

The equilateral circular Lagrange solution provides an analytic reference. For radius one and equal unit masses, side length is `sqrt(3)`, centripetal acceleration is `1/sqrt(3)`, angular speed is `3^(-1/4)`, and period is `2π / omega`. Initial velocities are a quarter-turn of positions multiplied by omega.

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

Generated trajectories, source variants, resource sizes, convergence and validation results are added in the catalog phase.
