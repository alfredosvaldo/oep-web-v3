/**
 * Cabecera común de las páginas interiores: kicker, título, metadata mono y
 * bajada. Una sola pieza para que Explorador, Mapa, Rankings, Actores,
 * Informes y Metodología abran igual, sin cards ni decoración.
 */
export default function PageHeader({
  kicker,
  titulo,
  meta,
  children,
}: {
  kicker: string;
  titulo: string;
  /** Línea mono de contexto (períodos, conteos, estado de carga). */
  meta?: React.ReactNode;
  /** Bajada explicativa. */
  children?: React.ReactNode;
}) {
  return (
    <header>
      <p className="oep-kicker">{kicker}</p>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <h1 className="oep-page-title">{titulo}</h1>
        {meta && <p className="font-mono text-[12px] text-oep-ink/55">{meta}</p>}
      </div>
      {children && <p className="mt-4 max-w-2xl text-[16px] leading-7 text-oep-ink/70">{children}</p>}
    </header>
  );
}
