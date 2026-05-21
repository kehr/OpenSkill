#!/usr/bin/env node
// OpenSkill skill linter (zero-dependency, pure Node).
// Replaces the deleted src/lint/ TypeScript engine.
//
// Rules:
//   skill-md-exists           every skill must have SKILL.md
//   frontmatter-valid         SKILL.md must begin with a YAML frontmatter block
//   name-format               frontmatter `name` matches /^[a-z0-9][a-z0-9-]*$/ and equals the directory name
//   description-format        frontmatter `description` exists, is non-empty, is a single line, between 20 and 500 chars
//   description-no-workflow   description must not contain workflow-step phrases (Step 1, then run, etc.)
//   ste-dirs-exist            if specs/ or examples/ or templates/ exists, it must be a directory
//   examples-has-content      if examples/ exists, it must contain at least one file
//
// Usage:
//   node scripts/lint-skills.mjs                 # lint all skills
//   node scripts/lint-skills.mjs blogpost-style  # lint one
//
// Exit code 0 on pass, 1 on any error-severity rule failure.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SKILLS_DIR = 'skills';
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const WORKFLOW_PATTERNS = [
  /\bStep \d+\b/i,
  /\bthen run\b/i,
  /\bafter that\b/i,
  /\bfirst,? then\b/i,
];

function loadFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  const block = match[1];
  const out = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[m[1]] = v;
    }
  }
  return out;
}

function lintSkill(name) {
  const dir = join(SKILLS_DIR, name);
  const errors = [];
  const warnings = [];

  // rule: skill-md-exists
  const skillMd = join(dir, 'SKILL.md');
  if (!existsSync(skillMd)) {
    errors.push(`${name}: SKILL.md missing`);
    return { errors, warnings };
  }

  const content = readFileSync(skillMd, 'utf-8');

  // rule: frontmatter-valid
  const fm = loadFrontmatter(content);
  if (!fm) {
    errors.push(`${name}: SKILL.md has no YAML frontmatter`);
    return { errors, warnings };
  }

  // rule: name-format
  if (!fm.name) {
    errors.push(`${name}: frontmatter missing 'name'`);
  } else if (!NAME_PATTERN.test(fm.name)) {
    errors.push(`${name}: name '${fm.name}' does not match /^[a-z0-9][a-z0-9-]*$/`);
  } else if (fm.name !== name) {
    errors.push(`${name}: frontmatter name '${fm.name}' does not match directory name '${name}'`);
  }

  // rule: description-format
  if (!fm.description) {
    errors.push(`${name}: frontmatter missing 'description'`);
  } else {
    const d = fm.description;
    if (d.length < 20) errors.push(`${name}: description too short (${d.length} chars, need >= 20)`);
    if (d.length > 500) errors.push(`${name}: description too long (${d.length} chars, max 500)`);
    if (d.includes('\n')) errors.push(`${name}: description must be a single line`);
  }

  // rule: description-no-workflow
  if (fm.description) {
    for (const p of WORKFLOW_PATTERNS) {
      if (p.test(fm.description)) {
        errors.push(`${name}: description contains workflow phrase matching ${p}`);
        break;
      }
    }
  }

  // rule: ste-dirs-exist (only check the ones that are present)
  for (const sub of ['specs', 'templates', 'examples', 'references', 'scripts']) {
    const p = join(dir, sub);
    if (existsSync(p) && !statSync(p).isDirectory()) {
      errors.push(`${name}: ${sub} exists but is not a directory`);
    }
  }

  // rule: examples-has-content
  const ex = join(dir, 'examples');
  if (existsSync(ex) && statSync(ex).isDirectory()) {
    const entries = readdirSync(ex).filter((f) => !f.startsWith('.'));
    if (entries.length === 0) {
      warnings.push(`${name}: examples/ exists but is empty`);
    }
  }

  return { errors, warnings };
}

function main() {
  const target = process.argv[2];
  let names;
  if (target) {
    names = [target];
  } else {
    names = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  for (const name of names) {
    const { errors, warnings } = lintSkill(name);
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`ok   ${name}`);
    } else {
      console.log(`FAIL ${name}`);
      for (const e of errors) console.log(`  error: ${e}`);
      for (const w of warnings) console.log(`  warn:  ${w}`);
      totalErrors += errors.length;
      totalWarnings += warnings.length;
    }
  }

  console.log('');
  console.log(`${names.length} skill(s), ${totalErrors} error(s), ${totalWarnings} warning(s)`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
