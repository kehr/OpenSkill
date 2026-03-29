import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { LintRule } from '../../types.js';

const MAX_LENGTH = 1024;

export const descriptionFormat: LintRule = {
  name: 'description-format',
  severity: 'warn',
  description: 'Description should start with "Use when" and be at most 1024 characters',
  async check(skillDir) {
    const filePath = join(skillDir, 'SKILL.md');
    try {
      const content = await readFile(filePath, 'utf-8');
      const { data } = matter(content);
      const description: string | undefined = data.description;

      if (!description) {
        return {
          rule: this.name,
          severity: this.severity,
          message: 'No description found in frontmatter',
          passed: false,
        };
      }

      const issues: string[] = [];

      if (!description.startsWith('Use when')) {
        issues.push('description should start with "Use when"');
      }

      if (description.length > MAX_LENGTH) {
        issues.push(`description exceeds ${MAX_LENGTH} characters (got ${description.length})`);
      }

      if (issues.length > 0) {
        return {
          rule: this.name,
          severity: this.severity,
          message: issues.join('; '),
          passed: false,
        };
      }

      return {
        rule: this.name,
        severity: this.severity,
        message: 'Description format is valid',
        passed: true,
      };
    } catch {
      return {
        rule: this.name,
        severity: this.severity,
        message: 'Failed to read SKILL.md frontmatter',
        passed: false,
      };
    }
  },
};
