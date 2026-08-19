'use client';

import { FormEvent, useState } from 'react';
import NewHeader from '@/components/figma-landing/NewHeader';
import NewFooter from '@/components/figma-landing/NewFooter';

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <NewHeader />

      <main className="container mx-auto px-4 sm:px-8 lg:px-20 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-ink mb-3">Newsletter</h1>
        <p className="text-lg text-[#78716C] mb-10">
          Occasional emails about new features, price-tracking improvements, and what we are
          building next. No spam, unsubscribe any time.
        </p>

        {submitted ? (
          <p className="text-lg font-medium text-ink">
            You are on the list — thanks for signing up.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-lg border border-[#E7E5E4] px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand-dark"
            >
              Subscribe
            </button>
          </form>
        )}
      </main>

      <NewFooter />
    </div>
  );
}
