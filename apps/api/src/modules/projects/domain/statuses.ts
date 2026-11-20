/** Lifecycle and record statuses from PRD FR-03, FR-05 and FR-06. */
export const PROJECT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'READY_FOR_LAUNCH',
  'LIVE',
  'COMPLETED',
  'ON_HOLD',
  'CANCELLED',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MILESTONE_STATUSES = [
  'NOT_READY',
  'READY_FOR_REVIEW',
  'ACCEPTED',
  'REJECTED',
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const RISK_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export const OPEN_RISK_STATUSES: readonly RiskStatus[] = ['OPEN', 'IN_PROGRESS'];
