import type { LintRule } from '../../types.js';

export const platformConfigExists: LintRule = {
  name: 'platform-config-exists',
  severity: 'error',
  description: 'Platform configuration must exist (checked by the lint engine)',
  async check() {
    return {
      rule: this.name,
      severity: this.severity,
      message: 'Platform config check delegated to lint engine',
      passed: true,
    };
  },
};
