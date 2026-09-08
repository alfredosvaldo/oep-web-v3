import { readFileSync } from 'node:fs';
import path from 'node:path';
import { money } from '@/lib/atlas';
const source = (file: string) => JSON.parse(readFileSync(path.join(process.cwd(), 'public/data', file), 'utf8'));
const summary = source('atlas/summary.json');
const kpis = source('kpis.json');
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

const BLOQUES: { titulo: string; cuerpo: React.ReactNode }[] = [
  {
    titulo: 'Fuente y cobertura',
    cuerpo: (
      <>
        La base es el registro público de presentaciones del Sistema de Evaluación de Impacto
        Ambiental (SEIA), administrado por el Servicio de Evaluación Ambiental (SEA):{' '}
        <strong>{money(kpis.totales.proyectos)} expedientes presentados entre {kpis.totales.anio_ini} y {kpis.periodo}</strong>, con una inversión
        declarada de US$ {money(kpis.totales.inversion_mmu)} MM. Cada expediente corresponde a un proyecto con su titular,
        región, sector productivo, tipología de evaluación, estado de tramitación y, cuando aplica,
        fecha y resultado de la calificación ambiental (RCA).
      </>
    ),
  },
  {
    titulo: 'Reglas de limpieza',
    cuerpo: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Regiones:</strong> los nombres históricos se normalizan a las 16 regiones actuales
          (p. ej. «Metropolitana de Santiago» → «Metropolitana»); los expedientes de competencia
          nacional se agrupan en «Interregional / Nacional».
        </li>
        <li>
          <strong>Coordenadas:</strong> se descartan valores corruptos (p. ej. proyecciones en metros
          que exceden grados decimales): {money(summary.coverage.coordinates)} de {money(summary.coverage.total)} expedientes conservan coordenadas válidas.
        </li>
        <li>
          <strong>Titulares:</strong> las variantes de escritura de una misma razón social se unifican
          por clave normalizada ({money(summary.coverage.companies)} titulares canónicos); los nombres en mayúsculas se convierten
          a formato título preservando siglas y formas legales (S.A., SpA, Ltda.).
        </li>
        <li>
          <strong>Estados:</strong> los 11 estados del SEIA se agrupan en 5 categorías analíticas:
          Aprobado · En evaluación (en calificación y admisión) · Rechazado · Desistido-Caducado ·
          No calificado-No admitido.
        </li>
        <li>
          <strong>Días de tramitación:</strong> diferencia entre presentación y calificación, solo
          para expedientes con fecha de calificación. «En calificación» incluye {summary.counts.qualification} expedientes; «En evaluación» incluye {summary.counts.evaluation}, al sumar admisión. Los estados corresponden al corte del 30.06.2026.
        </li>
      </ul>
    ),
  },
  {
    titulo: 'Definiciones y denominadores',
    cuerpo: <ul className="list-disc space-y-2 pl-5">
      <li>Inversión: suma de valores declarados en millones de dólares (US$ MM), antes de redondear para su presentación. La ficha muestra la precisión disponible en la fuente.</li>
      <li>Tasa de calificación: aprobados más rechazados, dividido por todos los expedientes del alcance seleccionado.</li>
      <li>Tasa de aprobación: aprobados dividido por aprobados más rechazados. Sin calificados, la tasa no está disponible.</li>
      <li>Tramitación: mediana de días corridos entre presentación y calificación, entre expedientes con ambas fechas, cualquiera sea su estado. Se muestra el número de observaciones. Las series exigen al menos tres observaciones anuales o cinco trimestrales por tipo DIA/EIA; una muestra menor se indica como no disponible.</li>
      <li>La línea de tiempo filtra el año de presentación. No reconstruye estados en fechas pasadas ni representa información en vivo. El año 2026 abarca solo dos trimestres.</li>
      <li>Mapa nacional: vista continental. Los expedientes sin coordenadas y los puntos fuera de esa vista permanecen en totales, tablas y comparaciones; la diferencia de cobertura se informa junto al mapa.</li>
      <li>Comparación: hasta tres entidades de una misma dimensión. Su selección reemplaza el filtro de esa dimensión y conserva los demás filtros, el estado y el período.</li>
    </ul>,
  },
  {
    titulo: 'Qué sí y qué no mide OEP',
    cuerpo: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Sí:</strong> actividad declarada ante el SEIA — presentaciones, inversión
          declarada, tasas y tiempos de calificación, concentración territorial y sectorial.
        </li>
        <li>
          <strong>No:</strong> inversión efectivamente ejecutada, permisos sectoriales fuera del SEIA
          ni proyectos exentos de evaluación ambiental. La inversión es la declarada por los
          titulares al momento de presentar, no necesariamente la ejecutada.
        </li>
        <li>
          El conteo de expedientes no equivale a conteo de obras: un proyecto puede presentar más de
          un expediente.
        </li>
      </ul>
    ),
  },
  {
    titulo: 'Reproducibilidad',
    cuerpo: (
      <>
        Todo el proceso es abierto: el código del pipeline y las reglas de limpieza están en el
        repositorio, junto con los JSON derivados que alimentan mapas, series y perfiles.
        Con el archivo fuente del SEIA, <code className="font-mono text-[13px]">npm run build:data</code>{' '}
        regenera los 550 archivos de datos en segundos. Geografía de referencia: Natural Earth
        (dominio público).
      </>
    ),
  },
];

export default function DatosMetodologia() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="mx-auto max-w-prose px-6 py-12 lg:px-10 lg:py-16">
          <PageHeader kicker="Transparencia" titulo="Datos y metodología" meta="última actualización 30.06.2026">
            Cada cifra de este observatorio es reproducible a partir de los expedientes públicos del
            SEIA. Estas son las reglas exactas con las que se construyen.
          </PageHeader>

          <div className="mt-10 space-y-10 border-t border-oep-line pt-10">
            {BLOQUES.map((b, i) => (
              <section key={b.titulo}>
                <h2 className="flex items-baseline gap-3 border-b border-oep-line pb-3">
                  <span className="font-mono text-[13px] tabular text-oep-copper-dark">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="oep-headline text-[21px] leading-7">{b.titulo}</span>
                </h2>
                <div className="mt-4 text-[15px] leading-7 text-oep-ink/80">{b.cuerpo}</div>
              </section>
            ))}
          </div>

          <p className="oep-source mt-12 border-t border-oep-line pt-4">
            Fuente: SEA, Sistema de Evaluación de Impacto Ambiental, presentaciones 1993–2026-T2.
            Cálculos OEP. Última actualización: 30.06.2026.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
