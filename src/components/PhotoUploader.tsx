'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { addPhotoRecord } from '@/lib/actions/photos';

export function PhotoUploader({ benchId, userId }: { benchId: string; userId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${benchId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('bench-photos').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const result = await addPhotoRecord(benchId, path);
    setUploading(false);

    if (!result.ok) {
      setError(result.error ?? 'Noget gik galt.');
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="btn-secondary"
      >
        {uploading ? 'Uploader…' : '📷 Tilføj billede'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
