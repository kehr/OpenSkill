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
