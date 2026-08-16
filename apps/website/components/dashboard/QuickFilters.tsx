'use client';

export type FilterChip = { key: string; label: string; count: number };

export default function QuickFilters({
  chips,
  active,
  onToggle,
  onAdd,
}: {
  chips: FilterChip[];
  active: Set<string>;
  onToggle: (key: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-ink/45">Quick filters:</span>
      {chips.map((chip) => {
        const selected = active.has(chip.key);
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onToggle(chip.key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              selected
                ? 'border-brand bg-brand/10 font-medium text-brand'
                : 'border-ink/10 bg-white text-ink/70 hover:border-ink/20'
            }`}
          >
            {selected ? '✓' : '+'} {chip.label} <span className="text-ink/35">({chip.count})</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="rounded-full bg-brand px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
      >
        + Add
      </button>
    </div>
  );
}
