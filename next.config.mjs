/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // PostHog richiede entrambi questi flag per il pattern reverse-proxy
  // (altrimenti Next può normalizzare /ingest/ e rompere il match).
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Reverse-proxy PostHog: utenti su reti con filtri DNS (Fortinet, WiFi
  // enterprise, ISP "safe") non possono raggiungere eu.i.posthog.com.
  // Le richieste passano dal nostro dominio e Next le ruota a PostHog.
  // L'ordine conta: Next matcha la prima regola, /static e /decide sono
  // casi speciali rispetto al catch-all.
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://eu.i.posthog.com/decide",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
