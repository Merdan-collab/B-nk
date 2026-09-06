export function RatingStars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  const rounded = Math.round(value);
  const textSize = size === 'lg' ? 'text-2xl' : 'text-sm';

  return (
    <span className={textSize} aria-label={`${value.toFixed(1)} ud af 5 stjerner`}>
      {'★'.repeat(rounded)}
      <span className="text-moss-200">{'★'.repeat(5 - rounded)}</span>
    </span>
  );
}

export function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 shrink-0 text-moss-500">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-moss-100">
        <div
          className="h-full rounded-full bg-moss-500"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-semibold text-moss-700">
        {value > 0 ? value.toFixed(1) : '–'}
      </span>
    </div>
  );
}
