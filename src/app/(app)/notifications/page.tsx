import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PreferencesPanel } from '@/components/Notifications/PreferencesPanel';
import { markAllNotificationsRead } from '@/lib/actions/notifications';
import type { Notification } from '@/lib/types';

export const dynamic = 'force-dynamic';

function describe(
  n: Notification,
  usernames: Map<string, string>,
  benchNames: Map<string, string>
): { text: string; href: string } {
  const payload = n.payload as Record<string, string>;
  const benchName = payload.bench_id ? benchNames.get(payload.bench_id) ?? 'en bænk' : 'en bænk';
  const benchHref = payload.bench_id ? `/bench/${payload.bench_id}` : '/';

  switch (n.type) {
    case 'friend_request':
      return {
        text: `@${usernames.get(payload.requester_id) ?? 'nogen'} har sendt dig en venneanmodning.`,
        href: '/friends',
      };
    case 'friend_accepted':
      return {
        text: `@${usernames.get(payload.addressee_id) ?? 'nogen'} har accepteret din venneanmodning.`,
        href: '/friends',
      };
    case 'bench_shared':
      return {
        text: `@${usernames.get(payload.from_user_id) ?? 'en ven'} har delt "${benchName}" med dig.`,
        href: benchHref,
      };
    case 'nearby_friend_checkin':
      return {
        text: `@${usernames.get(payload.friend_id) ?? 'en ven'} er checket ind på "${benchName}".`,
        href: benchHref,
      };
    case 'new_review':
    case 'new_rating':
      return {
        text: `Din bænk "${benchName}" har fået en ny anmeldelse.`,
        href: benchHref,
      };
    default:
      return { text: 'Ny notifikation', href: '/' };
  }
}

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: notifications }, { data: profile }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ]);

  const userIds = new Set<string>();
  const benchIds = new Set<string>();
  for (const n of notifications ?? []) {
    const p = n.payload as Record<string, string>;
    ['requester_id', 'addressee_id', 'from_user_id', 'friend_id', 'reviewer_id'].forEach((k) => {
      if (p[k]) userIds.add(p[k]);
    });
    if (p.bench_id) benchIds.add(p.bench_id);
  }

  const [{ data: profiles }, { data: benches }] = await Promise.all([
    userIds.size
      ? supabase.from('profiles').select('id, username').in('id', Array.from(userIds))
      : Promise.resolve({ data: [] as { id: string; username: string }[] }),
    benchIds.size
      ? supabase.from('benches').select('id, name').in('id', Array.from(benchIds))
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const usernames = new Map((profiles ?? []).map((p) => [p.id, p.username]));
  const benchNames = new Map((benches ?? []).map((b) => [b.id, b.name]));

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-moss-900">Notifikationer</h1>
        <form action={markAllNotificationsRead}>
          <button className="text-sm font-semibold text-moss-500">Markér alle som læst</button>
        </form>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        {(notifications ?? []).map((n) => {
          const { text, href } = describe(n as Notification, usernames, benchNames);
          return (
            <Link
              key={n.id}
              href={href}
              className={`card p-3 text-sm ${n.read ? 'text-moss-500' : 'font-semibold text-moss-900'}`}
            >
              {text}
            </Link>
          );
        })}
        {(notifications ?? []).length === 0 && (
          <p className="text-sm text-moss-400">Ingen notifikationer endnu.</p>
        )}
      </div>

      {profile && (
        <PreferencesPanel
          initial={{
            notify_friend_requests: profile.notify_friend_requests,
            notify_nearby_friend_checkins: profile.notify_nearby_friend_checkins,
            notify_bench_reviews: profile.notify_bench_reviews,
            notify_shares: profile.notify_shares,
          }}
        />
      )}
    </div>
  );
}
