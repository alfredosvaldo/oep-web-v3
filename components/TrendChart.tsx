'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts';
import type { EChartsCoreOption } from 'echarts/core';
import type { Quarter, Year } from '@/lib/series';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

type Modo = 'anual' | 'trimestral';

// El gráfico vive sobre la superficie analítica oscura: tipografía en blanco
// apagado, grilla mínima, cobre para las barras y esmeralda para la inversión.
const AXIS = 'rgba(255,255,255,0.55)';
const AXIS_DIM = 'rgba(255,255,255,0.45)';
const MONO = "'IBM Plex Mono', monospace";

export default function TrendChart({ anual, trimestral }: { anual: Year[]; trimestral: Quarter[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [modo, setModo] = useState<Modo>('anual');
  const [metric, setMetric] = useState<'investment' | 'duration'>('investment');

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);

    const cats = modo === 'anual' ? anual.map((d) => String(d.anio)) : trimestral.map((d) => d.periodo);
    const proyectos = modo === 'anual' ? anual.map((d) => d.proyectos) : trimestral.map((d) => d.proyectos);
    const inversion = modo === 'anual' ? anual.map((d) => d.inversion_mmu) : trimestral.map((d) => d.inversion_mmu);

    const bar: BarSeriesOption = {
      type: 'bar',
      name: 'Proyectos presentados',
      data: proyectos,
      itemStyle: { color: 'rgba(163,180,194,0.5)' },
      emphasis: { itemStyle: { color: '#a3b4c2' } },
      yAxisIndex: 0,
      barMaxWidth: 22,
    };
    const line: LineSeriesOption = {
      type: 'line',
      name: 'Inversión declarada (US$ MM)',
      data: inversion,
      itemStyle: { color: '#e5e7e2' },
      lineStyle: { width: 2 },
      symbol: 'none',
      yAxisIndex: 1,
    };

    const records = modo === 'anual' ? anual : trimestral;
    const durationSeries: LineSeriesOption[] = [
      { type: 'line', name: 'EIA · mediana días', data: records.map(d => d.eia_mediana_dias), connectNulls: false, symbolSize: 5, lineStyle: { width: 2 }, itemStyle: { color: '#a9c5d9' } },
      { type: 'line', name: 'DIA · mediana días', data: records.map(d => d.dia_mediana_dias), connectNulls: false, symbolSize: 5, lineStyle: { width: 2, type: 'dashed' }, itemStyle: { color: '#d4cdc0' } },
    ];
    const option: EChartsCoreOption = {
      animation: false, animationDuration: 0,
      grid: { left: 48, right: 64, top: 32, bottom: modo === 'trimestral' ? 44 : 32 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0B1119',
        borderColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        padding: [10, 12],
        textStyle: { color: '#F8FAFC', fontSize: 12, fontFamily: 'Inter, sans-serif' },
        axisPointer: { lineStyle: { color: 'rgba(255,255,255,0.25)' } },
        valueFormatter: (v: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(v),
      },
      xAxis: {
        type: 'category',
        data: cats,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.20)' } },
        axisTick: { show: false },
        axisLabel: {
          color: AXIS,
          fontSize: 12,
          fontFamily: MONO,
          interval: modo === 'trimestral' ? 11 : 3,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: metric === 'duration' ? 'días corridos' : 'proyectos',
          nameTextStyle: { color: AXIS_DIM, fontSize: 12, fontFamily: MONO },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
          axisLabel: { color: AXIS, fontSize: 12, fontFamily: MONO },
        },
        {
          type: 'value',
          name: metric === 'duration' ? '' : 'US$ MM',
          show: metric !== 'duration',
          nameTextStyle: { color: AXIS_DIM, fontSize: 12, fontFamily: MONO },
          splitLine: { show: false },
          axisLabel: { color: AXIS, fontSize: 12, fontFamily: MONO },
        },
      ],
      series: metric === 'duration' ? durationSeries : [bar, line],
    };
    chart.setOption(option);

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [modo, metric, anual, trimestral]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Métrica de tendencia">
        <button className="atlas-button border-white/40" aria-pressed={metric==='investment'} onClick={()=>setMetric('investment')}>Inversión y proyectos</button>
        <button className="atlas-button border-white/40" aria-pressed={metric==='duration'} onClick={()=>setMetric('duration')}>Tiempos de evaluación</button>
      </div>
      <div className="flex h-[380px] w-full lg:h-[420px]">
        <div ref={ref} className="h-full w-full" role="img" aria-label={metric === 'duration' ? 'Mediana de tramitación DIA y EIA por cohorte de presentación' : 'Gráfico de proyectos e inversión declarada por período'} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex border border-oep-line-light" role="group" aria-label="Frecuencia de la serie">
          {(['anual', 'trimestral'] as Modo[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              aria-pressed={modo === m}
              className={`px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-nav ${
                modo === m ? 'bg-slate-50 text-oep-slate' : 'text-white/55 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="ml-auto flex items-center gap-4 text-[12px] text-white/60 sm:flex">
          <span className="flex items-center gap-1.5">
            <span className={metric === 'duration' ? 'h-0.5 w-4 bg-[#a9c5d9]' : 'h-2.5 w-2.5 bg-[#a3b4c2]/60'} /> {metric === 'duration' ? 'EIA · línea continua' : 'proyectos'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={metric === 'duration' ? 'h-0.5 w-4 bg-[#d4cdc0]' : 'h-0.5 w-4 bg-[#e5e7e2]'} /> {metric === 'duration' ? 'DIA · línea discontinua' : 'inversión US$ MM'}
          </span>
        </span>
      </div>
      {metric === 'duration' && <details className="mt-5 text-[12px] text-white/80"><summary className="cursor-pointer py-3">Ver medianas y tamaños de muestra</summary><div className="overflow-auto max-h-72"><table className="w-full min-w-[560px] text-left"><thead><tr><th>Período</th><th>EIA · días</th><th>n EIA</th><th>DIA · días</th><th>n DIA</th></tr></thead><tbody>{(modo==='anual'?anual:trimestral).map((d:any)=><tr className="border-t border-white/15" key={d.periodo||d.anio}><td className="py-2">{d.periodo||d.anio}</td><td>{d.eia_mediana_dias??'No disponible'}</td><td>{d.eia_n??'No disponible'}</td><td>{d.dia_mediana_dias??'No disponible'}</td><td>{d.dia_n??'No disponible'}</td></tr>)}</tbody></table></div></details>}
    </div>
  );
}
