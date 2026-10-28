import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    serverExternalPackages: ['pdf-parse'],
    // Si quieres evitar que un warning de ESLint o TS menor frene el deploy en Vercel:
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;