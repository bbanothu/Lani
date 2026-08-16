'use client';

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export default function RetailerRail({
  domains,
  selected,
  onSelect,
}: {
  domains: string[];
  selected: string | null;
  onSelect: (domain: string | null) => void;
}) {
  if (domains.length === 0) return null;

  return (
    <aside className="fixed left-3 top-1/2 z-20 hidden -translate-y-1/2 md:block">
      <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto rounded-full border border-ink/8 bg-white px-2 py-3 shadow-[0_8px_30px_rgba(28,27,26,0.08)]">
        <button
          type="button"
          aria-label="All retailers"
          onClick={() => onSelect(null)}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-colors ${
            selected == null
              ? 'bg-brand text-white'
              : 'bg-ink/[0.04] text-ink/50 hover:bg-ink/[0.08]'
          }`}
        >
          All
        </button>
        {domains.map((domain) => {
          const active = selected === domain;
          return (
            <button
              key={domain}
              type="button"
              title={domain}
              aria-label={domain}
              onClick={() => onSelect(active ? null : domain)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                active ? 'bg-brand/10 ring-2 ring-brand' : 'bg-ink/[0.03] hover:bg-ink/[0.07]'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={faviconUrl(domain)} alt="" className="h-5 w-5 rounded-sm" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
