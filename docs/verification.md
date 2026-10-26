# Verification evidence

Checked on 26 October 2026. Results below distinguish automated checks, live provider calls and environment limits.

| Area          | Evidence                                                                                                                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Physics       | All six committed trajectories pass independent validation; see orbit-validation.json for exact return, conservation, convergence and interpolation metrics                                                                   |
| Unit/server   | 28 passing tests: force relationships, analytic/numerical reference, playback, strict input, limits, deadlines, concurrency, cancellation and log redaction                                                                   |
| Browser       | 20 passing desktop/mobile Chromium scenarios against production build; Spanish/English navigation, all six links, controls, state/focus, WebGL loss/retry, real camera retention and tutor UI failure modes                   |
| Accessibility | Automated axe WCAG A/AA checks on learning/detail in both themes at desktop/mobile sizes: no detected violations; primary button contrast corrected from 4.08:1 to 5.18:1                                                     |
| AI            | Real Groq API and browser checks in both languages; see tutor-evaluation.md. Browser/CI provider mocks are explicitly separate from live evidence                                                                             |
| Production    | Strict typecheck, lint and optimized standalone build pass; localized HTML lang, route title and canonical checked before JavaScript                                                                                          |
| Credentials   | Portable output stripped of traced env files; exact configured-key scan across 1,532 browser/standalone files found zero matches. Git and Docker context exclude env files, private PDF, design references and temporary plan |
| Dependencies  | Production pnpm audit reported no known vulnerabilities at the time of checking; this is not a comprehensive security audit                                                                                                   |

The camera regression compares paused canvas pixels before/after locale navigation after a deliberate rotation. A small tolerance permits GPU rasterization differences. It also asserts no browser page errors; sprite-based body numbers replace the HTML-portal lifecycle that failed this transition.

No real iPhone/Safari or Android device was available. Mobile results use Chromium emulation and do not establish physical-device frame rate. No hosted Render deployment is claimed: the owner chose to configure it. Docker/container checks and resource measurements are recorded when packaging is completed.
