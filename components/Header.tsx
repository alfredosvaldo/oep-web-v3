'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoLockup } from '@/components/Logo';

const NAV = [
  { href: '/mapa/', label: 'Mapa' },
  { href: '/perfiles/', label: 'Actores y territorio' },
  { href: '/comparar/', label: 'Comparar' },
  { href: '/informes/', label: 'Informes' },
  { href: '/datos-metodologia/', label: 'Datos y metodología' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-oep-line bg-oep-paper text-oep-ink">
      <div className="relative mx-auto flex h-14 max-w-content items-center gap-6 px-6 lg:px-10">
        <Link href="/" className="shrink-0" aria-label="OEP · Inicio">
          <LogoLockup />
        </Link>
        {/* Siete secciones + lockup + metadata no caben en 1024: la nav
            completa aparece desde xl, abajo manda el menú <details>. */}
        <nav aria-label="Navegación principal" className="ml-auto hidden items-center gap-5 xl:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href === '/mapa/' && pathname === '/explorador/') || (item.href === '/comparar/' && pathname === '/rankings/');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap border-b-2 py-4 text-[14px] font-medium transition-colors duration-nav ${
                  active ? 'border-oep-ink text-oep-ink' : 'border-transparent text-oep-ink/60 hover:text-oep-ink'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <span className="hidden whitespace-nowrap font-mono text-[11px] tracking-wide text-oep-ink/55 xl:inline">
          1993–2026 · T2
        </span>

        {/* Menú compacto: sin librería, <details> nativo */}
        <details className="ml-auto xl:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-oep-line px-3 py-1.5 text-[13px] font-medium">
            Menú
          </summary>
          <nav
            aria-label="Navegación principal"
            className="absolute inset-x-0 top-14 z-50 border-b border-oep-line bg-oep-paper px-6 py-3 shadow-sm"
          >
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? 'page' : undefined}
                    className={`block py-2 text-[15px] font-medium ${
                      pathname === item.href ? 'text-oep-ink' : 'text-oep-ink/65'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
