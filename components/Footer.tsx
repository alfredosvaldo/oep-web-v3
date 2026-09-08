import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-oep-line bg-oep-paper text-oep-ink">
      <div className="mx-auto max-w-content px-6 lg:px-10">
        <div className="grid gap-10 py-14 md:grid-cols-3">
          <div>
            <Logo className="h-6 w-6" compact />
            <p className="mt-3 max-w-sm text-[14px] leading-6 text-oep-ink/70">
              Observatorio Económico de Permisos: spin-off universitario independiente. No recibe
              financiamiento de organismos evaluados ni de titulares de proyectos.
            </p>
          </div>
          <div className="text-[14px] leading-6">
            <p className="oep-label text-oep-ink/55">Fuente</p>
            <p className="mt-3 text-oep-ink/70">
              Servicio de Evaluación Ambiental (SEA): Sistema de Evaluación de Impacto Ambiental,
              presentaciones 1993–2026-T2.
            </p>
          </div>
          <div className="text-[14px] leading-6">
            <p className="oep-label text-oep-ink/55">Metodología</p>
            <p className="mt-3 text-oep-ink/70">
              Reglas de limpieza, diccionario de datos y pipeline reproducible, publicados en detalle.
            </p>
            <Link
              href="/datos-metodologia/"
              className="mt-2 inline-block text-[14px] font-semibold text-oep-ink underline decoration-oep-line underline-offset-4 hover:text-oep-emerald"
            >
              Ver metodología →
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-oep-line py-5 font-mono text-[11px] text-oep-ink/50">
          <p>OEP · Observatorio Económico de Permisos — datos SEIA 1993–2026-T2</p>
          <p className="tabular">Última actualización: 30.06.2026</p>
        </div>
      </div>
    </footer>
  );
}
