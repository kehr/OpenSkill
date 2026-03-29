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
      expect(shouldRender('examples/example-1.md', ['SKILL.md', 'specs/*.md'])).toBe(false);
    });

    it('returns false when render list is empty', () => {
      expect(shouldRender('SKILL.md', [])).toBe(false);
    });

    it('returns false when render list is undefined', () => {
      expect(shouldRender('SKILL.md', undefined)).toBe(false);
    });
  });
});
