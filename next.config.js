const path = require("path");

const isDev = process.env.ENV_MODE === "development";
const isExport = process.env.EXPORT_MODE === "true";

const nextConfig = {
  reactStrictMode: true,
  ...(isExport && { output: "export" }),

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias["@d3"] = "d3";
    }

    return config;
  },
};

module.exports = nextConfig;
