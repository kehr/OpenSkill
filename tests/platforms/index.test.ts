import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadPlatform, loadAllPlatforms } from '../../src/platforms/index.js';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('platforms', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `openskill-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('loads a single platform config', async () => {
    const config = {
      name: 'claude',
      configDir: '.claude',
      skillsDir: 'skills',
      agentsDir: 'agents',
      homeBase: '~',
    };
    await writeFile(join(tempDir, 'claude.json'), JSON.stringify(config));

    const result = await loadPlatform(tempDir, 'claude');
    expect(result).toEqual(config);
  });

  it('loads all platform configs', async () => {
    const claude = { name: 'claude', configDir: '.claude', skillsDir: 'skills', agentsDir: 'agents', homeBase: '~' };
    const joycode = { name: 'joycode', configDir: '.joycode', skillsDir: 'skills', agentsDir: 'agents', homeBase: '~' };
    await writeFile(join(tempDir, 'claude.json'), JSON.stringify(claude));
    await writeFile(join(tempDir, 'joycode.json'), JSON.stringify(joycode));

    const result = await loadAllPlatforms(tempDir);
    expect(result).toHaveLength(2);
    expect(result.map(p => p.name).sort()).toEqual(['claude', 'joycode']);
  });

  it('throws on missing platform', async () => {
    await expect(loadPlatform(tempDir, 'nonexistent')).rejects.toThrow();
  });

  it('throws on invalid JSON', async () => {
    await writeFile(join(tempDir, 'bad.json'), '{invalid}');
    await expect(loadPlatform(tempDir, 'bad')).rejects.toThrow();
  });

  it('throws when platforms dir is empty', async () => {
    await expect(loadAllPlatforms(tempDir)).rejects.toThrow('No platform config found');
  });
});
