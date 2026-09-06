'use client';

import { useState } from 'react';
import { BenchRow } from '@/components/BenchCard';
import type { MapBench } from '@/lib/mapTypes';

export function NearbySection() {
  const [benches, setBenches] = useState<MapBench[] | null>(null);
  const [loading, setLoading] = useState(false);

  function loadNearby() {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const res = await fetch(
          `/api/benches/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}&radius=1500`
        );
        const data = await res.json();
        setBenches(data.benches ?? []);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }

  if (benches === null) {
    return (
      <section className="mb-6 px-4">
        <button onClick={loadNearby} disabled={loading} className="btn-secondary w-full">
          📍 {loading ? 'Henter placering…' : 'Vis bænke tæt på dig'}
        </button>
      </section>
    );
  }

  return <BenchRow title="Tæt på dig" emoji="📍" benches={benches} />;
}
