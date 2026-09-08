/** Tipos y fetchers de series temporales y mega-proyectos (Home). */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export interface Quarter {
  periodo: string;
  anio: number;
  trimestre: number;
  proyectos: number;
  inversion_mmu: number;
  aprobados_n: number;
  inversion_aprobada_mmu: number;
  eia_mediana_dias: number | null;
  dia_mediana_dias: number | null;
}

export interface Year {
  anio: number;
  proyectos: number;
  inversion_mmu: number;
  aprobados_n: number;
  eia_n: number;
  eia_mediana_dias: number | null;
  dia_n: number;
  dia_mediana_dias: number | null;
}

export interface Megaproject {
  id: number;
  nombre: string;
  sector: string;
  region: string;
  inversion_mmu: number;
  dias_tramitacion: number | null;
  fecha_calificacion: string;
  estado: string;
  link: string | null;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`No se pudo cargar ${path} (${res.status})`);
  return res.json();
}

export const fetchQuarterly = () => get<{ periodos: Quarter[] }>('/data/timeseries/quarterly.json');
export const fetchAnnual = () => get<{ anios: Year[] }>('/data/timeseries/annual.json');
export const fetchMegaprojects = () => get<{ proyectos: Megaproject[] }>('/data/home/megaprojects.json');
