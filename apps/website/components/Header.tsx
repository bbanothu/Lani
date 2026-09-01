'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AuthUser, signOut as signOutUser } from '@/lib/auth';

export default function Header({ user }: { user: AuthUser }) {
  const router = useRouter();

  const signOut = async () => {
    await signOutUser();
    router.push('/login');
  };

  return (
    <header className="border-b border-ink/10 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/lani-icon.png" alt="Lani" width={28} height={28} />
          <span className="font-bold text-ink">Lani</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink/60">{user.name}</span>
          <button
            onClick={signOut}
            className="text-sm text-ink/60 hover:text-ink transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
