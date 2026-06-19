/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@vizteck/ui',
    '@vizteck/graph',
    '@xyflow/react',
    '@blocknote/react',
    '@blocknote/core',
    '@blocknote/mantine',
  ],
};

module.exports = nextConfig;
