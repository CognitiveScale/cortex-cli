#!/usr/bin/env node
import esMain from 'es-main';
import { Command } from 'commander';

export function create() {
  const program = new Command();
  program.name('cortex pipelines');
  program.description('Work with Cortex Pipelines');
  program.command('repos <cmd>', 'Work with Cortex Pipeline Repositories')
  return program;
}

if (esMain(import.meta)) {
  create().showHelpAfterError().parseAsync(process.argv);
}
export default create();
