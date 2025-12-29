import { Command } from 'commander';
import chalk from 'chalk';
import { SiloWorkerAPI } from '../api.js';
import { getApiKey } from '../config.js';

export const scheduleCommand = new Command('schedule')
  .description('Schedule management commands');

function checkAuth() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(chalk.red('Error: Not authenticated. Run "siloworker auth login" first.'));
    process.exit(1);
  }
  return apiKey;
}

function validateCronExpression(cron) {
  // Basic cron validation (5 or 6 fields)
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) {
    return 'Cron expression must have 5 or 6 fields (minute hour day month weekday [year])';
  }
  
  // Check for common patterns
  const validPatterns = /^[\d\*\-\,\/]+$/;
  for (const part of parts) {
    if (!validPatterns.test(part) && part !== '?') {
      return `Invalid cron field: ${part}`;
    }
  }
  
  return null;
}

function validateAgentId(agentId) {
  if (!agentId || !agentId.startsWith('agent_')) {
    return 'Agent ID must start with "agent_"';
  }
  return null;
}

scheduleCommand
  .command('list')
  .description('List all schedules')
  .action(async () => {
    const apiKey = checkAuth();
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      const schedules = await api.get('/v1/schedules');
      
      if (!Array.isArray(schedules) || schedules.length === 0) {
        console.log(chalk.yellow('No schedules found'));
        return;
      }
      
      schedules.forEach(schedule => {
        const status = schedule.enabled ? chalk.green('enabled') : chalk.red('disabled');
        const scheduleId = schedule.schedule_id || schedule.id;
        console.log(`${chalk.blue(scheduleId)} - ${schedule.name} (${status})`);
        console.log(`  Cron: ${schedule.cron_expression}`);
        console.log(`  Agent: ${schedule.agent_id}`);
      });
    } catch (error) {
      console.error(chalk.red(`Failed to list schedules: ${error.message}`));
    }
  });

scheduleCommand
  .command('create')
  .description('Create new schedule')
  .requiredOption('-n, --name <name>', 'Schedule name')
  .requiredOption('-a, --agent <agentId>', 'Agent ID to run')
  .requiredOption('-c, --cron <expression>', 'Cron expression (e.g., "0 9 * * *")')
  .option('-d, --data <data>', 'Input data as JSON string', '{}')
  .option('--disabled', 'Create schedule in disabled state')
  .action(async (options) => {
    const apiKey = checkAuth();
    
    if (!options.name || options.name.trim().length === 0) {
      console.error(chalk.red('Error: Schedule name cannot be empty'));
      return;
    }
    
    const agentError = validateAgentId(options.agent);
    if (agentError) {
      console.error(chalk.red(`Error: ${agentError}`));
      return;
    }
    
    const cronError = validateCronExpression(options.cron);
    if (cronError) {
      console.error(chalk.red(`Error: ${cronError}`));
      console.log(chalk.yellow('Example: "0 9 * * *" (daily at 9 AM)'));
      return;
    }
    
    let inputData = {};
    try {
      inputData = JSON.parse(options.data);
    } catch (error) {
      console.error(chalk.red('Error: Invalid JSON data format'));
      console.log(chalk.yellow('Example: \'{"key": "value"}\''));
      return;
    }
    
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      const schedule = await api.post('/v1/schedules', {
        name: options.name.trim(),
        agent_id: options.agent,
        cron_expression: options.cron,
        input_data: inputData,
        enabled: !options.disabled
      });
      
      const scheduleId = schedule.schedule_id || schedule.id;
      console.log(chalk.green(`✓ Created schedule: ${scheduleId}`));
      console.log(chalk.blue(`  Status: ${options.disabled ? 'disabled' : 'enabled'}`));
    } catch (error) {
      console.error(chalk.red(`Failed to create schedule: ${error.message}`));
    }
  });

scheduleCommand
  .command('get <scheduleId>')
  .description('Get schedule details')
  .action(async (scheduleId) => {
    const apiKey = checkAuth();
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      const schedule = await api.get(`/v1/schedules/${scheduleId}`);
      
      console.log(`Name: ${schedule.name}`);
      console.log(`ID: ${schedule.schedule_id || schedule.id}`);
      console.log(`Agent: ${schedule.agent_id}`);
      console.log(`Cron: ${schedule.cron_expression}`);
      console.log(`Status: ${schedule.enabled ? 'enabled' : 'disabled'}`);
      console.log(`Created: ${schedule.created_at}`);
      if (Object.keys(schedule.input_data || {}).length > 0) {
        console.log(`Input Data: ${JSON.stringify(schedule.input_data, null, 2)}`);
      }
    } catch (error) {
      console.error(chalk.red(`Failed to get schedule: ${error.message}`));
    }
  });

scheduleCommand
  .command('enable <scheduleId>')
  .description('Enable a schedule')
  .action(async (scheduleId) => {
    const apiKey = checkAuth();
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      await api.put(`/v1/schedules/${scheduleId}`, { enabled: true });
      console.log(chalk.green('✓ Schedule enabled'));
    } catch (error) {
      console.error(chalk.red(`Failed to enable schedule: ${error.message}`));
    }
  });

scheduleCommand
  .command('disable <scheduleId>')
  .description('Disable a schedule')
  .action(async (scheduleId) => {
    const apiKey = checkAuth();
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      await api.put(`/v1/schedules/${scheduleId}`, { enabled: false });
      console.log(chalk.yellow('✓ Schedule disabled'));
    } catch (error) {
      console.error(chalk.red(`Failed to disable schedule: ${error.message}`));
    }
  });

scheduleCommand
  .command('delete <scheduleId>')
  .description('Delete a schedule')
  .option('--force', 'Skip confirmation prompt')
  .action(async (scheduleId, options) => {
    const apiKey = checkAuth();
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      if (!options.force) {
        const schedule = await api.get(`/v1/schedules/${scheduleId}`);
        console.log(chalk.yellow(`⚠️  You are about to delete schedule: ${schedule.name} (${scheduleId})`));
        console.log(chalk.yellow('This action cannot be undone. Use --force to skip this confirmation.'));
        return;
      }
      
      await api.delete(`/v1/schedules/${scheduleId}`);
      console.log(chalk.green('✓ Schedule deleted'));
    } catch (error) {
      console.error(chalk.red(`Failed to delete schedule: ${error.message}`));
    }
  });
