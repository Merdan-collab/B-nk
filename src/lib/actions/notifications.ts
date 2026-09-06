'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  revalidatePath('/notifications');
}

export interface NotificationPreferences {
  notify_friend_requests: boolean;
  notify_nearby_friend_checkins: boolean;
  notify_bench_reviews: boolean;
  notify_shares: boolean;
}

export async function updateNotificationPreferences(prefs: Partial<NotificationPreferences>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false };

  await supabase.from('profiles').update(prefs).eq('id', user.id);
  revalidatePath('/notifications');
  return { ok: true };
}
