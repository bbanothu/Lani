import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string | undefined) || user.email || 'there',
  };
}

function fromSession(session: Session | null): AuthUser | null {
  return session?.user ? toAuthUser(session.user) : null;
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<string | null> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name || email.split('@')[0] } },
  });
  return error?.message ?? null;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Permanently deletes the signed-in user's account and all their data. */
export async function deleteAccount(): Promise<string | null> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) return error.message;
  await supabase.auth.signOut();
  return null;
}

export async function updateName(name: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ data: { name } });
  return error?.message ?? null;
}

/** Tracks the signed-in user across the app; null once loaded means signed out. */
export function useSession(): { user: AuthUser | null; ready: boolean } {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(fromSession(data.session));
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(fromSession(session));
      setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, ready };
}
