'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import { fetchAgg, type AggItem } from '@/lib/kpis';
import { fmtInt, fmtMM } from '@/lib/format';

function EditorialList({ items, prefix, numbered = true }: { items: AggItem[]; prefix: string; numbered?: boolean }) {
  return (
    <ol className="grid gap-x-12 sm:grid-cols-2">
      {items.map((it, i) => (
        <li key={it.slug}>
          <Link
            href={`/perfiles/${prefix}${it.slug}/`}
            className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 border-b border-oep-line px-2 py-3.5 transition-colors duration-nav hover:bg-oep-ink/5"
          >
            <span className="w-8 font-mono text-[11px] tabular text-oep-ink/40">
              {numbered ? String(i + 1).padStart(2, '0') : '·'}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[16px] font-medium tracking-tight group-hover:underline">
                {it.nombre}
              </span>
              <span className="mt-0.5 block font-mono text-[11px] tabular text-oep-ink/55">
                {fmtInt(it.proyectos)} proyectos · US$ {fmtMM(it.inversion_mmu)} MM
              </span>
            </span>
            <span className="font-mono text-[12px] text-oep-ink/40">→</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <h2 className="oep-headline text-[26px] leading-8 lg:text-[30px] lg:leading-9">{titulo}</h2>
        {descripcion && <p className="max-w-xl text-[14px] leading-6 text-oep-ink/65">{descripcion}</p>}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function ActoresYTerritorio() {
  const [regiones, setRegiones] = useState<AggItem[] | null>(null);
  const [sectores, setSectores] = useState<AggItem[] | null>(null);
  const [titulares, setTitulares] = useState<AggItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAgg('region'), fetchAgg('sector'), fetchAgg('titular')])
      .then(([r, s, t]) => {
        setRegiones(r.items);
        setSectores(s.items);
        setTitulares(t.items.slice(0, 12));
      })
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="mx-auto max-w-content space-y-16 px-6 py-16 lg:px-10 lg:py-20">
          <PageHeader kicker="Actores y territorio" titulo="Quién presenta, dónde y en qué">
            Tres cortes del mismo registro: las regiones donde se instala la inversión, los sectores
            que la ejecutan y los titulares que firman los expedientes. Cada ficha cruza la serie
            anual, los principales actores y los proyectos recientes.
          </PageHeader>

          {error && (
            <p role="alert" className="border border-oep-copper bg-oep-copper/5 p-4 text-[14px] text-oep-copper-dark">
              No se pudieron cargar los datos: {error}
            </p>
          )}

          {!regiones && !error && (
            <div className="flex h-48 items-center justify-center border border-oep-line">
              <p className="font-mono text-[12px] text-oep-ink/55">Cargando el índice…</p>
            </div>
          )}

          {regiones && (
            <Seccion
              titulo="Regiones"
              descripcion="Del extremo norte a Magallanes: actividad acumulada y cartera en evaluación por región."
            >
              <EditorialList items={regiones} prefix="region-" />
            </Seccion>
          )}

          {sectores && (
            <Seccion
              titulo="Sectores"
              descripcion="Energía, minería, saneamiento y el resto de la tipología del SEIA."
            >
              <EditorialList items={sectores} prefix="sector-" />
            </Seccion>
          )}

          {titulares && (
            <Seccion
              titulo="Quienes más inversión declaran"
              descripcion="Los doce titulares con mayor inversión declarada; el resto del universo está en Rankings."
            >
              <EditorialList items={titulares} prefix="titular-" numbered={false} />
              <p className="mt-6">
                <Link
                  href="/rankings/"
                  className="font-mono text-[12px] text-oep-ink/60 underline decoration-oep-line underline-offset-4 transition-colors hover:text-oep-emerald"
                >
                  ver todos los titulares en Rankings →
                </Link>
              </p>
            </Seccion>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
