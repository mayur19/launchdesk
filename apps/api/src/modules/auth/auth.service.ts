import type { LoginRequest, SessionUser } from '@launchdesk/shared';
import { errors } from '../../lib/errors.js';
import { getDummyHash, verifyPassword } from '../../security/password.js';
import { generateSessionToken, hashToken } from '../../security/tokens.js';
import type { SessionRepository } from './session.repository.js';
import type { UserRepository } from './user.repository.js';

export interface AuthServiceDeps {
  readonly users: UserRepository;
  readonly sessions: SessionRepository;
  readonly sessionTtlMinutes: number;
  readonly now?: () => Date;
}

export interface LoginContext {
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
}

export interface LoginResult {
  readonly sessionToken: string;
  readonly user: SessionUser;
  readonly expiresAt: Date;
}

export function createAuthService(deps: AuthServiceDeps) {
  const now = deps.now ?? (() => new Date());

  return {
    async login(credentials: LoginRequest, context: LoginContext): Promise<LoginResult> {
      const account = await deps.users.findCredentialsByEmail(credentials.email);
      // Always run a hash comparison to avoid an account-enumeration timing oracle.
      const passwordOk = await verifyPassword(
        credentials.password,
        account?.passwordHash ?? (await getDummyHash()),
      );
      if (!account || !account.isActive || !passwordOk) {
        throw errors.unauthenticated();
      }

      const sessionToken = generateSessionToken();
      const expiresAt = new Date(now().getTime() + deps.sessionTtlMinutes * 60_000);
      const tokenHash = hashToken(sessionToken);
      await deps.sessions.create({
        tokenHash,
        userId: account.id,
        organizationId: account.organizationId,
        expiresAt,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      await deps.users.touchLastLogin(account.id);

      const user = await deps.sessions.findActiveUser(tokenHash);
      if (!user) {
        throw errors.unauthenticated();
      }
      return { sessionToken, user, expiresAt };
    },

    async logout(sessionToken: string): Promise<void> {
      await deps.sessions.delete(hashToken(sessionToken));
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
