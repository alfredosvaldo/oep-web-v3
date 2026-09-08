export type Dimension = 'region' | 'sector' | 'titular';
export type Entity = { key: string; name: string; profile: boolean };
export type AtlasProject = { id: number; n: string; ti: string; rg: string; s: string; rk: string; sk: string; tk: string; m: number; lo: number | null; la: number | null; fp: string; fc: string | null; dt: number | null; e: string; eg: string; a: number };
export type AtlasData = { cutoff: string; minYear: number; maxYear: number; projects: AtlasProject[]; entities: Record<Dimension, Entity[]>; counts?: { qualification: number; evaluation: number } };
export type Filters = { q: string; region: string; sector: string; titular: string; status: string; from: number; to: number; project: number | null; sort: string; page: number };
export const DEFAULT: Filters = { q: '', region: '', sector: '', titular: '', status: 'qualification', from: 1993, to: 2026, project: null, sort: 'investment', page: 1 };
export const STATUS = [{ key: 'qualification', label: 'En calificación' }, { key: 'approved', label: 'Aprobados' }, { key: 'all', label: 'Todos los expedientes' }, { key: 'evaluation', label: 'En evaluación (incluye admisión)' }, { key: 'rejected', label: 'Rechazados' }, { key: 'withdrawn', label: 'Desistidos / caducados' }, { key: 'other', label: 'No calificados / no admitidos' }];
export const dimensionKey = { region: 'rk', sector: 'sk', titular: 'tk' } as const;
export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const money = (n: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n);
export const preciseMoney = (n: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 6 }).format(n);
export function readFilters(params: URLSearchParams, defaults = DEFAULT): Filters {
  const year = (k: string, fallback: number) => { const n = Number(params.get(k)); return params.has(k) && Number.isFinite(n) ? Math.max(1993, Math.min(2026, Math.trunc(n))) : fallback; };
  const from = year('from', defaults.from), to = year('to', defaults.to);
  const id = Number(params.get('project'));
  return { q: params.get('q') ?? defaults.q, region: params.get('region') ?? defaults.region, sector: params.get('sector') ?? defaults.sector, titular: params.get('titular') ?? defaults.titular, status: STATUS.some(s => s.key === params.get('status')) ? params.get('status')! : defaults.status, from: Math.min(from,to), to: Math.max(from,to), project: Number.isSafeInteger(id) && id > 0 ? id : null, sort: ['investment','recent','name'].includes(params.get('sort')!) ? params.get('sort')! : 'investment', page: Math.max(1, Math.floor(Number(params.get('page')) || 1)) };
}
export function paramsFor(f: Filters) { const p = new URLSearchParams(); Object.entries(f).forEach(([k,v]) => { if (v !== null && v !== '') p.set(k,String(v)); }); return p; }
export const atlasHref = (f: Filters, view = 'mapa') => `/${view}/?${paramsFor(f)}`;
export function matchesStatus(p: AtlasProject, status: string) { return status === 'all' || (status === 'qualification' ? p.e === 'En Calificación' : status === 'approved' ? p.e === 'Aprobado' : status === 'evaluation' ? p.eg === 'En evaluación' : status === 'rejected' ? p.e === 'Rechazado' : status === 'withdrawn' ? p.eg === 'Desistido-Caducado' : p.eg === 'No calificado-No admitido'); }
export function filterProjects(projects: AtlasProject[], f: Filters) {
  const q = normalize(f.q);
  return projects.filter(p => p.a >= f.from && p.a <= f.to && matchesStatus(p,f.status) && (!f.region || p.rk === f.region) && (!f.sector || p.sk === f.sector) && (!f.titular || p.tk === f.titular) && (!q || normalize(`${p.n} ${p.ti} ${p.rg} ${p.s}`).includes(q)));
}
export function metrics(projects: AtlasProject[]) {
  const durations = projects.flatMap(p => p.dt == null ? [] : [p.dt]).sort((a,b)=>a-b);
  const approved = projects.filter(p=>p.e==='Aprobado').length;
  const qualified = projects.filter(p=>p.e==='Aprobado'||p.e==='Rechazado').length;
  return { count: projects.length, investment: projects.reduce((s,p)=>s+p.m,0), mapped: projects.filter(hasCoords).length, approved, qualified, approvalRate: qualified ? approved / qualified : null, qualificationRate: projects.length ? qualified / projects.length : null, durationN: durations.length, median: durations.length ? (durations[Math.floor((durations.length-1)/2)] + durations[Math.floor(durations.length/2)])/2 : null };
}
export const hasCoords = (p: AtlasProject) => p.lo !== null && p.la !== null;
export const continental = (p: AtlasProject) => hasCoords(p) && p.lo! >= -76.5 && p.lo! <= -66 && p.la! >= -56.5 && p.la! <= -17;
export const statusColor = (p: AtlasProject) => p.e === 'Aprobado' ? '#35bd92' : p.eg === 'En evaluación' ? '#df9869' : '#94a3b8';
export function breakdown(projects: AtlasProject[], dimension: Dimension) {
  const map = new Map<string, {key: string; name: string; count: number; investment: number}>();
  for(const p of projects) { const key = p[dimensionKey[dimension]]; const value = map.get(key) ?? { key, name: p[dimension === 'region' ? 'rg' : dimension === 'sector' ? 's' : 'ti'], count: 0, investment: 0 }; value.count++; value.investment += p.m; map.set(key,value); }
  return Array.from(map.values()).sort((a,b)=>b.investment-a.investment);
}
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export async function getJson<T>(file: string): Promise<T> { const response = await fetch(`${BASE}/data/${file}`); if(!response.ok) throw new Error('No se pudo cargar el registro.'); return response.json(); }
let cache: Promise<AtlasData> | null = null;
export function fetchAtlas(): Promise<AtlasData> {
  if(!cache) cache = getJson<any>('atlas/index.json').then(raw=>({ ...raw, projects: raw.rows.map((r: any[])=>{ const region=raw.entities.region[r[2]], sector=raw.entities.sector[r[3]], company=raw.entities.titular[r[4]]; return {id:r[0], n:r[1], rg:region.name, rk:region.key, s:sector.name, sk:sector.key, ti:company.name, tk:company.key, m:r[5], lo:r[6], la:r[7], fp:r[8], fc:r[9], dt:r[10], e:raw.statuses[r[11]], eg:raw.groups[r[12]], a:Number(r[8].slice(0,4))}; }) })).catch(error=>{cache=null; throw error;});
  return cache;
}
let lookup: Promise<Record<string,string>> | null = null;
const chunks = new Map<string, Promise<import('./profile').ProjectRec[]>>();
export async function fetchProject(id: number) {
  if(!lookup) lookup = getJson<Record<string,string>>('atlas/lookup.json').catch(e=>{lookup=null;throw e;});
  const file=(await lookup)[id]; if(!file) throw new Error('El expediente no está en este corte de datos.');
  if(!chunks.has(file)) chunks.set(file,getJson<import('./profile').ProjectRec[]>(file).catch(e=>{chunks.delete(file);throw e;}));
  const project=(await chunks.get(file)!).find(p=>p.id===id); if(!project) throw new Error('Expediente no disponible.'); return project;
}
