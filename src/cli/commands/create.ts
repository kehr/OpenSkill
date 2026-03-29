import { Command } from 'commander';
import pc from 'picocolors';
import Handlebars from 'handlebars';
import { join } from 'node:path';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolvePackageRoot, validateSkillName } from '../utils/paths.js';
import { exists } from '../utils/copy.js';

export function registerCreateCommand(program: Command): void {
  program
    .command('create')
    .description('Scaffold a new skill or agent')
    .argument('<name>', 'name for the new skill or agent')
    .option('-t, --type <type>', 'type to create: skill or agent', 'skill')
    .action(async (name: string, opts: { type: string }) => {
      if (!validateSkillName(name)) {
        console.error(pc.red(`Invalid name: "${name}". Use lowercase alphanumeric with hyphens.`));
        process.exit(1);
      }

      if (opts.type !== 'skill' && opts.type !== 'agent') {
        console.error(pc.red(`Invalid type: "${opts.type}". Must be "skill" or "agent".`));
        process.exit(1);
      }

      const root = resolvePackageRoot();

      if (opts.type === 'skill') {
        await createSkill(root, name);
      } else {
        await createAgent(root, name);
      }
    });
}

async function createSkill(root: string, name: string): Promise<void> {
  const targetDir = join(root, 'skills', name);

  if (await exists(targetDir)) {
    console.error(pc.red(`Skill "${name}" already exists at ${targetDir}`));
    process.exit(1);
  }

  const scaffoldDir = join(root, 'scaffolds', 'skill');
  if (!(await exists(scaffoldDir))) {
    console.error(pc.red(`Scaffold directory not found: ${scaffoldDir}`));
    process.exit(1);
  }

  const vars = { name };

  // Create the STE directory structure
  await mkdir(join(targetDir, 'examples'), { recursive: true });
  await mkdir(join(targetDir, 'specs'), { recursive: true });
  await mkdir(join(targetDir, 'templates'), { recursive: true });

  // Process all files from scaffold, rendering .hbs templates
  const allFiles = await getAllFilesRecursive(scaffoldDir);

  for (const relPath of allFiles) {
    const srcPath = join(scaffoldDir, relPath);
    const content = await readFile(srcPath, 'utf-8');

    if (relPath.endsWith('.hbs')) {
      // Render the template and strip the .hbs extension
      const template = Handlebars.compile(content);
      const rendered = template(vars);
      const destRelPath = relPath.replace(/\.hbs$/, '');
      const destPath = join(targetDir, destRelPath);
      await mkdir(join(destPath, '..'), { recursive: true });
      await writeFile(destPath, rendered, 'utf-8');
    } else {
      // Copy non-template files as-is
      const destPath = join(targetDir, relPath);
      await mkdir(join(destPath, '..'), { recursive: true });
      await writeFile(destPath, content, 'utf-8');
    }
  }

  console.log(pc.green(`Created skill "${name}" at ${targetDir}`));
  console.log('');
  console.log('Structure:');
  console.log(pc.dim(`  ${name}/`));
  console.log(pc.dim('    SKILL.md          - skill definition'));
  console.log(pc.dim('    skill.json        - metadata'));
  console.log(pc.dim('    specs/            - detailed requirements'));
  console.log(pc.dim('    templates/        - output templates'));
  console.log(pc.dim('    examples/         - example files'));
}

async function createAgent(root: string, name: string): Promise<void> {
  const targetDir = join(root, 'agents');
  const targetFile = join(targetDir, `${name}.md`);

  if (await exists(targetFile)) {
    console.error(pc.red(`Agent "${name}" already exists at ${targetFile}`));
    process.exit(1);
  }

  const scaffoldTemplate = join(root, 'scaffolds', 'agent', 'agent.md.hbs');
  const vars = { name };

  await mkdir(targetDir, { recursive: true });

  if (await exists(scaffoldTemplate)) {
    const content = await readFile(scaffoldTemplate, 'utf-8');
    const template = Handlebars.compile(content);
    const rendered = template(vars);
    await writeFile(targetFile, rendered, 'utf-8');
  } else {
    // Fallback: create a minimal agent file
    const fallback = [
      `# ${name}`,
      '',
      '## Role',
      '[Describe the agent role]',
      '',
      '## Instructions',
      '[Agent instructions]',
      '',
    ].join('\n');
    await writeFile(targetFile, fallback, 'utf-8');
  }

  console.log(pc.green(`Created agent "${name}" at ${targetFile}`));
}

async function getAllFilesRecursive(dir: string, base: string = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await getAllFilesRecursive(join(dir, entry.name), rel));
    } else {
      files.push(rel);
    }
  }

  return files;
}
