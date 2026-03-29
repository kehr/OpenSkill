import { Command } from 'commander';
import pc from 'picocolors';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { lintSkill } from '../../lint/index.js';
import { resolvePackageRoot, validateSkillName } from '../utils/paths.js';
import { exists } from '../utils/copy.js';
import type { LintResult } from '../../types.js';

export function registerLintCommand(program: Command): void {
  program
    .command('lint')
    .description('Lint skill(s) for correctness and best practices')
    .argument('[name]', 'lint a specific skill by name (omit to lint all)')
    .action(async (name?: string) => {
      const root = resolvePackageRoot();
      const skillsDir = join(root, 'skills');
      const platformsDir = join(root, 'platforms');

      if (!(await exists(skillsDir))) {
        console.error(pc.red('No skills/ directory found'));
        process.exit(1);
      }

      let skillDirs: { name: string; path: string }[];

      if (name) {
        if (!validateSkillName(name)) {
          console.error(pc.red(`Invalid skill name: "${name}"`));
          process.exit(1);
        }
        const skillPath = join(skillsDir, name);
        if (!(await exists(skillPath))) {
          console.error(pc.red(`Skill "${name}" not found at ${skillPath}`));
          process.exit(1);
        }
        skillDirs = [{ name, path: skillPath }];
      } else {
        const entries = await readdir(skillsDir, { withFileTypes: true });
        skillDirs = entries
          .filter(e => e.isDirectory())
          .map(e => ({ name: e.name, path: join(skillsDir, e.name) }));

        if (skillDirs.length === 0) {
          console.log(pc.yellow('No skills found to lint'));
          return;
        }
      }

      let totalErrors = 0;
      let totalWarnings = 0;
      let totalPassed = 0;

      for (const skill of skillDirs) {
        console.log(pc.bold(`\n${skill.name}`));

        const results = await lintSkill(skill.path, platformsDir);

        for (const result of results) {
          printResult(result);

          if (result.passed) {
            totalPassed++;
          } else if (result.severity === 'error') {
            totalErrors++;
          } else {
            totalWarnings++;
          }
        }
      }

      console.log('');
      console.log(
        pc.bold('Summary: ') +
        pc.green(`${totalPassed} passed`) +
        (totalWarnings > 0 ? ', ' + pc.yellow(`${totalWarnings} warning(s)`) : '') +
        (totalErrors > 0 ? ', ' + pc.red(`${totalErrors} error(s)`) : ''),
      );

      if (totalErrors > 0) {
        process.exit(1);
      }
    });
}

function printResult(result: LintResult): void {
  if (result.passed) {
    console.log(`  ${pc.green('\u2713')} ${result.rule}`);
  } else if (result.severity === 'error') {
    console.log(`  ${pc.red('\u2717')} ${result.rule}: ${pc.red(result.message)}`);
  } else {
    console.log(`  ${pc.yellow('!')} ${result.rule}: ${pc.yellow(result.message)}`);
  }
}
