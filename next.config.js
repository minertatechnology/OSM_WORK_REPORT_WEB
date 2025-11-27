const path = require("path");

const isDev = process.env.ENV_MODE === "development";
const isExport = process.env.EXPORT_MODE === "true";

const nextConfig = {
  reactStrictMode: true,
  ...(isExport && { output: "export" }),

  // ✅ Image Optimization สำหรับ Performance
  images: {
    unoptimized: isExport, // ปิดเฉพาะตอน export static
    formats: ['image/avif', 'image/webp'], // ใช้ format ใหม่ที่เล็กกว่า
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Responsive sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Thumbnail sizes
    minimumCacheTTL: 60 * 60 * 24 * 365, // Cache 1 ปี
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      "@d3": "d3",
    },
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias["@d3"] = "d3";
    }

    return config;
  },

  // ✅ HTTP Caching Headers สำหรับ Performance
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
