import { Command } from 'commander';
import chalk from 'chalk';
import { SiloWorkerAPI } from '../api.js';
import { saveConfig } from '../config.js';

export const authCommand = new Command('auth')
  .description('Authentication commands');

authCommand
  .command('login')
  .description('Login with email and password')
  .requiredOption('-e, --email <email>', 'Email address')
  .requiredOption('-p, --password <password>', 'Password')
  .action(async (options) => {
    const api = new SiloWorkerAPI();
    
    try {
      const result = await api.post('/v1/auth/login', {
        email: options.email,
        password: options.password
      });
      
      saveConfig({ apiKey: result.api_key });
      console.log(chalk.green('✓ Successfully logged in'));
    } catch (error) {
      console.error(chalk.red('Login failed'));
    }
  });

authCommand
  .command('signup')
  .description('Create new account')
  .requiredOption('-e, --email <email>', 'Email address')
  .requiredOption('-p, --password <password>', 'Password')
  .action(async (options) => {
    const api = new SiloWorkerAPI();
    
    try {
      await api.post('/v1/auth/signup', {
        email: options.email,
        password: options.password
      });
      
      console.log(chalk.green('✓ Account created! Please verify your email.'));
    } catch (error) {
      console.error(chalk.red('Signup failed'));
    }
  });
