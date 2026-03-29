import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule } from '../../types.js';

const REQUIRED_DIRS = ['specs', 'templates', 'examples'];

export const steDirsExist: LintRule = {
  name: 'ste-dirs-exist',
  severity: 'warn',
  description: 'specs/, templates/, and examples/ directories should exist',
  async check(skillDir) {
    const missing: string[] = [];

    for (const dir of REQUIRED_DIRS) {
      try {
        const s = await stat(join(skillDir, dir));
        if (!s.isDirectory()) {
          missing.push(dir);
        }
      } catch {
        missing.push(dir);
      }
    }

    if (missing.length > 0) {
      return {
        rule: this.name,
        severity: this.severity,
        message: `Missing directories: ${missing.join(', ')}`,
        passed: false,
      };
    }

    return {
      rule: this.name,
      severity: this.severity,
      message: 'All required directories exist',
      passed: true,
    };
  },
};
