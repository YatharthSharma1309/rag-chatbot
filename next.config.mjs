/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  webpack: (config) => {
    // pdf-parse ships a debug-mode that tries to read a test file at import time.
    // Mark it as external so it's only required at runtime on the server.
    config.externals = config.externals || [];
    return config;
  },
};

export default nextConfig;
