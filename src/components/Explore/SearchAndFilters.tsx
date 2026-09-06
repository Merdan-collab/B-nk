'use client';

import { useState } from 'react';
import { BenchCard, type BenchCardData } from '@/components/BenchCard';

interface Filters {
  minRating: number;
  minSun: number;
  minView: number;
  minComfort: number;
  onlyFavorites: boolean;
  onlyActiveCheckins: boolean;
}

const DEFAULT_FILTERS: Filters = {
  minRating: 0,
  minSun: 0,
  minView: 0,
  minComfort: 0,
  onlyFavorites: false,
  onlyActiveCheckins: false,
};

export function SearchAndFilters() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<BenchCardData[] | null>(null);
  const [loading, setLoading] = useState(false);

  const activeFilterCount = Object.values(filters).filter((v) => (typeof v === 'boolean' ? v : v > 0)).length;

  async function runSearch(nextQuery = query, nextFilters = filters) {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set('q', nextQuery.trim());
    if (nextFilters.minRating) params.set('minRating', String(nextFilters.minRating));
    if (nextFilters.minSun) params.set('minSun', String(nextFilters.minSun));
    if (nextFilters.minView) params.set('minView', String(nextFilters.minView));
    if (nextFilters.minComfort) params.set('minComfort', String(nextFilters.minComfort));
    if (nextFilters.onlyFavorites) params.set('onlyFavorites', '1');
    if (nextFilters.onlyActiveCheckins) params.set('onlyActiveCheckins', '1');

    const hasCriteria =
      nextQuery.trim().length > 0 ||
      Object.values(nextFilters).some((v) => (typeof v === 'boolean' ? v : v > 0));

    if (!hasCriteria) {
      setResults(null);
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/benches/search?${params.toString()}`);
    const data = await res.json();
    setResults(data.benches ?? []);
    setLoading(false);
  }

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    runSearch(query, next);
  }

  return (
    <div className="mb-4 px-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            runSearch(e.target.value, filters);
          }}
          placeholder="Søg efter bænk, adresse eller bydel…"
          className="flex-1 rounded-full border border-moss-100 px-4 py-2.5 text-sm outline-none focus:border-moss-400"
        />
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="relative rounded-full bg-moss-50 px-4 py-2.5 text-sm font-semibold text-moss-700"
        >
          Filtre
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-moss-600 text-[10px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="card mt-3 flex flex-col gap-3 p-4">
          {(
            [
              ['minRating', 'Min. rating'],
              ['minSun', 'Min. sol'],
              ['minView', 'Min. udsigt'],
              ['minComfort', 'Min. komfort'],
            ] as [keyof Filters, string][]
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-moss-600">{label}</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateFilter(key, n as never)}
                    className={`h-7 w-7 rounded-full text-xs font-semibold ${
                      filters[key] === n ? 'bg-moss-600 text-white' : 'bg-moss-50 text-moss-500'
                    }`}
                  >
                    {n === 0 ? 'alle' : n}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <label className="flex items-center justify-between text-sm text-moss-600">
            Kun favoritter
            <input
              type="checkbox"
              checked={filters.onlyFavorites}
              onChange={(e) => updateFilter('onlyFavorites', e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between text-sm text-moss-600">
            Aktive check-ins
            <input
              type="checkbox"
              checked={filters.onlyActiveCheckins}
              onChange={(e) => updateFilter('onlyActiveCheckins', e.target.checked)}
            />
          </label>
        </div>
      )}

      {loading && <p className="mt-3 text-sm text-moss-400">Søger…</p>}

      {results !== null && !loading && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {results.map((b) => (
            <BenchCard key={b.id} bench={b} />
          ))}
          {results.length === 0 && <p className="col-span-2 text-sm text-moss-400">Ingen bænke fundet.</p>}
        </div>
      )}
    </div>
  );
}
