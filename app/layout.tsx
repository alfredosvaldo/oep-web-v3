import type { Metadata } from 'next';
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { CORTE } from '@/lib/corte';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plexmono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://oep-chile.com'),
  title: {
    default: 'OEP · Observatorio Económico de Permisos',
    template: '%s · OEP',
  },
  description:
    `${CORTE.expedientes} proyectos y US$ ${CORTE.inversionBn} BN declarados ante el SEIA desde 1993, convertidos en inteligencia económica abierta.`,
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'OEP · Observatorio Económico de Permisos',
    title: 'OEP · Tres décadas de permisos, tiempos, inversión y empleo',
    description:
      `Atlas, rankings y fichas de actores y territorio de los ${CORTE.expedientes} expedientes del SEIA (${CORTE.rango}): regiones, sectores, titulares y tiempos de aprobación.`,
    images: [{ url: 'https://oep-chile.com/og.jpg', width: 1200, height: 630, alt: 'Mapa de partículas: proyectos del SEIA en Chile' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OEP · Observatorio Económico de Permisos',
    description:
      `${CORTE.expedientes} proyectos y US$ ${CORTE.inversionBn} BN declarados ante el SEIA desde 1993, convertidos en inteligencia económica abierta.`,
    images: ['https://oep-chile.com/og.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="bg-oep-paper font-body text-oep-ink antialiased">{children}</body>
    </html>
  );
}
