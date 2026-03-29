import { Command } from 'commander';
import pc from 'picocolors';
import ora from 'ora';
import { join } from 'node:path';
import { buildAll, BuildOptions } from '../../build/builder.js';
import { resolvePackageRoot } from '../utils/paths.js';

export function registerBuildCommand(program: Command): void {
  program
    .command('build')
    .description('Build all skills and agents for target platforms')
    .option('-p, --platform <name>', 'build only for a specific platform')
    .option('-v, --verbose', 'show detailed build output', false)
    .action(async (opts: { platform?: string; verbose: boolean }) => {
      const root = resolvePackageRoot();
      const options: BuildOptions = {
        skillsDir: join(root, 'skills'),
        agentsDir: join(root, 'agents'),
        platformsDir: join(root, 'platforms'),
        distDir: join(root, 'dist', 'skills'),
        verbose: opts.verbose,
        platform: opts.platform,
      };

      const spinner = ora('Building skills and agents...').start();

      try {
        const results = await buildAll(options);
        spinner.succeed('Build complete');

        console.log('');
        console.log(
          pc.bold(
            padEnd('Platform', 16) +
            padEnd('Skills', 10) +
            padEnd('Agents', 10) +
            'Output',
          ),
        );
        console.log(pc.dim('-'.repeat(60)));

        for (const r of results) {
          console.log(
            padEnd(r.platform, 16) +
            padEnd(String(r.skillsCount), 10) +
            padEnd(String(r.agentsCount), 10) +
            pc.dim(r.outputDir),
          );
        }

        const totalSkills = results.reduce((s, r) => s + r.skillsCount, 0);
        const totalAgents = results.reduce((s, r) => s + r.agentsCount, 0);
        console.log('');
        console.log(
          pc.green(
            `Total: ${totalSkills} skill(s), ${totalAgents} agent(s) across ${results.length} platform(s)`,
          ),
        );
      } catch (err) {
        spinner.fail('Build failed');
        console.error(pc.red((err as Error).message));
        process.exit(1);
      }
    });
}

function padEnd(str: string, len: number): string {
  return str.padEnd(len);
}
