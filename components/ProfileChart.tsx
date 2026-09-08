'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts';
import type { EChartsCoreOption } from 'echarts/core';
import type { SerieAnual } from '@/lib/profile';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

const MONO = "'IBM Plex Mono', monospace";

/** Serie anual compacta de un perfil: barras = proyectos, línea = inversión. */
export default function ProfileChart({ serie }: { serie: SerieAnual[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);

    const bar: BarSeriesOption = {
      type: 'bar',
      name: 'Proyectos',
      data: serie.map((d) => d.proyectos),
      // Misma convención que la serie histórica de portada: barras = proyectos
      // (cobre), línea = inversión (esmeralda).
      itemStyle: { color: 'rgba(194,112,61,0.35)' },
      emphasis: { itemStyle: { color: '#C2703D' } },
      yAxisIndex: 0,
      barMaxWidth: 14,
    };
    const line: LineSeriesOption = {
      type: 'line',
      name: 'Inversión US$ MM',
      data: serie.map((d) => d.inversion_mmu),
      itemStyle: { color: '#0E9F6E' },
      lineStyle: { width: 2 },
      symbol: 'none',
      yAxisIndex: 1,
    };

    const option: EChartsCoreOption = {
      animation: false, animationDuration: 0,
      grid: { left: 44, right: 56, top: 24, bottom: 28 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#121A26',
        borderWidth: 0,
        padding: [10, 12],
        textStyle: { color: '#F8FAFC', fontSize: 12, fontFamily: 'Inter, sans-serif' },
        valueFormatter: (v: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(v),
      },
      xAxis: {
        type: 'category',
        data: serie.map((d) => String(d.anio)),
        axisLine: { lineStyle: { color: 'rgba(27,34,51,0.20)' } },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(27,34,51,0.55)', fontSize: 12, fontFamily: MONO, interval: 4 },
      },
      yAxis: [
        {
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(27,34,51,0.08)' } },
          axisLabel: { color: 'rgba(27,34,51,0.55)', fontSize: 12, fontFamily: MONO },
        },
        {
          type: 'value',
          splitLine: { show: false },
          axisLabel: { color: 'rgba(27,34,51,0.55)', fontSize: 12, fontFamily: MONO },
        },
      ],
      series: [bar, line],
    };
    chart.setOption(option);

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [serie]);

  return (
    <div className="h-[240px] w-full" ref={ref} role="img" aria-label="Serie anual del perfil" />
  );
}
