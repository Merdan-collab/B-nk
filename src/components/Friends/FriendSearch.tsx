'use client';

import { useEffect, useState, useTransition } from 'react';
import { searchUsers, sendFriendRequest } from '@/lib/actions/friends';

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function FriendSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      startTransition(async () => {
        const data = await searchUsers(query);
        setResults(data as UserResult[]);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  async function handleSend(id: string) {
    setSentTo((prev) => new Set(prev).add(id));
    await sendFriendRequest(id);
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søg efter brugernavn…"
        className="w-full rounded-xl border border-moss-100 px-4 py-3 text-sm outline-none focus:border-moss-400"
      />

      {pending && <p className="mt-2 text-xs text-moss-400">Søger…</p>}

      <div className="mt-3 flex flex-col gap-2">
        {results.map((u) => (
          <div key={u.id} className="card flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-semibold text-moss-800">@{u.username}</p>
              {u.display_name && <p className="text-xs text-moss-400">{u.display_name}</p>}
            </div>
            <button
              onClick={() => handleSend(u.id)}
              disabled={sentTo.has(u.id)}
              className="rounded-full bg-moss-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {sentTo.has(u.id) ? 'Sendt' : 'Tilføj'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
