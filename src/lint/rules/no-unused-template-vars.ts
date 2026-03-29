import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule } from '../../types.js';

const KNOWN_VARS = [
  'configDir',
  'skillsDir',
  'agentsDir',
  'platformName',
  'homeBase',
  'namespace',
];

const TEMPLATE_VAR_PATTERN = /\{\{(\w+)\}\}/g;

export const noUnusedTemplateVars: LintRule = {
  name: 'no-unused-template-vars',
  severity: 'warn',
  description: 'Template variables in SKILL.md must be from the known set',
  async check(skillDir) {
    const filePath = join(skillDir, 'SKILL.md');
    try {
      const content = await readFile(filePath, 'utf-8');
      const unknownVars: string[] = [];

      let match: RegExpExecArray | null;
      while ((match = TEMPLATE_VAR_PATTERN.exec(content)) !== null) {
        const varName = match[1];
        if (!KNOWN_VARS.includes(varName) && !unknownVars.includes(varName)) {
          unknownVars.push(varName);
        }
      }

      if (unknownVars.length > 0) {
        return {
          rule: this.name,
          severity: this.severity,
          message: `Unknown template variables: ${unknownVars.join(', ')}`,
          passed: false,
        };
      }

      return {
        rule: this.name,
        severity: this.severity,
        message: 'All template variables are known',
        passed: true,
      };
    } catch {
      return {
        rule: this.name,
        severity: this.severity,
        message: 'Failed to read SKILL.md',
        passed: false,
      };
    }
  },
};
