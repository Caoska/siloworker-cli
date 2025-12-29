#!/usr/bin/env node

// Simple test runner for CLI validation
import { execSync } from 'child_process';
import chalk from 'chalk';

const tests = [
  {
    name: 'CLI loads without errors',
    command: 'node bin/cli.js --help',
    expectSuccess: true
  },
  {
    name: 'Shows version',
    command: 'node bin/cli.js --version',
    expectSuccess: true
  },
  {
    name: 'Auth command exists',
    command: 'node bin/cli.js auth --help',
    expectSuccess: true
  },
  {
    name: 'Project command exists',
    command: 'node bin/cli.js project --help',
    expectSuccess: true
  },
  {
    name: 'Agent command exists',
    command: 'node bin/cli.js agent --help',
    expectSuccess: true
  },
  {
    name: 'Run command exists',
    command: 'node bin/cli.js run --help',
    expectSuccess: true
  },
  {
    name: 'Schedule command exists',
    command: 'node bin/cli.js schedule --help',
    expectSuccess: true
  },
  {
    name: 'Config command exists',
    command: 'node bin/cli.js config --help',
    expectSuccess: true
  },
  {
    name: 'Validates email format',
    command: 'node bin/cli.js auth signup -e "invalid" -p "Password123" 2>&1',
    expectSuccess: true,
    expectOutput: 'Invalid email format'
  },
  {
    name: 'Validates password strength',
    command: 'node bin/cli.js auth signup -e "test@example.com" -p "weak" 2>&1',
    expectSuccess: true,
    expectOutput: 'Password must be at least 8 characters long'
  },
  {
    name: 'Validates agent ID format',
    command: 'node bin/cli.js run start invalid_id -d "{}" 2>&1',
    expectSuccess: true,
    expectOutput: 'Agent ID must start with "agent_"'
  },
  {
    name: 'Validates JSON format',
    command: 'node bin/cli.js run start agent_test -d "invalid json" 2>&1',
    expectSuccess: true,
    expectOutput: 'Invalid JSON data format'
  }
];

let passed = 0;
let failed = 0;

console.log(chalk.blue('Running CLI tests...\n'));

for (const test of tests) {
  try {
    const result = execSync(test.command, { encoding: 'utf8', stdio: 'pipe' });
    
    if (test.expectSuccess) {
      if (!test.expectOutput || result.includes(test.expectOutput)) {
        console.log(chalk.green(`✓ ${test.name}`));
        passed++;
      } else {
        console.log(chalk.red(`✗ ${test.name} - Wrong output`));
        console.log(chalk.gray(`  Expected: ${test.expectOutput}`));
        console.log(chalk.gray(`  Got: ${result.trim()}`));
        failed++;
      }
    } else {
      console.log(chalk.red(`✗ ${test.name} - Expected failure but succeeded`));
      console.log(chalk.gray(`  Output: ${result.trim()}`));
      failed++;
    }
  } catch (error) {
    const output = (error.stdout || '').trim();
    
    if (!test.expectSuccess) {
      if (!test.expectOutput || output.includes(test.expectOutput)) {
        console.log(chalk.green(`✓ ${test.name}`));
        passed++;
      } else {
        console.log(chalk.red(`✗ ${test.name} - Wrong error message`));
        console.log(chalk.gray(`  Expected: ${test.expectOutput}`));
        console.log(chalk.gray(`  Got: ${output}`));
        failed++;
      }
    } else {
      console.log(chalk.red(`✗ ${test.name} - Unexpected failure`));
      console.log(chalk.gray(`  Error: ${error.message}`));
      failed++;
    }
  }
}

console.log(`\n${chalk.blue('Test Results:')}`);
console.log(`${chalk.green('Passed:')} ${passed}`);
console.log(`${chalk.red('Failed:')} ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log(chalk.green('\n🎉 All tests passed!'));
}
