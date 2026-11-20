import type { Role, SessionUser } from '@launchdesk/shared';
import type { Queryable } from '../../db/pool.js';

interface SessionRow {
  user_id: string;
  organization_id: string;
  organization_name: string;
  email: string;
  display_name: string;
  role: Role;
  customer_account_id: string | null;
}

export interface CreateSessionInput {
  readonly tokenHash: string;
  readonly userId: string;
  readonly organizationId: string;
  readonly expiresAt: Date;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
}

export function createSessionRepository(db: Queryable) {
  return {
    async create(input: CreateSessionInput): Promise<void> {
      await db.query(
        `INSERT INTO sessions (token_hash, user_id, organization_id, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          input.tokenHash,
          input.userId,
          input.organizationId,
          input.expiresAt,
          input.ipAddress,
          input.userAgent,
        ],
      );
    },

    /** Resolve an unexpired session for an active user. */
    async findActiveUser(tokenHash: string): Promise<SessionUser | null> {
      const { rows } = await db.query<SessionRow>(
        `SELECT u.id AS user_id, u.organization_id, o.name AS organization_name,
                u.email, u.display_name, u.role, u.customer_account_id
           FROM sessions s
           JOIN users u ON u.id = s.user_id AND u.is_active
           JOIN organizations o ON o.id = s.organization_id
          WHERE s.token_hash = $1 AND s.expires_at > now()`,
        [tokenHash],
      );
      const row = rows[0];
      return row
        ? {
            id: row.user_id,
            organizationId: row.organization_id,
            organizationName: row.organization_name,
            email: row.email,
            displayName: row.display_name,
            role: row.role,
            customerAccountId: row.customer_account_id,
          }
        : null;
    },

    async delete(tokenHash: string): Promise<void> {
      await db.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
    },

    async deleteExpired(): Promise<number> {
      const result = await db.query('DELETE FROM sessions WHERE expires_at <= now()');
      return result.rowCount ?? 0;
    },
  };
}

export type SessionRepository = ReturnType<typeof createSessionRepository>;
