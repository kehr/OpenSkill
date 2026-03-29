import Handlebars from 'handlebars';
import { minimatch } from 'minimatch';

export function renderTemplate(content: string, vars: Record<string, string>): string {
  const template = Handlebars.compile(content, { strict: true });
  return template(vars);
}

export function shouldRender(filePath: string, renderGlobs: string[] | undefined): boolean {
  if (!renderGlobs || renderGlobs.length === 0) return false;
  return renderGlobs.some(pattern => minimatch(filePath, pattern));
}
