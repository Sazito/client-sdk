import { createMDX } from 'fumadocs-mdx/next';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const withMDX = createMDX();

const docsDir = dirname(fileURLToPath(import.meta.url));
const sdkVersion = JSON.parse(
  readFileSync(resolve(docsDir, '../package.json'), 'utf8'),
).version;

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['@sazito/checkout'],
  env: {
    NEXT_PUBLIC_SDK_VERSION: sdkVersion,
  },
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms-docs/:path*',
      },
    ];
  },
};

export default withMDX(config);
