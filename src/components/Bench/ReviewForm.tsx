'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitReview } from '@/lib/actions/reviews';

export function ReviewForm({ benchId }: { benchId: string }) {
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    const result = await submitReview(benchId, body);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? 'Noget gik galt.');
      return;
    }
    setBody('');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Del din oplevelse med denne bænk…"
        rows={3}
        className="rounded-xl border border-moss-100 p-3 text-sm outline-none focus:border-moss-400"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={saving || !body.trim()}
        className="btn-primary self-end px-6 py-2 text-sm"
      >
        {saving ? 'Poster…' : 'Post anmeldelse'}
      </button>
    </div>
  );
}
