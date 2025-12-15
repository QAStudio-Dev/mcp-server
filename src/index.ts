#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// API Configuration from environment
const API_URL = process.env.QA_STUDIO_API_URL || 'http://localhost:3000/api';
const API_KEY = process.env.QA_STUDIO_API_KEY || '';

if (!API_KEY) {
  console.error('Error: QA_STUDIO_API_KEY environment variable is required');
  process.exit(1);
}

// Helper function to make API requests
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

// Create MCP Server
const server = new McpServer(
  {
    name: 'qastudio-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Register tool: list-projects
server.registerTool(
  'list-projects',
  {
    description: 'List all projects in QA Studio',
    inputSchema: {
      search: z.string().optional().describe('Optional search query to filter projects by name')
    }
  },
  async (args) => {
    try {
      const { search } = args;
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await apiRequest(`/projects${query}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register tool: create-test-run
server.registerTool(
  'create-test-run',
  {
    description: 'Create a new test run for a project',
    inputSchema: {
      projectId: z.string().describe('The project ID to create the test run for'),
      name: z.string().describe('Name of the test run'),
      environment: z.string().describe('Environment name (e.g., "production", "staging", "local")'),
      description: z.string().optional().describe('Optional description of the test run'),
      milestoneId: z
        .string()
        .optional()
        .describe('Optional milestone ID to associate with the test run')
    }
  },
  async (args) => {
    try {
      const { projectId, name, description, environment, milestoneId } = args;

      const data = await apiRequest(`/runs`, {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          name,
          description,
          environment,
          milestoneId
        })
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Test run created successfully!\n\nID: ${data.id}\nName: ${data.name}\nEnvironment: ${data.environment}\n\nView: ${API_URL.replace('/api', '')}/projects/${projectId}/runs/${data.id}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register tool: list-test-runs
server.registerTool(
  'list-test-runs',
  {
    description: 'List test runs for a project',
    inputSchema: {
      projectId: z.string().describe('The project ID to list test runs for'),
      limit: z.number().optional().describe('Maximum number of results to return (default: 50)'),
      offset: z
        .number()
        .optional()
        .describe('Number of results to skip for pagination (default: 0)')
    }
  },
  async (args) => {
    try {
      const { projectId, limit = 50, offset = 0 } = args;

      const data = await apiRequest(`/runs?projectId=${projectId}&limit=${limit}&offset=${offset}`);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register tool: get-test-run
server.registerTool(
  'get-test-run',
  {
    description: 'Get detailed information about a specific test run',
    inputSchema: {
      projectId: z.string().describe('The project ID'),
      testRunId: z.string().describe('The test run ID')
    }
  },
  async (args) => {
    try {
      const { projectId, testRunId } = args;

      const data = await apiRequest(`/projects/${projectId}/runs/${testRunId}`);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register tool: get-test-results
server.registerTool(
  'get-test-results',
  {
    description: 'Get test results for a specific test run',
    inputSchema: {
      projectId: z.string().describe('The project ID'),
      testRunId: z.string().describe('The test run ID'),
      status: z
        .enum(['passed', 'failed', 'skipped', 'blocked', 'retest', 'untested'])
        .optional()
        .describe('Optional filter by status')
    }
  },
  async (args) => {
    try {
      const { projectId, testRunId, status } = args;

      const query = status ? `?status=${status}` : '';
      const data = await apiRequest(`/projects/${projectId}/runs/${testRunId}/results${query}`);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register tool: create-test-case
server.registerTool(
  'create-test-case',
  {
    description: 'Create a new test case in a project',
    inputSchema: {
      projectId: z.string().describe('The project ID'),
      title: z.string().describe('Title of the test case'),
      description: z.string().optional().describe('Detailed description of the test case'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Priority level'),
      type: z
        .enum([
          'FUNCTIONAL',
          'REGRESSION',
          'SMOKE',
          'INTEGRATION',
          'PERFORMANCE',
          'SECURITY',
          'UI',
          'API',
          'UNIT',
          'E2E'
        ])
        .optional()
        .describe('Test type'),
      automationStatus: z
        .enum(['AUTOMATED', 'NOT_AUTOMATED', 'CANDIDATE'])
        .optional()
        .describe('Automation status'),
      steps: z
        .array(
          z.object({
            order: z.number(),
            action: z.string(),
            expectedResult: z.string().optional()
          })
        )
        .optional()
        .describe('Test steps')
    }
  },
  async (args) => {
    try {
      const { projectId, ...testCaseData } = args;

      const data = await apiRequest(`/projects/${projectId}/test-cases`, {
        method: 'POST',
        body: JSON.stringify(testCaseData)
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Test case created successfully!\n\nID: ${data.id}\nTitle: ${data.title}\nPriority: ${data.priority}\nType: ${data.type}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register tool: submit-test-results
server.registerTool(
  'submit-test-results',
  {
    description: 'Submit test results for a test run (useful for manual test execution tracking)',
    inputSchema: {
      projectId: z.string().describe('The project ID'),
      testRunId: z.string().describe('The test run ID'),
      results: z
        .array(
          z.object({
            title: z.string().describe('Test case title'),
            status: z
              .enum(['passed', 'failed', 'skipped', 'blocked'])
              .describe('Test result status'),
            duration: z.number().optional().describe('Duration in milliseconds'),
            error: z
              .object({
                message: z.string(),
                stack: z.string().optional()
              })
              .optional()
          })
        )
        .describe('Array of test results')
    }
  },
  async (args) => {
    try {
      const { projectId, testRunId, results } = args;

      const data = await apiRequest(`/results`, {
        method: 'POST',
        body: JSON.stringify({
          testRunId,
          results: results.map((r) => ({
            ...r,
            projectName: projectId // Map to expected field
          }))
        })
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ Submitted ${results.length} test results!\n\nProcessed: ${data.processedCount}\nDuplicates: ${data.duplicatesSkipped}\nErrors: ${data.errors.length}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('QA Studio MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
