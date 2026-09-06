'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleFavorite(benchId: string): Promise<{ ok: boolean; favorited?: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('bench_id', benchId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('id', existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/bench/${benchId}`);
    return { ok: true, favorited: false };
  }

  const { error } = await supabase.from('favorites').insert({ user_id: user.id, bench_id: benchId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/bench/${benchId}`);
  return { ok: true, favorited: true };
}
