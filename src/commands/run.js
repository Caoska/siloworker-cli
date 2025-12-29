import { Command } from 'commander';
import chalk from 'chalk';
import { SiloWorkerAPI } from '../api.js';
import { getApiKey } from '../config.js';

export const runCommand = new Command('run')
  .description('Run management commands');

function checkAuth() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(chalk.red('Error: Not authenticated. Run "siloworker auth login" first.'));
    process.exit(1);
  }
  return apiKey;
}

function validateAgentId(agentId) {
  if (!agentId || !agentId.startsWith('agent_')) {
    return 'Agent ID must start with "agent_"';
  }
  return null;
}

function validateRunId(runId) {
  if (!runId || !runId.startsWith('run_')) {
    return 'Run ID must start with "run_"';
  }
  return null;
}

runCommand
  .command('start <agentId>')
  .description('Start a workflow run')
  .option('-d, --data <data>', 'Input data as JSON string', '{}')
  .action(async (agentId, options) => {
    const apiKey = checkAuth();
    
    const agentError = validateAgentId(agentId);
    if (agentError) {
      console.error(chalk.red(`Error: ${agentError}`));
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
      const run = await api.post(`/v1/runs`, { agent_id: agentId, input: inputData });
      
      if (!run.run_id) {
        console.error(chalk.red('Error: No run ID received from server'));
        return;
      }
      
      console.log(chalk.green(`✓ Started run: ${run.run_id}`));
      console.log(chalk.blue(`  Status: ${run.status}`));
      console.log(chalk.gray(`  Use "siloworker run status ${run.run_id}" to check progress`));
    } catch (error) {
      console.error(chalk.red(`Failed to start run: ${error.message}`));
    }
  });

runCommand
  .command('status <runId>')
  .description('Get run status')
  .action(async (runId) => {
    const apiKey = checkAuth();
    
    const runError = validateRunId(runId);
    if (runError) {
      console.error(chalk.red(`Error: ${runError}`));
      return;
    }
    
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      const run = await api.get(`/v1/runs/${runId}`);
      
      const statusColor = run.status === 'completed' ? chalk.green : 
                         run.status === 'failed' ? chalk.red : 
                         chalk.yellow;
      
      console.log(`Status: ${statusColor(run.status)}`);
      console.log(`Agent: ${run.agent_id}`);
      console.log(`Created: ${run.created_at}`);
      if (run.started_at) console.log(`Started: ${run.started_at}`);
      if (run.completed_at) console.log(`Completed: ${run.completed_at}`);
      
      if (run.error) {
        console.log(`Error: ${chalk.red(run.error)}`);
      }
      
      if (run.results?.steps?.length > 0) {
        console.log(`\nSteps completed: ${run.results.steps.length}`);
        run.results.steps.forEach((step, i) => {
          const stepStatus = step.status === 'success' ? chalk.green('✓') : chalk.red('✗');
          console.log(`  ${stepStatus} ${step.config?.name || step.type} (${step.duration_ms}ms)`);
        });
      }
    } catch (error) {
      console.error(chalk.red(`Failed to get run status: ${error.message}`));
    }
  });

runCommand
  .command('resume <runId>')
  .description('Resume a failed run')
  .option('--from-step <stepIndex>', 'Resume from specific step number (0-based)')
  .action(async (runId, options) => {
    const apiKey = checkAuth();
    
    const runError = validateRunId(runId);
    if (runError) {
      console.error(chalk.red(`Error: ${runError}`));
      return;
    }
    
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      // Check if run can be resumed
      const run = await api.get(`/v1/runs/${runId}`);
      if (run.status !== 'failed') {
        console.error(chalk.red(`Error: Run is ${run.status}, can only resume failed runs`));
        return;
      }
      
      const resumeData = {};
      if (options.fromStep !== undefined) {
        const stepIndex = parseInt(options.fromStep);
        if (isNaN(stepIndex) || stepIndex < 0) {
          console.error(chalk.red('Error: Step index must be a non-negative number'));
          return;
        }
        
        if (run.results?.steps && stepIndex >= run.results.steps.length) {
          console.error(chalk.red(`Error: Step index ${stepIndex} exceeds completed steps (${run.results.steps.length})`));
          return;
        }
        
        resumeData.from_step = stepIndex;
        console.log(chalk.blue(`Resuming from step ${stepIndex}...`));
      }
      
      await api.post(`/v1/runs/${runId}/resume`, resumeData);
      console.log(chalk.green('✓ Run resumed'));
    } catch (error) {
      if (error.message.includes('from_step not supported')) {
        console.error(chalk.yellow('⚠️  Step-level resume not yet supported by API'));
        console.log(chalk.blue('Falling back to full run resume...'));
        
        try {
          await api.post(`/v1/runs/${runId}/resume`);
          console.log(chalk.green('✓ Run resumed from beginning'));
        } catch (fallbackError) {
          console.error(chalk.red(`Failed to resume run: ${fallbackError.message}`));
        }
      } else {
        console.error(chalk.red(`Failed to resume run: ${error.message}`));
      }
    }
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
      console.log(`${run.run_id} - ${status} - ${run.agent_id}`);
    });
  });

runCommand
  .command('resume-all-failed')
  .description('Resume all failed runs')
  .option('--dry-run', 'Show what would be resumed without actually doing it')
  .action(async (options) => {
    const api = new SiloWorkerAPI(getApiKey());
    const allRuns = await api.get('/v1/runs?limit=100');
    const runs = allRuns.filter(run => run.status === 'failed');
    
    if (runs.length === 0) {
      console.log(chalk.yellow('No failed runs found'));
      return;
    }
    
    console.log(`Found ${runs.length} failed runs`);
    
    if (options.dryRun) {
      runs.forEach(run => {
        console.log(`Would resume: ${run.run_id} - ${run.agent_id}`);
      });
      return;
    }
    
    let resumed = 0;
    for (const run of runs) {
      try {
        await api.post(`/v1/runs/${run.run_id}/resume`);
        console.log(chalk.green(`✓ Resumed ${run.run_id}`));
        resumed++;
      } catch (error) {
        console.log(chalk.red(`✗ Failed to resume ${run.run_id}: ${error.message}`));
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
    const allRuns = await api.get('/v1/runs?limit=100');
    const runs = allRuns.filter(run => run.status === 'running');
    
    if (runs.length === 0) {
      console.log(chalk.yellow('No running runs found'));
      return;
    }
    
    console.log(`Found ${runs.length} running runs`);
    
    if (options.dryRun) {
      runs.forEach(run => {
        console.log(`Would cancel: ${run.run_id} - ${run.agent_id}`);
      });
      return;
    }
    
    let cancelled = 0;
    for (const run of runs) {
      try {
        await api.post(`/v1/runs/${run.run_id}/cancel`);
        console.log(chalk.green(`✓ Cancelled ${run.run_id}`));
        cancelled++;
      } catch (error) {
        console.log(chalk.red(`✗ Failed to cancel ${run.run_id}: ${error.message}`));
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
        console.log(`Would delete: ${run.run_id} - ${run.agent_id} (${run.completed_at})`);
      });
      return;
    }
    
    let deleted = 0;
    for (const run of runs) {
      try {
        await api.delete(`/v1/runs/${run.run_id}`);
        console.log(chalk.green(`✓ Deleted ${run.run_id}`));
        deleted++;
      } catch (error) {
        console.log(chalk.red(`✗ Failed to delete ${run.run_id}: ${error.message}`));
      }
    }
    
    console.log(chalk.blue(`Deleted ${deleted}/${runs.length} runs`));
  });
