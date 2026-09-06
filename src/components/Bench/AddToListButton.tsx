'use client';

import { useEffect, useState } from 'react';
import { addBenchToList, getMyLists } from '@/lib/actions/lists';

export function AddToListButton({ benchId }: { benchId: string }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<{ id: string; name: string }[] | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && lists === null) {
      getMyLists().then(setLists);
    }
  }, [open, lists]);

  async function handleAdd(listId: string) {
    const result = await addBenchToList(listId, benchId);
    if (result.ok) setAddedTo((prev) => new Set(prev).add(listId));
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
        📋 Gem i liste
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setOpen(false)}>
          <div className="safe-bottom w-full rounded-t-3xl bg-white p-5 shadow-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold text-moss-900">Gem i liste</h3>
            <div className="flex flex-col gap-2">
              {(lists ?? []).map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleAdd(list.id)}
                  disabled={addedTo.has(list.id)}
                  className="card flex items-center justify-between p-3 text-sm font-semibold text-moss-800"
                >
                  {list.name}
                  <span className="text-xs text-moss-400">{addedTo.has(list.id) ? 'Tilføjet ✓' : 'Tilføj'}</span>
                </button>
              ))}
              {lists !== null && lists.length === 0 && (
                <p className="text-sm text-moss-400">Du har ingen lister endnu. Opret en på din profil.</p>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="btn-secondary mt-4 w-full">
              Luk
            </button>
          </div>
        </div>
      )}
    </>
  );
}
