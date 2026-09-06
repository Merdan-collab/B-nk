'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', emoji: '🗺', label: 'Kort' },
  { href: '/explore', emoji: '🔍', label: 'Udforsk' },
  { href: '/add', emoji: '➕', label: 'Tilføj' },
  { href: '/friends', emoji: '👥', label: 'Venner' },
  { href: '/profile', emoji: '👤', label: 'Profil' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-moss-100 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                  active ? 'text-moss-700' : 'text-moss-400'
                }`}
              >
                <span className={`text-xl leading-none ${active ? 'scale-110' : ''} transition`}>
                  {item.emoji}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
