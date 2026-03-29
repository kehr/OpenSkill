import { describe, it, expect } from 'vitest';
import { buildAll } from '../src/build/builder.js';
import { lintSkill } from '../src/lint/index.js';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('integration', () => {
  it('builds weekly for all platforms', async () => {
    const root = process.cwd();
    const distDir = join(tmpdir(), `openskill-integration-${Date.now()}`);

    try {
      const results = await buildAll({
        skillsDir: join(root, 'skills'),
        agentsDir: join(root, 'agents'),
        platformsDir: join(root, 'platforms'),
        distDir,
        verbose: false,
      });

      expect(results.length).toBeGreaterThanOrEqual(2);
      for (const r of results) {
        expect(r.skillsCount).toBeGreaterThanOrEqual(1);
        const skillMd = await readFile(
          join(distDir, r.platform, 'skills/weekly/SKILL.md'), 'utf-8'
        );
        expect(skillMd).not.toContain('{{configDir}}');
      }
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  });

  it('lints weekly with 0 errors', async () => {
    const root = process.cwd();
    const results = await lintSkill(
      join(root, 'skills', 'weekly'),
      join(root, 'platforms'),
    );
    const errors = results.filter(r => !r.passed && r.severity === 'error');
    expect(errors).toHaveLength(0);
  });
});
