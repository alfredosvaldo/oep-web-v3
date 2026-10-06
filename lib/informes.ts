/**
 * Informes trimestrales del OPE. Un informe = una entrada de REPORTS + sus CSV en
 * public/data/informes/<slug>/ (los genera el pipeline R, un CSV por figura).
 * Para sumar un trimestre: copiar los CSV, agregar una entrada y correr scripts/build-report-pdf.sh.
 * Las cifras de los KPI salen de los CSV (components/InformeView.tsx); el texto es editorial.
 */

export type Tipo = 'bar' | 'line' | 'stacked';

export interface Fig {
  file: string;
  n: string;
  titulo: string;
  tipo: Tipo;
  unidad?: string;
  altura?: number;
  max?: number;
  refLinea?: number;
  refTexto?: string;
  fuente?: 'seia' | 'sma';
}

/** Catálogo de figuras: misma numeración y mismo diseño en todos los informes. */
export const FIGS: Record<string, Fig> = {
  f01: { file: 'fig01_proyectos.csv', n: '1', titulo: 'Proyectos ingresados y calificados por trimestre', tipo: 'line', unidad: 'proyectos' },
  f02: { file: 'fig02_inversion.csv', n: '2', titulo: 'Inversión ingresada y calificada (US$ MM)', tipo: 'bar', unidad: 'US$ MM' },
  f03: { file: 'fig03_dias.csv', n: '3', titulo: 'Días promedio de tramitación, por trimestre de calificación', tipo: 'line', unidad: 'días' },
  f04: { file: 'fig04_dias_tipo.csv', n: '4', titulo: 'Días promedio por tipo de proyecto (línea: plazo legal EIA)', tipo: 'line', unidad: 'días', refLinea: 180, refTexto: 'Plazo legal EIA: 180 días' },
  f05: { file: 'fig05_estados_pct.csv', n: '5', titulo: 'Distribución de las resoluciones del trimestre (%)', tipo: 'stacked', unidad: '%', max: 100 },
  f06: { file: 'fig06_proyectos_region.csv', n: '6', titulo: 'Proyectos ingresados por región', tipo: 'stacked', unidad: 'proyectos', altura: 380 },
  f07: { file: 'fig07_inversion_region.csv', n: '7', titulo: 'Inversión ingresada por región (US$ MM)', tipo: 'stacked', unidad: 'US$ MM', altura: 380 },
  f08: { file: 'fig08_proyectos_sector.csv', n: '8', titulo: 'Proyectos ingresados por sector', tipo: 'stacked', unidad: 'proyectos', altura: 380 },
  f09: { file: 'fig09_inversion_sector.csv', n: '9', titulo: 'Inversión ingresada por sector (US$ MM)', tipo: 'stacked', unidad: 'US$ MM', altura: 380 },
  f10: { file: 'fig10_concentracion.csv', n: '10', titulo: 'Porcentaje de la inversión ingresada aportado por el 10% de mayores proyectos', tipo: 'line', unidad: '%' },
  f11: { file: 'fig11_costo_trimestral.csv', n: '11', titulo: 'Costo trimestral de la tramitación ambiental, funding 50% (US$ MM)', tipo: 'bar', unidad: 'US$ MM' },
  f12a: { file: 'fig12a_costo_funding100.csv', n: '12a', titulo: 'Funding 100%', tipo: 'stacked', unidad: 'US$ MM', altura: 280 },
  f12b: { file: 'fig12b_costo_funding50.csv', n: '12b', titulo: 'Funding 50% (base)', tipo: 'stacked', unidad: 'US$ MM', altura: 280 },
  f12c: { file: 'fig12c_costo_funding20.csv', n: '12c', titulo: 'Funding 20%', tipo: 'stacked', unidad: 'US$ MM', altura: 280 },
  f17a: { file: 'fig17a_empleo_intensidad.csv', n: '17a', titulo: 'Intensidad de empleo declarada, por año de ingreso (trabajadores por US$ millón de 2026)', tipo: 'line', unidad: 'trab./US$ MM' },
  f17b: { file: 'fig17b_empleo_pendiente.csv', n: '17b', titulo: 'Empleo declarado pendiente de materializar al cierre del trimestre', tipo: 'bar', unidad: 'trabajadores', altura: 300 },
  f17c: { file: 'fig17c_empleo_materializacion.csv', n: '17c', titulo: 'Empleo declarado en proyectos que inician obras, por trimestre (corregido por cobertura)', tipo: 'bar', unidad: 'trabajadores' },
  f13: { file: 'fig13_costo_sectorial_cohorte.csv', n: '13', titulo: 'Costo sectorial por cohorte de RCA: realizado y latente (US$ MM)', tipo: 'stacked', unidad: 'US$ MM', fuente: 'sma' },
  f14: { file: 'fig14_dias_construccion.csv', n: '14', titulo: 'Días desde la RCA hasta el inicio de obras, por trimestre de inicio', tipo: 'line', unidad: 'días', fuente: 'sma' },
  f15: { file: 'fig15_costo_cohorte_inicio_obras.csv', n: '15', titulo: 'Costo total por cohorte de inicio de obras (US$ MM)', tipo: 'stacked', unidad: 'US$ MM', fuente: 'sma' },
  f16: { file: 'fig16_eps_18m.csv', n: '16', titulo: 'Indicador de Eficiencia de Permisos Sectoriales (EPS): % que inicia obras en 18 meses', tipo: 'bar', unidad: '%', fuente: 'sma' },
};

export interface Bloque {
  figs: string[];
  /** «Qué significa»: una o dos frases. */
  texto?: string;
  /** Línea chica bajo el bloque (p. ej. aviso de escalas). */
  nota?: string;
}

export interface Seccion {
  id: string;
  kicker: string;
  titulo: string;
  bloques: Bloque[];
  como?: string;
}

export interface Informe {
  slug: string;
  periodo: string;
  /** Texto corto para listados: «jul 2026». */
  fecha: string;
  /** Mes y año de publicación: «Octubre 2026». */
  publicado: string;
  meta: string;
  titulo: string;
  lede: string;
  descripcion: string;
  resumen: string[];
  secciones: Seccion[];
  notas: string[];
  tags: string[];
}

export const COMO_ACTIVIDAD =
  'Ingresados: por fecha de presentación. Calificados: aprobados y rechazados, por fecha de calificación. Inversión declarada por el titular, en US$ millones.';
export const COMO_TIEMPOS =
  'Días corridos entre presentación y calificación, solo proyectos aprobados o rechazados, promedio simple por trimestre de calificación. Las resoluciones incluyen todos los estados con fecha de calificación.';
export const COMO_TERRITORIO =
  'Región normalizada (variantes de nombres unificadas). Concentración: participación del decil superior por monto, entre proyectos con inversión declarada.';
export const COMO_EMPLEO =
  'Dotación promedio declarada para la fase de construcción en la DIA o EIA: una proyección ex ante del titular, no empleo observado ni creación neta. Se descartan registros con más de 100 trabajadores por US$ millón (errores de extracción). Intensidad: mediana por año de ingreso, con inversión en US$ de 2026 (CPI-U de EE.UU.). Inicios de obra: hito informado a la SMA, con factor de expansión 3 por cobertura parcial del registro; los stocks se presentan observados.';
export const COMO_COSTO =
  'Costo = inversión × WACC diario sectorial × días. Costo legal: hasta 90 días (DIA) o 180 (EIA). Sobrecosto: hasta la mediana histórica del sector y tipo. Exceso: sobre esa mediana. «Funding» es la fracción de la inversión que se considera inmovilizada. Metodología elaborada junto con SOFOFA.';

export const NOTA_RECALCULO =
  'Los gráficos se recalcularon con el mismo método en todos los informes, a partir de la base depurada de cada trimestre; por eso pueden diferir levemente de lo publicado en su día.';
export const NOTA_SOFOFA = 'La metodología de costo de la tramitación fue elaborada junto con SOFOFA.';
export const NOTA_ESTIMACIONES = 'Estimaciones ex ante de los titulares; no son contrataciones ni inversión ejecutada.';
export const NOTA_DESCARGA = 'Cada gráfico se puede ver como tabla y descargar en CSV o PNG.';
export const NOTA_ORIGINAL = 'El informe original del observatorio incluía además secciones de empleo y de percepción de expertos, que no se reproducen aquí.';

export const REPORTS: Informe[] = [
  /* ------------------------------------------------------------------ 2025-T2 */
  {
    slug: '2025-t2',
    periodo: '2025-T2',
    fecha: 'ago 2025',
    publicado: 'Agosto 2025',
    meta: 'abril–junio 2025',
    titulo: 'Cierre 2025-T2: la inversión ingresada se duplica por un solo proyecto',
    lede: 'Ingresaron 97 proyectos, el nivel más bajo en cuatro años, pero un megaproyecto de hidrógeno verde en Magallanes elevó la inversión declarada a US$ 22.827 millones.',
    descripcion: 'Segundo trimestre de 2025: ingresos y calificaciones, inversión, tiempos de tramitación y concentración.',
    tags: ['SEIA', 'inversión', 'hidrógeno verde', 'tiempos'],
    resumen: [
      'Ingresaron 97 proyectos (−21%), el mínimo de los últimos cuatro años; se calificaron 95, frente a 59 en el trimestre anterior.',
      'La inversión ingresada se duplica a US$ 22.827 millones: Magallanes aporta US$ 16.002 millones (70%) por un solo proyecto. La calificada también se duplica, a US$ 8.584 millones.',
      'Los días de tramitación suben a 464, máximo del período; las DIA (431 días) empujan el promedio y las EIA bajan levemente a 951.',
      'La aprobación llega a 78,8%, el mayor porcentaje del período, y los desistimientos bajan a 13,6%.',
      'La concentración sube: el 10% de mayores proyectos aporta el 89,4% de la inversión ingresada.',
    ],
    secciones: [
      {
        id: 'actividad', kicker: '01 · Actividad', titulo: 'Menos ingresos, más calificaciones y el doble de inversión', como: COMO_ACTIVIDAD,
        bloques: [
          { figs: ['f01'], texto: 'Los 97 ingresos son el mínimo en cuatro años; las calificaciones suben a 95, aún bajo los niveles de 2022.' },
          { figs: ['f02'], texto: 'La inversión ingresada pasa de US$ 11.409 a 22.827 millones, explicada casi por completo por un proyecto en Magallanes.' },
        ],
      },
      {
        id: 'tiempos', kicker: '02 · Tiempos', titulo: 'La tramitación llega a 464 días, un máximo del período', como: COMO_TIEMPOS,
        bloques: [
          { figs: ['f03'] },
          { figs: ['f04'], texto: 'Las DIA, que son más del 90% de los trámites, determinan casi todo el promedio; las EIA superan en general los 900 días.' },
          { figs: ['f05'], texto: 'La aprobación llega a 78,8%, sobre el 45% de su mínimo de 2022; los desistimientos bajan a 13,6%.' },
        ],
      },
      {
        id: 'territorio', kicker: '03 · Territorio y sectores', titulo: 'Magallanes y el sector Otros concentran la inversión que ingresa', como: COMO_TERRITORIO,
        bloques: [
          { figs: ['f06'], texto: 'La Región Metropolitana (21 proyectos), O’Higgins (14) y Los Lagos (9) lideran el ingreso en número.' },
          { figs: ['f07'] },
          { figs: ['f08'] },
          { figs: ['f09'], texto: 'Energía lidera en número (33 proyectos); en monto domina Otros (US$ 16.456 millones), por el proyecto de hidrógeno verde.' },
          { figs: ['f10'], texto: 'El 10% de mayores proyectos aporta el 89,4% de la inversión ingresada, por el efecto de ese proyecto.' },
        ],
      },
    ],
    notas: [
      NOTA_RECALCULO,
      'En 2025-T2 el promedio de días recalculado es 464, frente a unos 440 en el informe original.',
      'El informe original incluía además una sección de costo de la tramitación, que no se reproduce aquí.',
      NOTA_SOFOFA,
      NOTA_ESTIMACIONES,
      NOTA_DESCARGA,
    ],
  },
];

export const bySlug = (slug: string) => REPORTS.find((r) => r.slug === slug);
