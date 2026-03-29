import { Command } from 'commander';
import pc from 'picocolors';
import { join } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { homedir } from 'node:os';
import { loadAllPlatforms } from '../../platforms/index.js';
import { resolvePackageRoot } from '../utils/paths.js';
import { readManifest } from '../utils/manifest.js';
import { exists } from '../utils/copy.js';
import type { PlatformConfig, SkillMeta } from '../../types.js';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List available or installed skills')
    .option('-i, --installed', 'show install status per platform (user/project level)', false)
    .option('-p, --platform <name>', 'filter to a specific platform')
    .action(async (opts: { installed: boolean; platform?: string }) => {
      const root = resolvePackageRoot();
      if (opts.installed) {
        await listInstalled(root, opts.platform);
      } else {
        await listAvailable(root);
      }
    });
}

async function listAvailable(root: string): Promise<void> {
  const skillsDir = join(root, 'skills');

  if (!(await exists(skillsDir))) {
    console.log(pc.yellow('No skills/ directory found'));
    return;
  }

  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skillDirs = entries.filter(e => e.isDirectory());

  if (skillDirs.length === 0) {
    console.log(pc.yellow('No skills found'));
    return;
  }

  console.log(pc.bold('Available skills:\n'));
  console.log(
    pc.bold(
      padEnd('Name', 24) +
      padEnd('Version', 12) +
      'Description',
    ),
  );
  console.log(pc.dim('-'.repeat(64)));

  for (const dir of skillDirs) {
    const metaPath = join(skillsDir, dir.name, 'skill.json');
    let version = '-';
    let description = '';

    try {
      const content = await readFile(metaPath, 'utf-8');
      const meta = JSON.parse(content) as SkillMeta;
      version = meta.version || '-';
      description = meta.description || '';
    } catch {
      // skill.json missing or invalid
    }

    console.log(
      padEnd(dir.name, 24) +
      padEnd(version, 12) +
      pc.dim(description),
    );
  }

  console.log('');
  console.log(pc.dim(`${skillDirs.length} skill(s) available`));
}

async function listInstalled(root: string, platformFilter?: string): Promise<void> {
  const allPlatforms = await loadAllPlatforms(join(root, 'platforms'));
  let platforms: PlatformConfig[];

  if (platformFilter) {
    const match = allPlatforms.find(p => p.name === platformFilter);
    if (!match) {
      console.error(pc.red(`Platform "${platformFilter}" not found`));
      process.exit(1);
    }
    platforms = [match];
  } else {
    platforms = allPlatforms;
  }

  let totalInstalled = 0;

  for (const pf of platforms) {
    console.log(pc.bold(`\n${pf.name}:`));

    // Check user-level
    const userManifestPath = join(
      homedir(), pf.configDir, pf.skillsDir, '.openskill-manifest.json',
    );
    const userManifest = await readManifest(userManifestPath, pf.name);
    const userSkills = Object.keys(userManifest.skills);

    // Check project-level
    const projectManifestPath = join(
      pf.configDir, pf.skillsDir, '.openskill-manifest.json',
    );
    const projectManifest = await readManifest(projectManifestPath, pf.name);
    const projectSkills = Object.keys(projectManifest.skills);

    if (userSkills.length === 0 && projectSkills.length === 0) {
      console.log(pc.dim('  (no skills installed)'));
      continue;
    }

    console.log(
      '  ' + pc.bold(
        padEnd('Name', 24) +
        padEnd('Version', 12) +
        padEnd('Scope', 12) +
        'Installed',
      ),
    );
    console.log('  ' + pc.dim('-'.repeat(60)));

    for (const name of userSkills) {
      const entry = userManifest.skills[name];
      console.log(
        '  ' +
        padEnd(name, 24) +
        padEnd(entry.version, 12) +
        padEnd(pc.blue('user'), 12 + 10) +  // +10 for ANSI escape chars
        pc.dim(entry.installedAt.split('T')[0]),
      );
      totalInstalled++;
    }

    for (const name of projectSkills) {
      if (userSkills.includes(name)) continue; // already shown as user-level
      const entry = projectManifest.skills[name];
      console.log(
        '  ' +
        padEnd(name, 24) +
        padEnd(entry.version, 12) +
        padEnd(pc.magenta('project'), 12 + 10) +
        pc.dim(entry.installedAt.split('T')[0]),
      );
      totalInstalled++;
    }
  }

  console.log('');
  console.log(pc.dim(`${totalInstalled} skill(s) installed`));
  console.log(pc.dim(`Scope: ${pc.blue('user')} = ~/{configDir}/, ${pc.magenta('project')} = ./{configDir}/`));
}

function padEnd(str: string, len: number): string {
  return str.padEnd(len);
}
