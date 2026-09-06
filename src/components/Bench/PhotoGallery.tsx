'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleLike } from '@/lib/actions/photos';
import { publicPhotoUrl } from '@/lib/storage';
import type { Photo } from '@/lib/types';

export function PhotoGallery({
  benchId,
  photos,
  likedPhotoIds,
}: {
  benchId: string;
  photos: Photo[];
  likedPhotoIds: Set<string>;
}) {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  if (photos.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl2 bg-moss-100 text-5xl">
        🪑
      </div>
    );
  }

  const photo = photos[index];
  const liked = likedPhotoIds.has(photo.id);

  async function handleLike() {
    await toggleLike(photo.id, benchId);
    router.refresh();
  }

  return (
    <div>
      <div className="relative h-64 w-full overflow-hidden rounded-xl2 bg-moss-100">
        <Image
          src={publicPhotoUrl(photo.storage_path)}
          alt={photo.caption ?? 'Bænkebillede'}
          fill
          sizes="512px"
          className="object-cover"
        />
        <button
          onClick={handleLike}
          className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold shadow-card"
        >
          {liked ? '❤️' : '🤍'} {photo.like_count}
        </button>
        {photo.profiles?.username && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-moss-700">
            @{photo.profiles.username}
          </span>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIndex(i)}
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ${
                i === index ? 'ring-2 ring-moss-600' : 'opacity-70'
              }`}
            >
              <Image src={publicPhotoUrl(p.storage_path)} alt="" fill sizes="48px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
