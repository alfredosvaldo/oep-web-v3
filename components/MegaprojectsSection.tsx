'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchMegaprojects, type Megaproject } from '@/lib/series';
import { fmtInt, fmtMM, fmtDate } from '@/lib/format';

export default function MegaprojectsSection() {
  const [items, setItems] = useState<Megaproject[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMegaprojects()
      .then((d) => setItems(d.proyectos))
      .catch((e) => setError(String(e)));
  }, []);

  const total = items?.reduce((s, p) => s + p.inversion_mmu, 0) ?? 0;

  return (
    <section aria-label="Megaproyectos recientes" className="bg-oep-paper">
      <div className="mx-auto max-w-content px-6 py-12 lg:px-10 lg:py-16">
        <h2 className="oep-headline text-[28px] leading-8 lg:text-[34px] lg:leading-10">
          {items ? `${items.length} megaproyectos suman US$ ${fmtMM(total)} MM` : 'Los gigantes recientes'}
        </h2>
        <p className="mt-1 font-mono text-[12px] text-oep-ink/55">aprobados con RCA · inversión ≥ US$ 100 MM</p>
        <p className="mt-3 max-w-2xl text-[15px] leading-6 text-oep-ink/70">
          Los expedientes más grandes calificados recientemente y el tiempo que tardó el sistema en
          aprobarlos.
        </p>

        {error && (
          <p role="alert" className="mt-8 rounded border border-oep-copper/50 bg-oep-surface p-4 text-[14px] text-oep-copper-dark">
            No se pudieron cargar los datos: {error}
          </p>
        )}

        {items ? (
          <div className="mt-8 overflow-x-auto border-t border-oep-line">
            <table className="w-full min-w-[640px] border-collapse text-[14px]">
              <caption className="sr-only">Megaproyectos recientes aprobados con RCA, ordenados por fecha de calificación</caption>
              <thead>
                <tr className="border-b border-oep-line text-left">
                  <th scope="col" className="oep-label w-10 py-3 pr-2 text-oep-ink/55">#</th>
                  <th scope="col" className="oep-label py-3 pr-4 text-oep-ink/55">Proyecto</th>
                  <th scope="col" className="oep-label py-3 pr-4 text-oep-ink/55">Sector · Región</th>
                  <th scope="col" className="oep-label py-3 pr-4 text-oep-ink/55">RCA</th>
                  <th scope="col" className="oep-label py-3 text-right text-oep-ink/55">Inversión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oep-line">
                {items.map((p, i) => (
                  <tr key={p.id} className="transition-colors hover:bg-oep-ink/5">
                    <td className="py-3.5 pr-2 font-mono text-[12px] tabular text-oep-ink/40">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 pr-4 font-display text-[16px] font-semibold tracking-tight">
                      <Link href={`/mapa/?status=all&project=${p.id}`} className="hover:underline">{p.nombre} →</Link>
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-[12px] text-oep-ink/60">
                      {p.sector} · {p.region}
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-[12px] text-oep-ink/60">
                      {p.fecha_calificacion ? fmtDate(p.fecha_calificacion) : '—'}
                      {p.dias_tramitacion != null && ` · ${fmtInt(p.dias_tramitacion)} días`}
                    </td>
                    <td className="whitespace-nowrap py-3.5 text-right font-mono text-[14px] font-medium tabular">
                      US$ {fmtMM(p.inversion_mmu)} MM
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !error && (
            <div className="mt-8 flex h-48 items-center justify-center border-t border-oep-line">
              <p className="font-mono text-[12px] text-oep-ink/55">Cargando megaproyectos…</p>
            </div>
          )
        )}
        <p className="oep-source mt-4 border-t border-oep-line pt-3">
          Fuente: SEA, Resoluciones de Calificación Ambiental. Cálculos OEP. Selecciona un proyecto para ver su ficha OEP y el enlace oficial SEA.
        </p>
      </div>
    </section>
  );
}
