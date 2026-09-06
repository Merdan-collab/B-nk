'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function submitReview(benchId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: 'Skriv noget først.' };
  if (trimmed.length > 2000) return { ok: false, error: 'Anmeldelsen er for lang.' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { error } = await supabase.from('reviews').insert({
    bench_id: benchId,
    user_id: user.id,
    body: trimmed,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/bench/${benchId}`);
  return { ok: true };
}
