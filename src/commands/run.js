import { Command } from 'commander';
import chalk from 'chalk';
import { SiloWorkerAPI } from '../api.js';
import { getApiKey } from '../config.js';

export const runCommand = new Command('run')
  .description('Run management commands');

runCommand
  .command('start <agentId>')
  .description('Start a workflow run')
  .option('-d, --data <data>', 'Input data as JSON string', '{}')
  .action(async (agentId, options) => {
    const api = new SiloWorkerAPI(getApiKey());
    
    let inputData = {};
    try {
      inputData = JSON.parse(options.data);
    } catch (error) {
      console.error(chalk.red('Invalid JSON data'));
      return;
    }
    
    const run = await api.post(`/v1/agents/${agentId}/run`, inputData);
    console.log(chalk.green(`✓ Started run: ${run.id}`));
  });

runCommand
  .command('status <runId>')
  .description('Get run status')
  .action(async (runId) => {
    const api = new SiloWorkerAPI(getApiKey());
    const run = await api.get(`/v1/runs/${runId}`);
    
    console.log(`Status: ${chalk.blue(run.status)}`);
    console.log(`Progress: ${run.current_step}/${run.total_steps}`);
    if (run.error) {
      console.log(`Error: ${chalk.red(run.error)}`);
    }
  });

runCommand
  .command('resume <runId>')
  .description('Resume a failed run')
  .action(async (runId) => {
    const api = new SiloWorkerAPI(getApiKey());
    await api.post(`/v1/runs/${runId}/resume`);
    console.log(chalk.green('✓ Run resumed'));
  });

runCommand
  .command('list')
  .description('List recent runs')
  .option('-l, --limit <limit>', 'Number of runs to show', '10')
  .action(async (options) => {
    const api = new SiloWorkerAPI(getApiKey());
    const runs = await api.get(`/v1/runs?limit=${options.limit}`);
    
    runs.forEach(run => {
      const status = run.status === 'completed' ? chalk.green(run.status) : 
                    run.status === 'failed' ? chalk.red(run.status) : 
                    chalk.yellow(run.status);
      console.log(`${run.id} - ${status} - ${run.agent_name}`);
    });
  });

runCommand
  .command('resume-all-failed')
  .description('Resume all failed runs')
  .option('--dry-run', 'Show what would be resumed without actually doing it')
  .action(async (options) => {
    const api = new SiloWorkerAPI(getApiKey());
    const runs = await api.get('/v1/runs?status=failed');
    
    if (runs.length === 0) {
      console.log(chalk.yellow('No failed runs found'));
      return;
    }
    
    console.log(`Found ${runs.length} failed runs`);
    
    if (options.dryRun) {
      runs.forEach(run => {
        console.log(`Would resume: ${run.id} - ${run.agent_name}`);
      });
      return;
    }
    
    let resumed = 0;
    for (const run of runs) {
      try {
        await api.post(`/v1/runs/${run.id}/resume`);
        console.log(chalk.green(`✓ Resumed ${run.id}`));
        resumed++;
      } catch (error) {
        console.log(chalk.red(`✗ Failed to resume ${run.id}: ${error.message}`));
      }
    }
    
    console.log(chalk.blue(`Resumed ${resumed}/${runs.length} runs`));
  });

runCommand
  .command('cancel-all-running')
  .description('Cancel all running runs')
  .option('--dry-run', 'Show what would be cancelled without actually doing it')
  .action(async (options) => {
    const api = new SiloWorkerAPI(getApiKey());
    const runs = await api.get('/v1/runs?status=running');
    
    if (runs.length === 0) {
      console.log(chalk.yellow('No running runs found'));
      return;
    }
    
    console.log(`Found ${runs.length} running runs`);
    
    if (options.dryRun) {
      runs.forEach(run => {
        console.log(`Would cancel: ${run.id} - ${run.agent_name}`);
      });
      return;
    }
    
    let cancelled = 0;
    for (const run of runs) {
      try {
        await api.post(`/v1/runs/${run.id}/cancel`);
        console.log(chalk.green(`✓ Cancelled ${run.id}`));
        cancelled++;
      } catch (error) {
        console.log(chalk.red(`✗ Failed to cancel ${run.id}: ${error.message}`));
      }
    }
    
    console.log(chalk.blue(`Cancelled ${cancelled}/${runs.length} runs`));
  });

runCommand
  .command('cleanup')
  .description('Clean up old completed runs')
  .option('--days <days>', 'Delete runs older than N days', '30')
  .option('--dry-run', 'Show what would be deleted without actually doing it')
  .action(async (options) => {
    const api = new SiloWorkerAPI(getApiKey());
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(options.days));
    
    const runs = await api.get(`/v1/runs?status=completed&before=${cutoffDate.toISOString()}`);
    
    if (runs.length === 0) {
      console.log(chalk.yellow(`No completed runs older than ${options.days} days found`));
      return;
    }
    
    console.log(`Found ${runs.length} old completed runs`);
    
    if (options.dryRun) {
      runs.forEach(run => {
        console.log(`Would delete: ${run.id} - ${run.agent_name} (${run.completed_at})`);
      });
      return;
    }
    
    let deleted = 0;
    for (const run of runs) {
      try {
        await api.delete(`/v1/runs/${run.id}`);
        console.log(chalk.green(`✓ Deleted ${run.id}`));
        deleted++;
      } catch (error) {
        console.log(chalk.red(`✗ Failed to delete ${run.id}: ${error.message}`));
      }
    }
    
    console.log(chalk.blue(`Deleted ${deleted}/${runs.length} runs`));
  });
