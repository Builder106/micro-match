// Writes sample verification emails as HTML files for design review.
// Usage: bun run scripts/qa/render-email-previews.ts <output-dir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { locales } from '../../src/lib/locale';
import { renderVerificationApproved, renderVerificationRejected } from '../../src/lib/server/emailTemplates';

const output = process.argv[2];
if (!output) throw new Error('Pass an output directory.');
mkdirSync(output, { recursive: true });

const appUrl = 'https://micromatch.app';
const orgName = 'Middletown Community Food Pantry and Neighborhood Kitchen';
const reason = 'The tax ID on the form does not match the uploaded determination letter.\nPlease upload the most recent IRS letter for this organization.';

for (const locale of locales) {
  const approved = renderVerificationApproved(orgName, appUrl, locale);
  const rejected = renderVerificationRejected(orgName, reason, appUrl, locale);
  writeFileSync(join(output, `approved-${locale}.html`), approved.html);
  writeFileSync(join(output, `rejected-${locale}.html`), rejected.html);
}
