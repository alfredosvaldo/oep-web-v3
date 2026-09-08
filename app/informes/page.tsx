import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Informes',
  description:
    'Análisis periódicos del OEP sobre la inversión evaluada en el SEIA: cierre de trimestres, sectores y territorios, con la metodología reproducible del observatorio.',
};

/**
 * Catálogo de informes publicados. Para dar de alta uno:
 * 1. Copia el PDF a public/informes/ (p. ej. public/informes/cierre-2026-t2.pdf).
 * 2. Agrega aquí la entrada con título, período, descripción y archivo.
 * La tarjeta destacada (destacado: true) abre la página.
 */
interface Informe {
  slug: string;
  titulo: string;
  periodo: string;
  descripcion: string;
  archivo: string;
  fecha: string;
  tags: string[];
  destacado?: boolean;
}

const INFORMES: Informe[] = [];

/** Fila de catálogo: regla fina y jerarquía tipográfica, sin tarjeta. */
function FilaInforme({ inf }: { inf: Informe }) {
  return (
    <a
      href={`/informes/${inf.archivo}`}
      className="group grid gap-x-8 gap-y-2 border-b border-oep-line py-6 transition-colors duration-nav hover:bg-oep-ink/5 md:grid-cols-[160px_1fr_auto]"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-oep-ink/55">
        {inf.periodo}
        <span className="ml-2 tabular text-oep-ink/40">{inf.fecha}</span>
      </p>
      <div className="min-w-0">
        <h3 className="oep-headline text-[21px] leading-7 group-hover:underline">{inf.titulo}</h3>
        <p className="mt-1 max-w-2xl text-[15px] leading-6 text-oep-ink/70">{inf.descripcion}</p>
        {inf.tags.length > 0 && (
          <p className="mt-2 font-mono text-[11px] text-oep-ink/45">{inf.tags.join(' · ')}</p>
        )}
      </div>
      <span className="self-center whitespace-nowrap font-mono text-[12px] text-oep-ink/60 transition-colors group-hover:text-oep-emerald">
        PDF ↗
      </span>
    </a>
  );
}

export default function Informes() {
  const destacado = INFORMES.find((i) => i.destacado);
  const resto = INFORMES.filter((i) => !i.destacado);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="mx-auto max-w-content px-6 py-12 lg:px-10 lg:py-16">
          <PageHeader kicker="Informes" titulo="Análisis periódicos del observatorio" meta="publicación trimestral">
            Cierres de trimestre, radiografías sectoriales y lecturas territoriales, escritos por el
            equipo del observatorio. Cada cifra sale del mismo pipeline reproducible que alimenta el
            resto del sitio.
          </PageHeader>

          {INFORMES.length === 0 ? (
            <div className="mt-10 border-t border-oep-line">
              <div className="max-w-2xl border-b border-oep-line py-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-oep-ink/55">
                  En preparación · publicación estimada octubre 2026
                </p>
                <h2 className="oep-headline mt-3 text-[26px] leading-8 lg:text-[30px] lg:leading-9">
                  Informe de cierre 2026-T2
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-oep-ink/70">
                  Qué se presentó, qué se aprobó, dónde se concentra la cartera y cuánto tardó el
                  sistema en calificar.
                </p>
              </div>

              <p className="oep-source mt-6">
                Los informes se distribuyen como PDF en esta misma sección; la{' '}
                <Link href="/datos-metodologia/" className="underline underline-offset-4 hover:text-oep-emerald">
                  metodología completa
                </Link>{' '}
                está publicada y es reproducible con los datos de origen.
              </p>
            </div>
          ) : (
            <div className="mt-10 border-t border-oep-line">
              {destacado && <FilaInforme inf={destacado} />}
              {resto.map((inf) => (
                <FilaInforme key={inf.slug} inf={inf} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
