import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publicPhotoUrl } from '@/lib/storage';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: bench, error } = await supabase
    .from('benches_geo')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !bench) {
    return NextResponse.json({ error: 'Bænk ikke fundet' }, { status: 404 });
  }

  const [{ data: photo }, { count: activeCheckins }] = await Promise.all([
    supabase
      .from('photos')
      .select('storage_path')
      .eq('bench_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('bench_id', params.id),
  ]);

  return NextResponse.json({
    bench: {
      id: bench.id,
      name: bench.name,
      description: bench.description,
      latitude: bench.latitude,
      longitude: bench.longitude,
      address: bench.address,
      district: bench.district,
      tags: bench.tags,
      verified: bench.verified,
      average_rating: bench.average_rating,
      rating_count: bench.rating_count,
      distance_meters: 0,
      cover_photo_url: photo ? publicPhotoUrl(photo.storage_path) : null,
      active_checkins: activeCheckins ?? 0,
    },
  });
}
