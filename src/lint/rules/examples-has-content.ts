import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule } from '../../types.js';

async function hasNonDotfileContent(dir: string): Promise<boolean> {
  try {
    const entries = await readdir(dir);
    return entries.some((entry: string) => !entry.startsWith('.'));
  } catch {
    return false;
  }
}

export const examplesHasContent: LintRule = {
  name: 'examples-has-content',
  severity: 'warn',
  description: 'examples/ directory should exist and have non-dotfile content',
  async check(skillDir) {
    const examplesDir = join(skillDir, 'examples');

    if (!(await hasNonDotfileContent(examplesDir))) {
      return {
        rule: this.name,
        severity: this.severity,
        message: 'examples/ is missing or has no content',
        passed: false,
      };
    }

    return {
      rule: this.name,
      severity: this.severity,
      message: 'examples/ has content',
      passed: true,
    };
  },
};
