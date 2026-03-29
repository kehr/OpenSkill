import { readdir, readFile, writeFile, mkdir, cp, stat } from 'node:fs/promises';
import { join } from 'node:path';
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
  const outDir = join(distDir, platform.name, 'skills', meta.name);
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
  const outDir = join(distDir, platform.name, 'agents');
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
