import type { LintRule } from '../../types.js';

const WORKFLOW_KEYWORDS = [
  'first',
  'then',
  'next',
  'finally',
  'step 1',
  'step 2',
  'workflow',
];

export const descriptionNoWorkflow: LintRule = {
  name: 'description-no-workflow',
  severity: 'warn',
  description: 'Description should not contain workflow/sequencing keywords',
  async check(_skillDir, meta) {
    if (!meta?.description) {
      return {
        rule: this.name,
        severity: this.severity,
        message: 'No description provided in metadata',
        passed: false,
      };
    }

    const lower = meta.description.toLowerCase();
    const found = WORKFLOW_KEYWORDS.filter((kw) => lower.includes(kw));

    if (found.length > 0) {
      return {
        rule: this.name,
        severity: this.severity,
        message: `Description contains workflow keywords: ${found.join(', ')}`,
        passed: false,
      };
    }

    return {
      rule: this.name,
      severity: this.severity,
      message: 'Description does not contain workflow keywords',
      passed: true,
    };
  },
};
