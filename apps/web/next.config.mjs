/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Le typage et le lint bloquent le build : une régression ne doit jamais
  // pouvoir atteindre la production sans être vue.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: false,
  },
  images: {
    // Liste blanche stricte : un joker sur le hostname transforme
    // l'optimiseur d'images en proxy ouvert exploitable par n'importe qui.
    remotePatterns: [
      { protocol: 'https', hostname: 'les-extras.fr' },
      { protocol: 'https', hostname: 'www.les-extras.fr' },
      { protocol: 'https', hostname: 'app.les-extras.fr' },
      { protocol: 'https', hostname: 'api.les-extras.fr' },
      { protocol: 'https', hostname: 'adepa77.fr' },
      { protocol: 'https', hostname: 'www.adepa77.fr' },
      { protocol: 'https', hostname: 'toulali.fr' },
      { protocol: 'https', hostname: 's3.adepa77.fr' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return [];
  },
  // Les URL /actualites ont été indexées avant le passage à « Édublog » :
  // on les redirige définitivement pour ne perdre ni le référencement ni les
  // liens déjà partagés.
  async redirects() {
    return [
      { source: '/actualites', destination: '/edublog', permanent: true },
      { source: '/actualites/:slug', destination: '/edublog/:slug', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.les-extras.fr; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
