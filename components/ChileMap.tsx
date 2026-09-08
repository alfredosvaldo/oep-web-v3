'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GeoComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ScatterSeriesOption } from 'echarts/charts';
import type { EChartsCoreOption } from 'echarts/core';
import { EG_LABEL, type ChileOutline, type GeoPoints } from '@/lib/geo';
import { fmtInt, fmtMM } from '@/lib/format';

echarts.use([ScatterChart, GeoComponent, TooltipComponent, CanvasRenderer]);

const EG_COLOR: Record<number, string> = {
  0: '#0E9F6E', // Aprobado
  1: '#C2703D', // En evaluación
  2: '#9A5830', // Rechazado
  3: '#64748B', // Desistido-Caducado
  4: '#CBD5E1', // No calificado-No admitido
};

const EG_OPACITY: Record<number, number> = { 0: 0.35, 1: 0.85, 2: 0.45, 3: 0.3, 4: 0.5 };

/** Radio ∝ √(inversión), acotado para que la cartera no eclipse al resto. */
const symbolSize = (mmu: number) => Math.min(2 + Math.sqrt(Math.max(mmu, 0)) / 7, 16);

interface Props {
  geo: GeoPoints;
  /** Puntos recortados a la vista continental, con índice al arreglo original. */
  vista: { idx: number; p: [number, number, number, number, number] }[];
  outline: ChileOutline;
  onHoverNombre?: (nombre: string | null) => void;
}

export default function ChileMap({ geo, vista, outline, onHoverNombre }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);

    echarts.registerMap('Chile', outline as never);

    const byEg = new Map<number, { idx: number; p: [number, number, number, number, number] }[]>();
    for (const v of vista) {
      if (!byEg.has(v.p[3])) byEg.set(v.p[3], []);
      byEg.get(v.p[3])!.push(v);
    }

    const groups: [number, { idx: number; p: [number, number, number, number, number] }[]][] = [];
    byEg.forEach((list, eg) => groups.push([eg, list]));
    groups.sort((a, b) => b[1].length - a[1].length);
    const series: ScatterSeriesOption[] = [];
    for (const [eg, list] of groups) {
      series.push({
        type: 'scatter',
        name: EG_LABEL[eg],
        coordinateSystem: 'geo',
        data: list.map((v) => ({ value: v.p, idx: v.idx })),
        symbolSize: (val: number[]) => symbolSize(val[2]),
        itemStyle: { color: EG_COLOR[eg], opacity: EG_OPACITY[eg], borderWidth: 0 },
        emphasis: { scale: 1.6, itemStyle: { opacity: 1 } },
        progressive: 8000,
        silent: false,
      } as ScatterSeriesOption);
    }

    const option: EChartsCoreOption = {
      animation: false,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0F172A',
        borderWidth: 0,
        padding: [10, 12],
        textStyle: { color: '#F8FAFC', fontSize: 12, fontFamily: 'Inter, sans-serif' },
        formatter: (params: { seriesType?: string; data?: { value: number[]; idx: number } }) => {
          if (params.seriesType !== 'scatter' || !params.data) return '';
          const [lon, lat, mmu, eg, anio] = params.data.value;
          return [
            `<div style="max-width:260px;font-weight:600;line-height:1.35">${geo.nombres[params.data.idx]}</div>`,
            `<div style="margin-top:6px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#CBD5E1">${EG_LABEL[eg]} · presentado ${anio}</div>`,
            `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#CBD5E1">US$ ${fmtMM(mmu)} MM · ${Math.abs(lat).toFixed(1)}°${lat < 0 ? 'S' : 'N'} ${Math.abs(lon).toFixed(1)}°${lon < 0 ? 'O' : 'E'}</div>`,
          ].join('');
        },
      },
      geo: {
        map: 'Chile',
        silent: true,
        itemStyle: { areaColor: '#FFFFFF', borderColor: 'rgba(27,34,51,0.22)', borderWidth: 0.6 },
        aspectScale: 0.82,
      },
      series,
    };
    chart.setOption(option);

    if (onHoverNombre) {
      chart.on('mouseover', (e) => {
        const d = (e as { seriesType?: string; data?: { idx?: number } }).data;
        if (d?.idx != null) onHoverNombre(geo.nombres[d.idx]);
      });
      chart.on('mouseout', () => onHoverNombre(null));
      chart.on('globalout', () => onHoverNombre(null));
    }

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [geo, vista, outline, onHoverNombre]);

  return <div ref={ref} className="h-full w-full" role="img" aria-label={`Mapa de puntos: ${fmtInt(vista.length)} proyectos del SEIA en Chile continental`} />;
}
