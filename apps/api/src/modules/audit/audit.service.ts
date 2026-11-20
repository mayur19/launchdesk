import type { Queryable } from '../../db/pool.js';

export interface AuditEvent {
  readonly organizationId: string | null;
  readonly actorUserId: string | null;
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string | null;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly requestId?: string | null;
}

/**
 * Append-only audit writer (ADR-0008). Pass a transaction client so the audit
 * row commits atomically with the business change it describes.
 */
export async function recordAudit(db: Queryable, event: AuditEvent): Promise<void> {
  await db.query(
    `INSERT INTO audit_events (organization_id, actor_user_id, action, entity_type, entity_id, metadata, request_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      event.organizationId,
      event.actorUserId,
      event.action,
      event.entityType,
      event.entityId ?? null,
      JSON.stringify(event.metadata ?? {}),
      event.requestId ?? null,
    ],
  );
}
