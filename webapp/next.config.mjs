/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "capable-bee-948.convex.cloud",
        protocol: "https",
      },
      {
        hostname: "dusty-anaconda-555.convex.cloud",
        protocol: "https",
      }
    ],
  },
};

export default nextConfig;
