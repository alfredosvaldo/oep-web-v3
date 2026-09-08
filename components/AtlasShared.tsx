'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AtlasProject, metrics, money } from '@/lib/atlas';
export function DataState({error,retry}: {error?:string;retry:()=>void}) {return <div className="data-state" role={error?'alert':'status'}><p>{error || 'Cargando el registro de proyectos…'}</p>{error && <button className="atlas-button" onClick={retry}>Reintentar</button>}</div>;}
export function MetricSummary({projects}: {projects:AtlasProject[]}) {const m=metrics(projects);return <dl className="atlas-metrics" aria-live="polite"><div><dt>Inversión declarada · US$ MM</dt><dd>{money(m.investment)}</dd></div><div><dt>Expedientes</dt><dd>{money(m.count)}</dd></div><div><dt>Mediana de tramitación</dt><dd>{m.median==null?'No disponible':`${money(m.median)} días`}</dd><small>{money(m.durationN)} con ambas fechas</small></div></dl>;}
export function ChartLegend(){return <div className="chart-legend"><span><i style={{background:'#df9869'}}/>En evaluación</span><span><i style={{background:'#35bd92'}}/>Aprobado</span><span><i style={{background:'#94a3b8'}}/>Otros estados</span></div>;}
export function CutoffNote(){return <p className="atlas-note">Fuente: SEA · Estado registrado al 30.06.2026. Los años filtran cohortes de presentación; no reconstruyen estados históricos. <Link href="/datos-metodologia/">Datos y metodología ↗</Link></p>;}
export function Sheet({title,close,children}: {title:string;close:()=>void;children:React.ReactNode}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current!, previous=document.activeElement as HTMLElement; el.showModal(); const before=document.body.style.overflow; document.body.style.overflow='hidden';return()=>{el.close();document.body.style.overflow=before;previous?.focus();};},[]);
 return <dialog ref={ref} className="atlas-sheet" aria-labelledby="sheet-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}><div className="sheet-body"><div className="sheet-heading"><p className="oep-kicker">OBSERVATORIO ECONÓMICO DE PERMISOS</p><button autoFocus className="atlas-button" onClick={close} aria-label="Cerrar panel">Cerrar ×</button></div><h2 id="sheet-title" className="oep-headline text-2xl">{title}</h2>{children}</div></dialog>;
}
