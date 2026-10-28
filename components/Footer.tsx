import { Manrope } from 'next/font/google';
import { Logo } from '@/components/Logo';
import { CORTE } from '@/lib/corte';

const manrope = Manrope({ subsets: ['latin'], weight: '600' });

export default function Footer() {
  return (
    <footer className="border-t border-oep-line bg-[#E9EEEC] text-oep-ink">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        <div className="grid gap-10 py-14 md:grid-cols-3">
          <div>
            <Logo className="h-6 w-6" compact />
            <p className="mt-3 max-w-sm text-[14px] leading-6 text-oep-ink/70">
              Observatorio Económico de Permisos.
            </p>
          </div>
          <div className="text-[14px] leading-6">
            <p className="oep-label text-oep-ink/55">Fuente</p>
            <p className="mt-3 text-oep-ink/70">
              Servicio de Evaluación Ambiental (SEA): Sistema de Evaluación de Impacto Ambiental,
              presentaciones {CORTE.rango}.
            </p>
          </div>
          <a
            href="https://paribus.cl"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-4 text-[14px] leading-6 text-oep-ink/70 transition hover:text-oep-ink md:justify-end"
          >
            <span>
              Creado, diseñado y
              <br />
              desarrollado por:
            </span>
            <span aria-label="Paribus" className={`${manrope.className} inline-flex items-center gap-2.5 text-oep-ink`}>
              <svg viewBox="0 0 40 40" className="h-8 w-8 flex-none" aria-hidden="true">
                <rect x="1.5" y="1.5" width="37" height="37" fill="none" stroke="currentColor" strokeWidth="2.4" />
                <line x1="9" y1="31" x2="31" y2="9" stroke="currentColor" strokeWidth="3.84" />
                <circle cx="11.5" cy="20" r="2" fill="currentColor" />
                <circle cx="18" cy="29" r="2" fill="currentColor" />
                <circle cx="21" cy="12" r="2" fill="currentColor" />
                <circle cx="27" cy="22" r="2" fill="currentColor" />
                <circle cx="31.5" cy="16" r="2" fill="currentColor" />
              </svg>
              <span className="text-[26px] font-semibold leading-none tracking-[-0.02em]">paribus</span>
            </span>
          </a>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-oep-line py-5 font-mono text-[11px] text-oep-ink/60">
          <p>OEP · Observatorio Económico de Permisos — datos SEIA {CORTE.rango}</p>
          <p className="tabular">Última actualización: {CORTE.fecha}</p>
        </div>
      </div>
    </footer>
  );
}
