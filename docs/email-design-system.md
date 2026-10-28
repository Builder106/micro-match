# MicroMatch email design system

This system covers transactional email sent by MicroMatch. The app currently sends NGO verification approvals and requests for changes through Plunk. Appwrite account recovery messages remain outside this system.

The site brand, name, wordmark, and type choices follow [`DESIGN.md`](../DESIGN.md). Email uses a compact, static expression of the quilt identity: clear type, a stitched seam, one small cloth patch, and the madder action color.

## Design rules

- Put the outcome in the subject and heading.
- Give each message one main action.
- Keep the copy useful when images and custom fonts do not load.
- Point the fallback link to the same destination as the main action.
- Keep personal and verification details to the minimum needed to explain the next step.
- Use color to support the message. State approval or a requested change in words as well.

## Tokens

| Role             | Value     | Use                                   |
| ---------------- | --------- | ------------------------------------- |
| Email background | `#FFFFFF` | Page and message surface              |
| Ink              | `#1C1F3B` | Headings and body copy                |
| Secondary ink    | `#575B76` | Supporting copy                       |
| Seam             | `#D9DCE8` | Fine borders and dividers             |
| Madder           | `#FF6B6B` | Primary action background             |
| Action ink       | `#000000` | Text on the madder action             |
| Weld             | `#F2B84B` | Context panels, such as a review note |
| Context ink      | `#1C1F3B` | Text on weld                          |

Use a 3px corner radius, matching the product's cut-cloth shape. The rule under the header is a 1px dashed `#575B76` line, the running stitch from the logo. Other dividers stay solid seam color.

The only artwork is a 48px status patch in the header's trailing corner, set like a stamp on an envelope. It follows the site's motion verb, "pinned, then stitched": a change request shows a madder patch held by a weld pin, and an approval shows the same patch sewn down with an indigo running stitch. The patch is a CSS background, so blocked images leave only the wordmark, with no gap or broken-image box. The wordmark and madder action carry the brand without it.

## Type and spacing

| Element         | Style                                             |
| --------------- | ------------------------------------------------- |
| Wordmark        | Bricolage Grotesque, 18px, bold                   |
| Main heading    | Bricolage Grotesque, 24px, bold, 1.25 line height |
| Body            | Host Grotesk, 16px, 1.55 line height              |
| Supporting copy | Host Grotesk, 14px, 1.5 line height               |
| Footer          | Host Grotesk, 12px, 1.5 line height               |

Declare an Arial and Helvetica fallback for each font stack. The layout and copy must remain readable when only the fallback font is used.

Use an 8px spacing unit: 8px between related items, 16px between paragraphs, 24px before the main action, and 32px around the message content. Set the message to a single column with a 560px maximum width, 32px inner padding on wide screens, and 20px padding on narrow screens. The primary action has a 44px minimum height and a descriptive label.

## Message structure

Use this order for transactional messages:

1. Hidden preheader for the inbox preview
2. MicroMatch wordmark, with the status patch in the trailing corner
3. Outcome heading
4. Short explanation
5. Optional context panel for a specific detail or review note
6. One primary action
7. The full URL for the same action, as an underlined link
8. A brief line explaining why the recipient received the email

Keep the shell quiet. Avoid decorative status dots, emoji, text over images, large illustrations, motion, gradients, and extra buttons. Do not use a color alone to distinguish an approved request from one that needs changes. The patch repeats the heading; it never replaces it.

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

Verification emails use the locale saved in the applicant's `prefs.locale` when they submit or resubmit. If the preference is missing or unsupported, use English. The approval and change-request messages have complete copy in English, Spanish, French, German, Portuguese, Chinese, and Arabic. Keep placeholders intact through translation and escape inserted organization names and review reasons.

Set the email language and text direction from the saved locale. Arabic uses right-to-left direction. Organization names and reviewer notes are user text in any script, so they carry `dir="auto"`. An English note inside an Arabic email then keeps its punctuation at the end of the line. The fallback URL is always `dir="ltr"`. Keep the layout in one column so longer German copy and right-to-left text do not depend on narrow side-by-side regions. Use descriptive link labels, visible underlines for links in body copy, and strong text contrast. The message must keep its meaning when color is removed.

## Implementation notes

The sender is [`src/lib/server/email.ts`](../src/lib/server/email.ts), and message markup and copy live in [`src/lib/server/emailTemplates.ts`](../src/lib/server/emailTemplates.ts). Plunk creates a plain-text alternative from the HTML body, so the template includes a visible full URL below the main action. The Plunk send API has no separate text-body field ([API reference](https://docs.useplunk.com/api-reference/public-api/sendEmail)).

Use absolute, locale-prefixed links based on the configured app URL. Patch images load from `{PUBLIC_APP_URL}/email/patch-sewn.png` and `patch-pinned.png` in `static/email/`. They are 256px renders of `design/blender/email-patches.blend`, which has one collection per state. Re-render both after any change to the scene.

To review the markup, run `bun run scripts/qa/render-email-previews.ts <dir>` on the build host. It writes both messages in every locale with a long organization name and a two-line reviewer note. Escape inserted text, and do not include tax IDs, uploaded documents, or other verification evidence in email. Appwrite account recovery messages remain outside this system.

## Review checklist

- The subject, preheader, heading, and action describe the same outcome.
- The generated plain-text version includes the same key details and action destination.
- The email remains readable at 320px wide and with images disabled, and the header shows no gap where the patch was.
- Long organization names and reviewer notes wrap without clipping.
- Arabic uses right-to-left direction; each of the seven locales has complete copy before being sent in that locale.
- Links work, the main action has a 44px target, and the message remains understandable without color.
