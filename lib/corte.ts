/**
 * Corte de datos del sitio. Se cambia UNA vez por trimestre, junto con scripts/build-data.mjs
 * (que lee la base depurada de los informes) y las aserciones de build-data.mjs / check-atlas.mjs.
 */
export const CORTE = {
  periodo: '2026-T3',
  rango: '1993–2026-T3',
  fecha: '30.09.2026',
  expedientes: '26.695',
  inversionBn: '0,87',
} as const;

/** '2026-T3' → '2026-T2' (y '2026-T1' → '2025-T4'). */
export function periodoPrevio(periodo: string): string {
  const [a, t] = periodo.split('-T').map(Number);
  return t === 1 ? `${a - 1}-T4` : `${a}-T${t - 1}`;
}
