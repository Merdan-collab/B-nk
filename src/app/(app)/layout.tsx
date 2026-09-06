import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/BottomNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-sand-50">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
