# SiloWorker CLI

Command-line interface for the SiloWorker workflow automation platform.

## Installation

### From Source
```bash
git clone <repository-url>
cd siloworker-cli
npm install
npm run install-global
```

### From NPM (when published)
```bash
npm install -g siloworker-cli
```

## Quick Start

1. **Authenticate**:
   ```bash
   siloworker auth login
   ```

2. **Create a project**:
   ```bash
   siloworker project create -n "My Project" -d "Project description"
   ```

3. **Create an agent**:
   ```bash
   siloworker agent create -n "My Agent" -p <project-id>
   ```

4. **Add tools to agent**:
   ```bash
   siloworker agent add-tool <agent-id> -t web_search -n "Web Search"
   ```

5. **Run a workflow**:
   ```bash
   siloworker run start <agent-id> -d '{"input": "data"}'
   ```

## Commands

### Authentication
- `siloworker auth login` - Login and save API key
- `siloworker auth logout` - Remove saved API key
- `siloworker auth status` - Check authentication status

### Projects
- `siloworker project list` - List all projects
- `siloworker project create -n <name>` - Create new project
- `siloworker project delete <id>` - Delete project

### Agents
- `siloworker agent list` - List all agents
- `siloworker agent create -n <name>` - Create new agent
- `siloworker agent get <id>` - Get agent details
- `siloworker agent update <id>` - Update agent
- `siloworker agent delete <id>` - Delete agent
- `siloworker agent add-tool <id> -t <type>` - Add tool to agent
- `siloworker agent remove-tool <id> <tool-id>` - Remove tool from agent
- `siloworker agent list-tools <id>` - List agent tools

### Schedules
- `siloworker schedule list` - List all schedules
- `siloworker schedule create -n <name> -a <agent-id> -c <cron>` - Create schedule
- `siloworker schedule enable <id>` - Enable schedule
- `siloworker schedule disable <id>` - Disable schedule
- `siloworker schedule delete <id>` - Delete schedule

### Runs
- `siloworker run start <agent-id>` - Start workflow run
- `siloworker run status <id>` - Get run status
- `siloworker run resume <id>` - Resume failed run
- `siloworker run resume <id> --from-step <step-id>` - Resume from specific step
- `siloworker run list` - List recent runs
- `siloworker run resume-all-failed` - Resume all failed runs
- `siloworker run cancel-all-running` - Cancel all running runs
- `siloworker run cleanup --days <n>` - Clean up old completed runs

### Configuration
- `siloworker config get [key]` - Get configuration value(s)
- `siloworker config set <key> <value>` - Set configuration value
- `siloworker config unset <key>` - Remove configuration value
- `siloworker config reset --force` - Reset all configuration
- `siloworker config regenerate-key` - Regenerate API key

### Workspaces
- `siloworker workspace info` - Show workspace information
- `siloworker workspace usage` - Show usage statistics
- `siloworker workspace set-api-key <service> <key>` - Set API key for service
- `siloworker workspace set-twilio <accountSid> <authToken>` - Set Twilio credentials

### Templates
- `siloworker template list` - List available workflow templates
- `siloworker template get <id>` - Get template details

### Tools & Triggers
- `siloworker tools list` - List available tool types
- `siloworker tools triggers` - List available trigger types

## Configuration

The CLI stores configuration in `~/.siloworker/config.json`. You can manually edit this file or use the auth commands.

## Advanced Features

### Step-Level Resume

When a workflow run fails, you can resume it from any specific step instead of restarting the entire workflow:

1. **Check failed run status** to see completed steps:
   ```bash
   siloworker run status run_12345
   ```
   
   Output shows step IDs:
   ```
   Steps completed: 3
     ✓ node_0: Fetch User Data (320ms)
     ✓ node_1: Process Data (150ms)
     ✗ node_2: Send Email (failed)
   ```

2. **Resume from specific step**:
   ```bash
   # Resume from the failed step (re-executes node_2 and all following steps)
   siloworker run resume run_12345 --from-step node_2
   
   # Resume from an earlier step (re-executes node_1 and all following steps)
   siloworker run resume run_12345 --from-step node_1
   ```

3. **Resume entire workflow** (default behavior):
   ```bash
   siloworker run resume run_12345
   ```

This feature is useful for:
- Fixing configuration issues in specific steps
- Retrying failed external API calls
- Debugging workflow logic without re-running expensive operations
- Recovering from transient failures

### Workspace Configuration

Configure API keys for external services directly from the CLI:

```bash
# Set individual service API keys
siloworker workspace set-api-key sendgrid your_sendgrid_key
siloworker workspace set-api-key llm your_openai_key

# Set Twilio credentials (requires both account SID and auth token)
siloworker workspace set-twilio your_account_sid your_auth_token
```

### Template Discovery

Explore pre-built workflow templates:

```bash
# List all available templates
siloworker template list

# Get details about a specific template
siloworker template get lead-notification
```

### Tool & Trigger Reference

Discover available tools and triggers for building workflows:

```bash
# List all available tool types
siloworker tools list

# List all available trigger types  
siloworker tools triggers
```

### Security Management

Regenerate your API key for enhanced security:

```bash
# Generate a new API key (invalidates the old one)
siloworker config regenerate-key
```

## Development

```bash
# Install dependencies
npm install

# Run locally
node bin/cli.js --help

# Install globally for testing
npm run install-global
```
