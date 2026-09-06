'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { DUPLICATE_BENCH_RADIUS_METERS } from '@/lib/geo';

export interface CreateBenchInput {
  name: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  district: string;
  tags: string[];
}

export async function checkNearbyDuplicates(lat: number, lng: number) {
  const supabase = createClient();
  const { data } = await supabase.rpc('benches_within', {
    center_lat: lat,
    center_lng: lng,
    radius_meters: DUPLICATE_BENCH_RADIUS_METERS,
  });
  return data ?? [];
}

export async function createBench(input: CreateBenchInput) {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Giv bænken et navn.' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { data: bench, error } = await supabase
    .rpc('create_bench', {
      p_name: name,
      p_description: input.description,
      p_lat: input.lat,
      p_lng: input.lng,
      p_address: input.address,
      p_district: input.district,
      p_tags: input.tags,
    })
    .single();

  if (error || !bench) {
    return { ok: false, error: error?.message ?? 'Kunne ikke oprette bænken.' };
  }

  revalidatePath('/');
  return { ok: true, benchId: (bench as { id: string }).id };
}
