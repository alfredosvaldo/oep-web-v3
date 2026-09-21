import { existsSync, readFileSync } from 'node:fs';

// A custom Pages domain serves at the root; repository hosting uses its prefix.
const cnameFile = new URL('./public/CNAME', import.meta.url);
const customDomain = existsSync(cnameFile) ? readFileSync(cnameFile, 'utf8').trim() : '';
const isGhPages = process.env.GHPAGES === '1';
const basePath = isGhPages && !customDomain ? '/oep-web-v3' : '';

/** @type {import('next').NextConfig} */

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
