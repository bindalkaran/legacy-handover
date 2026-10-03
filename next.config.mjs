/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@electric-sql/pglite'],
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  poweredByHeader: false,
  turbopack: { root: import.meta.dirname },
  outputFileTracingIncludes: { '/**': ['./db/schema.sql'] },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ]
    }];
  }
};
export default nextConfig;
