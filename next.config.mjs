/** @type {import('next').NextConfig} */
// GitHub Pages sirve el sitio bajo /oep-web-v3/: GHPAGES=1 activa el prefijo
// (assets y fetch estáticos vía NEXT_PUBLIC_BASE_PATH, que queda '' en local).
const isGhPages = process.env.GHPAGES === '1';
const basePath = isGhPages ? '/oep-web-v3' : '';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default (phase) => ({ ...nextConfig, distDir: phase === 'phase-development-server' ? '.next-dev' : '.next' });
