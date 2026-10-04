export type SubmitResultInput = {
  title: string;
  status: string;
  duration?: number;
  error?: { message: string; stack?: string };
};

const STATUS_MAP: Record<string, string> = {
  passed: 'PASSED',
  failed: 'FAILED',
  skipped: 'SKIPPED',
  blocked: 'BLOCKED',
  retest: 'RETEST',
  untested: 'UNTESTED'
};

export function listTestRunsPath(projectId: string, limit = 50, offset = 0): string {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('limit must be a positive integer');
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error('offset must be a non-negative integer');
  }
  if (offset % limit !== 0) {
    throw new Error(
      `offset ${offset} is not aligned to limit ${limit}. Use a multiple of limit (0, ${limit}, ${limit * 2}, ...).`
    );
  }
  const page = offset / limit + 1;
  return `/runs?projectId=${encodeURIComponent(projectId)}&limit=${limit}&page=${page}`;
}

export function getTestResultsPath(testRunId: string, status?: string, page = 1): string {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('page must be a positive integer');
  }
  const params = new URLSearchParams();
  if (status) {
    params.set('status', STATUS_MAP[status] ?? status.toUpperCase());
  }
  params.set('limit', '50');
  params.set('page', String(page));
  return `/runs/${encodeURIComponent(testRunId)}/results?${params.toString()}`;
}

export function mapSubmitResults(results: SubmitResultInput[]) {
  return results.map((result) => {
    const mapped: Record<string, unknown> = {
      title: result.title,
      status: result.status,
      duration: result.duration
    };
    if (result.error) {
      mapped.errorMessage = result.error.message;
      if (result.error.stack) {
        mapped.stackTrace = result.error.stack;
      }
    }
    return mapped;
  });
}

export function compactTestRuns(data: any) {
  const runs = data?.testRuns ?? data?.runs ?? (Array.isArray(data) ? data : []);
  return {
    testRuns: (Array.isArray(runs) ? runs : []).map((run: any) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      projectId: run.projectId,
      startedAt: run.startedAt,
      completedAt: run.completedAt
    })),
    pagination: data?.pagination
  };
}

export function compactTestResults(data: any) {
  const results = data?.testResults ?? data?.results ?? (Array.isArray(data) ? data : []);
  return {
    testResults: (Array.isArray(results) ? results : []).map((result: any) => ({
      id: result.id,
      title: result.title ?? result.testCase?.title,
      status: result.status,
      duration: result.duration
    })),
    pagination: data?.pagination
  };
}

export function compactTestRun(data: any) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  const { results, testResults, steps, ...rest } = data;
  return {
    id: rest.id,
    name: rest.name,
    status: rest.status,
    projectId: rest.projectId,
    startedAt: rest.startedAt,
    completedAt: rest.completedAt,
    resultCount: Array.isArray(results)
      ? results.length
      : Array.isArray(testResults)
        ? testResults.length
        : rest._count?.results
  };
}
