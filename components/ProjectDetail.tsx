'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { atlasHref, DEFAULT, readFilters, fetchProject, preciseMoney } from '@/lib/atlas';
import type { ProjectRec } from '@/lib/profile';
import { DataState, Sheet } from './AtlasShared';
export default function ProjectDetail({id,close}: {id:number;close:()=>void}) {
 const [project,setProject]=useState<ProjectRec|null>(null),[error,setError]=useState('');
 const selection=typeof window==='undefined'?{...DEFAULT,project:id}:readFilters(new URLSearchParams(window.location.search));
 const load=()=>{setProject(null);setError('');fetchProject(id).then(setProject).catch(e=>setError(e.message));};useEffect(load,[id]);
 return <Sheet title={project?.n||'Ficha del expediente'} close={close}>{project?<><p className={`detail-status ${project.e==='Aprobado'?'approved':''}`}>{project.e} <span>· al 30.06.2026</span></p><div className="detail-investment"><span>Inversión declarada · US$ MM</span><strong>{preciseMoney(project.m)}</strong></div><dl className="detail-fields">{[['Empresa',project.ti],['Sector',project.s],['Región',project.rg],['Comunas',project.c],['Evaluación',project.t],['Presentación',project.fp],['Calificación',project.fc],['Tramitación',project.dt==null?'No disponible':`${project.dt} días`],['Coordenadas',project.la==null?'No disponibles':`${project.la}, ${project.lo}`],['ID del expediente',project.id]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value??'No disponible'}</dd></div>)}</dl><p className="atlas-note">Días corridos entre presentación y calificación; disponible únicamente cuando existen ambas fechas.</p><div className="detail-actions"><Link className="atlas-button" href={atlasHref({...selection,project:id})}>Ver en mapa</Link><Link className="atlas-button" href={atlasHref({...selection,project:id},'explorador')}>Ver en tabla</Link>{project.lk?<a className="atlas-button primary" href={project.lk} target="_blank" rel="noopener noreferrer">Ver expediente oficial SEA ↗</a>:<p>Enlace oficial no disponible.</p>}<Link className="atlas-button" href={atlasHref({...DEFAULT,status:'all',q:project.ti})}>Explorar empresa →</Link></div></>:<DataState error={error} retry={load}/>}</Sheet>;
}
