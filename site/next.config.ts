import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /* The repository root, not site/: the family pack section imports the
     pack's own characters from ../family/kit/actors.js. */
  turbopack: { root: path.join(__dirname, '..') },
};

export default nextConfig;
