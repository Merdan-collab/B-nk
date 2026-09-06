export function BenchLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="14" fill="#3c6642" />
      <path
        d="M10 22h28a2 2 0 0 1 2 2 2 2 0 0 1-2 2H10a2 2 0 0 1-2-2 2 2 0 0 1 2-2Z"
        fill="#f3ede1"
      />
      <path
        d="M10 28h28a2 2 0 0 1 2 2 2 2 0 0 1-2 2H10a2 2 0 0 1-2-2 2 2 0 0 1 2-2Z"
        fill="#f3ede1"
      />
      <rect x="10" y="32" width="3.5" height="8" rx="1.5" fill="#f3ede1" />
      <rect x="34.5" y="32" width="3.5" height="8" rx="1.5" fill="#f3ede1" />
      <rect x="10" y="14" width="3.5" height="8" rx="1.5" fill="#f3ede1" />
      <rect x="34.5" y="14" width="3.5" height="8" rx="1.5" fill="#f3ede1" />
    </svg>
  );
}
