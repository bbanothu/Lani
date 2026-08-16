'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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

export async function getUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  return fromSession(data.session);
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

export async function updateName(name: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ data: { name } });
  return error?.message ?? null;
}

/** Gates a page: redirects to /login if signed out, stays in sync with sign-in/out elsewhere. */
export function useRequireUser(): { user: AuthUser | null; ready: boolean } {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const u = fromSession(data.session);
      if (!u) {
        router.replace('/login');
        return;
      }
      setUser(u);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = fromSession(session);
      setUser(u);
      if (!u) router.replace('/login');
      else setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return { user, ready };
}
