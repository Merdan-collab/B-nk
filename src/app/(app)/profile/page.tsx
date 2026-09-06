import { createClient } from '@/lib/supabase/server';
import { BADGES, type ProfileStats } from '@/lib/badges';
import { BenchCard, type BenchCardData } from '@/components/BenchCard';
import { ListsManager } from '@/components/Profile/ListsManager';
import { NotificationsBell } from '@/components/NotificationsBell';
import { signOut } from '@/app/login/actions';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [
    { data: profile },
    { data: myCheckins },
    { count: ratingCount },
    { count: photoCount },
    { count: benchesCreated },
    { data: favorites },
    { data: lists },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('checkins').select('bench_id, benches(district)').eq('user_id', user.id),
    supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('photos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('benches').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
    supabase.from('favorites').select('benches(id, name, district, average_rating, rating_count)').eq('user_id', user.id),
    supabase.from('lists').select('*, list_items(bench_id)').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);

  const benchesVisited = new Set((myCheckins ?? []).map((c) => c.bench_id)).size;
  const districtsVisited = new Set(
    (myCheckins ?? [])
      .map((c) => (c.benches as unknown as { district: string | null })?.district)
      .filter(Boolean)
  ).size;

  const stats: ProfileStats = {
    benchesVisited,
    districtsVisited,
    checkinCount: myCheckins?.length ?? 0,
    ratingCount: ratingCount ?? 0,
    photoCount: photoCount ?? 0,
    benchesCreated: benchesCreated ?? 0,
  };

  const earnedBadges = BADGES.filter((b) => b.isEarned(stats));
  const favoriteBenches = (favorites ?? [])
    .map((f) => f.benches as unknown as BenchCardData | null)
    .filter((b): b is BenchCardData => !!b);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-200 text-2xl font-bold text-moss-700">
            {profile?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-moss-900">@{profile?.username}</h1>
            {profile?.bio && <p className="text-sm text-moss-500">{profile.bio}</p>}
          </div>
        </div>
        <NotificationsBell variant="inline" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="card p-3">
          <p className="text-lg font-extrabold text-moss-900">{stats.benchesVisited}</p>
          <p className="text-xs text-moss-400">Bænke besøgt</p>
        </div>
        <div className="card p-3">
          <p className="text-lg font-extrabold text-moss-900">{stats.districtsVisited}</p>
          <p className="text-xs text-moss-400">Bydele besøgt</p>
        </div>
        <div className="card p-3">
          <p className="text-lg font-extrabold text-moss-900">{stats.checkinCount}</p>
          <p className="text-xs text-moss-400">Check-ins</p>
        </div>
      </div>

      {earnedBadges.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-moss-700">Badges</p>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((b) => (
              <span key={b.id} className="pill" title={b.description}>
                {b.emoji} {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-moss-700">Favoritbænke</p>
        <div className="grid grid-cols-2 gap-3">
          {favoriteBenches.map((b) => (
            <BenchCard key={b.id} bench={b} />
          ))}
          {favoriteBenches.length === 0 && <p className="col-span-2 text-sm text-moss-400">Ingen favoritter endnu.</p>}
        </div>
      </div>

      <div className="mt-6">
        <ListsManager
          lists={(lists ?? []).map((l) => ({
            id: l.id,
            name: l.name,
            is_shared_with_friends: l.is_shared_with_friends,
            itemCount: (l.list_items as unknown as { bench_id: string }[]).length,
          }))}
        />
      </div>

      <form action={signOut} className="mt-8">
        <button className="btn-secondary w-full">Log ud</button>
      </form>
    </div>
  );
}
