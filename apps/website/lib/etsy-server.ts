import { createHash, randomBytes } from 'crypto';

import { signState, verifyState } from '@/lib/oauth-state';

export const ETSY_AUTH_URL = 'https://www.etsy.com/oauth/connect';
export const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';
export const ETSY_API = 'https://api.etsy.com/v3/application';

// Read-only: enough to list the seller's shop receipts. No write scope requested.
export const ETSY_SCOPE = 'transactions_r';

/** Etsy requires PKCE on every auth request -- no client secret in the code exchange. */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url'); // 43 chars, within Etsy's allowed charset
}

export function codeChallengeFromVerifier(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

type EtsyStateData = { uid: string; verifier: string };

/** Carries the verified user id + PKCE verifier through Etsy's redirect, HMAC-signed so the callback can trust them. */
export function signEtsyState(data: EtsyStateData): string {
  return signState(process.env.ETSY_SHARED_SECRET!, data);
}

export function verifyEtsyState(state: string): EtsyStateData | null {
  return verifyState<EtsyStateData>(process.env.ETSY_SHARED_SECRET!, state);
}

async function tokenRequest(body: URLSearchParams) {
  const res = await fetch(ETSY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.error || 'Etsy token request failed');
  return json as { access_token: string; refresh_token: string; expires_in: number };
}

export function exchangeCodeForTokens(code: string, verifier: string, redirectUri: string) {
  return tokenRequest(
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ETSY_KEYSTRING!,
      redirect_uri: redirectUri,
      code,
      code_verifier: verifier,
    }),
  );
}

export function refreshEtsyToken(refreshToken: string) {
  return tokenRequest(
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ETSY_KEYSTRING!,
      refresh_token: refreshToken,
    }),
  );
}

/** Etsy access tokens are formatted `{user_id}.{rest}` -- the numeric prefix is the shop owner's user id. */
export function etsyUserIdFromToken(accessToken: string): string {
  return accessToken.split('.')[0];
}

function apiKeyHeader(): string {
  return `${process.env.ETSY_KEYSTRING}:${process.env.ETSY_SHARED_SECRET}`;
}

export async function etsyApiFetch(path: string, accessToken: string): Promise<any> {
  const res = await fetch(`${ETSY_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'x-api-key': apiKeyHeader() },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Etsy API request failed');
  return json;
}
