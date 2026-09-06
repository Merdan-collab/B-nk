'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { respondToFriendRequest } from '@/lib/actions/friends';

export function FriendRequestItem({
  friendshipId,
  username,
}: {
  friendshipId: string;
  username: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function respond(accept: boolean) {
    setBusy(true);
    await respondToFriendRequest(friendshipId, accept);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card flex items-center justify-between p-3">
      <p className="text-sm font-semibold text-moss-800">@{username}</p>
      <div className="flex gap-2">
        <button
          onClick={() => respond(true)}
          disabled={busy}
          className="rounded-full bg-moss-600 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Accepter
        </button>
        <button
          onClick={() => respond(false)}
          disabled={busy}
          className="rounded-full bg-moss-50 px-3 py-1.5 text-xs font-semibold text-moss-600"
        >
          Afvis
        </button>
      </div>
    </div>
  );
}
