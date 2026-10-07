import type { NextConfig } from 'next';

// Пустой корневой `pages/` занимает Pages Router, чтобы FSD-слой `src/pages` не стал маршрутами.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: { position: 'bottom-right' },
};

export default nextConfig;
