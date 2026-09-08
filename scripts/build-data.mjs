#!/usr/bin/env node
/**
 * OEP — Pipeline de datos (§2 del brief).
 * Lee data/raw/SEIA_TOTAL_93_26Q2.xlsx → aplica limpieza → emite public/data/.
 * Falla en voz alta (exit 1) si el conteo de filas difiere de 30.119 o si los
 * totales se alejan > 1 % de los hechos semilla (§2).
 */
import pkg from 'xlsx';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { readFile, utils } = pkg;
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ROOT, 'data/raw/SEIA_TOTAL_93_26Q2.xlsx');
const OUT = path.join(ROOT, 'public/data');

/* ---------------------------------------------------------------- helpers */

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

/** Excel serial (epoch 1899-12-30) → {iso, anio, trimestre}. Fracción = hora (ruido), se descarta. */
function serialToDate(serial) {
  if (typeof serial !== 'number' || !isFinite(serial) || serial <= 0) return null;
  const ms = Math.floor(serial - 25569) * 86400000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return null;
  return d;
}
const iso = (d) => d.toISOString().slice(0, 10);

const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const percentile = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

/* ------------------------------------------------------------ regla 1: región */

const REGIONES_16 = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
  'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
];
const INTERREGIONAL = 'Interregional / Nacional';

function normalizeRegion(raw) {
  if (raw == null) return null;
  const r = String(raw).trim();
  if (r === 'Dirección Ejecutiva' || r === 'Interregional') return INTERREGIONAL;
  const base = r.replace(/^Región\s+(?:(?:de|del|de la)\s+)?/i, '');
  const alias = {
    'Metropolitana de Santiago': 'Metropolitana',
    'Magallanes y Antártica Chilena': 'Magallanes',
    'Magallanes y de la Antártica Chilena': 'Magallanes',
    'Aysén del General Carlos Ibáñez del Campo': 'Aysén',
    'Los Lagos': 'Los Lagos',
    'Los Ríos': 'Los Ríos',
    'La Araucanía': 'La Araucanía',
    "Libertador General Bernardo O'Higgins": "O'Higgins",
  };
  if (alias[base]) return alias[base];
  if (REGIONES_16.includes(base)) return base;
  throw new Error(`Región sin mapear: ${JSON.stringify(raw)}`);
}

/* ------------------------------------------------------------ regla 2: coordenadas */

function cleanCoords(lat, lon) {
  lat = Number(lat);
  lon = Number(lon);
  if (!isFinite(lat) || !isFinite(lon)) return null;
  // Corruptas: valores que no son grados decimales (p. ej. Web-Mercator en metros).
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  // Grados válidos: se conservan aunque caigan fuera de la caja continental
  // (Rapa Nui y Juan Fernández son geografía chilena real).
  return [Math.round(lon * 1e4) / 1e4, Math.round(lat * 1e4) / 1e4];
}

/* ------------------------------------------------------------ regla 3: titular */

const ACRONYMS = new Set([
  'ENAP', 'ENAMI', 'CODELCO', 'MOP', 'MINVU', 'MMA', 'SEA', 'SMA', 'SII', 'CORFO',
  'CONAF', 'CONADI', 'CMPC', 'CAP', 'AES', 'CGE', 'CTC', 'ENTEL', 'COPEC', 'ESSBIO',
  'ESVAL', 'AGUAS', 'ANDINA', 'CLP', 'EDELMAG', 'E.CL', 'ECL', 'SAESA', 'CONSTRUCCIONES',
  'INVERSIONES', 'HOTELERA', 'INMOBILIARIA', 'SONDA', 'COLBÚN', 'LSG', 'SK', 'KDM',
  'GBM', 'IKEA', 'WALMART', 'CMF', 'FCh', 'CCHEN', 'CDC', 'CGE', 'CHILQUINTA',
]);
const LEGAL_FORMS = {
  sa: 'S.A.', spa: 'SpA', ltda: 'Ltda.', sac: 'S.A.C.', eirl: 'E.I.R.L.',
  cl: 'Ltda.', saic: 'S.A.', sabi: 'S.A.',
};
const LOWERCASE_WORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'en', 'a', 'al', 'por', 'con', 'su', 'sus']);

const titularKey = (raw) =>
  String(raw ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isShouty = (s) => {
  const letters = s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length;
  return upper / letters.length > 0.85;
};

function titleCasePreserve(raw) {
  const words = String(raw).trim().split(/\s+/);
  return words
    .map((w, i) => {
      const bare = w.replace(/[.,]/g, '').toLowerCase();
      if (LEGAL_FORMS[bare]) return LEGAL_FORMS[bare];
      if (ACRONYMS.has(w.toUpperCase()) || /^[A-Z]{2,}$/.test(w.replace(/[.,]/g, '')) && w.replace(/[.,]/g, '').length <= 6) return w.toUpperCase();
      if (i > 0 && LOWERCASE_WORDS.has(bare)) return bare;
      return bare.charAt(0).toUpperCase() + bare.slice(1);
    })
    .join(' ');
}

function displayTitular(raw) {
  const t = String(raw ?? '').replace(/\s+/g, ' ').trim().replace(/[,;]+$/, '');
  if (!t) return 'Sin titular registrado';
  return isShouty(t) ? titleCasePreserve(t) : t;
}

/* ------------------------------------------------------------ regla 4: derivados */

const ESTADO_GRUPO = {
  'Aprobado': 'Aprobado',
  'En Calificación': 'En evaluación',
  'En Admisión': 'En evaluación',
  'Rechazado': 'Rechazado',
  'Desistido': 'Desistido-Caducado',
  'Caducado': 'Desistido-Caducado',
  'Abandonado': 'Desistido-Caducado',
  'Revocado': 'Desistido-Caducado',
  'Renuncia RCA': 'Desistido-Caducado',
  'No calificado': 'No calificado-No admitido',
  'No Admitido a Tramitación': 'No calificado-No admitido',
};

/* --------------------------------------------------------------- aserciones */

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${actual}${ok ? '' : ` (esperado ${expected})`}`);
}
function assertNear(label, actual, expected, tol = 0.01) {
  const ok = Math.abs(actual - expected) <= Math.abs(expected) * tol;
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${actual}${ok ? '' : ` (esperado ±1% de ${expected})`}`);
}

/* ================================================================== main */

console.log('Leyendo', SRC);
const wb = readFile(SRC);
const raw = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
console.log(`Filas crudas: ${raw.length}`);

/* --- pase 1: limpieza fila a fila --- */
const projects = [];
const titularGroups = new Map(); // key -> Map(displayCandidate -> count)

for (const r of raw) {
  const fp = serialToDate(r.fecha_presentacion);
  const fc = serialToDate(r.fecha_calificacion);
  const estado = String(r.estado ?? '').trim();
  const grupo = ESTADO_GRUPO[estado];
  if (!fp) throw new Error(`fecha_presentacion inválida en fila: ${JSON.stringify(r.nombre)}`);
  if (!grupo) throw new Error(`estado sin mapear: ${JSON.stringify(r.estado)}`);

  const tKey = titularKey(r.titular) || 'sin-titular-registrado';
  if (!titularGroups.has(tKey)) titularGroups.set(tKey, new Map());
  const variants = titularGroups.get(tKey);
  const rawT = String(r.titular ?? '').replace(/\s+/g, ' ').trim();
  variants.set(rawT, (variants.get(rawT) || 0) + 1);

  const mmu = Number(r.inversion_mmu);
  projects.push({
    id: Number(String(r.combined_numbers).trim()),
    nombre: String(r.nombre ?? '').replace(/\s+/g, ' ').trim(),
    tipo: String(r.tipo ?? '').trim(),
    region: normalizeRegion(r.region),
    comunas: r.comunas == null ? null : String(r.comunas).trim(),
    provincias: r.provincias == null ? null : String(r.provincias).trim(),
    tipologia: String(r.tipologia ?? '').trim(),
    razon_ingreso: String(r.razon_de_ingreso ?? '').trim(),
    titular_key: tKey,
    inversion_mmu: isFinite(mmu) ? mmu : 0,
    fecha_presentacion: iso(fp),
    anio: fp.getUTCFullYear(),
    trimestre: Math.floor(fp.getUTCMonth() / 3) + 1,
    estado,
    estado_grupo: grupo,
    fecha_calificacion: fc ? iso(fc) : null,
    dias_tramitacion: fc ? Math.round(Number(r.fecha_calificacion) - Number(r.fecha_presentacion)) : null,
    calificado: estado === 'Aprobado' || estado === 'Rechazado',
    sector: String(r.sector_productivo ?? '').trim(),
    coords: cleanCoords(r.latitud_punto_representativo, r.longitud_punto_representativo),
    link: typeof r.link === 'string' && r.link.startsWith('http') ? r.link.trim() : null,
  });
}

/* --- pase 2: nombre canónico de titulares (variante más frecuente, shouty → title case) --- */
const titularNames = new Map();
for (const [key, variants] of titularGroups) {
  const best = [...variants.entries()].sort((a, b) => b[1] - a[1])[0][0];
  titularNames.set(key, displayTitular(best));
}
for (const p of projects) p.titular = titularNames.get(p.titular_key);

/* --- identidad compartida: nunca inferir IDs desde la posición --- */
const ids = new Set();
for (const p of projects) {
  if (!Number.isSafeInteger(p.id) || ids.has(p.id)) throw new Error(`ID inválido o duplicado: ${p.id}`);
  ids.add(p.id);
}

/* --- chequeos de cobertura --- */
const regiones = new Set(projects.map((p) => p.region));
const faltantes = REGIONES_16.filter((r) => !regiones.has(r));
if (faltantes.length) throw new Error(`Regiones oficiales sin datos: ${faltantes.join(', ')}`);
if (!regiones.has(INTERREGIONAL)) throw new Error('Falta bucket Interregional / Nacional');

const nCoords = projects.filter((p) => p.coords).length;
console.log(`\nCoordenadas válidas: ${nCoords}/${projects.length} (nulas/corruptas: ${projects.length - nCoords})`);
console.log(`Titulares canónicos: ${titularNames.size} (${titularGroups.size === titularNames.size ? 'ok' : 'ERROR'})`);

/* ============================================================ agregaciones */

function aggBy(keyFn) {
  const m = new Map();
  for (const p of projects) {
    const k = keyFn(p);
    if (!m.has(k)) {
      m.set(k, {
        proyectos: 0, inversion_mmu: 0, aprobados_n: 0, aprobados_mmu: 0,
        evaluacion_n: 0, evaluacion_mmu: 0, calificados_n: 0, rechazados_n: 0,
        dias: [], mmu_values: [],
      });
    }
    const a = m.get(k);
    a.proyectos++;
    a.inversion_mmu += p.inversion_mmu;
    a.mmu_values.push(p.inversion_mmu);
    if (p.estado_grupo === 'Aprobado') { a.aprobados_n++; a.aprobados_mmu += p.inversion_mmu; }
    if (p.estado_grupo === 'En evaluación') { a.evaluacion_n++; a.evaluacion_mmu += p.inversion_mmu; }
    if (p.calificado) {
      a.calificados_n++;
      if (p.estado === 'Rechazado') a.rechazados_n++;
    }
    if (p.dias_tramitacion != null) a.dias.push(p.dias_tramitacion);
  }
  return m;
}

const toAgg = (dim, m, nameOf) => ({
  dimension: dim,
  items: [...m.entries()]
    .map(([k, a]) => ({
      slug: slugify(k),
      nombre: nameOf ? nameOf(k) : k,
      proyectos: a.proyectos,
      inversion_mmu: a.inversion_mmu,
      aprobados_n: a.aprobados_n,
      aprobados_mmu: a.aprobados_mmu,
      evaluacion_n: a.evaluacion_n,
      evaluacion_mmu: a.evaluacion_mmu,
      tasa_aprobacion: a.calificados_n ? (a.calificados_n - a.rechazados_n) / a.calificados_n : null,
      mediana_dias: a.dias.length ? Math.round(median(a.dias)) : null,
      mediana_mmu: a.mmu_values.length ? round1(median(a.mmu_values)) : null,
    }))
    .sort((a, b) => b.inversion_mmu - a.inversion_mmu),
});

const regionAgg = toAgg('region', aggBy((p) => p.region));
const sectorAgg = toAgg('sector', aggBy((p) => p.sector));
const titularAgg = toAgg('titular', aggBy((p) => p.titular));
const companySlugs = new Set();
for (const it of titularAgg.items) {
  const base = it.slug;
  let suffix = 2;
  while (companySlugs.has(it.slug)) it.slug = `${base}-${suffix++}`;
  companySlugs.add(it.slug);
}
const companyKey = new Map(titularAgg.items.map(it => [it.nombre, it.slug]));
const tipologiaAgg = toAgg('tipologia', aggBy((p) => p.tipologia));
const estadoAgg = toAgg('estado', aggBy((p) => p.estado), (k) => k);

/* --- serie trimestral --- */
const qMap = new Map();
for (const p of projects) {
  const k = `${p.anio}-T${p.trimestre}`;
  if (!qMap.has(k)) qMap.set(k, { periodo: k, anio: p.anio, trimestre: p.trimestre, proyectos: 0, inversion_mmu: 0, aprobados_n: 0, inversion_aprobada_mmu: 0, dias_eia: [], dias_dia: [] });
  const q = qMap.get(k);
  q.proyectos++;
  q.inversion_mmu += p.inversion_mmu;
  if (p.estado === 'Aprobado') { q.aprobados_n++; q.inversion_aprobada_mmu += p.inversion_mmu; }
  if (p.dias_tramitacion != null) (p.tipo === 'EIA' ? q.dias_eia : q.dias_dia).push(p.dias_tramitacion);
}
const quarterly = [...qMap.values()]
  .sort((a, b) => a.anio - b.anio || a.trimestre - b.trimestre)
  .map((q) => ({
    periodo: q.periodo, anio: q.anio, trimestre: q.trimestre,
    proyectos: q.proyectos, inversion_mmu: q.inversion_mmu,
    aprobados_n: q.aprobados_n, inversion_aprobada_mmu: Math.round(q.inversion_aprobada_mmu),
    eia_n: q.dias_eia.length, dia_n: q.dias_dia.length,
    eia_mediana_dias: q.dias_eia.length >= 5 ? Math.round(median(q.dias_eia)) : null,
    dia_mediana_dias: q.dias_dia.length >= 5 ? Math.round(median(q.dias_dia)) : null,
  }));

/* --- serie anual (medianas de tramitación por tipo de evaluación) --- */
const yMap = new Map();
for (const p of projects) {
  if (!yMap.has(p.anio)) yMap.set(p.anio, { anio: p.anio, proyectos: 0, inversion_mmu: 0, aprobados_n: 0, dias_eia: [], dias_dia: [] });
  const y = yMap.get(p.anio);
  y.proyectos++;
  y.inversion_mmu += p.inversion_mmu;
  if (p.estado === 'Aprobado') y.aprobados_n++;
  if (p.dias_tramitacion != null) (p.tipo === 'EIA' ? y.dias_eia : y.dias_dia).push(p.dias_tramitacion);
}
const annual = [...yMap.values()].sort((a, b) => a.anio - b.anio).map((y) => ({
  anio: y.anio,
  proyectos: y.proyectos,
  inversion_mmu: y.inversion_mmu,
  aprobados_n: y.aprobados_n,
  eia_n: y.dias_eia.length,
  eia_mediana_dias: y.dias_eia.length >= 3 ? Math.round(median(y.dias_eia)) : null,
  dia_n: y.dias_dia.length,
  dia_mediana_dias: y.dias_dia.length >= 3 ? Math.round(median(y.dias_dia)) : null,
}));

/* --- jerarquía sector → tipología para treemap (área = inversión) --- */
const sectorTipologia = sectorAgg.items.map((s) => {
  const list = projects.filter((p) => p.sector === s.nombre);
  const byTip = new Map();
  for (const p of list) {
    if (!byTip.has(p.tipologia)) {
      byTip.set(p.tipologia, { codigo: p.tipologia, proyectos: 0, inversion_mmu: 0, eg: {} });
    }
    const t = byTip.get(p.tipologia);
    t.proyectos++;
    t.inversion_mmu += p.inversion_mmu;
    t.eg[p.estado_grupo] = (t.eg[p.estado_grupo] || 0) + 1;
  }
  const EG_ORDER = ['Aprobado', 'En evaluación', 'Rechazado', 'Desistido-Caducado', 'No calificado-No admitido'];
  return {
    sector: s.nombre,
    slug: s.slug,
    inversion_mmu: s.inversion_mmu,
    tipologias: [...byTip.values()]
      .map((t) => ({
        codigo: t.codigo,
        proyectos: t.proyectos,
        inversion_mmu: t.inversion_mmu,
        estado_predominante: EG_ORDER.reduce((best, g) => (t.eg[g] || 0) > (t.eg[best] || 0) ? g : best),
      }))
      .sort((a, b) => b.inversion_mmu - a.inversion_mmu)
      .slice(0, 14),
  };
});

/* --- mega-proyectos aprobados más recientes (Home §5.1.4) --- */
const megaprojects = projects
  .filter((p) => p.estado === 'Aprobado' && p.inversion_mmu >= 100 && p.fecha_calificacion)
  .sort((a, b) => (a.fecha_calificacion < b.fecha_calificacion ? 1 : -1))
  .slice(0, 7)
  .map((p) => ({
    id: p.id, nombre: p.nombre, sector: p.sector, region: p.region,
    inversion_mmu: p.inversion_mmu, dias_tramitacion: p.dias_tramitacion,
    fecha_calificacion: p.fecha_calificacion, estado: p.estado, link: p.link,
  }));

/* --- p99 de días (display winsorizado; el valor almacenado queda intacto) --- */
const allDias = projects.filter((p) => p.dias_tramitacion != null).map((p) => p.dias_tramitacion);
const p99Dias = percentile(allDias, 0.99);

/* --- KPIs globales --- */
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const totalMmu = sum(projects, (p) => p.inversion_mmu);
const aprob = projects.filter((p) => p.estado === 'Aprobado');
const calif = projects.filter((p) => p.calificado);
// KPI "cartera en evaluación" sigue la cifra oficial SEA = estado "En Calificación"
// (365 / US$ 88.383 MM, §2). "En Admisión" (1 proyecto) sigue mapeado a estado_grupo
// "En evaluación" por semántica, pero no entra al KPI.
const evalu = projects.filter((p) => p.estado === 'En Calificación');
const lastQ = quarterly[quarterly.length - 1];
const prevQ = quarterly[quarterly.length - 2];

const kpis = {
  periodo: '2026-T2',
  actualizado: '2026-06-30',
  totales: {
    proyectos: projects.length,
    inversion_mmu: totalMmu,
    anio_ini: Math.min(...projects.map((p) => p.anio)),
    anio_fin: Math.max(...projects.map((p) => p.anio)),
    regiones: REGIONES_16.length,
    sectores: sectorAgg.items.length,
    titulares: titularAgg.items.length,
  },
  aprobados: {
    proyectos: aprob.length,
    inversion_mmu: sum(aprob, (p) => p.inversion_mmu),
    calificados: calif.length,
    tasa_aprobacion: aprob.length / calif.length,
  },
  evaluacion: {
    proyectos: evalu.length,
    inversion_mmu: sum(evalu, (p) => p.inversion_mmu),
  },
  ultimo_trimestre: {
    periodo: lastQ.periodo,
    proyectos: lastQ.proyectos,
    inversion_mmu: lastQ.inversion_mmu,
    proyectos_previo: prevQ.proyectos,
    inversion_mmu_previo: prevQ.inversion_mmu,
  },
  tramitacion: {
    dias_p99: p99Dias,
    mediana_dias_total: Math.round(median(allDias)),
  },
};

/* ============================================================ emisión */

async function emit(file, data) {
  const full = path.join(OUT, file);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, JSON.stringify(data));
  return full;
}

console.log('\nEscribiendo public/data/ …');
const written = [];
written.push(await emit('kpis.json', kpis));
written.push(await emit('agg/region.json', regionAgg));
written.push(await emit('agg/sector.json', sectorAgg));
written.push(await emit('agg/titular.json', titularAgg));
written.push(await emit('agg/tipologia.json', tipologiaAgg));
written.push(await emit('agg/estado.json', estadoAgg));
written.push(await emit('timeseries/quarterly.json', { periodos: quarterly }));
written.push(await emit('timeseries/annual.json', { anios: annual }));
written.push(await emit('agg/sector-tipologia.json', { sectores: sectorTipologia }));
written.push(await emit('home/megaprojects.json', { proyectos: megaprojects }));

/* --- geo/points.json: [lon, lat, mmu, estado_grupo_id, anio] + nombres paralelos --- */
const EG_ID = { 'Aprobado': 0, 'En evaluación': 1, 'Rechazado': 2, 'Desistido-Caducado': 3, 'No calificado-No admitido': 4 };
const geoProjects = projects.filter((p) => p.coords);
written.push(await emit('geo/points.json', {
  estado_grupo: EG_ID,
  anio_ini: kpis.totales.anio_ini,
  points: geoProjects.map((p) => [p.coords[0], p.coords[1], p.inversion_mmu, EG_ID[p.estado_grupo], p.anio]),
  nombres: geoProjects.map((p) => p.nombre),
}));

/* --- búsqueda: chunks + manifiesto (dobla como ficha de proyecto) --- */
const CHUNK = 6000;
const searchRec = (p) => ({
  id: p.id, n: p.nombre, t: p.tipo, rg: p.region, c: p.comunas, tp: p.tipologia,
  ti: p.titular, m: p.inversion_mmu, fp: p.fecha_presentacion, a: p.anio, q: p.trimestre,
  e: p.estado, eg: p.estado_grupo, fc: p.fecha_calificacion, dt: p.dias_tramitacion,
  s: p.sector, la: p.coords ? p.coords[1] : null, lo: p.coords ? p.coords[0] : null,
  lk: p.link, ca: p.calificado,
});
const sorted = [...projects].sort((a, b) => a.fecha_presentacion < b.fecha_presentacion ? -1 : 1);
const chunks = Math.ceil(sorted.length / CHUNK);
const manifest = { total: sorted.length, chunk_size: CHUNK, chunks, files: [] };
for (let i = 0; i < chunks; i++) {
  const f = `search/projects-${String(i).padStart(2, '0')}.json`;
  manifest.files.push(f);
  written.push(await emit(f, sorted.slice(i * CHUNK, (i + 1) * CHUNK).map(searchRec)));
}
written.push(await emit('search/projects.json', manifest));

/* Atlas: diccionarios + tuplas, sin redondear valores monetarios. */
const entities = Object.fromEntries(['region', 'sector', 'titular'].map(dim => {
  const agg = dim === 'region' ? regionAgg : dim === 'sector' ? sectorAgg : titularAgg;
  return [dim, agg.items.map((it, i) => ({ key: it.slug, name: it.nombre, profile: dim !== 'titular' || i < 500 }))];
}));
for (const [dim, list] of Object.entries(entities)) {
  if (new Set(list.map(e => e.key)).size !== list.length) throw new Error(`Claves duplicadas: ${dim}`);
}
const atlasRec = p => ({ id: p.id, n: p.nombre, ti: p.titular, rg: p.region, s: p.sector,
  rk: slugify(p.region), sk: slugify(p.sector), tk: companyKey.get(p.titular), m: p.inversion_mmu,
  lo: p.coords?.[0] ?? null, la: p.coords?.[1] ?? null, fp: p.fecha_presentacion,
  fc: p.fecha_calificacion, dt: p.dias_tramitacion, e: p.estado, eg: p.estado_grupo, a: p.anio });
const dictionaries = Object.fromEntries(['region','sector','titular'].map(dim => [dim, new Map(entities[dim].map((e,i) => [e.key,i]))]));
const statuses = [...new Set(projects.map(p => p.estado))];
const groups = [...new Set(projects.map(p => p.estado_grupo))];
written.push(await emit('atlas/index.json', {
  cutoff: kpis.actualizado, minYear: kpis.totales.anio_ini, maxYear: kpis.totales.anio_fin,
  entities, statuses, groups,
  columns: ['id','name','region','sector','company','investment','lon','lat','presented','qualified','days','status','group'],
  rows: sorted.map(p => [p.id,p.nombre,dictionaries.region.get(slugify(p.region)),dictionaries.sector.get(slugify(p.sector)),dictionaries.titular.get(companyKey.get(p.titular)),p.inversion_mmu,p.coords?.[0] ?? null,p.coords?.[1] ?? null,p.fecha_presentacion,p.fecha_calificacion,p.dias_tramitacion,statuses.indexOf(p.estado),groups.indexOf(p.estado_grupo)])
}));
written.push(await emit('atlas/lookup.json', Object.fromEntries(sorted.map((p,i) => [p.id, manifest.files[Math.floor(i / CHUNK)]]))));
written.push(await emit('atlas/summary.json', {
  cutoff: kpis.actualizado, minYear: kpis.totales.anio_ini, maxYear: kpis.totales.anio_fin,
  projects: evalu.map(atlasRec), entities: { region: entities.region, sector: entities.sector, titular: [] },
  coverage: { total: projects.length, coordinates: nCoords, companies: titularNames.size },
  counts: { qualification: evalu.length, evaluation: projects.filter(p => p.estado_grupo === 'En evaluación').length }
}));


/* --- índice compacto para la búsqueda del hero (mismo orden que los chunks) --- */
const SEA_RE = /id_expediente=(\d+)/;
const heroIndex = sorted.map((p) => {
  const m = p.link ? p.link.match(SEA_RE) : null;
  return { n: p.nombre, ti: p.titular, rg: p.region, m: p.inversion_mmu, eg: p.estado_grupo, fp: p.fecha_presentacion, sea: m ? Number(m[1]) : null };
});
written.push(await emit('search/index.json', { total: heroIndex.length, proyectos: heroIndex }));

/* --- perfiles --- */
const byTitularTop = titularAgg.items.slice(0, 500);
const profileProjects = (list) =>
  [...list].sort((a, b) => (b.fecha_presentacion > a.fecha_presentacion ? 1 : -1)).slice(0, 12).map(searchRec);

function kpiBlock(list) {
  const ap = list.filter((p) => p.estado === 'Aprobado');
  const ev = list.filter((p) => p.estado_grupo === 'En evaluación');
  const cl = list.filter((p) => p.calificado);
  const dias = list.filter((p) => p.dias_tramitacion != null).map((p) => p.dias_tramitacion);
  return {
    proyectos: list.length,
    inversion_mmu: sum(list, (p) => p.inversion_mmu),
    aprobados_n: ap.length,
    aprobados_mmu: sum(ap, (p) => p.inversion_mmu),
    evaluacion_n: ev.length,
    evaluacion_mmu: sum(ev, (p) => p.inversion_mmu),
    tasa_aprobacion: cl.length ? ap.length / cl.length : null,
    mediana_dias: dias.length ? Math.round(median(dias)) : null,
  };
}

function annualSeries(list) {
  const m = new Map();
  for (const p of list) {
    if (!m.has(p.anio)) m.set(p.anio, { anio: p.anio, proyectos: 0, inversion_mmu: 0, aprobados_n: 0 });
    const a = m.get(p.anio);
    a.proyectos++;
    a.inversion_mmu += p.inversion_mmu;
    if (p.estado === 'Aprobado') a.aprobados_n++;
  }
  return [...m.values()].sort((a, b) => a.anio - b.anio).map((a) => ({ ...a, inversion_mmu: a.inversion_mmu }));
}

function breakdown(list, key) {
  const m = new Map();
  for (const p of list) {
    // 'sector' | 'region' | 'titular'. Antes solo distinguía 'sector' y caía
    // en región para todo lo demás: «Principales titulares» listaba regiones.
    const k = p[key];
    if (!m.has(k)) m.set(k, { nombre: k, proyectos: 0, inversion_mmu: 0 });
    const b = m.get(k);
    b.proyectos++;
    b.inversion_mmu += p.inversion_mmu;
  }
  return [...m.values()].sort((a, b) => b.inversion_mmu - a.inversion_mmu).map((b) => ({ ...b, inversion_mmu: b.inversion_mmu, slug: slugify(b.nombre) }));
}

for (const item of regionAgg.items) {
  const list = projects.filter((p) => p.region === item.nombre);
  const pts = list.filter((p) => p.coords).map((p) => p.coords);
  written.push(await emit(`profiles/region-${item.slug}.json`, {
    tipo: 'region', slug: item.slug, nombre: item.nombre,
    es_interregional: item.nombre === INTERREGIONAL,
    hallazgo: null,
    kpi: kpiBlock(list),
    serie_anual: annualSeries(list),
    por_sector: breakdown(list, 'sector'),
    top_titulares: breakdown(list, 'titular').slice(0, 10),
    ultimos_proyectos: profileProjects(list),
    bbox: pts.length ? [Math.min(...pts.map((c) => c[0])), Math.min(...pts.map((c) => c[1])), Math.max(...pts.map((c) => c[0])), Math.max(...pts.map((c) => c[1]))] : null,
  }));
}

for (const item of sectorAgg.items) {
  const list = projects.filter((p) => p.sector === item.nombre);
  written.push(await emit(`profiles/sector-${item.slug}.json`, {
    tipo: 'sector', slug: item.slug, nombre: item.nombre,
    hallazgo: null,
    kpi: kpiBlock(list),
    serie_anual: annualSeries(list),
    por_region: breakdown(list, 'region'),
    top_titulares: breakdown(list, 'titular').slice(0, 10),
    ultimos_proyectos: profileProjects(list),
  }));
}

for (const item of byTitularTop) {
  const list = projects.filter((p) => p.titular === item.nombre);
  const byEstado = new Map();
  for (const p of list) {
    if (!byEstado.has(p.estado_grupo)) byEstado.set(p.estado_grupo, { estado_grupo: p.estado_grupo, proyectos: 0, inversion_mmu: 0 });
    const e = byEstado.get(p.estado_grupo);
    e.proyectos++;
    e.inversion_mmu += p.inversion_mmu;
  }
  written.push(await emit(`profiles/titular-${item.slug}.json`, {
    tipo: 'titular', slug: item.slug, nombre: item.nombre,
    rank: titularAgg.items.indexOf(item) + 1,
    hallazgo: null,
    kpi: kpiBlock(list),
    serie_anual: annualSeries(list),
    por_estado: [...byEstado.values()].map((e) => ({ ...e, inversion_mmu: e.inversion_mmu })),
    proyectos: list.map(searchRec),
  }));
}
console.log(`  perfiles: ${regionAgg.items.length} regiones · ${sectorAgg.items.length} sectores · ${byTitularTop.length} titulares`);

/* ============================================================ aserciones vs §2 */

console.log('\nAserciones contra hechos semilla (§2):');
assertEq('Filas', projects.length, 30119);
assertNear('Inversión total (US$ MM)', totalMmu, 1046130);
assertEq('Aprobados (n)', aprob.length, 18625);
assertNear('Aprobados (US$ MM)', kpis.aprobados.inversion_mmu, 515798);
assertNear('Tasa de aprobación', kpis.aprobados.tasa_aprobacion, 0.936, 0.005);
assertEq('En calificación (n)', evalu.length, 365);
assertEq('En evaluación incluida admisión (n)', projects.filter(p => p.estado_grupo === 'En evaluación').length, 366);
assertNear('En evaluación (US$ MM)', kpis.evaluacion.inversion_mmu, 88383);
const topSectorMmu = sectorAgg.items[0];
assertEq('Sector líder por inversión', topSectorMmu.nombre, 'Energía');
assertNear('Energía (US$ MM)', topSectorMmu.inversion_mmu, 455637);
const topSectorN = [...sectorAgg.items].sort((a, b) => b.proyectos - a.proyectos)[0];
assertEq('Sector líder por n° proyectos', topSectorN.nombre, 'Saneamiento Ambiental');
assertEq('Saneamiento (n)', topSectorN.proyectos, 5766);
const anto = regionAgg.items.find((r) => r.slug === 'antofagasta');
assertNear('Antofagasta (US$ MM)', anto.inversion_mmu, 276478);
const byYear = new Map();
for (const p of projects) byYear.set(p.anio, (byYear.get(p.anio) || 0) + 1);
assertEq('Año pico 2006 (n)', byYear.get(2006), 1676);
assertEq('Año pico 2008 (n)', byYear.get(2008), 1662);
assertEq('2025 (n)', byYear.get(2025), 475);

console.log(`\nEmitidos ${written.length} archivos en public/data/`);
if (failures > 0) {
  console.error(`\nFALLÓ: ${failures} aserción(es) no cumplida(s). El build aborta.`);
  process.exit(1);
}
console.log('OK — pipeline válido contra hechos semilla.');
