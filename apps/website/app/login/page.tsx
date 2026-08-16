'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn, signUp } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err =
      mode === 'signup' ? await signUp(email, password, name) : await signIn(email, password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (mode === 'signup') {
      setError('Check your email to confirm your account, then sign in.');
      setMode('signin');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Image src="/lani-icon.png" alt="Lani" width={56} height={56} />
          <h1 className="text-xl font-bold text-ink">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button
          onClick={() => {
            setError(null);
            setMode(mode === 'signin' ? 'signup' : 'signin');
          }}
          className="w-full py-2.5 rounded-lg border border-ink/15 hover:bg-ink/5 text-sm font-medium text-ink transition-colors"
        >
          {mode === 'signin'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
