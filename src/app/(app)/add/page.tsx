'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LocationPicker } from '@/components/Add/LocationPicker';
import { StarPicker } from '@/components/StarPicker';
import { BENCH_TAGS } from '@/lib/constants';
import { checkNearbyDuplicates, createBench } from '@/lib/actions/benches';
import { submitRating } from '@/lib/actions/ratings';
import { addPhotoRecord } from '@/lib/actions/photos';
import { createClient } from '@/lib/supabase/client';

type Step = 'location' | 'photo' | 'details' | 'tags' | 'rating';

const STEP_ORDER: Step[] = ['location', 'photo', 'details', 'tags', 'rating'];

interface DuplicateBench {
  id: string;
  name: string;
}

export default function AddBenchPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateBench[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = STEP_ORDER[stepIndex];

  async function goNext() {
    setError(null);

    if (step === 'location') {
      if (!position) {
        setError('Vælg en placering.');
        return;
      }
      setCheckingDuplicates(true);
      const nearby = await checkNearbyDuplicates(position.lat, position.lng);
      setCheckingDuplicates(false);
      setDuplicates(nearby as DuplicateBench[]);
      if ((nearby as DuplicateBench[]).length > 0) return; // show warning, user must confirm to proceed
    }

    if (step === 'details' && !name.trim()) {
      setError('Giv bænken et navn.');
      return;
    }

    if (step === 'rating') {
      await handleSubmit();
      return;
    }

    setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
  }

  function confirmDespiteDuplicates() {
    setDuplicates([]);
    setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
  }

  function handleGoBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handlePhotoSelected(file: File) {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!position) return;
    setSubmitting(true);
    setError(null);

    const result = await createBench({
      name,
      description,
      lat: position.lat,
      lng: position.lng,
      address,
      district: '',
      tags,
    });

    if (!result.ok || !result.benchId) {
      setSubmitting(false);
      setError(result.error ?? 'Noget gik galt.');
      return;
    }

    const benchId = result.benchId;

    if (rating > 0) {
      await submitRating(benchId, { overall: rating });
    }

    if (photoFile) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const ext = photoFile.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/${benchId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('bench-photos')
          .upload(path, photoFile, { contentType: photoFile.type });
        if (!uploadError) {
          await addPhotoRecord(benchId, path);
        }
      }
    }

    setSubmitting(false);
    router.push(`/bench/${benchId}`);
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        {STEP_ORDER.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-moss-600' : 'bg-moss-100'}`}
          />
        ))}
      </div>

      <h1 className="mb-4 text-xl font-extrabold text-moss-900">+ Tilføj bænk</h1>

      {step === 'location' && (
        <div>
          <p className="mb-2 text-sm text-moss-500">Flyt kortet, så pinden peger på bænken.</p>
          <LocationPicker onChange={setPosition} />

          {duplicates.length > 0 && (
            <div className="mt-4 rounded-xl2 bg-amber-50 p-4">
              <p className="mb-2 text-sm font-semibold text-amber-800">
                Der findes allerede en bænk meget tæt på ({duplicates.length}):
              </p>
              <ul className="mb-3 list-inside list-disc text-sm text-amber-700">
                {duplicates.map((d) => (
                  <li key={d.id}>{d.name}</li>
                ))}
              </ul>
              <button onClick={confirmDespiteDuplicates} className="btn-secondary w-full text-sm">
                Tilføj alligevel
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'photo' && (
        <div>
          <p className="mb-3 text-sm text-moss-500">Tag eller upload et billede af bænken.</p>
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" className="h-56 w-full rounded-xl2 object-cover" />
          ) : (
            <label className="flex h-56 w-full cursor-pointer items-center justify-center rounded-xl2 border-2 border-dashed border-moss-200 text-4xl">
              📷
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoSelected(file);
                }}
              />
            </label>
          )}
        </div>
      )}

      {step === 'details' && (
        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bænkens navn"
            className="rounded-xl border border-moss-100 px-4 py-3 text-sm outline-none focus:border-moss-400"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse (valgfrit)"
            className="rounded-xl border border-moss-100 px-4 py-3 text-sm outline-none focus:border-moss-400"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kort beskrivelse (valgfrit)"
            rows={3}
            className="rounded-xl border border-moss-100 p-3 text-sm outline-none focus:border-moss-400"
          />
        </div>
      )}

      {step === 'tags' && (
        <div className="flex flex-wrap gap-2">
          {BENCH_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() =>
                  setTags((t) => (active ? t.filter((x) => x !== tag) : [...t, tag]))
                }
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  active ? 'bg-moss-600 text-white' : 'bg-moss-50 text-moss-600'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {step === 'rating' && (
        <div>
          <p className="mb-3 text-sm text-moss-500">Giv bænken en stjernebedømmelse.</p>
          <StarPicker value={rating} onChange={setRating} />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex gap-2">
        {stepIndex > 0 && (
          <button onClick={handleGoBack} className="btn-secondary flex-1">
            Tilbage
          </button>
        )}
        <button
          onClick={goNext}
          disabled={checkingDuplicates || submitting || (step === 'location' && duplicates.length > 0)}
          className="btn-primary flex-1"
        >
          {checkingDuplicates
            ? 'Tjekker…'
            : submitting
              ? 'Opretter…'
              : step === 'rating'
                ? 'Send'
                : 'Næste'}
        </button>
      </div>
    </div>
  );
}
