'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDistance } from '@/lib/geo';
import type { MapBench } from '@/lib/mapTypes';

export function BenchPreviewCard({
  bench,
  onClose,
  onCheckIn,
}: {
  bench: MapBench;
  onClose: () => void;
  onCheckIn: () => void;
}) {
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-16 z-30 px-3">
      <div className="card mx-auto flex max-w-lg gap-3 p-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-moss-100">
          {bench.cover_photo_url ? (
            <Image
              src={bench.cover_photo_url}
              alt={bench.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">🪑</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-bold text-moss-900">{bench.name}</h3>
            <button onClick={onClose} className="shrink-0 text-moss-300" aria-label="Luk">
              ✕
            </button>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-moss-500">
            <span>⭐ {bench.rating_count > 0 ? bench.average_rating.toFixed(1) : '–'}</span>
            <span>({bench.rating_count})</span>
            <span>· {formatDistance(bench.distance_meters)}</span>
            {bench.active_checkins > 0 && (
              <span className="pill">🟢 {bench.active_checkins} her nu</span>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Link
              href={`/bench/${bench.id}`}
              className="flex-1 rounded-full bg-moss-600 py-1.5 text-center text-xs font-semibold text-white active:scale-95"
            >
              Se bænk
            </Link>
            <button
              onClick={onCheckIn}
              className="flex-1 rounded-full bg-moss-50 py-1.5 text-center text-xs font-semibold text-moss-700 active:scale-95"
            >
              Check ind
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
