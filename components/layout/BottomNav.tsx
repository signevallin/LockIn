'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ─── Icons ──────────────────────────────────────────────────────────── */

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* chimney */}
      <path d="M15 5V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* roof */}
      <path d="M2.5 11L12 3.5L21.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* body */}
      <path
        d="M5 10v9.5A.5.5 0 005.5 20h4.5v-4.5a2 2 0 014 0V20h4.5a.5.5 0 00.5-.5V10"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  );
}

function FlagIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* pole */}
      <path d="M5 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* flag */}
      <path
        d="M5 4h12l-3 4.5L17 13H5V4z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function BarbellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* bar */}
      <path d="M7.5 12h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* left outer */}
      <path d="M3 9v6" stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" />
      {/* left inner */}
      <path d="M6 7.5v9" stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" />
      {/* right inner */}
      <path d="M18 7.5v9" stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" />
      {/* right outer */}
      <path d="M21 9v6" stroke="currentColor" strokeWidth={active ? '2.5' : '2'} strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* trend line */}
      <path
        d="M3 17l4.5-5 4 3L16 9l5-4"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* area fill */}
      {active && (
        <path
          d="M3 17l4.5-5 4 3L16 9l5-4V20H3z"
          fill="currentColor" fillOpacity="0.1"
        />
      )}
      {/* active dot at top */}
      {active && <circle cx="21" cy="5" r="2" fill="currentColor" />}
    </svg>
  );
}

function BowlIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* steam wisps */}
      <path d="M9 3c0 1-.8 1.5-.8 2.5S9 7 9 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity={active ? 1 : 0.6} />
      <path d="M13 2c0 1.2-1 1.8-1 3s1 1.8 1 1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity={active ? 1 : 0.6} />
      {/* bowl body */}
      <path
        d="M4 11h16a8 8 0 01-8 8 8 8 0 01-8-8z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
      />
      {/* rim */}
      <path d="M3 11h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* base */}
      <path d="M8.5 19.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Nav items ─────────────────────────────────────────────────────── */

const NAV = [
  { href: '/app',          label: 'Hem',   Icon: HomeIcon    },
  { href: '/app/goals',    label: 'Mål',   Icon: FlagIcon    },
  { href: '/app/gym',      label: 'Gym',   Icon: BarbellIcon },
  { href: '/app/progress', label: 'Stats', Icon: SparkIcon   },
  { href: '/app/kost',     label: 'Kost',  Icon: BowlIcon },
];

/* ─── Component ─────────────────────────────────────────────────────── */

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-end pb-safe"
      style={{
        background: 'linear-gradient(to top, #FCE6B7 85%, #FCE6B7cc)',
        boxShadow: '0 -1px 0 #f0d48e, 0 -8px 24px rgba(81,50,41,0.08)',
        paddingTop: '6px',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      }}
    >
      {NAV.map(({ href, label, Icon }) => {
        const active = href === '/app' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 transition-all duration-150"
            style={{ color: active ? '#513229' : '#7a5c54' }}
          >
            {/* icon container */}
            <span
              className="relative flex items-center justify-center"
              style={{
                width: 44,
                height: 36,
                borderRadius: 12,
                background: active ? 'rgba(81,50,41,0.09)' : 'transparent',
                transform: active ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 200ms cubic-bezier(.34,1.56,.64,1), background 150ms ease',
              }}
            >
              <Icon active={active} />
            </span>

            {/* label */}
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.04em',
                fontWeight: active ? 600 : 400,
                lineHeight: 1,
                opacity: active ? 1 : 0.75,
                transition: 'font-weight 150ms ease, opacity 150ms ease',
              }}
            >
              {label}
            </span>

            {/* active dot */}
            <span
              style={{
                width: active ? 16 : 4,
                height: 3,
                borderRadius: 999,
                background: '#f0d48e',
                marginTop: 2,
                opacity: active ? 1 : 0,
                transition: 'width 250ms cubic-bezier(.34,1.56,.64,1), opacity 200ms ease',
              }}
            />
          </Link>
        );
      })}
    </nav>
  );
}
