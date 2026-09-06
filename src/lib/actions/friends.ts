'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function sendFriendRequest(addresseeId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };
  if (user.id === addresseeId) return { ok: false, error: 'Du kan ikke tilføje dig selv.' };

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: addresseeId });

  if (error) return { ok: false, error: 'Venneanmodning findes allerede.' };

  revalidatePath('/friends');
  return { ok: true };
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { error } = await supabase
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .eq('addressee_id', user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/friends');
  return { ok: true };
}

export async function removeFriend(friendshipId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/friends');
  return { ok: true };
}

export async function searchUsers(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${trimmed}%`)
    .neq('id', user?.id ?? '')
    .limit(20);

  return data ?? [];
}
