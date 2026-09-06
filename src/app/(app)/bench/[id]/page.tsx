import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RatingStars, RatingBar } from '@/components/Bench/RatingStars';
import { RatingForm } from '@/components/Bench/RatingForm';
import { ReviewForm } from '@/components/Bench/ReviewForm';
import { PhotoGallery } from '@/components/Bench/PhotoGallery';
import { PhotoUploader } from '@/components/PhotoUploader';
import { FavoriteButton } from '@/components/Bench/FavoriteButton';
import { ShareButton } from '@/components/Bench/ShareButton';
import { ActiveCheckins } from '@/components/Bench/ActiveCheckins';
import { AddToListButton } from '@/components/Bench/AddToListButton';
import { CheckInButton } from '@/components/CheckInButton';
import type { Photo, Review, Rating, Checkin } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function BenchProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: bench } = await supabase
    .from('benches_geo')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!bench) notFound();

  const [
    { data: reviews },
    { data: photos },
    { data: myRating },
    { data: myFavorite },
    { data: activeCheckins },
    { data: myFriendships },
  ] = await Promise.all([
    supabase
      .from('reviews')
      .select('*, profiles(*)')
      .eq('bench_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('photos')
      .select('*, profiles(*)')
      .eq('bench_id', params.id)
      .order('created_at', { ascending: false }),
    supabase.from('ratings').select('*').eq('bench_id', params.id).eq('user_id', user.id).maybeSingle(),
    supabase.from('favorites').select('id').eq('bench_id', params.id).eq('user_id', user.id).maybeSingle(),
    supabase
      .from('checkins')
      .select('*, profiles(*)')
      .eq('bench_id', params.id)
      .eq('active', true),
    supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
  ]);

  const friendIds = (myFriendships ?? []).map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  const photoIds = (photos ?? []).map((p: Photo) => p.id);
  const { data: myLikes } = photoIds.length
    ? await supabase.from('photo_likes').select('photo_id').eq('user_id', user.id).in('photo_id', photoIds)
    : { data: [] as { photo_id: string }[] };

  let friendsVisited: { id: string; username: string; avatar_url: string | null }[] = [];
  if (friendIds.length > 0) {
    const { data: friendRatings } = await supabase
      .from('ratings')
      .select('profiles(id, username, avatar_url)')
      .eq('bench_id', params.id)
      .in('user_id', friendIds);
    const seen = new Map<string, { id: string; username: string; avatar_url: string | null }>();
    for (const row of friendRatings ?? []) {
      const p = row.profiles as unknown as { id: string; username: string; avatar_url: string | null } | null;
      if (p) seen.set(p.id, p);
    }
    friendsVisited = Array.from(seen.values());
  }

  const likedPhotoIds = new Set((myLikes ?? []).map((l) => l.photo_id));

  return (
    <div className="pb-8">
      <div className="relative">
        <div className="p-3">
          <PhotoGallery
            benchId={bench.id}
            photos={(photos ?? []) as Photo[]}
            likedPhotoIds={likedPhotoIds}
          />
        </div>
        <div className="absolute right-5 top-5 flex gap-2">
          <ShareButton benchId={bench.id} benchName={bench.name} />
          <FavoriteButton benchId={bench.id} initialFavorited={!!myFavorite} />
        </div>
        <Link href="/" className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-card">
          ←
        </Link>
      </div>

      <div className="px-4">
        <h1 className="text-2xl font-extrabold text-moss-900">{bench.name}</h1>
        <p className="text-sm text-moss-500">
          {bench.address ?? `${bench.latitude.toFixed(5)}, ${bench.longitude.toFixed(5)}`}
          {bench.district && ` · ${bench.district}`}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <RatingStars value={bench.average_rating} size="lg" />
          <span className="font-bold text-moss-900">{bench.average_rating.toFixed(1)}</span>
          <span className="text-sm text-moss-400">({bench.rating_count} ratings)</span>
        </div>

        {bench.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bench.tags.map((tag: string) => (
              <span key={tag} className="pill">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {bench.description && <p className="mt-3 text-sm text-moss-700">{bench.description}</p>}

        <div className="mt-4 flex gap-2">
          <div className="flex-1">
            <CheckInButton
              benchId={bench.id}
              trigger={<span className="btn-primary w-full">Jeg er her 🪑</span>}
            />
          </div>
          <div className="flex-1">
            <AddToListButton benchId={bench.id} />
          </div>
        </div>

        <div className="mt-5">
          <ActiveCheckins benchId={bench.id} initial={(activeCheckins ?? []) as Checkin[]} />
        </div>

        {friendsVisited.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-moss-700">Venner der har været her</p>
            <div className="flex flex-wrap gap-2">
              {friendsVisited.map((f) => (
                <span key={f.id} className="pill">
                  @{f.username}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-1.5">
          <p className="mb-1 text-sm font-semibold text-moss-700">Detaljeret bedømmelse</p>
          <RatingBar label="Udsigt" value={bench.avg_view} />
          <RatingBar label="Komfort" value={bench.avg_comfort} />
          <RatingBar label="Hygge" value={bench.avg_coziness} />
          <RatingBar label="Ro" value={bench.avg_quiet} />
          <RatingBar label="Sol" value={bench.avg_sun} />
          <RatingBar label="Beliggenhed" value={bench.avg_location_score} />
        </div>

        <div className="mt-6">
          <RatingForm benchId={bench.id} existing={myRating as Rating | null} />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-moss-700">Billeder</p>
          <PhotoUploader benchId={bench.id} userId={user.id} />
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-moss-700">Anmeldelser</p>
          <ReviewForm benchId={bench.id} />
          <div className="mt-4 flex flex-col gap-3">
            {(reviews ?? []).map((review: Review) => (
              <div key={review.id} className="card p-3">
                <p className="text-sm font-semibold text-moss-800">
                  @{review.profiles?.username ?? 'ukendt'}
                </p>
                <p className="mt-1 text-sm text-moss-600">{review.body}</p>
              </div>
            ))}
            {(reviews ?? []).length === 0 && (
              <p className="text-sm text-moss-400">Ingen anmeldelser endnu.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
