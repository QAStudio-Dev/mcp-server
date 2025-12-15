# QA Studio MCP Server

MCP (Model Context Protocol) server for QA Studio - interact with your test management platform directly from Claude.

## Features

This MCP server exposes QA Studio's API as MCP tools, allowing you to:

- 📋 List and search projects
- 🚀 Create and manage test runs
- ✅ View test results and execution history
- 📝 Create test cases
- 📊 Submit test results (manual testing)

## Installation

### Option 1: NPM Package (Recommended)

```bash
npx @qastudio-dev/mcp-server
```

Or install globally:

```bash
npm install -g @qastudio-dev/mcp-server
```

### Option 2: Local Development

For local development or if the package isn't published yet:

```bash
git clone https://github.com/QAStudio-Dev/mcp-server.git
cd mcp-server
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**For published package (after publishing to npm):**

```json
{
  "mcpServers": {
    "qastudio": {
      "command": "npx",
      "args": ["-y", "@qastudio-dev/mcp-server"],
      "env": {
        "QA_STUDIO_API_URL": "https://qastudio.dev/api",
        "QA_STUDIO_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**For local development (before publishing):**

```json
{
  "mcpServers": {
    "qastudio": {
      "command": "node",
      "args": ["/absolute/path/to/qastudio-mcp/dist/index.js"],
      "env": {
        "QA_STUDIO_API_URL": "https://qastudio.dev/api",
        "QA_STUDIO_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

> **Note:** Replace `/absolute/path/to/qastudio-mcp` with the actual path to your local repository.

### Environment Variables

- `QA_STUDIO_API_URL` - Base URL for your QA Studio API (default: `http://localhost:3000/api`)
- `QA_STUDIO_API_KEY` - Your QA Studio API key (required)

## Usage

Once configured, you can interact with QA Studio directly from Claude:

### Examples

**List projects:**

```
Show me all projects in QA Studio
```

**Create a test run:**

```
Create a new test run for project ABC123 called "Sprint 45 Regression" in the staging environment
```

**View test results:**

```
Show me the test results for project ABC123, test run XYZ789
```

**Create a test case:**

```
Create a high priority functional test case for project ABC123:
Title: "Verify user login with valid credentials"
Steps:
1. Navigate to login page
2. Enter valid username and password
3. Click login button
Expected: User is redirected to dashboard
```

**Submit test results:**

```
Submit these manual test results for project ABC123, run XYZ789:
- "Login test" - passed
- "Registration test" - failed (Error: Email validation not working)
- "Logout test" - passed
```

## Available Tools

### `list-projects`

List all projects with optional search filtering.

**Parameters:**

- `search` (optional): Search query to filter projects by name

### `create-test-run`

Create a new test run for a project.

**Parameters:**

- `projectId` (required): Project ID
- `name` (required): Test run name
- `environment` (required): Environment (e.g., "production", "staging")
- `description` (optional): Test run description
- `milestoneId` (optional): Associated milestone ID

### `list-test-runs`

List test runs for a project.

**Parameters:**

- `projectId` (required): Project ID
- `limit` (optional): Maximum results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

### `get-test-run`

Get detailed information about a specific test run.

**Parameters:**

- `projectId` (required): Project ID
- `testRunId` (required): Test run ID

### `get-test-results`

Get test results for a specific test run.

**Parameters:**

- `projectId` (required): Project ID
- `testRunId` (required): Test run ID
- `status` (optional): Filter by status (passed, failed, skipped, blocked, retest, untested)

### `create-test-case`

Create a new test case in a project.

**Parameters:**

- `projectId` (required): Project ID
- `title` (required): Test case title
- `description` (optional): Detailed description
- `priority` (optional): CRITICAL, HIGH, MEDIUM, LOW
- `type` (optional): FUNCTIONAL, REGRESSION, SMOKE, INTEGRATION, PERFORMANCE, SECURITY, UI, API, UNIT, E2E
- `automationStatus` (optional): AUTOMATED, NOT_AUTOMATED, CANDIDATE
- `steps` (optional): Array of test steps with action and expectedResult

### `submit-test-results`

Submit test results for a test run (useful for manual testing).

**Parameters:**

- `projectId` (required): Project ID
- `testRunId` (required): Test run ID
- `results` (required): Array of test results with title, status, duration, and optional error

## Development

### Local Development Setup

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/QAStudio-Dev/mcp-server.git
   cd mcp-server
   npm install
   ```

2. **Build the project:**

   ```bash
   npm run build
   ```

3. **Configure Claude Desktop for local development:**

   Edit your Claude Desktop config file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

   Add this configuration (replace the path with your actual project path):

   ```json
   {
     "mcpServers": {
       "qastudio": {
         "command": "node",
         "args": ["/Users/yourusername/path/to/qastudio-mcp/dist/index.js"],
         "env": {
           "QA_STUDIO_API_URL": "https://qastudio.dev/api",
           "QA_STUDIO_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop** to load the MCP server

5. **Run tests:**

   ```bash
   # Run all tests
   npm test

   # Run tests in watch mode
   npm run test:watch

   # Run tests with UI
   npm run test:ui
   ```

6. **Watch mode for development:**

   ```bash
   # Automatically rebuild on file changes
   npm run dev
   ```

   After making changes, restart Claude Desktop to reload the server.

### Testing the Server Directly

You can test the MCP server independently (without Claude):

```bash
# Set environment variables
export QA_STUDIO_API_URL="https://qastudio.dev/api"
export QA_STUDIO_API_KEY="your-api-key"

# Run the server (it will listen on stdio)
node dist/index.js
```

## API Key Setup

To create an API key in QA Studio:

1. Log in to your QA Studio instance
2. Navigate to Settings → API Keys
3. Click "Create API Key"
4. Give it a name (e.g., "Claude MCP Server")
5. Copy the generated key and add it to your MCP configuration

## Security

- Never commit your API key to version control
- Store API keys securely in environment variables or configuration files
- Use HTTPS for production QA Studio instances
- Rotate API keys regularly

## License

MIT

## Links

- [QA Studio](https://github.com/QAStudio-Dev/qa-studio)
- [Playwright Reporter](https://github.com/QAStudio-Dev/playwright)
- [Model Context Protocol](https://modelcontextprotocol.io)
