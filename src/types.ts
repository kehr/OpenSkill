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
