#!/usr/bin/env node

import { program } from 'commander';
import { authCommand } from '../src/commands/auth.js';
import { agentCommand } from '../src/commands/agent.js';
import { runCommand } from '../src/commands/run.js';
import { workspaceCommand } from '../src/commands/workspace.js';
import { projectCommand } from '../src/commands/project.js';
import { scheduleCommand } from '../src/commands/schedule.js';
import { configCommand } from '../src/commands/config.js';
import { templateCommand } from '../src/commands/template.js';
import { toolsCommand } from '../src/commands/tools.js';

program
  .name('siloworker')
  .description('CLI for SiloWorker workflow automation')
  .version('1.0.0')
  .option('--verbose', 'Enable verbose logging')
  .option('--debug', 'Enable debug mode')
  .option('--api-url <url>', 'Override API URL', 'https://api.siloworker.dev');

// Set global options
program.hook('preAction', (thisCommand, actionCommand) => {
  const opts = thisCommand.opts();
  process.env.SILOWORKER_VERBOSE = opts.verbose ? 'true' : 'false';
  process.env.SILOWORKER_DEBUG = opts.debug ? 'true' : 'false';
  process.env.SILOWORKER_API_URL = opts.apiUrl;
});

program.addCommand(authCommand);
program.addCommand(agentCommand);
program.addCommand(runCommand);
program.addCommand(workspaceCommand);
program.addCommand(projectCommand);
program.addCommand(scheduleCommand);
program.addCommand(configCommand);
program.addCommand(templateCommand);
program.addCommand(toolsCommand);

program.parse();
