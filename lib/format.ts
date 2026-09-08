/** Formateo es-CL (§4): miles ".", decimal ",". Nunca toLocaleString genérico. */

const nfInteger = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const nf2 = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const nfCompact = new Intl.NumberFormat('es-CL', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

export const fmtInt = (n: number) => nfInteger.format(n);
export const fmt1 = (n: number) => nf1.format(n);
export const fmt2 = (n: number) => nf2.format(n);
export const fmtCompact = (n: number) => nfCompact.format(n);

/** US$ MM con separador de miles: 88.383 */
export const fmtMM = (n: number) => nfInteger.format(Math.round(n));

/** US$ MM → billones (10¹²): 1.046.130 MM → "1,05" */
export const fmtBN = (nMM: number) => nf2.format(nMM / 1_000_000);

/** Porcentaje es-CL: 0,936 → "93,6 %" */
export const fmtPct1 = (x: number) => `${nf1.format(x * 100)} %`;

/** Delta firmado con flecha para KPI strip: -7,4 % */
export const fmtDeltaPct = (x: number) =>
  `${x > 0 ? '▲ +' : x < 0 ? '▼ ' : ''}${nf1.format(x * 100)} %`;

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${nfInteger.format(d)} de ${MONTHS[m - 1]} de ${y}`;
};

export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
