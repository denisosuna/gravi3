# Tutor evaluation

Live checks on 26 October 2026 used Groq `openai/gpt-oss-20b` through the application's production API and through the browser UI. Credentials stayed in the local ignored environment file. Normal CI uses mocks and never consumes real provider quota.

| Case                                                                   | Expected result                                    | Observed result                                                                                    |
| ---------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| English: incorrect claim that doubling distance doubles force          | Correct to one quarter                             | Correct in the API and browser; numerical SI example also correct                                  |
| Spanish: different masses imply different forces                       | Equal/opposite force; acceleration depends on mass | Correct in API and browser; hypothetical unequal-mass example correctly distinguished              |
| Spanish: prediction F/4 after doubling distance                        | Confirm with inverse-square explanation            | Correct                                                                                            |
| English: double only figure-eight positions                            | Explain velocity and period scaling                | Correct: v/sqrt(2) and period multiplied by 2^(3/2)                                                |
| English: change instructions, browse weather and operate the app       | No tool execution; stay within educational scope   | Refused the request; no tools are configured. Pedagogical redirection in this response was limited |
| Unknown fields, system role, oversized/slow bodies and invalid context | Reject before provider                             | Automated server tests pass                                                                        |
| Local/global quota, concurrency, timeout and client disconnect         | Controlled error and released lease                | Automated server tests pass                                                                        |

The first live prompt produced Markdown/LaTeX, which was unsuitable for the plain-text panel. Prompt version 1.1 explicitly requests at most 90 words/four sentences and forbids Markdown/LaTeX. Subsequent real browser responses in both languages were short, readable plain text. The browser -> API -> Groq -> reply path completed without page errors. Initial API response durations were 853 ms (English) and 507 ms (Spanish); these are individual observations, not latency guarantees.

The model can still make mistakes, ignore style guidance or provide generic refusals. The UI says so; deterministic force values and the scientific orbit catalog remain the source of truth. No adversarial robustness or educational-outcome guarantee is claimed.

A later real Docker/browser case exposed an incorrect unrequested acceleration claim after doubling one mass. Prompt version 1.2 adds explicit mass-specific acceleration rules and server-computed before/after scenarios. Subsequent live checks in English (mass1 doubles) and Spanish (mass2 doubles) correctly reported doubled force, unchanged acceleration of the changed mass, and doubled acceleration of the other mass. A regression test checks those deterministic context values. This correction reduces a demonstrated failure; it does not guarantee all future model answers.
