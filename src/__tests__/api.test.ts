import { describe, it, expect } from 'vitest';
import {
  compactTestResults,
  getTestResultsPath,
  listTestRunsPath,
  mapSubmitResults
} from '../reporting.js';

describe('API Request Formatting', () => {
  describe('Query parameter encoding', () => {
    it('should properly encode search query parameters', () => {
      const search = 'test project';
      const encoded = encodeURIComponent(search);
      expect(encoded).toBe('test%20project');
    });

    it('should handle special characters in search', () => {
      const search = 'test & project';
      const encoded = encodeURIComponent(search);
      expect(encoded).toBe('test%20%26%20project');
    });

    it('should handle unicode characters', () => {
      const search = 'тест проект';
      const encoded = encodeURIComponent(search);
      expect(encoded).toContain('%');
    });
  });

  describe('URL construction', () => {
    const API_URL = 'https://qastudio.dev/api';

    it('should construct correct URL for list projects without search', () => {
      const query = '';
      const url = `${API_URL}/projects${query}`;
      expect(url).toBe('https://qastudio.dev/api/projects');
    });

    it('should construct correct URL for list projects with search', () => {
      const search = 'test';
      const query = `?search=${encodeURIComponent(search)}`;
      const url = `${API_URL}/projects${query}`;
      expect(url).toBe('https://qastudio.dev/api/projects?search=test');
    });

    it('should construct correct URL for list test runs with pagination', () => {
      expect(listTestRunsPath('proj-123', 50, 0)).toBe('/runs?projectId=proj-123&limit=50&page=1');
      expect(listTestRunsPath('proj-123', 50, 50)).toBe('/runs?projectId=proj-123&limit=50&page=2');
    });

    it('should reject list-test-runs offsets that are not page-aligned', () => {
      expect(() => listTestRunsPath('proj-123', 50, 75)).toThrow(/not aligned to limit 50/);
    });

    it('should construct correct URL for get test run', () => {
      const projectId = 'proj-123';
      const testRunId = 'run-456';
      const url = `${API_URL}/projects/${projectId}/runs/${testRunId}`;
      expect(url).toBe('https://qastudio.dev/api/projects/proj-123/runs/run-456');
    });

    it('should construct correct URL for test results with status filter', () => {
      expect(getTestResultsPath('run-456', 'failed')).toBe(
        '/runs/run-456/results?status=FAILED&limit=50&page=1'
      );
      expect(getTestResultsPath('run-456', 'failed', 2)).toBe(
        '/runs/run-456/results?status=FAILED&limit=50&page=2'
      );
    });
  });

  describe('Request body formatting', () => {
    it('should format create test run request body correctly', () => {
      const input = {
        projectId: 'proj-123',
        name: 'Sprint 45 Regression',
        description: 'Test run for sprint 45',
        environment: 'staging',
        milestoneId: 'milestone-1'
      };

      const body = JSON.stringify(input);
      const parsed = JSON.parse(body);

      expect(parsed).toEqual(input);
      expect(parsed.projectId).toBe('proj-123');
      expect(parsed.name).toBe('Sprint 45 Regression');
    });

    it('should format create test case request body correctly', () => {
      const input = {
        title: 'Login Test',
        description: 'Test user login',
        priority: 'HIGH',
        type: 'FUNCTIONAL',
        steps: [
          { order: 1, action: 'Navigate to login', expectedResult: 'Page loads' },
          { order: 2, action: 'Enter credentials', expectedResult: 'User logged in' }
        ]
      };

      const body = JSON.stringify(input);
      const parsed = JSON.parse(body);

      expect(parsed).toEqual(input);
      expect(parsed.steps).toHaveLength(2);
      expect(parsed.steps[0].order).toBe(1);
    });

    it('should flatten nested error objects for submit results', () => {
      const mappedResults = mapSubmitResults([
        { title: 'Test 1', status: 'passed', duration: 100 },
        {
          title: 'Test 2',
          status: 'failed',
          duration: 200,
          error: { message: 'boom', stack: 'Error: boom' }
        }
      ]);

      expect(mappedResults[0]).not.toHaveProperty('projectName');
      expect(mappedResults[1].errorMessage).toBe('boom');
      expect(mappedResults[1].stackTrace).toBe('Error: boom');
    });
  });

  describe('Error handling', () => {
    it('should format error messages correctly', () => {
      const error = new Error('API Error (401): Unauthorized');
      const errorText = error instanceof Error ? error.message : String(error);
      expect(errorText).toBe('API Error (401): Unauthorized');
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const errorText = error instanceof Error ? error.message : String(error);
      expect(errorText).toBe('String error');
    });

    it('should construct error response correctly', () => {
      const error = new Error('Test error');
      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };

      expect(response.isError).toBe(true);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toBe('Error: Test error');
    });
  });

  describe('Response formatting', () => {
    it('should format success response correctly', () => {
      const data = { id: 'run-123', name: 'Test Run', environment: 'production' };
      const response = {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(data, null, 2)
          }
        ]
      };

      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toContain('"id": "run-123"');
      expect(response.content[0].text).toContain('"name": "Test Run"');
    });

    it('should format test run creation success message', () => {
      const data = {
        id: 'run-123',
        name: 'Sprint 45',
        environment: 'staging'
      };
      const projectId = 'proj-456';
      const API_URL = 'https://qastudio.dev/api';

      const message = `✅ Test run created successfully!\n\nID: ${data.id}\nName: ${data.name}\nEnvironment: ${data.environment}\n\nView: ${API_URL.replace('/api', '')}/projects/${projectId}/runs/${data.id}`;

      expect(message).toContain('✅ Test run created successfully!');
      expect(message).toContain('ID: run-123');
      expect(message).toContain('View: https://qastudio.dev/projects/proj-456/runs/run-123');
    });

    it('should format test results submission success message', () => {
      const resultsCount = 5;
      const data = {
        processedCount: 5,
        duplicatesSkipped: 0,
        errors: []
      };

      const message = `✅ Submitted ${resultsCount} test results!\n\nProcessed: ${data.processedCount}\nDuplicates: ${data.duplicatesSkipped}\nErrors: ${data.errors.length}`;

      expect(message).toContain('✅ Submitted 5 test results!');
      expect(message).toContain('Processed: 5');
      expect(message).toContain('Errors: 0');
    });
  });

  describe('compact payloads', () => {
    it('should keep only summary fields for test results', () => {
      const compact = compactTestResults({
        testResults: [
          {
            id: 'tr-1',
            title: 'Login',
            status: 'FAILED',
            duration: 12,
            stackTrace: 'huge',
            steps: [{ title: 'click' }]
          }
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
      });

      expect(compact.testResults[0]).toEqual({
        id: 'tr-1',
        title: 'Login',
        status: 'FAILED',
        duration: 12
      });
      expect(compact.testResults[0]).not.toHaveProperty('steps');
    });
  });
});
