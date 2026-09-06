'use client';

import { useState } from 'react';
import { checkIn } from '@/lib/actions/checkins';
import type { Visibility } from '@/lib/types';

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: 'private', label: 'Kun mig' },
  { value: 'friends', label: 'Mine venner' },
  { value: 'public', label: 'Alle' },
];

function CheckInSheet({
  benchId,
  onClose,
  onDone,
}: {
  benchId: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCheckIn() {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Din browser understøtter ikke GPS.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await checkIn(
          benchId,
          position.coords.latitude,
          position.coords.longitude,
          visibility
        );
        setLoading(false);
        if (result.ok) {
          onDone?.();
          onClose();
        } else {
          setError(result.error ?? 'Noget gik galt.');
        }
      },
      () => {
        setError('Kunne ikke hente din placering. Tillad venligst GPS.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="safe-bottom w-full rounded-t-3xl bg-white p-5 shadow-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-bold text-moss-900">Jeg er her 🪑</h3>
        <p className="mb-4 text-sm text-moss-500">
          Vi tjekker at du er inden for 50 meter af bænken. Check-in udløber automatisk efter 60
          minutter.
        </p>

        <p className="mb-2 text-sm font-semibold text-moss-700">Hvem kan se det?</p>
        <div className="mb-4 flex gap-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setVisibility(opt.value)}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
                visibility === opt.value ? 'bg-moss-600 text-white' : 'bg-moss-50 text-moss-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button onClick={handleCheckIn} disabled={loading} className="btn-primary w-full">
          {loading ? 'Tjekker placering…' : 'Jeg er her'}
        </button>
      </div>
    </div>
  );
}

/** Uncontrolled: renders its own trigger button and manages the sheet's open state. */
export function CheckInButton({
  benchId,
  onDone,
  trigger,
}: {
  benchId: string;
  onDone?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="w-full"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {trigger ?? 'Check ind'}
      </button>

      {open && <CheckInSheet benchId={benchId} onClose={() => setOpen(false)} onDone={onDone} />}
    </>
  );
}

/** Controlled: parent decides when the sheet is open (e.g. after tapping "Check ind" on the map preview). */
export function ControlledCheckInSheet({
  benchId,
  open,
  onOpenChange,
  onDone,
}: {
  benchId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  if (!open || !benchId) return null;

  return (
    <CheckInSheet benchId={benchId} onClose={() => onOpenChange(false)} onDone={onDone} />
  );
}
