import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const minRating = Number(searchParams.get('minRating') ?? 0);
  const minSun = Number(searchParams.get('minSun') ?? 0);
  const minView = Number(searchParams.get('minView') ?? 0);
  const minComfort = Number(searchParams.get('minComfort') ?? 0);
  const onlyFavorites = searchParams.get('onlyFavorites') === '1';
  const onlyActiveCheckins = searchParams.get('onlyActiveCheckins') === '1';

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let benchIdFilter: string[] | null = null;

  if (onlyFavorites && user) {
    const { data } = await supabase.from('favorites').select('bench_id').eq('user_id', user.id);
    benchIdFilter = (data ?? []).map((f) => f.bench_id);
    if (benchIdFilter.length === 0) return NextResponse.json({ benches: [] });
  }

  if (onlyActiveCheckins) {
    const { data } = await supabase.from('checkins').select('bench_id').eq('active', true);
    const ids = Array.from(new Set((data ?? []).map((c) => c.bench_id)));
    benchIdFilter = benchIdFilter ? benchIdFilter.filter((id) => ids.includes(id)) : ids;
    if (benchIdFilter.length === 0) return NextResponse.json({ benches: [] });
  }

  let query = supabase
    .from('benches_geo')
    .select('id, name, district, average_rating, rating_count, avg_sun, avg_view, avg_comfort')
    .gte('average_rating', minRating)
    .gte('avg_sun', minSun)
    .gte('avg_view', minView)
    .gte('avg_comfort', minComfort)
    .order('average_rating', { ascending: false })
    .limit(50);

  if (q) {
    query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%,district.ilike.%${q}%`);
  }

  if (benchIdFilter) {
    query = query.in('id', benchIdFilter);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ benches: data ?? [] });
}
