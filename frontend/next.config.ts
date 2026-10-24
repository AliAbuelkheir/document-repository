import type { NextConfig } from 'next';
import { z } from 'zod';

// Next.js resolves rewrites at build time and keeps them in the standalone output.
// Set BACKEND_URL for `next build` and also at runtime.
const backendUrl = z.url().default('http://backend:4000').parse(process.env.BACKEND_URL);

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  rewrites() {
    return Promise.resolve([
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]);
  },
};

export default nextConfig;
