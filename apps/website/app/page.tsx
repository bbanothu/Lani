'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    getUser().then((user) => {
      router.replace(user ? '/dashboard' : '/home');
    });
  }, [router]);

  return null;
}
