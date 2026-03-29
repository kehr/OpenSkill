# OpenSkill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the openskill CLI tool from scratch, providing a complete toolchain for AI coding assistant skill development and multi-platform distribution.

**Architecture:** TypeScript ESM CLI built on Commander.js. Core modules: platforms (config loading), build (Handlebars whitelist rendering), lint (rule engine), cli (commands + utils). All state tracked via atomic JSON manifest files. Build-time rendering, install-time copy.

**Tech Stack:** TypeScript, ESM, Node.js >= 18, Commander.js, Handlebars, gray-matter, picocolors, ora, vitest


## File Structure

```
src/
  types.ts                      # Shared type definitions
  platforms/
    index.ts                    # Platform config loading (shared by all modules)
  build/
    builder.ts                  # Build engine orchestration
    template.ts                 # Handlebars whitelist rendering
  lint/
    index.ts                    # Lint engine entry
    rules/
      skill-md-exists.ts
      frontmatter-valid.ts
      name-format.ts
      description-format.ts
      description-no-workflow.ts
      skill-json-exists.ts
      ste-dirs-exist.ts
      examples-has-content.ts
      no-unused-template-vars.ts
      platform-config-exists.ts
      render-files-exist.ts
  cli/
    index.ts                    # CLI entry (bin)
    commands/
      build.ts
      install.ts
      uninstall.ts
      list.ts
      create.ts
      lint.ts
      dev.ts
    utils/
      paths.ts                  # Platform path resolution
      copy.ts                   # File copy + symlink
      manifest.ts               # Manifest read/write with atomic save
platforms/
  claude.json
  joycode.json
scaffolds/
  skill/
    SKILL.md.hbs
    skill.json.hbs
    specs/requirements.md.hbs
    templates/output.md.hbs
    examples/.gitkeep
  agent/
    agent.md.hbs
skills/
  weekly-report/
    SKILL.md
    skill.json
    specs/requirements.md
    templates/output.md
    examples/good-example.md
    examples/bad-example.md
tests/
  platforms/index.test.ts
  build/template.test.ts
  build/builder.test.ts
  lint/rules.test.ts
  cli/utils/manifest.test.ts
  cli/utils/paths.test.ts
  cli/commands/build.test.ts
  cli/commands/install.test.ts
  cli/commands/uninstall.test.ts
  cli/commands/list.test.ts
  cli/commands/create.test.ts
  cli/commands/lint.test.ts
```


## Dependency Graph

```
Task 1: Project scaffolding (package.json, tsconfig, vitest config)
  │
Task 2: types.ts
  │
  ├── Task 3: platforms/index.ts
  │     │
  │     ├── Task 4: build/template.ts
  │     │     │
  │     │     └── Task 5: build/builder.ts
  │     │
  │     ├── Task 6: cli/utils/paths.ts
  │     │
  │     └── Task 7: cli/utils/manifest.ts
  │
  ├── Task 8: cli/utils/copy.ts
  │
  ├── Task 9: lint rules + engine
  │
  └── Task 10: CLI framework + build command
        │
        ├── Task 11: install command
        │     │
        │     └── Task 12: uninstall command
        │
        ├── Task 13: list command
        ├── Task 14: create command + scaffolds
        ├── Task 15: lint command
        └── Task 16: dev command

Task 17: Platform config files
Task 18: weekly-report skill content
Task 19: Integration test + final verification
```


## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "openskill",
  "version": "0.1.0",
  "description": "AI coding assistant skill development framework and distribution tool",
  "type": "module",
  "bin": {
    "openskill": "./dist-cli/cli/index.js"
  },
  "files": [
    "dist-cli/",
    "dist/",
    "scaffolds/",
    "platforms/"
  ],
  "scripts": {
    "dev": "tsx src/cli/index.ts",
    "build:cli": "tsc",
    "build:skills": "tsx src/cli/index.ts build",
    "build": "npm run build:cli && npm run build:skills",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "tsx src/cli/index.ts lint",
    "prepublishOnly": "npm run build"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": ["ai", "skill", "claude", "cli"],
  "license": "MIT"
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install commander handlebars gray-matter picocolors ora glob
npm install -D typescript tsx vitest @types/node
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "node16",
    "moduleResolution": "node16",
    "outDir": "dist-cli",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "dist-cli", "tests"]
}
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Create directory structure**

Run:
```bash
mkdir -p src/cli/commands src/cli/utils src/build src/lint/rules src/platforms
mkdir -p tests/platforms tests/build tests/lint tests/cli/utils tests/cli/commands
mkdir -p platforms scaffolds/skill/specs scaffolds/skill/templates
mkdir -p scaffolds/skill/examples
mkdir -p scaffolds/agent
mkdir -p skills/weekly-report/specs skills/weekly-report/templates
mkdir -p skills/weekly-report/examples
mkdir -p agents
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (no source files yet, just config validation)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts
git commit -m "chore: project scaffolding with TypeScript, vitest, and dependencies"
```


## Task 2: Shared Type Definitions

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write types**

```typescript
// src/types.ts

export interface PlatformConfig {
  name: string;
  configDir: string;
  skillsDir: string;
  agentsDir: string;
  homeBase: string;
}

export interface SkillMeta {
  name: string;
  version: string;
  description: string;
  type: 'skill' | 'agent';
  platforms: string[];
  render?: string[];
  agents?: string[];
}

export interface ManifestSkillEntry {
  version: string;
  installedAt: string;
  agents: string[];
}

export interface ManifestAgentEntry {
  version: string;
  installedAt: string;
  referencedBy: string[];
}

export interface Manifest {
  version: string;
  platform: string;
  installedAt: string;
  skills: Record<string, ManifestSkillEntry>;
  agents: Record<string, ManifestAgentEntry>;
}

export type LintSeverity = 'error' | 'warn';

export interface LintResult {
  rule: string;
  severity: LintSeverity;
  message: string;
  passed: boolean;
}

export interface LintRule {
  name: string;
  severity: LintSeverity;
  description: string;
  check: (skillDir: string, meta?: SkillMeta) => Promise<LintResult>;
}

export interface BuildResult {
  platform: string;
  skillsCount: number;
  agentsCount: number;
  outputDir: string;
}

export const NAMESPACE = 'openskill';
```

- [ ] **Step 2: Verify compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared type definitions"
```


## Task 3: Platform Config Loading

**Files:**
- Create: `src/platforms/index.ts`
- Create: `tests/platforms/index.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/platforms/index.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/platforms/index.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/platforms/index.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/platforms/index.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/platforms/ tests/platforms/
git commit -m "feat: platform config loading with validation"
```


## Task 4: Template Rendering

**Files:**
- Create: `src/build/template.ts`
- Create: `tests/build/template.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/build/template.test.ts
import { describe, it, expect } from 'vitest';
import { renderTemplate, shouldRender } from '../../src/build/template.js';

describe('template', () => {
  describe('renderTemplate', () => {
    it('replaces platform variables', () => {
      const content = 'Install to {{configDir}}/{{skillsDir}}/{{namespace}}/';
      const vars = { configDir: '.claude', skillsDir: 'skills', namespace: 'openskill' };
      const result = renderTemplate(content, vars);
      expect(result).toBe('Install to .claude/skills/openskill/');
    });

    it('throws on undefined variable in strict mode', () => {
      const content = 'Value: {{unknownVar}}';
      const vars = { configDir: '.claude' };
      expect(() => renderTemplate(content, vars)).toThrow();
    });

    it('handles content with no template variables', () => {
      const content = 'No variables here.';
      const vars = { configDir: '.claude' };
      const result = renderTemplate(content, vars);
      expect(result).toBe('No variables here.');
    });
  });

  describe('shouldRender', () => {
    it('matches exact file names', () => {
      expect(shouldRender('SKILL.md', ['SKILL.md', 'specs/*.md'])).toBe(true);
    });

    it('matches glob patterns', () => {
      expect(shouldRender('specs/requirements.md', ['SKILL.md', 'specs/*.md'])).toBe(true);
    });

    it('returns false for non-matching files', () => {
      expect(shouldRender('examples/good-example.md', ['SKILL.md', 'specs/*.md'])).toBe(false);
    });

    it('returns false when render list is empty', () => {
      expect(shouldRender('SKILL.md', [])).toBe(false);
    });

    it('returns false when render list is undefined', () => {
      expect(shouldRender('SKILL.md', undefined)).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/build/template.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/build/template.ts
import Handlebars from 'handlebars';
import { minimatch } from 'glob';

export function renderTemplate(content: string, vars: Record<string, string>): string {
  const template = Handlebars.compile(content, { strict: true });
  return template(vars);
}

export function shouldRender(filePath: string, renderGlobs: string[] | undefined): boolean {
  if (!renderGlobs || renderGlobs.length === 0) return false;
  return renderGlobs.some(pattern => minimatch(filePath, pattern));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/build/template.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/build/template.ts tests/build/template.test.ts
git commit -m "feat: Handlebars whitelist template rendering"
```


## Task 5: Build Engine

**Files:**
- Create: `src/build/builder.ts`
- Create: `tests/build/builder.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/build/builder.test.ts
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

    // Set up platform config
    await mkdir(platformsDir, { recursive: true });
    await writeFile(join(platformsDir, 'claude.json'), JSON.stringify({
      name: 'claude', configDir: '.claude', skillsDir: 'skills', agentsDir: 'agents', homeBase: '~',
    }));

    // Set up a test skill
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

    // Set up agents dir (empty)
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
      join(distDir, 'claude/skills/openskill/test-skill/SKILL.md'), 'utf-8'
    );
    expect(rendered).toBe('Config: .claude');
  });

  it('renders files matching render globs', async () => {
    await buildAll({ skillsDir, agentsDir, platformsDir, distDir, verbose: false });

    const specs = await readFile(
      join(distDir, 'claude/skills/openskill/test-skill/specs/requirements.md'), 'utf-8'
    );
    expect(specs).toBe('Platform: claude');
  });

  it('copies non-render files without modification', async () => {
    await buildAll({ skillsDir, agentsDir, platformsDir, distDir, verbose: false });

    const example = await readFile(
      join(distDir, 'claude/skills/openskill/test-skill/examples/example.md'), 'utf-8'
    );
    expect(example).toBe('No {{rendering}} here');
  });

  it('includes skill.json in output', async () => {
    await buildAll({ skillsDir, agentsDir, platformsDir, distDir, verbose: false });

    const meta = await readFile(
      join(distDir, 'claude/skills/openskill/test-skill/skill.json'), 'utf-8'
    );
    const parsed = JSON.parse(meta);
    expect(parsed.name).toBe('test-skill');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/build/builder.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/build/builder.ts
import { readdir, readFile, writeFile, mkdir, cp, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { loadAllPlatforms } from '../platforms/index.js';
import { renderTemplate, shouldRender } from './template.js';
import type { PlatformConfig, SkillMeta, BuildResult } from '../types.js';
import { NAMESPACE } from '../types.js';

export interface BuildOptions {
  skillsDir: string;
  agentsDir: string;
  platformsDir: string;
  distDir: string;
  verbose: boolean;
  platform?: string;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function getSubdirs(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

async function getAllFiles(dir: string, base: string = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(join(dir, entry.name), rel));
    } else {
      files.push(rel);
    }
  }
  return files;
}

function buildTemplateVars(platform: PlatformConfig): Record<string, string> {
  return {
    configDir: platform.configDir,
    skillsDir: platform.skillsDir,
    agentsDir: platform.agentsDir,
    platformName: platform.name,
    homeBase: platform.homeBase,
    namespace: NAMESPACE,
  };
}

async function buildSkillForPlatform(
  skillDir: string,
  meta: SkillMeta,
  platform: PlatformConfig,
  distDir: string,
  verbose: boolean,
): Promise<void> {
  const outDir = join(distDir, platform.name, 'skills', NAMESPACE, meta.name);
  await mkdir(outDir, { recursive: true });

  const vars = buildTemplateVars(platform);
  const files = await getAllFiles(skillDir);

  for (const file of files) {
    const srcPath = join(skillDir, file);
    const destPath = join(outDir, file);
    await mkdir(join(destPath, '..'), { recursive: true });

    if (shouldRender(file, meta.render)) {
      const content = await readFile(srcPath, 'utf-8');
      const rendered = renderTemplate(content, vars);
      await writeFile(destPath, rendered, 'utf-8');
      if (verbose) console.log(`  render: ${file}`);
    } else {
      await cp(srcPath, destPath);
      if (verbose) console.log(`  copy:   ${file}`);
    }
  }
}

async function buildAgentForPlatform(
  agentFile: string,
  agentName: string,
  platform: PlatformConfig,
  distDir: string,
  verbose: boolean,
): Promise<void> {
  const outDir = join(distDir, platform.name, 'agents', NAMESPACE);
  await mkdir(outDir, { recursive: true });

  const content = await readFile(agentFile, 'utf-8');
  const vars = buildTemplateVars(platform);
  const rendered = renderTemplate(content, vars);
  await writeFile(join(outDir, `${agentName}.md`), rendered, 'utf-8');
  if (verbose) console.log(`  render agent: ${agentName}.md`);
}

export async function buildAll(options: BuildOptions): Promise<BuildResult[]> {
  const { skillsDir, agentsDir, platformsDir, distDir, verbose, platform } = options;

  let platforms = await loadAllPlatforms(platformsDir);
  if (platform) {
    platforms = platforms.filter(p => p.name === platform);
    if (platforms.length === 0) {
      throw new Error(`Platform "${platform}" not found`);
    }
  }

  const skillNames = await getSubdirs(skillsDir);
  const results: BuildResult[] = [];

  for (const pf of platforms) {
    let skillsCount = 0;
    let agentsCount = 0;

    for (const name of skillNames) {
      const skillDir = join(skillsDir, name);
      const metaPath = join(skillDir, 'skill.json');
      if (!(await exists(metaPath))) continue;

      const meta: SkillMeta = JSON.parse(await readFile(metaPath, 'utf-8'));
      if (!meta.platforms.includes(pf.name)) continue;

      await buildSkillForPlatform(skillDir, meta, pf, distDir, verbose);
      skillsCount++;
    }

    // Build agents
    if (await exists(agentsDir)) {
      const agentEntries = await readdir(agentsDir, { withFileTypes: true });
      for (const entry of agentEntries) {
        if (entry.isDirectory()) {
          const mdFiles = (await readdir(join(agentsDir, entry.name))).filter(f => f.endsWith('.md'));
          for (const md of mdFiles) {
            await buildAgentForPlatform(
              join(agentsDir, entry.name, md),
              md.replace('.md', ''),
              pf, distDir, verbose,
            );
            agentsCount++;
          }
        } else if (entry.name.endsWith('.md')) {
          await buildAgentForPlatform(
            join(agentsDir, entry.name),
            entry.name.replace('.md', ''),
            pf, distDir, verbose,
          );
          agentsCount++;
        }
      }
    }

    results.push({
      platform: pf.name,
      skillsCount,
      agentsCount,
      outputDir: join(distDir, pf.name),
    });
  }

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/build/builder.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/build/builder.ts tests/build/builder.test.ts
git commit -m "feat: build engine with whitelist rendering and file copy"
```


## Task 6: CLI Utils - Paths

**Files:**
- Create: `src/cli/utils/paths.ts`
- Create: `tests/cli/utils/paths.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/cli/utils/paths.test.ts
import { describe, it, expect } from 'vitest';
import { resolveInstallDir, resolvePackageRoot, validateSkillName } from '../../../src/cli/utils/paths.js';
import type { PlatformConfig } from '../../../src/types.js';

const claude: PlatformConfig = {
  name: 'claude', configDir: '.claude', skillsDir: 'skills', agentsDir: 'agents', homeBase: '~',
};

describe('paths', () => {
  describe('resolveInstallDir', () => {
    it('resolves user-level skill path', () => {
      const result = resolveInstallDir(claude, 'weekly-report', false);
      expect(result.skills).toContain('.claude/skills/openskill/weekly-report');
      expect(result.agents).toContain('.claude/agents/openskill');
      expect(result.manifest).toContain('.claude/skills/openskill/.manifest.json');
    });

    it('resolves project-level skill path with --local', () => {
      const result = resolveInstallDir(claude, 'weekly-report', true);
      expect(result.skills).toMatch(/^\.claude\/skills\/openskill\/weekly-report$/);
    });
  });

  describe('validateSkillName', () => {
    it('accepts valid names', () => {
      expect(validateSkillName('weekly-report')).toBe(true);
      expect(validateSkillName('code-review-2')).toBe(true);
    });

    it('rejects names with path separators', () => {
      expect(validateSkillName('../evil')).toBe(false);
      expect(validateSkillName('a/b')).toBe(false);
    });

    it('rejects names exceeding 64 chars', () => {
      expect(validateSkillName('a'.repeat(65))).toBe(false);
    });

    it('rejects names with special chars', () => {
      expect(validateSkillName('hello world')).toBe(false);
      expect(validateSkillName('hello_world')).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cli/utils/paths.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/cli/utils/paths.ts
import { join } from 'node:path';
import { homedir } from 'node:os';
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
    skills: join(base, platform.skillsDir, NAMESPACE, skillName),
    agents: join(base, platform.agentsDir, NAMESPACE),
    manifest: join(base, platform.skillsDir, NAMESPACE, '.manifest.json'),
  };
}

export function resolvePackageRoot(): string {
  // When installed globally, __dirname points to dist-cli/cli/utils/
  // Package root is 3 levels up
  return join(import.meta.dirname, '..', '..', '..');
}

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export function validateSkillName(name: string): boolean {
  if (name.length === 0 || name.length > 64) return false;
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return false;
  return NAME_PATTERN.test(name);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/cli/utils/paths.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/cli/utils/paths.ts tests/cli/utils/paths.test.ts
git commit -m "feat: path resolution and skill name validation"
```


## Task 7: Manifest Management

**Files:**
- Create: `src/cli/utils/manifest.ts`
- Create: `tests/cli/utils/manifest.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/cli/utils/manifest.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readManifest, writeManifest, addSkillToManifest, removeSkillFromManifest } from '../../../src/cli/utils/manifest.js';
import { mkdir, rm, readFile } from 'node:fs/promises';
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
    let m = addSkillToManifest(
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cli/utils/manifest.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// src/cli/utils/manifest.ts
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/cli/utils/manifest.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/cli/utils/manifest.ts tests/cli/utils/manifest.test.ts
git commit -m "feat: manifest management with atomic write and reference counting"
```


## Task 8: File Copy Utils

**Files:**
- Create: `src/cli/utils/copy.ts`

- [ ] **Step 1: Write implementation**

```typescript
// src/cli/utils/copy.ts
import { cp, rm, symlink, stat, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true, force: true });
}

export async function linkDir(src: string, dest: string): Promise<void> {
  try {
    await rm(dest, { recursive: true, force: true });
  } catch { /* ignore */ }
  await mkdir(join(dest, '..'), { recursive: true });
  await symlink(src, dest, 'dir');
}

export async function removeDir(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

export async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Verify compiles**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/cli/utils/copy.ts
git commit -m "feat: file copy and symlink utilities"
```


## Task 9: Lint Rules and Engine

**Files:**
- Create: `src/lint/index.ts`
- Create: `src/lint/rules/*.ts` (11 rule files)
- Create: `tests/lint/rules.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/lint/rules.test.ts
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
    await mkdir(join(skillDir, 'examples', 'good'), { recursive: true });
    await mkdir(join(skillDir, 'examples', 'bad'), { recursive: true });
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
    await writeFile(join(skillDir, 'examples', 'good', 'e.md'), 'example');
    await writeFile(join(skillDir, 'examples', 'bad', 'e.md'), 'example');

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lint/rules.test.ts`
Expected: FAIL

- [ ] **Step 3: Write lint rule implementations**

Each rule file follows the same pattern. Create all 11 rule files in `src/lint/rules/`:

```typescript
// src/lint/rules/skill-md-exists.ts
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule } from '../../types.js';

export const skillMdExists: LintRule = {
  name: 'skill-md-exists',
  severity: 'error',
  description: 'SKILL.md must exist',
  async check(skillDir) {
    try {
      await stat(join(skillDir, 'SKILL.md'));
      return { rule: this.name, severity: this.severity, message: '', passed: true };
    } catch {
      return { rule: this.name, severity: this.severity, message: 'SKILL.md not found', passed: false };
    }
  },
};
```

```typescript
// src/lint/rules/frontmatter-valid.ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { LintRule } from '../../types.js';

export const frontmatterValid: LintRule = {
  name: 'frontmatter-valid',
  severity: 'error',
  description: 'name + description must be present in frontmatter',
  async check(skillDir) {
    try {
      const content = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
      const { data } = matter(content);
      if (!data.name || !data.description) {
        return { rule: this.name, severity: this.severity, message: 'name and description are required in frontmatter', passed: false };
      }
      return { rule: this.name, severity: this.severity, message: '', passed: true };
    } catch {
      return { rule: this.name, severity: this.severity, message: 'Could not read SKILL.md', passed: false };
    }
  },
};
```

```typescript
// src/lint/rules/name-format.ts
import type { LintRule, SkillMeta } from '../../types.js';

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export const nameFormat: LintRule = {
  name: 'name-format',
  severity: 'error',
  description: 'Name must use only lowercase letters, digits, hyphens, max 64 chars',
  async check(_skillDir, meta) {
    const name = meta?.name ?? '';
    if (!name || name.length > 64 || !NAME_PATTERN.test(name)) {
      return { rule: this.name, severity: this.severity, message: `Invalid name: "${name}"`, passed: false };
    }
    return { rule: this.name, severity: this.severity, message: '', passed: true };
  },
};
```

```typescript
// src/lint/rules/description-format.ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { LintRule } from '../../types.js';

export const descriptionFormat: LintRule = {
  name: 'description-format',
  severity: 'warn',
  description: 'Description should start with "Use when" and be <= 1024 chars',
  async check(skillDir) {
    try {
      const content = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
      const { data } = matter(content);
      const desc = data.description || '';
      if (!desc.startsWith('Use when') && !desc.startsWith('Use When')) {
        return { rule: this.name, severity: this.severity, message: 'description should start with "Use when"', passed: false };
      }
      if (desc.length > 1024) {
        return { rule: this.name, severity: this.severity, message: 'description exceeds 1024 characters', passed: false };
      }
      return { rule: this.name, severity: this.severity, message: '', passed: true };
    } catch {
      return { rule: this.name, severity: this.severity, message: 'Could not read SKILL.md', passed: false };
    }
  },
};
```

```typescript
// src/lint/rules/description-no-workflow.ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { LintRule } from '../../types.js';

const WORKFLOW_KEYWORDS = ['first', 'then', 'next', 'finally', 'step 1', 'step 2', 'workflow'];

export const descriptionNoWorkflow: LintRule = {
  name: 'description-no-workflow',
  severity: 'warn',
  description: 'Description should not contain workflow/process descriptions',
  async check(skillDir) {
    try {
      const content = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
      const { data } = matter(content);
      const desc = (data.description || '').toLowerCase();
      const found = WORKFLOW_KEYWORDS.find(kw => desc.includes(kw));
      if (found) {
        return { rule: this.name, severity: this.severity, message: `description contains workflow keyword: "${found}"`, passed: false };
      }
      return { rule: this.name, severity: this.severity, message: '', passed: true };
    } catch {
      return { rule: this.name, severity: this.severity, message: '', passed: true };
    }
  },
};
```

```typescript
// src/lint/rules/skill-json-exists.ts
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule } from '../../types.js';

export const skillJsonExists: LintRule = {
  name: 'skill-json-exists',
  severity: 'error',
  description: 'skill.json must exist',
  async check(skillDir) {
    try {
      await stat(join(skillDir, 'skill.json'));
      return { rule: this.name, severity: this.severity, message: '', passed: true };
    } catch {
      return { rule: this.name, severity: this.severity, message: 'skill.json not found', passed: false };
    }
  },
};
```

```typescript
// src/lint/rules/ste-dirs-exist.ts
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule } from '../../types.js';

export const steDirsExist: LintRule = {
  name: 'ste-dirs-exist',
  severity: 'warn',
  description: 'specs/, templates/, examples/ directories should exist',
  async check(skillDir) {
    const dirs = ['specs', 'templates', 'examples'];
    const missing: string[] = [];
    for (const d of dirs) {
      try { await stat(join(skillDir, d)); } catch { missing.push(d); }
    }
    if (missing.length > 0) {
      return { rule: this.name, severity: this.severity, message: `Missing directories: ${missing.join(', ')}`, passed: false };
    }
    return { rule: this.name, severity: this.severity, message: '', passed: true };
  },
};
```

```typescript
// src/lint/rules/examples-has-content.ts
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule } from '../../types.js';

export const examplesHasContent: LintRule = {
  name: 'examples-has-content',
  severity: 'warn',
  description: 'examples/ directory should exist and have non-dotfile content',
  async check(skillDir) {
    const examplesDir = join(skillDir, 'examples');
    try {
      const files = (await readdir(examplesDir)).filter(f => !f.startsWith('.'));
      if (files.length === 0) {
        return { rule: this.name, severity: this.severity, message: 'examples/ is missing or has no content', passed: false };
      }
    } catch {
      return { rule: this.name, severity: this.severity, message: 'examples/ is missing or has no content', passed: false };
    }
    return { rule: this.name, severity: this.severity, message: 'examples/ has content', passed: true };
  },
};
```

```typescript
// src/lint/rules/no-unused-template-vars.ts
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule, SkillMeta } from '../../types.js';

const KNOWN_VARS = ['configDir', 'skillsDir', 'agentsDir', 'platformName', 'homeBase', 'namespace'];

export const noUnusedTemplateVars: LintRule = {
  name: 'no-unused-template-vars',
  severity: 'warn',
  description: 'Template variables should be defined in platform config',
  async check(skillDir, meta) {
    const renderGlobs = meta?.render ?? [];
    if (renderGlobs.length === 0) {
      return { rule: this.name, severity: this.severity, message: '', passed: true };
    }
    // Simple check: scan render-target files for {{var}} patterns
    // and verify they are known variables
    try {
      const content = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
      const matches = content.match(/\{\{(\w+)\}\}/g) || [];
      const unknown = matches
        .map(m => m.replace(/\{\{|\}\}/g, ''))
        .filter(v => !KNOWN_VARS.includes(v));
      if (unknown.length > 0) {
        return { rule: this.name, severity: this.severity, message: `Unknown template variables: ${unknown.join(', ')}`, passed: false };
      }
    } catch { /* file might not exist, other rules catch that */ }
    return { rule: this.name, severity: this.severity, message: '', passed: true };
  },
};
```

```typescript
// src/lint/rules/platform-config-exists.ts
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintRule, SkillMeta } from '../../types.js';

export const platformConfigExists: LintRule = {
  name: 'platform-config-exists',
  severity: 'error',
  description: 'Platforms in skill.json must have corresponding config files',
  async check(_skillDir, meta) {
    // platformsDir is injected via the check context
    // This rule needs special handling - see lint engine
    if (!meta?.platforms) {
      return { rule: this.name, severity: this.severity, message: 'No platforms defined', passed: false };
    }
    return { rule: this.name, severity: this.severity, message: '', passed: true };
  },
};
```

```typescript
// src/lint/rules/render-files-exist.ts
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { minimatch } from 'glob';
import type { LintRule, SkillMeta } from '../../types.js';

async function getAllFiles(dir: string, base: string = ''): Promise<string[]> {
  const { readdir: rd } = await import('node:fs/promises');
  const entries = await rd(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(join(dir, entry.name), rel));
    } else {
      files.push(rel);
    }
  }
  return files;
}

export const renderFilesExist: LintRule = {
  name: 'render-files-exist',
  severity: 'warn',
  description: 'render globs in skill.json should match at least one file',
  async check(skillDir, meta) {
    const globs = meta?.render ?? [];
    if (globs.length === 0) {
      return { rule: this.name, severity: this.severity, message: '', passed: true };
    }
    const files = await getAllFiles(skillDir);
    const unmatched = globs.filter(g => !files.some(f => minimatch(f, g)));
    if (unmatched.length > 0) {
      return { rule: this.name, severity: this.severity, message: `No files match: ${unmatched.join(', ')}`, passed: false };
    }
    return { rule: this.name, severity: this.severity, message: '', passed: true };
  },
};
```

- [ ] **Step 4: Write lint engine**

```typescript
// src/lint/index.ts
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LintResult, LintRule, SkillMeta } from '../types.js';
import { skillMdExists } from './rules/skill-md-exists.js';
import { frontmatterValid } from './rules/frontmatter-valid.js';
import { nameFormat } from './rules/name-format.js';
import { descriptionFormat } from './rules/description-format.js';
import { descriptionNoWorkflow } from './rules/description-no-workflow.js';
import { skillJsonExists } from './rules/skill-json-exists.js';
import { steDirsExist } from './rules/ste-dirs-exist.js';
import { examplesHasContent } from './rules/examples-has-content.js';
import { noUnusedTemplateVars } from './rules/no-unused-template-vars.js';
import { platformConfigExists } from './rules/platform-config-exists.js';
import { renderFilesExist } from './rules/render-files-exist.js';

const ALL_RULES: LintRule[] = [
  skillMdExists,
  frontmatterValid,
  nameFormat,
  descriptionFormat,
  descriptionNoWorkflow,
  skillJsonExists,
  steDirsExist,
  examplesHasContent,
  noUnusedTemplateVars,
  platformConfigExists,
  renderFilesExist,
];

async function loadSkillMeta(skillDir: string): Promise<SkillMeta | undefined> {
  try {
    const content = await readFile(join(skillDir, 'skill.json'), 'utf-8');
    return JSON.parse(content) as SkillMeta;
  } catch {
    return undefined;
  }
}

export async function lintSkill(skillDir: string, platformsDir: string): Promise<LintResult[]> {
  const meta = await loadSkillMeta(skillDir);
  const results: LintResult[] = [];

  for (const rule of ALL_RULES) {
    // Special handling for platform-config-exists: check each platform
    if (rule.name === 'platform-config-exists' && meta?.platforms) {
      const missing: string[] = [];
      for (const p of meta.platforms) {
        try {
          await stat(join(platformsDir, `${p}.json`));
        } catch {
          missing.push(p);
        }
      }
      results.push({
        rule: rule.name,
        severity: rule.severity,
        message: missing.length > 0 ? `Missing platform configs: ${missing.join(', ')}` : '',
        passed: missing.length === 0,
      });
      continue;
    }

    const result = await rule.check(skillDir, meta);
    results.push(result);
  }

  return results;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/lint/rules.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lint/ tests/lint/
git commit -m "feat: lint engine with 11 validation rules"
```


## Task 10: CLI Framework + Build Command

**Files:**
- Create: `src/cli/index.ts`
- Create: `src/cli/commands/build.ts`

- [ ] **Step 1: Write CLI entry**

```typescript
// src/cli/index.ts
#!/usr/bin/env node
import { Command } from 'commander';
import { registerBuildCommand } from './commands/build.js';
import { registerInstallCommand } from './commands/install.js';
import { registerUninstallCommand } from './commands/uninstall.js';
import { registerListCommand } from './commands/list.js';
import { registerCreateCommand } from './commands/create.js';
import { registerLintCommand } from './commands/lint.js';
import { registerDevCommand } from './commands/dev.js';

const program = new Command();

program
  .name('openskill')
  .description('AI coding assistant skill development framework and distribution tool')
  .version('0.1.0');

registerBuildCommand(program);
registerInstallCommand(program);
registerUninstallCommand(program);
registerListCommand(program);
registerCreateCommand(program);
registerLintCommand(program);
registerDevCommand(program);

program.parse();
```

- [ ] **Step 2: Write build command**

```typescript
// src/cli/commands/build.ts
import { Command } from 'commander';
import { join } from 'node:path';
import pc from 'picocolors';
import ora from 'ora';
import { buildAll } from '../../build/builder.js';
import { resolvePackageRoot } from '../utils/paths.js';

export function registerBuildCommand(program: Command): void {
  program
    .command('build')
    .description('Build skill/agent artifacts for all platforms')
    .option('--platform <name>', 'Build for specific platform only')
    .option('--verbose', 'Show detailed build output', false)
    .action(async (opts) => {
      const root = resolvePackageRoot();
      const spinner = ora('Building...').start();

      try {
        const results = await buildAll({
          skillsDir: join(root, 'skills'),
          agentsDir: join(root, 'agents'),
          platformsDir: join(root, 'platforms'),
          distDir: join(root, 'dist'),
          verbose: opts.verbose,
          platform: opts.platform,
        });

        spinner.stop();
        console.log(pc.bold(`Building for ${results.length} platform(s)...`));
        for (const r of results) {
          console.log(`  ${pc.cyan(r.platform)}: ${r.skillsCount} skills, ${r.agentsCount} agents -> ${r.outputDir}`);
        }
        console.log(pc.green('Build complete.'));
      } catch (err: any) {
        spinner.fail(pc.red(err.message));
        process.exit(2);
      }
    });
}
```

- [ ] **Step 3: Create stub files for other commands** (to avoid import errors)

Create minimal stubs for install.ts, uninstall.ts, list.ts, create.ts, lint.ts, dev.ts that export empty `registerXxxCommand` functions:

```typescript
// Template for each stub: src/cli/commands/{name}.ts
import { Command } from 'commander';

export function register{Name}Command(program: Command): void {
  program
    .command('{name}')
    .description('TODO')
    .action(async () => {
      console.log('Not implemented yet');
    });
}
```

Create stubs for: install, uninstall, list, create, lint, dev.

- [ ] **Step 4: Verify CLI runs**

Run: `npx tsx src/cli/index.ts --help`
Expected: Shows help with all commands listed

Run: `npx tsx src/cli/index.ts build --help`
Expected: Shows build command options

- [ ] **Step 5: Commit**

```bash
git add src/cli/
git commit -m "feat: CLI framework with build command"
```


## Task 11: Install Command

**Files:**
- Modify: `src/cli/commands/install.ts`

- [ ] **Step 1: Write install command**

```typescript
// src/cli/commands/install.ts
import { Command } from 'commander';
import { join } from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import pc from 'picocolors';
import ora from 'ora';
import { loadAllPlatforms } from '../../platforms/index.js';
import { resolveInstallDir, resolvePackageRoot, validateSkillName } from '../utils/paths.js';
import { readManifest, writeManifest, addSkillToManifest } from '../utils/manifest.js';
import { copyDir, linkDir, exists } from '../utils/copy.js';
import { NAMESPACE } from '../../types.js';
import type { PlatformConfig, SkillMeta } from '../../types.js';
import { homedir } from 'node:os';
import semver from 'semver';

async function detectPlatforms(platformsDir: string): Promise<PlatformConfig[]> {
  const all = await loadAllPlatforms(platformsDir);
  return all.filter(p => {
    const dir = join(homedir(), p.configDir);
    try {
      // Synchronous check is fine for a small number of platforms
      return require('node:fs').statSync(dir).isDirectory();
    } catch {
      return false;
    }
  });
}

async function installSkill(
  skillName: string,
  platform: PlatformConfig,
  root: string,
  local: boolean,
  link: boolean,
  force: boolean,
  verbose: boolean,
): Promise<string> {
  const distSkillDir = join(root, 'dist', platform.name, 'skills', NAMESPACE, skillName);
  if (!(await exists(distSkillDir))) {
    throw new Error(`Skill "${skillName}" not found in dist/${platform.name}/. Available skills can be listed with "openskill list".`);
  }

  const paths = resolveInstallDir(platform, skillName, local);

  // Read skill.json from dist for version and agents info
  const meta: SkillMeta = JSON.parse(
    await readFile(join(distSkillDir, 'skill.json'), 'utf-8')
  );

  // Version check
  const manifest = await readManifest(paths.manifest, platform.name);
  const installed = manifest.skills[skillName];

  if (installed && !force) {
    if (installed.version === meta.version) {
      return `${pc.yellow(skillName)} already installed (v${meta.version})`;
    }
    if (semver.valid(installed.version) && semver.valid(meta.version)) {
      if (semver.gt(installed.version, meta.version)) {
        throw new Error(
          `Refusing to downgrade ${skillName} from v${installed.version} to v${meta.version}. Use --force to override.`
        );
      }
    }
  }

  const oldVersion = installed?.version;

  // Copy or link
  if (link) {
    await linkDir(distSkillDir, paths.skills);
  } else {
    await copyDir(distSkillDir, paths.skills);
  }

  // Install associated agents
  for (const agentName of meta.agents ?? []) {
    const agentSrc = join(root, 'dist', platform.name, 'agents', NAMESPACE, `${agentName}.md`);
    if (await exists(agentSrc)) {
      const agentDest = join(
        local ? platform.configDir : join(homedir(), platform.configDir),
        platform.agentsDir, NAMESPACE
      );
      await copyDir(agentSrc, join(agentDest, `${agentName}.md`));
    }
  }

  // Update manifest
  const updatedManifest = addSkillToManifest(manifest, skillName, meta.version, meta.agents ?? []);
  await writeManifest(paths.manifest, updatedManifest);

  if (oldVersion && oldVersion !== meta.version) {
    return `${pc.green(skillName)} upgraded from v${oldVersion} to v${meta.version}`;
  }
  return `${pc.green(skillName)} installed (v${meta.version})`;
}

export function registerInstallCommand(program: Command): void {
  program
    .command('install [name]')
    .description('Install a skill to target platform(s)')
    .option('--platform <name>', 'Target platform')
    .option('--local', 'Install to project-level directory', false)
    .option('--force', 'Force install (skip version check)', false)
    .option('--link', 'Use symlink instead of copy', false)
    .option('--all', 'Install all available skills', false)
    .option('--verbose', 'Show detailed output', false)
    .action(async (name, opts) => {
      if (!name && !opts.all) {
        console.error(pc.red('Please specify a skill name or use --all'));
        process.exit(1);
      }

      const root = resolvePackageRoot();
      const platformsDir = join(root, 'platforms');

      let platforms: PlatformConfig[];
      if (opts.platform) {
        const { loadPlatform } = await import('../../platforms/index.js');
        platforms = [await loadPlatform(platformsDir, opts.platform)];
      } else {
        platforms = await detectPlatforms(platformsDir);
        if (platforms.length === 0) {
          console.error(pc.red('No installed platform detected. Use --platform to specify one.'));
          process.exit(1);
        }
      }

      const spinner = ora('Installing...').start();

      try {
        if (opts.all) {
          // Install all skills for each platform
          for (const pf of platforms) {
            const distSkillsDir = join(root, 'dist', pf.name, 'skills', NAMESPACE);
            if (!(await exists(distSkillsDir))) {
              spinner.warn(`No build artifacts for ${pf.name}. Run "openskill build" first.`);
              continue;
            }
            const { readdir } = await import('node:fs/promises');
            const skills = (await readdir(distSkillsDir, { withFileTypes: true }))
              .filter(e => e.isDirectory())
              .map(e => e.name);

            spinner.stop();
            for (const s of skills) {
              const msg = await installSkill(s, pf, root, opts.local, opts.link, opts.force, opts.verbose);
              console.log(`  [${pf.name}] ${msg}`);
            }
          }
        } else {
          if (!validateSkillName(name)) {
            spinner.fail(pc.red(`Invalid skill name: "${name}"`));
            process.exit(1);
          }
          spinner.stop();
          for (const pf of platforms) {
            const msg = await installSkill(name, pf, root, opts.local, opts.link, opts.force, opts.verbose);
            console.log(`  [${pf.name}] ${msg}`);
          }
        }
      } catch (err: any) {
        spinner.fail(pc.red(err.message));
        process.exit(1);
      }
    });
}
```

- [ ] **Step 2: Install semver dependency**

Run: `npm install semver && npm install -D @types/semver`

- [ ] **Step 3: Verify CLI runs**

Run: `npx tsx src/cli/index.ts install --help`
Expected: Shows install command options

- [ ] **Step 4: Commit**

```bash
git add src/cli/commands/install.ts package.json package-lock.json
git commit -m "feat: install command with version check and agent sync"
```


## Task 12: Uninstall Command

**Files:**
- Modify: `src/cli/commands/uninstall.ts`

- [ ] **Step 1: Write uninstall command**

```typescript
// src/cli/commands/uninstall.ts
import { Command } from 'commander';
import { join } from 'node:path';
import pc from 'picocolors';
import { loadAllPlatforms, loadPlatform } from '../../platforms/index.js';
import { resolveInstallDir, resolvePackageRoot, validateSkillName } from '../utils/paths.js';
import { readManifest, writeManifest, removeSkillFromManifest } from '../utils/manifest.js';
import { removeDir, exists } from '../utils/copy.js';
import { homedir } from 'node:os';
import { NAMESPACE } from '../../types.js';
import type { PlatformConfig } from '../../types.js';

export function registerUninstallCommand(program: Command): void {
  program
    .command('uninstall <name>')
    .description('Uninstall a skill from target platform(s)')
    .option('--platform <name>', 'Target platform')
    .option('--local', 'Uninstall from project-level directory', false)
    .action(async (name, opts) => {
      if (!validateSkillName(name)) {
        console.error(pc.red(`Invalid skill name: "${name}"`));
        process.exit(1);
      }

      const root = resolvePackageRoot();
      const platformsDir = join(root, 'platforms');

      let platforms: PlatformConfig[];
      if (opts.platform) {
        platforms = [await loadPlatform(platformsDir, opts.platform)];
      } else {
        const all = await loadAllPlatforms(platformsDir);
        platforms = all.filter(p => {
          try {
            return require('node:fs').statSync(join(homedir(), p.configDir)).isDirectory();
          } catch { return false; }
        });
      }

      for (const pf of platforms) {
        const paths = resolveInstallDir(pf, name, opts.local);
        const manifest = await readManifest(paths.manifest, pf.name);

        if (!manifest.skills[name]) {
          console.log(`  [${pf.name}] ${pc.yellow(name)} not installed`);
          continue;
        }

        // Remove skill directory
        await removeDir(paths.skills);

        // Remove unreferenced agents
        const skillEntry = manifest.skills[name];
        const updated = removeSkillFromManifest(manifest, name);

        for (const agentName of skillEntry.agents) {
          if (!updated.agents[agentName]) {
            const agentPath = join(
              opts.local ? pf.configDir : join(homedir(), pf.configDir),
              pf.agentsDir, NAMESPACE, `${agentName}.md`
            );
            await removeDir(agentPath);
          }
        }

        await writeManifest(paths.manifest, updated);
        console.log(`  [${pf.name}] ${pc.green(name)} uninstalled`);
      }
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cli/commands/uninstall.ts
git commit -m "feat: uninstall command with agent reference counting"
```


## Task 13: List Command

**Files:**
- Modify: `src/cli/commands/list.ts`

- [ ] **Step 1: Write list command**

```typescript
// src/cli/commands/list.ts
import { Command } from 'commander';
import { join } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import pc from 'picocolors';
import { loadAllPlatforms } from '../../platforms/index.js';
import { resolvePackageRoot } from '../utils/paths.js';
import { readManifest } from '../utils/manifest.js';
import { exists } from '../utils/copy.js';
import { NAMESPACE } from '../../types.js';
import type { SkillMeta } from '../../types.js';
import { homedir } from 'node:os';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List available and installed skills')
    .option('--installed', 'Show only installed skills', false)
    .option('--platform <name>', 'Filter by platform')
    .action(async (opts) => {
      const root = resolvePackageRoot();
      const skillsDir = join(root, 'skills');

      // List available skills
      if (!opts.installed) {
        console.log(pc.bold('Available skills:'));
        if (await exists(skillsDir)) {
          const entries = await readdir(skillsDir, { withFileTypes: true });
          for (const e of entries.filter(e => e.isDirectory())) {
            const metaPath = join(skillsDir, e.name, 'skill.json');
            try {
              const meta: SkillMeta = JSON.parse(await readFile(metaPath, 'utf-8'));
              console.log(`  ${meta.name.padEnd(20)} v${meta.version.padEnd(8)} ${meta.description}`);
            } catch {
              console.log(`  ${e.name.padEnd(20)} ${'?'.padEnd(9)} (no skill.json)`);
            }
          }
        }
        console.log();
      }

      // List installed skills per platform
      const platforms = await loadAllPlatforms(join(root, 'platforms'));
      const filtered = opts.platform ? platforms.filter(p => p.name === opts.platform) : platforms;

      for (const pf of filtered) {
        const manifestPath = join(homedir(), pf.configDir, pf.skillsDir, NAMESPACE, '.manifest.json');
        const manifest = await readManifest(manifestPath, pf.name);
        const skillNames = Object.keys(manifest.skills);

        if (skillNames.length === 0 && opts.installed) continue;

        console.log(pc.bold(`Installed (${pf.name}):`));
        if (skillNames.length === 0) {
          console.log('  (none)');
        } else {
          for (const [name, entry] of Object.entries(manifest.skills)) {
            const installPath = join('~', pf.configDir, pf.skillsDir, NAMESPACE, name);
            console.log(`  ${pc.green('✓')} ${name.padEnd(20)} v${entry.version.padEnd(8)} ${installPath}`);
          }
        }
        console.log();
      }
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cli/commands/list.ts
git commit -m "feat: list command showing available and installed skills"
```


## Task 14: Create Command + Scaffolds

**Files:**
- Modify: `src/cli/commands/create.ts`
- Create: `scaffolds/skill/*.hbs`
- Create: `scaffolds/agent/*.hbs`

- [ ] **Step 1: Create scaffold templates**

```handlebars
{{!-- scaffolds/skill/SKILL.md.hbs --}}
---
name: {{name}}
description: Use when [describe trigger condition]
---

# {{name}}

## Overview
[Core principles, 1-2 sentences]

## When to Use
[Trigger scenarios. When NOT to use.]

## Core Pattern
[Core pattern / before-after comparison]

## Quick Reference
[Cheat sheet or key points]

## Common Mistakes
[Common errors and fixes]

See [execution requirements](specs/requirements.md) for details.
Use [output template](templates/output.md) for formatting.
Refer to [examples](examples/) for good and bad examples.
```

```json
// scaffolds/skill/skill.json.hbs (raw content, not actually handlebars in JSON)
{
  "name": "{{name}}",
  "version": "0.1.0",
  "description": "",
  "type": "skill",
  "platforms": ["claude", "joycode"],
  "render": ["SKILL.md", "specs/*.md"],
  "agents": []
}
```

```handlebars
{{!-- scaffolds/skill/specs/requirements.md.hbs --}}
# {{name}} Execution Requirements

## Prerequisites
- [List prerequisites]

## Output Format
- [Define output format constraints]

## Quality Standards
- [Define quality criteria]
```

```handlebars
{{!-- scaffolds/skill/templates/output.md.hbs --}}
# {{name}} Output Template

[Define the output skeleton here]
```

Create a `.gitkeep` file in `scaffolds/skill/examples/`.

```handlebars
{{!-- scaffolds/agent/agent.md.hbs --}}
---
name: {{name}}
description: [Brief description]
---

# {{name}}

[Agent instructions here]
```

- [ ] **Step 2: Write create command**

```typescript
// src/cli/commands/create.ts
import { Command } from 'commander';
import { join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import Handlebars from 'handlebars';
import pc from 'picocolors';
import { resolvePackageRoot, validateSkillName } from '../utils/paths.js';
import { exists } from '../utils/copy.js';

async function renderScaffold(templatePath: string, vars: Record<string, string>): Promise<string> {
  const content = await readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(content);
  return template(vars);
}

export function registerCreateCommand(program: Command): void {
  program
    .command('create <name>')
    .description('Scaffold a new skill or agent')
    .option('--type <type>', 'Type: skill or agent', 'skill')
    .action(async (name, opts) => {
      if (!validateSkillName(name)) {
        console.error(pc.red(`Invalid name: "${name}". Use lowercase letters, digits, and hyphens only.`));
        process.exit(1);
      }

      const root = resolvePackageRoot();
      const type = opts.type as 'skill' | 'agent';
      const targetDir = type === 'skill'
        ? join(root, 'skills', name)
        : join(root, 'agents', name);

      if (await exists(targetDir)) {
        console.error(pc.red(`${type} "${name}" already exists at ${targetDir}`));
        process.exit(1);
      }

      const scaffoldDir = join(root, 'scaffolds', type);
      const vars = { name };

      if (type === 'skill') {
        await mkdir(join(targetDir, 'specs'), { recursive: true });
        await mkdir(join(targetDir, 'templates'), { recursive: true });
        await mkdir(join(targetDir, 'examples', 'good'), { recursive: true });
        await mkdir(join(targetDir, 'examples', 'bad'), { recursive: true });

        await writeFile(
          join(targetDir, 'SKILL.md'),
          await renderScaffold(join(scaffoldDir, 'SKILL.md.hbs'), vars),
        );
        await writeFile(
          join(targetDir, 'skill.json'),
          await renderScaffold(join(scaffoldDir, 'skill.json.hbs'), vars),
        );
        await writeFile(
          join(targetDir, 'specs', 'requirements.md'),
          await renderScaffold(join(scaffoldDir, 'specs', 'requirements.md.hbs'), vars),
        );
        await writeFile(
          join(targetDir, 'templates', 'output.md'),
          await renderScaffold(join(scaffoldDir, 'templates', 'output.md.hbs'), vars),
        );
        await writeFile(join(targetDir, 'examples', 'good', '.gitkeep'), '');
        await writeFile(join(targetDir, 'examples', 'bad', '.gitkeep'), '');
      } else {
        await mkdir(targetDir, { recursive: true });
        await writeFile(
          join(targetDir, `${name}.md`),
          await renderScaffold(join(scaffoldDir, 'agent.md.hbs'), vars),
        );
      }

      console.log(pc.green(`Created ${type} "${name}" at ${targetDir}`));
      if (type === 'skill') {
        console.log('  Next steps:');
        console.log(`  1. Edit ${pc.cyan('SKILL.md')} - fill in description and content`);
        console.log(`  2. Edit ${pc.cyan('skill.json')} - update description`);
        console.log(`  3. Run ${pc.cyan('openskill lint ' + name)} to validate`);
      }
    });
}
```

- [ ] **Step 3: Verify create works**

Run: `npx tsx src/cli/index.ts create test-skill`
Expected: Creates skill at skills/test-skill/ with full STE structure
Then: `rm -rf skills/test-skill` (cleanup)

- [ ] **Step 4: Commit**

```bash
git add src/cli/commands/create.ts scaffolds/
git commit -m "feat: create command with skill and agent scaffolding"
```


## Task 15: Lint Command

**Files:**
- Modify: `src/cli/commands/lint.ts`

- [ ] **Step 1: Write lint command**

```typescript
// src/cli/commands/lint.ts
import { Command } from 'commander';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import pc from 'picocolors';
import { lintSkill } from '../../lint/index.js';
import { resolvePackageRoot } from '../utils/paths.js';
import { exists } from '../utils/copy.js';

export function registerLintCommand(program: Command): void {
  program
    .command('lint [name]')
    .description('Validate skill format and compliance')
    .action(async (name) => {
      const root = resolvePackageRoot();
      const skillsDir = join(root, 'skills');
      const platformsDir = join(root, 'platforms');

      let skillNames: string[];
      if (name) {
        skillNames = [name];
      } else {
        if (!(await exists(skillsDir))) {
          console.error(pc.red('No skills/ directory found'));
          process.exit(1);
        }
        const entries = await readdir(skillsDir, { withFileTypes: true });
        skillNames = entries.filter(e => e.isDirectory()).map(e => e.name);
      }

      let totalErrors = 0;
      let totalWarnings = 0;

      for (const skillName of skillNames) {
        const skillDir = join(skillsDir, skillName);
        if (!(await exists(skillDir))) {
          console.error(pc.red(`Skill "${skillName}" not found`));
          process.exit(1);
        }

        console.log(`Linting ${pc.bold(skillName)}...`);
        const results = await lintSkill(skillDir, platformsDir);

        for (const r of results) {
          if (r.passed) {
            console.log(`  ${pc.green('✓')} ${r.rule}`);
          } else if (r.severity === 'error') {
            console.log(`  ${pc.red('✗')} ${r.rule}: ${r.message}`);
            totalErrors++;
          } else {
            console.log(`  ${pc.yellow('⚠')} ${r.rule}: ${r.message}`);
            totalWarnings++;
          }
        }
        console.log();
      }

      console.log(`${skillNames.length} skill(s) checked, ${pc.red(`${totalErrors} error(s)`)}, ${pc.yellow(`${totalWarnings} warning(s)`)}`);

      if (totalErrors > 0) process.exit(1);
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cli/commands/lint.ts
git commit -m "feat: lint command with formatted output"
```


## Task 16: Dev Command

**Files:**
- Modify: `src/cli/commands/dev.ts`

- [ ] **Step 1: Write dev command**

```typescript
// src/cli/commands/dev.ts
import { Command } from 'commander';
import { join } from 'node:path';
import { watch } from 'node:fs';
import pc from 'picocolors';
import { buildAll } from '../../build/builder.js';
import { resolvePackageRoot } from '../utils/paths.js';

export function registerDevCommand(program: Command): void {
  program
    .command('dev')
    .description('Watch mode: auto build + install on file changes')
    .option('--platform <name>', 'Target platform')
    .option('--verbose', 'Show detailed output', false)
    .action(async (opts) => {
      const root = resolvePackageRoot();
      const skillsDir = join(root, 'skills');
      const agentsDir = join(root, 'agents');
      const platformsDir = join(root, 'platforms');
      const distDir = join(root, 'dist');

      // Initial build
      console.log(pc.bold('Initial build...'));
      try {
        const results = await buildAll({
          skillsDir, agentsDir, platformsDir, distDir,
          verbose: opts.verbose, platform: opts.platform,
        });
        for (const r of results) {
          console.log(`  ${pc.cyan(r.platform)}: ${r.skillsCount} skills, ${r.agentsCount} agents`);
        }
        console.log(pc.green('Build complete.'));
      } catch (err: any) {
        console.error(pc.red(err.message));
        process.exit(2);
      }

      // Watch for changes
      console.log(pc.dim(`\nWatching skills/ and agents/ for changes... (Ctrl+C to stop)\n`));

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      const rebuild = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          const time = new Date().toLocaleTimeString();
          console.log(`${pc.dim(time)} Change detected, rebuilding...`);
          try {
            const results = await buildAll({
              skillsDir, agentsDir, platformsDir, distDir,
              verbose: opts.verbose, platform: opts.platform,
            });
            for (const r of results) {
              console.log(`  ${pc.cyan(r.platform)}: ${r.skillsCount} skills, ${r.agentsCount} agents`);
            }
            console.log(pc.green('Rebuild complete.'));
          } catch (err: any) {
            console.error(pc.red(`Build failed: ${err.message}`));
          }
        }, 300);
      };

      watch(skillsDir, { recursive: true }, rebuild);
      watch(agentsDir, { recursive: true }, rebuild);
    });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cli/commands/dev.ts
git commit -m "feat: dev command with file watching and auto-rebuild"
```


## Task 17: Platform Config Files

**Files:**
- Create: `platforms/claude.json`
- Create: `platforms/joycode.json`

- [ ] **Step 1: Create platform configs**

```json
// platforms/claude.json
{
  "name": "claude",
  "configDir": ".claude",
  "skillsDir": "skills",
  "agentsDir": "agents",
  "homeBase": "~"
}
```

```json
// platforms/joycode.json
{
  "name": "joycode",
  "configDir": ".joycode",
  "skillsDir": "skills",
  "agentsDir": "agents",
  "homeBase": "~"
}
```

- [ ] **Step 2: Verify build works end-to-end**

Run: `npx tsx src/cli/index.ts build --verbose`
Expected: Build output showing skills built for both platforms

- [ ] **Step 3: Commit**

```bash
git add platforms/
git commit -m "feat: add claude and joycode platform configs"
```


## Task 18: Weekly Report Skill Content

**Files:**
- Create: `skills/weekly-report/SKILL.md`
- Create: `skills/weekly-report/skill.json`
- Create: `skills/weekly-report/specs/requirements.md`
- Create: `skills/weekly-report/templates/output.md`
- Create: `skills/weekly-report/examples/good-example.md`
- Create: `skills/weekly-report/examples/bad-example.md`

- [ ] **Step 1: Create skill.json**

```json
{
  "name": "weekly-report",
  "version": "1.0.0",
  "description": "Generate manager weekly reports",
  "type": "skill",
  "platforms": ["claude", "joycode"],
  "render": ["SKILL.md", "specs/*.md"],
  "agents": []
}
```

- [ ] **Step 2: Create SKILL.md**

The weekly-report skill content should follow the existing weekly-report skill already defined in the project (this is the first built-in skill). Create SKILL.md with proper frontmatter and content referencing STE files. The content should align with the existing `weekly-report` skill definition in the superpowers skills if available, or be authored fresh.

*Note: The actual weekly-report SKILL.md content is a separate authoring task. Create a minimal valid version here and iterate.*

- [ ] **Step 3: Create specs/requirements.md, templates/output.md, examples/**

Create minimal but valid content for each STE file to pass lint.

- [ ] **Step 4: Verify lint passes**

Run: `npx tsx src/cli/index.ts lint weekly-report`
Expected: 0 errors (warnings acceptable)

- [ ] **Step 5: Verify full build works**

Run: `npx tsx src/cli/index.ts build`
Expected: Build complete with weekly-report built for both platforms

- [ ] **Step 6: Commit**

```bash
git add skills/weekly-report/
git commit -m "feat: add weekly-report skill (first built-in skill)"
```


## Task 19: Integration Test + Final Verification

**Files:**
- Create: `tests/integration.test.ts`

- [ ] **Step 1: Write integration test**

```typescript
// tests/integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildAll } from '../src/build/builder.js';
import { lintSkill } from '../src/lint/index.js';
import { mkdir, rm, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('integration', () => {
  it('builds weekly-report for all platforms', async () => {
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

      expect(results.length).toBeGreaterThanOrEqual(2); // claude + joycode
      for (const r of results) {
        expect(r.skillsCount).toBeGreaterThanOrEqual(1);
        const skillMd = await readFile(
          join(distDir, r.platform, 'skills/openskill/weekly-report/SKILL.md'), 'utf-8'
        );
        // Verify template vars were rendered (no {{configDir}} remaining)
        expect(skillMd).not.toContain('{{configDir}}');
      }
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  });

  it('lints weekly-report with 0 errors', async () => {
    const root = process.cwd();
    const results = await lintSkill(
      join(root, 'skills', 'weekly-report'),
      join(root, 'platforms'),
    );
    const errors = results.filter(r => !r.passed && r.severity === 'error');
    expect(errors).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Verify CLI end-to-end**

```bash
npx tsx src/cli/index.ts --help
npx tsx src/cli/index.ts build --verbose
npx tsx src/cli/index.ts lint
npx tsx src/cli/index.ts list
npx tsx src/cli/index.ts create test-temp-skill
npx tsx src/cli/index.ts lint test-temp-skill
rm -rf skills/test-temp-skill
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc`
Expected: Compiles to dist-cli/ without errors

- [ ] **Step 5: Commit**

```bash
git add tests/integration.test.ts
git commit -m "test: add integration tests for build and lint"
```
