/** Índice compacto de búsqueda del hero (search/index.json, emitido por el pipeline). */

export interface SearchRec {
  n: string;   // nombre del proyecto
  ti: string;  // titular
  rg: string;  // región
  m: number;   // inversión US$ MM
  eg: string;  // estado grupo
  fp: string;  // fecha de presentación (YYYY-MM-DD)
  sea: number | null; // id_expediente SEA (para link directo a la ficha)
}

export interface SearchIndex {
  total: number;
  proyectos: SearchRec[];
}

export const SEA_FICHA = (id: number) =>
  `https://seia.sea.gob.cl/expediente/expediente.php?id_expediente=${id}&modo=ficha`;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

let cache: Promise<SearchIndex> | null = null;

/** Se descarga bajo demanda (≈5 MB raw / ≈1,5 MB gz), típicamente al primer foco en el buscador. */
export function fetchSearchIndex(): Promise<SearchIndex> {
  if (!cache) {
    cache = fetch(`${BASE}/data/search/index.json`).then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar search/index.json (${res.status})`);
      return res.json();
    });
  }
  return cache;
}
