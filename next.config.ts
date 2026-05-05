import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack(config) {
    // pdfjs-dist references canvas and encoding in Node.js environments;
    // aliasing to false prevents build errors since we only run it in the browser.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };
    return config;
  },
};

export default nextConfig;
