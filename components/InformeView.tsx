import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import ReportChart from '@/components/ReportChart';
import { Logo } from '@/components/Logo';
import { FIGS, type Fig, type Informe } from '@/lib/informes';

const nf0 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });
const FUENTE = { seia: 'Fuente: SEIA (SEA), base sin duplicados. Elaboración OPE.', sma: 'Fuente: SEIA (SEA) y SMA. Elaboración OPE.' };

/** Lee un CSV largo (periodo,serie,valor) y devuelve los valores de una serie en orden de período. */
function serie(slug: string, file: string, nombre: string): number[] {
  const t = fs.readFileSync(path.join(process.cwd(), 'public/data/informes', slug, file), 'utf8');
  return t.trim().split('\n').slice(1).map((l) => l.split(',')).filter((r) => r[1] === nombre && r[2] !== '').map((r) => Number(r[2]));
}
const pct = (a: number, b: number) => `${a >= b ? '+' : '−'}${nf1.format(Math.abs((a / b - 1) * 100))}%`;
const dif = (a: number, b: number) => `${a >= b ? '+' : '−'}${nf0.format(Math.abs(Math.round(a) - Math.round(b)))} días`;

/** KPI del encabezado: salen de los mismos CSV que dibujan los gráficos, nunca se tipean. */
function kpis(slug: string) {
  const ing = serie(slug, 'fig01_proyectos.csv', 'Ingresados');
  const inv = serie(slug, 'fig02_inversion.csv', 'Ingresada');
  const cal = serie(slug, 'fig02_inversion.csv', 'Calificada');
  const dias = serie(slug, 'fig03_dias.csv', 'Promedio');
  const eia = serie(slug, 'fig04_dias_tipo.csv', 'EIA');
  const u = (a: number[]) => a[a.length - 1];
  const p = (a: number[]) => a[a.length - 2];
  return [
    { label: 'Proyectos ingresados', valor: nf0.format(u(ing)), delta: `${pct(u(ing), p(ing))} vs trimestre anterior` },
    { label: 'Inversión ingresada', valor: `US$ ${nf0.format(u(inv))} MM`, delta: pct(u(inv), p(inv)) },
    { label: 'Inversión calificada', valor: `US$ ${nf0.format(u(cal))} MM`, delta: `${pct(u(cal), p(cal))}${u(cal) >= Math.max(...cal) ? ' · máximo de la serie' : ''}` },
    { label: 'Días promedio de tramitación', valor: nf0.format(u(dias)), delta: dif(u(dias), p(dias)) },
    { label: 'EIA: días promedio', valor: nf0.format(u(eia)), delta: `${nf1.format(u(eia) / 180)}× el plazo legal` },
  ];
}

function Seccion({ id, kicker, titulo, children }: { id: string; kicker: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="report-section scroll-mt-24 border-t border-oep-line pt-10">
      <p className="oep-kicker">{kicker}</p>
      <h2 className="oep-headline mt-3 max-w-3xl text-[26px] leading-8 lg:text-[30px] lg:leading-9">{titulo}</h2>
      {children}
    </section>
  );
}

function Significa({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 max-w-prose text-[15px] leading-7 text-oep-ink/75">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-oep-ink/50">Qué significa · </span>
      {children}
    </p>
  );
}

function Como({ children }: { children: React.ReactNode }) {
  return (
    <>
      <details className="mt-3 max-w-prose text-[14px] leading-6 text-oep-ink/70 print:hidden">
        <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-oep-ink/50">Cómo lo calculamos</summary>
        <p className="mt-2">{children}</p>
      </details>
      <p className="como-print">
        <span>Cómo lo calculamos · </span>
        {children}
      </p>
    </>
  );
}

export default function InformeView({ informe }: { informe: Informe }) {
  const slug = informe.slug;
  const K = kpis(slug);
  const chart = (key: string, extra: Partial<{ anchoPrint: number }> = {}) => {
    const f: Fig = FIGS[key];
    return (
      <ReportChart
        key={key} src={`${slug}/${f.file}`} n={f.n} titulo={f.titulo} tipo={f.tipo} unidad={f.unidad} altura={f.altura} max={f.max}
        refLinea={f.refLinea} refTexto={f.refTexto} fuente={f.fuente ? FUENTE[f.fuente] : undefined} {...extra}
      />
    );
  };
  const indice = [...informe.secciones.map((s) => [s.id, s.kicker.split(' · ')[1]] as const), ['notas', 'Notas metodológicas'] as const];
  const pdf = `/informes/OPE-informe-${slug.toUpperCase()}.pdf`;

  return (
    <>
      <Header />
      {/* Pie de página del PDF con el período de este informe */}
      <style dangerouslySetInnerHTML={{ __html: `@media print{@page{@bottom-left{content:"OEP · Informe trimestral ${informe.periodo}"}}}` }} />
      <section className="print-cover" aria-hidden="true">
        <div className="print-cover__top">
          <Logo className="h-12 w-12" />
          <div>
            <p className="print-cover__brand">OEP</p>
            <p className="print-cover__sub">Observatorio Económico de Permisos</p>
          </div>
        </div>
        <div className="print-cover__main">
          <p className="print-cover__kicker">Informe trimestral · {informe.meta}</p>
          <h1>Cierre {informe.periodo}</h1>
          <p className="print-cover__lede">{informe.lede}</p>
        </div>
        <dl className="print-cover__kpis">
          {K.map((k) => (
            <div key={k.label}><dt>{k.label}</dt><dd>{k.valor}</dd></div>
          ))}
        </dl>
        <p className="print-cover__foot">oep-chile.com · {informe.publicado} · Fuente: SEIA (SEA){informe.secciones.some((s) => s.id === 'sectoriales') ? ' y SMA' : ''}</p>
      </section>
      <main className="min-h-screen">
        <div className="mx-auto max-w-content px-6 py-12 lg:px-10 lg:py-16">
          <PageHeader kicker="Informe trimestral" titulo={informe.titulo} meta={informe.meta}>{informe.lede}</PageHeader>

          <div className="no-print mt-6 flex flex-wrap gap-3">
            <a href={pdf} download className="atlas-button">Descargar informe (PDF)</a>
            <Link href="/datos-metodologia/" className="atlas-button">Metodología</Link>
            <Link href="/informes/" className="atlas-button">Todos los informes</Link>
          </div>

          <div className="mt-10 grid gap-x-12 lg:grid-cols-[200px_1fr]">
            <nav aria-label="Secciones del informe" className="no-print hidden lg:block">
              <ul className="sticky top-24 space-y-2 font-mono text-[12px]">
                {indice.map(([id, t]) => (
                  <li key={id}><a href={`#${id}`} className="text-oep-ink/60 hover:text-oep-emerald">{t}</a></li>
                ))}
              </ul>
            </nav>

            <div className="min-w-0 space-y-14">
              <section aria-label="Resumen">
                <h2 className="print-resumen-title">Resumen ejecutivo</h2>
                <dl className="report-kpis grid grid-cols-2 gap-px border border-oep-line bg-oep-line md:grid-cols-5">
                  {K.map((k) => (
                    <div key={k.label} className="bg-oep-paper p-4">
                      <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-oep-ink/55">{k.label}</dt>
                      <dd className="oep-headline tabular mt-2 text-[22px] leading-7">{k.valor}</dd>
                      <dd className="mt-1 text-[12px] text-oep-ink/60">{k.delta}</dd>
                    </div>
                  ))}
                </dl>
                <ol className="mt-8 max-w-prose list-decimal space-y-3 pl-5 text-[16px] leading-7 text-oep-ink/80">
                  {informe.resumen.map((t) => <li key={t}>{t}</li>)}
                </ol>
              </section>

              {informe.secciones.map((s) => (
                <Seccion key={s.id} id={s.id} kicker={s.kicker} titulo={s.titulo}>
                  {s.bloques.map((b, i) => (
                    <div key={i}>
                      {b.figs.length === 3 ? (
                        <div className="report-trio grid gap-x-6 md:grid-cols-3">{b.figs.map((k) => chart(k, { anchoPrint: 205 }))}</div>
                      ) : (
                        b.figs.map((k) => chart(k))
                      )}
                      {b.nota && <p className="oep-source -mt-4">{b.nota}</p>}
                      {b.texto && <Significa>{b.texto}</Significa>}
                    </div>
                  ))}
                  {s.como && <Como>{s.como}</Como>}
                </Seccion>
              ))}

              <section id="notas" className="report-section scroll-mt-24 border-t border-oep-line pt-10">
                <p className="oep-kicker">Notas</p>
                <h2 className="oep-headline mt-3 text-[26px] leading-8 lg:text-[30px] lg:leading-9">Cómo leer este informe</h2>
                <ul className="mt-4 max-w-prose list-disc space-y-2 pl-5 text-[14px] leading-6 text-oep-ink/75">
                  {informe.notas.map((t) => <li key={t}>{t}</li>)}
                  <li>
                    Los datos de origen y el método están en{' '}
                    <Link href="/datos-metodologia/" className="underline underline-offset-4">Datos y metodología</Link>.
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
