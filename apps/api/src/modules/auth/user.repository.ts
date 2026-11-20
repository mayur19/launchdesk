import type { Role } from '@launchdesk/shared';
import type { Queryable } from '../../db/pool.js';

export interface UserCredentials {
  readonly id: string;
  readonly organizationId: string;
  readonly passwordHash: string;
  readonly isActive: boolean;
  readonly role: Role;
}

export function createUserRepository(db: Queryable) {
  return {
    async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
      const { rows } = await db.query<{
        id: string;
        organization_id: string;
        password_hash: string;
        is_active: boolean;
        role: Role;
      }>('SELECT id, organization_id, password_hash, is_active, role FROM users WHERE email = $1', [
        email,
      ]);
      const row = rows[0];
      return row
        ? {
            id: row.id,
            organizationId: row.organization_id,
            passwordHash: row.password_hash,
            isActive: row.is_active,
            role: row.role,
          }
        : null;
    },

    async touchLastLogin(userId: string): Promise<void> {
      await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]);
    },
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
