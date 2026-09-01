import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uxroeiaomhjwxmaehami.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cjh4sSRx0kI9cM1umcm87w_q4JSTDsG';

// MV3 service workers have no `window`/`localStorage` and get killed and
// restarted constantly, so the session has to persist through
// chrome.storage.local (survives worker restarts) instead of the in-memory
// default. Only the background worker holds this client -- content scripts
// and the side panel go through chrome.runtime messages, same as every
// other network call in this extension (see background/index.ts).
const chromeStorageAdapter = {
  getItem: (key: string) =>
    new Promise<string | null>((resolve) => {
      chrome.storage.local.get(key, (result) => resolve(result[key] ?? null));
    }),
  setItem: (key: string, value: string) =>
    new Promise<void>((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    }),
  removeItem: (key: string) =>
    new Promise<void>((resolve) => {
      chrome.storage.local.remove(key, () => resolve());
    }),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string | undefined) || user.email || 'there',
  };
}
