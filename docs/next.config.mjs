import { createMDX } from 'fumadocs-mdx/next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const withMDX = createMDX();
const isPagesBuild = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const basePath = isPagesBuild && repoName ? `/${repoName}` : '';
const configRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {
    root: configRoot,
  },
  ...(isPagesBuild
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
        basePath,
        assetPrefix: basePath ? `${basePath}/` : undefined,
      }
    : {}),
  ...(!isPagesBuild
    ? {
        async rewrites() {
          return [
            {
              source: '/docs/:path*.mdx',
              destination: '/llms-docs/:path*',
            },
          ];
        },
      }
    : {}),
};

export default withMDX(config);
