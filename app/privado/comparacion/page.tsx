import type { Metadata } from 'next';
import DemoComparisonAccess from '@/components/DemoComparisonAccess';

export const metadata: Metadata = {
  title: 'Acceso a Comparación',
  description: 'Espacio de análisis OEP. Acceso de demostración.',
  robots: { index: false, follow: false },
};

export default function PrivateComparisonPage() {
  return <DemoComparisonAccess />;
}
