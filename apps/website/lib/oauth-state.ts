import { createHmac, timingSafeEqual } from 'crypto';

const TTL_MS = 10 * 60 * 1000;

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Signs an arbitrary payload with a short TTL, for carrying trusted data through a third-party OAuth redirect. */
export function signState(secret: string, data: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + TTL_MS })).toString(
    'base64url',
  );
  return `${payload}.${sign(secret, payload)}`;
}

export function verifyState<T extends Record<string, unknown>>(
  secret: string,
  state: string,
): T | null {
  const [payload, sig] = state.split('.');
  if (!payload || !sig) return null;
  const expected = sign(secret, payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (typeof data.exp !== 'number' || Date.now() > data.exp) return null;
  return data as T;
}
