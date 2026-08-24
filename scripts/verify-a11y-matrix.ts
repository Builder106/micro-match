import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const matrixPath = resolve(process.cwd(), 'docs/accessibility-matrix.md');
const matrix = readFileSync(matrixPath, 'utf8');
const failures: string[] = [];

for (const requiredHeading of ['## Route and state coverage', '## WCAG 2.2 success criteria', '## Manual sign-off', '## Exceptions']) {
  if (!matrix.includes(requiredHeading)) failures.push(`Missing required section: ${requiredHeading}`);
}

if (/\|\s*(Fail|Needs review|Pending)\s*\|/i.test(matrix)) {
  failures.push('The accessibility matrix contains unresolved Fail, Needs review, or Pending statuses.');
}

if (/- \[ \]/.test(matrix)) failures.push('The accessibility matrix contains unchecked required items.');

const rowsWithPendingEvidence = matrix
  .split('\n')
  .filter((line) => line.startsWith('|') && /\|\s*Pending\s*\|/.test(line));
if (rowsWithPendingEvidence.length > 0) failures.push('The accessibility matrix contains rows without recorded evidence.');

if (failures.length > 0) {
  console.error('Accessibility evidence matrix is not ready for a blocking sign-off.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Accessibility evidence matrix passed validation.');
