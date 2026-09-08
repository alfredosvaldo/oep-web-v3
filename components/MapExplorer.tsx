'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GeoComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ScatterSeriesOption } from 'echarts/charts';
import type { EChartsCoreOption } from 'echarts/core';
import { EG_COLOR, EG_LABEL, fetchChileOutline, fetchGeoPoints, type ChileOutline, type GeoPoints } from '@/lib/geo';
import { fmtInt, fmtMM } from '@/lib/format';

echarts.use([ScatterChart, GeoComponent, TooltipComponent, CanvasRenderer]);

const EG_ORDER = [0, 1, 3, 2, 4];
const symbolSize = (mmu: number) => Math.min(2 + Math.sqrt(Math.max(mmu, 0)) / 7, 16);

type EgState = Record<number, boolean>;

/** Explorador full-screen: todos los puntos del SEIA con filtros por estado y año. */
export default function MapExplorer() {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [data, setData] = useState<{ geo: GeoPoints; outline: ChileOutline } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eg, setEg] = useState<EgState>({ 0: true, 1: true, 2: true, 3: true, 4: true });
  const [rango, setRango] = useState<[number, number]>([1993, 2026]);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchGeoPoints(), fetchChileOutline()])
      .then(([geo, outline]) => alive && setData({ geo, outline }))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const anioFin = data ? Math.max(...data.geo.points.map((p) => p[4])) : 2026;
  const anioIni = data?.geo.anio_ini ?? 1993;

  // Inicialización del chart (una sola vez por dataset)
  useEffect(() => {
    if (!data || !ref.current) return;
    const { geo, outline } = data;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    echarts.registerMap('Chile', outline as never);

    const option: EChartsCoreOption = {
      animation: false,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#121A26',
        borderWidth: 0,
        padding: [10, 12],
        textStyle: { color: '#F8FAFC', fontSize: 12, fontFamily: 'Inter, sans-serif' },
        formatter: (params: { data?: { value: number[]; idx: number } }) => {
          const d = params.data;
          if (!d) return '';
          const [, , mmu, egi, anio] = d.value;
          return [
            `<div style="max-width:260px;font-weight:600;line-height:1.35">${geo.nombres[d.idx]}</div>`,
            `<div style="margin-top:6px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#CBD5E1">${EG_LABEL[egi]} · presentado ${anio}</div>`,
            `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#CBD5E1">US$ ${fmtMM(mmu)} MM</div>`,
          ].join('');
        },
      },
      geo: {
        map: 'Chile',
        silent: true,
        roam: true,
        scaleLimit: { min: 0.8, max: 12 },
        aspectScale: 0.82,
        itemStyle: { areaColor: '#FFFFFF', borderColor: 'rgba(27,34,51,0.25)', borderWidth: 0.6 },
      },
      series: [],
    };
    chart.setOption(option);

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [data]);

  // Filtrado + actualización de series
  const stats = useMemo(() => {
    if (!data) return { n: 0, mmu: 0, counts: {} as Record<number, number> };
    const counts = {} as Record<number, number>;
    let n = 0;
    let mmu = 0;
    for (const p of data.geo.points) {
      if (!eg[p[3]] || p[4] < rango[0] || p[4] > rango[1]) continue;
      n++;
      mmu += p[2];
      counts[p[3]] = (counts[p[3]] || 0) + 1;
    }
    return { n, mmu, counts };
  }, [data, eg, rango]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data) return;
    const byEg = new Map<number, { value: [number, number, number, number, number]; idx: number }[]>();
    data.geo.points.forEach((p, idx) => {
      if (!eg[p[3]] || p[4] < rango[0] || p[4] > rango[1]) return;
      if (!byEg.has(p[3])) byEg.set(p[3], []);
      byEg.get(p[3])!.push({ value: p, idx });
    });
    const series: ScatterSeriesOption[] = [];
    byEg.forEach((list, egi) => {
      series.push({
        type: 'scatter',
        name: EG_LABEL[egi],
        coordinateSystem: 'geo',
        data: list,
        symbolSize: (val: number[]) => symbolSize(val[2]),
        itemStyle: { color: EG_COLOR[egi], opacity: egi === 1 ? 0.85 : 0.45, borderWidth: 0 },
        emphasis: { scale: 1.6, itemStyle: { opacity: 1 } },
        progressive: 8000,
        animation: false,
        z: egi === 1 ? 3 : 2,
      });
    });
    chart.setOption({ series } as EChartsCoreOption);
  }, [data, eg, rango]);

  const setMin = (v: number) => setRango(([_, max]) => [Math.min(v, max), max]);
  const setMax = (v: number) => setRango(([min, _]) => [min, Math.max(v, min)]);

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col lg:flex-row">
      {/* Panel de filtros */}
      <aside className="w-full shrink-0 overflow-y-auto border-b border-oep-line bg-oep-paper p-5 lg:h-full lg:w-80 lg:border-b-0 lg:border-r lg:p-6">
        <p className="oep-kicker">Mapa</p>
        <h1 className="oep-headline mt-2 text-[22px] leading-7">Todos los expedientes del SEIA</h1>
        <p className="mt-1 font-mono text-[11px] tabular text-oep-ink/55">
          {data ? `${fmtInt(stats.n)} proyectos · US$ ${fmtMM(stats.mmu)} MM` : 'cargando…'}
        </p>

        <div className="mt-6 border-t border-oep-line pt-5">
          <h2 className="oep-label text-[11px] text-oep-ink/55">Estado</h2>
          <ul className="mt-3 space-y-1">
            {EG_ORDER.map((egi) => (
              <li key={egi}>
                <button
                  type="button"
                  onClick={() => setEg((s) => ({ ...s, [egi]: !s[egi] }))}
                  aria-pressed={eg[egi]}
                  className={`flex w-full items-center gap-2.5 border-b border-oep-line py-2 text-left text-[13px] transition-opacity duration-nav ${
                    eg[egi] ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: EG_COLOR[egi] }} />
                  <span className="flex-1">{EG_LABEL[egi]}</span>
                  <span className="font-mono text-[11px] tabular text-oep-ink/50">
                    {stats.counts[egi] ? fmtInt(stats.counts[egi]) : '0'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 border-t border-oep-line pt-5">
          <h2 className="oep-label text-[11px] text-oep-ink/55">Año de presentación</h2>
          <p className="mt-3 font-mono text-[13px] tabular text-oep-ink">
            {rango[0]} — {rango[1]}
          </p>
          <label className="mt-2 block">
            <span className="sr-only">Desde</span>
            <input
              type="range"
              min={anioIni}
              max={anioFin}
              value={rango[0]}
              onChange={(e) => setMin(Number(e.target.value))}
              className="w-full accent-oep-emerald"
            />
          </label>
          <label className="block">
            <span className="sr-only">Hasta</span>
            <input
              type="range"
              min={anioIni}
              max={anioFin}
              value={rango[1]}
              onChange={(e) => setMax(Number(e.target.value))}
              className="w-full accent-oep-copper"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            setEg({ 0: true, 1: true, 2: true, 3: true, 4: true });
            setRango([anioIni, anioFin]);
          }}
          className="mt-6 w-full border border-oep-line px-4 py-2 text-[13px] font-medium transition-colors duration-nav hover:border-oep-ink hover:bg-oep-ink/5"
        >
          Restablecer filtros
        </button>

        <p className="oep-source mt-6 border-t border-oep-line pt-3">
          Arrastra el mapa para navegar · rueda para zoom · tamaño del punto = inversión declarada.
          Fuente: SEA. Cálculos OEP.
        </p>
        {error && <p className="mt-4 text-[12px] text-oep-copper-dark">Error: {error}</p>}
      </aside>

      {/* Mapa */}
      <div className="relative min-h-[420px] flex-1 bg-oep-paper">
        {data ? (
          <div ref={ref} className="h-full w-full" role="img" aria-label="Mapa explorador de proyectos del SEIA" />
        ) : (
          <div className="flex h-full min-h-[420px] items-center justify-center">
            <p className="font-mono text-[12px] text-oep-ink/55">{error ? 'No se pudo cargar el mapa' : 'Cargando mapa…'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
