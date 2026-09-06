'use client';

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl leading-none ${n <= value ? 'text-moss-600' : 'text-moss-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
