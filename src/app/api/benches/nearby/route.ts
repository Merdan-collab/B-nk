import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publicPhotoUrl } from '@/lib/storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const radius = Number(searchParams.get('radius') ?? 3000);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat/lng required' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: benches, error } = await supabase.rpc('nearby_benches', {
    center_lat: lat,
    center_lng: lng,
    radius_meters: Math.min(radius, 20000),
    max_results: 300,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const benchIds = (benches ?? []).map((b: { id: string }) => b.id);

  const [{ data: photos }, { data: activeCheckins }] = await Promise.all([
    benchIds.length
      ? supabase
          .from('photos')
          .select('bench_id, storage_path, created_at')
          .in('bench_id', benchIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as { bench_id: string; storage_path: string }[] }),
    benchIds.length
      ? supabase.from('checkins').select('bench_id').in('bench_id', benchIds)
      : Promise.resolve({ data: [] as { bench_id: string }[] }),
  ]);

  const coverPhotoByBench = new Map<string, string>();
  for (const photo of photos ?? []) {
    if (!coverPhotoByBench.has(photo.bench_id)) {
      coverPhotoByBench.set(photo.bench_id, publicPhotoUrl(photo.storage_path));
    }
  }

  const checkinCountByBench = new Map<string, number>();
  for (const row of activeCheckins ?? []) {
    checkinCountByBench.set(row.bench_id, (checkinCountByBench.get(row.bench_id) ?? 0) + 1);
  }

  const enriched = (benches ?? []).map((bench: { id: string }) => ({
    ...bench,
    cover_photo_url: coverPhotoByBench.get(bench.id) ?? null,
    active_checkins: checkinCountByBench.get(bench.id) ?? 0,
  }));

  return NextResponse.json({ benches: enriched });
}
