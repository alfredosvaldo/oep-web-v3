import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import InformeView from '@/components/InformeView';
import { REPORTS, bySlug } from '@/lib/informes';

export const dynamicParams = false;

export function generateStaticParams() {
  return REPORTS.map((r) => ({ slug: r.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const r = bySlug(params.slug);
  return r ? { title: `Informe ${r.periodo}`, description: r.descripcion } : {};
}

export default function Informe({ params }: { params: { slug: string } }) {
  const r = bySlug(params.slug);
  if (!r) notFound();
  return <InformeView informe={r} />;
}
