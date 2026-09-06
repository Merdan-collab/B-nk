'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface RatingInput {
  overall: number;
  view?: number;
  comfort?: number;
  coziness?: number;
  quiet?: number;
  sun?: number;
  location_score?: number;
}

export async function submitRating(benchId: string, input: RatingInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { error } = await supabase.from('ratings').upsert(
    {
      bench_id: benchId,
      user_id: user.id,
      overall: input.overall,
      view: input.view ?? null,
      comfort: input.comfort ?? null,
      coziness: input.coziness ?? null,
      quiet: input.quiet ?? null,
      sun: input.sun ?? null,
      location_score: input.location_score ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'bench_id,user_id' }
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/bench/${benchId}`);
  return { ok: true };
}
