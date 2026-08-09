/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@afterlight/shared-types', '@afterlight/protocol'],
};

module.exports = nextConfig;
