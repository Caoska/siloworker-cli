import { Command } from 'commander';
import chalk from 'chalk';
import { SiloWorkerAPI } from '../api.js';
import { getApiKey } from '../config.js';

export const projectCommand = new Command('project')
  .description('Project management commands');

projectCommand
  .command('list')
  .description('List all projects')
  .action(async () => {
    const api = new SiloWorkerAPI(getApiKey());
    const projects = await api.get('/v1/projects');
    
    if (projects.length === 0) {
      console.log(chalk.yellow('No projects found'));
      return;
    }
    
    projects.forEach(project => {
      console.log(`${chalk.blue(project.id)} - ${project.name}`);
    });
  });

projectCommand
  .command('create')
  .description('Create new project')
  .requiredOption('-n, --name <name>', 'Project name')
  .option('-d, --description <description>', 'Project description')
  .action(async (options) => {
    const api = new SiloWorkerAPI(getApiKey());
    
    const project = await api.post('/v1/projects', {
      name: options.name,
      description: options.description || ''
    });
    
    console.log(chalk.green(`✓ Created project: ${project.id}`));
  });

projectCommand
  .command('delete <projectId>')
  .description('Delete a project')
  .action(async (projectId) => {
    const api = new SiloWorkerAPI(getApiKey());
    await api.delete(`/v1/projects/${projectId}`);
    console.log(chalk.green('✓ Project deleted'));
  });
