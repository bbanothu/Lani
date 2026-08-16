import Image from 'next/image';

export default function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <Image src="/lani-dog-small.png" alt="" width={96} height={96} className="opacity-80" />
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="text-sm text-ink/60 max-w-xs">{message}</p>
    </div>
  );
}
