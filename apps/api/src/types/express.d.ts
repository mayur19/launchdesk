import type { SessionUser } from '@launchdesk/shared';

declare global {
  namespace Express {
    interface Request {
      /** Correlation id, echoed in X-Request-Id and error bodies. */
      requestId: string;
      /** Present when a valid session cookie accompanied the request. */
      auth?: {
        readonly user: SessionUser;
        readonly sessionToken: string;
      };
    }
  }
}

export {};
