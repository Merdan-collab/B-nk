'use client';

import { useState } from 'react';
import { updateNotificationPreferences, type NotificationPreferences } from '@/lib/actions/notifications';

const OPTIONS: { key: keyof NotificationPreferences; label: string }[] = [
  { key: 'notify_friend_requests', label: 'Venneanmodninger' },
  { key: 'notify_nearby_friend_checkins', label: 'Venner der checker ind i nærheden' },
  { key: 'notify_bench_reviews', label: 'Nye anmeldelser på dine bænke' },
  { key: 'notify_shares', label: 'Delte bænke' },
];

export function PreferencesPanel({ initial }: { initial: NotificationPreferences }) {
  const [prefs, setPrefs] = useState(initial);

  async function toggle(key: keyof NotificationPreferences) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await updateNotificationPreferences({ [key]: next[key] });
  }

  return (
    <div className="card p-4">
      <p className="mb-3 text-sm font-semibold text-moss-700">Notifikationer (opt-in)</p>
      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => (
          <label key={opt.key} className="flex items-center justify-between text-sm text-moss-600">
            {opt.label}
            <input type="checkbox" checked={prefs[opt.key]} onChange={() => toggle(opt.key)} />
          </label>
        ))}
      </div>
    </div>
  );
}
