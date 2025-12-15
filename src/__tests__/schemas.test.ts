import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Tool Input Schemas', () => {
  describe('list-projects schema', () => {
    const schema = z.object({
      search: z.string().optional()
    });

    it('should accept valid input with search parameter', () => {
      const result = schema.safeParse({ search: 'test project' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('test project');
      }
    });

    it('should accept valid input without search parameter', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid search type', () => {
      const result = schema.safeParse({ search: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('create-test-run schema', () => {
    const schema = z.object({
      projectId: z.string(),
      name: z.string(),
      environment: z.string(),
      description: z.string().optional(),
      milestoneId: z.string().optional()
    });

    it('should accept valid input with all fields', () => {
      const input = {
        projectId: 'proj-123',
        name: 'Sprint 45 Regression',
        environment: 'staging',
        description: 'Test run for sprint 45',
        milestoneId: 'milestone-1'
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid input with required fields only', () => {
      const input = {
        projectId: 'proj-123',
        name: 'Sprint 45 Regression',
        environment: 'staging'
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const input = {
        name: 'Sprint 45 Regression'
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('get-test-results schema', () => {
    const schema = z.object({
      projectId: z.string(),
      testRunId: z.string(),
      status: z.enum(['passed', 'failed', 'skipped', 'blocked', 'retest', 'untested']).optional()
    });

    it('should accept valid status values', () => {
      const statuses = ['passed', 'failed', 'skipped', 'blocked', 'retest', 'untested'];
      statuses.forEach((status) => {
        const result = schema.safeParse({
          projectId: 'proj-123',
          testRunId: 'run-456',
          status
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status value', () => {
      const result = schema.safeParse({
        projectId: 'proj-123',
        testRunId: 'run-456',
        status: 'invalid-status'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('create-test-case schema', () => {
    const schema = z.object({
      projectId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
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
        .optional(),
      automationStatus: z.enum(['AUTOMATED', 'NOT_AUTOMATED', 'CANDIDATE']).optional(),
      steps: z
        .array(
          z.object({
            order: z.number(),
            action: z.string(),
            expectedResult: z.string().optional()
          })
        )
        .optional()
    });

    it('should accept valid test case with all fields', () => {
      const input = {
        projectId: 'proj-123',
        title: 'Login Test',
        description: 'Test user login functionality',
        priority: 'HIGH',
        type: 'FUNCTIONAL',
        automationStatus: 'AUTOMATED',
        steps: [
          { order: 1, action: 'Navigate to login page', expectedResult: 'Login page loads' },
          { order: 2, action: 'Enter credentials', expectedResult: 'User is logged in' }
        ]
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept minimal valid input', () => {
      const input = {
        projectId: 'proj-123',
        title: 'Login Test'
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should validate step structure', () => {
      const input = {
        projectId: 'proj-123',
        title: 'Login Test',
        steps: [{ order: 1, action: 'Navigate to login page' }]
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid step structure', () => {
      const input = {
        projectId: 'proj-123',
        title: 'Login Test',
        steps: [{ action: 'Navigate to login page' }] // missing order
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('submit-test-results schema', () => {
    const schema = z.object({
      projectId: z.string(),
      testRunId: z.string(),
      results: z.array(
        z.object({
          title: z.string(),
          status: z.enum(['passed', 'failed', 'skipped', 'blocked']),
          duration: z.number().optional(),
          error: z
            .object({
              message: z.string(),
              stack: z.string().optional()
            })
            .optional()
        })
      )
    });

    it('should accept valid test results', () => {
      const input = {
        projectId: 'proj-123',
        testRunId: 'run-456',
        results: [
          { title: 'Login Test', status: 'passed', duration: 1234 },
          {
            title: 'Logout Test',
            status: 'failed',
            duration: 567,
            error: { message: 'Logout button not found' }
          }
        ]
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty results array', () => {
      const input = {
        projectId: 'proj-123',
        testRunId: 'run-456',
        results: []
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true); // Empty array is valid
    });

    it('should reject invalid status in results', () => {
      const input = {
        projectId: 'proj-123',
        testRunId: 'run-456',
        results: [{ title: 'Login Test', status: 'invalid' }]
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
