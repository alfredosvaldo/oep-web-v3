import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Noticias',
  description:
    'Apariciones del Observatorio Económico de Permisos en prensa y en la conversación pública sobre inversión, permisos y empleo.',
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const pdfUrl = `${basePath}/noticias/el-mercurio-record-inversion-seia-2026-09-26.pdf`;
const previewUrl = `${basePath}/noticias/el-mercurio-record-inversion-seia-2026-09-26.jpg`;

export default function Noticias() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="mx-auto max-w-content px-6 py-12 lg:px-10 lg:py-16">
          <PageHeader kicker="Noticias" titulo="OEP en la conversación pública" meta="prensa y apariciones">
            Selección de entrevistas, menciones y análisis del observatorio publicados en medios.
          </PageHeader>

          <article className="mt-10 border-y border-oep-line py-8 lg:py-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] lg:gap-12">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir la página de El Mercurio en PDF"
                className="group block overflow-hidden border border-oep-line bg-white"
              >
                <img
                  src={previewUrl}
                  alt="Página de Economía y Negocios de El Mercurio con una entrevista a Jorge Valverde"
                  width="1100"
                  height="2066"
                  className="h-auto w-full transition-opacity duration-nav group-hover:opacity-90"
                />
              </a>

              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[12px] uppercase tracking-[0.12em] text-oep-ink/55">
                  <span className="text-oep-copper-dark">En prensa</span>
                  <span>El Mercurio · Economía y Negocios</span>
                  <time dateTime="2026-09-26">26.09.2026</time>
                </div>

                <h2 className="oep-headline mt-5 max-w-3xl text-[clamp(28px,3.2vw,48px)] leading-[1.06]">
                  Los proyectos que esperan visto bueno ambiental para llegar a un récord de casi US$ 50 mil
                  millones en inversiones aprobadas este año
                </h2>

                <p className="mt-6 max-w-2xl text-[16px] leading-7 text-oep-ink/70">
                  El Mercurio consultó a Jorge Valverde, economista, fundador y director ejecutivo del OEP,
                  sobre cuándo la inversión ambientalmente aprobada durante 2026 podría traducirse en demanda
                  laboral. La nota revisa el récord de US$ 43.049 millones aprobados hasta el 25 de septiembre y
                  las iniciativas que aún podrían completar su evaluación durante el año.
                </p>

                <blockquote className="mt-7 max-w-2xl border-l-2 border-oep-emerald pl-5">
                  <p className="font-display text-[22px] font-semibold leading-8 tracking-tight text-oep-ink">
                    “¿Cuándo se notará la demanda laboral de la inversión aprobada este año? En el mejor de los
                    casos, a fines de 2027, con mayor seguridad a principios de 2028”.
                  </p>
                  <footer className="mt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-oep-ink/55">
                    Jorge Valverde · fundador del OEP
                  </footer>
                </blockquote>

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-md bg-oep-ink px-5 text-[14px] font-semibold text-white transition-colors duration-nav hover:bg-oep-emerald"
                  >
                    Leer artículo en PDF
                  </a>
                  <a
                    href={pdfUrl}
                    download
                    className="text-[14px] font-semibold text-oep-ink underline decoration-oep-line underline-offset-4 hover:text-oep-emerald"
                  >
                    Descargar · 1 página
                  </a>
                </div>

                <p className="oep-source mt-6">
                  Fuente: El Mercurio, Economía y Negocios, sábado 26 de septiembre de 2026.
                </p>
              </div>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
