# QA Studio MCP Server

## Project Overview

This is an MCP (Model Context Protocol) server that exposes the QA Studio API as tools for Claude and other MCP clients. It allows users to interact with their QA Studio test management platform directly from Claude conversations.

### Core Features

- **Project Management**: List and search projects
- **Test Run Management**: Create and list test runs
- **Test Results**: View and analyze test execution results
- **Test Case Management**: Create test cases with steps and metadata
- **Manual Testing**: Submit test results for manual test execution tracking

### Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Protocol**: MCP (Model Context Protocol) SDK v1.0.4
- **Transport**: stdio (standard input/output)
- **API Client**: Native fetch API

## Architecture

### MCP Server Pattern

The server follows the standard MCP server architecture:

1. **Server Initialization**: Creates MCP server with capabilities
2. **Tool Registration**: Defines available tools with schemas
3. **Request Handlers**: Implements `ListTools` and `CallTool` handlers
4. **Transport**: Uses stdio for communication with MCP clients
5. **API Client**: Makes HTTP requests to QA Studio API

### File Structure

```
qastudio-mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── README.md             # User-facing documentation
├── CLAUDE.md            # Developer documentation (this file)
└── LICENSE              # MIT License
```

## Available Tools

### 1. `list-projects`

List all projects with optional search filtering.

**Input Schema:**

```typescript
{
  search?: string  // Optional search query
}
```

**API Endpoint:** `GET /projects?search={query}`

### 2. `create-test-run`

Create a new test run for a project.

**Input Schema:**

```typescript
{
  projectId: string        // Required: Project ID
  name: string            // Required: Test run name
  environment: string     // Required: Environment (e.g., "production", "staging")
  description?: string    // Optional: Test run description
  milestoneId?: string    // Optional: Associated milestone ID
}
```

**API Endpoint:** `POST /runs`

### 3. `list-test-runs`

List test runs for a project with pagination.

**Input Schema:**

```typescript
{
  projectId: string   // Required: Project ID
  limit?: number      // Optional: Max results (default: 50)
  offset?: number     // Optional: Pagination offset (default: 0)
}
```

**API Endpoint:** `GET /runs?projectId={id}&limit={n}&offset={n}`

### 4. `get-test-run`

Get detailed information about a specific test run.

**Input Schema:**

```typescript
{
  projectId: string; // Required: Project ID
  testRunId: string; // Required: Test run ID
}
```

**API Endpoint:** `GET /projects/{projectId}/runs/{testRunId}`

### 5. `get-test-results`

Get test results for a specific test run with optional status filtering.

**Input Schema:**

```typescript
{
  projectId: string    // Required: Project ID
  testRunId: string    // Required: Test run ID
  status?: string      // Optional: Filter by status (passed, failed, skipped, etc.)
}
```

**API Endpoint:** `GET /projects/{projectId}/runs/{testRunId}/results?status={status}`

### 6. `create-test-case`

Create a new test case in a project.

**Input Schema:**

```typescript
{
  projectId: string                 // Required: Project ID
  title: string                     // Required: Test case title
  description?: string              // Optional: Detailed description
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  type?: 'FUNCTIONAL' | 'REGRESSION' | 'SMOKE' | 'INTEGRATION' | 'PERFORMANCE' | 'SECURITY' | 'UI' | 'API' | 'UNIT' | 'E2E'
  automationStatus?: 'AUTOMATED' | 'NOT_AUTOMATED' | 'CANDIDATE'
  steps?: Array<{
    order: number
    action: string
    expectedResult?: string
  }>
}
```

**API Endpoint:** `POST /projects/{projectId}/test-cases`

### 7. `submit-test-results`

Submit test results for a test run (useful for manual testing).

**Input Schema:**

```typescript
{
  projectId: string; // Required: Project ID
  testRunId: string; // Required: Test run ID
  results: Array<{
    title: string; // Required: Test case title
    status: 'passed' | 'failed' | 'skipped' | 'blocked'; // Required
    duration?: number; // Optional: Duration in milliseconds
    error?: {
      message: string;
      stack?: string;
    };
  }>;
}
```

**API Endpoint:** `POST /results`

## Environment Configuration

### Required Environment Variables

- `QA_STUDIO_API_KEY` - API key for authentication (required)

### Optional Environment Variables

- `QA_STUDIO_API_URL` - Base API URL (default: `http://localhost:3000/api`)

### Example Configuration

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "qastudio": {
      "command": "npx",
      "args": ["-y", "@qastudio-dev/mcp-server"],
      "env": {
        "QA_STUDIO_API_URL": "https://qastudio.dev/api",
        "QA_STUDIO_API_KEY": "qa_live_abc123..."
      }
    }
  }
}
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev
```

### Testing Locally

You can test the MCP server locally using the MCP Inspector or by running it directly:

```bash
# Set environment variables
export QA_STUDIO_API_URL="http://localhost:3000/api"
export QA_STUDIO_API_KEY="your-api-key"

# Run the server
node dist/index.js
```

The server will start and listen on stdio. You can then send MCP protocol messages via stdin.

### TypeScript Configuration

The project uses strict TypeScript settings:

- **Target**: ES2022
- **Module**: Node16 (native ESM)
- **Strict Mode**: Enabled
- **Source Maps**: Enabled for debugging

## API Client Implementation

The `apiRequest` helper function handles all API communication:

```typescript
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  return response.json();
}
```

**Features:**

- Automatic API key injection via `X-API-Key` header
- Error handling with status codes
- JSON content type by default
- Supports all HTTP methods (GET, POST, PUT, DELETE, etc.)

## Error Handling

All tools implement try-catch error handling:

```typescript
try {
  // Tool implementation
  const data = await apiRequest('/endpoint');
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
  };
} catch (error) {
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }
    ],
    isError: true
  };
}
```

**Error Types:**

- API authentication errors (401)
- API validation errors (400)
- Network errors
- Invalid tool arguments

## Publishing

### NPM Package

The package is configured for publishing to npm:

```bash
# Build and publish
npm publish --access public
```

**Package Configuration:**

- **Scope**: `@qastudio-dev`
- **Entry Point**: `dist/index.js` (executable)
- **Files**: Only `dist/` directory is published
- **License**: MIT

### Version Management

Follow semantic versioning:

- **Major**: Breaking changes to tool schemas or behavior
- **Minor**: New tools or features
- **Patch**: Bug fixes and improvements

## Security Considerations

1. **API Key Storage**: Never commit API keys to version control
2. **HTTPS**: Always use HTTPS for production QA Studio instances
3. **Key Rotation**: Rotate API keys regularly
4. **Minimal Permissions**: Use API keys with minimal required permissions
5. **Environment Isolation**: Use separate API keys for dev/staging/production

## Integration with QA Studio

This MCP server is designed to work with the QA Studio API v1. It requires:

1. **QA Studio Instance**: Running instance (self-hosted or cloud)
2. **API Key**: Generated from QA Studio Settings → API Keys
3. **Network Access**: MCP server must be able to reach the QA Studio API

### API Compatibility

The server is compatible with QA Studio API v1. Breaking changes in the QA Studio API may require updates to this MCP server.

## Troubleshooting

### Common Issues

**"QA_STUDIO_API_KEY environment variable is required"**

- Solution: Set the `QA_STUDIO_API_KEY` environment variable in your MCP client configuration

**"API Error (401): Unauthorized"**

- Solution: Verify your API key is valid and has not expired
- Solution: Check that the API key is correctly set in the environment

**"API Error (404): Not Found"**

- Solution: Verify the `QA_STUDIO_API_URL` is correct
- Solution: Check that the QA Studio instance is running and accessible

**TypeScript compilation errors**

- Solution: Ensure you're using Node.js 18+ and TypeScript 5.7+
- Solution: Run `npm install` to ensure all dependencies are installed

### Debug Mode

To see detailed logs, the server outputs diagnostic information to stderr:

```bash
node dist/index.js 2> debug.log
```

## Contributing

When adding new tools:

1. Add the tool definition to the `tools` array with proper schema
2. Implement the tool handler in the `CallToolRequestSchema` handler
3. Update the README.md with usage examples
4. Test the tool against a live QA Studio instance
5. Update this CLAUDE.md file with implementation details

## Related Repositories

- **QA Studio**: [github.com/QAStudio-Dev/qa-studio](https://github.com/QAStudio-Dev/qa-studio)
- **Playwright Reporter**: [github.com/QAStudio-Dev/playwright](https://github.com/QAStudio-Dev/playwright)

## Future Enhancements

Potential improvements:

- **Resources**: Expose test cases and test runs as MCP resources (not just tools)
- **Streaming**: Support streaming test results for long-running operations
- **Webhooks**: Listen for QA Studio events and notify MCP clients
- **Batch Operations**: Tools for bulk test case creation or result submission
- **Analytics**: Tools for generating reports and analytics
- **Attachments**: Support for uploading screenshots and logs with test results
