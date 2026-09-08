/** Tipos de los JSON emitidos por scripts/build-data.mjs */

export interface Kpis {
  periodo: string;
  actualizado: string;
  totales: {
    proyectos: number;
    inversion_mmu: number;
    anio_ini: number;
    anio_fin: number;
    regiones: number;
    sectores: number;
    titulares: number;
  };
  aprobados: {
    proyectos: number;
    inversion_mmu: number;
    calificados: number;
    tasa_aprobacion: number;
  };
  evaluacion: { proyectos: number; inversion_mmu: number };
  ultimo_trimestre: {
    periodo: string;
    proyectos: number;
    inversion_mmu: number;
    proyectos_previo: number;
    inversion_mmu_previo: number;
  };
  tramitacion: { dias_p99: number; mediana_dias_total: number };
}

export interface AggItem {
  slug: string;
  nombre: string;
  proyectos: number;
  inversion_mmu: number;
  aprobados_n: number;
  aprobados_mmu: number;
  evaluacion_n: number;
  evaluacion_mmu: number;
  tasa_aprobacion: number | null;
  mediana_dias: number | null;
  mediana_mmu: number | null;
}

export interface AggFile {
  dimension: string;
  items: AggItem[];
}

// Prefijo de despliegue ('' en local, '/oep-web-v2' en GitHub Pages — ver next.config.mjs)
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

export async function fetchKpis(): Promise<Kpis> {
  const res = await fetch(`${BASE}/data/kpis.json`);
  if (!res.ok) throw new Error(`No se pudo cargar kpis.json (${res.status})`);
  return res.json();
}

export async function fetchAgg(dimension: 'region' | 'sector' | 'titular' | 'tipologia' | 'estado'): Promise<AggFile> {
  const res = await fetch(`${BASE}/data/agg/${dimension}.json`);
  if (!res.ok) throw new Error(`No se pudo cargar agg/${dimension}.json (${res.status})`);
  return res.json();
}
