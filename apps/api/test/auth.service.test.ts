import { describe, expect, it, vi } from 'vitest';
import type { SessionUser } from '@launchdesk/shared';
import { createAuthService } from '../src/modules/auth/auth.service.js';
import type { SessionRepository } from '../src/modules/auth/session.repository.js';
import type { UserRepository } from '../src/modules/auth/user.repository.js';
import { hashPassword } from '../src/security/password.js';
import { hashToken } from '../src/security/tokens.js';

const user: SessionUser = {
  id: '00000000-0000-4000-8000-000000000001',
  organizationId: '00000000-0000-4000-8000-0000000000aa',
  organizationName: 'Org',
  email: 'a@example.com',
  displayName: 'A',
  role: 'PROVIDER_ADMIN',
  customerAccountId: null,
};

async function setup(overrides: { isActive?: boolean; missing?: boolean } = {}) {
  const passwordHash = await hashPassword('valid password 123');
  const users: UserRepository = {
    findCredentialsByEmail: vi.fn(async () =>
      overrides.missing
        ? null
        : {
            id: user.id,
            organizationId: user.organizationId,
            passwordHash,
            isActive: overrides.isActive ?? true,
            role: user.role,
          },
    ),
    touchLastLogin: vi.fn(async () => undefined),
  };
  const sessions: SessionRepository = {
    create: vi.fn(async () => undefined),
    findActiveUser: vi.fn(async () => user),
    delete: vi.fn(async () => undefined),
    deleteExpired: vi.fn(async () => 0),
  };
  const now = new Date('2026-01-01T00:00:00Z');
  const service = createAuthService({ users, sessions, sessionTtlMinutes: 60, now: () => now });
  return { service, users, sessions, now };
}

const ctx = { ipAddress: '127.0.0.1', userAgent: 'vitest' };

describe('auth service', () => {
  it('creates a hashed session on valid credentials', async () => {
    const { service, sessions, users } = await setup();
    const result = await service.login({ email: user.email, password: 'valid password 123' }, ctx);
    expect(result.user).toEqual(user);
    expect(result.expiresAt.toISOString()).toBe('2026-01-01T01:00:00.000Z');
    const created = vi.mocked(sessions.create).mock.calls[0]![0];
    expect(created.tokenHash).toBe(hashToken(result.sessionToken));
    expect(created.tokenHash).not.toBe(result.sessionToken);
    expect(users.touchLastLogin).toHaveBeenCalledWith(user.id);
  });

  it.each([
    ['wrong password', {}, 'nope nope nope'],
    ['unknown email', { missing: true }, 'valid password 123'],
    ['inactive user', { isActive: false }, 'valid password 123'],
  ])('rejects %s with the same generic error', async (_label, overrides, password) => {
    const { service, sessions } = await setup(overrides);
    await expect(service.login({ email: user.email, password }, ctx)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('deletes the session by hash on logout', async () => {
    const { service, sessions } = await setup();
    await service.logout('token-123');
    expect(sessions.delete).toHaveBeenCalledWith(hashToken('token-123'));
  });
});
