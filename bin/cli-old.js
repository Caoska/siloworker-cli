#!/usr/bin/env node

import { program } from 'commander';
import { authCommand } from '../src/commands/auth.js';
import { agentCommand } from '../src/commands/agent.js';
import { runCommand } from '../src/commands/run.js';
import { workspaceCommand } from '../src/commands/workspace.js';
import { projectCommand } from '../src/commands/project.js';
import { scheduleCommand } from '../src/commands/schedule.js';

program
  .name('siloworker')
  .description('CLI for SiloWorker workflow automation')
  .version('1.0.0');

program.addCommand(authCommand);
program.addCommand(agentCommand);
program.addCommand(runCommand);
program.addCommand(workspaceCommand);
program.addCommand(projectCommand);
program.addCommand(scheduleCommand);

program.parse();
