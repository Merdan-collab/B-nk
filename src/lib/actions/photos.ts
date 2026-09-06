'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addPhotoRecord(benchId: string, storagePath: string, caption?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { error } = await supabase.from('photos').insert({
    bench_id: benchId,
    user_id: user.id,
    storage_path: storagePath,
    caption: caption?.trim() || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/bench/${benchId}`);
  return { ok: true };
}

export async function toggleLike(photoId: string, benchId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { data: existing } = await supabase
    .from('photo_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('photo_id', photoId)
    .maybeSingle();

  if (existing) {
    await supabase.from('photo_likes').delete().eq('id', existing.id);
  } else {
    await supabase.from('photo_likes').insert({ user_id: user.id, photo_id: photoId });
  }

  revalidatePath(`/bench/${benchId}`);
  return { ok: true };
}
