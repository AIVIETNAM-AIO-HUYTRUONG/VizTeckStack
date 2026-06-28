/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@vizteck/core',
    '@vizteck/lesson',
    '@vizteck/graphql-client',
    '@vizteck/ui',
    '@vizteck/graph',
    '@xyflow/react',
    '@blocknote/react',
    '@blocknote/core',
    '@blocknote/mantine',
  ],
};

module.exports = nextConfig;
