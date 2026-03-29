import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readManifest, writeManifest, addSkillToManifest, removeSkillFromManifest } from '../../../src/cli/utils/manifest.js';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('manifest', () => {
  let tempDir: string;
  let manifestPath: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `openskill-manifest-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    manifestPath = join(tempDir, '.manifest.json');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns empty manifest when file does not exist', async () => {
    const m = await readManifest(manifestPath, 'claude');
    expect(m.skills).toEqual({});
    expect(m.agents).toEqual({});
    expect(m.platform).toBe('claude');
  });

  it('writes and reads manifest atomically', async () => {
    const m = await readManifest(manifestPath, 'claude');
    m.skills['test'] = { version: '1.0.0', installedAt: new Date().toISOString(), agents: [] };
    await writeManifest(manifestPath, m);

    const loaded = await readManifest(manifestPath, 'claude');
    expect(loaded.skills['test'].version).toBe('1.0.0');
  });

  it('adds skill with agent references', () => {
    const m = addSkillToManifest(
      { version: '1.0.0', platform: 'claude', installedAt: '', skills: {}, agents: {} },
      'weekly-report', '1.0.0', ['report-agent']
    );
    expect(m.skills['weekly-report'].agents).toEqual(['report-agent']);
    expect(m.agents['report-agent'].referencedBy).toEqual(['weekly-report']);
  });

  it('removes skill and cleans unreferenced agents', () => {
    let m = addSkillToManifest(
      { version: '1.0.0', platform: 'claude', installedAt: '', skills: {}, agents: {} },
      'weekly-report', '1.0.0', ['report-agent']
    );
    m = removeSkillFromManifest(m, 'weekly-report');
    expect(m.skills['weekly-report']).toBeUndefined();
    expect(m.agents['report-agent']).toBeUndefined();
  });

  it('keeps agent when still referenced by another skill', () => {
    let m = addSkillToManifest(
      { version: '1.0.0', platform: 'claude', installedAt: '', skills: {}, agents: {} },
      'skill-a', '1.0.0', ['shared-agent']
    );
    m = addSkillToManifest(m, 'skill-b', '1.0.0', ['shared-agent']);
    m = removeSkillFromManifest(m, 'skill-a');
    expect(m.agents['shared-agent'].referencedBy).toEqual(['skill-b']);
  });
});
