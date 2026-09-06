import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { FriendSearch } from '@/components/Friends/FriendSearch';
import { FriendRequestItem } from '@/components/Friends/FriendRequestItem';
import { NotificationsBell } from '@/components/NotificationsBell';

export const dynamic = 'force-dynamic';

export default async function FriendsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: incoming }, { data: friendships }, { data: friendsOnBenches }] = await Promise.all([
    supabase
      .from('friendships')
      .select('id, requester:profiles!friendships_requester_id_fkey(username)')
      .eq('addressee_id', user.id)
      .eq('status', 'pending'),
    supabase
      .from('friendships')
      .select(
        'id, requester_id, addressee_id, requester:profiles!friendships_requester_id_fkey(id, username), addressee:profiles!friendships_addressee_id_fkey(id, username)'
      )
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
    supabase
      .from('checkins')
      .select('id, bench_id, benches(name), profiles(username)')
      .eq('active', true)
      .neq('user_id', user.id),
  ]);

  const friends = (friendships ?? []).map((f) => {
    const other =
      (f.requester_id === user.id ? f.addressee : f.requester) as unknown as {
        id: string;
        username: string;
      };
    return { friendshipId: f.id, ...other };
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-moss-900">Venner</h1>
        <NotificationsBell variant="inline" />
      </div>

      <FriendSearch />

      {friendsOnBenches && friendsOnBenches.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-moss-700">Lige nu</p>
          <div className="flex flex-col gap-2">
            {friendsOnBenches.map((c) => (
              <Link
                key={c.id}
                href={`/bench/${c.bench_id}`}
                className="card flex items-center gap-2 p-3 text-sm"
              >
                🟢 <span className="font-semibold">@{(c.profiles as unknown as { username: string })?.username}</span>
                <span className="text-moss-400">er på</span>
                <span className="font-semibold">{(c.benches as unknown as { name: string })?.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {incoming && incoming.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-moss-700">Venneanmodninger</p>
          <div className="flex flex-col gap-2">
            {incoming.map((req) => (
              <FriendRequestItem
                key={req.id}
                friendshipId={req.id}
                username={(req.requester as unknown as { username: string })?.username ?? 'ukendt'}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-moss-700">Dine venner ({friends.length})</p>
        <div className="flex flex-col gap-2">
          {friends.map((f) => (
            <Link key={f.friendshipId} href={`/friends/${f.id}`} className="card p-3 text-sm font-semibold text-moss-800">
              @{f.username}
            </Link>
          ))}
          {friends.length === 0 && <p className="text-sm text-moss-400">Ingen venner endnu.</p>}
        </div>
      </div>
    </div>
  );
}
