import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "t3.storage.dev",
      },
      {
        protocol: "https",
        hostname: "justdy.t3.storage.dev",
      },
    ],
  },
};

export default nextConfig;

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         hostname: "**.t3.storage.dev",
//         port: "",
//         protocol: "https",
//       },
//     ],
//   },
// };

// export default nextConfig;
