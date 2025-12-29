import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import { SiloWorkerAPI } from '../api.js';
import { getApiKey } from '../config.js';

export const agentCommand = new Command('agent')
  .description('Agent management commands');

agentCommand
  .command('list')
  .description('List all agents')
  .action(async () => {
    const api = new SiloWorkerAPI(getApiKey());
    const agents = await api.get('/v1/agents');
    
    if (agents.length === 0) {
      console.log(chalk.yellow('No agents found'));
      return;
    }
    
    agents.forEach(agent => {
      console.log(`${chalk.blue(agent.id)} - ${agent.name} (${agent.tools?.length || 0} tools)`);
    });
  });

agentCommand
  .command('create')
  .description('Create new agent')
  .requiredOption('-n, --name <name>', 'Agent name')
  .option('-d, --description <description>', 'Agent description')
  .option('-f, --file <file>', 'JSON file with agent configuration')
  .option('-p, --project <projectId>', 'Project ID')
  .action(async (options) => {
    const api = new SiloWorkerAPI(getApiKey());
    
    let agentData = {
      name: options.name,
      description: options.description || '',
      tools: []
    };
    
    if (options.project) {
      agentData.project_id = options.project;
    }
    
    if (options.file) {
      try {
        const fileData = JSON.parse(fs.readFileSync(options.file, 'utf8'));
        agentData = { ...agentData, ...fileData };
      } catch (error) {
        console.error(chalk.red(`Error reading file: ${error.message}`));
        return;
      }
    }
    
    const agent = await api.post('/v1/agents', agentData);
    console.log(chalk.green(`✓ Created agent: ${agent.id}`));
  });

agentCommand
  .command('get <agentId>')
  .description('Get agent details')
  .action(async (agentId) => {
    const api = new SiloWorkerAPI(getApiKey());
    const agent = await api.get(`/v1/agents/${agentId}`);
    
    console.log(`Name: ${agent.name}`);
    console.log(`Description: ${agent.description || 'None'}`);
    console.log(`Tools: ${agent.tools?.length || 0}`);
    if (agent.tools?.length > 0) {
      agent.tools.forEach((tool, i) => {
        console.log(`  ${i + 1}. ${tool.type} - ${tool.name || 'Unnamed'}`);
      });
    }
  });

agentCommand
  .command('update <agentId>')
  .description('Update agent')
  .option('-n, --name <name>', 'Agent name')
  .option('-d, --description <description>', 'Agent description')
  .option('-f, --file <file>', 'JSON file with agent configuration')
  .action(async (agentId, options) => {
    const api = new SiloWorkerAPI(getApiKey());
    
    let updateData = {};
    
    if (options.name) updateData.name = options.name;
    if (options.description) updateData.description = options.description;
    
    if (options.file) {
      try {
        const fileData = JSON.parse(fs.readFileSync(options.file, 'utf8'));
        updateData = { ...updateData, ...fileData };
      } catch (error) {
        console.error(chalk.red(`Error reading file: ${error.message}`));
        return;
      }
    }
    
    await api.put(`/v1/agents/${agentId}`, updateData);
    console.log(chalk.green('✓ Agent updated'));
  });

agentCommand
  .command('delete <agentId>')
  .description('Delete an agent')
  .action(async (agentId) => {
    const api = new SiloWorkerAPI(getApiKey());
    await api.delete(`/v1/agents/${agentId}`);
    console.log(chalk.green('✓ Agent deleted'));
  });

agentCommand
  .command('add-tool <agentId>')
  .description('Add tool to agent')
  .requiredOption('-t, --type <type>', 'Tool type (e.g., web_search, code_interpreter)')
  .option('-n, --name <name>', 'Tool name')
  .option('-c, --config <config>', 'Tool configuration as JSON string', '{}')
  .action(async (agentId, options) => {
    const api = new SiloWorkerAPI(getApiKey());
    
    let config = {};
    try {
      config = JSON.parse(options.config);
    } catch (error) {
      console.error(chalk.red('Invalid JSON config'));
      return;
    }
    
    const tool = {
      type: options.type,
      name: options.name || options.type,
      config
    };
    
    await api.post(`/v1/agents/${agentId}/tools`, tool);
    console.log(chalk.green(`✓ Added ${options.type} tool to agent`));
  });

agentCommand
  .command('remove-tool <agentId> <toolId>')
  .description('Remove tool from agent')
  .action(async (agentId, toolId) => {
    const api = new SiloWorkerAPI(getApiKey());
    await api.delete(`/v1/agents/${agentId}/tools/${toolId}`);
    console.log(chalk.green('✓ Tool removed from agent'));
  });

agentCommand
  .command('list-tools <agentId>')
  .description('List agent tools')
  .action(async (agentId) => {
    const api = new SiloWorkerAPI(getApiKey());
    const agent = await api.get(`/v1/agents/${agentId}`);
    
    if (!agent.tools || agent.tools.length === 0) {
      console.log(chalk.yellow('No tools configured'));
      return;
    }
    
    agent.tools.forEach((tool, i) => {
      console.log(`${i + 1}. ${chalk.blue(tool.type)} - ${tool.name || 'Unnamed'}`);
      if (Object.keys(tool.config || {}).length > 0) {
        console.log(`   Config: ${JSON.stringify(tool.config, null, 2)}`);
      }
    });
  });
