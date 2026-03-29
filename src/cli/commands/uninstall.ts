import { Command } from 'commander';
import pc from 'picocolors';
import ora from 'ora';
import { join } from 'node:path';
import { statSync } from 'node:fs';
import { homedir } from 'node:os';
import { loadAllPlatforms } from '../../platforms/index.js';
import { resolveInstallDir, resolvePackageRoot, validateSkillName } from '../utils/paths.js';
import { readManifest, writeManifest, removeSkillFromManifest } from '../utils/manifest.js';
import { removeDir, exists } from '../utils/copy.js';
import type { PlatformConfig } from '../../types.js';

export function registerUninstallCommand(program: Command): void {
  program
    .command('uninstall')
    .description('Uninstall a skill from target platform(s)')
    .argument('<name>', 'skill name to uninstall')
    .option('-p, --platform <name>', 'uninstall only from a specific platform')
    .option('-l, --local', 'uninstall from local (project-level) config dir', false)
    .action(async (name: string, opts: { platform?: string; local: boolean }) => {
      if (!validateSkillName(name)) {
        console.error(pc.red(`Invalid skill name: "${name}"`));
        process.exit(1);
      }

      const root = resolvePackageRoot();
      const allPlatforms = await loadAllPlatforms(join(root, 'platforms'));
      let platforms: PlatformConfig[];

      if (opts.platform) {
        const match = allPlatforms.find(p => p.name === opts.platform);
        if (!match) {
          console.error(pc.red(`Platform "${opts.platform}" not found`));
          process.exit(1);
        }
        platforms = [match];
      } else {
        // Auto-detect installed platforms
        const detected = allPlatforms.filter(p => {
          try {
            return statSync(join(homedir(), p.configDir)).isDirectory();
          } catch {
            return false;
          }
        });

        if (detected.length === 0) {
          console.error(pc.red('No supported platforms detected. Use --platform to specify one.'));
          process.exit(1);
        }
        platforms = detected;
      }

      let removed = 0;

      for (const pf of platforms) {
        const spinner = ora(`Uninstalling ${pc.bold(name)} from ${pf.name}...`).start();

        try {
          const paths = resolveInstallDir(pf, name, opts.local);
          const manifest = await readManifest(paths.manifest, pf.name);

          // Check if skill is in manifest
          const entry = manifest.skills[name];
          if (!entry) {
            spinner.info(`${name} is not installed on ${pf.name} (skipped)`);
            continue;
          }

          // Identify agents that will become unreferenced after removal
          const agentsToRemove: string[] = [];
          for (const agentName of entry.agents) {
            const agent = manifest.agents[agentName];
            if (agent) {
              // If this skill is the only reference, the agent will be cleaned up
              const otherRefs = agent.referencedBy.filter(s => s !== name);
              if (otherRefs.length === 0) {
                agentsToRemove.push(agentName);
              }
            }
          }

          // Remove skill directory
          if (await exists(paths.skills)) {
            await removeDir(paths.skills);
          }

          // Remove unreferenced agent files
          for (const agentName of agentsToRemove) {
            const agentPath = join(paths.agents, `${agentName}.md`);
            if (await exists(agentPath)) {
              await removeDir(agentPath);
            }
          }

          // Update manifest
          const updated = removeSkillFromManifest(manifest, name);
          await writeManifest(paths.manifest, updated);

          spinner.succeed(
            `Uninstalled ${pc.bold(name)} from ${pf.name}` +
            (agentsToRemove.length > 0
              ? pc.dim(` (cleaned ${agentsToRemove.length} unreferenced agent(s))`)
              : ''),
          );
          removed++;
        } catch (err) {
          spinner.fail(`Failed to uninstall ${name} from ${pf.name}`);
          console.error(pc.red(`  ${(err as Error).message}`));
        }
      }

      console.log('');
      if (removed > 0) {
        console.log(pc.green(`Removed ${name} from ${removed} platform(s)`));
      } else {
        console.log(pc.yellow(`${name} was not installed on any detected platform`));
      }
    });
}
