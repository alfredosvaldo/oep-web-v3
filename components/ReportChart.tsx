'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent, CanvasRenderer]);

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
const MONO = "'IBM Plex Mono', monospace";
const INK = '#1B2233';
const MUTED = 'rgba(27,34,51,0.62)';
const GRID = 'rgba(27,34,51,0.09)';
const nf = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

/**
 * Color por significado: el mismo concepto conserva el mismo color en todo el informe.
 * Cobre = flujo que entra / sobrecosto; azul tinta = lo que se resuelve / total;
 * esmeralda = lo que avanza (aprobado, realizado, EPS); rojo ladrillo = rechazo.
 */
const SEMANTIC: Record<string, string> = {
  Ingresados: '#C2703D', Ingresada: '#C2703D',
  Calificados: INK, Calificada: INK, Promedio: INK,
  DIA: '#5B7A99', EIA: '#C2703D',
  Aprobado: '#0E9F6E', Rechazado: '#B4412F', Desistido: '#A9B4C0',
  'No Admitido a Tramitación': '#D9B26F', 'No calificado': '#5B7A99', 'Renuncia RCA': '#7B5E8C',
  'Top 10% de proyectos': INK,
  'Costo Legal': '#8FA6BF', Sobrecosto: '#C2703D', 'Sobrecosto en Exceso': '#7A3B1A',
  'Costo total (funding 50%)': INK,
  'Costo Realizado': '#0E9F6E', 'Costo Latente': '#C2703D',
  'Permisos Ambientales': INK, 'Permisos Sectoriales': '#C2703D',
  'EPS a 18 meses (%)': '#0E9F6E',
};
// Escala categórica (regiones, sectores): armónica con la marca, sin repetir tonos.
const CATEGORICAL = ['#1B2233', '#C2703D', '#0E9F6E', '#5B7A99', '#D9B26F', '#7B5E8C'];
const RESTO = '#C9D1D9';

export type Tipo = 'bar' | 'line' | 'stacked';

/**
 * Gráfico de informe. `src` es un CSV largo (periodo,serie,valor) emitido por el
 * pipeline R, el mismo archivo que se ofrece como descarga.
 */
export default function ReportChart({
  src, titulo, tipo = 'bar', unidad = '', fuente, refLinea, refTexto, altura = 340, n, max, anchoPrint = 650,
}: {
  src: string; titulo: string; tipo?: Tipo; unidad?: string; fuente?: string;
  refLinea?: number; refTexto?: string; altura?: number;
  /** Número de figura, p. ej. "3" o "12a". */
  n?: string;
  /** Tope del eje Y (p. ej. 100 para porcentajes apilados). */
  max?: number;
  /** Ancho (px) del gráfico en el PDF; los de panel triple usan menos. */
  anchoPrint?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [rows, setRows] = useState<string[][] | null>(null);
  const [tabla, setTabla] = useState(false);
  const [modoPrint, setModoPrint] = useState(false);
  const altPrint = Math.round(altura * 0.66);
  const url = `${BASE}/data/informes/${src}`;

  // El PDF se genera con ?print=1: los gráficos se dibujan ya al tamaño de la hoja.
  useEffect(() => setModoPrint(new URLSearchParams(window.location.search).has('print')), []);

  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      // ponytail: split simple; los CSV son periodo,serie,valor sin comas internas ni comillas
      .then((t) => setRows(t.trim().split('\n').slice(1).map((l) => l.split(','))))
      .catch(() => setRows([]));
  }, [url]);

  const { periodos, series, agrupa } = useMemo(() => {
    const periodos: string[] = [];
    const series = new Map<string, Map<string, number | null>>();
    for (const [p, s, v] of rows ?? []) {
      if (!periodos.includes(p)) periodos.push(p);
      if (!series.has(s)) series.set(s, new Map());
      series.get(s)!.set(p, v === '' || v === 'NA' ? null : Number(v));
    }
    // Apilados con muchas categorías (regiones, sectores): las 6 mayores y el resto agrupado.
    // El CSV descargable conserva todas las categorías.
    if (tipo === 'stacked' && series.size > 7) {
      const total = (m: Map<string, number | null>) => Array.from(m.values()).reduce<number>((a, v) => a + (v ?? 0), 0);
      const orden = Array.from(series.entries()).sort((a, b) => total(b[1]) - total(a[1]));
      const agrupado = new Map<string, Map<string, number | null>>(orden.slice(0, 6));
      const resto = new Map<string, number | null>();
      for (const p of periodos) resto.set(p, orden.slice(6).reduce((a, [, m]) => a + (m.get(p) ?? 0), 0));
      agrupado.set(`Resto (${orden.length - 6})`, resto);
      return { periodos, series: agrupado, agrupa: true };
    }
    return { periodos, series, agrupa: false };
  }, [rows, tipo]);

  useEffect(() => {
    if (!ref.current || !rows?.length || tabla) return;
    const chart = echarts.init(ref.current, undefined, modoPrint ? { width: anchoPrint, height: altPrint } : undefined);
    chartRef.current = chart;
    const names = Array.from(series.keys());
    let libre = 0;
    const color = (name: string) =>
      name.startsWith('Resto') ? RESTO : SEMANTIC[name] ?? CATEGORICAL[libre++ % CATEGORICAL.length];
    const multi = names.length > 1;
    const ultimo = (nm: string) => { const v = periodos.map((p) => series.get(nm)!.get(p)).filter((x) => x != null) as number[]; return v.length ? v[v.length - 1] : 0; };
    const maxUltimo = Math.max(...names.map(ultimo));
    const ancho = modoPrint ? anchoPrint : ref.current.clientWidth || 600;
    const filasLeyenda = Math.max(1, Math.ceil(names.reduce((a, x) => a + x.length * 7 + 38, 0) / ancho));
    const fmt = (v: number | null | undefined) => (v == null ? 's/d' : `${nf.format(v)}${unidad ? ' ' + unidad : ''}`);

    const option: EChartsCoreOption = {
      animation: false,
      textStyle: { fontFamily: MONO },
      grid: { left: 8, right: tipo === 'line' ? 58 : 12, top: multi ? 14 + 22 * filasLeyenda : 16, bottom: 4, containLabel: true },
      legend: multi
        ? { top: 0, left: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { fontFamily: MONO, fontSize: 11, color: INK } }
        : undefined,
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: GRID,
        borderWidth: 1,
        padding: [10, 12],
        extraCssText: 'box-shadow:0 6px 24px rgba(27,34,51,.12);',
        textStyle: { color: INK, fontFamily: 'Inter, sans-serif', fontSize: 12 },
        axisPointer: { type: tipo === 'line' ? 'line' : 'shadow', lineStyle: { color: 'rgba(27,34,51,.25)' }, shadowStyle: { color: 'rgba(27,34,51,.05)' } },
        valueFormatter: (v: number) => fmt(v),
      },
      xAxis: {
        type: 'category',
        data: periodos,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: 'rgba(27,34,51,.28)' } },
        axisLabel: { fontFamily: MONO, fontSize: 11, color: MUTED, hideOverlap: true, margin: 10 },
      },
      yAxis: {
        type: 'value',
        max,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontFamily: MONO, fontSize: 11, color: MUTED, formatter: (v: number) => nf0.format(v) },
        splitLine: { lineStyle: { color: GRID, type: 'dashed' } },
      },
      series: names.map((nombre, i) => {
        const c = color(nombre);
        const data = periodos.map((p) => series.get(nombre)!.get(p) ?? null);
        const common = {
          name: nombre,
          data,
          itemStyle: { color: c },
          markLine: i === 0 && refLinea != null
            ? { symbol: 'none', silent: true, lineStyle: { color: '#9A5830', type: 'dashed', width: 1.5 }, label: { formatter: refTexto ?? String(refLinea), position: 'insideEndTop', fontFamily: MONO, fontSize: 11, color: '#9A5830' }, data: [{ yAxis: refLinea }] }
            : undefined,
        };
        return tipo === 'line'
          ? {
              ...common, type: 'line', smooth: false, symbol: 'circle', symbolSize: 6, showSymbol: false,
              lineStyle: { width: 2.6, color: c },
              // valor del último punto, directo sobre la línea
              endLabel: { show: true, formatter: (p: { value: number | null }) => (p.value == null ? '' : nf0.format(p.value)), fontFamily: MONO, fontSize: 11, fontWeight: 600, color: c, distance: 6, offset: multi ? [0, ultimo(nombre) === maxUltimo ? -7 : 7] : [0, 0] },
              emphasis: { focus: 'series', showSymbol: true },
            }
          : {
              ...common, type: 'bar', stack: tipo === 'stacked' ? 'total' : undefined, barMaxWidth: 26,
              itemStyle: { color: c, borderRadius: tipo === 'bar' ? [2, 2, 0, 0] : 0 },
              emphasis: { focus: 'series' },
            };
      }),
    };
    chart.setOption(option);

    const ro = new ResizeObserver(() => !modoPrint && chart.resize());
    ro.observe(ref.current);
    // Al imprimir/guardar PDF la página cambia de ancho: se redibuja al ancho útil de la hoja.
    const antes = () => chart.resize({ width: anchoPrint, height: altPrint });
    const despues = () => chart.resize({ width: 'auto', height: altura });
    window.addEventListener('beforeprint', antes);
    window.addEventListener('afterprint', despues);
    return () => {
      ro.disconnect();
      window.removeEventListener('beforeprint', antes);
      window.removeEventListener('afterprint', despues);
      chart.dispose();
      chartRef.current = null;
    };
  }, [rows, tabla, periodos, series, tipo, unidad, refLinea, refTexto, altura, max, anchoPrint, altPrint, modoPrint]);

  const png = () => {
    const d = chartRef.current?.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' });
    if (!d) return;
    const a = document.createElement('a');
    a.href = d;
    a.download = src.replace(/\.csv$/, '.png').replace(/\//g, '_');
    a.click();
  };

  const btn = 'font-mono text-[11px] uppercase tracking-[0.12em] text-oep-ink/60 hover:text-oep-emerald';
  return (
    <figure className="report-chart my-9 break-inside-avoid">
      <figcaption className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-oep-line pb-2">
        <span>
          {n && <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-oep-copper-dark">Figura {n}</span>}
          <span className="font-display text-[16px] font-semibold leading-snug">{titulo}</span>
        </span>
        <span className="flex gap-4 print:hidden">
          <button type="button" className={btn} aria-pressed={tabla} onClick={() => setTabla(!tabla)}>{tabla ? 'Ver gráfico' : 'Ver tabla'}</button>
          <a className={btn} href={url} download>CSV</a>
          <button type="button" className={btn} onClick={png} disabled={tabla}>PNG</button>
        </span>
      </figcaption>
      {rows === null ? (
        <div style={{ height: altura }} className="animate-pulse bg-oep-ink/5" />
      ) : rows.length === 0 ? (
        <p className="py-10 text-[14px] text-oep-ink/60">Datos no disponibles.</p>
      ) : tabla ? (
        <div key="tabla" className="overflow-auto" style={{ maxHeight: altura }}>
          <table className="w-full text-left text-[13px] tabular">
            <thead><tr><th className="py-1">Período</th>{Array.from(series.keys()).map((s) => <th key={s}>{s}</th>)}</tr></thead>
            <tbody>
              {periodos.map((p) => (
                <tr key={p} className="border-t border-oep-line">
                  <td className="py-1">{p}</td>
                  {Array.from(series.values()).map((m, i) => <td key={i}>{m.get(p) == null ? 's/d' : nf.format(m.get(p)!)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div key="grafico" ref={ref} style={{ height: modoPrint ? altPrint : altura, width: modoPrint ? anchoPrint : undefined, ['--alt-print' as string]: `${altPrint}px` }} role="img" aria-label={titulo} />
      )}
      {(fuente || agrupa) && <p className="oep-source mt-2">{fuente}{agrupa && ' Se muestran las 6 categorías mayores; el CSV incluye todas.'}</p>}
    </figure>
  );
}
