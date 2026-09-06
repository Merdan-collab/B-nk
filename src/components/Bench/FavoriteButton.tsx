'use client';

import { useState, useTransition } from 'react';
import { toggleFavorite } from '@/lib/actions/favorites';

export function FavoriteButton({ benchId, initialFavorited }: { benchId: string; initialFavorited: boolean }) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setFavorited((f) => !f);
    startTransition(async () => {
      const result = await toggleFavorite(benchId);
      if (result.ok && typeof result.favorited === 'boolean') {
        setFavorited(result.favorited);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-xl shadow-card transition active:scale-90 ${
        favorited ? 'bg-red-50 text-red-500' : 'bg-white text-moss-300'
      }`}
      aria-label={favorited ? 'Fjern favorit' : 'Tilføj favorit'}
    >
      {favorited ? '❤️' : '🤍'}
    </button>
  );
}
