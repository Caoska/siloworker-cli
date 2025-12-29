import { Command } from 'commander';
import chalk from 'chalk';
import { SiloWorkerAPI } from '../api.js';
import { getApiKey } from '../config.js';

export const workspaceCommand = new Command('workspace')
  .description('Workspace management commands');

workspaceCommand
  .command('info')
  .description('Show workspace information')
  .action(async () => {
    const api = new SiloWorkerAPI(getApiKey());
    const workspace = await api.get('/v1/workspace');
    
    console.log(`Name: ${workspace.name}`);
    console.log(`Usage: ${workspace.usage.runs}/${workspace.usage.runs_limit} runs`);
    console.log(`Emails: ${workspace.usage.emails}/${workspace.usage.emails_limit}`);
    console.log(`SMS: ${workspace.usage.sms}/${workspace.usage.sms_limit}`);
  });

workspaceCommand
  .command('usage')
  .description('Show usage statistics')
  .action(async () => {
    const api = new SiloWorkerAPI(getApiKey());
    const workspace = await api.get('/v1/workspace');
    const usage = workspace.usage;
    
    const runsPct = Math.round((usage.runs / usage.runs_limit) * 100);
    const emailsPct = Math.round((usage.emails / usage.emails_limit) * 100);
    const smsPct = Math.round((usage.sms / usage.sms_limit) * 100);
    
    console.log(`Runs: ${usage.runs}/${usage.runs_limit} (${runsPct}%)`);
    console.log(`Emails: ${usage.emails}/${usage.emails_limit} (${emailsPct}%)`);
    console.log(`SMS: ${usage.sms}/${usage.sms_limit} (${smsPct}%)`);
  });

workspaceCommand
  .command('set-api-key <service> <key>')
  .description('Set API key for service (llm, sendgrid, twilio)')
  .action(async (service, key) => {
    const validServices = ['llm', 'sendgrid', 'twilio'];
    if (!validServices.includes(service)) {
      console.error(chalk.red(`Error: Invalid service. Valid services: ${validServices.join(', ')}`));
      process.exit(1);
    }
    
    const api = new SiloWorkerAPI(getApiKey());
    
    try {
      const apiKeys = { [service]: key };
      await api.put('/v1/workspace/settings', { api_keys: apiKeys });
      console.log(chalk.green(`✓ Set ${service} API key`));
    } catch (error) {
      console.error(chalk.red(`Failed to set API key: ${error.message}`));
      process.exit(1);
    }
  });

workspaceCommand
  .command('set-twilio <accountSid> <authToken>')
  .description('Set Twilio credentials')
  .action(async (accountSid, authToken) => {
    const api = new SiloWorkerAPI(getApiKey());
    
    try {
      const apiKeys = { 
        twilio: { 
          account_sid: accountSid, 
          auth_token: authToken 
        } 
      };
      await api.put('/v1/workspace/settings', { api_keys: apiKeys });
      console.log(chalk.green('✓ Set Twilio credentials'));
    } catch (error) {
      console.error(chalk.red(`Failed to set Twilio credentials: ${error.message}`));
      process.exit(1);
    }
  });
