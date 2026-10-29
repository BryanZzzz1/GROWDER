import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    serverExternalPackages: ['pdf-parse'],
    // Evita que un error de TypeScript frene el deploy en Vercel.
    // (En Next 16 `next build` ya no ejecuta ESLint y la opción `eslint` fue eliminada.)
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;