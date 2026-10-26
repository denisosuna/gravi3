# Verification evidence

Checked on 26 October 2026. Results below distinguish automated checks, live provider calls and environment limits.

| Area          | Evidence                                                                                                                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Physics       | All six committed trajectories pass independent validation; see orbit-validation.json for exact return, conservation, convergence and interpolation metrics                                                                   |
| Unit/server   | 29 passing tests: force relationships, analytic/numerical reference, playback, strict input, limits, deadlines, concurrency, cancellation and log redaction                                                                   |
| Browser       | 20 passing desktop/mobile Chromium scenarios against production build; Spanish/English navigation, all six links, controls, state/focus, WebGL loss/retry, real camera retention and tutor UI failure modes                   |
| Accessibility | Automated axe WCAG A/AA checks on learning/detail in both themes at desktop/mobile sizes: no detected violations; primary button contrast corrected from 4.08:1 to 5.18:1                                                     |
| AI            | Real Groq API and browser checks in both languages; see tutor-evaluation.md. Browser/CI provider mocks are explicitly separate from live evidence                                                                             |
| Production    | Strict typecheck, lint and optimized standalone build pass; localized HTML lang, route title and canonical checked before JavaScript                                                                                          |
| Credentials   | Portable output stripped of traced env files; exact configured-key scan across 1,532 browser/standalone files found zero matches. Git and Docker context exclude env files, private PDF, design references and temporary plan |
| Dependencies  | Production pnpm audit reported no known vulnerabilities at the time of checking; this is not a comprehensive security audit                                                                                                   |

The camera regression compares paused canvas pixels before/after locale navigation after a deliberate rotation. A small tolerance permits GPU rasterization differences. It also asserts no browser page errors; sprite-based body numbers replace the HTML-portal lifecycle that failed this transition.

No real iPhone/Safari or Android device was available. Mobile results use Chromium emulation and do not establish physical-device frame rate. No hosted Render deployment is claimed: the owner chose to configure it. Docker Compose built from a clean Linux ARM64 dependency stage and started a healthy container on port 3100 as UID 1000. The image has no LLM key or env files; runtime-only injection enables real tutor responses. A second container without env files reported tutorEnabled=false and displayed reduced mode. Pages, JSON trajectories, SVG previews, sitemap and social image returned HTTP 200.

On the available Mac host, headless Chromium reading the Docker service recorded median RAF interval 16.7 ms, p95 16.8 ms and about 59.4 callbacks/s during playback. This is a browser frame-pacing observation, not a physical mobile-device GPU benchmark. The recorded script resource bodies for a detail visit totaled 453,529 encoded bytes; each trajectory remains below the separate 150 KiB gzip budget. A reference budget of 600 KiB encoded script bodies for the 3D detail leaves room above this observation.

The social-image check detected an unwanted locale redirect; excluding the metadata endpoint from the locale proxy fixed the route, and a browser HTTP regression now checks its PNG response.

Final Docker verification also ran all 20 browser scenarios directly against the container. A keyless instance respected PORT=10000. A separate runtime APP_URL=https://gravi3.example correctly changed both canonical and Open Graph image URLs without rebuilding. The final image scan checked 1,511 files, found zero exact credential matches, and found no env files. Test-only containers are removed after verification.
