'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitRating, type RatingInput } from '@/lib/actions/ratings';
import { StarPicker } from '@/components/StarPicker';
import type { Rating } from '@/lib/types';

const DIMENSIONS: { key: keyof RatingInput; label: string }[] = [
  { key: 'view', label: 'Udsigt' },
  { key: 'comfort', label: 'Komfort' },
  { key: 'coziness', label: 'Hygge' },
  { key: 'quiet', label: 'Ro' },
  { key: 'sun', label: 'Sol' },
  { key: 'location_score', label: 'Beliggenhed' },
];

export function RatingForm({ benchId, existing }: { benchId: string; existing: Rating | null }) {
  const [overall, setOverall] = useState(existing?.overall ?? 0);
  const [dims, setDims] = useState<Record<string, number>>({
    view: existing?.view ?? 0,
    comfort: existing?.comfort ?? 0,
    coziness: existing?.coziness ?? 0,
    quiet: existing?.quiet ?? 0,
    sun: existing?.sun ?? 0,
    location_score: existing?.location_score ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    if (overall === 0) {
      setError('Giv en samlet stjernebedømmelse.');
      return;
    }
    setSaving(true);
    setError(null);

    const result = await submitRating(benchId, {
      overall,
      view: dims.view || undefined,
      comfort: dims.comfort || undefined,
      coziness: dims.coziness || undefined,
      quiet: dims.quiet || undefined,
      sun: dims.sun || undefined,
      location_score: dims.location_score || undefined,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? 'Noget gik galt.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="card p-4">
      <p className="mb-2 text-sm font-semibold text-moss-700">
        {existing ? 'Din bedømmelse' : 'Bedøm denne bænk'}
      </p>
      <StarPicker value={overall} onChange={setOverall} />

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {DIMENSIONS.map((dim) => (
          <div key={dim.key}>
            <p className="mb-1 text-xs text-moss-500">{dim.label}</p>
            <StarPicker
              value={dims[dim.key] ?? 0}
              onChange={(v) => setDims((d) => ({ ...d, [dim.key]: v }))}
            />
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button onClick={handleSubmit} disabled={saving} className="btn-primary mt-4 w-full">
        {saving ? 'Gemmer…' : existing ? 'Opdater bedømmelse' : 'Gem bedømmelse'}
      </button>
    </div>
  );
}
