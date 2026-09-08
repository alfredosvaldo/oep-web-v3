import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-content px-6 py-20 lg:px-10 lg:py-28">
        <p className="oep-kicker">Error 404</p>
        <h1 className="oep-page-title mt-4">Página no encontrada</h1>
        <p className="mt-4 max-w-xl text-[16px] leading-7 text-oep-ink/70">
          La dirección no corresponde a ninguna sección del observatorio. Puedes buscar un
          expediente en el explorador o volver a la portada.
        </p>
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-medium">
          <Link
            href="/"
            className="border-b border-oep-ink/25 pb-0.5 transition-colors duration-nav hover:border-oep-ink hover:text-oep-emerald"
          >
            Volver al inicio
          </Link>
          <Link
            href="/explorador/"
            className="border-b border-oep-ink/25 pb-0.5 transition-colors duration-nav hover:border-oep-ink hover:text-oep-emerald"
          >
            Ir al explorador
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
