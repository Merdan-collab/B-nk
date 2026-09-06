'use server';

import { createClient } from '@/lib/supabase/server';

export async function shareBenchWithFriend(benchId: string, friendId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { data: friendProfile } = await supabase
    .from('profiles')
    .select('notify_shares')
    .eq('id', friendId)
    .single();

  if (friendProfile?.notify_shares) {
    const { error } = await supabase.from('notifications').insert({
      user_id: friendId,
      type: 'bench_shared',
      payload: { bench_id: benchId, from_user_id: user.id },
    });
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function getFriendsForSharing() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, requester:profiles!friendships_requester_id_fkey(id, username, avatar_url), addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_url)')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  return (data ?? []).map((f) => (f.requester_id === user.id ? f.addressee : f.requester));
}
