'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchAnnual, fetchQuarterly, type Quarter, type Year } from '@/lib/series';

// echarts vive en un chunk aparte: el gráfico se descarga bajo demanda.
const TrendChart = dynamic(() => import('@/components/TrendChart'), { ssr: false });

/**
 * Segunda —y última— superficie analítica oscura de la home. El sitio tiene
 * exactamente dos: territorio (el panel de Chile del hero) y tiempo (esta
 * serie histórica). El resto vive sobre papel.
 */
export default function TrendSection() {
  const [data, setData] = useState<{ anual: Year[]; trimestral: Quarter[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchAnnual(), fetchQuarterly()])
      .then(([a, q]) => setData({ anual: a.anios, trimestral: q.periodos }))
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <section aria-label="Tendencia histórica" className="bg-oep-slate text-slate-50">
      <div className="mx-auto max-w-content px-6 py-14 lg:px-10 lg:py-20">
        <h2 className="oep-headline text-[28px] leading-8 lg:text-[34px] lg:leading-10">
          La inversión y el tiempo, en perspectiva
        </h2>
        <p className="mt-1 font-mono text-[12px] text-white/50">
          Proyectos e inversión declarada · 1993–2026-T2
        </p>
        <p className="mt-3 max-w-2xl text-[15px] leading-6 text-white/70">
          Compara la inversión de cada cohorte de presentación con los tiempos de tramitación disponibles.
        </p>

        {error && (
          <p role="alert" className="mt-8 border border-oep-copper/50 p-4 text-[14px] text-oep-copper">
            No se pudieron cargar los datos: {error}
          </p>
        )}
        {data ? (
          <div className="mt-8 border-t border-oep-line-light pt-6">
            <TrendChart anual={data.anual} trimestral={data.trimestral} />
            <p className="mt-4 font-mono text-[11px] text-white/45">
              Fuente: SEA. Cálculos OEP. Cohortes de presentación; 2026 incluye solo T1–T2. Medianas con ambas fechas; «—» indica muestra insuficiente.
            </p>
          </div>
        ) : (
          !error && (
            <div className="mt-8 flex h-[380px] items-center justify-center border-t border-oep-line-light pt-6 lg:h-[420px]">
              <p className="font-mono text-[12px] text-white/50">Cargando serie…</p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
