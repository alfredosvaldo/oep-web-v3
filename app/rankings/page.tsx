'use client';

import Link from 'next/link';
import { normalize } from '@/lib/atlas';
import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import { fetchAgg, type AggItem } from '@/lib/kpis';
import { fmtInt, fmtMM, fmtPct1 } from '@/lib/format';

type Dim = 'region' | 'sector' | 'titular' | 'tipologia' | 'estado';

const DIMS: { id: Dim; label: string; plural: string; blurb: string }[] = [
  { id: 'region', label: 'Región', plural: 'regiones', blurb: 'Dónde se presenta la inversión' },
  { id: 'sector', label: 'Sector', plural: 'sectores', blurb: 'En qué se invierte' },
  { id: 'titular', label: 'Titular', plural: 'titulares', blurb: 'Quién presenta los proyectos' },
  { id: 'tipologia', label: 'Tipología', plural: 'tipologías', blurb: 'Qué tipo de evaluación' },
  { id: 'estado', label: 'Estado', plural: 'estados', blurb: 'En qué quedó cada expediente' },
];

const MAX_ROWS = 150;

type SortKey = 'nombre' | 'proyectos' | 'inversion_mmu' | 'aprobados_n' | 'tasa_aprobacion' | 'mediana_dias';

const HEADERS: { key: SortKey; label: string; align: 'left' | 'right'; numeric: boolean }[] = [
  { key: 'nombre', label: 'Nombre', align: 'left', numeric: false },
  { key: 'proyectos', label: 'Proyectos', align: 'right', numeric: true },
  { key: 'inversion_mmu', label: 'Inversión US$ MM', align: 'right', numeric: true },
  { key: 'aprobados_n', label: 'Aprobados', align: 'right', numeric: true },
  { key: 'tasa_aprobacion', label: 'Tasa apr.', align: 'right', numeric: true },
  { key: 'mediana_dias', label: 'Mediana días', align: 'right', numeric: true },
];

function cellValue(it: AggItem, key: SortKey): string | number | null {
  return it[key];
}

export default function Rankings() {
  const [dim, setDim] = useState<Dim>('region');
  const [items, setItems] = useState<AggItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'inversion_mmu', dir: -1 });
  const [query, setQuery] = useState('');

  useEffect(() => {
    setItems(null);
    setQuery('');
    fetchAgg(dim)
      .then((d) => setItems(d.items))
      .catch((e) => setError(String(e)));
  }, [dim]);

  const rows = useMemo(() => {
    if (!items) return [];
    const q = normalize(query);
    let list = q
      ? items.filter((it) => normalize(it.nombre).includes(q))
      : [...items];
    list.sort((a, b) => {
      const va = cellValue(a, sort.key);
      const vb = cellValue(b, sort.key);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'es');
      return cmp * sort.dir;
    });
    return list;
  }, [items, sort, query]);

  const maxMmu = useMemo(() => Math.max(...rows.slice(0, MAX_ROWS).map((r) => r.inversion_mmu), 1), [rows]);
  const visible = rows.slice(0, MAX_ROWS);
  const dimMeta = DIMS.find((d) => d.id === dim)!;

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'nombre' ? 1 : -1 }));

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="mx-auto max-w-content px-6 py-12 lg:px-10 lg:py-16">
          <PageHeader
            kicker="Rankings"
            titulo="Quién concentra la inversión evaluada"
            meta="1993–2026-T2 · ordena cualquier columna"
          >
            Los mismos datos del mapa, tabulados por región, sector, titular, tipología y estado.
          </PageHeader>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-oep-line pt-6">
            <div className="inline-flex flex-wrap border border-oep-line" role="group" aria-label="Dimensión del ranking">
              {DIMS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDim(d.id)}
                  aria-pressed={dim === d.id}
                  title={d.blurb}
                  className={`px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-nav ${
                    dim === d.id ? 'bg-oep-ink text-oep-paper' : 'text-oep-ink/55 hover:text-oep-ink'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <span className="ml-auto hidden font-mono text-[12px] text-oep-ink/55 md:inline">
              {items ? `${fmtInt(items.length)} ${dimMeta.plural} · ${dimMeta.blurb.toLowerCase()}` : 'cargando…'}
            </span>
          </div>

          {dim === 'titular' && (
            <div className="mt-4">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar titulares… (p. ej. Codelco, Enel)"
                className="w-full max-w-md border border-oep-line bg-oep-surface px-4 py-2.5 text-[14px] placeholder:text-oep-ink/40 focus:border-oep-emerald focus:outline-none"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="mt-8 border border-oep-copper/50 p-4 text-[14px] text-oep-copper-dark">
              No se pudieron cargar los datos: {error}
            </p>
          )}

          {items ? (
            <div className="mt-6 border-t border-oep-line">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-[14px]">
                  <caption className="sr-only">
                    Ranking por {dimMeta.label.toLowerCase()}, ordenado por {HEADERS.find((h) => h.key === sort.key)?.label}
                  </caption>
                  <thead>
                    <tr className="border-b border-oep-line text-left">
                      <th scope="col" className="w-12 px-4 py-3 font-mono text-[11px] font-medium text-oep-ink/40">#</th>
                      {HEADERS.map((h) => (
                        <th
                          key={h.key}
                          scope="col"
                          aria-sort={sort.key === h.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                          className={`px-4 py-3 ${h.align === 'right' ? 'text-right' : 'text-left'}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSort(h.key)}
                            className={`oep-label inline-flex items-center gap-1 text-[11px] transition-colors duration-nav hover:text-oep-ink ${
                              sort.key === h.key ? 'text-oep-ink' : 'text-oep-ink/55'
                            }`}
                          >
                            {h.label}
                            <span aria-hidden="true" className="text-[9px]">
                              {sort.key === h.key ? (sort.dir === 1 ? '▲' : '▼') : '△'}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-oep-line">
                    {visible.map((it, i) => (
                      <tr key={it.slug} className="transition-colors hover:bg-oep-ink/5">
                        <td className="px-4 py-3 font-mono text-[12px] tabular text-oep-ink/40">{i + 1}</td>
                        <td className="max-w-[340px] px-4 py-3 font-medium">{['region','sector','titular'].includes(dim) ? <><Link className="hover:underline" href={dim !== 'titular' || (items?.indexOf(it) ?? 501) < 500 ? `/perfiles/${dim}-${it.slug}/` : `/mapa/?status=all&${dim}=${it.slug}`}>{it.nombre}</Link><Link className="block text-[12px] underline mt-2" href={`/comparar/?type=${dim}&entities=${it.slug}&status=all`}>Comparar ↗</Link></> : it.nombre}</td>
                        <td className="px-4 py-3 text-right tabular">{fmtInt(it.proyectos)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <span className="hidden h-1.5 w-16 overflow-hidden bg-oep-ink/10 lg:block">
                              <span
                                className="block h-full bg-oep-copper"
                                style={{ width: `${Math.max((it.inversion_mmu / maxMmu) * 100, 1.5)}%` }}
                              />
                            </span>
                            <span className="tabular">{fmtMM(it.inversion_mmu)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular">{fmtInt(it.aprobados_n)}</td>
                        <td className="px-4 py-3 text-right tabular">
                          {it.tasa_aprobacion != null ? fmtPct1(it.tasa_aprobacion) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular">
                          {it.mediana_dias != null ? fmtInt(it.mediana_dias) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > MAX_ROWS && (
                <p className="border-t border-oep-line px-4 py-3 font-mono text-[12px] text-oep-ink/55">
                  Mostrando {MAX_ROWS} de {fmtInt(rows.length)} — {dim === 'titular' ? 'usa el filtro para acotar' : 'ordena para explorar el resto'}.
                </p>
              )}
            </div>
          ) : (
            !error && (
              <div className="mt-6 flex h-64 items-center justify-center border-t border-oep-line">
                <p className="font-mono text-[12px] text-oep-ink/55">Cargando ranking…</p>
              </div>
            )
          )}

          <p className="oep-source mt-4 border-t border-oep-line pt-3">
            Fuente: SEA · Estado al 30.06.2026. Cálculos OEP. Tasa de aprobación = RCA favorable / calificados con RCA. Mediana de días
            presentación → calificación, por dimensión. Denominadores y alcance disponibles en la comparación.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
