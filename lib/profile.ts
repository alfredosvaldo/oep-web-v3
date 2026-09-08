/** Tipos de los perfiles (profiles/*.json, emitidos por scripts/build-data.mjs). */

export interface ProfileKpi {
  proyectos: number;
  inversion_mmu: number;
  aprobados_n: number;
  aprobados_mmu: number;
  evaluacion_n: number;
  evaluacion_mmu: number;
  tasa_aprobacion: number | null;
  mediana_dias: number | null;
}

export interface SerieAnual {
  anio: number;
  proyectos: number;
  inversion_mmu: number;
  aprobados_n: number;
}

export interface BreakdownItem {
  nombre: string;
  proyectos: number;
  inversion_mmu: number;
  slug: string;
}

/** Registro compacto de proyecto (mismo shape que search/index.json). */
export interface ProjectRec {
  id: number;
  n: string;
  t: string;
  rg: string;
  c: string | null;
  tp: string;
  ti: string;
  m: number;
  fp: string;
  a: number;
  q: number;
  e: string;
  eg: string;
  fc: string | null;
  dt: number | null;
  s: string;
  la: number | null;
  lo: number | null;
  lk: string | null;
  ca: boolean;
}

export interface Profile {
  tipo: 'region' | 'sector' | 'titular';
  slug: string;
  nombre: string;
  es_interregional?: boolean;
  rank?: number;
  hallazgo: string | null;
  kpi: ProfileKpi;
  serie_anual: SerieAnual[];
  por_sector?: BreakdownItem[];
  por_region?: BreakdownItem[];
  por_estado?: { estado_grupo: string; proyectos: number; inversion_mmu: number }[];
  top_titulares?: BreakdownItem[];
  ultimos_proyectos?: ProjectRec[];
  proyectos?: ProjectRec[];
  bbox?: [number, number, number, number] | null;
}
