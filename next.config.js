/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'books.google.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@resvg/resvg-js', 'sharp'],
  },
};

module.exports = nextConfig;
