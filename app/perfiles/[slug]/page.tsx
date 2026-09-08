import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileView from '@/components/ProfileView';
import type { Profile } from '@/lib/profile';

/** Perfiles estáticos: un HTML real por región, sector y titular (531 archivos). */
export const dynamicParams = false;

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), 'public/data/profiles');
  const files = await readdir(dir);
  return files.filter((f) => f.endsWith('.json')).map((f) => ({ slug: f.replace(/\.json$/, '') }));
}

export default async function ProfilePage({ params }: { params: { slug: string } }) {
  const file = path.join(process.cwd(), 'public/data/profiles', `${params.slug}.json`);
  const p = JSON.parse(await readFile(file, 'utf-8')) as Profile;

  return (
    <>
      <Header />
      <ProfileView p={{ tipo: p.tipo, slug: p.slug, nombre: p.nombre, rank: p.rank }} />
      <Footer />
    </>
  );
}
