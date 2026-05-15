'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/app', label: 'Hem', icon: '🏠' },
  { href: '/app/goals', label: 'Mål', icon: '🎯' },
  { href: '/app/focus', label: 'Fokus', icon: '⏱' },
  { href: '/app/progress', label: 'Stats', icon: '📊' },
  { href: '/app/coach', label: 'Coach', icon: '🤖' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-cream border-t border-cream-dark flex justify-around py-2 z-50">
      {NAV.map(({ href, label, icon }) => {
        const active = href === '/app' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center text-xs gap-0.5 px-3 py-1 rounded-lg transition-colors ${active ? 'text-earth font-bold' : 'text-earth-light'}`}
          >
            <span className="text-xl" aria-hidden="true">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
