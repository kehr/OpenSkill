import type { LintRule } from '../../types.js';

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const MAX_LENGTH = 64;

export const nameFormat: LintRule = {
  name: 'name-format',
  severity: 'error',
  description: 'Skill name must be lowercase alphanumeric with hyphens and at most 64 characters',
  async check(_skillDir, meta) {
    if (!meta?.name) {
      return {
        rule: this.name,
        severity: this.severity,
        message: 'No skill name provided in metadata',
        passed: false,
      };
    }

    if (meta.name.length > MAX_LENGTH) {
      return {
        rule: this.name,
        severity: this.severity,
        message: `Skill name exceeds ${MAX_LENGTH} characters (got ${meta.name.length})`,
        passed: false,
      };
    }

    if (!NAME_PATTERN.test(meta.name)) {
      return {
        rule: this.name,
        severity: this.severity,
        message: `Skill name "${meta.name}" must match pattern ${NAME_PATTERN}`,
        passed: false,
      };
    }

    return {
      rule: this.name,
      severity: this.severity,
      message: 'Skill name format is valid',
      passed: true,
    };
  },
};
