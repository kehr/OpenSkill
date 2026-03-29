import { Command } from 'commander';
import pc from 'picocolors';
import ora from 'ora';
import { join } from 'node:path';
import { watch, statSync } from 'node:fs';
import { buildAll, BuildOptions } from '../../build/builder.js';
import { resolvePackageRoot } from '../utils/paths.js';

export function registerDevCommand(program: Command): void {
  program
    .command('dev')
    .description('Build and watch for changes (development mode)')
    .option('-p, --platform <name>', 'build only for a specific platform')
    .option('-v, --verbose', 'show detailed build output', false)
    .action(async (opts: { platform?: string; verbose: boolean }) => {
      const root = resolvePackageRoot();
      const skillsDir = join(root, 'skills');
      const agentsDir = join(root, 'agents');

      const options: BuildOptions = {
        skillsDir,
        agentsDir,
        platformsDir: join(root, 'platforms'),
        distDir: join(root, 'dist', 'skills'),
        verbose: opts.verbose,
        platform: opts.platform,
      };

      // Initial build
      const spinner = ora('Running initial build...').start();
      try {
        const results = await buildAll(options);
        const totalSkills = results.reduce((s, r) => s + r.skillsCount, 0);
        const totalAgents = results.reduce((s, r) => s + r.agentsCount, 0);
        spinner.succeed(
          `Initial build complete: ${totalSkills} skill(s), ${totalAgents} agent(s)`,
        );
      } catch (err) {
        spinner.fail('Initial build failed');
        console.error(pc.red((err as Error).message));
        process.exit(1);
      }

      console.log('');
      console.log(pc.cyan('Watching for changes...'));
      console.log(pc.dim('Press Ctrl+C to stop\n'));

      // Debounced rebuild
      let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
      let building = false;

      async function rebuild(trigger: string): Promise<void> {
        if (building) return;
        building = true;

        const timestamp = new Date().toLocaleTimeString();
        console.log(pc.dim(`[${timestamp}]`) + ` Change detected: ${pc.bold(trigger)}`);

        const rebuildSpinner = ora('Rebuilding...').start();
        try {
          const results = await buildAll(options);
          const totalSkills = results.reduce((s, r) => s + r.skillsCount, 0);
          const totalAgents = results.reduce((s, r) => s + r.agentsCount, 0);
          rebuildSpinner.succeed(
            `Rebuilt: ${totalSkills} skill(s), ${totalAgents} agent(s)`,
          );
        } catch (err) {
          rebuildSpinner.fail('Rebuild failed');
          console.error(pc.red(`  ${(err as Error).message}`));
        }

        building = false;
      }

      function scheduleRebuild(trigger: string): void {
        if (rebuildTimer) {
          clearTimeout(rebuildTimer);
        }
        rebuildTimer = setTimeout(() => {
          rebuildTimer = null;
          rebuild(trigger);
        }, 300);
      }

      // Watch skills/ directory
      const watchDirs: { dir: string; label: string }[] = [];

      try {
        statSync(skillsDir);
        watchDirs.push({ dir: skillsDir, label: 'skills' });
      } catch {
        console.log(pc.yellow('Warning: skills/ directory not found, not watching'));
      }

      try {
        statSync(agentsDir);
        watchDirs.push({ dir: agentsDir, label: 'agents' });
      } catch {
        console.log(pc.yellow('Warning: agents/ directory not found, not watching'));
      }

      if (watchDirs.length === 0) {
        console.error(pc.red('Nothing to watch'));
        process.exit(1);
      }

      for (const { dir, label } of watchDirs) {
        watch(dir, { recursive: true }, (_event, filename) => {
          const trigger = filename
            ? `${label}/${filename}`
            : label;
          scheduleRebuild(trigger);
        });
        console.log(pc.dim(`Watching: ${dir}`));
      }
    });
}
