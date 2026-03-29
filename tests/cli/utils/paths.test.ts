import { describe, it, expect } from 'vitest';
import { resolveInstallDir, validateSkillName } from '../../../src/cli/utils/paths.js';
import type { PlatformConfig } from '../../../src/types.js';

const claude: PlatformConfig = {
  name: 'claude', configDir: '.claude', skillsDir: 'skills', agentsDir: 'agents', homeBase: '~',
};

describe('paths', () => {
  describe('resolveInstallDir', () => {
    it('resolves user-level skill path', () => {
      const result = resolveInstallDir(claude, 'weekly-report', false);
      expect(result.skills).toContain('.claude/skills/weekly-report');
      expect(result.agents).toContain('.claude/agents');
      expect(result.manifest).toContain('.claude/skills/.openskill-manifest.json');
    });

    it('resolves project-level skill path with --local', () => {
      const result = resolveInstallDir(claude, 'weekly-report', true);
      expect(result.skills).toMatch(/^\.claude\/skills\/weekly-report$/);
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
