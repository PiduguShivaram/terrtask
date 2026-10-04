/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gibs.earthdata.nasa.gov',
      },
      {
        protocol: 'https',
        hostname: 'eoimages.gsfc.nasa.gov',
      },
    ],
  },
};

export default nextConfig;
