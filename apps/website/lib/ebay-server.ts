import { createHmac, timingSafeEqual } from 'crypto';

const ENV = process.env.EBAY_ENV === 'production' ? 'production' : 'sandbox';

export const EBAY_BASE = {
  sandbox: { auth: 'https://auth.sandbox.ebay.com', api: 'https://api.sandbox.ebay.com' },
  production: { auth: 'https://auth.ebay.com', api: 'https://api.ebay.com' },
}[ENV];

export const EBAY_SCOPE = 'https://api.ebay.com/oauth/api_scope/sell.fulfillment';

const STATE_TTL_MS = 10 * 60 * 1000;

function sign(payload: string): string {
  return createHmac('sha256', process.env.EBAY_CLIENT_SECRET!).update(payload).digest('base64url');
}

/** Carries the caller's verified user id through eBay's redirect, HMAC-signed so the callback can trust it. */
export function signState(uid: string): string {
  const payload = Buffer.from(JSON.stringify({ uid, exp: Date.now() + STATE_TTL_MS })).toString(
    'base64url',
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyState(state: string): string | null {
  const [payload, sig] = state.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const { uid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (typeof uid !== 'string' || typeof exp !== 'number' || Date.now() > exp) return null;
  return uid;
}

async function tokenRequest(body: URLSearchParams) {
  const basic = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`,
  ).toString('base64');
  const res = await fetch(`${EBAY_BASE.api}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || 'eBay token request failed');
  return json as { access_token: string; refresh_token?: string; expires_in: number };
}

export function exchangeCodeForTokens(code: string) {
  return tokenRequest(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.EBAY_RU_NAME!,
    }),
  );
}

export function refreshEbayToken(refreshToken: string) {
  return tokenRequest(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: EBAY_SCOPE,
    }),
  );
}
