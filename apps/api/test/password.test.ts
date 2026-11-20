import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/security/password.js';

describe('password hashing', () => {
  it('verifies the original password and rejects others', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash.startsWith('scrypt$')).toBe(true);
    await expect(verifyPassword('correct horse battery', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong horse battery', hash)).resolves.toBe(false);
  });

  it('uses a unique salt per hash', async () => {
    const [a, b] = await Promise.all([
      hashPassword('same password 123'),
      hashPassword('same password 123'),
    ]);
    expect(a).not.toBe(b);
  });

  it('rejects short passwords', async () => {
    await expect(hashPassword('short')).rejects.toThrow(/at least 12/);
  });

  it('returns false for malformed encodings', async () => {
    await expect(verifyPassword('anything', 'not-a-hash')).resolves.toBe(false);
    await expect(verifyPassword('anything', 'bcrypt$1$2$3$4$5')).resolves.toBe(false);
  });
});
