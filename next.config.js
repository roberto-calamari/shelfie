/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'books.google.com' },
    ],
  },
  serverExternalPackages: ['@resvg/resvg-js', 'sharp'],
};

module.exports = nextConfig;
