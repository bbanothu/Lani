// Reverb's public OAuth docs are sparse -- the authorize URL, exact token
// request shape, and API base below are best-effort from what's confirmed
// (token endpoint, Bearer auth, read_orders scope) plus reasonable
// convention for the rest. Verify against a real Reverb app once approved;
// the orders endpoint path in particular may need adjusting.

export const REVERB_AUTH_URL = 'https://reverb.com/oauth/authorize';
export const REVERB_TOKEN_URL = 'https://reverb.com/oauth/token';
export const REVERB_API = 'https://api.reverb.com/api';
export const REVERB_SCOPE = 'read_orders';

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(REVERB_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.REVERB_CLIENT_ID!,
      client_secret: process.env.REVERB_CLIENT_SECRET!,
      ...body,
    }),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json.error_description || json.error || 'Reverb token request failed');
  return json as { access_token: string; refresh_token?: string; expires_in: number };
}

export function exchangeCodeForTokens(code: string, redirectUri: string) {
  return tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });
}

export function refreshReverbToken(refreshToken: string) {
  return tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });
}

export async function reverbApiFetch(path: string, accessToken: string): Promise<any> {
  const res = await fetch(`${REVERB_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/hal+json' },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || 'Reverb API request failed');
  return json;
}
