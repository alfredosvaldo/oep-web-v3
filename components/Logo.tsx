/**
 * Marca OEP: caja abierta a un solo trazo (geometría exacta del kit de marca,
 * variante 2B "White outline"). Monocroma, hereda currentColor.
 * A ≤24px se usa un grosor ligeramente mayor (compensación de peso).
 */
export function Logo({ className = 'h-6 w-6', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={compact ? 5.5 : 4.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12,54 L60,30 L108,54 L108,96 L60,120 L12,96 Z" />
      <path d="M12,54 L60,78 L108,54" />
      <path d="M60,78 L60,120" />
      <path d="M60,30 L108,54 L84,26 L36,2 Z" />
    </svg>
  );
}

/** Lockup completo: caja · regla vertical · wordmark, como en el kit de marca. */
export function LogoLockup({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Logo className="h-7 w-7" compact />
      <span className="hidden h-5 w-px bg-oep-ink/25 sm:block" aria-hidden="true" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[17px] font-bold tracking-tight">OEP</span>
        <span className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-oep-ink/55 sm:block">
          Observatorio Económico de Permisos
        </span>
      </span>
    </span>
  );
}

export default Logo;
