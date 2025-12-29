import { Command } from 'commander';
import chalk from 'chalk';
import { SiloWorkerAPI } from '../api.js';
import { getApiKey } from '../config.js';

export const projectCommand = new Command('project')
  .description('Project management commands');

function checkAuth() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(chalk.red('Error: Not authenticated. Run "siloworker auth login" first.'));
    process.exit(1);
  }
  return apiKey;
}

function validateProjectName(name) {
  if (!name || name.trim().length === 0) {
    return 'Project name cannot be empty';
  }
  if (name.length > 100) {
    return 'Project name must be 100 characters or less';
  }
  if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(name)) {
    return 'Project name can only contain letters, numbers, spaces, hyphens, underscores, and periods';
  }
  return null;
}

projectCommand
  .command('list')
  .description('List all projects')
  .action(async () => {
    const apiKey = checkAuth();
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      const projects = await api.get('/v1/projects');
      
      if (!Array.isArray(projects) || projects.length === 0) {
        console.log(chalk.yellow('No projects found'));
        return;
      }
      
      projects.forEach(project => {
        console.log(`${chalk.blue(project.project_id)} - ${project.name}`);
        if (project.description) {
          console.log(`  ${chalk.gray(project.description)}`);
        }
      });
    } catch (error) {
      console.error(chalk.red(`Failed to list projects: ${error.message}`));
    }
  });

projectCommand
  .command('create')
  .description('Create new project')
  .requiredOption('-n, --name <name>', 'Project name')
  .option('-d, --description <description>', 'Project description')
  .action(async (options) => {
    const apiKey = checkAuth();
    
    const nameError = validateProjectName(options.name);
    if (nameError) {
      console.error(chalk.red(`Error: ${nameError}`));
      return;
    }
    
    if (options.description && options.description.length > 500) {
      console.error(chalk.red('Error: Project description must be 500 characters or less'));
      return;
    }
    
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      const project = await api.post('/v1/projects', {
        name: options.name.trim(),
        description: options.description?.trim() || ''
      });
      
      if (!project.project_id) {
        console.error(chalk.red('Error: No project ID received from server'));
        return;
      }
      
      console.log(chalk.green(`✓ Created project: ${project.project_id}`));
      console.log(chalk.blue(`  Name: ${project.name || options.name}`));
    } catch (error) {
      console.error(chalk.red(`Failed to create project: ${error.message}`));
    }
  });

projectCommand
  .command('get <projectId>')
  .description('Get project details')
  .action(async (projectId) => {
    const apiKey = checkAuth();
    
    if (!projectId || !projectId.startsWith('prj_')) {
      console.error(chalk.red('Error: Invalid project ID format. Must start with "prj_"'));
      return;
    }
    
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      const project = await api.get(`/v1/projects/${projectId}`);
      
      console.log(`Name: ${project.name}`);
      console.log(`ID: ${project.project_id}`);
      console.log(`Description: ${project.description || 'None'}`);
      console.log(`Created: ${project.created_at}`);
    } catch (error) {
      console.error(chalk.red(`Failed to get project: ${error.message}`));
    }
  });

projectCommand
  .command('delete <projectId>')
  .description('Delete a project')
  .option('--force', 'Skip confirmation prompt')
  .action(async (projectId, options) => {
    const apiKey = checkAuth();
    
    if (!projectId || !projectId.startsWith('prj_')) {
      console.error(chalk.red('Error: Invalid project ID format. Must start with "prj_"'));
      return;
    }
    
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      // Get project details first
      const project = await api.get(`/v1/projects/${projectId}`);
      
      if (!options.force) {
        console.log(chalk.yellow(`⚠️  You are about to delete project: ${project.name} (${projectId})`));
        console.log(chalk.yellow('This action cannot be undone. Use --force to skip this confirmation.'));
        return;
      }
      
      await api.delete(`/v1/projects/${projectId}`);
      console.log(chalk.green(`✓ Project deleted: ${project.name}`));
    } catch (error) {
      console.error(chalk.red(`Failed to delete project: ${error.message}`));
    }
  });
