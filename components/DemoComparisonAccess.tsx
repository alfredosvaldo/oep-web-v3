'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Logo, LogoLockup } from './Logo';

// Demonstration only: this is a UI gate on a public static site, not authentication.
// These intentionally non-secret example credentials must never protect private data.
const SESSION_KEY = 'oep-comparison-demo';
const SESSION_VALUE = 'example-session-v1';
const ComparisonWorkspace = dynamic(() => import('./ComparisonWorkspace'), {
  ssr: false,
  loading: () => <main className="page-shell"><p role="status" className="data-state">Cargando comparación…</p></main>,
});

export default function DemoComparisonAccess() {
  const [access, setAccess] = useState<'checking' | 'login' | 'open'>('checking');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const username = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const restore = () => {
      try { setAccess(sessionStorage.getItem(SESSION_KEY) === SESSION_VALUE ? 'open' : 'login'); }
      catch { setAccess('login'); }
    };
    restore();
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    if (String(fields.get('username')).trim().toLowerCase() !== 'demo' || fields.get('password') !== 'OEPdemo2026') {
      setError('El usuario o la contraseña no son correctos. Inténtalo nuevamente.');
      username.current?.focus();
      return;
    }
    try { sessionStorage.setItem(SESSION_KEY, SESSION_VALUE); } catch { /* Continue for this page when storage is unavailable. */ }
    setError('');
    setAccess('open');
  }

  function logout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* State still closes the current view. */ }
    setAccess('login');
    setShowPassword(false);
    setError('');
  }

  if (access === 'checking') return <main className="access-loading"><p role="status">Preparando acceso…</p></main>;

  if (access === 'open') return <>
    <header className="private-header">
      <div>
        <Link href="/" aria-label="OEP · Inicio"><LogoLockup /></Link>
        <span className="private-section-label">Comparación <small>Demo</small></span>
        <button className="atlas-button" onClick={logout}>Cerrar sesión</button>
      </div>
    </header>
    <ComparisonWorkspace />
  </>;

  return <main className="access-page">
    <div className="access-shell">
      <section className="access-story" aria-labelledby="access-title">
        <Link className="access-brand" href="/" aria-label="OEP · Inicio"><Logo className="h-9 w-9" /><span>OEP<small>Espacio de análisis</small></span></Link>
        <div className="access-message">
          <p className="access-eyebrow">Comparación</p>
          <h1 id="access-title">Una misma base.<br />Distintas perspectivas.</h1>
          <p>Regiones, sectores y empresas. Compara su inversión y sus tiempos de evaluación con un mismo criterio.</p>
        </div>
        <p className="access-story-footer">Observatorio Económico de Permisos<br /><span>Información para entender la inversión en Chile.</span></p>
      </section>
      <section className="access-form-panel" aria-labelledby="login-title">
        <div className="access-form-wrap">
          <p className="oep-kicker">Acceso de demostración</p>
          <h2 id="login-title">Bienvenido a OEP.</h2>
          <p className="access-intro">Ingresa tus credenciales de prueba para abrir el comparador.</p>
          <form onSubmit={login}>
            <label htmlFor="demo-username">Usuario</label>
            <input ref={username} id="demo-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required aria-invalid={!!error} aria-describedby={error ? 'access-error' : undefined} />
            <label htmlFor="demo-password">Contraseña</label>
            <div className="access-password">
              <input id="demo-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required aria-invalid={!!error} aria-describedby={error ? 'access-error' : undefined} />
              <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>
            </div>
            {error && <p className="access-error" id="access-error" role="alert">{error}</p>}
            <button className="access-submit" type="submit">Entrar al comparador <span aria-hidden="true">→</span></button>
          </form>
          <p className="access-demo-note">Prototipo de acceso. Usa solo las credenciales de demostración.</p>
          <Link className="access-back" href="/">← Volver al sitio público</Link>
        </div>
      </section>
    </div>
  </main>;
}
