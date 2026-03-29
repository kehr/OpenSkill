import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { PlatformConfig } from '../types.js';

export async function loadPlatform(platformsDir: string, name: string): Promise<PlatformConfig> {
  const filePath = join(platformsDir, `${name}.json`);
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    throw new Error(`Platform config not found: ${filePath}`);
  }

  try {
    return JSON.parse(content) as PlatformConfig;
  } catch {
    throw new Error(`Invalid JSON in platform config: ${filePath}`);
  }
}

export async function loadAllPlatforms(platformsDir: string): Promise<PlatformConfig[]> {
  let files: string[];
  try {
    files = (await readdir(platformsDir)).filter(f => f.endsWith('.json'));
  } catch {
    throw new Error(`Platforms directory not found: ${platformsDir}`);
  }

  if (files.length === 0) {
    throw new Error('No platform config found');
  }

  const configs = await Promise.all(
    files.map(f => loadPlatform(platformsDir, f.replace('.json', '')))
  );
  return configs;
}
