const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org" }],
  },
  webpack: (config) => {
    // Belt-and-suspenders for the "@/*" alias: tsconfig's baseUrl+paths
    // should be enough on its own, but Next's production build has a
    // known history of being pickier about this than dev mode — this
    // guarantees the alias resolves regardless.
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

module.exports = nextConfig;