# MicroMatch accessibility evidence matrix

This matrix records the current accessibility audit scope. It is a release gate, not a claim that MicroMatch already conforms to WCAG 2.2 AAA. Manual evidence is `Not recorded` until a person completes the required review.

## Status vocabulary

Use only `Pass`, `Fail`, `Needs review`, or `N/A with rationale`. Every `Pass` needs evidence. Every `N/A with rationale` needs a reason. `Fail` and `Needs review` block the release gate.

## Route and state coverage

| Surface | State or role | Automated coverage | Manual status | Evidence |
| --- | --- | --- | --- | --- |
| `/` | Anonymous, light/dark, 320/375/768/1440px | Accessibility and responsiveness suites | Needs review | Not recorded |
| Public informational routes | `/about`, `/cookies`, `/privacy`, `/terms`, `/contact`, `/help`, `/docs`, `/docs/api` | Locale and interaction matrix | Needs review | Not recorded |
| Public conversion routes | `/for-ngos`, `/for-volunteers`, `/how-it-works`, `/impact` | Locale and interaction matrix | Needs review | Not recorded |
| Authentication routes | `/login`, `/signup`, `/forgot-password`, `/reset-password` | Form and error states | Needs review | Not recorded |
| `/tasks` and `/task/:id` | Anonymous, volunteer, and NGO sessions | Role fixture matrix | Needs review | Not recorded |
| `/dashboard` | Volunteer and NGO sessions | Role fixture matrix | Needs review | Not recorded |
| `/profile` | Volunteer and NGO sessions, downgrade dialog | Role and dialog states | Needs review | Not recorded |
| `/org` | NGO session and form | Role fixture matrix | Needs review | Not recorded |
| `/badges/manage` | NGO session, create dialog, custom select | Dialog and select states | Needs review | Not recorded |
| `/badges/analytics` | NGO session | Role fixture matrix | Needs review | Not recorded |
| `/task/:id/claim` | Volunteer session and submission form | Form states | Needs review | Not recorded |
| `/admin/verifications` | Admin session and reject dialog | Dialog state | Needs review | Not recorded |
| Global shell | Locale, RTL, mobile menu, theme, focus, reduced motion | All supported locales | Needs review | Not recorded |

## WCAG 2.2 success criteria

Each applicable criterion has its own row so that evidence and dispositions cannot be hidden in grouped ranges.

| Criterion | Level | Surface or state | Method | Evidence | Status | Reviewer | Date | Rationale or issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1.1 Non-text Content | A | All routes and images | Axe and screen reader | Not recorded | Needs review | | | |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Media surfaces | Manual media review | Not recorded | Needs review | | | |
| 1.2.2 Captions (Prerecorded) | A | Media surfaces | Manual media review | Not recorded | Needs review | | | |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | Media surfaces | Manual media review | Not recorded | Needs review | | | |
| 1.2.4 Captions (Live) | AA | Live media, if applicable | Manual media review | Not recorded | N/A with rationale | | | No live media is currently inventoried |
| 1.2.5 Audio Description (Prerecorded) | AA | Media surfaces | Manual media review | Not recorded | Needs review | | | |
| 1.3.1 Info and Relationships | A | All routes and forms | Axe and accessibility tree | Not recorded | Needs review | | | |
| 1.3.2 Meaningful Sequence | A | All responsive layouts | Keyboard and screen reader | Not recorded | Needs review | | | |
| 1.3.3 Sensory Characteristics | A | Instructions and controls | Content review | Not recorded | Needs review | | | |
| 1.3.4 Orientation | AA | Responsive routes | Viewport review | Not recorded | Needs review | | | |
| 1.3.5 Identify Input Purpose | AA | Authentication and profile forms | Axe and accessibility tree | Not recorded | Needs review | | | |
| 1.3.6 Identify Purpose | AAA | Forms and navigation | Accessibility tree and content review | Not recorded | Needs review | | | |
| 1.4.1 Use of Color | A | Statuses, links, and controls | Visual review | Not recorded | Needs review | | | |
| 1.4.2 Audio Control | A | Audio content, if applicable | Manual media review | Not recorded | N/A with rationale | | | No audio content is currently inventoried |
| 1.4.3 Contrast (Minimum) | AA | All themes and states | Axe and visual review | Not recorded | Needs review | | | |
| 1.4.4 Resize Text | AA | 200% and 400% zoom | Zoom and reflow review | Not recorded | Needs review | | | |
| 1.4.5 Images of Text | AA | Branded and content imagery | Visual review | Not recorded | Needs review | | | |
| 1.4.6 Contrast (Enhanced) | AAA | All themes and states | Axe and visual review | Not recorded | Needs review | | | |
| 1.4.10 Reflow | AA | 320px and zoomed layouts | Responsive review | Not recorded | Needs review | | | |
| 1.4.11 Non-text Contrast | AA | Focus, borders, icons, controls | Axe and visual review | Not recorded | Needs review | | | |
| 1.4.12 Text Spacing | AA | Content and forms | Text-spacing review | Not recorded | Needs review | | | |
| 1.4.13 Content on Hover or Focus | AA | Menus, tooltips, and popovers | Keyboard and pointer review | Not recorded | Needs review | | | |
| 2.1.1 Keyboard | A | All interactive states | Keyboard review | Not recorded | Needs review | | | |
| 2.1.2 No Keyboard Trap | A | Dialogs, menus, and custom controls | Keyboard review | Not recorded | Needs review | | | |
| 2.1.4 Character Key Shortcuts | A | Keyboard shortcuts, if applicable | Keyboard review | Not recorded | N/A with rationale | | | No character-key shortcuts are currently inventoried |
| 2.2.1 Timing Adjustable | A | Sessions and notifications | Timing review | Not recorded | Needs review | | | |
| 2.2.2 Pause, Stop, Hide | A | Animation and auto-updating content | Motion review | Not recorded | Needs review | | | |
| 2.3.1 Three Flashes or Below Threshold | A | Animation and media | Motion review | Not recorded | Needs review | | | |
| 2.4.1 Bypass Blocks | A | Global shell and routes | Axe and keyboard | Not recorded | Needs review | | | |
| 2.4.2 Page Titled | A | All routes and localized routes | Axe and document review | Not recorded | Needs review | | | |
| 2.4.3 Focus Order | A | Navigation, dialogs, and forms | Keyboard review | Not recorded | Needs review | | | |
| 2.4.4 Link Purpose (In Context) | A | Links and cards | Axe and screen reader | Not recorded | Needs review | | | |
| 2.4.5 Multiple Ways | AA | Site navigation | Keyboard and content review | Not recorded | Needs review | | | |
| 2.4.6 Headings and Labels | AA | All routes and forms | Axe and accessibility tree | Not recorded | Needs review | | | |
| 2.4.7 Focus Visible | AA | All interactive controls | Keyboard and visual review | Not recorded | Needs review | | | |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Sticky shell and dialogs | Keyboard and viewport review | Not recorded | Needs review | | | |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA | Sticky shell and dialogs | Keyboard and viewport review | Not recorded | Needs review | | | |
| 2.4.13 Focus Appearance | AAA | All interactive controls | Visual review | Not recorded | Needs review | | | |
| 2.5.1 Pointer Gestures | A | Touch and pointer interactions | Touch review | Not recorded | Needs review | | | |
| 2.5.2 Pointer Cancellation | A | Buttons and links | Pointer review | Not recorded | Needs review | | | |
| 2.5.3 Label in Name | A | Controls with visible labels | Accessibility tree | Not recorded | Needs review | | | |
| 2.5.4 Motion Actuation | A | Motion controls, if applicable | Motion review | Not recorded | N/A with rationale | | | No motion-actuated controls are currently inventoried |
| 2.5.5 Target Size (Enhanced) | AAA | Touch and pointer controls | Touch and visual review | Not recorded | Needs review | | | |
| 2.5.7 Dragging Movements | AA | Drag controls, if applicable | Touch and keyboard review | Not recorded | N/A with rationale | | | No dragging controls are currently inventoried |
| 2.5.8 Target Size (Minimum) | AA | Touch and pointer controls | Touch and visual review | Not recorded | Needs review | | | |
| 3.1.1 Language of Page | A | All localized routes | DOM and screen reader | Not recorded | Needs review | | | |
| 3.1.2 Language of Parts | AA | Mixed-language content | DOM and content review | Not recorded | Needs review | | | |
| 3.1.3 Unusual Words | AAA | Help and instructional content | Content review | Not recorded | Needs review | | | |
| 3.2.1 On Focus | A | All interactive controls | Keyboard review | Not recorded | Needs review | | | |
| 3.2.2 On Input | A | Forms and selects | Keyboard review | Not recorded | Needs review | | | |
| 3.2.3 Consistent Navigation | AA | Global shell | Cross-route review | Not recorded | Needs review | | | |
| 3.2.4 Consistent Identification | AA | Repeated controls | Cross-route review | Not recorded | Needs review | | | |
| 3.3.1 Error Identification | A | Authentication and forms | Form and screen-reader review | Not recorded | Needs review | | | |
| 3.3.2 Labels or Instructions | A | Authentication and forms | Accessibility tree | Not recorded | Needs review | | | |
| 3.3.3 Error Suggestion | AA | Forms and recovery | Form review | Not recorded | Needs review | | | |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Account and submission forms | Form review | Not recorded | Needs review | | | |
| 3.3.5 Help | AAA | Forms and support routes | Content review | Not recorded | Needs review | | | |
| 3.3.6 Error Prevention (All) | AAA | All forms | Form review | Not recorded | Needs review | | | |
| 4.1.2 Name, Role, Value | A | Custom controls and dialogs | Axe and accessibility tree | Not recorded | Needs review | | | |
| 4.1.3 Status Messages | AA | Notifications and async states | Screen reader review | Not recorded | Needs review | | | |

## Manual sign-off

| Review environment | Reviewer | Date | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| Keyboard only, Chromium | | | Needs review | Not recorded | |
| VoiceOver with Safari on macOS | | | Needs review | Not recorded | |
| NVDA with Firefox on Windows | | | Needs review | Not recorded | |
| 200% and 400% zoom, 320px reflow | | | Needs review | Not recorded | |
| Light, dark, reduced motion, and forced colors | | | Needs review | Not recorded | |

## Exceptions

Exceptions are scoped test dispositions, not accessibility waivers. Each exception requires documented impact, mitigation, ownership, follow-up, and evidence before release.

| Scope | Reason | User impact | Mitigation | Owner | Follow-up date | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Landing-page decorative visual layers: `.hero-visual`, `.progress-card`, `.badges-section`, `.blob` | Layered illustrations intentionally overlap decorative artwork | Contrast automation cannot reliably classify the layered artwork | Retain the elements in manual visual, keyboard, zoom, contrast, and reduced-motion review | Accessibility owner | Not recorded | Not recorded |
