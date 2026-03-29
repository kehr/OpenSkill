import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintResult, LintRule, SkillMeta } from '../types.js';
import { skillMdExists } from './rules/skill-md-exists.js';
import { frontmatterValid } from './rules/frontmatter-valid.js';
import { nameFormat } from './rules/name-format.js';
import { descriptionFormat } from './rules/description-format.js';
import { descriptionNoWorkflow } from './rules/description-no-workflow.js';
import { skillJsonExists } from './rules/skill-json-exists.js';
import { steDirsExist } from './rules/ste-dirs-exist.js';
import { examplesHasContent } from './rules/examples-has-content.js';
import { noUnusedTemplateVars } from './rules/no-unused-template-vars.js';
import { platformConfigExists } from './rules/platform-config-exists.js';
import { renderFilesExist } from './rules/render-files-exist.js';

const ALL_RULES: LintRule[] = [
  skillMdExists,
  frontmatterValid,
  nameFormat,
  descriptionFormat,
  descriptionNoWorkflow,
  skillJsonExists,
  steDirsExist,
  examplesHasContent,
  noUnusedTemplateVars,
  platformConfigExists,
  renderFilesExist,
];

async function loadSkillMeta(skillDir: string): Promise<SkillMeta | undefined> {
  try {
    const content = await readFile(join(skillDir, 'skill.json'), 'utf-8');
    return JSON.parse(content) as SkillMeta;
  } catch {
    return undefined;
  }
}

export async function lintSkill(skillDir: string, platformsDir: string): Promise<LintResult[]> {
  const meta = await loadSkillMeta(skillDir);
  const results: LintResult[] = [];

  for (const rule of ALL_RULES) {
    if (rule.name === 'platform-config-exists' && meta?.platforms) {
      const missing: string[] = [];
      for (const p of meta.platforms) {
        try {
          await stat(join(platformsDir, `${p}.json`));
        } catch {
          missing.push(p);
        }
      }
      results.push({
        rule: rule.name,
        severity: rule.severity,
        message: missing.length > 0 ? `Missing platform configs: ${missing.join(', ')}` : '',
        passed: missing.length === 0,
      });
      continue;
    }

    const result = await rule.check(skillDir, meta);
    results.push(result);
  }

  return results;
}
