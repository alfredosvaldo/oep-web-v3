'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import HomeAtlas from '@/components/HomeAtlas';
import SectorComparison from '@/components/SectorComparison';
import TrendSection from '@/components/TrendSection';
import MegaprojectsSection from '@/components/MegaprojectsSection';
import { fetchKpis, type Kpis } from '@/lib/kpis';
import { fmtInt, fmtMM, fmtDeltaPct } from '@/lib/format';

function PulseStrip({ k }: { k: Kpis }) {
  const q = k.ultimo_trimestre;
  const dProy = (q.proyectos - q.proyectos_previo) / q.proyectos_previo;
  const dMmu = (q.inversion_mmu - q.inversion_mmu_previo) / q.inversion_mmu_previo;
  const cells = [
    { label: 'Proyectos presentados', value: q.proyectos, fmt: fmtInt, delta: dProy },
    { label: 'Inversión declarada', value: q.inversion_mmu, fmt: fmtMM, delta: dMmu, unit: 'US$ MM' },
  ];
  return (
    <section id="pulso" aria-label="El pulso del trimestre" className="border-b border-oep-line bg-oep-paper">
      <div className="mx-auto max-w-content px-6 py-14 lg:px-10 lg:py-16">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <h2 className="oep-headline text-[26px] leading-8 lg:text-[30px] lg:leading-9">
            Lo que se presentó en {q.periodo}
          </h2>
          <p className="font-mono text-[12px] text-oep-ink/55">vs. período previo</p>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-x-8 border-t border-oep-line pt-8 lg:grid-cols-2">
          {cells.map((c) => (
            <div key={c.label} className="border-oep-line py-2 lg:border-l lg:pl-8 lg:first:border-l-0 lg:first:pl-0">
              <dt className="oep-label text-[11px] text-oep-ink/60">{c.label}</dt>
              <dd className="mt-2 font-display text-[28px] font-semibold leading-8 tracking-tight tabular">
                {c.fmt(c.value)}
                {c.unit && <span className="ml-1.5 text-[13px] font-medium text-oep-ink/55">{c.unit}</span>}
              </dd>
              {c.delta !== undefined && (
                <dd
                  className={`mt-1 text-[13px] font-medium tabular ${
                    c.delta > 0 ? 'text-oep-emerald' : 'text-oep-copper-dark'
                  }`}
                >
                  {fmtDeltaPct(c.delta)}{' '}
                  <span className="font-normal text-oep-ink/55">vs. {q.periodo === '2026-T2' ? '2026-T1' : 'período previo'}</span>
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default function Home() {
  const [k, setK] = useState<Kpis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKpis().then(setK).catch((e) => setError(String(e)));
  }, []);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <HomeAtlas k={k} />

        {error && (
          <p role="alert" className="mx-auto mt-8 max-w-content px-6 text-[14px] text-oep-copper-dark lg:px-10">
            No se pudieron cargar los datos: {error}
          </p>
        )}

        {k && <PulseStrip k={k} />}

        <SectorComparison />

        <TrendSection />

        <MegaprojectsSection />
      </main>
      <Footer />
    </>
  );
}
