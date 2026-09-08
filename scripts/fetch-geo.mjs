#!/usr/bin/env node
/**
 * OEP — Geografía de referencia.
 * Descarga Natural Earth 110m (dominio público), extrae el contorno de Chile y
 * lo guarda en public/data/geo/chile.json para el mapa de puntos (Home M2).
 * Uso: node scripts/fetch-geo.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
const OUT = path.join(ROOT, 'public/data/geo/chile.json');

const res = await fetch(SRC);
if (!res.ok) throw new Error(`Descarga falló: ${res.status} ${res.statusText}`);
const fc = await res.json();

const chile = fc.features.find((f) => f.properties?.ADMIN === 'Chile');
if (!chile) throw new Error('No se encontró la entidad «Chile» en Natural Earth');

// Geometría intacta; propiedades mínimas (el outline solo es base cartográfica)
const out = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { nombre: 'Chile', fuente: 'Natural Earth 110m (dominio público)' }, geometry: chile.geometry },
  ],
};

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(out));
const kb = Math.round((JSON.stringify(out).length / 1024) * 10) / 10;
console.log(`OK — public/data/geo/chile.json (${kb} KB, tipo ${chile.geometry.type})`);
