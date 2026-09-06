import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function NotificationsBell({ variant = 'fixed' }: { variant?: 'fixed' | 'inline' }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  return (
    <Link
      href="/notifications"
      className={
        variant === 'fixed'
          ? 'safe-top fixed left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-card'
          : 'relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-card'
      }
    >
      🔔
      {!!count && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
