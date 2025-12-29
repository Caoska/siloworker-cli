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
      console.log(`${chalk.blue(agent.agent_id)} - ${agent.name} (${agent.nodes?.length || 0} nodes)`);
    });
  });

agentCommand
  .command('create')
  .description('Create new agent')
  .requiredOption('-n, --name <name>', 'Agent name')
  .option('-d, --description <description>', 'Agent description')
  .option('-f, --file <file>', 'JSON file with agent configuration')
  .option('-p, --project <projectId>', 'Project ID')
  .option('--trigger-type <type>', 'Trigger type (manual, webhook, schedule)', 'manual')
  .option('--trigger-name <name>', 'Trigger name', 'Manual Trigger')
  .option('--retry-attempts <attempts>', 'Max retry attempts', '3')
  .option('--retry-backoff <backoff>', 'Retry backoff strategy (exponential, linear)', 'exponential')
  .option('--timeout <seconds>', 'Timeout in seconds', '300')
  .action(async (options) => {
    const api = new SiloWorkerAPI(getApiKey());
    
    // Validate inputs
    const validTriggerTypes = ['manual', 'webhook', 'schedule'];
    if (!validTriggerTypes.includes(options.triggerType)) {
      console.error(chalk.red(`Error: Invalid trigger type. Must be one of: ${validTriggerTypes.join(', ')}`));
      return;
    }
    
    const validBackoffTypes = ['exponential', 'linear'];
    if (!validBackoffTypes.includes(options.retryBackoff)) {
      console.error(chalk.red(`Error: Invalid backoff strategy. Must be one of: ${validBackoffTypes.join(', ')}`));
      return;
    }
    
    const retryAttempts = parseInt(options.retryAttempts);
    if (isNaN(retryAttempts) || retryAttempts < 1 || retryAttempts > 10) {
      console.error(chalk.red('Error: Retry attempts must be a number between 1 and 10'));
      return;
    }
    
    const timeout = parseInt(options.timeout);
    if (isNaN(timeout) || timeout < 1 || timeout > 3600) {
      console.error(chalk.red('Error: Timeout must be a number between 1 and 3600 seconds'));
      return;
    }
    
    let agentData = {
      name: options.name,
      description: options.description || '',
      retry_policy: {
        backoff: options.retryBackoff,
        max_attempts: retryAttempts
      },
      timeout_seconds: timeout,
      trigger_config: {
        type: options.triggerType,
        name: options.triggerName,
        path: "",
        address: "",
        schedule: ""
      },
      nodes: [],
      connections: []
    };
    
    if (options.project) {
      agentData.project_id = options.project;
    }
    
    if (options.file) {
      try {
        const fileData = JSON.parse(fs.readFileSync(options.file, 'utf8'));
        
        // Validate required fields
        if (!fileData.nodes || !Array.isArray(fileData.nodes) || fileData.nodes.length === 0) {
          console.error(chalk.red('Error: Agent must have at least one node defined in the configuration file'));
          return;
        }
        
        if (!fileData.connections || !Array.isArray(fileData.connections)) {
          console.error(chalk.red('Error: Agent must have connections array defined (can be empty)'));
          return;
        }
        
        // Merge file data, but CLI options take precedence over file defaults
        const fileRetryPolicy = fileData.retry_policy || {};
        const fileTriggerConfig = fileData.trigger_config || {};
        
        agentData = {
          ...agentData,
          ...fileData,
          // CLI options override file data
          name: options.name, // Always use CLI name
          description: options.description || fileData.description || '',
          retry_policy: {
            backoff: options.retryBackoff,
            max_attempts: retryAttempts
          },
          trigger_config: {
            type: options.triggerType,
            name: options.triggerName,
            path: fileTriggerConfig.path || "",
            address: fileTriggerConfig.address || "",
            schedule: fileTriggerConfig.schedule || ""
          },
          timeout_seconds: timeout
        };
      } catch (error) {
        console.error(chalk.red(`Error reading file: ${error.message}`));
        return;
      }
    } else {
      console.error(chalk.red('Error: Configuration file (-f) is required. Agent must have nodes and connections defined.'));
      console.log(chalk.yellow('Example minimal agent file:'));
      console.log(JSON.stringify({
        nodes: [{
          id: "node_0",
          type: "http",
          config: {
            url: "https://api.example.com/data",
            name: "Fetch Data",
            method: "GET"
          }
        }],
        connections: []
      }, null, 2));
      return;
    }
    
    const agent = await api.post('/v1/agents', agentData);
    console.log(chalk.green(`✓ Created agent: ${agent.agent_id}`));
    console.log(chalk.blue(`  Trigger: ${agentData.trigger_config.type} (${agentData.trigger_config.name})`));
    console.log(chalk.blue(`  Retry Policy: ${agentData.retry_policy.backoff}, max ${agentData.retry_policy.max_attempts} attempts`));
    console.log(chalk.blue(`  Timeout: ${agentData.timeout_seconds} seconds`));
  });

agentCommand
  .command('get <agentId>')
  .description('Get agent details')
  .action(async (agentId) => {
    const api = new SiloWorkerAPI(getApiKey());
    const agent = await api.get(`/v1/agents/${agentId}`);
    
    console.log(`Name: ${agent.name}`);
    console.log(`Description: ${agent.description || 'None'}`);
    console.log(`Nodes: ${agent.nodes?.length || 0}`);
    if (agent.nodes?.length > 0) {
      agent.nodes.forEach((node, i) => {
        console.log(`  ${i + 1}. ${node.type} - ${node.config?.name || 'Unnamed'}`);
      });
    }
    
    if (agent.trigger_config) {
      console.log(`Trigger: ${agent.trigger_config.type} (${agent.trigger_config.name || 'Unnamed'})`);
    }
    
    console.log(`Created: ${agent.created_at}`);
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
