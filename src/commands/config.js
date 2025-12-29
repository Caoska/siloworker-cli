import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, setConfig, clearConfig, getApiKey, setApiKey } from '../config.js';
import { SiloWorkerAPI } from '../api.js';

export const configCommand = new Command('config')
  .description('Configuration management commands');

configCommand
  .command('get [key]')
  .description('Get configuration value(s)')
  .action((key) => {
    const config = getConfig();
    
    if (key) {
      const value = config[key];
      if (value !== undefined) {
        // Hide sensitive values
        if (key === 'apiKey') {
          console.log(`${key}: ${value.substring(0, 8)}...`);
        } else {
          console.log(`${key}: ${value}`);
        }
      } else {
        console.log(chalk.yellow(`Configuration key '${key}' not found`));
      }
    } else {
      if (Object.keys(config).length === 0) {
        console.log(chalk.yellow('No configuration found'));
        return;
      }
      
      Object.entries(config).forEach(([k, v]) => {
        if (k === 'apiKey') {
          console.log(`${k}: ${v.substring(0, 8)}...`);
        } else {
          console.log(`${k}: ${v}`);
        }
      });
    }
  });

configCommand
  .command('set <key> <value>')
  .description('Set configuration value')
  .action((key, value) => {
    if (key === 'apiKey') {
      console.error(chalk.red('Error: Use "siloworker auth login" to set API key'));
      return;
    }
    
    setConfig(key, value);
    console.log(chalk.green(`✓ Set ${key} = ${value}`));
  });

configCommand
  .command('unset <key>')
  .description('Remove configuration value')
  .action((key) => {
    const config = getConfig();
    if (config[key] !== undefined) {
      delete config[key];
      clearConfig();
      Object.entries(config).forEach(([k, v]) => setConfig(k, v));
      console.log(chalk.green(`✓ Removed ${key}`));
    } else {
      console.log(chalk.yellow(`Configuration key '${key}' not found`));
    }
  });

configCommand
  .command('reset')
  .description('Reset all configuration')
  .option('--force', 'Skip confirmation prompt')
  .action((options) => {
    if (!options.force) {
      console.log(chalk.yellow('⚠️  This will remove all configuration including API key'));
      console.log(chalk.yellow('Use --force to confirm'));
      return;
    }
    
    clearConfig();
    console.log(chalk.green('✓ Configuration reset'));
  });

configCommand
  .command('regenerate-key')
  .description('Regenerate API key')
  .action(async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error(chalk.red('Error: Not authenticated. Run "siloworker auth login" first.'));
      process.exit(1);
    }
    
    const api = new SiloWorkerAPI(apiKey);
    
    try {
      const result = await api.post('/v1/workspace/regenerate-key');
      setApiKey(result.api_key);
      console.log(chalk.green('✓ API key regenerated'));
      console.log(chalk.blue(`New key: ${result.api_key.substring(0, 12)}...`));
    } catch (error) {
      console.error(chalk.red(`Failed to regenerate API key: ${error.message}`));
      process.exit(1);
    }
  });
