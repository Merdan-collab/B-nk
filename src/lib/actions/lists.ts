'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function getMyLists() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('lists')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return data ?? [];
}

export async function createList(name: string, sharedWithFriends: boolean) {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: 'Giv listen et navn.' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { error } = await supabase
    .from('lists')
    .insert({ user_id: user.id, name: trimmed, is_shared_with_friends: sharedWithFriends });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/profile');
  return { ok: true };
}

export async function addBenchToList(listId: string, benchId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('list_items').insert({ list_id: listId, bench_id: benchId });
  if (error) return { ok: false, error: 'Bænken er allerede på listen.' };

  revalidatePath('/profile');
  return { ok: true };
}

export async function removeBenchFromList(listId: string, benchId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('bench_id', benchId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/profile');
  return { ok: true };
}

export async function deleteList(listId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('lists').delete().eq('id', listId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/profile');
  return { ok: true };
}

export async function toggleListSharing(listId: string, sharedWithFriends: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from('lists')
    .update({ is_shared_with_friends: sharedWithFriends })
    .eq('id', listId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/profile');
  return { ok: true };
}
