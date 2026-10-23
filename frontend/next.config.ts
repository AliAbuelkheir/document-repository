import type { NextConfig } from 'next';

// Rewrites are resolved at build time (and baked into the standalone output),
// so BACKEND_URL must be set when running `next build` as well as at runtime.
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';

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
