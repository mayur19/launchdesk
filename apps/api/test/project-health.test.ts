import { describe, expect, it } from 'vitest';
import {
  evaluateProjectHealth,
  type HealthInput,
  type HealthMilestone,
  type HealthRisk,
  type HealthTask,
} from '../src/modules/projects/domain/project-health.js';

/** 2026-11-20 10:00 in Europe/Berlin (UTC+1). */
const NOW = new Date('2026-11-20T09:00:00Z');
const TZ = 'Europe/Berlin';
const at = { now: NOW, timezone: TZ };

function task(id: string, overrides: Partial<HealthTask> = {}): HealthTask {
  return {
    id,
    title: `Task ${id}`,
    required: true,
    status: 'IN_PROGRESS',
    dueOn: '2026-12-31',
    ...overrides,
  };
}

function tasks(count: number, overdue: number): HealthTask[] {
  return Array.from({ length: count }, (_, i) =>
    task(`t${i}`, i < overdue ? { dueOn: '2026-11-01' } : {}),
  );
}

function input(overrides: Partial<HealthInput> = {}): HealthInput {
  return {
    projectStatus: 'ACTIVE',
    targetGoLiveOn: '2027-02-01',
    tasks: [task('t1')],
    milestones: [],
    risks: [],
    ...overrides,
  };
}

const blockingRisk: HealthRisk = {
  id: 'r1',
  title: 'Customer sign-off missing',
  launchBlocking: true,
  status: 'OPEN',
};

const overdueMilestone: HealthMilestone = {
  id: 'm1',
  title: 'Data Validation',
  required: true,
  status: 'READY_FOR_REVIEW',
  targetOn: '2026-11-19',
};

describe('evaluateProjectHealth: base cases', () => {
  it('is ON_TRACK with no reasons when no rule triggers', () => {
    const result = evaluateProjectHealth(input(), at);
    expect(result.status).toBe('ON_TRACK');
    expect(result.reasons).toEqual([]);
    expect(result.evaluatedOn).toBe('2026-11-20');
    expect(result.metrics).toEqual({
      requiredTasks: 1,
      overdueRequiredTasks: 0,
      overdueBasisPoints: 0,
    });
  });

  it('is COMPLETED for completed projects regardless of other signals', () => {
    const result = evaluateProjectHealth(
      input({ projectStatus: 'COMPLETED', risks: [blockingRisk], tasks: tasks(2, 2) }),
      at,
    );
    expect(result.status).toBe('COMPLETED');
    expect(result.reasons).toEqual([
      { code: 'PROJECT_COMPLETED', severity: 'COMPLETED', message: 'Project is completed.' },
    ]);
  });

  it('handles projects with zero required tasks (documented zero rule)', () => {
    const result = evaluateProjectHealth(
      input({ tasks: [task('opt', { required: false, dueOn: '2026-01-01' })] }),
      at,
    );
    expect(result.status).toBe('ON_TRACK');
    expect(result.metrics).toEqual({
      requiredTasks: 0,
      overdueRequiredTasks: 0,
      overdueBasisPoints: 0,
    });
  });
});

describe('AT_RISK rules', () => {
  it('flags an open launch-blocking risk with a visible reason', () => {
    const result = evaluateProjectHealth(input({ risks: [blockingRisk] }), at);
    expect(result.status).toBe('AT_RISK');
    expect(result.reasons).toEqual([
      {
        code: 'LAUNCH_BLOCKING_ISSUE_OPEN',
        severity: 'AT_RISK',
        message: 'Launch-blocking item open: Customer sign-off missing',
        refs: ['r1'],
      },
    ]);
  });

  it('treats IN_PROGRESS blocking risks as open', () => {
    const risk = { ...blockingRisk, status: 'IN_PROGRESS' as const };
    expect(evaluateProjectHealth(input({ risks: [risk] }), at).status).toBe('AT_RISK');
  });

  it('ignores resolved, closed and non-blocking risks', () => {
    const risks: HealthRisk[] = [
      { ...blockingRisk, id: 'r2', status: 'RESOLVED' },
      { ...blockingRisk, id: 'r3', status: 'CLOSED' },
      { ...blockingRisk, id: 'r4', launchBlocking: false },
    ];
    expect(evaluateProjectHealth(input({ risks }), at).status).toBe('ON_TRACK');
  });

  it('flags an overdue required milestone', () => {
    const result = evaluateProjectHealth(input({ milestones: [overdueMilestone] }), at);
    expect(result.status).toBe('AT_RISK');
    expect(result.reasons[0]).toEqual({
      code: 'REQUIRED_MILESTONE_OVERDUE',
      severity: 'AT_RISK',
      message: 'Required milestone overdue: Data Validation (target 2026-11-19)',
      refs: ['m1'],
    });
  });

  it('ignores accepted, optional, undated and future milestones', () => {
    const milestones: HealthMilestone[] = [
      { ...overdueMilestone, id: 'm2', status: 'ACCEPTED' },
      { ...overdueMilestone, id: 'm3', required: false },
      { ...overdueMilestone, id: 'm4', targetOn: null },
      { ...overdueMilestone, id: 'm5', targetOn: '2026-11-20' },
    ];
    expect(evaluateProjectHealth(input({ milestones }), at).status).toBe('ON_TRACK');
  });

  it('flags more than 20% overdue required tasks', () => {
    const result = evaluateProjectHealth(input({ tasks: tasks(9, 2) }), at);
    expect(result.status).toBe('AT_RISK');
    expect(result.metrics).toEqual({
      requiredTasks: 9,
      overdueRequiredTasks: 2,
      overdueBasisPoints: 2222,
    });
    expect(result.reasons[0]).toMatchObject({
      code: 'OVERDUE_TASKS_ABOVE_THRESHOLD',
      severity: 'AT_RISK',
      message: '2 of 9 required tasks overdue (22.22%, threshold 20%)',
    });
  });

  it('lists every triggered reason, AT_RISK before WATCH', () => {
    const result = evaluateProjectHealth(
      input({
        risks: [blockingRisk],
        milestones: [overdueMilestone],
        targetGoLiveOn: '2026-11-25',
      }),
      at,
    );
    expect(result.reasons.map((r) => r.code)).toEqual([
      'LAUNCH_BLOCKING_ISSUE_OPEN',
      'REQUIRED_MILESTONE_OVERDUE',
      'GO_LIVE_WITHIN_7_DAYS',
    ]);
    expect(result.status).toBe('AT_RISK');
  });
});

describe('WATCH rules', () => {
  it('flags exactly 20% overdue as WATCH, not AT_RISK (boundary)', () => {
    const result = evaluateProjectHealth(input({ tasks: tasks(10, 2) }), at);
    expect(result.status).toBe('WATCH');
    expect(result.reasons).toEqual([
      {
        code: 'OVERDUE_TASKS_PRESENT',
        severity: 'WATCH',
        message: '2 of 10 required tasks overdue (20.00%)',
        refs: ['t0', 't1'],
      },
    ]);
  });

  it('flags a single overdue task among many as WATCH', () => {
    expect(evaluateProjectHealth(input({ tasks: tasks(100, 1) }), at).status).toBe('WATCH');
  });

  it('does not count done, optional or undated tasks as overdue', () => {
    const list = [
      task('a', { status: 'DONE', dueOn: '2026-01-01' }),
      task('b', { required: false, dueOn: '2026-01-01' }),
      task('c', { dueOn: null }),
      task('d', { dueOn: '2026-11-20' }),
    ];
    const result = evaluateProjectHealth(input({ tasks: list }), at);
    expect(result.status).toBe('ON_TRACK');
    expect(result.metrics.requiredTasks).toBe(3);
  });

  it('flags go-live within 7 days while mandatory tasks are outstanding', () => {
    const result = evaluateProjectHealth(input({ targetGoLiveOn: '2026-11-27' }), at);
    expect(result.status).toBe('WATCH');
    expect(result.reasons).toEqual([
      {
        code: 'GO_LIVE_WITHIN_7_DAYS',
        severity: 'WATCH',
        message: 'Go-live in 7 day(s) with 1 required task(s) outstanding',
        refs: ['t1'],
      },
    ]);
  });

  it('does not flag go-live 8 days away', () => {
    expect(evaluateProjectHealth(input({ targetGoLiveOn: '2026-11-28' }), at).status).toBe(
      'ON_TRACK',
    );
  });

  it('flags a passed go-live date with outstanding mandatory tasks', () => {
    const result = evaluateProjectHealth(input({ targetGoLiveOn: '2026-11-18' }), at);
    expect(result.status).toBe('WATCH');
    expect(result.reasons[0]).toMatchObject({
      code: 'GO_LIVE_DATE_PASSED',
      message: 'Go-live date 2026-11-18 passed with 1 required task(s) outstanding',
    });
  });

  it('does not flag an imminent go-live when every required task is done', () => {
    const result = evaluateProjectHealth(
      input({ targetGoLiveOn: '2026-11-21', tasks: [task('t1', { status: 'DONE' })] }),
      at,
    );
    expect(result.status).toBe('ON_TRACK');
  });

  it('ignores go-live rules when no target date is set', () => {
    expect(evaluateProjectHealth(input({ targetGoLiveOn: null }), at).status).toBe('ON_TRACK');
  });
});

describe('time zone handling', () => {
  it('evaluates "today" in the project time zone, not UTC', () => {
    // 23:30 UTC on 19 Nov is already 20 Nov in Berlin; a task due 19 Nov is overdue there.
    const lateEvening = new Date('2026-11-19T23:30:00Z');
    const due19 = { tasks: [task('t1', { dueOn: '2026-11-19' })] };
    expect(evaluateProjectHealth(input(due19), { now: lateEvening, timezone: TZ }).status).toBe(
      'AT_RISK',
    );
    expect(evaluateProjectHealth(input(due19), { now: lateEvening, timezone: 'UTC' }).status).toBe(
      'ON_TRACK',
    );
  });

  it('is deterministic for identical inputs', () => {
    const value = input({ risks: [blockingRisk], tasks: tasks(5, 3) });
    expect(evaluateProjectHealth(value, at)).toEqual(evaluateProjectHealth(value, at));
  });

  it('rejects an invalid time zone', () => {
    expect(() => evaluateProjectHealth(input(), { now: NOW, timezone: 'Mars/Base' })).toThrow(
      RangeError,
    );
  });

  it('rejects malformed dates', () => {
    expect(() => evaluateProjectHealth(input({ targetGoLiveOn: '27/11/2026' }), at)).toThrow(
      'Invalid local date: 27/11/2026',
    );
  });
});
