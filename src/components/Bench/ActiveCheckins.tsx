'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Checkin } from '@/lib/types';

export function ActiveCheckins({ benchId, initial }: { benchId: string; initial: Checkin[] }) {
  const [checkins, setCheckins] = useState(initial);

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      const { data } = await supabase
        .from('checkins')
        .select('id, user_id, bench_id, checked_in_at, expires_at, visibility, active, profiles(id, username, display_name, avatar_url, bio, notify_friend_requests, notify_nearby_friend_checkins, notify_bench_reviews, notify_shares, created_at)')
        .eq('bench_id', benchId)
        .eq('active', true);
      if (data) setCheckins(data as unknown as Checkin[]);
    }

    const channel = supabase
      .channel(`bench-checkins-${benchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checkins', filter: `bench_id=eq.${benchId}` },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [benchId]);

  if (checkins.length === 0) {
    return <p className="text-sm text-moss-400">Ingen er checket ind lige nu.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-moss-700">🟢 {checkins.length} her nu</p>
      <div className="flex -space-x-2">
        {checkins.slice(0, 8).map((c) => (
          <div
            key={c.id}
            title={c.profiles?.username}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-moss-200 text-xs font-bold text-moss-700"
          >
            {c.profiles?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
        ))}
      </div>
    </div>
  );
}
