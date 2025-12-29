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
- `siloworker run list` - List recent runs
- `siloworker run resume-all-failed` - Resume all failed runs
- `siloworker run cancel-all-running` - Cancel all running runs
- `siloworker run cleanup --days <n>` - Clean up old completed runs

### Workspaces
- `siloworker workspace list` - List workspaces
- `siloworker workspace create -n <name>` - Create workspace
- `siloworker workspace delete <id>` - Delete workspace

## Configuration

The CLI stores configuration in `~/.siloworker/config.json`. You can manually edit this file or use the auth commands.

## Development

```bash
# Install dependencies
npm install

# Run locally
node bin/cli.js --help

# Install globally for testing
npm run install-global
```
