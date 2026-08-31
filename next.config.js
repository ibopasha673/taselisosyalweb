/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wzxxnirquttiivoqjlno.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'menum.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;