import type { NextConfig } from 'next';

// Bundle analyzer for development
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache for static images
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Add patterns for external images if needed in the future
    ],
  },
  // Enable compression for better performance
  compress: true,
  
  // Cloudflare Pages optimization
  poweredByHeader: false,
  generateEtags: false,
  
  // Output configuration for Cloudflare Pages
  output: 'standalone',
  
  // Disable cache for Cloudflare deployment to avoid large files
  ...(process.env.CF_PAGES && {
    distDir: '.next',
    generateBuildId: () => 'build',
  }),
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    // Enable tree shaking for better bundle optimization
    optimizeCss: true,
  },
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Cloudflare Pages specific optimizations
    if (process.env.CF_PAGES) {
      // Disable webpack cache for Cloudflare deployment
      config.cache = false;
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      // Enable tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244000, // Keep chunks under 244KB for better performance
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 244000,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            maxSize: 244000,
          },
        },
      };
    }
    
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
