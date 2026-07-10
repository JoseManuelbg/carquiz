import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The API routes read cars.json and the /cars photos from disk at request time
  // via fs. Those dynamic paths aren't auto-traced, so include them explicitly
  // in the serverless bundle (needed on Vercel and other Node hosts).
  outputFileTracingIncludes: {
    "/api/round": ["./cars.json", "./cars/**"],
    "/api/guess": ["./cars.json"],
    "/api/suggest": ["./cars.json"],
    "/api/img/[id]": ["./cars.json", "./cars/**"],
  },
};

export default nextConfig;
