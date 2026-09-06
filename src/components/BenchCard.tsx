import Link from 'next/link';

export interface BenchCardData {
  id: string;
  name: string;
  district?: string | null;
  average_rating: number;
  rating_count: number;
  badge?: string;
}

export function BenchCard({ bench }: { bench: BenchCardData }) {
  return (
    <Link href={`/bench/${bench.id}`} className="card flex min-w-[9.5rem] flex-col gap-1 p-3">
      <div className="flex h-16 items-center justify-center rounded-lg bg-moss-100 text-2xl">🪑</div>
      <p className="truncate text-sm font-semibold text-moss-900">{bench.name}</p>
      {bench.district && <p className="truncate text-xs text-moss-400">{bench.district}</p>}
      <p className="text-xs font-medium text-moss-600">
        ⭐ {bench.rating_count > 0 ? bench.average_rating.toFixed(1) : '–'}
        {bench.badge && <span className="ml-1">{bench.badge}</span>}
      </p>
    </Link>
  );
}

export function BenchRow({ title, emoji, benches }: { title: string; emoji: string; benches: BenchCardData[] }) {
  if (benches.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-4 text-sm font-bold text-moss-800">
        {emoji} {title}
      </h2>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1">
        {benches.map((b) => (
          <BenchCard key={b.id} bench={b} />
        ))}
      </div>
    </section>
  );
}
