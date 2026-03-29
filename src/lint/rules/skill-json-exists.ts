import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule } from '../../types.js';

export const skillJsonExists: LintRule = {
  name: 'skill-json-exists',
  severity: 'error',
  description: 'skill.json must exist in the skill directory',
  async check(skillDir) {
    const filePath = join(skillDir, 'skill.json');
    try {
      await stat(filePath);
      return {
        rule: this.name,
        severity: this.severity,
        message: 'skill.json exists',
        passed: true,
      };
    } catch {
      return {
        rule: this.name,
        severity: this.severity,
        message: 'skill.json is missing',
        passed: false,
      };
    }
  },
};
