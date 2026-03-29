import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildAll } from '../../src/build/builder.js';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('builder', () => {
  let tempDir: string;
  let skillsDir: string;
  let agentsDir: string;
  let platformsDir: string;
  let distDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `openskill-build-test-${Date.now()}`);
    skillsDir = join(tempDir, 'skills');
    agentsDir = join(tempDir, 'agents');
    platformsDir = join(tempDir, 'platforms');
    distDir = join(tempDir, 'dist');

    await mkdir(platformsDir, { recursive: true });
    await writeFile(join(platformsDir, 'claude.json'), JSON.stringify({
      name: 'claude', configDir: '.claude', skillsDir: 'skills', agentsDir: 'agents', homeBase: '~',
    }));

    const skillDir = join(skillsDir, 'test-skill');
    await mkdir(join(skillDir, 'specs'), { recursive: true });
    await mkdir(join(skillDir, 'examples'), { recursive: true });

    await writeFile(join(skillDir, 'skill.json'), JSON.stringify({
      name: 'test-skill', version: '1.0.0', description: 'A test skill',
      type: 'skill', platforms: ['claude'],
      render: ['SKILL.md', 'specs/*.md'], agents: [],
    }));
    await writeFile(join(skillDir, 'SKILL.md'), 'Config: {{configDir}}');
    await writeFile(join(skillDir, 'specs', 'requirements.md'), 'Platform: {{platformName}}');
    await writeFile(join(skillDir, 'examples', 'example.md'), 'No {{rendering}} here');

    await mkdir(agentsDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('builds skill with rendered templates', async () => {
    const results = await buildAll({ skillsDir, agentsDir, platformsDir, distDir, verbose: false });
    expect(results).toHaveLength(1);
    expect(results[0].platform).toBe('claude');
    expect(results[0].skillsCount).toBe(1);

    const rendered = await readFile(
      join(distDir, 'claude/skills/test-skill/SKILL.md'), 'utf-8'
    );
    expect(rendered).toBe('Config: .claude');
  });

  it('renders files matching render globs', async () => {
    await buildAll({ skillsDir, agentsDir, platformsDir, distDir, verbose: false });

    const specs = await readFile(
      join(distDir, 'claude/skills/test-skill/specs/requirements.md'), 'utf-8'
    );
    expect(specs).toBe('Platform: claude');
  });

  it('copies non-render files without modification', async () => {
    await buildAll({ skillsDir, agentsDir, platformsDir, distDir, verbose: false });

    const example = await readFile(
      join(distDir, 'claude/skills/test-skill/examples/example.md'), 'utf-8'
    );
    expect(example).toBe('No {{rendering}} here');
  });

  it('includes skill.json in output', async () => {
    await buildAll({ skillsDir, agentsDir, platformsDir, distDir, verbose: false });

    const meta = await readFile(
      join(distDir, 'claude/skills/test-skill/skill.json'), 'utf-8'
    );
    const parsed = JSON.parse(meta);
    expect(parsed.name).toBe('test-skill');
  });
});
