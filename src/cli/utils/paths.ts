import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { statSync } from 'node:fs';
import type { PlatformConfig } from '../../types.js';
import { NAMESPACE } from '../../types.js';

export interface InstallPaths {
  skills: string;
  agents: string;
  manifest: string;
}

export function resolveInstallDir(
  platform: PlatformConfig,
  skillName: string,
  local: boolean,
): InstallPaths {
  const base = local
    ? platform.configDir
    : join(homedir(), platform.configDir);

  return {
    skills: join(base, platform.skillsDir, skillName),
    agents: join(base, platform.agentsDir),
    manifest: join(base, platform.skillsDir, '.openskill-manifest.json'),
  };
}

export function resolvePackageRoot(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // Walk up from this file until we find package.json
  // Works for both tsx (src/cli/utils/) and compiled (dist/cli/cli/utils/)
  let dir = join(thisFile, '..');
  for (let i = 0; i < 10; i++) {
    try {
      statSync(join(dir, 'package.json'));
      return dir;
    } catch {
      dir = join(dir, '..');
    }
  }
  return join(thisFile, '..', '..', '..', '..');
}

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export function validateSkillName(name: string): boolean {
  if (name.length === 0 || name.length > 64) return false;
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return false;
  return NAME_PATTERN.test(name);
}
