/** Tipos y fetchers de la capa geográfica (geo/points.json + geo/chile.json). */

export interface ChileOutline {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    properties: { nombre: string; fuente: string };
    geometry: { type: string; coordinates: never };
  }[];
}


export interface GeoPoints {
  estado_grupo: Record<string, number>;
  anio_ini: number;
  /** [lon, lat, inversion_mmu, estado_grupo_id, anio_presentacion] */
  points: [number, number, number, number, number][];
  /** Nombre del proyecto, paralelo a points. */
  nombres: string[];
}

export const EG_LABEL: Record<number, string> = {
  0: 'Aprobado',
  1: 'En evaluación',
  2: 'Rechazado',
  3: 'Desistido-Caducado',
  4: 'No calificado-No admitido',
};

/** Color por estado_grupo, compartido por MapSection y MapExplorer. */
export const EG_COLOR: Record<number, string> = {
  0: '#0E9F6E',
  1: '#C2703D',
  2: '#9A5830',
  3: '#64748B',
  4: '#CBD5E1',
};

/** Vista continental: el outline Natural Earth 110m no inclula territorio insular. */
export const VISTA_BBOX: { lon: [number, number]; lat: [number, number] } = {
  lon: [-76.5, -66],
  lat: [-56.5, -17],
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

let geoPointsCache: Promise<GeoPoints> | null = null;
export function fetchGeoPoints(): Promise<GeoPoints> {
  // El hero y la sección de mapa comparten la misma descarga (≈3 MB)
  if (!geoPointsCache) {
    geoPointsCache = fetch(`${BASE}/data/geo/points.json`).then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar geo/points.json (${res.status})`);
      return res.json();
    });
  }
  return geoPointsCache;
}

export async function fetchChileOutline(): Promise<ChileOutline> {
  const res = await fetch(`${BASE}/data/geo/chile.json`);
  if (!res.ok) throw new Error(`No se pudo cargar geo/chile.json (${res.status})`);
  return res.json();
}
