import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function FriendProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!profile) notFound();

  const [{ data: ratings }, { data: favorites }] = await Promise.all([
    supabase
      .from('ratings')
      .select('overall, benches(id, name)')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('favorites')
      .select('benches(id, name)')
      .eq('user_id', params.id)
      .limit(20),
  ]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-extrabold text-moss-900">@{profile.username}</h1>
      {profile.bio && <p className="mt-1 text-sm text-moss-500">{profile.bio}</p>}

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-moss-700">Bedømte bænke</p>
        <div className="flex flex-col gap-2">
          {(ratings ?? []).map((r, i) => {
            const bench = r.benches as unknown as { id: string; name: string } | null;
            if (!bench) return null;
            return (
              <Link key={i} href={`/bench/${bench.id}`} className="card flex items-center justify-between p-3 text-sm">
                <span className="font-semibold text-moss-800">{bench.name}</span>
                <span>⭐ {r.overall}</span>
              </Link>
            );
          })}
          {(ratings ?? []).length === 0 && <p className="text-sm text-moss-400">Ingen ratings endnu.</p>}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-moss-700">Favoritbænke</p>
        <div className="flex flex-col gap-2">
          {(favorites ?? []).map((f, i) => {
            const bench = f.benches as unknown as { id: string; name: string } | null;
            if (!bench) return null;
            return (
              <Link key={i} href={`/bench/${bench.id}`} className="card p-3 text-sm font-semibold text-moss-800">
                {bench.name}
              </Link>
            );
          })}
          {(favorites ?? []).length === 0 && <p className="text-sm text-moss-400">Ingen favoritter endnu.</p>}
        </div>
      </div>
    </div>
  );
}
