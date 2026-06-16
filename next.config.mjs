/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Cat-driver',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
