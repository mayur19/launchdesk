import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

/**
 * Password hashing with Node's built-in scrypt (ADR-0005).
 * Encoded format: scrypt$<N>$<r>$<p>$<saltB64>$<hashB64>
 */
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const DEFAULT_PARAMS = Object.freeze({ N: 32768, r: 8, p: 1 });

function scrypt(password: string, salt: Buffer, params: ScryptOptions): Promise<Buffer> {
  const maxmem = 256 * (params.N ?? DEFAULT_PARAMS.N) * (params.r ?? DEFAULT_PARAMS.r);
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, { ...params, maxmem }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, DEFAULT_PARAMS);
  const { N, r, p } = DEFAULT_PARAMS;
  return ['scrypt', N, r, p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, n, r, p, saltB64, hashB64] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * Pre-computed hash used to equalise timing when the account does not exist,
 * so login latency does not reveal which emails are registered.
 */
let dummyHash: Promise<string> | undefined;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword('dummy-password-for-timing-equalisation');
  return dummyHash;
}
