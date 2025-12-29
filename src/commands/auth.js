import { Command } from 'commander';
import chalk from 'chalk';
import { SiloWorkerAPI } from '../api.js';
import { saveConfig, getApiKey, clearConfig } from '../config.js';

export const authCommand = new Command('auth')
  .description('Authentication commands');

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/(?=.*\d)/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}

authCommand
  .command('login')
  .description('Login with email and password')
  .requiredOption('-e, --email <email>', 'Email address')
  .requiredOption('-p, --password <password>', 'Password')
  .action(async (options) => {
    if (!validateEmail(options.email)) {
      console.error(chalk.red('Error: Invalid email format'));
      process.exit(1);
    }

    const api = new SiloWorkerAPI();
    
    try {
      const result = await api.post('/v1/auth/login', {
        email: options.email,
        password: options.password
      });
      
      if (!result.api_key) {
        console.error(chalk.red('Error: No API key received from server'));
        return;
      }
      
      saveConfig({ apiKey: result.api_key });
      console.log(chalk.green('✓ Successfully logged in'));
    } catch (error) {
      console.error(chalk.red(`Login failed: ${error.message}`));
    }
  });

authCommand
  .command('signup')
  .description('Create new account')
  .requiredOption('-e, --email <email>', 'Email address')
  .requiredOption('-p, --password <password>', 'Password')
  .action(async (options) => {
    if (!validateEmail(options.email)) {
      console.error(chalk.red('Error: Invalid email format'));
      return;
    }

    const passwordError = validatePassword(options.password);
    if (passwordError) {
      console.error(chalk.red(`Error: ${passwordError}`));
      return;
    }

    const api = new SiloWorkerAPI();
    
    try {
      await api.post('/v1/auth/signup', {
        email: options.email,
        password: options.password
      });
      
      console.log(chalk.green('✓ Account created! Please verify your email.'));
    } catch (error) {
      console.error(chalk.red(`Signup failed: ${error.message}`));
    }
  });

authCommand
  .command('status')
  .description('Check authentication status')
  .action(async () => {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.log(chalk.yellow('Not authenticated. Use "siloworker auth login" to log in.'));
      return;
    }
    
    console.log(chalk.green('✓ API key found in configuration'));
    console.log(chalk.gray('Note: Use other commands to verify if the key is still valid'));
  });

authCommand
  .command('logout')
  .description('Remove saved API key')
  .action(() => {
    clearConfig();
    console.log(chalk.green('✓ Logged out successfully'));
  });
