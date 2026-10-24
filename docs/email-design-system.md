# MicroMatch email design system

This system covers transactional email sent by MicroMatch. The app currently sends NGO verification approvals and requests for changes through Plunk. Appwrite account recovery messages remain outside this system.

The site brand, name, wordmark, and type choices follow [`DESIGN.md`](../DESIGN.md). Email uses a compact, static expression of the quilt identity: clear type, a simple seam, and the madder action color.

## Design rules

- Put the outcome in the subject and heading.
- Give each message one main action.
- Keep the copy useful when images and custom fonts do not load.
- Use the same information and destination in HTML and plain text.
- Keep personal and verification details to the minimum needed to explain the next step.
- Use color to support the message. State approval or a requested change in words as well.

## Tokens

| Role | Value | Use |
|---|---|---|
| Email background | `#FFFFFF` | Page and message surface |
| Ink | `#1C1F3B` | Headings and body copy |
| Secondary ink | `#575B76` | Supporting copy |
| Seam | `#D9DCE8` | Fine borders and dividers |
| Madder | `#FF6B6B` | Primary action background |
| Action ink | `#000000` | Text on the madder action |
| Weld | `#F2B84B` | Context panels, such as a review note |
| Context ink | `#1C1F3B` | Text on weld |

Use a 3px corner radius, matching the product's cut-cloth shape. Keep shadows and decorative graphics out of the email shell. The wordmark and madder action carry the brand without relying on images.

## Type and spacing

| Element | Style |
|---|---|
| Wordmark | Bricolage Grotesque, 18px, bold |
| Main heading | Bricolage Grotesque, 24px, bold, 1.25 line height |
| Body | Host Grotesk, 16px, 1.55 line height |
| Supporting copy | Host Grotesk, 14px, 1.5 line height |
| Footer | Host Grotesk, 12px, 1.5 line height |

Declare an Arial and Helvetica fallback for each font stack. The layout and copy must remain readable when only the fallback font is used.

Use an 8px spacing unit: 8px between related items, 16px between paragraphs, 24px before the main action, and 32px around the message content. Set the message to a single column with a 560px maximum width, 32px inner padding on wide screens, and 20px padding on narrow screens. The primary action has a 44px minimum height and a descriptive label.

## Message structure

Use this order for transactional messages:

1. MicroMatch wordmark
2. Outcome heading
3. Short explanation
4. Optional context panel for a specific detail or review note
5. One primary action
6. A plain-text fallback link when the button may not work
7. A brief line explaining why the recipient received the email

Keep the shell quiet. Avoid decorative status dots, emoji, text over images, large illustrations, motion, gradients, and extra buttons. Do not use a color alone to distinguish an approved request from one that needs changes.

## Current message patterns

### NGO verification approved

- **Subject:** Your organization is verified
- **Preheader:** Your organization can now post verified tasks.
- **Heading:** Your organization is verified
- **Body:** `{orgName}` is now verified on MicroMatch. Tasks you post will show a Verified label so volunteers know the organization has been reviewed.
- **Action:** Post a task
- **Destination:** `/org`

### NGO verification needs changes

- **Subject:** One change is needed for verification
- **Preheader:** Review the note and update your submission.
- **Heading:** Your verification needs an update
- **Body:** We reviewed `{orgName}` and need this change before we can approve it.
- **Context panel:** Show the reviewer-provided reason in full, with a short label such as "Requested change".
- **Action:** Update verification
- **Destination:** `/profile`
- **Follow-up:** Say that the recipient can resubmit after making the change.

Keep the tone calm and specific. The approval message should describe what the organization can do next. The changes message should state the requested update plainly, without adding urgency or a deadline that the reviewer did not provide.

## Localization and accessibility

MicroMatch supports English, Spanish, French, German, Portuguese, Chinese, and Arabic. Each localized version needs a matching subject, preheader, HTML body, and plain-text body. Keep placeholders intact through translation and escape inserted organization names and review reasons.

Set the email language and text direction for the selected locale. Arabic must use right-to-left direction. Keep the layout in one column so longer German copy and right-to-left text do not depend on narrow side-by-side regions. Use descriptive link labels, visible underlines for links in body copy, and strong text contrast. The message must keep its meaning when color is removed.

## Implementation notes

The current sender is [`src/lib/server/email.ts`](../src/lib/server/email.ts). Keep presentation inside the existing email flow and leave provider credentials and delivery configuration separate. Continue to send an HTML body and a plain-text alternative. Use absolute links based on the configured app URL, escape inserted text, and do not include tax IDs, uploaded documents, or other verification evidence in email.

The current templates are English-only and still use an earlier palette, rounder corners, and different font choices. Apply these tokens and message patterns when updating those templates. The approval HTML button currently points to `/org`, while its plain-text alternative points to `/profile`; bring those destinations into agreement during that implementation.

## Review checklist

- The subject, preheader, heading, and action describe the same outcome.
- The HTML and plain-text versions include the same key details and action destination.
- The email remains readable at 320px wide and with images disabled.
- Long organization names and reviewer notes wrap without clipping.
- Arabic uses right-to-left direction; each of the seven locales has complete copy before being sent in that locale.
- Links work, the main action has a 44px target, and the message remains understandable without color.
