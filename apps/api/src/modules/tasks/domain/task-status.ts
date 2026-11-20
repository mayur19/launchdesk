/** Task statuses from PRD FR-04. */
export const TASK_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'BLOCKED',
  'IN_REVIEW',
  'DONE',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
