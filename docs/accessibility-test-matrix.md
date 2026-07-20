# Accessibility test matrix

> **Draft for review — not legal advice and not attorney approved.**

Target: WCAG 2.2 Level AA. This matrix records engineering checks and is not a
certification or substitute for evaluation by disabled users and an accessibility
specialist.

| Surface                   | Automated axe                                 | Keyboard                                          | Reflow/zoom                                                   | Screen reader                            | Status                                                       |
| ------------------------- | --------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| Public marketing routes   | Playwright route matrix                       | Navigation, dialogs, links, forms                 | 1440, 1024, 768, 430, 390, 375, 360, 320; browser zoom review | Browser semantics inspected              | Expanded; specialist review remains                          |
| Opportunity directory     | Axe plus named-search assertion               | Search/filter/details/actions                     | Required widths; 200% and 400% manual review                  | Search name/result status inspected      | Search accessible name fixed                                 |
| Opportunity detail        | Axe and definition semantics                  | Source, correction, sign-in/dashboard actions     | Required widths                                               | Heading/section/link semantics inspected | Third-party destinations out of scope                        |
| Sign-in/sign-up           | Axe where Clerk loads                         | Skip link and Clerk controls                      | Mobile/desktop                                                | Comprehensive Clerk AT review pending    | Third-party surface limitation                               |
| Student dashboard         | Authenticated smoke and ownership tests       | Core profile/resume/opportunity/application flows | Desktop and about 390px                                       | Partial only                             | VoiceOver unavailable on Windows; NVDA not installed         |
| Partner dashboard         | Role/organization authorization tests         | Core authorized routes when account available     | Desktop/mobile pending preview account                        | Not run                                  | No partner test account configured at baseline               |
| Admin dashboard           | Admin authorization and selected queue checks | Verification controls                             | Desktop/mobile                                                | Partial semantics inspection             | Full AT regression pending                                   |
| Uploaded resume documents | File controls and parsed HTML review          | Upload/replace/analyze controls                   | Responsive dashboard                                          | Original PDF/DOCX accessibility varies   | FP cannot repair source-document accessibility automatically |

## Required manual protocol

For each applicable route: navigate without a pointer; confirm visible focus,
logical focus order, escape behavior, skip link, headings/landmarks, control
names/descriptions/errors, status announcements, 200% zoom, 400% reflow, and no
two-dimensional scrolling at 320 CSS px except essential content. Repeat core
flows with NVDA/Firefox or NVDA/Chrome and VoiceOver/Safari when those platforms
are available. Record version, viewport, account role, PASS/FAIL, and evidence.
