import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { LintRule } from '../../types.js';

export const frontmatterValid: LintRule = {
  name: 'frontmatter-valid',
  severity: 'error',
  description: 'SKILL.md frontmatter must contain name and description',
  async check(skillDir) {
    const filePath = join(skillDir, 'SKILL.md');
    try {
      const content = await readFile(filePath, 'utf-8');
      const { data } = matter(content);
      const missing: string[] = [];
      if (!data.name) missing.push('name');
      if (!data.description) missing.push('description');

      if (missing.length > 0) {
        return {
          rule: this.name,
          severity: this.severity,
          message: `Frontmatter missing required fields: ${missing.join(', ')}`,
          passed: false,
        };
      }

      return {
        rule: this.name,
        severity: this.severity,
        message: 'Frontmatter is valid',
        passed: true,
      };
    } catch {
      return {
        rule: this.name,
        severity: this.severity,
        message: 'Failed to parse SKILL.md frontmatter',
        passed: false,
      };
    }
  },
};
