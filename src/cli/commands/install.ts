import { Command } from 'commander';
import pc from 'picocolors';
import ora from 'ora';
import { join } from 'node:path';
import { statSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import semver from 'semver';
import { loadAllPlatforms } from '../../platforms/index.js';
import { resolveInstallDir, resolvePackageRoot, validateSkillName } from '../utils/paths.js';
import { readManifest, writeManifest, addSkillToManifest } from '../utils/manifest.js';
import { copyDir, linkDir, exists } from '../utils/copy.js';
import type { PlatformConfig, SkillMeta } from '../../types.js';

export function registerInstallCommand(program: Command): void {
  program
    .command('install')
    .description('Install a skill to target platform(s)')
    .argument('[name]', 'skill name to install')
    .option('-p, --platform <name>', 'install only to a specific platform')
    .option('-l, --local', 'install to local (project-level) config dir', false)
    .option('-f, --force', 'force install even if a newer version exists', false)
    .option('--link', 'symlink instead of copy (for development)', false)
    .option('-a, --all', 'install all available skills', false)
    .option('-v, --verbose', 'show detailed output', false)
    .action(async (name: string | undefined, opts: {
      platform?: string;
      local: boolean;
      force: boolean;
      link: boolean;
      all: boolean;
      verbose: boolean;
    }) => {
      const root = resolvePackageRoot();
      const distDir = join(root, 'dist', 'skills');

      if (!name && !opts.all) {
        console.error(pc.red('Error: specify a skill name or use --all'));
        process.exit(1);
      }

      // Load and detect platforms
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

      // Gather skill names to install
      let skillNames: string[];
      if (opts.all) {
        const skillsDistDirs = new Set<string>();
        for (const pf of platforms) {
          const pfSkillsDir = join(distDir, pf.name, 'skills');
          if (await exists(pfSkillsDir)) {
            const entries = await readdir(pfSkillsDir, { withFileTypes: true });
            for (const e of entries) {
              if (e.isDirectory()) skillsDistDirs.add(e.name);
            }
          }
        }
        skillNames = [...skillsDistDirs];
        if (skillNames.length === 0) {
          console.error(pc.yellow('No built skills found in dist/. Run "openskill build" first.'));
          process.exit(1);
        }
      } else {
        if (!validateSkillName(name!)) {
          console.error(pc.red(`Invalid skill name: "${name}"`));
          process.exit(1);
        }
        skillNames = [name!];
      }

      let installed = 0;
      let skipped = 0;

      for (const skillName of skillNames) {
        for (const pf of platforms) {
          const spinner = ora(`Installing ${pc.bold(skillName)} to ${pf.name}...`).start();

          try {
            // Locate dist artifacts
            const srcSkillDir = join(distDir, pf.name, 'skills', skillName);
            const srcAgentsDir = join(distDir, pf.name, 'agents');

            if (!(await exists(srcSkillDir))) {
              spinner.warn(`${skillName}: no build artifacts for ${pf.name} (skipped)`);
              skipped++;
              continue;
            }

            // Read skill.json from source
            const metaPath = join(srcSkillDir, 'skill.json');
            let meta: SkillMeta | undefined;
            if (await exists(metaPath)) {
              meta = JSON.parse(await readFile(metaPath, 'utf-8')) as SkillMeta;
            }
            const newVersion = meta?.version ?? '0.0.0';

            // Resolve install paths
            const paths = resolveInstallDir(pf, skillName, opts.local);
            const manifest = await readManifest(paths.manifest, pf.name);

            // Version check
            const existing = manifest.skills[skillName];
            if (existing && !opts.force) {
              const cmp = semver.compare(
                semver.coerce(newVersion) ?? '0.0.0',
                semver.coerce(existing.version) ?? '0.0.0',
              );
              if (cmp === 0) {
                spinner.info(`${skillName}@${newVersion} already installed on ${pf.name} (skipped)`);
                skipped++;
                continue;
              }
              if (cmp < 0) {
                spinner.warn(
                  `${skillName}: installed version (${existing.version}) is newer than ${newVersion}. Use --force to downgrade.`,
                );
                skipped++;
                continue;
              }
              // cmp > 0 means upgrade, proceed
              if (opts.verbose) {
                console.log(pc.dim(`  Upgrading ${existing.version} -> ${newVersion}`));
              }
            }

            // Copy or link skill directory
            if (opts.link) {
              await linkDir(srcSkillDir, paths.skills);
            } else {
              await copyDir(srcSkillDir, paths.skills);
            }

            // Install associated agents
            const agents = meta?.agents ?? [];
            for (const agentName of agents) {
              const agentSrc = join(srcAgentsDir, `${agentName}.md`);
              const agentDest = join(paths.agents, `${agentName}.md`);
              if (await exists(agentSrc)) {
                if (opts.link) {
                  await linkDir(agentSrc, agentDest);
                } else {
                  await copyDir(agentSrc, agentDest);
                }
              }
            }

            // Update manifest
            const updated = addSkillToManifest(manifest, skillName, newVersion, agents);
            await writeManifest(paths.manifest, updated);

            const action = existing ? 'Upgraded' : 'Installed';
            spinner.succeed(
              `${action} ${pc.bold(skillName)}@${newVersion} to ${pf.name}` +
              (opts.link ? pc.dim(' (linked)') : ''),
            );
            installed++;
          } catch (err) {
            spinner.fail(`Failed to install ${skillName} to ${pf.name}`);
            console.error(pc.red(`  ${(err as Error).message}`));
          }
        }
      }

      console.log('');
      console.log(
        pc.green(`Done: ${installed} installed, ${skipped} skipped`),
      );
    });
}
