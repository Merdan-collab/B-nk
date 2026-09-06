import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SearchAndFilters } from '@/components/Explore/SearchAndFilters';
import { NearbySection } from '@/components/Explore/NearbySection';
import { BenchRow, type BenchCardData } from '@/components/BenchCard';
import { NotificationsBell } from '@/components/NotificationsBell';

export const dynamic = 'force-dynamic';

const SELECT_FIELDS = 'id, name, district, average_rating, rating_count, avg_view, avg_sun, avg_quiet, created_at, tags';

function getIsoWeek(date: Date): number {
  const target = new Date(date.getTime());
  target.setUTCHours(0, 0, 0, 0);
  target.setUTCDate(target.getUTCDate() + 3 - ((target.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

export default async function ExplorePage() {
  const supabase = createClient();

  const [
    { data: popular },
    { data: topRated },
    { data: bestView },
    { data: sunniest },
    { data: calm },
    { data: fresh },
    { data: romantic },
    { data: social },
    { data: evening },
  ] = await Promise.all([
    supabase.from('benches_geo').select(SELECT_FIELDS).order('rating_count', { ascending: false }).limit(10),
    supabase.from('benches_geo').select(SELECT_FIELDS).gt('rating_count', 0).order('average_rating', { ascending: false }).limit(10),
    supabase.from('benches_geo').select(SELECT_FIELDS).order('avg_view', { ascending: false }).limit(10),
    supabase.from('benches_geo').select(SELECT_FIELDS).order('avg_sun', { ascending: false }).limit(10),
    supabase.from('benches_geo').select(SELECT_FIELDS).order('avg_quiet', { ascending: false }).limit(10),
    supabase.from('benches_geo').select(SELECT_FIELDS).order('created_at', { ascending: false }).limit(10),
    supabase.from('benches_geo').select(SELECT_FIELDS).contains('tags', ['romantisk']).order('average_rating', { ascending: false }).limit(10),
    supabase.from('benches_geo').select(SELECT_FIELDS).contains('tags', ['socialt']).order('average_rating', { ascending: false }).limit(10),
    supabase.from('benches_geo').select(SELECT_FIELDS).contains('tags', ['aften']).order('average_rating', { ascending: false }).limit(10),
  ]);

  const benchOfWeekPool = (topRated ?? []) as BenchCardData[];
  const benchOfWeek =
    benchOfWeekPool.length > 0
      ? benchOfWeekPool[getIsoWeek(new Date()) % benchOfWeekPool.length]
      : null;

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-xl font-extrabold text-moss-900">Udforsk</h1>
        <NotificationsBell variant="inline" />
      </div>

      <div className="mt-3">
        <SearchAndFilters />
      </div>

      {benchOfWeek && (
        <section className="mb-6 px-4">
          <Link href={`/bench/${benchOfWeek.id}`} className="card block bg-moss-700 p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-moss-200">🆕 Ugens bænk</p>
            <p className="mt-1 text-lg font-extrabold">{benchOfWeek.name}</p>
            <p className="text-sm text-moss-100">⭐ {benchOfWeek.average_rating.toFixed(1)} · {benchOfWeek.district ?? 'København'}</p>
          </Link>
        </section>
      )}

      <NearbySection />

      <BenchRow title="Populære lige nu" emoji="🔥" benches={(popular ?? []) as BenchCardData[]} />
      <BenchRow title="Bedst ratede" emoji="⭐" benches={(topRated ?? []) as BenchCardData[]} />
      <BenchRow title="Bedste udsigt" emoji="🌅" benches={(bestView ?? []) as BenchCardData[]} />
      <BenchRow title="Bedste solbænke" emoji="☀️" benches={(sunniest ?? []) as BenchCardData[]} />
      <BenchRow title="Bedste aftenbænke" emoji="🌙" benches={(evening ?? []) as BenchCardData[]} />
      <BenchRow title="Mest romantiske" emoji="❤️" benches={(romantic ?? []) as BenchCardData[]} />
      <BenchRow title="Mest rolige" emoji="🌳" benches={(calm ?? []) as BenchCardData[]} />
      <BenchRow title="Mest sociale" emoji="👥" benches={(social ?? []) as BenchCardData[]} />
      <BenchRow title="Nye bænke" emoji="🆕" benches={(fresh ?? []) as BenchCardData[]} />
    </div>
  );
}
