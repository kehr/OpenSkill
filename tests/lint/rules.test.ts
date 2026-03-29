import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { lintSkill } from '../../src/lint/index.js';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('lint', () => {
  let tempDir: string;
  let skillDir: string;
  let platformsDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `openskill-lint-test-${Date.now()}`);
    skillDir = join(tempDir, 'skills', 'test-skill');
    platformsDir = join(tempDir, 'platforms');
    await mkdir(join(skillDir, 'specs'), { recursive: true });
    await mkdir(join(skillDir, 'templates'), { recursive: true });
    await mkdir(join(skillDir, 'examples'), { recursive: true });
    await mkdir(platformsDir, { recursive: true });
    await writeFile(join(platformsDir, 'claude.json'), JSON.stringify({
      name: 'claude', configDir: '.claude', skillsDir: 'skills', agentsDir: 'agents', homeBase: '~',
    }));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('passes a valid skill', async () => {
    await writeFile(join(skillDir, 'SKILL.md'), [
      '---',
      'name: test-skill',
      'description: Use when testing lint rules',
      '---',
      '# Test Skill',
    ].join('\n'));
    await writeFile(join(skillDir, 'skill.json'), JSON.stringify({
      name: 'test-skill', version: '1.0.0', description: 'test',
      type: 'skill', platforms: ['claude'], render: ['SKILL.md'], agents: [],
    }));
    await writeFile(join(skillDir, 'examples', 'example-1.md'), 'example');

    const results = await lintSkill(skillDir, platformsDir);
    const errors = results.filter(r => !r.passed && r.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('reports missing SKILL.md as error', async () => {
    await writeFile(join(skillDir, 'skill.json'), JSON.stringify({
      name: 'test-skill', version: '1.0.0', description: 'test',
      type: 'skill', platforms: ['claude'],
    }));

    const results = await lintSkill(skillDir, platformsDir);
    const skillMdRule = results.find(r => r.rule === 'skill-md-exists');
    expect(skillMdRule?.passed).toBe(false);
    expect(skillMdRule?.severity).toBe('error');
  });

  it('warns when description does not start with Use when', async () => {
    await writeFile(join(skillDir, 'SKILL.md'), [
      '---',
      'name: test-skill',
      'description: A cool skill',
      '---',
    ].join('\n'));
    await writeFile(join(skillDir, 'skill.json'), JSON.stringify({
      name: 'test-skill', version: '1.0.0', description: 'test',
      type: 'skill', platforms: ['claude'],
    }));

    const results = await lintSkill(skillDir, platformsDir);
    const descRule = results.find(r => r.rule === 'description-format');
    expect(descRule?.passed).toBe(false);
    expect(descRule?.severity).toBe('warn');
  });

  it('reports missing platform config as error', async () => {
    await writeFile(join(skillDir, 'SKILL.md'), [
      '---', 'name: test-skill', 'description: Use when testing', '---',
    ].join('\n'));
    await writeFile(join(skillDir, 'skill.json'), JSON.stringify({
      name: 'test-skill', version: '1.0.0', description: 'test',
      type: 'skill', platforms: ['claude', 'nonexistent'],
    }));

    const results = await lintSkill(skillDir, platformsDir);
    const platformRule = results.find(r => r.rule === 'platform-config-exists');
    expect(platformRule?.passed).toBe(false);
    expect(platformRule?.severity).toBe('error');
  });
});
