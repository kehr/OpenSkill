import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule } from '../../types.js';

export const skillMdExists: LintRule = {
  name: 'skill-md-exists',
  severity: 'error',
  description: 'SKILL.md must exist in the skill directory',
  async check(skillDir) {
    const filePath = join(skillDir, 'SKILL.md');
    try {
      await stat(filePath);
      return {
        rule: this.name,
        severity: this.severity,
        message: 'SKILL.md exists',
        passed: true,
      };
    } catch {
      return {
        rule: this.name,
        severity: this.severity,
        message: 'SKILL.md is missing',
        passed: false,
      };
    }
  },
};
