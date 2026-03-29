import { globSync } from 'glob';
import { minimatch } from 'minimatch';
import type { LintRule } from '../../types.js';

export const renderFilesExist: LintRule = {
  name: 'render-files-exist',
  severity: 'warn',
  description: 'Each glob in meta.render must match at least one file',
  async check(skillDir, meta) {
    if (!meta?.render || meta.render.length === 0) {
      return {
        rule: this.name,
        severity: this.severity,
        message: 'No render globs defined',
        passed: true,
      };
    }

    const unmatched: string[] = [];

    for (const pattern of meta.render) {
      const matches = globSync(pattern, { cwd: skillDir, dot: false });
      if (matches.length === 0) {
        unmatched.push(pattern);
      }
    }

    if (unmatched.length > 0) {
      return {
        rule: this.name,
        severity: this.severity,
        message: `Render globs with no matching files: ${unmatched.join(', ')}`,
        passed: false,
      };
    }

    return {
      rule: this.name,
      severity: this.severity,
      message: 'All render globs match at least one file',
      passed: true,
    };
  },
};
