import { Command } from 'commander';
import chalk from 'chalk';
import { SiloWorkerAPI } from '../api.js';
import { getApiKey } from '../config.js';

export const scheduleCommand = new Command('schedule')
  .description('Schedule management commands');

scheduleCommand
  .command('list')
  .description('List all schedules')
  .action(async () => {
    const api = new SiloWorkerAPI(getApiKey());
    const schedules = await api.get('/v1/schedules');
    
    if (schedules.length === 0) {
      console.log(chalk.yellow('No schedules found'));
      return;
    }
    
    schedules.forEach(schedule => {
      const status = schedule.enabled ? chalk.green('enabled') : chalk.red('disabled');
      console.log(`${chalk.blue(schedule.id)} - ${schedule.name} (${status}) - ${schedule.cron_expression}`);
    });
  });

scheduleCommand
  .command('create')
  .description('Create new schedule')
  .requiredOption('-n, --name <name>', 'Schedule name')
  .requiredOption('-a, --agent <agentId>', 'Agent ID to run')
  .requiredOption('-c, --cron <expression>', 'Cron expression (e.g., "0 9 * * *")')
  .option('-d, --data <data>', 'Input data as JSON string', '{}')
  .action(async (options) => {
    const api = new SiloWorkerAPI(getApiKey());
    
    let inputData = {};
    try {
      inputData = JSON.parse(options.data);
    } catch (error) {
      console.error(chalk.red('Invalid JSON data'));
      return;
    }
    
    const schedule = await api.post('/v1/schedules', {
      name: options.name,
      agent_id: options.agent,
      cron_expression: options.cron,
      input_data: inputData,
      enabled: true
    });
    
    console.log(chalk.green(`✓ Created schedule: ${schedule.id}`));
  });

scheduleCommand
  .command('enable <scheduleId>')
  .description('Enable a schedule')
  .action(async (scheduleId) => {
    const api = new SiloWorkerAPI(getApiKey());
    await api.put(`/v1/schedules/${scheduleId}`, { enabled: true });
    console.log(chalk.green('✓ Schedule enabled'));
  });

scheduleCommand
  .command('disable <scheduleId>')
  .description('Disable a schedule')
  .action(async (scheduleId) => {
    const api = new SiloWorkerAPI(getApiKey());
    await api.put(`/v1/schedules/${scheduleId}`, { enabled: false });
    console.log(chalk.yellow('✓ Schedule disabled'));
  });

scheduleCommand
  .command('delete <scheduleId>')
  .description('Delete a schedule')
  .action(async (scheduleId) => {
    const api = new SiloWorkerAPI(getApiKey());
    await api.delete(`/v1/schedules/${scheduleId}`);
    console.log(chalk.green('✓ Schedule deleted'));
  });
