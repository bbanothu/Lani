'use client';

import type { ReactNode } from 'react';

type Tab = 'home' | 'chat' | 'cart' | 'lists' | 'profile';

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M21 12a8 8 0 01-8 8H7l-4 3v-3a8 8 0 118-8z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'cart',
    label: 'Cart',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 21a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'lists',
    label: 'Lists',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M20 21a8 8 0 10-16 0M12 13a4 4 0 100-8 4 4 0 000 8z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav({
  active = 'home',
  onSelect,
}: {
  active?: Tab;
  onSelect?: (tab: Tab) => void;
}) {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex items-end gap-5 rounded-[28px] border border-ink/8 bg-white/95 px-7 py-3 shadow-[0_12px_40px_rgba(28,27,26,0.12)] backdrop-blur-md">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect?.(tab.id)}
              className={`flex min-w-[3.25rem] flex-col items-center gap-0.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-brand' : 'text-ink/40 hover:text-ink/70'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
