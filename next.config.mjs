/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1';

const nextConfig = {
  output: isVercel ? undefined : 'export',
  basePath: isVercel ? '' : '/Cat-driver',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' }
    ]
  },
};

export default nextConfig;
