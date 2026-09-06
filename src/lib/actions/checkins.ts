'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { haversineDistanceMeters, CHECKIN_MAX_DISTANCE_METERS, CHECKIN_DURATION_MINUTES } from '@/lib/geo';
import type { Visibility } from '@/lib/types';

export interface CheckInResult {
  ok: boolean;
  error?: string;
}

export async function checkIn(
  benchId: string,
  userLat: number,
  userLng: number,
  visibility: Visibility = 'friends'
): Promise<CheckInResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Du skal være logget ind.' };
  }

  const { data: bench, error: benchError } = await supabase
    .from('benches_geo')
    .select('latitude, longitude')
    .eq('id', benchId)
    .single();

  if (benchError || !bench) {
    return { ok: false, error: 'Bænken blev ikke fundet.' };
  }

  const distance = haversineDistanceMeters(userLat, userLng, bench.latitude, bench.longitude);

  if (distance > CHECKIN_MAX_DISTANCE_METERS) {
    return {
      ok: false,
      error: `Du skal være tættere på bænken for at checke ind (${Math.round(distance)} m væk).`,
    };
  }

  await supabase
    .from('checkins')
    .update({ active: false })
    .eq('user_id', user.id)
    .eq('active', true);

  const expiresAt = new Date(Date.now() + CHECKIN_DURATION_MINUTES * 60_000).toISOString();

  const { error: insertError } = await supabase.from('checkins').insert({
    user_id: user.id,
    bench_id: benchId,
    visibility,
    expires_at: expiresAt,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  if (visibility !== 'private') {
    await notifyFriendsOfCheckin(user.id, benchId, visibility);
  }

  revalidatePath(`/bench/${benchId}`);
  revalidatePath('/');
  return { ok: true };
}

async function notifyFriendsOfCheckin(userId: string, benchId: string, visibility: Visibility) {
  const supabase = createClient();

  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  const friendIds = (friendships ?? []).map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  if (friendIds.length === 0) return;

  const { data: optedIn } = await supabase
    .from('profiles')
    .select('id')
    .in('id', friendIds)
    .eq('notify_nearby_friend_checkins', true);

  if (!optedIn || optedIn.length === 0) return;

  await supabase.from('notifications').insert(
    optedIn.map((p) => ({
      user_id: p.id,
      type: 'nearby_friend_checkin' as const,
      payload: { bench_id: benchId, friend_id: userId, visibility },
    }))
  );
}

export async function extendCheckIn(checkinId: string): Promise<CheckInResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const expiresAt = new Date(Date.now() + CHECKIN_DURATION_MINUTES * 60_000).toISOString();

  const { error } = await supabase
    .from('checkins')
    .update({ expires_at: expiresAt })
    .eq('id', checkinId)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function checkOut(checkinId: string): Promise<CheckInResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Du skal være logget ind.' };

  const { error } = await supabase
    .from('checkins')
    .update({ active: false })
    .eq('id', checkinId)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/');
  return { ok: true };
}
