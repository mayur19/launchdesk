/**
 * Individual health rules from PRD FR-09. Each rule is a pure function that
 * returns the reasons it triggered (possibly none). Thresholds are integers:
 * percentages are compared by cross-multiplication, never with floats.
 */
import { OPEN_RISK_STATUSES } from './statuses.js';
import type { HealthInput, HealthReason, HealthTask } from './health-types.js';

export const HEALTH_THRESHOLDS = {
  /** AT_RISK when overdue required tasks exceed this percentage. */
  atRiskOverduePercent: 20,
  /** WATCH when go-live is this many days away (or fewer) with work outstanding. */
  goLiveWarningDays: 7,
} as const;

export interface RuleContext {
  readonly todayDay: number;
  readonly requiredTasks: readonly HealthTask[];
  readonly overdueTasks: readonly HealthTask[];
  readonly outstandingTasks: readonly HealthTask[];
  /** Days from today to target go-live; null when no target is set. */
  readonly daysUntilGoLive: number | null;
}

export function formatBasisPoints(bps: number): string {
  return `${Math.floor(bps / 100)}.${String(bps % 100).padStart(2, '0')}%`;
}

export function overdueBasisPoints(overdue: number, total: number): number {
  return total === 0 ? 0 : Math.floor((overdue * 10_000) / total);
}

export function launchBlockingIssues(input: HealthInput): readonly HealthReason[] {
  return input.risks
    .filter((risk) => risk.launchBlocking && OPEN_RISK_STATUSES.includes(risk.status))
    .map((risk) => ({
      code: 'LAUNCH_BLOCKING_ISSUE_OPEN',
      severity: 'AT_RISK',
      message: `Launch-blocking item open: ${risk.title}`,
      refs: [risk.id],
    }));
}

export function overdueRequiredMilestones(
  input: HealthInput,
  isPast: (localDate: string) => boolean,
): readonly HealthReason[] {
  return input.milestones
    .filter((m) => m.required && m.status !== 'ACCEPTED' && m.targetOn !== null)
    .filter((m) => isPast(m.targetOn!))
    .map((m) => ({
      code: 'REQUIRED_MILESTONE_OVERDUE',
      severity: 'AT_RISK',
      message: `Required milestone overdue: ${m.title} (target ${m.targetOn})`,
      refs: [m.id],
    }));
}

export function overdueTaskShare(ctx: RuleContext): readonly HealthReason[] {
  const overdue = ctx.overdueTasks.length;
  const total = ctx.requiredTasks.length;
  if (overdue === 0) return [];
  const share = formatBasisPoints(overdueBasisPoints(overdue, total));
  const refs = ctx.overdueTasks.map((t) => t.id);
  const limit = HEALTH_THRESHOLDS.atRiskOverduePercent;
  return overdue * 100 > limit * total
    ? [
        {
          code: 'OVERDUE_TASKS_ABOVE_THRESHOLD',
          severity: 'AT_RISK',
          message: `${overdue} of ${total} required tasks overdue (${share}, threshold ${limit}%)`,
          refs,
        },
      ]
    : [
        {
          code: 'OVERDUE_TASKS_PRESENT',
          severity: 'WATCH',
          message: `${overdue} of ${total} required tasks overdue (${share})`,
          refs,
        },
      ];
}

export function goLiveProximity(ctx: RuleContext, targetGoLiveOn: string): readonly HealthReason[] {
  const days = ctx.daysUntilGoLive;
  const outstanding = ctx.outstandingTasks.length;
  if (days === null || outstanding === 0 || days > HEALTH_THRESHOLDS.goLiveWarningDays) return [];
  const refs = ctx.outstandingTasks.map((t) => t.id);
  return days < 0
    ? [
        {
          code: 'GO_LIVE_DATE_PASSED',
          severity: 'WATCH',
          message: `Go-live date ${targetGoLiveOn} passed with ${outstanding} required task(s) outstanding`,
          refs,
        },
      ]
    : [
        {
          code: 'GO_LIVE_WITHIN_7_DAYS',
          severity: 'WATCH',
          message: `Go-live in ${days} day(s) with ${outstanding} required task(s) outstanding`,
          refs,
        },
      ];
}
