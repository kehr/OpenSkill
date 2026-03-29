import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Manifest } from '../../types.js';

function createEmptyManifest(platform: string): Manifest {
  return {
    version: '1.0.0',
    platform,
    installedAt: new Date().toISOString(),
    skills: {},
    agents: {},
  };
}

export async function readManifest(manifestPath: string, platform: string): Promise<Manifest> {
  try {
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content) as Manifest;
  } catch {
    return createEmptyManifest(platform);
  }
}

export async function writeManifest(manifestPath: string, manifest: Manifest): Promise<void> {
  await mkdir(dirname(manifestPath), { recursive: true });
  const tmpPath = `${manifestPath}.tmp.${Date.now()}`;
  await writeFile(tmpPath, JSON.stringify(manifest, null, 2), 'utf-8');
  await rename(tmpPath, manifestPath);
}

export function addSkillToManifest(
  manifest: Manifest,
  skillName: string,
  version: string,
  agents: string[],
): Manifest {
  const now = new Date().toISOString();
  manifest.skills[skillName] = { version, installedAt: now, agents };

  for (const agentName of agents) {
    if (!manifest.agents[agentName]) {
      manifest.agents[agentName] = { version, installedAt: now, referencedBy: [] };
    }
    const refs = manifest.agents[agentName].referencedBy;
    if (!refs.includes(skillName)) {
      refs.push(skillName);
    }
  }

  return manifest;
}

export function removeSkillFromManifest(manifest: Manifest, skillName: string): Manifest {
  const entry = manifest.skills[skillName];
  if (!entry) return manifest;

  for (const agentName of entry.agents) {
    const agent = manifest.agents[agentName];
    if (!agent) continue;
    agent.referencedBy = agent.referencedBy.filter(s => s !== skillName);
    if (agent.referencedBy.length === 0) {
      delete manifest.agents[agentName];
    }
  }

  delete manifest.skills[skillName];
  return manifest;
}
