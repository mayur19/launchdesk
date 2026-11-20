/**
 * Rule-based project health (PRD FR-09, ADR-0016).
 *
 * Deterministic and transparent: the same input and clock always produce the
 * same status, and every status other than ON_TRACK carries the list of
 * reasons that caused it so the UI can show them verbatim.
 *
 *  - COMPLETED  project status is COMPLETED (short-circuits all other rules)
 *  - AT_RISK    open launch-blocking item, overdue required milestone, or
 *               more than 20% of required tasks overdue
 *  - WATCH      1-20% of required tasks overdue, or go-live within 7 days
 *               (or already passed) while required tasks are outstanding
 *  - ON_TRACK   otherwise
 *
 * Zero rule: with no required tasks the overdue share is 0 and task-based
 * rules never trigger. Wiring to SQL records is TODO(LD-046).
 */
import {
  goLiveProximity,
  launchBlockingIssues,
  overdueBasisPoints,
  overdueRequiredMilestones,
  overdueTaskShare,
  type RuleContext,
} from './health-rules.js';
import type {
  EvaluationClock,
  HealthInput,
  HealthReason,
  HealthResult,
  HealthStatus,
} from './health-types.js';
import { localDateInZone, toDayNumber } from './local-date.js';

export type * from './health-types.js';
export { HEALTH_THRESHOLDS } from './health-rules.js';

function buildContext(input: HealthInput, todayDay: number): RuleContext {
  const requiredTasks = input.tasks.filter((t) => t.required);
  const outstandingTasks = requiredTasks.filter((t) => t.status !== 'DONE');
  const overdueTasks = outstandingTasks.filter(
    (t) => t.dueOn !== null && toDayNumber(t.dueOn) < todayDay,
  );
  const daysUntilGoLive =
    input.targetGoLiveOn === null ? null : toDayNumber(input.targetGoLiveOn) - todayDay;
  return { todayDay, requiredTasks, overdueTasks, outstandingTasks, daysUntilGoLive };
}

function statusFrom(reasons: readonly HealthReason[]): HealthStatus {
  if (reasons.some((r) => r.severity === 'AT_RISK')) return 'AT_RISK';
  return reasons.length > 0 ? 'WATCH' : 'ON_TRACK';
}

export function evaluateProjectHealth(input: HealthInput, clock: EvaluationClock): HealthResult {
  const evaluatedOn = localDateInZone(clock.now, clock.timezone);
  const ctx = buildContext(input, toDayNumber(evaluatedOn));
  const metrics = {
    requiredTasks: ctx.requiredTasks.length,
    overdueRequiredTasks: ctx.overdueTasks.length,
    overdueBasisPoints: overdueBasisPoints(ctx.overdueTasks.length, ctx.requiredTasks.length),
  };

  if (input.projectStatus === 'COMPLETED') {
    const done: HealthReason = {
      code: 'PROJECT_COMPLETED',
      severity: 'COMPLETED',
      message: 'Project is completed.',
    };
    return { status: 'COMPLETED', reasons: [done], evaluatedOn, metrics };
  }

  const isPast = (localDate: string) => toDayNumber(localDate) < ctx.todayDay;
  const triggered = [
    ...launchBlockingIssues(input),
    ...overdueRequiredMilestones(input, isPast),
    ...overdueTaskShare(ctx),
    ...goLiveProximity(ctx, input.targetGoLiveOn ?? ''),
  ];
  const atRiskFirst = [
    ...triggered.filter((r) => r.severity === 'AT_RISK'),
    ...triggered.filter((r) => r.severity !== 'AT_RISK'),
  ];
  return { status: statusFrom(atRiskFirst), reasons: atRiskFirst, evaluatedOn, metrics };
}
