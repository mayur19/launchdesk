import type { TaskStatus } from '../../tasks/domain/task-status.js';
import type { MilestoneStatus, ProjectStatus, RiskStatus } from './statuses.js';

export const HEALTH_STATUSES = ['ON_TRACK', 'WATCH', 'AT_RISK', 'COMPLETED'] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type HealthReasonCode =
  | 'PROJECT_COMPLETED'
  | 'LAUNCH_BLOCKING_ISSUE_OPEN'
  | 'REQUIRED_MILESTONE_OVERDUE'
  | 'OVERDUE_TASKS_ABOVE_THRESHOLD'
  | 'OVERDUE_TASKS_PRESENT'
  | 'GO_LIVE_WITHIN_7_DAYS'
  | 'GO_LIVE_DATE_PASSED';

export interface HealthReason {
  readonly code: HealthReasonCode;
  readonly severity: Exclude<HealthStatus, 'ON_TRACK'>;
  readonly message: string;
  /** Ids of the tasks, milestones or risks that triggered the rule. */
  readonly refs?: readonly string[];
}

export interface HealthTask {
  readonly id: string;
  readonly title: string;
  readonly required: boolean;
  readonly status: TaskStatus;
  /** Local ISO date in the project time zone. */
  readonly dueOn: string | null;
}

export interface HealthMilestone {
  readonly id: string;
  readonly title: string;
  readonly required: boolean;
  readonly status: MilestoneStatus;
  readonly targetOn: string | null;
}

export interface HealthRisk {
  readonly id: string;
  readonly title: string;
  readonly launchBlocking: boolean;
  readonly status: RiskStatus;
}

export interface HealthInput {
  readonly projectStatus: ProjectStatus;
  readonly targetGoLiveOn: string | null;
  readonly tasks: readonly HealthTask[];
  readonly milestones: readonly HealthMilestone[];
  readonly risks: readonly HealthRisk[];
}

export interface HealthMetrics {
  readonly requiredTasks: number;
  readonly overdueRequiredTasks: number;
  /** overdue / required in basis points (integer, floored); 0 when no required tasks. */
  readonly overdueBasisPoints: number;
}

export interface HealthResult {
  readonly status: HealthStatus;
  readonly reasons: readonly HealthReason[];
  readonly evaluatedOn: string;
  readonly metrics: HealthMetrics;
}

export interface EvaluationClock {
  readonly now: Date;
  /** IANA time zone of the project, e.g. "Europe/Berlin". */
  readonly timezone: string;
}
