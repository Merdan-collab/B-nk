'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createList, deleteList, toggleListSharing } from '@/lib/actions/lists';

interface ListSummary {
  id: string;
  name: string;
  is_shared_with_friends: boolean;
  itemCount: number;
}

export function ListsManager({ lists }: { lists: ListSummary[] }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    await createList(name, false);
    setCreating(false);
    setName('');
    router.refresh();
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-moss-700">Mine lister</p>

      <div className="flex flex-col gap-2">
        {lists.map((list) => (
          <div key={list.id} className="card flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-semibold text-moss-800">{list.name}</p>
              <p className="text-xs text-moss-400">{list.itemCount} bænke</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-xs text-moss-500">
                <input
                  type="checkbox"
                  checked={list.is_shared_with_friends}
                  onChange={async (e) => {
                    await toggleListSharing(list.id, e.target.checked);
                    router.refresh();
                  }}
                />
                Del med venner
              </label>
              <button
                onClick={async () => {
                  await deleteList(list.id);
                  router.refresh();
                }}
                className="text-moss-300"
                aria-label="Slet liste"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
        {lists.length === 0 && <p className="text-sm text-moss-400">Ingen lister endnu.</p>}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ny liste, fx “Date-bænke”"
          className="flex-1 rounded-xl border border-moss-100 px-4 py-2.5 text-sm outline-none focus:border-moss-400"
        />
        <button onClick={handleCreate} disabled={creating} className="btn-primary px-4 text-sm">
          Opret
        </button>
      </div>
    </div>
  );
}
