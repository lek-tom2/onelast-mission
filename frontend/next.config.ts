import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: 'http://localhost:8000/health',
      },
      {
        source: '/api/neo/neo_data_all',
        destination: 'http://localhost:8000/neo_data_all',
      },
      {
        source: '/api/neo/neo_data_per_object',
        destination: 'http://localhost:8000/neo_data_per_object',
      },
      {
        source: '/api/neo/neo_data_one/:path*',
        destination: 'http://localhost:8000/neo_data_one/:path*',
      },
    ];
  },
};

export default nextConfig;
