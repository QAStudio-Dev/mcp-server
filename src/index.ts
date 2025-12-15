#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

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
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Optional search query to filter projects by name'
        }
      }
    } as any
  },
  async (args: any, _extra: any) => {
    try {
      const { search } = args as { search?: string };
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
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID to create the test run for'
        },
        name: {
          type: 'string',
          description: 'Name of the test run'
        },
        description: {
          type: 'string',
          description: 'Optional description of the test run'
        },
        environment: {
          type: 'string',
          description: 'Environment name (e.g., "production", "staging", "local")'
        },
        milestoneId: {
          type: 'string',
          description: 'Optional milestone ID to associate with the test run'
        }
      },
      required: ['projectId', 'name', 'environment']
    } as any
  },
  async (args: any, _extra: any) => {
    try {
      const { projectId, name, description, environment, milestoneId } = args as {
        projectId: string;
        name: string;
        description?: string;
        environment: string;
        milestoneId?: string;
      };

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
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID to list test runs for'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 50)'
        },
        offset: {
          type: 'number',
          description: 'Number of results to skip for pagination (default: 0)'
        }
      },
      required: ['projectId']
    } as any
  },
  async (args: any, _extra: any) => {
    try {
      const {
        projectId,
        limit = 50,
        offset = 0
      } = args as {
        projectId: string;
        limit?: number;
        offset?: number;
      };

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
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        testRunId: {
          type: 'string',
          description: 'The test run ID'
        }
      },
      required: ['projectId', 'testRunId']
    } as any
  },
  async (args: any, _extra: any) => {
    try {
      const { projectId, testRunId } = args as {
        projectId: string;
        testRunId: string;
      };

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
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        testRunId: {
          type: 'string',
          description: 'The test run ID'
        },
        status: {
          type: 'string',
          description: 'Optional filter by status (passed, failed, skipped, etc.)',
          enum: ['passed', 'failed', 'skipped', 'blocked', 'retest', 'untested']
        }
      },
      required: ['projectId', 'testRunId']
    } as any
  },
  async (args: any, _extra: any) => {
    try {
      const { projectId, testRunId, status } = args as {
        projectId: string;
        testRunId: string;
        status?: string;
      };

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
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        title: {
          type: 'string',
          description: 'Title of the test case'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the test case'
        },
        priority: {
          type: 'string',
          description: 'Priority level',
          enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        },
        type: {
          type: 'string',
          description: 'Test type',
          enum: [
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
          ]
        },
        automationStatus: {
          type: 'string',
          description: 'Automation status',
          enum: ['AUTOMATED', 'NOT_AUTOMATED', 'CANDIDATE']
        },
        steps: {
          type: 'array',
          description: 'Test steps',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number' },
              action: { type: 'string' },
              expectedResult: { type: 'string' }
            },
            required: ['order', 'action']
          }
        }
      },
      required: ['projectId', 'title']
    } as any
  },
  async (args: any, _extra: any) => {
    try {
      const { projectId, ...testCaseData } = args as {
        projectId: string;
        title: string;
        description?: string;
        priority?: string;
        type?: string;
        automationStatus?: string;
        steps?: Array<{ order: number; action: string; expectedResult?: string }>;
      };

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
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        testRunId: {
          type: 'string',
          description: 'The test run ID'
        },
        results: {
          type: 'array',
          description: 'Array of test results',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Test case title' },
              status: {
                type: 'string',
                enum: ['passed', 'failed', 'skipped', 'blocked'],
                description: 'Test result status'
              },
              duration: {
                type: 'number',
                description: 'Duration in milliseconds'
              },
              error: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  stack: { type: 'string' }
                }
              }
            },
            required: ['title', 'status']
          }
        }
      },
      required: ['projectId', 'testRunId', 'results']
    } as any
  },
  async (args: any, _extra: any) => {
    try {
      const { projectId, testRunId, results } = args as {
        projectId: string;
        testRunId: string;
        results: Array<{
          title: string;
          status: string;
          duration?: number;
          error?: { message: string; stack?: string };
        }>;
      };

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
