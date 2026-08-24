# MicroMatch accessibility evidence matrix

This matrix records the current accessibility audit scope. It is a release gate, not a claim that MicroMatch already conforms to WCAG 2.2 AAA. Manual rows remain `Needs review` until a person completes the required test and records evidence.

## Status vocabulary

Use only these values:

- `Pass`
- `Fail`
- `Needs review`
- `N/A with rationale`

Every `Pass` needs evidence. Every `N/A with rationale` needs a reason. `Fail` and `Needs review` block the accessibility gate.

## Route and state coverage

| Surface | State or role | Automated coverage | Manual status | Evidence |
| --- | --- | --- | --- | --- |
| `/` | Anonymous, light and dark, three viewports | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/about`, `/cookies`, `/privacy`, `/terms` | Anonymous, light and dark | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/contact`, `/help`, `/docs`, `/docs/api` | Anonymous, forms and FAQ states | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/for-ngos`, `/for-volunteers`, `/how-it-works`, `/impact` | Anonymous, light and dark | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Anonymous, form and error states | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/tasks` | Anonymous and signed-in views | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/dashboard` | Volunteer and NGO sessions | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/profile` | Volunteer and NGO sessions | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/profile` | NGO downgrade dialog | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/org` | NGO session and form | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/badges/manage` | NGO session and create dialog | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/badges/manage` | Custom select open | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/badges/analytics` | NGO session | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/task/:id` | Volunteer and NGO sessions | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/task/:id/claim` | Volunteer session and submission form | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| `/admin/verifications` | Admin session and reject dialog | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |
| Global shell | Mobile menu, theme toggle, focus, reduced motion | `e2e/accessibility.spec.ts` | Needs review | `audit-output/accessibility/` |

## WCAG 2.2 success criteria

The full review covers every applicable WCAG 2.2 success criterion at Levels A, AA, and AAA. Use one row per criterion and surface when completing the manual review.

| Criterion | Level | Surface or state | Method | Evidence | Status | Reviewer | Date | Rationale or issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1.1 Non-text content | A | All routes and images | Axe plus screen reader | Pending | Needs review |  |  |  |
| 1.2.1 to 1.2.9 Time-based media | A to AAA | Media and animation surfaces | Manual media review | Pending | Needs review |  |  |  |
| 1.3.1 to 1.3.6 Adaptable | A to AA | All routes and responsive states | Axe plus screen reader | Pending | Needs review |  |  |  |
| 1.4.1 to 1.4.13 Distinguishable | A to AAA | Themes, focus, text, and motion | Axe plus visual review | Pending | Needs review |  |  |  |
| 2.1.1 to 2.1.4 Keyboard | A to AAA | All interactive states | Keyboard review | Pending | Needs review |  |  |  |
| 2.2.1 to 2.2.6 Enough time | A to AAA | Sessions, loading, and notifications | Manual timing review | Pending | Needs review |  |  |  |
| 2.3.1 to 2.3.3 Seizures and physical reactions | A to AAA | Animation and motion | Reduced-motion and visual review | Pending | Needs review |  |  |  |
| 2.4.1 to 2.4.13 Navigable | A to AAA | Navigation, dialogs, focus, and headings | Axe, keyboard, and screen reader | Pending | Needs review |  |  |  |
| 2.5.1 to 2.5.8 Input modalities | A to AA | Pointer, touch, dragging, and target size | Keyboard and touch review | Pending | Needs review |  |  |  |
| 3.1.1 to 3.1.6 Readable | A to AAA | All content and language changes | Screen reader and content review | Pending | Needs review |  |  |  |
| 3.2.1 to 3.2.6 Predictable | A to AAA | Navigation, forms, help, and state changes | Keyboard and interaction review | Pending | Needs review |  |  |  |
| 3.3.1 to 3.3.9 Input assistance | A to AAA | Forms, errors, authentication, and recovery | Form and screen-reader review | Pending | Needs review |  |  |  |
| 4.1.1 to 4.1.3 Compatible | A to AA | HTML, ARIA, status messages, and custom controls | Axe plus platform review | Pending | Needs review |  |  |  |

The grouped rows above are an index. Before making a conformance claim, expand each group into individual WCAG 2.2 success-criterion rows and attach criterion-specific evidence.

## Manual sign-off

| Review environment | Reviewer | Date | Status | Notes |
| --- | --- | --- | --- | --- |
| Keyboard only, Chromium |  |  | Needs review |  |
| VoiceOver with Safari on macOS |  |  | Needs review |  |
| NVDA with Firefox on Windows |  |  | Needs review |  |
| 200% and 400% zoom, 320px reflow |  |  | Needs review |  |
| Light, dark, reduced motion, and forced colors |  |  | Needs review |  |

## Exceptions

The landing-page audit excludes four non-interactive visual regions from axe color analysis because their layered illustrations intentionally overlap text and SVG artwork: `.hero-visual`, `.progress-card`, `.badges-section`, and `.blob`. These regions remain in the manual visual, keyboard, zoom, contrast, and reduced-motion review. This is a test-scope exception, not an accessibility waiver; record the manual evidence before release.
